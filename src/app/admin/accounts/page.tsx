import { deleteUserAccount, setUserSuspension } from "../actions";
import { CredentialResetPanel } from "./credential-reset-panel";
import { requirePlatformAdmin } from "@/lib/auth/platform";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Quản lý tài khoản",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ notice?: string; error?: string }>;

function dateLabel(value: string | null) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const errorMessages: Record<string, string> = {
  "delete-invalid": "Thông tin xác nhận xóa không hợp lệ.",
  "delete-self": "Không thể tự xóa tài khoản Admin đang đăng nhập.",
  "delete-admin": "Không thể xóa tài khoản thuộc nhóm quản trị viên nền tảng.",
  "delete-email": "Email xác nhận không khớp với tài khoản cần xóa.",
  "delete-workspaces": "Tài khoản đang sở hữu workspace. Hãy chuyển quyền sở hữu hoặc xử lý workspace trước khi xóa.",
  "delete-related-data": "Không thể xóa vì tài khoản vẫn được tham chiếu bởi dữ liệu hoặc tệp trong ứng dụng. Hãy xử lý dữ liệu liên quan trước.",
  "delete-failed": "Không thể xóa tài khoản. Hãy thử lại hoặc kiểm tra cấu hình Edge Function.",
};

export default async function AdminAccountsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase } = await requirePlatformAdmin();
  const { data: users, error } = await supabase.rpc("admin_list_users");

  return (
    <section className={`${styles.content} ${styles.adminAccountsPage}`}>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>IDENTITIES & ACCESS</p>
          <h1>Tài khoản người dùng.</h1>
          <p>Danh sách tài khoản đăng ký trên The Fellowship và trạng thái truy cập nền tảng.</p>
        </div>
        <span className={styles.counter}>{users?.length ?? 0} TÀI KHOẢN</span>
      </div>

      {params.notice === "suspended" && <p className={styles.success} role="status">Đã tạm khóa tài khoản.</p>}
      {params.notice === "restored" && <p className={styles.success} role="status">Đã mở lại quyền truy cập tài khoản.</p>}
      {params.notice === "deleted" && <p className={styles.success} role="status">Đã xóa vĩnh viễn tài khoản người dùng.</p>}
      {params.error && <p className={styles.error} role="alert">{errorMessages[params.error] ?? "Không thể cập nhật tài khoản. Hãy kiểm tra lại trạng thái và thử lại."}</p>}
      {error && <p className={styles.error} role="alert">Không thể tải danh sách tài khoản.</p>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Thành viên</th>
              <th>Vai trò</th>
              <th>Email</th>
              <th>Đăng ký</th>
              <th>Đăng nhập gần nhất</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((user) => (
              <tr key={user.user_id}>
                <td>
                  <b>{user.display_name || "Thành viên"}</b>
                  <small className={styles.subtleId}>{user.user_id.slice(0, 8)}…</small>
                </td>
                <td><span className={user.platform_role === "admin" ? styles.adminPill : styles.userPill}>{user.platform_role === "admin" ? "Admin" : "Người dùng"}</span></td>
                <td>
                  <span>{user.email || "Không có email"}</span>
                  <small>{user.email_confirmed_at ? "Email đã xác nhận" : "Chưa xác nhận email"}</small>
                </td>
                <td>{dateLabel(user.created_at)}</td>
                <td>{dateLabel(user.last_sign_in_at)}</td>
                <td>
                  <span className={user.is_suspended ? styles.suspendedPill : styles.activePill}>
                    {user.is_suspended ? "Tạm khóa" : "Hoạt động"}
                  </span>
                  {user.suspension_reason && <small>{user.suspension_reason}</small>}
                </td>
                <td>
                  {user.platform_role === "admin" ? (
                    <span className={styles.protected}>Tài khoản quản trị</span>
                  ) : (
                    <div className={styles.accountActions}>
                      <form action={setUserSuspension} className={styles.inlineForm}>
                        <input type="hidden" name="userId" value={user.user_id} />
                        <input type="hidden" name="shouldSuspend" value={String(!user.is_suspended)} />
                        {!user.is_suspended && (
                          <input className={styles.reasonInput} name="reason" maxLength={500} placeholder="Lý do (bắt buộc)" required />
                        )}
                        <button className={user.is_suspended ? styles.restoreButton : styles.dangerButton} type="submit">
                          <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            {user.is_suspended ? (
                              <>
                                <path d="M7 10V7a5 5 0 0 1 9.6-2" />
                                <rect x="4" y="10" width="16" height="11" rx="2" />
                                <path d="m10 15 2 2 3-4" />
                              </>
                            ) : (
                              <>
                                <rect x="4" y="10" width="16" height="11" rx="2" />
                                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                                <path d="M12 14v3" />
                              </>
                            )}
                          </svg>
                          <span>{user.is_suspended ? "Mở khóa" : "Tạm khóa"}</span>
                        </button>
                      </form>

                      <details className={styles.deleteAccount}>
                        <summary className={styles.deleteSummary}>
                          <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
                          </svg>
                          <span>Xóa tài khoản</span>
                          <svg className={styles.disclosureIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="m7 10 5 5 5-5" />
                          </svg>
                        </summary>
                        <form action={deleteUserAccount} className={styles.deleteForm}>
                          <input type="hidden" name="userId" value={user.user_id} />
                          <label htmlFor={`confirm-delete-${user.user_id}`}>Nhập chính xác email để xác nhận</label>
                          <input
                            id={`confirm-delete-${user.user_id}`}
                            className={styles.confirmEmailInput}
                            name="confirmEmail"
                            type="email"
                            autoComplete="off"
                            placeholder={user.email || "email@example.com"}
                            required
                          />
                          <button className={styles.deleteAccountButton} type="submit">
                            <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
                            </svg>
                            <span>Xóa vĩnh viễn</span>
                          </button>
                        </form>
                      </details>
                      <CredentialResetPanel userId={user.user_id} email={user.email || ""} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr><td colSpan={7} className={styles.emptyCell}>Chưa có tài khoản nào để hiển thị.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className={styles.footnote}>
        Tạm khóa sẽ chặn truy cập dữ liệu và khu vực ứng dụng. Tài khoản Admin được bảo vệ. Xóa tài khoản là thao tác vĩnh viễn; hệ thống sẽ từ chối nếu tài khoản còn sở hữu workspace hoặc dữ liệu liên quan.
      </p>
      <p className={styles.footnote}>
        Admin có thể tạo mật khẩu và PIN mới cho tài khoản thường. Thông tin mới chỉ hiển thị một lần trong phiên thao tác; mật khẩu/PIN cũ không thể đọc lại.
      </p>
    </section>
  );
}
