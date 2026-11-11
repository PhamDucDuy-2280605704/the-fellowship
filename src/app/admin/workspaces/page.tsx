import Link from "next/link";
import { deleteWorkspacePermanently, setWorkspaceArchived } from "../actions";
import { requirePlatformAdmin } from "@/lib/auth/platform";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Quản lý workspace",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ notice?: string; error?: string }>;

function dateLabel(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}

export default async function AdminWorkspacesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase } = await requirePlatformAdmin();
  const { data: workspaces, error } = await supabase.rpc("admin_list_workspaces");

  return (
    <section className={`${styles.content} ${styles.adminWorkspacesPage}`}>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>ALL SHARED SPACES</p>
          <h1>Toàn bộ workspace.</h1>
          <p>Quan sát mọi không gian do người dùng tạo, kể cả những workspace quản trị viên không trực tiếp tham gia.</p>
        </div>
        <span className={styles.counter}>{workspaces?.length ?? 0} WORKSPACES</span>
      </div>

      {params.notice === "archived" && <p className={styles.success} role="status">Workspace đã được lưu trữ.</p>}
      {params.notice === "restored" && <p className={styles.success} role="status">Workspace đã được khôi phục.</p>}
      {params.notice === "deleted" && <p className={styles.success} role="status">Workspace và toàn bộ dữ liệu liên quan đã được xóa vĩnh viễn.</p>}
      {params.error === "delete-failed" && <p className={styles.error} role="alert">Không thể xóa workspace. Hãy kiểm tra workspace và thử lại.</p>}
      {params.error === "delete-confirm" && <p className={styles.error} role="alert">Cần đánh dấu xác nhận trước khi xóa workspace.</p>}
      {params.error && params.error !== "delete-failed" && <p className={styles.error} role="alert">Không thể cập nhật workspace. Hãy tải lại và thử lại.</p>}
      {error && <p className={styles.error} role="alert">Không thể tải danh sách workspace.</p>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Workspace</th>
              <th>Người tạo</th>
              <th>Thành viên</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {(workspaces ?? []).map((workspace) => (
              <tr key={workspace.workspace_id}>
                <td>
                  <Link href={`/the-stewards-hall/workspaces/${workspace.workspace_id}`} className={styles.workspaceLink}><b>{workspace.name}</b></Link>
                  <small>/{workspace.slug}</small>
                  {workspace.description && <small>{workspace.description}</small>}
                </td>
                <td>{workspace.creator_email || "Không rõ"}</td>
                <td>{workspace.active_member_count}</td>
                <td>{dateLabel(workspace.created_at)}</td>
                <td>
                  <span className={workspace.is_archived ? styles.suspendedPill : styles.activePill}>
                    {workspace.is_archived ? "Đã lưu trữ" : "Đang hoạt động"}
                  </span>
                </td>
                <td>
                  <form action={setWorkspaceArchived}>
                    <input type="hidden" name="workspaceId" value={workspace.workspace_id} />
                    <input type="hidden" name="shouldArchive" value={String(!workspace.is_archived)} />
                    <button className={workspace.is_archived ? styles.restoreButton : styles.dangerButton} type="submit">
                      {workspace.is_archived ? "Khôi phục" : "Lưu trữ"}
                    </button>
                  </form>
                  <details style={{ marginTop: 9 }}>
                    <summary style={{ cursor: "pointer", color: "#e3ad9f", fontSize: 13 }}>Xóa vĩnh viễn</summary>
                    <form action={deleteWorkspacePermanently} style={{ display: "grid", gap: 8, marginTop: 8 }}>
                      <input type="hidden" name="workspaceId" value={workspace.workspace_id} />
                      <label style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, lineHeight: 1.5 }}>
                        <input type="checkbox" name="confirmDelete" value="yes" required style={{ marginTop: 3 }} />
                        Tôi xác nhận xóa workspace và mọi dữ liệu liên quan.
                      </label>
                      <button className={styles.dangerButton} type="submit">Xác nhận xóa</button>
                    </form>
                  </details>
                </td>
              </tr>
            ))}
            {(!workspaces || workspaces.length === 0) && (
              <tr><td colSpan={6} className={styles.emptyCell}>Chưa có workspace nào. Người dùng có thể tự tạo workspace trong khu vực làm việc.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className={styles.footnote}>Lưu trữ có thể khôi phục. Xóa vĩnh viễn sẽ xóa Goals, Quests, Council, Archives, thành viên, lời mời và lịch sử hoạt động; thao tác này không thể hoàn tác.</p>
    </section>
  );
}
