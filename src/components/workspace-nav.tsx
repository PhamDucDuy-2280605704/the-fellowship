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
  return (
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
  );
}
