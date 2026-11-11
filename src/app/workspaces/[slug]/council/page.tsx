import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";
import { WorkspaceNav } from "@/components/workspace-nav";
import { LocalDateTimeOffset } from "@/components/local-datetime-offset";
import {
  castProposalVote,
  createProposal,
  decideProposal,
  setProposalStatus,
  scoreCouncilOption,
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

  const [membershipResult, proposalsResult, optionsResult, votesResult, decisionsResult, criteriaResult, scoresResult] = await Promise.all([
    supabase.from("workspace_members").select("role").eq("workspace_id",workspace.id).eq("user_id",user.id).eq("status","active").maybeSingle(),
    supabase.from("council_proposals").select("id,title,context,status,closes_at,created_at,created_by").eq("workspace_id",workspace.id).order("created_at",{ascending:false}),
    supabase.from("council_options").select("id,proposal_id,title,description").eq("workspace_id",workspace.id),
    supabase.rpc("list_council_vote_summary",{p_workspace_id:workspace.id}),
    supabase.from("council_decisions").select("proposal_id,chosen_option_id,rationale,decided_at").eq("workspace_id",workspace.id),
    supabase.from("council_criteria").select("id,proposal_id,title,weight").eq("workspace_id",workspace.id).order("created_at",{ascending:true}),
    supabase.from("council_option_scores").select("proposal_id,option_id,criterion_id,user_id,score,comment").eq("workspace_id",workspace.id),
  ]);
  const membership = membershipResult.data;
  if (!membership && !isPlatformAdmin) notFound();
  const canManage = isPlatformAdmin || membership?.role === "owner" || membership?.role === "admin";
  const canScore = isPlatformAdmin || ["owner", "admin", "member"].includes(membership?.role ?? "");
  const proposals = proposalsResult.data ?? [];
  const options = optionsResult.data ?? [];
  const votes = votesResult.data ?? [];
  const decisions = decisionsResult.data ?? [];
  const criteria = criteriaResult.data ?? [];
  const scores = scoresResult.data ?? [];
  const optionsByProposal = new Map<string, typeof options>();
  const votesByProposal = new Map<string, typeof votes>();
  const decisionsByProposal = new Map<string, typeof decisions>();
  const criteriaByProposal = new Map<string, typeof criteria>();
  const scoresByProposal = new Map<string, typeof scores>();
  for (const item of options) optionsByProposal.set(item.proposal_id, [...(optionsByProposal.get(item.proposal_id) ?? []), item]);
  for (const item of votes) votesByProposal.set(item.proposal_id, [...(votesByProposal.get(item.proposal_id) ?? []), item]);
  for (const item of decisions) decisionsByProposal.set(item.proposal_id, [...(decisionsByProposal.get(item.proposal_id) ?? []), item]);
  for (const item of criteria) criteriaByProposal.set(item.proposal_id, [...(criteriaByProposal.get(item.proposal_id) ?? []), item]);
  for (const item of scores) scoresByProposal.set(item.proposal_id, [...(scoresByProposal.get(item.proposal_id) ?? []), item]);
  const errorMessage = query.error === "vote" ? "Bạn chưa thể biểu quyết. Có thể phiên bỏ phiếu đã đóng."
    : query.error === "decision" ? "Chưa thể lưu quyết định. Hãy chọn một phương án và ghi rõ lý do."
    : query.error === "proposal" ? "Chưa thể tạo đề xuất. Kiểm tra phương án, tiêu chí và quyền thành viên."
    : query.error === "score" ? "Chưa thể lưu điểm đánh giá. Hãy kiểm tra quyền và thử lại."
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
        <p>Đưa các phương án lên bàn, chấm điểm theo tiêu chí có trọng số, biểu quyết kín và lưu lại quyết định cùng lý do.</p>
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
                const proposalOptions = optionsByProposal.get(proposal.id) ?? [];
                const proposalVotes = votesByProposal.get(proposal.id) ?? [];
                const myVote = proposalVotes.find((vote) => vote.has_my_vote);
                const decision = decisionsByProposal.get(proposal.id)?.[0];
                const proposalCriteria = criteriaByProposal.get(proposal.id) ?? [];
                const proposalScores = scoresByProposal.get(proposal.id) ?? [];
                const canVote = canScore && proposal.status === "voting" && (!proposal.closes_at || new Date(proposal.closes_at) > new Date());
                return (
                  <article className={styles.recordCard} key={proposal.id}>
                    <div className={styles.recordTop}>
                      <span className={styles.statusPill}>{statusLabels[proposal.status] ?? proposal.status}</span>
                      <span className={styles.recordDate}>{proposalVotes.length} lượt biểu quyết{proposal.closes_at ? ` · Đóng ${new Date(proposal.closes_at).toLocaleString("vi-VN")}` : ""}</span>
                    </div>
                    <h3>{proposal.title}</h3>
                    {proposal.context && <p className={styles.recordDescription}>{proposal.context}</p>}
                    {proposalCriteria.length > 0 && <div className={styles.councilCriteria}><b>Tiêu chí đánh giá có trọng số</b>{proposalCriteria.map((criterion) => <span key={criterion.id}>{criterion.title} · trọng số {criterion.weight}</span>)}</div>}
                    <div className={styles.optionList}>
                      {proposalOptions.map((option) => {
                        const optionVotes = proposalVotes.find((vote) => vote.option_id === option.id)?.vote_count ?? 0;
                        const optionScores = proposalScores.filter((score) => score.option_id === option.id);
                        const weighted = proposalCriteria.reduce((result, criterion) => {
                          const criterionScores = optionScores.filter((score) => score.criterion_id === criterion.id);
                          if (criterionScores.length) {
                            const average = criterionScores.reduce((sum, score) => sum + score.score, 0) / criterionScores.length;
                            result.weighted += average * Number(criterion.weight);
                            result.weight += Number(criterion.weight);
                          }
                          return result;
                        }, { weighted: 0, weight: 0 });
                        const weightedScore = weighted.weight ? Math.round((weighted.weighted / weighted.weight) * 20) : null;
                        return (
                          <div className={styles.optionRow} key={option.id}>
                            <div className={styles.optionCopy}>
                              <b>{option.title}</b>
                              {option.description && <span>{option.description}</span>}
                            </div>
                            <span className={styles.optionVotes}>{optionVotes} phiếu{weightedScore !== null ? ` · ${weightedScore}/100` : ""}</span>
                            {canVote && canScore && proposalCriteria.length > 0 && (
                              <div className={styles.councilScoreGrid}>
                                {proposalCriteria.map((criterion) => {
                                  const ownScore = optionScores.find((score) => score.criterion_id === criterion.id && score.user_id === user.id);
                                  return <form action={scoreCouncilOption} className={styles.councilScoreForm} key={criterion.id}>
                                    <input type="hidden" name="workspaceId" value={workspace.id} />
                                    <input type="hidden" name="slug" value={slug} />
                                    <input type="hidden" name="proposalId" value={proposal.id} />
                                    <input type="hidden" name="optionId" value={option.id} />
                                    <input type="hidden" name="criterionId" value={criterion.id} />
                                    <label htmlFor={`score-${option.id}-${criterion.id}`}>{criterion.title}</label>
                                    <select id={`score-${option.id}-${criterion.id}`} name="score" defaultValue={ownScore?.score ?? ""} required>
                                      <option value="" disabled>Điểm 0–5</option>
                                      {[0,1,2,3,4,5].map((value) => <option key={value} value={value}>{value}/5</option>)}
                                    </select>
                                    <button className={styles.smallButton} type="submit">Lưu điểm</button>
                                  </form>;
                                })}
                              </div>
                            )}
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
                        <p><strong>Phương án:</strong> {proposalOptions.find((option) => option.id === decision.chosen_option_id)?.title ?? "Đã chọn"}</p>
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
                        <label htmlFor={`followup-${proposal.id}`}>Quest theo dõi (không bắt buộc)</label>
                        <input id={`followup-${proposal.id}`} name="followupQuestTitle" maxLength={160} placeholder="Ví dụ: Triển khai phương án đã chọn" />
                        <button className={styles.primaryButton} type="submit">Ghi nhận quyết định <span>→</span></button>
                      </form>
                    )}
                    {canManage && proposal.status !== "archived" && (
                      <form action={setProposalStatus} className={styles.inlineControls}>
                        <input type="hidden" name="workspaceId" value={workspace.id} />
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="proposalId" value={proposal.id} />
                        <input type="hidden" name="status" value="archived" />
                        <button className={styles.textButton} type="submit">Lưu trữ đề xuất</button>
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
          {canScore && <form action={createProposal} className={styles.moduleForm}>
            <input type="hidden" name="workspaceId" value={workspace.id} />
            <input type="hidden" name="slug" value={slug} />
            <label htmlFor="proposal-title">Câu hỏi / đề xuất</label>
            <input id="proposal-title" name="title" required minLength={3} maxLength={180} />
            <label htmlFor="proposal-context">Bối cảnh và tiêu chí</label>
            <textarea id="proposal-context" name="context" rows={4} maxLength={8000} />
            <label htmlFor="proposal-options">Các phương án (mỗi dòng: Tiêu đề | Mô tả)</label>
            <textarea id="proposal-options" name="options" rows={5} required placeholder={"Phương án A | Mô tả ngắn\nPhương án B | Mô tả ngắn"} />
            <label htmlFor="proposal-closes">Thời điểm đóng biểu quyết (không bắt buộc)</label>
            <input id="proposal-closes" type="datetime-local" name="closesAt" />
            <LocalDateTimeOffset />
            <label htmlFor="proposal-criteria">Tiêu chí chấm điểm (mỗi dòng: Tên | Trọng số 1–100)</label>
            <textarea id="proposal-criteria" name="criteria" rows={4} placeholder={"Chi phí | 3\nTác động | 5\nKhả thi | 4"} />
            <button type="submit" className={styles.primaryButton}>Tạo đề xuất <span>→</span></button>
          </form>}
          {!canScore && <p className={styles.permissionNote}>Vai trò Viewer chỉ có thể xem đề xuất và kết quả; hãy nhờ Owner/Admin thay đổi quyền nếu cần tham gia.</p>}
        </aside>
      </section>
    </main>
  );
}
