import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Noto_Serif } from "next/font/google";
import "./globals.css";

const bodyFont = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Noto_Serif({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

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
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>{children}</body>
    </html>
  );
}
