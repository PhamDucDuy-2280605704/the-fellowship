import type { ReactNode } from "react";
import styles from "@/app/workspaces.module.css";

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export function MarkdownContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let code: string[] = [];
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push(<p key={`p-${blocks.length}`}>{inline(paragraph.join(" "))}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) blocks.push(<ul key={`ul-${blocks.length}`}>{list.map((item, i) => <li key={i}>{inline(item)}</li>)}</ul>);
    list = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      flushParagraph(); flushList();
      if (inCode) blocks.push(<pre key={`code-${blocks.length}`}><code>{code.join("\n")}</code></pre>);
      code = []; inCode = !inCode; continue;
    }
    if (inCode) { code.push(line); continue; }
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph(); flushList();
      const level = heading[1].length;
      const children = inline(heading[2]);
      if (level === 1) blocks.push(<h2 key={blocks.length}>{children}</h2>);
      else if (level === 2) blocks.push(<h3 key={blocks.length}>{children}</h3>);
      else blocks.push(<h4 key={blocks.length}>{children}</h4>);
      continue;
    }
    const item = /^\s*[-*+]\s+(.+)$/.exec(line);
    if (item) { flushParagraph(); list.push(item[1]); continue; }
    const quote = /^>\s?(.+)$/.exec(line);
    if (quote) { flushParagraph(); flushList(); blocks.push(<blockquote key={blocks.length}>{inline(quote[1])}</blockquote>); continue; }
    flushList(); paragraph.push(line.trim());
  }
  flushParagraph(); flushList();
  if (inCode && code.length) blocks.push(<pre key={`code-${blocks.length}`}><code>{code.join("\n")}</code></pre>);
  return <div className={styles.markdownContent}>{blocks}</div>;
}
