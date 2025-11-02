"use client";

import { ReactNode } from "react";
import Image from "next/image";
import BottomNav from "../components/bottomNav";
import LogoutButton from "../components/logoutBotton";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div
      style={{
        // 🎨 상단 → 하단으로 점점 밝아지는 배경
        backgroundImage:
          "linear-gradient(to bottom, rgba(255, 230, 200, 0.96), rgba(255, 245, 230, 0.96), rgba(255, 250, 245, 0.95)), url('https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=2000&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        fontFamily: "'Noto Sans KR', sans-serif",
        paddingBottom: "100px",
      }}
    >
      {/* 🔶 상단 헤더 */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "90px",
          // ✅ 진한 오렌지 → 붉은 오렌지로 그라데이션 강화
          background: "linear-gradient(135deg, #ff7b00, #ff4e00)",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.25)",
          borderBottomLeftRadius: "25px",
          borderBottomRightRadius: "25px",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          zIndex: 1000,
          backdropFilter: "blur(6px)",
        }}
      >
        {/* 🍚 왼쪽 로고 및 타이틀 */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              backgroundColor: "rgba(255,255,255,0.25)",
              padding: "4px",
              boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png"
              alt="밥친구 로고"
              width={36}
              height={36}
              style={{
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
          </div>

          <div>
            <h1
              style={{
                fontSize: "1.6rem",
                fontWeight: 900,
                margin: 0,
                letterSpacing: "-0.5px",
                textShadow: "0 2px 6px rgba(0,0,0,0.25)",
              }}
            >
              밥친구
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                margin: 0,
                marginTop: "2px",
                opacity: 0.9,
                textShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }}
            >
              함께 먹는 즐거움 🍱
            </p>
          </div>
        </div>

        {/* 🚪 오른쪽 로그아웃 버튼 */}
        <div>
          <LogoutButton />
        </div>
      </header>

      {/* 📄 페이지 내용 */}
      <main
        style={{
          marginTop: "100px",
          padding: "0 16px 16px",
          color: "#1f2937",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {children}
      </main>

      {/* 🔻 하단 메뉴바 */}
      <BottomNav />
    </div>
  );
}
