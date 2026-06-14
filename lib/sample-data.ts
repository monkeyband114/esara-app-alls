import type { Publication, ResearchScore, StaffRanking, SystemSettings, User } from "@/lib/types";
import { calculateScores, calculateStaffRankings } from "@/lib/scoring";

const now = new Date();
const institutionName = "ESARA Research Institute";

export const settings: SystemSettings = {
  id: "default",
  institutionName,
  scoreWeights: { publications: 0.25, citations: 0.35, hIndex: 0.25, journalQuality: 0.15 },
  apiSettings: { fallbackPrototypeData: false }
};

export const users: User[] = [
  {
    id: "admin-default",
    fullName: "System Administrator",
    email: "admin@esara.edu",
    role: "SUPER_ADMIN",
    department: "Information Technology",
    faculty: "Faculty of Computing",
    institution: institutionName,
    profilePhoto: "SA",
    passwordHash: "",
    createdAt: now.toISOString()
  },
  {
    id: "ict-default",
    fullName: "ICT Officer",
    email: "ict@esara.edu",
    role: "ICT_PERSONNEL",
    department: "Information Technology",
    faculty: "Faculty of Computing",
    institution: institutionName,
    profilePhoto: "IO",
    passwordHash: "",
    createdAt: now.toISOString()
  },
  {
    id: "staff-ojugo-arnold",
    fullName: "Ojugo Arnold",
    email: "arnold.ojugo@esara.edu",
    role: "ACADEMIC_STAFF",
    department: "Computer Science",
    faculty: "Faculty of Computing",
    institution: institutionName,
    profilePhoto: "OA",
    passwordHash: "",
    createdAt: now.toISOString()
  },
  {
    id: "staff-akazwe-maureen",
    fullName: "Dr Akazwe Maureen",
    email: "maureen.akazwe@esara.edu",
    role: "ACADEMIC_STAFF",
    department: "Cybersecurity",
    faculty: "Faculty of Computing",
    institution: institutionName,
    profilePhoto: "AM",
    passwordHash: "",
    createdAt: now.toISOString()
  },
  {
    id: "staff-patrick-ejeh",
    fullName: "Dr Patrick Ejeh",
    email: "patrick.ejeh@esara.edu",
    role: "ACADEMIC_STAFF",
    department: "Information Technology",
    faculty: "Faculty of Computing",
    institution: institutionName,
    profilePhoto: "PE",
    passwordHash: "",
    createdAt: now.toISOString()
  }
];

export const publications: Publication[] = [];
export const scores: ResearchScore[] = calculateScores(users, publications, settings);
export const rankings: StaffRanking[] = calculateStaffRankings(users, publications, scores);
