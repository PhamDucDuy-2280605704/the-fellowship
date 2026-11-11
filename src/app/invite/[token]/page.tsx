import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireActiveUser } from "@/lib/auth/platform";
import { acceptWorkspaceInvitation } from "@/features/workspaces/member-actions";
import styles from "../../auth.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lời mời tham gia", robots: { index: false, follow: false } };

type Params = Promise<{ token: string }>;
type SearchParams = Promise<{ error?: string }>;

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { token } = await params;
  const query = await searchParams;
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) redirect("/login?error=callback");

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }
  await requireActiveUser();

  return (
    <main className={`${styles.page} ${styles.invitePage}`}>
      <link rel="preload" as="image" href="https://www.lotro.com/images/about/feature-4.png" fetchPriority="high" />
      <div className={styles.ambient} aria-hidden="true" />
      <Link className={styles.brand} href="/"><span>✦</span> THE FELLOWSHIP</Link>
      <section className={styles.card}>
        <p className={styles.eyebrow}>A PLACE AT THE TABLE</p>
        <h1>Lời mời đồng hành.</h1>
        <p className={styles.description}>
          Tài khoản <b>{data.user.email}</b> sẽ được thêm vào workspace nếu email này khớp với lời mời.
        </p>
        {query.error && <p className={styles.error} role="alert">Lời mời không hợp lệ, đã hết hạn, đã dùng hoặc được gửi tới email khác.</p>}
        <form action={acceptWorkspaceInvitation} className={styles.form}>
          <input type="hidden" name="token" value={token} />
          <button type="submit">Chấp nhận lời mời <span aria-hidden="true">→</span></button>
        </form>
        <p className={styles.footerText}><Link href="/workspaces">Về workspace của tôi</Link></p>
      </section>
    </main>
  );
}
