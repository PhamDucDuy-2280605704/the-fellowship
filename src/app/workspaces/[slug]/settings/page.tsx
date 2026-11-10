import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";
import { WorkspaceNav } from "@/components/workspace-nav";
import { leaveWorkspace } from "@/features/workspaces/member-actions";
import { updateWorkspaceDetails } from "@/features/workspaces/settings-actions";
import styles from "../../../workspaces.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cài đặt workspace", robots: { index: false, follow: false } };
type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

export default async function WorkspaceSettingsPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const { supabase, user } = await requireActiveUser();
  const [{ data: workspace }, { data: isPlatformAdmin }] = await Promise.all([
    supabase.from("workspaces").select("id,name,slug,description,created_at").eq("slug",slug).maybeSingle(),
    supabase.rpc("is_platform_admin"),
  ]);
  if (!workspace) notFound();

  const { data: membership } = await supabase.from("workspace_members")
    .select("role").eq("workspace_id",workspace.id).eq("user_id",user.id).eq("status","active").maybeSingle();
  if (!membership && !isPlatformAdmin) notFound();
  const canManage = isPlatformAdmin || membership?.role === "owner" || membership?.role === "admin";
  const canLeave = !!membership && membership.role !== "owner";

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">✦ THE FELLOWSHIP</Link>
        <div className={styles.account}>
          {isPlatformAdmin && <Link className={styles.quietButton} href="/admin">Admin Console</Link>}
          <span>{user.email}</span><Link className={styles.quietButton} href="/workspaces">Workspace của tôi</Link>
        </div>
      </header>
      <Link className={styles.backLink} href={`/workspaces/${slug}`}>← {workspace.name}</Link>
      <section className={styles.moduleHero}>
        <p className={styles.eyebrow}>WORKSPACE SETTINGS · STEWARDSHIP</p>
        <h1>Chăm sóc không gian chung.</h1>
        <p>Thông tin và những lựa chọn nền tảng của workspace.</p>
      </section>
      <WorkspaceNav slug={slug} active="settings" />

      {query.notice === "saved" && <p className={styles.success} role="status">Đã lưu cài đặt workspace.</p>}
      {query.error && <p className={styles.error} role="alert">Không thể lưu cài đặt. Kiểm tra quyền và dữ liệu rồi thử lại.</p>}

      <section className={styles.settingsGrid}>
        <div className={styles.modulePanel}>
          <p className={styles.eyebrow}>IDENTITY OF THIS SPACE</p>
          <h2>Thông tin workspace</h2>
          <p>Thay đổi tên và mô tả không làm thay đổi đường dẫn chia sẻ.</p>
          {canManage ? (
            <form action={updateWorkspaceDetails} className={styles.moduleForm}>
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <input type="hidden" name="slug" value={slug} />
              <label htmlFor="workspace-name">Tên workspace</label>
              <input id="workspace-name" name="name" required minLength={2} maxLength={80} defaultValue={workspace.name} />
              <label htmlFor="workspace-description">Mô tả</label>
              <textarea id="workspace-description" name="description" rows={5} maxLength={1000} defaultValue={workspace.description ?? ""} />
              <button className={styles.primaryButton} type="submit">Lưu thay đổi <span>→</span></button>
            </form>
          ) : <p className={styles.permissionNote}>Chỉ Owner và Admin được chỉnh sửa thông tin workspace.</p>}
        </div>
        <aside className={styles.modulePanel}>
          <p className={styles.eyebrow}>MEMBERSHIP</p>
          <h2>Vai trò của bạn</h2>
          <p className={styles.roleSummary}>{membership?.role ?? "Platform Admin"}</p>
          <p>Workspace được tạo ngày {new Date(workspace.created_at).toLocaleDateString("vi-VN")}.</p>
          {membership?.role === "owner" ? (
            <p className={styles.permissionNote}>Bạn là Owner. Hãy chuyển quyền sở hữu trước khi rời workspace để nhóm không bị mất người quản lý.</p>
          ) : canLeave ? (
            <form action={leaveWorkspace}>
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <button className={styles.removeButton} type="submit">Rời khỏi workspace</button>
            </form>
          ) : <p className={styles.permissionNote}>Tài khoản Admin nền tảng có thể truy cập để hỗ trợ quản trị.</p>}
        </aside>
      </section>
    </main>
  );
}
