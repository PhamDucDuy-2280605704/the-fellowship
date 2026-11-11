import Link from "next/link";
import { AppIcon } from "@/components/ui/icon";
import styles from "./page.module.css";

function Tree() {
  return <svg viewBox="0 0 64 72" aria-hidden="true"><path d="M32 67V36m0 13L21 39m11 4 12-13M32 36 22 25m10 8 10-13M32 27 26 15m6 12 8-13M32 20V8M22 67h20M17 71h30M32 8c-4 5-7 8-11 9m11-9c4 5 7 8 11 9" /></svg>;
}

export default function HomePage() {
  return <main className={styles.page}>
    <div className={styles.backdrop} aria-hidden="true"/>
    <div className={styles.atmosphere} aria-hidden="true">{[0,1,2,3,4,5].map(n=><span key={n}/>)}</div>
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="The Fellowship"><AppIcon name="compass" className={styles.compass}/><span>THE FELLOWSHIP</span></Link>
      <nav className={styles.navigation} aria-label="Điều hướng chính">
        <Link href="#intro"><AppIcon name="compass"/><span>Khám phá</span></Link>
        <Link href="#portals"><AppIcon name="users"/><span>Cộng đồng</span></Link>
        <Link href="#journey"><AppIcon name="route"/><span>Hành trình</span></Link>
        <Link href="/signup"><AppIcon name="user-plus"/><span>Tham gia</span></Link>
      </nav>
      <div className={styles.headerActions}><AppIcon name="sparkle"/><Link className={styles.headerLogin} href="/login">Đăng nhập</Link></div>
    </header>
    <section className={styles.hero} id="intro">
      <div className={styles.heroKicker}><span/><p>ONE JOURNEY · ONE FELLOWSHIP</p><span/></div>
      <h1>The Fellowship</h1>
      <p className={styles.tagline}>Cùng nhau, chúng ta kiến tạo một hành trình vĩ đại hơn.</p>
    </section>
    <section className={styles.portals} id="portals" aria-label="Chọn cổng truy cập">
      <article className={styles.portalCard}>
        <div className={styles.cardSeal}><div className={styles.sealInner}><Tree/></div></div>
        <p className={styles.cardEyebrow}>THE FELLOWSHIP · MEMBERS</p>
        <h2>Cổng Thành Viên</h2>
        <p className={styles.cardDescription}>Dành cho những người đồng hành, cùng nhau xây dựng và chinh phục mục tiêu lớn.</p>
        <ul className={styles.highlights}><li><span>✧</span>Cùng xây dựng cộng đồng</li><li><span>✧</span>Đặt mục tiêu và hoàn thành nhiệm vụ</li><li><span>✧</span>Lưu giữ và chia sẻ hành trình</li></ul>
        <Link className={styles.portalButton} href="/login"><AppIcon name="users"/><span>Đăng nhập Thành Viên</span><b>›</b></Link>
        <p className={styles.cardFootnote}>Chưa có tài khoản? <Link href="/signup">Tham gia Fellowship</Link></p>
      </article>
    </section>
    <section className={styles.journey} id="journey" aria-label="Thông điệp hành trình">
      <span className={styles.journeyRule}/><span className={styles.journeyStar}>✥</span>
      <blockquote>“Not all those who wander are lost.”</blockquote><span className={styles.journeyAuthor}>— J.R.R. Tolkien —</span><span className={styles.journeyRule}/>
    </section>
    <footer className={styles.footer}>
      <div className={styles.footerBrand}><AppIcon name="compass" className={styles.compass}/><span>The Fellowship · v0.3.0</span></div>
      <div className={styles.footerMessage}><span>© 2026 The Fellowship</span><i>·</i><span>Built for a greater purpose.</span></div>
      <p>One Fellowship. One Journey.</p>
    </footer>
  </main>;
}
