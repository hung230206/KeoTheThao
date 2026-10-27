export const SPORTS = [
  "football",
  "badminton",
  "basketball",
  "volleyball",
  "tennis",
  "pickleball",
] as const;
export const LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;
export type Sport = (typeof SPORTS)[number];
export type Level = (typeof LEVELS)[number];
export type RequestStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type MatchStatus = "open" | "cancelled" | "completed";
