import Link from "next/link";
import type { Metadata } from "next";
import { signUp } from "@/features/auth/actions";
import { AuthSubmitButton } from "@/features/auth/submit-button";
import styles from "../auth.module.css";

export const metadata: Metadata = {
  title: "Tạo tài khoản",
  description: "Tạo tài khoản để bắt đầu cộng tác cùng nhóm trên The Fellowship.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ error?: string; notice?: string; next?: string }>;

export default async function SignUpPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const errorMessage = params.error === "password"
    ? "Mật khẩu cần có từ 6 đến 128 ký tự."
    : params.error === "invalid-input"
      ? "Tên hiển thị cần từ 2 đến 80 ký tự và email phải kết thúc bằng @gmail.com."
      : params.error === "configuration"
        ? "Ứng dụng chưa hoàn tất cấu hình liên kết xác nhận. Vui lòng thử lại sau."
        : params.error === "invalid-email"
          ? "Địa chỉ Gmail chưa hợp lệ. Hãy kiểm tra lại và thử lại."
          : params.error === "email-rate-limit"
            ? "Gmail xác nhận đang được gửi quá nhiều lần. Hãy chờ một lúc trước khi thử lại."
            : params.error === "email-provider"
              ? "Dịch vụ email xác nhận chưa sẵn sàng. Vui lòng thử lại sau."
              : params.error === "signup-failed"
                ? "Chưa thể tạo tài khoản với thông tin này. Nếu đã có tài khoản, hãy đăng nhập."
                : null;
  const noticeMessage = params.notice === "check-email"
    ? "Gần xong rồi! Mở Gmail và nhấn liên kết xác nhận để kích hoạt tài khoản. Nhớ kiểm tra cả mục Spam."
    : null;

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <Link className={styles.brand} href="/">
        <span>✦</span> THE FELLOWSHIP
      </Link>
      <section className={styles.card} aria-labelledby="signup-title">
        <p className={styles.eyebrow}>JOIN THE FELLOWSHIP</p>
        <h1>Tạo tài khoản miễn phí.</h1>
        <p className={styles.description}>Chỉ cần tên, Gmail và mật khẩu. Không cần mã mời hay quản trị viên duyệt.</p>

        {errorMessage ? <p className={styles.error} role="alert">{errorMessage}</p> : null}
        {noticeMessage ? <p className={styles.notice} role="status">{noticeMessage}</p> : null}

        <form action={signUp} className={styles.form}>
          {params.next?.startsWith("/invite/") && !params.next.startsWith("//") ? <input type="hidden" name="next" value={params.next} /> : null}
          <label htmlFor="displayName">Tên của anh</label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            minLength={2}
            maxLength={80}
            autoComplete="name"
            placeholder="Tên hiển thị"
            required
          />
          <label htmlFor="email">Gmail</label>
          <input id="email" name="email" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" autoComplete="email" placeholder="ten@gmail.com" required />
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={6}
            maxLength={128}
            autoComplete="new-password"
            placeholder="Ít nhất 6 ký tự"
            required
          />
          <AuthSubmitButton className={styles.submitButton} pendingLabel="Đang tạo tài khoản...">
            Tạo tài khoản miễn phí
          </AuthSubmitButton>
        </form>

        <p className={styles.footerText}>
          Chỉ nhận địa chỉ @gmail.com. Tài khoản mới bắt đầu với quyền User.
        </p>
        <p className={styles.footerText}>
          Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
        </p>
      </section>
      <Link className={styles.backLink} href="/">← Quay về trang giới thiệu</Link>
    </main>
  );
}
