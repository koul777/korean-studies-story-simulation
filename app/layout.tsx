import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "한국학 인사팀의 이상한 모험 | 스토리 시뮬레이션",
  description: "인사팀 실습생 서하린과 기록 수호신 해치가 함께 해결하는 7장 구성 선택형 한국어 스토리 시뮬레이션입니다.",
  openGraph: {
    title: "한국학 인사팀의 이상한 모험",
    description: "기록을 통해 진실을 정렬하고 사건의 결론을 설계하는 한국어 인터랙티브 스토리 시뮬레이션.",
    images: ["/game/title-art.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "한국학 인사팀의 이상한 모험 | 스토리 시뮬레이션",
    description: "감정, 규범, 증거를 놓고 결정을 내리는 7장 구성 한국어 시뮬레이션.",
    images: ["/game/title-art.png"],
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
