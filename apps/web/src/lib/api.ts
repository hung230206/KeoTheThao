export const sports = [
  { id: "football", name: "Bóng đá", short: "Bóng đá", color: "green" },
  { id: "badminton", name: "Cầu lông", short: "Cầu lông", color: "purple" },
  { id: "basketball", name: "Bóng rổ", short: "Bóng rổ", color: "orange" },
  {
    id: "volleyball",
    name: "Bóng chuyền",
    short: "Bóng chuyền",
    color: "blue",
  },
  { id: "tennis", name: "Tennis", short: "Tennis", color: "yellow" },
  { id: "pickleball", name: "Pickleball", short: "Pickleball", color: "pink" },
] as const;
export const levels = {
  all: "Mọi trình độ",
  beginner: "Mới bắt đầu",
  intermediate: "Trung bình",
  advanced: "Nâng cao",
};
export const cities = [
  "TP. Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Cần Thơ",
  "Hải Phòng",
  "Bình Dương",
];
export type SportId = (typeof sports)[number]["id"];
export type Level = keyof typeof levels;
export type User = {
  id: string;
  name: string;
  city: string;
  sports: string[];
  email?: string;
  bio?: string;
};
export type Position = {
  id: string;
  name: string;
  quantity: number;
  filled: number;
};
export type Match = {
  id: string;
  hostId: string;
  host: User;
  title: string;
  sport: SportId;
  level: Level;
  city: string;
  district: string;
  venue: string;
  address: string;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  fee: number;
  description: string;
  status: "open" | "cancelled" | "completed";
  playerCount: number;
  spotsLeft: number;
  positions: Position[];
  participants: User[];
  pendingCount?: number;
};
export type RequestStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type JoinRequest = {
  id: string;
  status: RequestStatus;
  message: string;
  positionId: string | null;
  position: string | null;
  match: Match;
};
export type HostRequest = {
  id: string;
  status: RequestStatus;
  message: string;
  user: User;
  position: { id: string; name: string } | null;
};
export type Mine = { hosted: Match[]; requests: JoinRequest[] };
export const requestLabels: Record<RequestStatus, string> = {
  pending: "Chờ duyệt",
  accepted: "Đã có suất",
  rejected: "Chưa được duyệt",
  cancelled: "Đã hủy yêu cầu",
};

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-KT-Client": "web",
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      Array.isArray(data?.message)
        ? data.message.join(" · ")
        : (data?.message ?? "Không kết nối được máy chủ. Vui lòng thử lại."),
    );
  return data as T;
}
export const money = (fee: number) =>
  fee === 0 ? "Miễn phí" : new Intl.NumberFormat("vi-VN").format(fee) + "đ";
export const sportInfo = (id: SportId) =>
  sports.find((s) => s.id === id) ?? sports[0];
export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(date));
export const timeLabel = (date: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(date));
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
