import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";
import { WorkspaceNav } from "@/components/navigation/workspace-nav";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { archiveNote, createNote, updateNote } from "@/features/archives/actions";
import styles from "../../../workspaces.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "The Archives", robots: { index: false, follow: false } };
type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ error?: string; q?: string; tag?: string }>;

export default async function ArchivesPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const searchTerm = (query.q ?? "").trim().slice(0, 120);
  const tagFilter = (query.tag ?? "").trim().toLocaleLowerCase("vi").slice(0, 32);
  const { supabase, user, isPlatformAdmin } = await requireActiveUser({ allowPlatformAdmin: true });
  const { data: workspace } = await supabase.from("workspaces").select("id,name").eq("slug",slug).maybeSingle();
  if (!workspace) notFound();

  const [membershipResult, notesQuery, goalsResult, questsResult, proposalsResult] = await Promise.all([
    supabase.from("workspace_members").select("role").eq("workspace_id",workspace.id).eq("user_id",user.id).eq("status","active").maybeSingle(),
    (() => {
      let request = supabase.from("notes")
        .select("id,title,content,tags,goal_id,quest_id,council_proposal_id,created_at,updated_at,archived_at,created_by")
        .eq("workspace_id",workspace.id)
        .order("updated_at",{ascending:false})
        .limit(150);
      if (searchTerm) request = request.textSearch("search_vector", searchTerm, { config: "simple", type: "websearch" });
      if (tagFilter) request = request.contains("tags", [tagFilter]);
      return request;
    })(),
    supabase.from("goals").select("id,title").eq("workspace_id",workspace.id).order("created_at",{ascending:false}),
    supabase.from("quests").select("id,title").eq("workspace_id",workspace.id).order("created_at",{ascending:false}),
    supabase.from("council_proposals").select("id,title").eq("workspace_id",workspace.id).order("created_at",{ascending:false}),
  ]);
  const membership = membershipResult.data;
  if (!membership && !isPlatformAdmin) notFound();
  const canWrite = isPlatformAdmin || ["owner","admin","member"].includes(membership?.role ?? "");
  const notes = notesQuery.data ?? [];
  const activeNotes = notes.filter((note) => !note.archived_at);
  const archivedNotes = notes.filter((note) => !!note.archived_at);
  const goals = goalsResult.data ?? [];
  const quests = questsResult.data ?? [];
  const proposals = proposalsResult.data ?? [];
  const goalNames = new Map(goals.map((item) => [item.id,item.title]));
  const questNames = new Map(quests.map((item) => [item.id,item.title]));
  const proposalNames = new Map(proposals.map((item) => [item.id,item.title]));
  const errorMessage = query.error === "update" ? "Chưa thể cập nhật ghi chú. Kiểm tra liên kết và quyền truy cập."
    : query.error === "archive" ? "Chưa thể thay đổi trạng thái lưu trữ."
    : query.error ? "Không thể lưu ghi chú. Hãy kiểm tra nội dung và thử lại." : null;

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
        <p className={styles.eyebrow}>THE ARCHIVES · MEMORY THAT ENDURES</p>
        <h1>Những điều không muốn quên.</h1>
        <p>Tri thức được gắn thẻ, liên kết với Goals, Quests và quyết định để dễ tìm, dễ kế thừa và không bị thất lạc.</p>
      </section>
      <WorkspaceNav slug={slug} active="archives" />
      {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}
      {notesQuery.error && <p className={styles.error} role="alert">Chưa tải được Archives. Hãy thử tải lại trang.</p>}

      <section className={styles.archiveToolbar}>
        <form method="get" className={styles.archiveSearch}>
          <label htmlFor="archive-search">Tìm trong kho tri thức</label>
          <div><input id="archive-search" name="q" type="search" defaultValue={searchTerm} placeholder="Tìm tiêu đề, nội dung hoặc thẻ…" />
          <button type="submit" className={styles.smallButton}>Tìm kiếm</button></div>
        </form>
        {tagFilter && <Link className={styles.clearFilter} href={`/workspaces/${slug}/archives`}>Bỏ lọc #{tagFilter} ×</Link>}
        <span className={styles.archiveCount}>{activeNotes.length} ghi chú đang hoạt động · tối đa 150 kết quả gần nhất</span>
      </section>

      <section className={styles.moduleColumns}>
        <div className={styles.moduleMain}>
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>COLLECTED KNOWLEDGE</p><h2>Kho tri thức của nhóm</h2></div>
            <span className={styles.count}>{activeNotes.length} NOTES</span>
          </div>
          {!activeNotes.length ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyMark}>✧</span>
              <h3>{searchTerm || tagFilter ? "Không tìm thấy ghi chú phù hợp." : "Trang lưu trữ vẫn đang chờ."}</h3>
              <p>{searchTerm || tagFilter ? "Thử từ khóa hoặc thẻ khác." : "Ghi lại điều nhóm đã học, lý do đằng sau một lựa chọn hoặc cách làm nên được kế thừa."}</p>
            </div>
          ) : (
            <div className={styles.recordList}>
              {activeNotes.map((note) => {
                const linked = [
                  note.goal_id ? { label: "Goal", title: goalNames.get(note.goal_id), href: `/workspaces/${slug}/goals` } : null,
                  note.quest_id ? { label: "Quest", title: questNames.get(note.quest_id), href: `/workspaces/${slug}/quests` } : null,
                  note.council_proposal_id ? { label: "Council", title: proposalNames.get(note.council_proposal_id), href: `/workspaces/${slug}/council` } : null,
                ].filter((item): item is {label:string;title:string;href:string} => Boolean(item?.title));
                return (
                  <article className={styles.noteCard} key={note.id}>
                    <div className={styles.recordTop}><span className={styles.statusPill}>GHI CHÚ</span><span className={styles.recordDate}>{new Date(note.updated_at).toLocaleDateString("vi-VN")}</span></div>
                    <h3>{note.title}</h3>
                    <MarkdownContent content={note.content} />
                    {!!note.tags?.length && <div className={styles.noteTags}>{note.tags.map((tag) => <Link key={tag} href={`/workspaces/${slug}/archives?tag=${encodeURIComponent(tag)}`}>#{tag}</Link>)}</div>}
                    {!!linked.length && <div className={styles.noteLinks}>{linked.map((item) => <span key={item.label}><b>{item.label}:</b> <Link href={item.href}>{item.title}</Link></span>)}</div>}
                    {canWrite && (
                      <div className={styles.noteActions}>
                        <details className={styles.noteEdit}>
                          <summary>Chỉnh sửa ghi chú</summary>
                          <form action={updateNote} className={styles.moduleForm}>
                            <input type="hidden" name="workspaceId" value={workspace.id} />
                            <input type="hidden" name="slug" value={slug} />
                            <input type="hidden" name="noteId" value={note.id} />
                            <label htmlFor={`edit-title-${note.id}`}>Tiêu đề</label>
                            <input id={`edit-title-${note.id}`} name="title" required minLength={2} maxLength={160} defaultValue={note.title} />
                            <label htmlFor={`edit-content-${note.id}`}>Nội dung Markdown</label>
                            <textarea id={`edit-content-${note.id}`} name="content" rows={8} maxLength={40000} defaultValue={note.content} />
                            <label htmlFor={`edit-tags-${note.id}`}>Thẻ (phân tách bằng dấu phẩy)</label>
                            <input id={`edit-tags-${note.id}`} name="tags" defaultValue={(note.tags ?? []).join(", ")} />
                            <label htmlFor={`edit-goal-${note.id}`}>Liên kết Goal</label>
                            <select id={`edit-goal-${note.id}`} name="goalId" defaultValue={note.goal_id ?? ""}><option value="">Không liên kết</option>{goals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
                            <label htmlFor={`edit-quest-${note.id}`}>Liên kết Quest</label>
                            <select id={`edit-quest-${note.id}`} name="questId" defaultValue={note.quest_id ?? ""}><option value="">Không liên kết</option>{quests.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
                            <label htmlFor={`edit-proposal-${note.id}`}>Liên kết quyết định Council</label>
                            <select id={`edit-proposal-${note.id}`} name="proposalId" defaultValue={note.council_proposal_id ?? ""}><option value="">Không liên kết</option>{proposals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
                            <button type="submit" className={styles.primaryButton}>Lưu thay đổi <span>→</span></button>
                          </form>
                        </details>
                        <form action={archiveNote}>
                          <input type="hidden" name="workspaceId" value={workspace.id} />
                          <input type="hidden" name="slug" value={slug} />
                          <input type="hidden" name="noteId" value={note.id} />
                          <input type="hidden" name="shouldArchive" value="true" />
                          <button type="submit" className={styles.textButton}>Lưu trữ ↗</button>
                        </form>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
          {archivedNotes.length > 0 && (
            <details className={styles.archivedList}>
              <summary>Ghi chú đã lưu trữ ({archivedNotes.length})</summary>
              {archivedNotes.map((note) => (
                <article className={styles.archivedNote} key={note.id}>
                  <b>{note.title}</b>
                  {canWrite && <form action={archiveNote}>
                    <input type="hidden" name="workspaceId" value={workspace.id} />
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="noteId" value={note.id} />
                    <input type="hidden" name="shouldArchive" value="false" />
                    <button type="submit" className={styles.textButton}>Khôi phục</button>
                  </form>}
                </article>
              ))}
            </details>
          )}
        </div>
        <aside className={styles.modulePanel}>
          <p className={styles.eyebrow}>KEEP WHAT MATTERS</p>
          <h2>Ghi lại tri thức.</h2>
          <p>Hỗ trợ Markdown, thẻ tìm kiếm và liên kết chéo với nội dung trong cùng workspace.</p>
          {canWrite ? (
            <form action={createNote} className={styles.moduleForm}>
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <input type="hidden" name="slug" value={slug} />
              <label htmlFor="note-title">Tiêu đề</label>
              <input id="note-title" name="title" required minLength={2} maxLength={160} />
              <label htmlFor="note-content">Nội dung Markdown</label>
              <textarea id="note-content" name="content" rows={9} maxLength={40000} placeholder={"## Bối cảnh\nĐiều gì đã xảy ra?\n\n## Bài học\nĐiều gì nên được kế thừa?"} />
              <label htmlFor="note-tags">Thẻ (phân tách bằng dấu phẩy)</label>
              <input id="note-tags" name="tags" placeholder="quy-trinh, bai-hoc, quyet-dinh" />
              <label htmlFor="note-goal">Liên kết Goal</label>
              <select id="note-goal" name="goalId" defaultValue=""><option value="">Không liên kết</option>{goals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
              <label htmlFor="note-quest">Liên kết Quest</label>
              <select id="note-quest" name="questId" defaultValue=""><option value="">Không liên kết</option>{quests.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
              <label htmlFor="note-proposal">Liên kết Council</label>
              <select id="note-proposal" name="proposalId" defaultValue=""><option value="">Không liên kết</option>{proposals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
              <button type="submit" className={styles.primaryButton}>Lưu vào Archives <span>→</span></button>
            </form>
          ) : <p className={styles.permissionNote}>Viewer chỉ có thể đọc ghi chú.</p>}
        </aside>
      </section>
    </main>
  );
}
