import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";
import { WorkspaceNav } from "@/components/workspace-nav";
import {
  castProposalVote,
  createProposal,
  decideProposal,
  setProposalStatus,
} from "@/features/council/actions";
import styles from "../../../workspaces.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "The Council", robots: { index: false, follow: false } };
type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ error?: string }>;

const statusLabels: Record<string,string> = { draft: "Bản nháp", voting: "Đang biểu quyết", decided: "Đã quyết định", archived: "Lưu trữ" };

export default async function CouncilPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const { supabase, user } = await requireActiveUser();
  const [{ data: workspace }, { data: isPlatformAdmin }] = await Promise.all([
    supabase.from("workspaces").select("id,name").eq("slug",slug).maybeSingle(),
    supabase.rpc("is_platform_admin"),
  ]);
  if (!workspace) notFound();

  const [membershipResult, proposalsResult, optionsResult, votesResult, decisionsResult] = await Promise.all([
    supabase.from("workspace_members").select("role").eq("workspace_id",workspace.id).eq("user_id",user.id).eq("status","active").maybeSingle(),
    supabase.from("council_proposals").select("id,title,context,status,closes_at,created_at,created_by").eq("workspace_id",workspace.id).order("created_at",{ascending:false}),
    supabase.from("council_options").select("id,proposal_id,title,description").eq("workspace_id",workspace.id),
    supabase.from("council_votes").select("proposal_id,option_id,user_id").eq("workspace_id",workspace.id),
    supabase.from("council_decisions").select("proposal_id,chosen_option_id,rationale,decided_at").eq("workspace_id",workspace.id),
  ]);
  const membership = membershipResult.data;
  if (!membership && !isPlatformAdmin) notFound();
  const canManage = isPlatformAdmin || membership?.role === "owner" || membership?.role === "admin";
  const proposals = proposalsResult.data ?? [];
  const options = optionsResult.data ?? [];
  const votes = votesResult.data ?? [];
  const decisions = decisionsResult.data ?? [];
  const errorMessage = query.error === "vote" ? "Bạn chưa thể biểu quyết. Có thể phiên bỏ phiếu đã đóng."
    : query.error === "decision" ? "Chưa thể lưu quyết định. Hãy chọn một phương án và ghi rõ lý do."
    : query.error ? "Không thể lưu thay đổi. Kiểm tra vai trò và thông tin đã nhập." : null;

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
        <p className={styles.eyebrow}>THE COUNCIL · DELIBERATE TOGETHER</p>
        <h1>Quyết định có lý do.</h1>
        <p>Đưa các phương án lên bàn, lắng nghe tiếng nói của thành viên và lưu lại điều nhóm đã chọn — cùng lý do.</p>
      </section>
      <WorkspaceNav slug={slug} active="council" />
      {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}
      {proposalsResult.error && <p className={styles.error} role="alert">Chưa tải được các đề xuất.</p>}

      <section className={styles.moduleColumns}>
        <div className={styles.moduleMain}>
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>THE ROUND TABLE</p><h2>Đề xuất và biểu quyết</h2></div>
            <span className={styles.count}>{proposals.length} ĐỀ XUẤT</span>
          </div>
          {!proposals.length ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyMark}>✧</span><h3>Chưa có vấn đề nào trên bàn nghị sự.</h3>
              <p>Bắt đầu bằng một câu hỏi quan trọng và ít nhất hai phương án để nhóm cùng cân nhắc.</p>
            </div>
          ) : (
            <div className={styles.recordList}>
              {proposals.map((proposal) => {
                const proposalOptions = options.filter((option) => option.proposal_id === proposal.id);
                const proposalVotes = votes.filter((vote) => vote.proposal_id === proposal.id);
                const myVote = proposalVotes.find((vote) => vote.user_id === user.id);
                const decision = decisions.find((item) => item.proposal_id === proposal.id);
                const canVote = proposal.status === "voting" && (!proposal.closes_at || new Date(proposal.closes_at) > new Date());
                return (
                  <article className={styles.recordCard} key={proposal.id}>
                    <div className={styles.recordTop}>
                      <span className={styles.statusPill}>{statusLabels[proposal.status] ?? proposal.status}</span>
                      <span className={styles.recordDate}>{proposalVotes.length} lượt biểu quyết</span>
                    </div>
                    <h3>{proposal.title}</h3>
                    {proposal.context && <p className={styles.recordDescription}>{proposal.context}</p>}
                    <div className={styles.optionList}>
                      {proposalOptions.map((option) => {
                        const optionVotes = proposalVotes.filter((vote) => vote.option_id === option.id).length;
                        return (
                          <div className={styles.optionRow} key={option.id}>
                            <div className={styles.optionCopy}>
                              <b>{option.title}</b>
                              {option.description && <span>{option.description}</span>}
                            </div>
                            <span className={styles.optionVotes}>{optionVotes}</span>
                            {canVote && (
                              <form action={castProposalVote}>
                                <input type="hidden" name="workspaceId" value={workspace.id} />
                                <input type="hidden" name="slug" value={slug} />
                                <input type="hidden" name="proposalId" value={proposal.id} />
                                <input type="hidden" name="optionId" value={option.id} />
                                <button className={myVote?.option_id === option.id ? styles.votedButton : styles.smallButton} type="submit">
                                  {myVote?.option_id === option.id ? "Đã chọn" : "Chọn"}
                                </button>
                              </form>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {decision && (
                      <div className={styles.decisionNote}>
                        <b>Quyết định đã ghi nhận</b>
                        <p>{decision.rationale}</p>
                      </div>
                    )}
                    {canManage && proposal.status === "draft" && (
                      <form action={setProposalStatus} className={styles.inlineControls}>
                        <input type="hidden" name="workspaceId" value={workspace.id} />
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="proposalId" value={proposal.id} />
                        <input type="hidden" name="status" value="voting" />
                        <button className={styles.smallButton} type="submit">Mở biểu quyết</button>
                      </form>
                    )}
                    {canManage && proposal.status === "voting" && (
                      <form action={decideProposal} className={styles.decisionForm}>
                        <input type="hidden" name="workspaceId" value={workspace.id} />
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="proposalId" value={proposal.id} />
                        <label htmlFor={`chosen-${proposal.id}`}>Phương án được chọn</label>
                        <select id={`chosen-${proposal.id}`} name="optionId" required defaultValue="">
                          <option value="" disabled>Chọn phương án…</option>
                          {proposalOptions.map((option) => <option value={option.id} key={option.id}>{option.title}</option>)}
                        </select>
                        <label htmlFor={`rationale-${proposal.id}`}>Lý do quyết định</label>
                        <textarea id={`rationale-${proposal.id}`} name="rationale" rows={3} required maxLength={5000} />
                        <button className={styles.primaryButton} type="submit">Ghi nhận quyết định <span>→</span></button>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
        <aside className={styles.modulePanel}>
          <p className={styles.eyebrow}>BRING A QUESTION</p>
          <h2>Đưa vấn đề lên bàn.</h2>
          <p>Viết câu hỏi rõ ràng và mỗi phương án trên một dòng. Owner/Admin sẽ mở biểu quyết khi nhóm sẵn sàng.</p>
          <form action={createProposal} className={styles.moduleForm}>
            <input type="hidden" name="workspaceId" value={workspace.id} />
            <input type="hidden" name="slug" value={slug} />
            <label htmlFor="proposal-title">Câu hỏi / đề xuất</label>
            <input id="proposal-title" name="title" required minLength={3} maxLength={180} />
            <label htmlFor="proposal-context">Bối cảnh và tiêu chí</label>
            <textarea id="proposal-context" name="context" rows={4} maxLength={8000} />
            <label htmlFor="proposal-options">Các phương án (mỗi dòng một phương án)</label>
            <textarea id="proposal-options" name="options" rows={5} required placeholder={"Phương án A\nPhương án B"} />
            <button type="submit" className={styles.primaryButton}>Tạo đề xuất <span>→</span></button>
          </form>
          {!canManage && <p className={styles.permissionNote}>Thành viên có thể đề xuất và biểu quyết. Chỉ Owner/Admin được mở biểu quyết và chốt quyết định.</p>}
        </aside>
      </section>
    </main>
  );
}
