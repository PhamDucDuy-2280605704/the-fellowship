import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";
import { WorkspaceNav } from "@/components/workspace-nav";
import {
  addQuestCheckIn,
  addQuestDependency,
  assignQuest,
  createQuest,
  updateQuestStatus,
} from "@/features/quests/actions";
import styles from "../../../workspaces.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quests", robots: { index: false, follow: false } };
type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ error?: string; goal?: string }>;

const statusLabels: Record<string,string> = {
  backlog: "Chưa bắt đầu", ready: "Sẵn sàng", in_progress: "Đang thực hiện",
  blocked: "Đang chờ", done: "Hoàn thành", cancelled: "Đã hủy",
};
const priorityLabels: Record<string,string> = { low: "Thấp", medium: "Vừa", high: "Cao", urgent: "Khẩn cấp" };

export default async function QuestsPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const { supabase, user } = await requireActiveUser();
  const { data: workspace } = await supabase.from("workspaces").select("id,name").eq("slug",slug).maybeSingle();
  if (!workspace) notFound();

  const [membershipResult, adminResult, goalsResult, questsResult, membersResult, assigneesResult, depsResult, checksResult] = await Promise.all([
    supabase.from("workspace_members").select("role").eq("workspace_id",workspace.id).eq("user_id",user.id).eq("status","active").maybeSingle(),
    supabase.rpc("is_platform_admin"),
    supabase.from("goals").select("id,title").eq("workspace_id",workspace.id).neq("status","archived").order("created_at",{ascending:false}),
    supabase.from("quests").select("id,title,description,goal_id,status,priority,due_date,created_at").eq("workspace_id",workspace.id).order("created_at",{ascending:false}),
    supabase.rpc("list_workspace_members",{p_workspace_id:workspace.id}),
    supabase.from("quest_assignees").select("quest_id,user_id").eq("workspace_id",workspace.id),
    supabase.from("quest_dependencies").select("quest_id,depends_on_quest_id").eq("workspace_id",workspace.id),
    supabase.from("quest_check_ins").select("id,quest_id,content,progress,created_at,created_by").eq("workspace_id",workspace.id).order("created_at",{ascending:false}).limit(30),
  ]);
  const membership = membershipResult.data;
  const isPlatformAdmin = adminResult.data === true;
  if (!membership && !isPlatformAdmin) notFound();
  const canWrite = isPlatformAdmin || ["owner","admin","member"].includes(membership?.role ?? "");
  const goals = goalsResult.data ?? [];
  const quests = questsResult.data ?? [];
  const members = (membersResult.data ?? []).filter((member) => member.status === "active");
  const assignees = assigneesResult.data ?? [];
  const dependencies = depsResult.data ?? [];
  const checkIns = checksResult.data ?? [];
  const memberById = new Map(members.map((member) => [member.user_id, member]));
  const questById = new Map(quests.map((quest) => [quest.id, quest]));
  const errorMessage = query.error === "assign" ? "Chưa thể giao Quest cho thành viên."
    : query.error === "dependency" ? "Phụ thuộc không hợp lệ hoặc sẽ tạo vòng lặp."
    : query.error === "checkin" ? "Chưa thể lưu cập nhật tiến độ."
    : query.error ? "Không thể lưu thay đổi. Hãy kiểm tra dữ liệu và quyền truy cập." : null;

  return (
    <main className={styles.page}>
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
        <p className={styles.eyebrow}>THE FELLOWSHIP · THE WORK ITSELF</p>
        <h1>Từng bước chân trên hành trình.</h1>
        <p>Quest biến mục tiêu thành việc cụ thể, có người đồng hành, trạng thái và tiến độ rõ ràng.</p>
      </section>
      <WorkspaceNav slug={slug} active="quests" />
      {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}
      {questsResult.error && <p className={styles.error} role="alert">Chưa tải được danh sách Quest.</p>}

      <section className={styles.moduleColumns}>
        <div className={styles.moduleMain}>
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>THE QUEST LOG</p><h2>Các Quest đang diễn ra</h2></div>
            <span className={styles.count}>{quests.length} QUESTS</span>
          </div>
          {!quests.length ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyMark}>✧</span>
              <h3>Chưa có Quest nào.</h3>
              <p>Chọn một mục tiêu, sau đó chia nhỏ thành những việc có thể bắt tay thực hiện.</p>
            </div>
          ) : (
            <div className={styles.recordList}>
              {quests.map((quest) => {
                const assigned = assignees.filter((item) => item.quest_id === quest.id);
                const questDeps = dependencies.filter((item) => item.quest_id === quest.id);
                const latestChecks = checkIns.filter((item) => item.quest_id === quest.id).slice(0,2);
                return (
                  <article className={styles.recordCard} key={quest.id}>
                    <div className={styles.recordTop}>
                      <span className={styles.statusPill}>{statusLabels[quest.status] ?? quest.status}</span>
                      <span className={quest.priority === "urgent" || quest.priority === "high" ? styles.priorityHigh : styles.recordDate}>
                        {priorityLabels[quest.priority] ?? quest.priority}
                      </span>
                    </div>
                    <h3>{quest.title}</h3>
                    {quest.description && <p className={styles.recordDescription}>{quest.description}</p>}
                    <div className={styles.recordMeta}>
                      {quest.goal_id ? <span>Goal: {goals.find((goal) => goal.id === quest.goal_id)?.title ?? "Đã liên kết"}</span> : <span>Chưa gắn Goal</span>}
                      <span>{quest.due_date ? `Hạn ${new Date(quest.due_date).toLocaleDateString("vi-VN")}` : "Không có hạn"}</span>
                    </div>
                    <div className={styles.assigneeLine}>
                      <b>Người thực hiện:</b> {assigned.length
                        ? assigned.map((item) => memberById.get(item.user_id)?.display_name || memberById.get(item.user_id)?.email || "Thành viên").join(", ")
                        : "Chưa giao"}
                    </div>
                    {questDeps.length > 0 && (
                      <div className={styles.assigneeLine}>
                        <b>Chờ Quest:</b> {questDeps.map((dep) => questById.get(dep.depends_on_quest_id)?.title ?? "Quest khác").join(", ")}
                      </div>
                    )}
                    {canWrite && (
                      <>
                        <form action={updateQuestStatus} className={styles.inlineControls}>
                          <input type="hidden" name="workspaceId" value={workspace.id} />
                          <input type="hidden" name="slug" value={slug} />
                          <input type="hidden" name="questId" value={quest.id} />
                          <select name="status" defaultValue={quest.status} aria-label={`Trạng thái Quest ${quest.title}`}>
                            {Object.entries(statusLabels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}
                          </select>
                          <button className={styles.smallButton} type="submit">Cập nhật</button>
                        </form>
                        <div className={styles.toolRow}>
                          <form action={assignQuest} className={styles.inlineControls}>
                            <input type="hidden" name="workspaceId" value={workspace.id} />
                            <input type="hidden" name="slug" value={slug} />
                            <input type="hidden" name="questId" value={quest.id} />
                            <select name="userId" required defaultValue="">
                              <option value="" disabled>Giao cho thành viên…</option>
                              {members.map((member) => <option value={member.user_id} key={member.user_id}>{member.display_name || member.email}</option>)}
                            </select>
                            <button className={styles.smallButton} type="submit">Giao việc</button>
                          </form>
                          {quests.length > 1 && (
                            <form action={addQuestDependency} className={styles.inlineControls}>
                              <input type="hidden" name="workspaceId" value={workspace.id} />
                              <input type="hidden" name="slug" value={slug} />
                              <input type="hidden" name="questId" value={quest.id} />
                              <select name="dependsOnQuestId" required defaultValue="">
                                <option value="" disabled>Phụ thuộc vào…</option>
                                {quests.filter((other) => other.id !== quest.id).map((other) => <option value={other.id} key={other.id}>{other.title}</option>)}
                              </select>
                              <button className={styles.smallButton} type="submit">Thêm</button>
                            </form>
                          )}
                        </div>
                        <form action={addQuestCheckIn} className={styles.checkInForm}>
                          <input type="hidden" name="workspaceId" value={workspace.id} />
                          <input type="hidden" name="slug" value={slug} />
                          <input type="hidden" name="questId" value={quest.id} />
                          <label htmlFor={`check-${quest.id}`}>Cập nhật tiến độ</label>
                          <textarea id={`check-${quest.id}`} name="content" rows={2} required maxLength={3000} placeholder="Hôm nay nhóm đã làm được gì?" />
                          <div className={styles.inlineControls}>
                            <select name="progress" defaultValue="">
                              <option value="">Không đổi %</option>
                              {[0,10,20,30,40,50,60,70,80,90,100].map((value) => <option value={value} key={value}>{value}%</option>)}
                            </select>
                            <button className={styles.smallButton} type="submit">Ghi nhận</button>
                          </div>
                        </form>
                      </>
                    )}
                    {latestChecks.length > 0 && (
                      <div className={styles.checkInHistory}>
                        <b>Nhật ký gần đây</b>
                        {latestChecks.map((check) => (
                          <p key={check.id}>{check.content}{check.progress !== null ? ` · ${check.progress}%` : ""}</p>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
        <aside className={styles.modulePanel}>
          <p className={styles.eyebrow}>MAKE PROGRESS VISIBLE</p>
          <h2>Tạo một Quest.</h2>
          <p>Mỗi Quest nên có một kết quả rõ ràng. Có thể gắn vào Goal và giao cho một thành viên.</p>
          {canWrite ? (
            <form action={createQuest} className={styles.moduleForm}>
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <input type="hidden" name="slug" value={slug} />
              <label htmlFor="quest-title">Tên Quest</label>
              <input id="quest-title" name="title" required minLength={2} maxLength={160} />
              <label htmlFor="quest-description">Mô tả</label>
              <textarea id="quest-description" name="description" rows={3} maxLength={6000} />
              <label htmlFor="quest-goal">Gắn với Goal</label>
              <select id="quest-goal" name="goalId" defaultValue={query.goal ?? ""}>
                <option value="">Chưa gắn Goal</option>
                {goals.map((goal) => <option value={goal.id} key={goal.id}>{goal.title}</option>)}
              </select>
              <label htmlFor="quest-priority">Ưu tiên</label>
              <select id="quest-priority" name="priority" defaultValue="medium">
                <option value="low">Thấp</option><option value="medium">Vừa</option><option value="high">Cao</option><option value="urgent">Khẩn cấp</option>
              </select>
              <label htmlFor="quest-date">Hạn hoàn thành</label>
              <input id="quest-date" type="date" name="dueDate" />
              <button type="submit" className={styles.primaryButton}>Tạo Quest <span>→</span></button>
            </form>
          ) : <p className={styles.permissionNote}>Viewer chỉ có thể xem Quest.</p>}
        </aside>
      </section>
    </main>
  );
}
