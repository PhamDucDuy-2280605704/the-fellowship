"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/auth.module.css";

export default function RecoveryForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || cleanEmail.length > 254) {
      setError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError("Mã PIN phải gồm đúng 6 chữ số.");
      return;
    }
    if (password.length < 6 || password.length > 128) {
      setError("Mật khẩu mới cần có từ 6 đến 128 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Hai mật khẩu mới chưa trùng khớp.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: requestError } = await createClient().functions.invoke("account-recovery", {
        body: { action: "reset-password", email: cleanEmail, pin, password },
      });
      if (requestError || data?.ok !== true) {
        setError("Thông tin khôi phục chưa chính xác hoặc yêu cầu đang tạm khóa. Hãy kiểm tra email, PIN và thử lại sau.");
        return;
      }
      router.replace("/login?notice=password-updated");
      router.refresh();
    } catch {
      setError("Chưa thể cập nhật mật khẩu lúc này. Hãy thử lại sau ít phút.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>A NEW BEGINNING</p>
      <h1>Khôi phục mật khẩu bằng mã PIN.</h1>
      <p className={styles.description}>Không cần liên kết email. Nhập email tài khoản, PIN 6 chữ số đã thiết lập và mật khẩu mới của bạn.</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label htmlFor="recovery-email">Email tài khoản</label>
        <input id="recovery-email" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required />
        <label htmlFor="recovery-pin">Mã PIN khôi phục</label>
        <input id="recovery-pin" type="password" inputMode="numeric" pattern="[0-9]{6}" autoComplete="off" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} minLength={6} maxLength={6} required />
        <label htmlFor="new-password">Mật khẩu mới</label>
        <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} maxLength={128} required />
        <label htmlFor="confirm-password">Nhập lại mật khẩu mới</label>
        <input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} maxLength={128} required />
        <button type="submit" disabled={loading}>{loading ? "Đang xác minh và cập nhật..." : "Đặt mật khẩu mới"}</button>
      </form>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <p className={styles.footerText}><Link href="/login">Quay lại đăng nhập</Link></p>
    </div>
  );
}
