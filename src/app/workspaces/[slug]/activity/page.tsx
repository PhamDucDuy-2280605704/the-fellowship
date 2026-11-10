import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";
import { WorkspaceNav } from "@/components/workspace-nav";
import styles from "../../../workspaces.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hoạt động workspace", robots: { index: false, follow: false } };
type Params = Promise<{ slug: string }>;

const entityLabels: Record<string,string> = { goal: "Goal", quest: "Quest", note: "Ghi chú", proposal: "Đề xuất" };
const actionLabels: Record<string,string> = { created: "đã tạo", updated: "đã cập nhật", status_changed: "đã đổi trạng thái" };

export default async function WorkspaceActivityPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { supabase, user } = await requireActiveUser();
  const [{ data: workspace }, { data: isPlatformAdmin }] = await Promise.all([
    supabase.from("workspaces").select("id,name").eq("slug",slug).maybeSingle(),
    supabase.rpc("is_platform_admin"),
  ]);
  if (!workspace) notFound();

  const [membershipResult, activityResult] = await Promise.all([
    supabase.from("workspace_members").select("role").eq("workspace_id",workspace.id).eq("user_id",user.id).eq("status","active").maybeSingle(),
    supabase.rpc("list_workspace_activity",{p_workspace_id:workspace.id}),
  ]);
  if (!membershipResult.data && !isPlatformAdmin) notFound();

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
        <p className={styles.eyebrow}>THE FELLOWSHIP · THE PASSAGE OF TIME</p>
        <h1>Mỗi bước đều để lại dấu chân.</h1>
        <p>Dòng thời gian ghi lại những thay đổi chính trong Goals, Quests, Archives và The Council.</p>
      </section>
      <WorkspaceNav slug={slug} active="activity" />
      {activityResult.error && <p className={styles.error} role="alert">Chưa thể tải lịch sử hoạt động.</p>}
      {!activityResult.data?.length ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyMark}>✧</span><h3>Hành trình vừa bắt đầu.</h3>
          <p>Khi nhóm tạo Goals, Quests, ghi chú hoặc đề xuất, những dấu mốc sẽ xuất hiện ở đây.</p>
        </div>
      ) : (
        <section className={styles.timeline}>
          {activityResult.data.map((event) => (
            <article className={styles.timelineItem} key={event.id}>
              <span className={styles.timelineDot} aria-hidden="true" />
              <div className={styles.timelineBody}>
                <div className={styles.recordTop}>
                  <span className={styles.statusPill}>{entityLabels[event.entity_type] ?? event.entity_type}</span>
                  <time className={styles.recordDate} dateTime={event.created_at}>
                    {new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(event.created_at))}
                  </time>
                </div>
                <p><b>{event.actor_display_name || "Thành viên nhóm"}</b> {actionLabels[event.action] ?? "đã thay đổi"} <strong>{event.title}</strong></p>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
