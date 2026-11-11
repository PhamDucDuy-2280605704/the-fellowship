"use client";

import { useState } from "react";
import styles from "@/app/workspaces.module.css";

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className={styles.copyButton} onClick={copy}>
      {copied ? "Đã sao chép" : "Sao chép lời mời"}
    </button>
  );
}
