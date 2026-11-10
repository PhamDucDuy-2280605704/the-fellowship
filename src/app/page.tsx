import Link from "next/link";
import styles from "./page.module.css";

const modules = [
  {
    number: "01",
    name: "The Fellowship",
    role: "Cùng thực hiện",
    description:
      "Workspace, mục tiêu, Quest, phân công và tiến độ — để mọi người biết nhóm đang đi đâu và việc tiếp theo là gì.",
    state: "Nền tảng cộng tác",
  },
  {
    number: "02",
    name: "The Council",
    role: "Cùng quyết định",
    description:
      "Tạo đề xuất, đưa các phương án ra biểu quyết và lưu lại lựa chọn cùng lý do của nhóm.",
    state: "Biểu quyết cơ bản",
  },
  {
    number: "03",
    name: "The Archives",
    role: "Cùng ghi nhớ",
    description:
      "Ghi chú cấp workspace để giữ lại bối cảnh và bài học, làm điểm tựa cho những chặng tiếp theo.",
    state: "Ghi chú cơ bản",
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
      <div className={styles.landscape} aria-hidden="true">
        <svg className={styles.landscapeSvg} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="middleEarthSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#18241d" />
              <stop offset="58%" stopColor="#22271d" />
              <stop offset="100%" stopColor="#11150f" />
            </linearGradient>
            <radialGradient id="middleEarthDawn">
              <stop offset="0%" stopColor="#d7b875" stopOpacity=".54" />
              <stop offset="54%" stopColor="#9d8757" stopOpacity=".16" />
              <stop offset="100%" stopColor="#9d8757" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="farMountain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#58604b" />
              <stop offset="100%" stopColor="#202a20" />
            </linearGradient>
            <linearGradient id="nearMountain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#27392b" />
              <stop offset="100%" stopColor="#10170f" />
            </linearGradient>
          </defs>
          <rect width="1600" height="900" fill="url(#middleEarthSky)" />
          <ellipse cx="1120" cy="330" rx="570" ry="390" fill="url(#middleEarthDawn)" />
          <circle cx="1120" cy="330" r="82" fill="#d7bc83" opacity=".24" />
          <path d="M0 615 180 465 300 530 510 295 620 420 780 250 920 445 1090 305 1245 455 1415 335 1600 470V900H0Z" fill="url(#farMountain)" opacity=".78" />
          <path d="m510 295 62 104-62-40-53 39Zm270-45 93 195-95-92-80 83Zm310 55 86 116-75-45-47 51Zm325 30 94 142-96-64-63 61Z" fill="#d8d0b4" opacity=".3" />
          <path d="M0 690 175 565 325 640 510 470 690 625 870 460 1040 640 1220 480 1390 635 1600 510V900H0Z" fill="url(#nearMountain)" />
          <path d="M0 760 Q230 670 430 735 T850 720 T1260 730 T1600 700V900H0Z" fill="#10170f" />
          <g fill="#0b120d">
            <path d="m90 790 24-122 24 122h-14l22 62H82l22-62Z" />
            <path d="m165 805 20-104 20 104h-12l19 50h-54l19-50Z" />
            <path d="m1320 795 28-145 28 145h-17l24 67h-70l24-67Z" />
            <path d="m1420 810 22-116 22 116h-13l21 54h-60l21-54Z" />
            <path d="m1510 790 25-130 25 130h-15l23 65h-66l23-65Z" />
          </g>
          <g className={styles.stars} fill="#e7c985">
            <circle cx="280" cy="210" r="2.3" /><circle cx="450" cy="150" r="1.7" />
            <circle cx="760" cy="190" r="2" /><circle cx="1320" cy="175" r="1.8" />
            <circle cx="1450" cy="250" r="2.2" /><circle cx="980" cy="130" r="1.5" />
          </g>
        </svg>
        <div className={styles.landscapeMist} />
        <div className={styles.landscapeVignette} />
      </div>
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
