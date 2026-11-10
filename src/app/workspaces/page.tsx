import Link from "next/link";
import type { Metadata } from "next";
import { signOut } from "@/features/auth/actions";
import { createWorkspace } from "@/features/workspaces/actions";
import { requireActiveUser } from "@/lib/auth/platform";
import styles from "../workspaces.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Không gian làm việc của các nhóm trên The Fellowship.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ error?: string }>;

export default async function WorkspacesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase, user } = await requireActiveUser();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");

  const { data: memberships, error: membershipsError } = await supabase
    .from("workspace_members")
    .select("role, status, workspace:workspaces(id, name, slug, description, created_at)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const workspaceItems = (memberships ?? []).flatMap((membership) =>
    membership.workspace
      ? [{ ...membership.workspace, role: membership.role }]
      : [],
  );

  const errorMessage = params.error === "slug-taken"
    ? "Tên đường dẫn workspace đã được sử dụng. Hãy đổi tên nhóm."
    : params.error === "invalid-slug"
      ? "Tên workspace chưa thể chuyển thành đường dẫn. Hãy dùng thêm chữ hoặc số."
      : params.error === "invalid-workspace"
        ? "Tên workspace cần có từ 2 đến 80 ký tự; mô tả tối đa 1.000 ký tự."
        : params.error === "create-failed"
          ? "Chưa thể tạo workspace. Hãy thử lại."
          : null;

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">✦ THE FELLOWSHIP</Link>
        <div className={styles.account}>
          {isAdmin && <Link className={styles.quietButton} href="/admin">Admin Console</Link>}
          <span>{user.email}</span>
          <form action={signOut}>
            <button type="submit" className={styles.quietButton}>Đăng xuất</button>
          </form>
        </div>
      </header>

      <section className={styles.intro}>
        <p className={styles.eyebrow}>YOUR SHARED JOURNEYS</p>
        <h1>Không gian làm việc của bạn.</h1>
        <p>Chọn một workspace để tiếp tục, hoặc khởi tạo không gian mới cho nhóm.</p>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.workspaceSection}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>WORKSPACES</p>
              <h2>Không gian của bạn</h2>
            </div>
            <span className={styles.count}>{workspaceItems.length.toString().padStart(2, "0")}</span>
          </div>

          {membershipsError ? (
            <p className={styles.error} role="alert">
              Chưa tải được danh sách workspace. Hãy tải lại trang hoặc kiểm tra kết nối.
            </p>
          ) : workspaceItems.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyMark}>✧</span>
              <h3>Chưa có hành trình nào.</h3>
              <p>Workspace đầu tiên sẽ là nơi nhóm cùng xác định mục tiêu và bắt đầu Quest.</p>
            </div>
          ) : (
            <div className={styles.workspaceList}>
              {workspaceItems.map((workspace) => (
                <Link
                  className={styles.workspaceCard}
                  href={`/workspaces/${workspace.slug}`}
                  key={workspace.id}
                >
                  <div>
                    <span className={styles.role}>{workspace.role}</span>
                    <h3>{workspace.name}</h3>
                    <p>{workspace.description || "Chưa có mô tả cho workspace này."}</p>
                  </div>
                  <span className={styles.arrow} aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className={styles.createPanel}>
          <p className={styles.eyebrow}>START SOMETHING TOGETHER</p>
          <h2>Tạo một workspace mới.</h2>
          <p className={styles.panelDescription}>
            Bạn sẽ tự động trở thành Owner và có thể quản lý workspace của nhóm.
          </p>

          {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}

          <form action={createWorkspace} className={styles.form}>
            <label htmlFor="name">Tên workspace</label>
            <input id="name" name="name" minLength={2} maxLength={80} required />
            <label htmlFor="description">Mô tả <span>(không bắt buộc)</span></label>
            <textarea id="description" name="description" rows={4} maxLength={1000} />
            <button type="submit" className={styles.primaryButton}>
              Khởi tạo workspace <span aria-hidden="true">→</span>
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}
