import Link from "next/link";
import type { Metadata } from "next";
import { saveRecoveryPin } from "@/features/auth/actions";
import { AuthSubmitButton } from "@/features/auth/submit-button";
import { requireActiveUser } from "@/lib/auth/platform";
import styles from "../auth.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Thiết lập mã PIN khôi phục",
  description: "Thiết lập mã PIN 6 chữ số để tự khôi phục tài khoản The Fellowship.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ error?: string }>;

export default async function RecoveryPinPage({ searchParams }: { searchParams: SearchParams }) {
  await requireActiveUser();
  const params = await searchParams;
  const errorMessage = params.error === "pin"
    ? "Mã PIN phải gồm đúng 6 chữ số và hai lần nhập phải trùng nhau."
    : params.error === "save"
      ? "Chưa thể lưu mã PIN. Hãy thử lại."
      : null;

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <Link className={styles.brand} href="/"><span>✦</span> THE FELLOWSHIP</Link>
      <section className={styles.card}>
        <p className={styles.eyebrow}>ACCOUNT SECURITY</p>
        <h1>Thiết lập mã PIN khôi phục.</h1>
        <p className={styles.description}>Tài khoản này chưa có PIN khôi phục. Tạo mã gồm 6 chữ số để có thể tự đặt lại mật khẩu mà không cần email.</p>
        {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}
        <form action={saveRecoveryPin} className={styles.form}>
          <label htmlFor="recoveryPin">Mã PIN mới</label>
          <input id="recoveryPin" name="recoveryPin" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="off" required />
          <label htmlFor="recoveryPinConfirm">Nhập lại mã PIN</label>
          <input id="recoveryPinConfirm" name="recoveryPinConfirm" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="off" required />
          <AuthSubmitButton className={styles.submitButton} pendingLabel="Đang lưu PIN...">Lưu mã PIN bảo mật</AuthSubmitButton>
        </form>
        <p className={styles.footerText}>Không dùng ngày sinh hoặc chuỗi dễ đoán. Hệ thống chỉ lưu bản băm, Admin không thể xem mã PIN.</p>
        <p className={styles.footerText}><Link href="/workspaces">Quay lại workspace</Link></p>
      </section>
    </main>
  );
}
