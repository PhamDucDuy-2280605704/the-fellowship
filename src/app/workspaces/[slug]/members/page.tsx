import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";
import { WorkspaceNav } from "@/components/workspace-nav";
import { CopyLinkButton } from "@/components/copy-link-button";
import {
  createWorkspaceInvitation,
  leaveWorkspace,
  removeWorkspaceMember,
  revokeWorkspaceInvitation,
  updateWorkspaceMemberRole,
} from "@/features/workspaces/member-actions";
import styles from "../../../workspaces.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thành viên workspace", robots: { index: false, follow: false } };

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ invite?: string; notice?: string; error?: string }>;

export default async function WorkspaceMembersPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const { supabase, user } = await requireActiveUser();
  const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id,name,slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!workspace) notFound();

  const { data: members, error } = await supabase.rpc("list_workspace_members", {
    p_workspace_id: workspace.id,
  });
  if (error || !members) notFound();

  const me = members.find((member) => member.user_id === user.id);
  if (!me && !isPlatformAdmin) notFound();

  const canManage = isPlatformAdmin || me?.role === "owner" || me?.role === "admin";
  const canPromoteAdmin = isPlatformAdmin || me?.role === "owner";
  const invitationsResult = canManage
    ? await supabase.rpc("list_workspace_invitations", { p_workspace_id: workspace.id })
    : { data: [], error: null };
  const invitations = invitationsResult.data ?? [];
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  const siteUrl = (configuredSiteUrl || (deploymentHost ? `https://${deploymentHost}` : "http://localhost:3000")).replace(/\/+$/, "");
  const inviteUrl = query.invite ? new URL(`/invite/${query.invite}`, siteUrl).toString() : null;

  const message = query.error === "invite-failed" ? "Không thể tạo lời mời. Kiểm tra vai trò của anh và thử lại."
    : query.error === "invalid-invitation" ? "Thông tin lời mời chưa hợp lệ."
    : query.error === "role-update" ? "Không thể đổi vai trò thành viên."
    : query.error === "remove-failed" ? "Không thể gỡ thành viên. Owner không thể bị gỡ khỏi workspace."
    : query.error === "revoke-failed" ? "Không thể thu hồi lời mời."
    : query.notice === "invitation-revoked" ? "Đã thu hồi lời mời."
    : query.notice === "joined" ? "Bạn đã tham gia workspace."
    : query.notice === "role-updated" ? "Đã cập nhật vai trò thành viên."
    : query.notice === "member-removed" ? "Đã gỡ thành viên khỏi workspace."
    : null;

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
        <p className={styles.eyebrow}>THE FELLOWSHIP · PEOPLE & TRUST</p>
        <h1>Những người đồng hành.</h1>
        <p>Thành viên, vai trò và lời mời tham gia workspace.</p>
      </section>
      <WorkspaceNav slug={slug} active="members" />

      {message && <p className={query.error ? styles.error : styles.success} role={query.error ? "alert" : "status"}>{message}</p>}

      {inviteUrl && (
        <section className={styles.inviteReveal}>
          <div>
            <p className={styles.eyebrow}>INVITATION CREATED</p>
            <h2>Lời mời đã sẵn sàng.</h2>
            <p>Liên kết dùng một lần, hết hạn sau 7 ngày và chỉ tài khoản có email được mời mới chấp nhận được.</p>
          </div>
          <code>{inviteUrl}</code>
          <CopyLinkButton value={inviteUrl} />
        </section>
      )}

      <section className={styles.moduleColumns}>
        <div className={styles.moduleMain}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>THE COMPANY</p>
              <h2>Thành viên workspace</h2>
            </div>
            <span className={styles.count}>{members.filter((member) => member.status === "active").length.toString().padStart(2, "0")}</span>
          </div>
          <div className={styles.memberList}>
            {members.map((member) => (
              <article className={styles.memberRow} key={member.user_id}>
                <div className={styles.memberAvatar}>{(member.display_name || member.email || "U").slice(0,1).toUpperCase()}</div>
                <div className={styles.memberIdentity}>
                  <b>{member.display_name || "Thành viên"}</b>
                  <span>{member.email}</span>
                </div>
                <span className={member.role === "owner" ? styles.ownerBadge : styles.memberBadge}>
                  {member.role === "owner" ? "Owner" : member.role === "admin" ? "Admin" : member.role === "viewer" ? "Viewer" : "Member"}
                </span>
                <span className={member.status === "active" ? styles.statusActive : styles.statusRemoved}>
                  {member.status === "active" ? "Đang tham gia" : "Đã rời"}
                </span>
                {canManage && member.status === "active" && member.role !== "owner" && member.user_id !== user.id && (
                  <div className={styles.memberActions}>
                    <form action={updateWorkspaceMemberRole}>
                      <input type="hidden" name="workspaceId" value={workspace.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="userId" value={member.user_id} />
                      <select name="role" defaultValue={member.role} aria-label={`Vai trò của ${member.email}`}>
                        {canPromoteAdmin && <option value="admin">Admin</option>}
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button type="submit" className={styles.smallButton}>Lưu</button>
                    </form>
                    <form action={removeWorkspaceMember}>
                      <input type="hidden" name="workspaceId" value={workspace.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="userId" value={member.user_id} />
                      <button type="submit" className={styles.removeButton}>Gỡ</button>
                    </form>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        <aside className={styles.modulePanel}>
          <p className={styles.eyebrow}>GROW THE COMPANY</p>
          <h2>Mời đồng đội.</h2>
          <p>Người được mời cần đăng nhập bằng đúng email nhận lời mời. Owner có thể cấp vai trò Admin; Admin có thể mời Member hoặc Viewer.</p>
          {canManage ? (
            <form action={createWorkspaceInvitation} className={styles.moduleForm}>
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <input type="hidden" name="slug" value={slug} />
              <label htmlFor="invite-email">Email người được mời</label>
              <input id="invite-email" type="email" name="email" required maxLength={254} placeholder="name@example.com" />
              <label htmlFor="invite-role">Vai trò</label>
              <select id="invite-role" name="role" defaultValue="member">
                {canPromoteAdmin && <option value="admin">Admin</option>}
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              <button className={styles.primaryButton} type="submit">Tạo lời mời <span>→</span></button>
            </form>
          ) : (
            <p className={styles.permissionNote}>Chỉ Owner và Admin của workspace mới có thể mời thành viên.</p>
          )}
        </aside>
        {canManage && (
          <section className={styles.pendingInvites}>
            <div className={styles.sectionHeading}>
              <div><p className={styles.eyebrow}>OPEN INVITATIONS</p><h2>Lời mời đang chờ</h2></div>
              <span className={styles.count}>{invitations.length.toString().padStart(2, "0")}</span>
            </div>
            {!invitations.length ? (
              <p className={styles.permissionNote}>Không có lời mời nào đang chờ.</p>
            ) : invitations.map((invitation) => (
              <article className={styles.pendingInviteRow} key={invitation.id}>
                <div><b>{invitation.email}</b><span>{invitation.role} · Hết hạn {new Date(invitation.expires_at).toLocaleDateString("vi-VN")}</span></div>
                <form action={revokeWorkspaceInvitation}>
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <button className={styles.removeButton} type="submit">Thu hồi</button>
                </form>
              </article>
            ))}
          </section>
        )}
        <section className={styles.leavePanel}>
          <div>
            <p className={styles.eyebrow}>YOUR MEMBERSHIP</p>
            <h2>Rời workspace</h2>
            <p>Owner cần chuyển quyền sở hữu trước khi rời đi. Thành viên khác có thể tự rời workspace.</p>
          </div>
          {me && me.role !== "owner" && (
            <form action={leaveWorkspace}>
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <button className={styles.removeButton} type="submit">Rời khỏi workspace</button>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}
