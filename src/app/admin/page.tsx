import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/platform";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin Console",
  description: "Quản trị toàn bộ The Fellowship.",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  const { supabase } = await requirePlatformAdmin();
  const [usersResult, workspacesResult] = await Promise.all([
    supabase.rpc("admin_list_users"),
    supabase.rpc("admin_list_workspaces"),
  ]);

  const users = usersResult.data ?? [];
  const workspaces = workspacesResult.data ?? [];
  const activeUsers = users.filter((user) => !user.is_suspended).length;
  const suspendedUsers = users.length - activeUsers;
  const activeWorkspaces = workspaces.filter((workspace) => !workspace.is_archived).length;
  const archivedWorkspaces = workspaces.length - activeWorkspaces;

  return (
    <section className={styles.content}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>THE STEWARD'S HALL · PRIVATE ADMINISTRATION</p>
          <h1>Toàn cảnh vương quốc.</h1>
          <p>Quản lý tài khoản, theo dõi mọi workspace và giữ cho The Fellowship vận hành an toàn.</p>
        </div>
        <span className={styles.adminSeal}>✦ ADMIN</span>
      </div>

      {(usersResult.error || workspacesResult.error) && (
        <p className={styles.error} role="alert">
          Chưa tải được toàn bộ dữ liệu quản trị. Hãy tải lại trang; quyền Admin vẫn được kiểm tra ở database.
        </p>
      )}

      <div className={styles.metrics}>
        <article className={styles.metric}>
          <span>Tổng tài khoản</span>
          <strong>{users.length}</strong>
          <small>{activeUsers} đang hoạt động · {suspendedUsers} tạm khóa</small>
        </article>
        <article className={styles.metric}>
          <span>Tổng workspace</span>
          <strong>{workspaces.length}</strong>
          <small>{activeWorkspaces} đang hoạt động · {archivedWorkspaces} đã lưu trữ</small>
        </article>
        <article className={styles.metric}>
          <span>Thành viên đang tham gia</span>
          <strong>{workspaces.reduce((total, workspace) => total + Number(workspace.active_member_count ?? 0), 0)}</strong>
          <small>Tổng lượt thành viên trong các workspace</small>
        </article>
      </div>

      <div className={styles.shortcuts}>
        <Link className={styles.shortcut} href="/admin/accounts">
          <span className={styles.shortcutIcon}>♙</span>
          <span>
            <b>Quản lý tài khoản</b>
            <small>Xem người dùng, trạng thái email và lần đăng nhập gần nhất; tạm khóa hoặc mở lại tài khoản.</small>
          </span>
          <span className={styles.arrow}>↗</span>
        </Link>
        <Link className={styles.shortcut} href="/admin/workspaces">
          <span className={styles.shortcutIcon}>⌂</span>
          <span>
            <b>Quản lý toàn bộ workspace</b>
            <small>Xem người tạo, số thành viên, trạng thái và lưu trữ hoặc khôi phục workspace.</small>
          </span>
          <span className={styles.arrow}>↗</span>
        </Link>
      </div>

      <div className={styles.note}>
        <b>Ranh giới quyền hạn</b>
        <p>Admin quản trị toàn nền tảng. User vẫn tự tạo và quản lý workspace của mình; quyền Owner/Admin bên trong workspace không thay thế quyền Admin nền tảng.</p>
      </div>
    </section>
  );
}
