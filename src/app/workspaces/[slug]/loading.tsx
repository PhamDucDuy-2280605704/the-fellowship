import styles from "../../workspaces.module.css";

export default function WorkspaceDetailLoading() {
  return (
    <main className={styles.page} aria-busy="true" aria-live="polite">
      <header className={styles.topbar}>
        <span className={styles.brand}>✦ THE FELLOWSHIP</span>
      </header>
      <section className={styles.detailHero}>
        <p className={styles.eyebrow}>THE FELLOWSHIP</p>
        <h1>Đang mở workspace…</h1>
        <p>Đang tải Goals, Quests, Council và Archives.</p>
      </section>
    </main>
  );
}
