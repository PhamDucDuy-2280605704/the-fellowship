"use client";

import { useState } from "react";
import { resetUserCredentials } from "../actions";
import styles from "../admin.module.css";

type Credentials = { email: string; password: string; pin: string };

export function CredentialResetPanel({ userId, email }: { userId: string; email: string }) {
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    if (busy) return;
    if (!window.confirm(`Tạo mật khẩu và PIN mới cho ${email || "tài khoản này"}? Thông tin đăng nhập hiện tại sẽ không còn sử dụng được.`)) return;
    setBusy(true);
    setError("");
    setCredentials(null);
    try {
      const result = await resetUserCredentials(formData);
      if (result.ok) setCredentials({ email: result.email, password: result.password, pin: result.pin });
      else setError(result.message);
    } catch {
      setError("Không thể kết nối máy chủ. Hãy tải lại trang và thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.credentialReset}>
      <form action={submit}>
        <input type="hidden" name="userId" value={userId} />
        <button className={styles.credentialButton} type="submit" disabled={busy}>
          {busy ? "Đang tạo…" : "Tạo mật khẩu + PIN mới"}
        </button>
      </form>
      {error && <p className={styles.credentialError} role="alert">{error}</p>}
      {credentials && (
        <section className={styles.credentialResult} aria-live="polite">
          <b>Thông tin mới — chỉ hiển thị lần này</b>
          <p>Email: <code>{credentials.email}</code></p>
          <p>Mật khẩu: <code>{credentials.password}</code></p>
          <p>PIN khôi phục: <code>{credentials.pin}</code></p>
          <button type="button" className={styles.credentialButton} onClick={() => {
            void navigator.clipboard.writeText(`Email: ${credentials.email}\nMật khẩu: ${credentials.password}\nPIN: ${credentials.pin}`);
          }}>Sao chép thông tin</button>
          <button type="button" className={styles.credentialDismiss} onClick={() => setCredentials(null)}>Ẩn thông tin</button>
          <small>Hãy gửi thông tin qua kênh an toàn. Tải lại trang sẽ không thể xem lại các giá trị này.</small>
        </section>
      )}
    </div>
  );
}
