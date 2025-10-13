"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    let unsubUserData: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        unsubUserData = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) setUserData(snapshot.data());
        });
      } else {
        router.replace("/sign/signin");
      }
    });
    return () => {
      unsubAuth();
      if (unsubUserData) unsubUserData();
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("로그아웃 성공!");
      router.replace("/sign/signin");
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  };

  const getGradientByGender = (gender?: string, color?: string) => {
    if (color) return `linear-gradient(135deg, ${color}, ${color}CC, ${color}99)`;
    if (gender === "남성") return "linear-gradient(135deg, #3b82f6, #60a5fa, #93c5fd)";
    if (gender === "여성") return "linear-gradient(135deg, #f472b6, #f9a8d4, #fce7f3)";
    return "linear-gradient(135deg, #60a5fa, #93c5fd, #dbeafe)";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f0f4ff, #e8ecf7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "white",
          borderRadius: "20px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
          padding: "40px 32px",
          transition: "transform 0.3s ease",
        }}
      >
        {/* 프로필 카드 */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: getGradientByGender(userData?.gender, userData?.profileColor),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: (userData?.name?.length ?? 0) > 3 ? "16px" : "22px",
              color: "white",
              fontWeight: "bold",
              margin: "0 auto 16px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
              padding: "0 10px",
              textAlign: "center",
            }}
          >
            {userData?.name || "사용자"}
          </div>

          <h2
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "#111827",
              marginBottom: "6px",
            }}
          >
            {userData?.name || "사용자"}
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              marginBottom: "10px",
            }}
          >
            {user?.email || "이메일 정보 없음"}
          </p>

          {(userData?.district || userData?.mbti) && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "6px",
                marginBottom: "16px",
              }}
            >
              {userData?.district && (
                <span
                  style={{
                    backgroundColor: "#e0f2fe",
                    color: "#0369a1",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  📍 {userData.district}
                </span>
              )}
              {userData?.mbti && (
                <span
                  style={{
                    backgroundColor: "#fce7f3",
                    color: "#be185d",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  🧠 {userData.mbti}
                </span>
              )}
            </div>
          )}

          {/* 자기소개 */}
          <div
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: "12px",
              padding: "14px 16px",
              color: "#374151",
              lineHeight: "1.6",
              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.05)",
              fontSize: "14px",
              textAlign: "left",
              maxWidth: "380px",
              margin: "0 auto",
              border: "1px solid #e5e7eb",
            }}
          >
            💬 {userData?.bio || "아직 자기소개를 작성하지 않았어요 🙂"}
          </div>
        </div>

        {/* 버튼 섹션 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "20px",
          }}
        >
          <button
            style={buttonStyle}
            onClick={() => router.push("/pages/profile")}
          >
            ✏️ 프로필 수정
          </button>
          <button
            style={buttonStyle}
            onClick={() => router.push("/pages/posts")}
          >
            🗂 내가 쓴 글
          </button>
          <button
            style={{ ...buttonStyle, backgroundColor: "#f87171" }}
            onClick={handleLogout}
          >
            🚪 로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

// 버튼 스타일
const buttonStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#3b82f6",
  color: "white",
  fontWeight: 700,
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  fontSize: "15px",
  boxShadow: "0 4px 10px rgba(59,130,246,0.3)",
  transition: "background-color 0.2s, transform 0.2s",
};

