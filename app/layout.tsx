import type { Metadata } from "next";
import "./globals.css";
import { getServerSession } from "next-auth";
import Link from "next/link";

export const metadata: Metadata = { title: "MatchEats", description: "소개팅 형식의 맛집 탐방(MVP)" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  return (
    <html lang="ko">
      <body>
        <header className="border-b px-4 py-3 flex gap-4">
          <Link href="/">홈</Link>
          <Link href="/onboarding">온보딩</Link>
          <Link href="/discover">추천</Link>
          <Link href="/matches">매칭</Link>
        </header>
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}
