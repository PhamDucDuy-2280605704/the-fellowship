import Link from "next/link";
import styles from "./page.module.css";

const modules = [
  {
    number: "01",
    name: "The Fellowship",
    role: "Cùng thực hiện",
    description:
      "Workspace, mục tiêu, Quest, phân công và tiến độ — để mọi người biết nhóm đang đi đâu và việc tiếp theo là gì.",
    state: "Đang xây nền tảng",
  },
  {
    number: "02",
    name: "The Council",
    role: "Cùng quyết định",
    description:
      "Đề xuất phương án, cân nhắc đánh đổi và lưu lại lý do để những quyết định quan trọng không bị thất lạc.",
    state: "Giai đoạn tiếp theo",
  },
  {
    number: "03",
    name: "The Archives",
    role: "Cùng ghi nhớ",
    description:
      "Ghi chú, tài liệu và tri thức gắn với công việc — để kết quả hôm nay trở thành điểm tựa cho ngày mai.",
    state: "Giai đoạn tiếp theo",
  },
];

const principles = [
  ["Có chung một đích đến", "Mục tiêu của nhóm luôn gắn với công việc cụ thể."],
  ["Rõ người, rõ việc", "Trách nhiệm và quyền hạn được thể hiện minh bạch."],
  ["Không đánh mất lý do", "Hoạt động và tri thức được lưu lại theo ngữ cảnh."],
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="The Fellowship trang chủ">
          <span className={styles.brandMark}>✦</span>
          <span>THE FELLOWSHIP</span>
        </Link>
        <span className={styles.headerMeta}>COLLABORATION · DECISIONS · KNOWLEDGE</span>
        <nav className={styles.authNav} aria-label="Tài khoản">
          <Link href="/login">Đăng nhập</Link>
          <Link href="/signup">Tham gia <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>A SHARED JOURNEY, A SHARED MEMORY</p>
        <h1>
          Một hành trình chung.
          <br />
          <span>Một ký ức chung.</span>
        </h1>
        <p className={styles.lead}>
          Nơi một nhóm cùng biến mục tiêu thành hành động, biến quyết định thành định hướng,
          và biến trải nghiệm thành tri thức có thể kế thừa.
        </p>
        <div className={styles.heroActions}>
          <a className={styles.primaryAction} href="#modules">
            Khám phá nền tảng <span aria-hidden="true">↘</span>
          </a>
          <span className={styles.buildNote}>Bản nền tảng đang được phát triển</span>
        </div>
        <div className={styles.heroFoot}>
          <span>DESIGNED FOR TEAMS THAT BUILD TOGETHER</span>
          <span>EST. 2026</span>
        </div>
      </section>

      <section className={styles.modules} id="modules" aria-labelledby="modules-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>THREE CONNECTED MODULES</p>
            <h2 id="modules-title">Một nền tảng. Ba cách đồng hành.</h2>
          </div>
          <p className={styles.sectionAside}>Không phải ba ứng dụng rời rạc — mà là một dòng chảy thống nhất.</p>
        </div>
        <div className={styles.moduleGrid}>
          {modules.map((module) => (
            <article className={styles.moduleCard} key={module.number}>
              <div className={styles.moduleTop}>
                <span>{module.number}</span>
                <span className={styles.moduleState}>{module.state}</span>
              </div>
              <p className={styles.moduleRole}>{module.role}</p>
              <h3>{module.name}</h3>
              <p className={styles.moduleDescription}>{module.description}</p>
              <div className={styles.moduleRule} />
            </article>
          ))}
        </div>
      </section>

      <section className={styles.principles} aria-labelledby="principles-title">
        <div className={styles.principleIntro}>
          <p className={styles.eyebrow}>THE WAY WE WORK</p>
          <h2 id="principles-title">Đi cùng nhau, không ai bị bỏ lại phía sau.</h2>
        </div>
        <div className={styles.principleList}>
          {principles.map(([title, description], index) => (
            <div className={styles.principle} key={title}>
              <span>0{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}><span className={styles.brandMark}>✦</span> THE FELLOWSHIP</div>
        <p>Built with purpose. Remembered together.</p>
        <span>FOUNDATION / 0.3.0</span>
      </footer>
    </main>
  );
}
