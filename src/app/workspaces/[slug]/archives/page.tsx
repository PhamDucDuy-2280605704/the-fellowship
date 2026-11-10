import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";
import { WorkspaceNav } from "@/components/workspace-nav";
import { archiveNote, createNote } from "@/features/archives/actions";
import styles from "../../../workspaces.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "The Archives", robots: { index: false, follow: false } };
type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ error?: string }>;

export default async function ArchivesPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const { supabase, user } = await requireActiveUser();
  const [{ data: workspace }, { data: isPlatformAdmin }] = await Promise.all([
    supabase.from("workspaces").select("id,name").eq("slug",slug).maybeSingle(),
    supabase.rpc("is_platform_admin"),
  ]);
  if (!workspace) notFound();

  const [membershipResult, notesResult] = await Promise.all([
    supabase.from("workspace_members").select("role").eq("workspace_id",workspace.id).eq("user_id",user.id).eq("status","active").maybeSingle(),
    supabase.from("notes").select("id,title,content,created_at,updated_at,archived_at,created_by").eq("workspace_id",workspace.id).order("updated_at",{ascending:false}),
  ]);
  const membership = membershipResult.data;
  if (!membership && !isPlatformAdmin) notFound();
  const canWrite = isPlatformAdmin || ["owner","admin","member"].includes(membership?.role ?? "");
  const activeNotes = (notesResult.data ?? []).filter((note) => !note.archived_at);
  const archivedNotes = (notesResult.data ?? []).filter((note) => !!note.archived_at);

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
        <p>Ghi chú và quyết định được giữ lại cùng ngữ cảnh của hành trình, để tri thức không trôi đi sau mỗi dự án.</p>
      </section>
      <WorkspaceNav slug={slug} active="archives" />
      {query.error && <p className={styles.error} role="alert">Không thể lưu ghi chú. Hãy kiểm tra nội dung và thử lại.</p>}
      {notesResult.error && <p className={styles.error} role="alert">Chưa tải được Archives.</p>}

      <section className={styles.moduleColumns}>
        <div className={styles.moduleMain}>
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>COLLECTED KNOWLEDGE</p><h2>Kho tri thức của nhóm</h2></div>
            <span className={styles.count}>{activeNotes.length} NOTES</span>
          </div>
          {!activeNotes.length ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyMark}>✧</span><h3>Trang lưu trữ vẫn đang chờ.</h3>
              <p>Ghi lại điều nhóm đã học, lý do đằng sau một lựa chọn hoặc cách làm nên được kế thừa.</p>
            </div>
          ) : (
            <div className={styles.recordList}>
              {activeNotes.map((note) => (
                <article className={styles.noteCard} key={note.id}>
                  <div className={styles.recordTop}><span className={styles.statusPill}>GHI CHÚ</span><span className={styles.recordDate}>{new Date(note.updated_at).toLocaleDateString("vi-VN")}</span></div>
                  <h3>{note.title}</h3>
                  <p className={styles.noteContent}>{note.content}</p>
                  {canWrite && (
                    <form action={archiveNote}>
                      <input type="hidden" name="workspaceId" value={workspace.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="noteId" value={note.id} />
                      <input type="hidden" name="shouldArchive" value="true" />
                      <button type="submit" className={styles.textButton}>Lưu trữ ghi chú ↗</button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          )}
          {archivedNotes.length > 0 && (
            <details className={styles.archivedList}>
              <summary>Ghi chú đã lưu trữ ({archivedNotes.length})</summary>
              {archivedNotes.map((note) => (
                <article className={styles.archivedNote} key={note.id}>
                  <b>{note.title}</b>
                  <form action={archiveNote}>
                    <input type="hidden" name="workspaceId" value={workspace.id} />
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="noteId" value={note.id} />
                    <input type="hidden" name="shouldArchive" value="false" />
                    <button type="submit" className={styles.textButton}>Khôi phục</button>
                  </form>
                </article>
              ))}
            </details>
          )}
        </div>
        <aside className={styles.modulePanel}>
          <p className={styles.eyebrow}>KEEP WHAT MATTERS</p>
          <h2>Ghi lại tri thức.</h2>
          <p>Hỗ trợ Markdown dạng văn bản thuần. Hãy lưu cả kết luận lẫn lý do, bối cảnh và điều nhóm học được.</p>
          {canWrite ? (
            <form action={createNote} className={styles.moduleForm}>
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <input type="hidden" name="slug" value={slug} />
              <label htmlFor="note-title">Tiêu đề</label>
              <input id="note-title" name="title" required minLength={2} maxLength={160} />
              <label htmlFor="note-content">Nội dung</label>
              <textarea id="note-content" name="content" rows={10} maxLength={40000} placeholder={"## Bối cảnh\nĐiều gì đã xảy ra?\n\n## Bài học\nĐiều gì nên được kế thừa?"} />
              <button type="submit" className={styles.primaryButton}>Lưu vào Archives <span>→</span></button>
            </form>
          ) : <p className={styles.permissionNote}>Viewer chỉ có thể đọc ghi chú.</p>}
        </aside>
      </section>
    </main>
  );
}
