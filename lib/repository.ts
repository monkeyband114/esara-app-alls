import "server-only";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { key, redis, requireRedis } from "@/lib/redis";
import {
  publications as samplePublications,
  rankings as sampleRankings,
  scores as sampleScores,
  settings as sampleSettings,
  users as sampleUsers
} from "@/lib/sample-data";
import type { AuditLog, Publication, ResearchScore, Role, StaffRanking, SystemSettings, User } from "@/lib/types";

const INDEXES = {
  users: "idx:users",
  publications: "idx:publications",
  scores: "idx:scores",
  rankings: "idx:rankings",
  audits: "idx:audits"
};

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

const defaultPasswords: Record<string, string> = {
  "admin@esara.edu": "Admin123@",
  "ict@esara.edu": "ICT123@",
  "arnold.ojugo@esara.edu": "Staff123@",
  "maureen.akazwe@esara.edu": "Staff123@",
  "patrick.ejeh@esara.edu": "Staff123@"
};

let initializationPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (!redis) return;
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const existing = await redis.scard(INDEXES.users);
      if (existing > 0) return;
      await saveSettings(sampleSettings);
      for (const user of sampleUsers) {
        await upsertUser({ ...user, password: defaultPasswords[user.email] ?? "Staff123@" });
      }
      await savePublications(samplePublications);
      await saveScores(sampleScores);
      await saveRankings(sampleRankings);
      await logAudit("Initialized ESARA demo mode with default users, publications, scores, and rankings", "system");
    })().catch((error) => {
      // Do not cache a failure (e.g. a Redis blip): the next request should try again.
      initializationPromise = null;
      throw error;
    });
  }
  await initializationPromise;
}

async function readAll<T>(index: string, prefix: string) {
  const client = requireRedis();
  const ids = await client.smembers<string[]>(index);
  if (!ids.length) return [] as T[];
  const rows = await client.mget<(T | null)[]>(...ids.map((id) => key(prefix, id)));
  return rows.filter((row): row is T => Boolean(row));
}

/** Replaces every record behind an index, removing ones that are no longer present (e.g. deleted users). */
async function replaceAll<T extends { id: string }>(index: string, prefix: string, rows: T[]) {
  const client = requireRedis();
  const existing = await client.smembers<string[]>(index);
  const next = new Set(rows.map((row) => row.id));
  const pipeline = client.pipeline();
  for (const row of rows) {
    pipeline.set(key(prefix, row.id), row);
    pipeline.sadd(index, row.id);
  }
  for (const id of existing.filter((item) => !next.has(item))) {
    pipeline.del(key(prefix, id));
    pipeline.srem(index, id);
  }
  if (rows.length || existing.length) await pipeline.exec();
}

// Cached per server render so a page and its auth check share one read.
export const listUsers = cache(async (): Promise<User[]> => {
  if (!redis || isProductionBuild) return sampleUsers;
  await ensureInitialized();
  const users = await readAll<User>(INDEXES.users, "user");
  return users.length ? users : sampleUsers;
});

export async function getUserByEmail(email: string) {
  const users = await listUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getUser(id: string) {
  const users = await listUsers();
  return users.find((user) => user.id === id) ?? null;
}

export async function upsertUser(input: Omit<User, "passwordHash" | "createdAt"> & { password?: string; passwordHash?: string; createdAt?: string }) {
  const client = requireRedis();
  const { password, ...rest } = input;
  const passwordHash = password ? await bcrypt.hash(password, 12) : input.passwordHash ?? "";
  const user: User = { ...rest, passwordHash, createdAt: input.createdAt ?? new Date().toISOString() };
  await client.set(key("user", user.id), user);
  await client.sadd(INDEXES.users, user.id);
  return user;
}

export async function updateUser(id: string, patch: Partial<Pick<User, "role" | "suspended" | "fullName" | "department">> & { password?: string }) {
  const client = requireRedis();
  const existing = await client.get<User>(key("user", id));
  if (!existing) return null;
  const { password, ...fields } = patch;
  const user: User = { ...existing, ...fields, ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}) };
  await client.set(key("user", id), user);
  return user;
}

export async function deleteUser(id: string) {
  const client = requireRedis();
  const publications = await listPublications(id);
  const pipeline = client.pipeline();
  pipeline.del(key("user", id));
  pipeline.srem(INDEXES.users, id);
  for (const publication of publications) {
    pipeline.del(key("publication", publication.id));
    pipeline.srem(INDEXES.publications, publication.id);
  }
  await pipeline.exec();
  return publications.length;
}

export async function registerAcademicStaff(input: {
  fullName: string;
  email: string;
  password: string;
  faculty: string;
  department: string;
  institution: string;
  orcidId?: string;
  googleScholarUrl?: string;
  researchArea: string;
  profilePhoto?: string;
  role?: Role;
}) {
  if (await getUserByEmail(input.email)) {
    throw new Error("An account with this email already exists.");
  }
  const role = input.role ?? "ACADEMIC_STAFF";
  const initials = input.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const prefix = role === "ACADEMIC_STAFF" ? "staff" : role === "ICT_PERSONNEL" ? "ict" : "admin";
  return upsertUser({
    id: `${prefix}-${crypto.randomUUID()}`,
    fullName: input.fullName,
    email: input.email.trim().toLowerCase(),
    role,
    faculty: input.faculty,
    department: input.department,
    institution: input.institution,
    orcidId: input.orcidId,
    googleScholarUrl: input.googleScholarUrl,
    researchArea: input.researchArea,
    profilePhoto: input.profilePhoto || initials,
    firstLogin: true,
    promotionStatus: role === "ACADEMIC_STAFF" ? "Discovery in progress" : undefined,
    password: input.password
  });
}

export async function listPublications(userId?: string): Promise<Publication[]> {
  if (!redis || isProductionBuild) return userId ? samplePublications.filter((publication) => publication.userId === userId) : samplePublications;
  await ensureInitialized();
  const publications = await readAll<Publication>(INDEXES.publications, "publication");
  return userId ? publications.filter((publication) => publication.userId === userId) : publications;
}

export async function getPublication(id: string) {
  return requireRedis().get<Publication>(key("publication", id));
}

/** Older records used one id per OpenAlex work ("openalex-W1"), shared by all co-authors. */
function legacyIdFor(publication: Publication) {
  const match = publication.id.match(/^(.+):(openalex-W\d+)$/i);
  return match && match[1] === publication.userId ? match[2] : null;
}

/**
 * Saves imported publications in one batch. Re-importing keeps any ICT verification decision, and replaces this
 * staff member's legacy shared record for the same work so it is not counted twice.
 */
export async function savePublications(publications: Publication[]) {
  if (!publications.length) return [];
  const client = requireRedis();
  const legacyIds = publications.map(legacyIdFor);
  const lookups = [...publications.map((publication) => publication.id), ...legacyIds.map((id) => id ?? "__none__")];
  const existing = await client.mget<(Publication | null)[]>(...lookups.map((id) => key("publication", id)));

  const pipeline = client.pipeline();
  const saved = publications.map((publication, index) => {
    const legacy = existing[publications.length + index];
    const ownLegacy = legacy && legacy.userId === publication.userId ? legacy : null;
    const previous = existing[index] ?? ownLegacy;
    const record: Publication = previous?.verifiedBy
      ? { ...publication, verificationStatus: previous.verificationStatus, verificationScore: previous.verificationScore, verifiedBy: previous.verifiedBy }
      : publication;
    pipeline.set(key("publication", record.id), record);
    pipeline.sadd(INDEXES.publications, record.id);
    if (ownLegacy && legacyIds[index]) {
      pipeline.del(key("publication", legacyIds[index]!));
      pipeline.srem(INDEXES.publications, legacyIds[index]!);
    }
    return record;
  });
  await pipeline.exec();
  return saved;
}

export async function upsertPublication(publication: Publication) {
  const [saved] = await savePublications([publication]);
  return saved;
}

export async function updatePublication(id: string, patch: Partial<Pick<Publication, "verificationStatus" | "verifiedBy">>) {
  const client = requireRedis();
  const existing = await client.get<Publication>(key("publication", id));
  if (!existing) return null;
  const publication = { ...existing, ...patch };
  await client.set(key("publication", id), publication);
  return publication;
}

export async function listScores(): Promise<ResearchScore[]> {
  if (!redis || isProductionBuild) return sampleScores;
  await ensureInitialized();
  return (await readAll<ResearchScore>(INDEXES.scores, "score")).sort((a, b) => a.ranking - b.ranking);
}

export async function saveScores(scores: ResearchScore[]) {
  await replaceAll(INDEXES.scores, "score", scores);
}

export async function listRankings(): Promise<StaffRanking[]> {
  if (!redis || isProductionBuild) return sampleRankings;
  await ensureInitialized();
  return (await readAll<StaffRanking>(INDEXES.rankings, "ranking")).sort((a, b) => a.rank - b.rank);
}

export async function saveRankings(rankings: StaffRanking[]) {
  await replaceAll(INDEXES.rankings, "ranking", rankings);
}

export async function getSettings(): Promise<SystemSettings> {
  if (!redis || isProductionBuild) return sampleSettings;
  await ensureInitialized();
  return (await redis.get<SystemSettings>(key("settings", "default"))) ?? sampleSettings;
}

export async function saveSettings(settings: SystemSettings) {
  await requireRedis().set(key("settings", settings.id), settings);
}

export async function logAudit(action: string, performedBy: string) {
  if (!redis) return;
  const log: AuditLog = { id: crypto.randomUUID(), action, performedBy, timestamp: new Date().toISOString() };
  await redis.set(key("audit", log.id), log);
  await redis.sadd(INDEXES.audits, log.id);
}

export async function listAuditLogs() {
  if (!redis || isProductionBuild) return [] as AuditLog[];
  await ensureInitialized();
  return (await readAll<AuditLog>(INDEXES.audits, "audit")).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function roleLabel(role: Role) {
  return role.replace("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
