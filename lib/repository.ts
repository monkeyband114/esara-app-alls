import "server-only";
import bcrypt from "bcryptjs";
import { key, redis } from "@/lib/redis";
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
      for (const publication of samplePublications) {
        await upsertPublication(publication);
      }
      await saveScores(sampleScores);
      await saveRankings(sampleRankings);
      await logAudit("Initialized ESARA demo mode with default users, publications, scores, and rankings", "system");
    })();
  }
  await initializationPromise;
}

export async function listUsers(): Promise<User[]> {
  if (!redis || isProductionBuild) return sampleUsers;
  await ensureInitialized();
  const ids = await redis.smembers<string[]>(INDEXES.users);
  if (!ids.length) return sampleUsers;
  const rows = await redis.mget<User[]>(...ids.map((id) => key("user", id)));
  return rows.filter(Boolean);
}

export async function getUserByEmail(email: string) {
  const users = await listUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getUser(id: string) {
  const users = await listUsers();
  return users.find((user) => user.id === id) ?? null;
}

export async function upsertUser(input: Omit<User, "passwordHash" | "createdAt"> & { password?: string; passwordHash?: string }) {
  if (!redis) throw new Error("Redis is required for writes.");
  const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : input.passwordHash ?? "";
  const user: User = { ...input, passwordHash, createdAt: new Date().toISOString() };
  await redis.set(key("user", user.id), user);
  await redis.sadd(INDEXES.users, user.id);
  return user;
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
}) {
  if (await getUserByEmail(input.email)) {
    throw new Error("An account with this email already exists.");
  }
  const initials = input.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return upsertUser({
    id: `staff-${crypto.randomUUID()}`,
    fullName: input.fullName,
    email: input.email,
    role: "ACADEMIC_STAFF",
    faculty: input.faculty,
    department: input.department,
    institution: input.institution,
    orcidId: input.orcidId,
    googleScholarUrl: input.googleScholarUrl,
    researchArea: input.researchArea,
    profilePhoto: input.profilePhoto || initials,
    firstLogin: true,
    promotionStatus: "Discovery in progress",
    password: input.password
  });
}

export async function listPublications(userId?: string): Promise<Publication[]> {
  if (!redis || isProductionBuild) return userId ? samplePublications.filter((publication) => publication.userId === userId) : samplePublications;
  await ensureInitialized();
  const ids = await redis.smembers<string[]>(INDEXES.publications);
  if (!ids.length) return userId ? samplePublications.filter((publication) => publication.userId === userId) : samplePublications;
  const rows = await redis.mget<Publication[]>(...ids.map((id) => key("publication", id)));
  const publications = rows.filter(Boolean);
  return userId ? publications.filter((publication) => publication.userId === userId) : publications;
}

export async function upsertPublication(publication: Publication) {
  if (!redis) throw new Error("Redis is required for writes.");
  await redis.set(key("publication", publication.id), publication);
  await redis.sadd(INDEXES.publications, publication.id);
  return publication;
}

export async function listScores(): Promise<ResearchScore[]> {
  if (!redis || isProductionBuild) return sampleScores;
  await ensureInitialized();
  const ids = await redis.smembers<string[]>(INDEXES.scores);
  if (!ids.length) return sampleScores;
  const rows = await redis.mget<ResearchScore[]>(...ids.map((id) => key("score", id)));
  return rows.filter(Boolean).sort((a, b) => a.ranking - b.ranking);
}

export async function saveScores(scores: ResearchScore[]) {
  if (!redis) throw new Error("Redis is required for writes.");
  const pipeline = redis.pipeline();
  for (const score of scores) {
    pipeline.set(key("score", score.id), score);
    pipeline.sadd(INDEXES.scores, score.id);
  }
  await pipeline.exec();
}

export async function listRankings(): Promise<StaffRanking[]> {
  if (!redis || isProductionBuild) return sampleRankings;
  await ensureInitialized();
  const ids = await redis.smembers<string[]>(INDEXES.rankings);
  if (!ids.length) return sampleRankings;
  const rows = await redis.mget<StaffRanking[]>(...ids.map((id) => key("ranking", id)));
  return rows.filter(Boolean).sort((a, b) => a.rank - b.rank);
}

export async function saveRankings(rankings: StaffRanking[]) {
  if (!redis) throw new Error("Redis is required for writes.");
  const pipeline = redis.pipeline();
  for (const ranking of rankings) {
    pipeline.set(key("ranking", ranking.id), ranking);
    pipeline.sadd(INDEXES.rankings, ranking.id);
  }
  await pipeline.exec();
}

export async function getSettings(): Promise<SystemSettings> {
  if (!redis || isProductionBuild) return sampleSettings;
  await ensureInitialized();
  return (await redis.get<SystemSettings>(key("settings", "default"))) ?? sampleSettings;
}

export async function saveSettings(settings: SystemSettings) {
  if (!redis) throw new Error("Redis is required for writes.");
  await redis.set(key("settings", settings.id), settings);
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
  const ids = await redis.smembers<string[]>(INDEXES.audits);
  if (!ids.length) return [];
  const rows = await redis.mget<AuditLog[]>(...ids.map((id) => key("audit", id)));
  return rows.filter(Boolean).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function roleLabel(role: Role) {
  return role.replace("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
