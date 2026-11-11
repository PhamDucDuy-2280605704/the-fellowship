import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "@/features/auth/actions";
import { AuthSubmitButton } from "@/features/auth/submit-button";
import styles from "../auth.module.css";

export const metadata: Metadata = { title: "Steward sign-in", robots: { index: false, follow: false } };
type SearchParams = Promise<{ error?: string }>;

export default async function StewardLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = params.error === "wrong-portal"
    ? "Tài khoản này không có quyền Admin nền tảng."
    : params.error === "role-check"
      ? "Chưa xác minh được quyền Admin. Hãy thử lại."
      : params.error === "credentials"
        ? "Email hoặc mật khẩu chưa chính xác."
        : null;
  return <main className={`${styles.page} ${styles.adminLoginPage}`}>
    <div className={styles.ambient} aria-hidden="true" />
    <Link className={styles.brand} href="/">✦ THE FELLOWSHIP · STEWARDS</Link>
    <section className={styles.card} aria-labelledby="login-title">
      <p className={styles.eyebrow}>PRIVATE ADMINISTRATION</p>
      <h1 id="login-title">Cổng quản trị</h1>
      <p className={styles.description}>Đăng nhập dành riêng cho Steward được cấp quyền quản trị nền tảng.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <form action={signIn} className={styles.form}>
        <input type="hidden" name="portal" value="admin" />
        <label htmlFor="email">Email quản trị</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
        <label htmlFor="password">Mật khẩu</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
        <AuthSubmitButton className={styles.submitButton} pendingLabel="Đang xác thực...">Đăng nhập quản trị</AuthSubmitButton>
      </form>
      <p className={styles.footerText}><Link href="/login">← Cổng thành viên</Link></p>
    </section>
  </main>;
}
