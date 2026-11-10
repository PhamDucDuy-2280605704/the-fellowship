import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { signOut } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";
import styles from "../../workspaces.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspace",
  robots: { index: false, follow: false },
};

type Params = Promise<{ slug: string }>;

export default async function WorkspaceDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/login");
  }

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id, name, slug, description, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !workspace) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">✦ THE FELLOWSHIP</Link>
        <div className={styles.account}>
          <span>{userData.user.email}</span>
          <form action={signOut}>
            <button type="submit" className={styles.quietButton}>Đăng xuất</button>
          </form>
        </div>
      </header>

      <Link className={styles.backLink} href="/workspaces">← Tất cả workspace</Link>
      <section className={styles.detailHero}>
        <p className={styles.eyebrow}>SHARED WORKSPACE · {membership.role.toUpperCase()}</p>
        <h1>{workspace.name}</h1>
        <p>{workspace.description || "Một không gian chung để nhóm cùng theo đuổi mục tiêu."}</p>
        <span className={styles.slug}>/{workspace.slug}</span>
      </section>

      <section className={styles.comingSoon}>
        <p className={styles.eyebrow}>THE FELLOWSHIP MODULE</p>
        <h2>Hành trình sắp bắt đầu.</h2>
        <p>
          Workspace và quyền Owner đã được tạo ở database. Goal, Quest, phân công và timeline
          sẽ được triển khai ở các bước kế tiếp.
        </p>
      </section>
    </main>
  );
}
