export type Role = "SUPER_ADMIN" | "ICT_PERSONNEL" | "ACADEMIC_STAFF";
export type VerificationStatus = "VERIFIED" | "LIKELY_MATCH" | "MANUAL_REVIEW" | "REJECTED";
export type PublicationSource = "openalex";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  department: string;
  faculty: string;
  institution?: string;
  profilePhoto?: string;
  orcidId?: string;
  googleScholarUrl?: string;
  scopusId?: string;
  researchGateUrl?: string;
  personalWebsite?: string;
  researchArea?: string;
  researchInterests?: string[];
  firstLogin?: boolean;
  promotionStatus?: string;
  passwordHash: string;
  suspended?: boolean;
  createdAt: string;
};

export type Publication = {
  id: string;
  userId: string;
  title: string;
  authors: string[];
  journal: string;
  publicationYear: number;
  doi?: string;
  category?: string;
  researchArea?: string;
  citations: number;
  hContribution: number;
  quartile: "Q1" | "Q2" | "Q3" | "Q4";
  impactFactor: number;
  impactScore?: number;
  source: PublicationSource;
  verificationStatus: VerificationStatus;
  verificationScore: number;
  verifiedBy?: string;
};

export type ResearchScore = {
  id: string;
  userId: string;
  publicationScore: number;
  citationScore: number;
  hIndexScore: number;
  journalQualityScore: number;
  researchImpactScore: number;
  citationCount: number;
  publicationCount: number;
  hIndex: number;
  journalQualityRaw: number;
  totalSRS: number;
  ranking: number;
  rankLabel: string;
};

export type StaffRanking = {
  id: string;
  userId: string;
  rank: number;
  total: number;
  srs: number;
  citationCount: number;
  hIndex: number;
  publicationCount: number;
  trendScore: number;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
};

export type SystemSettings = {
  id: string;
  scoreWeights: {
    publications: number;
    citations: number;
    hIndex: number;
    journalQuality: number;
  };
  apiSettings: {
    openAlexMailto?: string;
    fallbackPrototypeData: boolean;
  };
  institutionName: string;
};
