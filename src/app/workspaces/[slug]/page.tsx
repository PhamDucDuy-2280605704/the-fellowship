import Link from "next/link";
import { notFound } from "next/navigation";
import { signOut } from "@/features/auth/actions";
import { requireActiveUser } from "@/lib/auth/platform";
import { WorkspaceNav } from "@/components/navigation/workspace-nav";
import styles from "../../workspaces.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Workspace", robots: { index: false, follow: false } };

type Params = Promise<{ slug: string }>;

export default async function WorkspaceDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { supabase, user, isPlatformAdmin } = await requireActiveUser({ allowPlatformAdmin: true });
  const { data: workspace, error } = await supabase.from("workspaces").select("id,name,slug,description,created_at").eq("slug",slug).maybeSingle();
  if (error || !workspace) notFound();

  const [membershipResult, statsResult] = await Promise.all([
    supabase.from("workspace_members").select("role").eq("workspace_id",workspace.id).eq("user_id",user.id).eq("status","active").maybeSingle(),
    supabase.rpc("workspace_overview_stats",{p_workspace_id:workspace.id}),
  ]);
  const membership = membershipResult.data;
  if (!membership && !isPlatformAdmin) notFound();

  const stats = statsResult.data?.[0];
  const activeMembers = Number(stats?.active_member_count ?? 0);
  const goalCount = Number(stats?.goal_count ?? 0);
  const questCount = Number(stats?.quest_count ?? 0);
  const completedQuests = Number(stats?.completed_quest_count ?? 0);
  const openQuests = questCount - completedQuests;
  const activeNoteCount = Number(stats?.active_note_count ?? 0);
  const role = membership?.role ?? "platform admin";

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">✦ THE FELLOWSHIP</Link>
        <div className={styles.account}>
          <span>{user.email}</span>
          {isPlatformAdmin && <Link className={styles.quietButton} href="/the-stewards-hall">Admin Console</Link>}
          <form action={signOut}><button type="submit" className={styles.quietButton}>Đăng xuất</button></form>
        </div>
      </header>

      <Link className={styles.backLink} href={isPlatformAdmin ? "/the-stewards-hall/workspaces" : "/workspaces"}>← Tất cả workspace</Link>
      <section className={styles.detailHero}>
        <p className={styles.eyebrow}>A SHARED COMPANY · {role.toUpperCase()}</p>
        <h1>{workspace.name}</h1>
        <p>{workspace.description || "Một không gian chung để nhóm cùng xác định mục tiêu, chia sẻ công việc và lưu giữ những điều đã học."}</p>
        <span className={styles.slug}>/{workspace.slug}</span>
      </section>
      <WorkspaceNav slug={slug} active="overview" />

      <section className={styles.workspaceStats}>
        <article><span>THÀNH VIÊN</span><strong>{activeMembers}</strong><small>Những người đang đồng hành</small></article>
        <article><span>GOALS</span><strong>{goalCount}</strong><small>Mục tiêu của nhóm</small></article>
        <article><span>QUESTS ĐANG MỞ</span><strong>{openQuests}</strong><small>{completedQuests} Quest đã hoàn thành</small></article>
        <article><span>ARCHIVES</span><strong>{activeNoteCount}</strong><small>Ghi chú đang lưu giữ</small></article>
      </section>

      <section className={styles.moduleLaunchGrid}>
        <Link href={`/workspaces/${slug}/goals`} className={styles.moduleLaunchCard}>
          <span className={styles.launchNumber}>01 / DIRECTION</span><b>Goals</b><p>Giữ cho cả nhóm nhìn về cùng một đích đến.</p><span className={styles.launchArrow}>↗</span>
        </Link>
        <Link href={`/workspaces/${slug}/quests`} className={styles.moduleLaunchCard}>
          <span className={styles.launchNumber}>02 / EXECUTION</span><b>Quests</b><p>Chia nhỏ công việc, giao người thực hiện và cập nhật tiến độ.</p><span className={styles.launchArrow}>↗</span>
        </Link>
        <Link href={`/workspaces/${slug}/council`} className={styles.moduleLaunchCard}>
          <span className={styles.launchNumber}>03 / DECISIONS</span><b>The Council</b><p>Đưa phương án ra bàn, biểu quyết và lưu lại lý do.</p><span className={styles.launchArrow}>↗</span>
        </Link>
        <Link href={`/workspaces/${slug}/archives`} className={styles.moduleLaunchCard}>
          <span className={styles.launchNumber}>04 / KNOWLEDGE</span><b>The Archives</b><p>Ghi lại bài học, ngữ cảnh và tri thức có thể kế thừa.</p><span className={styles.launchArrow}>↗</span>
        </Link>
        <Link href={`/workspaces/${slug}/members`} className={styles.moduleLaunchCard}>
          <span className={styles.launchNumber}>05 / THE COMPANY</span><b>Thành viên</b><p>Mời đồng đội và quản lý vai trò trong workspace.</p><span className={styles.launchArrow}>↗</span>
        </Link>
      </section>
    </main>
  );
}
