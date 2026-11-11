import Link from "next/link";
import styles from "@/app/workspaces.module.css";

const tabs = [
  ["overview", "Tổng quan", ""],
  ["goals", "Mục tiêu", "/goals"],
  ["quests", "Công việc", "/quests"],
  ["council", "Biểu quyết", "/council"],
  ["archives", "Kho tri thức", "/archives"],
  ["members", "Thành viên", "/members"],
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
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
