"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [userData, setUserData] = useState<any>(null);

  // 로그인 상태 추적
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // ✅ Firestore에서 유저 정보 가져오기
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setUserData(userSnap.data());
      } else {
        router.replace("/sign/signin");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 로그아웃 기능
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("로그아웃 성공!");
      router.replace("/sign/signin");
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        display: "flex",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "36px",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        {/* 프로필 섹션 */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          {userData?.profileImage ? (
            <img
              src={userData.profileImage}
              alt="프로필"
              style={{
                borderRadius: "50%",
                width: "110px",
                height: "110px",
                marginBottom: "16px",
                objectFit: "cover",
                boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
              }}
            />
          ) : (
            <div
              style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #60a5fa, #93c5fd, #dbeafe)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize:
                  (userData?.name?.length ?? 0) > 3 ? "16px" : "22px", // 이름 길면 글자 크기 줄이기
                color: "white",
                fontWeight: "bold",
                margin: "0 auto 16px",
                boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
                padding: "0 10px",
                textAlign: "center",
              }}
            >
              {userData?.name || "사용자"}
            </div>
          )}

          <h2
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "4px",
              color: "#111827",
            }}
          >
            {userData?.name || "사용자"}
          </h2>

          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
            {user?.email || "이메일 정보 없음"}
          </p>

          <p
            style={{
              fontSize: "14px",
              color: "#4b5563",
              marginTop: "8px",
              backgroundColor: "#f3f4f6",
              borderRadius: "8px",
              padding: "10px 12px",
              lineHeight: "1.5",
            }}
          >
            {userData?.bio || "아직 자기소개를 작성하지 않았어요 🙂"}
          </p>
        </div>

        {/* 버튼 리스트 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            style={buttonStyle}
            onClick={() => router.push("/mypage/edit")}
          >
            프로필 수정
          </button>
          <button
            style={buttonStyle}
            onClick={() => router.push("/mypage/myposts")}
          >
            내가 쓴 글
          </button>
          <button
            style={{ ...buttonStyle, backgroundColor: "#f87171" }}
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

// 공통 버튼 스타일
const buttonStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#60a5fa",
  color: "white",
  fontWeight: 600,
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  transition: "background-color 0.2s",
};
