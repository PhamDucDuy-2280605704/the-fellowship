"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const router = useRouter();
  const [prefetchedRoutes, setPrefetchedRoutes] = useState<Set<string>>(() => new Set());

  function prefetchRoute(href: string) {
    if (prefetchedRoutes.has(href)) return;
    setPrefetchedRoutes((current) => new Set(current).add(href));
    router.prefetch(href);
  }

  return (
    <nav className={styles.moduleNav} aria-label="Điều hướng workspace">
      {tabs.map(([key, label, suffix]) => {
        const href = `/workspaces/${slug}${suffix}`;
        const shouldPrefetchFully = prefetchedRoutes.has(href);

        return (
          <Link
            className={key === active ? styles.moduleNavActive : styles.moduleNavLink}
            href={href}
            aria-current={key === active ? "page" : undefined}
            key={key}
            prefetch={shouldPrefetchFully ? true : false}
            onMouseEnter={() => prefetchRoute(href)}
            onFocus={() => prefetchRoute(href)}
            onTouchStart={() => prefetchRoute(href)}
          >
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
