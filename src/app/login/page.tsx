import Link from "next/link";
import type { Metadata } from "next";
import { signIn } from "@/features/auth/actions";
import { AuthSubmitButton } from "@/features/auth/submit-button";
import styles from "../auth.module.css";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào The Fellowship bằng Gmail đã đăng ký.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ error?: string; notice?: string; next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const errorMessage = params.error === "rate-limit"
    ? "Anh vừa yêu cầu đăng nhập quá nhanh. Vui lòng đợi một phút rồi thử lại."
    : params.error === "send"
      ? "Chưa gửi được liên kết đăng nhập. Hãy kiểm tra Gmail và thử lại sau."
      : params.error === "callback"
        ? "Liên kết đăng nhập không còn hợp lệ hoặc đã hết hạn. Hãy yêu cầu liên kết mới."
        : params.error === "suspended"
          ? "Tài khoản hiện đang bị tạm khóa. Vui lòng liên hệ quản trị viên."
          : null;
  const noticeMessage = params.notice === "check-email"
    ? "Nếu Gmail này đã có tài khoản Fellowship đang hoạt động, liên kết đăng nhập sẽ được gửi tới hộp thư. Hãy kiểm tra cả mục Spam."
    : params.notice === "signed-out"
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
        <h1>Chào mừng trở lại.</h1>
        <p className={styles.description}>Nhập Gmail đã đăng ký. Fellowship sẽ gửi cho anh một liên kết đăng nhập an toàn.</p>

        {errorMessage ? <p className={styles.error} role="alert">{errorMessage}</p> : null}
        {noticeMessage ? <p className={styles.notice} role="status">{noticeMessage}</p> : null}

        <form action={signIn} className={styles.form}>
          {params.next?.startsWith("/invite/") && !params.next.startsWith("//") ? <input type="hidden" name="next" value={params.next} /> : null}
          <label htmlFor="email">Gmail</label>
          <input id="email" name="email" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" autoComplete="email" placeholder="ten@gmail.com" required />
          <AuthSubmitButton className={styles.submitButton} pendingLabel="Đang gửi liên kết...">
            Gửi liên kết đăng nhập
          </AuthSubmitButton>
        </form>

        <p className={styles.footerText}>
          Chỉ Gmail đã có tài khoản mới đăng nhập được.
        </p>
        <p className={styles.footerText}>
          Chưa có tài khoản? <Link href="/signup">Tạo tài khoản miễn phí</Link>
        </p>
      </section>
      <Link className={styles.backLink} href="/">← Quay về trang giới thiệu</Link>
    </main>
  );
}
