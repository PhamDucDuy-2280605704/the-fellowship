import Link from "next/link";
import { AppIcon, type IconName } from "@/components/ui/icon";
import styles from "@/app/workspaces.module.css";

const tabs = [
  ["overview", "Tổng quan", "", "compass"],
  ["goals", "Goals", "/goals", "target"],
  ["quests", "Quests", "/quests", "checklist"],
  ["council", "The Council", "/council", "scale"],
  ["archives", "The Archives", "/archives", "archive"],
  ["members", "Thành viên", "/members", "users"],
  ["activity", "Hoạt động", "/activity", "activity"],
  ["settings", "Cài đặt", "/settings", "settings"],
] as const satisfies readonly (readonly [string, string, string, IconName])[];

export function WorkspaceNav({ slug, active }: { slug: string; active: string }) {
  return (
    <nav className={styles.moduleNav} aria-label="Điều hướng workspace">
      {tabs.map(([key, label, suffix, icon]) => (
        <Link
          className={key === active ? styles.moduleNavActive : styles.moduleNavLink}
          href={`/workspaces/${slug}${suffix}`}
          aria-current={key === active ? "page" : undefined}
          key={key}
        >
          <AppIcon name={icon} className={styles.moduleNavIcon} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
