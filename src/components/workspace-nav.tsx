import Link from "next/link";
import styles from "@/app/workspaces.module.css";

const tabs = [
  ["overview", "Tổng quan", ""],
  ["goals", "Goals", "/goals"],
  ["quests", "Quests", "/quests"],
  ["council", "The Council", "/council"],
  ["archives", "The Archives", "/archives"],
  ["members", "Thành viên", "/members"],
  ["activity", "Hoạt động", "/activity"],
  ["settings", "Cài đặt", "/settings"],
] as const;

export function WorkspaceNav({ slug, active }: { slug: string; active: string }) {
  const backgrounds: Record<string, string> = {
    overview: "https://www.lotro.com/images/about/feature-3.png?v=2732952715",
    goals: "https://www.lotro.com/images/about/feature-1.png?v=602098898",
    quests: "https://www.lotro.com/images/about/feature-6.png?v=255186907",
    council: "https://www.lotro.com/images/about/feature-5.png?v=758224346",
    archives: "https://www.lotro.com/images/about/feature-2.png?v=3504918561",
    members: "https://www.lotro.com/images/about/feature-3.png?v=2732952715",
    activity: "https://www.lotro.com/images/about/feature-1.png?v=602098898",
    settings: "https://www.lotro.com/images/about/feature-5.png?v=758224346",
  };
  const background = backgrounds[active] ?? "https://www.lotro.com/images/about/feature-3.png?v=2732952715";

  return (
    <>
      <link rel="preload" as="image" href={background} fetchPriority="high" />
      <nav className={styles.moduleNav} aria-label="Điều hướng workspace">
      {tabs.map(([key, label, suffix]) => (
        <Link
          className={key === active ? styles.moduleNavActive : styles.moduleNavLink}
          href={`/workspaces/${slug}${suffix}`}
          aria-current={key === active ? "page" : undefined}
          key={key}
        >
          {label}
        </Link>
      ))}
    </nav>
    </>
  );
}
