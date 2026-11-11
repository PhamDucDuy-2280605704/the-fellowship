import styles from "../workspaces.module.css";

export default function WorkspacesLoading() {
  return (
    <main className={styles.page} aria-busy="true" aria-live="polite">
      <header className={styles.topbar}>
        <span className={styles.brand}>✦ THE FELLOWSHIP</span>
      </header>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>YOUR SHARED JOURNEYS</p>
        <h1>Đang mở không gian làm việc…</h1>
        <p>Đang tải workspace và quyền truy cập của anh.</p>
      </section>
    </main>
  );
}
