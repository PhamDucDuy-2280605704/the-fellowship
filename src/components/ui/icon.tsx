import type { ReactNode } from "react";

export type IconName =
  | "compass"
  | "users"
  | "route"
  | "user-plus"
  | "target"
  | "checklist"
  | "scale"
  | "archive"
  | "activity"
  | "settings"
  | "layers"
  | "arrow-up-right"
  | "sparkle"
  | "tree";

const paths: Record<IconName, ReactNode> = {
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.8 8.2-2.4 5.2-5.2 2.4 2.4-5.2 5.2-2.4Z" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M2.8 19c.3-3.2 2.5-5.2 6.2-5.2s5.9 2 6.2 5.2" /><path d="M16 5.2a3.1 3.1 0 0 1 0 6M17 14c2.5.3 4 2 4.2 4.4" /></>,
  route: <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h3.5a3 3 0 0 0 3-3v-2a3 3 0 0 1 3-3" /></>,
  "user-plus": <><circle cx="9" cy="8" r="3.2" /><path d="M2.8 19c.3-3.2 2.5-5.2 6.2-5.2 2.1 0 3.7.6 4.8 1.8M19 8v6m-3-3h6" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></>,
  checklist: <><path d="M10 6h10M10 12h10M10 18h10" /><path d="m3 6 1.5 1.5L7 5m-4 7 1.5 1.5L7 11m-4 7 1.5 1.5L7 17" /></>,
  scale: <><path d="M12 3v18M5 21h14M5 7h14M7 7l-4 7h8L7 7Zm10 0-4 7h8l-4-7Z" /></>,
  archive: <><path d="M3 4h18v4H3zM5 8v12h14V8M10 12h4" /></>,
  activity: <><path d="M3 12h4l3-7 4 14 3-7h4" /></>,
  settings: <><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4m0-12.8L17 7M7 17l-1.4 1.4" /><circle cx="12" cy="12" r="5" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  "arrow-up-right": <><path d="M7 17 17 7M8 7h9v9" /></>,
  sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
  tree: <><path d="M12 21V10m0 7-4-3m4 1 4-4M12 12 8 8m4 2 4-5M12 8V3M8 21h8" /></>,
};

export function AppIcon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
