import Link from "next/link";
import type { Metadata } from "next";
import { signIn } from "@/features/auth/actions";
import styles from "../auth.module.css";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào không gian cộng tác The Fellowship.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ error?: string; notice?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const errorMessage = params.error === "credentials"
    ? "Email hoặc mật khẩu chưa chính xác."
    : params.error === "invalid-input"
      ? "Vui lòng nhập email và mật khẩu."
      : null;
  const noticeMessage = params.notice === "signed-out"
    ? "Anh đã đăng xuất thành công."
    : null;

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <Link className={styles.brand} href="/">
        <span>✦</span> THE FELLOWSHIP
      </Link>
      <section className={styles.card} aria-labelledby="login-title">
        <p className={styles.eyebrow}>WELCOME BACK</p>
        <h1 id="login-title">Tiếp tục hành trình.</h1>
        <p className={styles.description}>Đăng nhập để trở lại không gian làm việc của nhóm.</p>

        {errorMessage ? <p className={styles.error} role="alert">{errorMessage}</p> : null}
        {noticeMessage ? <p className={styles.notice} role="status">{noticeMessage}</p> : null}

        <form action={signIn} className={styles.form}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <button type="submit">Đăng nhập <span aria-hidden="true">→</span></button>
        </form>

        <p className={styles.footerText}>
          Chưa có tài khoản? <Link href="/signup">Tạo tài khoản mới</Link>
        </p>
      </section>
      <Link className={styles.backLink} href="/">← Quay về trang giới thiệu</Link>
    </main>
  );
}
