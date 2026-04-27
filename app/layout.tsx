import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/app/sw-register";
import { SessionRefreshClient } from "@/modules/auth/SessionRefreshClient";

export const metadata: Metadata = {
  applicationName: "우리 가족 공유 교대근무 캘린더",
  title: "우리 가족 공유 교대근무 캘린더",
  description: "교대근무 패턴과 가족 일정을 한 화면에서 관리하는 한국어 PWA",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "가족 교대 캘린더",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192-v2.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512-v2.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon-v2.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#f2f2f7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko-KR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        <SessionRefreshClient />
        {children}
      </body>
    </html>
  );
}
