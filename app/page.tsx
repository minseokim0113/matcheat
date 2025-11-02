"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, CSSProperties } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const centerStyle: CSSProperties = {
    position: "absolute",
    top: "46%",
    left: "50%",
    textAlign: "center",
    color: "#3B2B1B",
    zIndex: 2,
    opacity: animate ? 1 : 0,
    transformOrigin: "center",
    transition: "opacity 0.8s ease, transform 0.8s ease",
    transform: animate
      ? "translate(-50%, -50%) scale(1)"
      : "translate(-50%, -55%) scale(1.05)",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        backgroundColor: "#FFF8F1",
        position: "relative",
        fontFamily: "'Noto Sans KR', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* 오렌지빛 배경 원형 그라데이션 */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          left: "-100px",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle at center, rgba(255,155,66,0.35), transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-120px",
          right: "-120px",
          width: "380px",
          height: "380px",
          background:
            "radial-gradient(circle at center, rgba(255,200,130,0.3), transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* 중앙 텍스트 */}
      <div style={centerStyle}>
        <h1
          style={{
            fontSize: "3.5rem",
            fontWeight: 900,
            marginBottom: "1rem",
            color: "#FF7B00",
            textShadow: "0 3px 10px rgba(255,155,66,0.25)",
            letterSpacing: "-0.02em",
          }}
        >
          밥친구
        </h1>
        <p
          style={{
            fontSize: "1.15rem",
            lineHeight: 1.7,
            color: "#4B2F14",
            opacity: 0.85,
          }}
        >
          따뜻한 한 끼, 새로운 인연 🍱 <br />
          당신 근처의 밥친구를 만나보세요.
        </p>
      </div>

      {/* 버튼 그룹 */}
      <div
        style={{
          position: "absolute",
          bottom: "90px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          width: "80%",
          maxWidth: "360px",
          zIndex: 3,
        }}
      >
        {/* 로그인 버튼 */}
        <button
          onClick={() => router.push("/sign/signin")}
          onMouseEnter={() => setHovered("login")}
          onMouseLeave={() => setHovered(null)}
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1.2rem",
            fontWeight: 800,
            border: "none",
            borderRadius: "999px",
            color: "#fff",
            background:
              hovered === "login"
                ? "linear-gradient(135deg, #FFAC5E, #FF7B00)"
                : "linear-gradient(135deg, #FF9B42, #FF7B00)",
            boxShadow:
              hovered === "login"
                ? "0 6px 18px rgba(255,123,0,0.4)"
                : "0 4px 12px rgba(255,123,0,0.3)",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
        >
          로그인
        </button>

        {/* 회원가입 버튼 */}
        <button
          onClick={() => router.push("/sign/signup")}
          onMouseEnter={() => setHovered("signup")}
          onMouseLeave={() => setHovered(null)}
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1.2rem",
            fontWeight: 800,
            borderRadius: "999px",
            border: "2px solid #FF9B42",
            backgroundColor:
              hovered === "signup" ? "#FFEEE0" : "rgba(255,255,255,0.7)",
            color: "#B64E00",
            boxShadow:
              hovered === "signup"
                ? "0 5px 12px rgba(255,155,66,0.25)"
                : "0 2px 8px rgba(0,0,0,0.08)",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
        >
          회원가입
        </button>
      </div>

      {/* 하단 이모티콘 */}
      <div
        style={{
          position: "absolute",
          bottom: "25px",
          width: "100%",
          textAlign: "center",
          fontSize: "1.8rem",
          color: "#C08A56",
          opacity: 0.8,
        }}
      >
        🍚 🥢 🍲
      </div>
    </div>
  );
}
