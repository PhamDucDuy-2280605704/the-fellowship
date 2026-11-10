import Link from "next/link";
import type { Metadata } from "next";
import { signUp } from "@/features/auth/actions";
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
    ? "Mật khẩu cần có từ 8 đến 128 ký tự."
    : params.error === "invalid-input"
      ? "Vui lòng kiểm tra tên hiển thị và email."
      : params.error === "configuration"
        ? "Ứng dụng chưa cấu hình địa chỉ website cho email xác nhận."
        : params.error === "invalid-email"
          ? "Địa chỉ email không hợp lệ hoặc nhà cung cấp không chấp nhận địa chỉ này. Hãy nhập email thật, đúng định dạng và có thể nhận thư xác nhận."
          : params.error === "email-rate-limit"
            ? "Hệ thống đang gửi quá nhiều email xác nhận. Vui lòng chờ một lúc rồi thử lại."
            : params.error === "email-provider"
              ? "Dịch vụ email thử nghiệm của Supabase chưa cho phép gửi tới địa chỉ này. Cần cấu hình SMTP riêng để đăng ký bằng email bên ngoài."
              : params.error === "signup-failed"
                ? "Chưa thể tạo tài khoản với thông tin này. Hãy kiểm tra email, hoặc đăng nhập nếu anh đã có tài khoản."
                : null;
  const noticeMessage = params.notice === "check-email"
    ? "Tài khoản đã được gửi yêu cầu tạo. Hãy mở email xác nhận để hoàn tất đăng ký."
    : null;

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <Link className={styles.brand} href="/">
        <span>✦</span> THE FELLOWSHIP
      </Link>
      <section className={styles.card} aria-labelledby="signup-title">
        <p className={styles.eyebrow}>JOIN THE FELLOWSHIP</p>
        <h1>Bắt đầu hành trình chung.</h1>
        <p className={styles.description}>Tạo tài khoản để khởi tạo workspace và mời đồng đội tham gia.</p>

        {errorMessage ? <p className={styles.error} role="alert">{errorMessage}</p> : null}
        {noticeMessage ? <p className={styles.notice} role="status">{noticeMessage}</p> : null}

        <form action={signUp} className={styles.form}>
          {params.next?.startsWith("/invite/") && !params.next.startsWith("//") ? <input type="hidden" name="next" value={params.next} /> : null}
          <label htmlFor="displayName">Tên hiển thị</label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            minLength={2}
            maxLength={80}
            autoComplete="name"
            required
          />
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            required
          />
          <button type="submit">Tạo tài khoản <span aria-hidden="true">→</span></button>
        </form>

        <p className={styles.footerText}>
          Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
        </p>
      </section>
      <Link className={styles.backLink} href="/">← Quay về trang giới thiệu</Link>
    </main>
  );
}
