import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Inter, Noto_Serif } from "next/font/google";
import { UrlToast } from "@/components/ui/url-toast";
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
  metadataBase: new URL("https://the-fellowship-zeta.vercel.app"),
  title: {
    default: "The Fellowship — Cùng nhau đi xa hơn",
    template: "%s · The Fellowship",
  },
  description:
    "Không gian cộng tác để một nhóm cùng theo đuổi mục tiêu, hoàn thành công việc và lưu giữ tri thức.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b100d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <head />
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <Suspense fallback={null}>
          <UrlToast />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
