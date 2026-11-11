import Link from "next/link";
import { notFound } from "next/navigation";
import { setWorkspaceArchived } from "../../actions";
import { requirePlatformAdmin } from "@/lib/auth/platform";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Chi tiết workspace", robots: { index: false, follow: false } };
type Params = Promise<{ workspaceId: string }>;

function dateLabel(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminWorkspaceDetailPage({ params }: { params: Params }) {
  const { workspaceId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) notFound();
  const { supabase } = await requirePlatformAdmin();
  const [{ data: allWorkspaces, error: workspaceError }, { data: members, error: membersError }] = await Promise.all([
    supabase.rpc("admin_list_workspaces"),
    supabase.rpc("admin_list_workspace_members", { p_workspace_id: workspaceId }),
  ]);
  if (workspaceError) throw new Error("Unable to load workspace administration data.");
  const workspace = (allWorkspaces ?? []).find((item) => item.workspace_id === workspaceId);
  if (!workspace) notFound();
  const activeCount = (members ?? []).filter((member) => member.membership_status === "active").length;

  return (
    <section className={styles.content}>
      <p className={styles.eyebrow}><Link href="/the-stewards-hall/workspaces">ALL WORKSPACES</Link> · STEWARD’S HALL</p>
      <div className={styles.pageHeading}>
        <div>
          <h1>{workspace.name}</h1>
          <p>/{workspace.slug} · Tạo bởi {workspace.creator_email || "Không rõ"} · {dateLabel(workspace.created_at)}</p>
          {workspace.description && <p>{workspace.description}</p>}
        </div>
        <span className={workspace.is_archived ? styles.suspendedPill : styles.activePill}>{workspace.is_archived ? "Đã lưu trữ" : "Đang hoạt động"}</span>
      </div>
      <div className={styles.metrics}>
        <article className={styles.metric}><span>Tổng thành viên</span><strong>{members?.length ?? 0}</strong><small>{activeCount} đang tham gia</small></article>
        <article className={styles.metric}><span>Trạng thái workspace</span><strong>{workspace.is_archived ? "Đã lưu" : "Mở"}</strong><small>{workspace.is_archived ? "Thành viên không thể truy cập dữ liệu workspace." : "Workspace đang hoạt động bình thường."}</small></article>
        <article className={styles.metric}><span>Chủ sở hữu</span><strong>{(members ?? []).filter((member) => member.workspace_role === "owner").length}</strong><small>{workspace.creator_email || "Tài khoản tạo workspace"}</small></article>
      </div>
      {membersError && <p className={styles.error} role="alert">Không thể tải danh sách thành viên.</p>}
      <div className={styles.pageHeading} style={{ marginTop: 38 }}>
        <div><h2>Thành viên workspace</h2><p>Kiểm tra vai trò và trạng thái tài khoản của tất cả thành viên.</p></div>
        <form action={setWorkspaceArchived}>
          <input type="hidden" name="workspaceId" value={workspace.workspace_id} />
          <input type="hidden" name="shouldArchive" value={String(!workspace.is_archived)} />
          <button className={workspace.is_archived ? styles.restoreButton : styles.dangerButton} type="submit">{workspace.is_archived ? "Khôi phục workspace" : "Lưu trữ workspace"}</button>
        </form>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Thành viên</th><th>Email</th><th>Vai trò workspace</th><th>Trạng thái tham gia</th><th>Tài khoản</th><th>Ngày tham gia</th></tr></thead>
          <tbody>
            {(members ?? []).map((member) => <tr key={member.user_id}>
              <td><b>{member.display_name || "Thành viên"}</b><small className={styles.subtleId}>{member.user_id.slice(0, 8)}…</small></td>
              <td>{member.email || "Không có email"}</td>
              <td><span className={member.workspace_role === "owner" ? styles.adminPill : styles.userPill}>{member.workspace_role}</span></td>
              <td><span className={member.membership_status === "active" ? styles.activePill : styles.suspendedPill}>{member.membership_status}</span></td>
              <td><span className={member.is_suspended ? styles.suspendedPill : styles.activePill}>{member.is_suspended ? "Tạm khóa" : "Hoạt động"}</span></td>
              <td>{dateLabel(member.joined_at)}</td>
            </tr>)}
            {(!members || members.length === 0) && <tr><td colSpan={6} className={styles.emptyCell}>Workspace chưa có thành viên.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className={styles.footnote}>Lưu trữ chặn thành viên truy cập workspace và dữ liệu bên trong nhưng không xóa dữ liệu. Admin vẫn xem được thông tin quản trị và có thể khôi phục.</p>
    </section>
  );
}
