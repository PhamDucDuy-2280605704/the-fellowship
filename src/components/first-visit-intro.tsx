"use client";

import { useEffect, useState } from "react";
import styles from "./first-visit-intro.module.css";

const STORAGE_KEY = "the-fellowship:intro-completed:v1";

export default function FirstVisitIntro() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  function startUsing() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } finally {
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div className={styles.backdrop}>
      <section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="fellowship-intro-title" aria-describedby="fellowship-intro-description">
        <div className={styles.ornament} aria-hidden="true">✥</div>
        <p className={styles.kicker}>ONE JOURNEY · ONE FELLOWSHIP</p>
        <h2 id="fellowship-intro-title">Chào mừng người đồng hành</h2>
        <p className={styles.lead} id="fellowship-intro-description">
          The Fellowship là nơi mọi người cùng chung mục tiêu, sát cánh hoàn thành công việc và lưu giữ tri thức trên một hành trình chung.
        </p>
        <div className={styles.features}>
          <article><span>01</span><strong>Mục tiêu & nhiệm vụ</strong><p>Biến kế hoạch chung thành những bước tiến rõ ràng.</p></article>
          <article><span>02</span><strong>Hội đồng</strong><p>Thảo luận, đóng góp ý kiến và cùng đưa ra quyết định.</p></article>
          <article><span>03</span><strong>Lưu trữ tri thức</strong><p>Giữ lại tài liệu, trao đổi và dấu mốc của cả nhóm.</p></article>
        </div>
        <button className={styles.startButton} type="button" onClick={startUsing}>Bắt đầu sử dụng <span aria-hidden="true">→</span></button>
        <p className={styles.note}>Cánh cửa này chỉ chào đón anh một lần trên trình duyệt này.</p>
      </section>
    </div>
  );
}
