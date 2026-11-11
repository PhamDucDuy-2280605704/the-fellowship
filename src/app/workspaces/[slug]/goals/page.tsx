import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";
import { WorkspaceNav } from "@/components/navigation/workspace-nav";
import { createGoal, updateGoalStatus } from "@/features/goals/actions";
import styles from "../../../workspaces.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Goals", robots: { index: false, follow: false } };
type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ error?: string }>;

const statusLabels: Record<string,string> = {
  draft: "Bản nháp", active: "Đang theo đuổi", on_hold: "Tạm dừng", completed: "Hoàn thành", archived: "Lưu trữ",
};

export default async function GoalsPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const { supabase, user, isPlatformAdmin } = await requireActiveUser({ allowPlatformAdmin: true });
  const { data: workspace } = await supabase.from("workspaces").select("id,name").eq("slug",slug).maybeSingle();
  if (!workspace) notFound();

  const [{ data: membership }, { data: goals, error }] = await Promise.all([
    supabase.from("workspace_members").select("role").eq("workspace_id",workspace.id).eq("user_id",user.id).eq("status","active").maybeSingle(),
    supabase.from("goals").select("id,title,description,status,target_date,created_at,created_by").eq("workspace_id",workspace.id).order("created_at",{ascending:false}),
  ]);
  if (!membership && !isPlatformAdmin) notFound();
  const canWrite = isPlatformAdmin || ["owner","admin","member"].includes(membership?.role ?? "");

  return (
    <main className={`${styles.page} ${styles.bgStrategy}`}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">✦ THE FELLOWSHIP</Link>
        <div className={styles.account}>
          {isPlatformAdmin && <Link className={styles.quietButton} href="/admin">Admin Console</Link>}
          <span>{user.email}</span>
          <Link className={styles.quietButton} href="/workspaces">Workspace của tôi</Link>
        </div>
      </header>
      <Link className={styles.backLink} href={`/workspaces/${slug}`}>← {workspace.name}</Link>
      <section className={styles.moduleHero}>
        <p className={styles.eyebrow}>THE FELLOWSHIP · NORTH STARS</p>
        <h1>Những điều ta cùng hướng tới.</h1>
        <p>Goals giữ cho cả nhóm nhìn về cùng một kết quả, không chỉ chạy theo danh sách việc cần làm.</p>
      </section>
      <WorkspaceNav slug={slug} active="goals" />
      {query.error && <p className={styles.error} role="alert">Không thể lưu Goal. Hãy kiểm tra dữ liệu và quyền trong workspace.</p>}
      {error && <p className={styles.error} role="alert">Chưa tải được danh sách Goals.</p>}

      <section className={styles.moduleColumns}>
        <div className={styles.moduleMain}>
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>SHARED DIRECTION</p><h2>Mục tiêu của nhóm</h2></div>
            <span className={styles.count}>{goals?.length ?? 0} GOALS</span>
          </div>
          {!goals?.length ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyMark}>✧</span>
              <h3>Chưa có mục tiêu nào.</h3>
              <p>Bắt đầu bằng một kết quả đủ rõ để mọi thành viên có thể cùng đóng góp.</p>
            </div>
          ) : (
            <div className={styles.recordList}>
              {goals.map((goal) => (
                <article className={styles.recordCard} key={goal.id}>
                  <div className={styles.recordTop}>
                    <span className={styles.statusPill}>{statusLabels[goal.status] ?? goal.status}</span>
                    <span className={styles.recordDate}>{goal.target_date ? `Mốc ${new Date(goal.target_date).toLocaleDateString("vi-VN")}` : "Chưa đặt thời hạn"}</span>
                  </div>
                  <h3>{goal.title}</h3>
                  {goal.description && <p className={styles.recordDescription}>{goal.description}</p>}
                  {canWrite && (
                    <form action={updateGoalStatus} className={styles.inlineControls}>
                      <input type="hidden" name="workspaceId" value={workspace.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="goalId" value={goal.id} />
                      <select name="status" defaultValue={goal.status} aria-label={`Trạng thái Goal ${goal.title}`}>
                        {Object.entries(statusLabels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}
                      </select>
                      <button className={styles.smallButton} type="submit">Cập nhật</button>
                    </form>
                  )}
                  <Link className={styles.textLink} href={`/workspaces/${slug}/quests?goal=${goal.id}`}>Xem các Quest liên quan ↗</Link>
                </article>
              ))}
            </div>
          )}
        </div>
        <aside className={styles.modulePanel}>
          <p className={styles.eyebrow}>SET A NORTH STAR</p>
          <h2>Tạo một Goal.</h2>
          <p>Mô tả kết quả cần đạt. Công việc cụ thể sẽ được chia thành các Quest.</p>
          {canWrite ? (
            <form action={createGoal} className={styles.moduleForm}>
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <input type="hidden" name="slug" value={slug} />
              <label htmlFor="goal-title">Tên mục tiêu</label>
              <input id="goal-title" name="title" required minLength={2} maxLength={140} />
              <label htmlFor="goal-description">Mô tả</label>
              <textarea id="goal-description" name="description" rows={4} maxLength={4000} />
              <label htmlFor="goal-date">Ngày mục tiêu</label>
              <input id="goal-date" type="date" name="targetDate" />
              <button type="submit" className={styles.primaryButton}>Tạo Goal <span>→</span></button>
            </form>
          ) : <p className={styles.permissionNote}>Viewer chỉ có thể xem mục tiêu.</p>}
        </aside>
      </section>
    </main>
  );
}
