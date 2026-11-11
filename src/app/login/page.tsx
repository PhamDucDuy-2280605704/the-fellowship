import Link from "next/link";
import type { Metadata } from "next";
import { signIn } from "@/features/auth/actions";
import { AuthSubmitButton } from "@/features/auth/submit-button";
import styles from "../auth.module.css";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào The Fellowship bằng email và mật khẩu.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ error?: string; notice?: string; next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const errorMessage = params.error === "wrong-portal"
    ? "Tài khoản Admin không thể đăng nhập qua cổng thành viên. Hãy dùng cổng quản trị riêng."
    : params.error === "role-check"
      ? "Chưa xác minh được quyền tài khoản. Vui lòng thử lại."
      : params.error === "credentials"
    ? "Email hoặc mật khẩu chưa chính xác."
    : params.error === "invalid-input"
      ? "Vui lòng nhập email hợp lệ và mật khẩu."
      : params.error === "suspended"
        ? "Tài khoản hiện đang bị tạm khóa. Vui lòng liên hệ quản trị viên."
        : null;
  const noticeMessage = params.notice === "signed-out"
    ? "Anh đã đăng xuất thành công."
    : params.notice === "password-updated"
      ? "Mật khẩu đã được cập nhật. Hãy đăng nhập bằng mật khẩu mới."
      : params.notice === "account-created"
        ? "Tài khoản đã được tạo. Hãy đăng nhập bằng email và mật khẩu vừa đăng ký."
        : null;

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <Link className={styles.brand} href="/">
        <span>✦</span> THE FELLOWSHIP
      </Link>
      <section className={styles.card} aria-labelledby="login-title">
        <p className={styles.eyebrow}>WELCOME BACK</p>
        <h1>Chào mừng trở lại.</h1>
        <p className={styles.description}>Đăng nhập bằng email và mật khẩu anh đã tạo khi đăng ký.</p>

        {errorMessage ? <p className={styles.error} role="alert">{errorMessage}</p> : null}
        {noticeMessage ? <p className={styles.notice} role="status">{noticeMessage}</p> : null}

        <form action={signIn} className={styles.form}>
          <input type="hidden" name="portal" value="member" />
          {(params.next === "/the-stewards-hall" || params.next?.startsWith("/the-stewards-hall/") || (params.next?.startsWith("/invite/") && !params.next.startsWith("//"))) ? <input type="hidden" name="next" value={params.next} /> : null}
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" autoComplete="email" placeholder="you@example.com" required />
          <label htmlFor="password">Mật khẩu</label>
          <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Mật khẩu của anh" required />
          <AuthSubmitButton className={styles.submitButton} pendingLabel="Đang đăng nhập...">
            Đăng nhập
          </AuthSubmitButton>
        </form>
        <p className={styles.footerText}>
          <Link href="/forgot-password">Quên mật khẩu?</Link>
        </p>

        <p className={styles.footerText}>
          Chưa có tài khoản? <Link href="/signup">Tạo tài khoản miễn phí</Link>
        </p>
      </section>
      <Link className={styles.backLink} href="/">← Quay về trang giới thiệu</Link>
    </main>
  );
}
