import type { Metadata } from "next";
import Link from "next/link";
import RecoveryForm from "@/features/auth/recovery-form";
import styles from "../auth.module.css";

export const metadata: Metadata = {
  title: "Khôi phục mật khẩu",
  description: "Khôi phục tài khoản The Fellowship bằng mã PIN bảo mật.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className={`${styles.page} ${styles.recoveryPage}`}>
      <div className={styles.ambient} aria-hidden="true" />
      <Link className={styles.brand} href="/"><span>✦</span> THE FELLOWSHIP</Link>
      <RecoveryForm />
      <Link className={styles.backLink} href="/">← Quay về trang giới thiệu</Link>
    </main>
  );
}
