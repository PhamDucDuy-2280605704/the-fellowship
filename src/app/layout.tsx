import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Fellowship — Cùng nhau đi xa hơn",
    template: "%s · The Fellowship",
  },
  description:
    "Không gian cộng tác để một nhóm cùng theo đuổi mục tiêu, hoàn thành công việc và lưu giữ tri thức.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#10130f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
