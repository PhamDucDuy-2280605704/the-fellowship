import type { ReactNode } from "react";
import Link from "next/link";
import { signOut } from "@/features/auth/actions";
import { requirePlatformAdmin } from "@/lib/auth/platform";
import styles from "./admin.module.css";

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { user } = await requirePlatformAdmin();

  return (
    <main className={styles.shell}>
      <div className={styles.ambient} aria-hidden="true" />
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/the-stewards-hall">
          <span>✦</span>
          <span>THE FELLOWSHIP</span>
          <b>ADMIN</b>
        </Link>
        <nav className={styles.nav} aria-label="Quản trị">
          <Link href="/the-stewards-hall/accounts">Tài khoản</Link>
          <Link href="/the-stewards-hall/workspaces">Workspaces</Link>
        </nav>
        <div className={styles.account}>
          <span>{user.email}</span>
          <form action={signOut}>
            <button type="submit">Đăng xuất</button>
          </form>
        </div>
      </header>
      {children}
    </main>
  );
}
