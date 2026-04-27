import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "우리 가족 공유 교대근무 캘린더",
    short_name: "가족 교대",
    description: "교대근무 패턴과 가족 일정을 모바일에서 빠르게 확인하는 PWA",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4eb",
    theme_color: "#0f172a",
    lang: "ko-KR",
    icons: [
      {
        src: "/icons/icon-192-v2.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-v2.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-v2.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
