import type { CSSProperties } from "react";
export type IconName =
  | "search"
  | "grid"
  | "calendar"
  | "user"
  | "plus"
  | "arrow"
  | "pin"
  | "clock"
  | "users"
  | "close"
  | "logout"
  | "check"
  | "filter"
  | "chevron"
  | "bolt"
  | "menu"
  | "edit"
  | "external";
const paths: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  pin: (
    <>
      <path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  logout: (
    <>
      <path d="M10 4H4v16h6M10 12h11m-4-4 4 4-4 4" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  filter: (
    <>
      <path d="M3 6h18M6 12h12M9 18h6" />
      <circle cx="8" cy="6" r="2" />
      <circle cx="16" cy="12" r="2" />
    </>
  ),
  chevron: <path d="m8 5 7 7-7 7" />,
  bolt: <path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  edit: (
    <>
      <path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5ZM13 20h7" />
    </>
  ),
  external: (
    <>
      <path d="M14 3h7v7m0-7L10 14M10 3H4v17h17v-7" />
    </>
  ),
};
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}
export function SportIcon({
  sport,
  size = 26,
}: {
  sport: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {sport === "football" ? (
        <>
          <circle cx="16" cy="16" r="12" />
          <path d="m16 10 6 4-2 7h-8l-2-7 6-4ZM16 4v6M5 12l5 2M8 25l4-4M24 25l-4-4M27 12l-5 2" />
        </>
      ) : sport === "basketball" || sport === "volleyball" ? (
        <>
          <circle cx="16" cy="16" r="12" />
          <path
            d={
              sport === "basketball"
                ? "M4 16h24M16 4v24M7 8c11 6 11 10 18 16M25 8C14 14 14 18 7 24"
                : "M16 4c0 10 5 13 10 18M5 11c9-1 15 0 22 8M10 27c0-8 4-12 13-18"
            }
          />
        </>
      ) : (
        <>
          <ellipse
            cx="19"
            cy="12"
            rx="8"
            ry="10"
            transform="rotate(35 19 12)"
          />
          <path d="m14 20-9 10M14 7l10 9M18 4l9 8M11 11l9 10M22 4 11 18M27 8 15 22" />
        </>
      )}
    </svg>
  );
}
