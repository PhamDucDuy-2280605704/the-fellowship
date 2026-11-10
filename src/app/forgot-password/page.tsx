import Link from "next/link";
import type { Metadata } from "next";
import { requestPasswordReset } from "@/features/auth/actions";
import { AuthSubmitButton } from "@/features/auth/submit-button";
import styles from "../auth.module.css";

export const metadata: Metadata = {
  title: "Khôi phục mật khẩu",
  description: "Nhận liên kết an toàn để đặt lại mật khẩu The Fellowship.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ error?: string; notice?: string }>;

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <Link className={styles.brand} href="/"><span>✦</span> THE FELLOWSHIP</Link>
      <section className={styles.card} aria-labelledby="recovery-title">
        <p className={styles.eyebrow}>A WAY BACK TO THE JOURNEY</p>
        <h1 id="recovery-title">Khôi phục mật khẩu.</h1>
        <p className={styles.description}>Nhập email tài khoản. Nếu địa chỉ này có thể khôi phục, chúng tôi sẽ gửi liên kết đặt mật khẩu mới.</p>
        {params.error === "invalid-input" && <p className={styles.error} role="alert">Vui lòng nhập một địa chỉ email hợp lệ.</p>}
        {params.error === "request" && <p className={styles.error} role="alert">Chưa gửi được email khôi phục. Hãy thử lại sau ít phút.</p>}
        {params.notice === "sent" && <p className={styles.notice} role="status">Nếu email này đã đăng ký, liên kết khôi phục sẽ được gửi đến hộp thư. Hãy kiểm tra cả mục Spam.</p>}
        <form action={requestPasswordReset} className={styles.form}>
          <label htmlFor="email">Email tài khoản</label>
          <input id="email" name="email" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" autoComplete="email" placeholder="you@example.com" required />
          <AuthSubmitButton className={styles.submitButton} pendingLabel="Đang gửi liên kết...">Gửi liên kết khôi phục</AuthSubmitButton>
        </form>
        <p className={styles.footerText}><Link href="/login">Quay lại đăng nhập</Link></p>
      </section>
      <Link className={styles.backLink} href="/">← Quay về trang giới thiệu</Link>
    </main>
  );
}
