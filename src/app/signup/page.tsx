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
    : params.error === "pin"
      ? "Mã PIN khôi phục phải gồm đúng 6 chữ số và hai lần nhập phải trùng nhau."
      : params.error === "invalid-input"
        ? "Vui lòng nhập tên từ 2 đến 80 ký tự và một địa chỉ email hợp lệ."
        : params.error === "rate-limit"
          ? "Có quá nhiều yêu cầu đăng ký từ mạng này. Vui lòng chờ vài phút rồi thử lại."
          : params.error === "signup-failed"
            ? "Chưa thể tạo tài khoản với thông tin này. Nếu đã có tài khoản, hãy đăng nhập."
            : null;
  const noticeMessage = params.notice === "check-email"
    ? "Tài khoản đã được ghi nhận. Nếu dự án vẫn yêu cầu xác nhận email, hãy hoàn tất bước đó trước khi đăng nhập."
    : null;

  return (
    <main className={`${styles.page} ${styles.signupPage}`}>
      <link rel="preload" as="image" href="https://www.lotro.com/images/about/feature-6.png?v=255186907" fetchPriority="high" />
      <div className={styles.ambient} aria-hidden="true" />
      <Link className={styles.brand} href="/">
        <span>✦</span> THE FELLOWSHIP
      </Link>
      <section className={styles.card} aria-labelledby="signup-title">
        <p className={styles.eyebrow}>JOIN THE FELLOWSHIP</p>
        <h1>Tạo tài khoản miễn phí.</h1>
        <p className={styles.description}>Đăng ký bằng email và mật khẩu. Chọn thêm mã PIN riêng để tự khôi phục tài khoản khi cần.</p>

        {errorMessage ? <p className={styles.error} role="alert">{errorMessage}</p> : null}
        {noticeMessage ? <p className={styles.notice} role="status">{noticeMessage}</p> : null}

        <form action={signUp} className={styles.form}>
          {params.next?.startsWith("/invite/") && !params.next.startsWith("//") ? <input type="hidden" name="next" value={params.next} /> : null}
          <label htmlFor="displayName">Tên hiển thị</label>
          <input id="displayName" name="displayName" type="text" minLength={2} maxLength={80} autoComplete="name" placeholder="Tên hiển thị" required />
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" autoComplete="email" placeholder="you@example.com" required />
          <label htmlFor="password">Mật khẩu</label>
          <input id="password" name="password" type="password" minLength={6} maxLength={128} autoComplete="new-password" placeholder="Ít nhất 6 ký tự" required />
          <label htmlFor="recoveryPin">Mã PIN khôi phục (6 chữ số)</label>
          <input id="recoveryPin" name="recoveryPin" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="off" placeholder="••••••" required />
          <label htmlFor="recoveryPinConfirm">Nhập lại mã PIN</label>
          <input id="recoveryPinConfirm" name="recoveryPinConfirm" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="off" placeholder="Nhập lại 6 chữ số" required />
          <p className={styles.footerText}>PIN không phải mật khẩu đăng nhập. Hãy giữ bí mật và không dùng mã dễ đoán như ngày sinh hoặc 123456.</p>
          <AuthSubmitButton className={styles.submitButton} pendingLabel="Đang tạo tài khoản...">
            Tạo tài khoản miễn phí
          </AuthSubmitButton>
        </form>

        <p className={styles.footerText}>
          Tài khoản mới bắt đầu với quyền User. Admin có thể xem và quản lý thành viên.
        </p>
        <p className={styles.footerText}>
          Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
        </p>
      </section>
    </main>
  );
}
