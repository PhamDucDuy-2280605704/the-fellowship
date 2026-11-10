import Link from "next/link";
import type { Metadata } from "next";
import { updatePassword } from "@/features/auth/actions";
import { AuthSubmitButton } from "@/features/auth/submit-button";
import { requireActiveUser } from "@/lib/auth/platform";
import styles from "../auth.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Đặt mật khẩu mới",
  description: "Tạo mật khẩu mới cho tài khoản The Fellowship.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ error?: string }>;

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  await requireActiveUser();
  const params = await searchParams;
  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <Link className={styles.brand} href="/"><span>✦</span> THE FELLOWSHIP</Link>
      <section className={styles.card} aria-labelledby="reset-title">
        <p className={styles.eyebrow}>A NEW BEGINNING</p>
        <h1>Đặt mật khẩu mới.</h1>
        <p className={styles.description}>Chọn mật khẩu dài ít nhất 6 ký tự. Sau khi lưu, anh có thể tiếp tục hành trình.</p>
        {params.error === "password" && <p className={styles.error} role="alert">Mật khẩu cần có từ 6 đến 128 ký tự.</p>}
        {params.error === "update" && <p className={styles.error} role="alert">Chưa thể cập nhật mật khẩu. Hãy mở lại liên kết khôi phục mới nhất và thử lại.</p>}
        <form action={updatePassword} className={styles.form}>
          <label htmlFor="password">Mật khẩu mới</label>
          <input id="password" name="password" type="password" minLength={6} maxLength={128} autoComplete="new-password" placeholder="Ít nhất 6 ký tự" required />
          <AuthSubmitButton className={styles.submitButton} pendingLabel="Đang cập nhật...">Lưu mật khẩu mới</AuthSubmitButton>
        </form>
        <p className={styles.footerText}><Link href="/workspaces">Về workspace</Link></p>
      </section>
    </main>
  );
}
