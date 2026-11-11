import { setUserSuspension } from "../actions";
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

export default async function AdminAccountsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase } = await requirePlatformAdmin();
  const { data: users, error } = await supabase.rpc("admin_list_users");

  return (
    <section className={`${styles.content} ${styles.adminAccountsPage}`}>
      <link rel="preload" as="image" href="https://www.lotro.com/images/about/feature-2.png?v=3504918561" fetchPriority="high" />
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
      {params.error && <p className={styles.error} role="alert">Không thể cập nhật tài khoản. Hãy kiểm tra lại trạng thái và thử lại.</p>}
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
                <td><span className={user.platform_role === "admin" ? styles.adminPill : styles.userPill}>{user.platform_role === "admin" ? "Admin" : "User"}</span></td>
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
                    <form action={setUserSuspension} className={styles.inlineForm}>
                      <input type="hidden" name="userId" value={user.user_id} />
                      <input type="hidden" name="shouldSuspend" value={String(!user.is_suspended)} />
                      {!user.is_suspended && (
                        <input className={styles.reasonInput} name="reason" maxLength={500} placeholder="Lý do (bắt buộc)" required />
                      )}
                      <button className={user.is_suspended ? styles.restoreButton : styles.dangerButton} type="submit">
                        {user.is_suspended ? "Mở khóa" : "Tạm khóa"}
                      </button>
                    </form>
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
      <p className={styles.footnote}>Tạm khóa sẽ chặn truy cập dữ liệu và khu vực ứng dụng. Tài khoản Admin được bảo vệ và không thể tự khóa.</p>
    </section>
  );
}
