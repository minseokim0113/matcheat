// app/userprofile/[uid]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";

type UserData = {
  name: string;
  profileColor?: string;
  age?: number;
  mbti?: string;
  email?: string;
  bio?: string;
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const uid = Array.isArray(params.uid) ? params.uid[0] : params.uid;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const fetchUser = async () => {
      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        } else {
          alert("존재하지 않는 사용자입니다.");
          router.back();
        }
      } catch (error) {
        console.error(error);
        alert("사용자 정보를 불러오는 중 오류가 발생했습니다.");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [uid, router]);

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "50px", color: "#7A5A3D" }}>
        불러오는 중...
      </div>
    );

  if (!userData) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFF8F1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Noto Sans KR', sans-serif",
        color: "#3B2B1B",
        padding: "2rem 1rem",
      }}
    >
      {/* 헤더 */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          width: "100%",
          background: "linear-gradient(90deg, #FF9B42, #FF7B00)",
          color: "white",
          padding: "1rem 1.2rem",
          fontWeight: 800,
          fontSize: "1.3rem",
          textAlign: "center",
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
          marginBottom: "1.5rem",
        }}
      >
        프로필 보기 👤
      </header>

      {/* 프로필 카드 */}
      <div
        style={{
          background: "#FFFDF9",
          borderRadius: 20,
          boxShadow: "0 6px 14px rgba(0,0,0,0.07)",
          padding: "2rem 1.8rem",
          width: "90%",
          maxWidth: "420px",
          textAlign: "center",
        }}
      >
        {/* 프로필 이미지 */}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: userData.profileColor
              ? `linear-gradient(135deg, ${userData.profileColor}, ${userData.profileColor}CC)`
              : "linear-gradient(135deg, #FF9B42, #FF7B00)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "36px",
            margin: "0 auto 1rem",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
          }}
        >
          {userData.name?.charAt(0) || "유"}
        </div>

        {/* 이름 */}
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          {userData.name}
        </h2>

        {/* 나이 / MBTI / 이메일 */}
        <div
          style={{
            color: "#5A3A1C",
            fontSize: "0.95rem",
            lineHeight: "1.6",
            marginBottom: "1rem",
          }}
        >
          {userData.age && <p>🎂 나이: {userData.age}</p>}
          {userData.mbti && <p>🧠 MBTI: {userData.mbti}</p>}
          {userData.email && <p>✉️ 이메일: {userData.email}</p>}
        </div>

        {/* 자기소개 */}
        <div
          style={{
            background: "#FFF7EE",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid #FFE3C2",
            color: "#5A3A1C",
            textAlign: "left",
            lineHeight: "1.6",
            fontSize: "0.95rem",
          }}
        >
          {userData.bio ? (
            <p style={{ margin: 0 }}>{userData.bio}</p>
          ) : (
            <p style={{ margin: 0, color: "#A1A1A1" }}>
              아직 자기소개가 등록되지 않았어요 🙂
            </p>
          )}
        </div>

        {/* 돌아가기 버튼 */}
        <button
          onClick={() => router.back()}
          style={{
            marginTop: "1.8rem",
            width: "100%",
            background: "linear-gradient(135deg, #FF9B42, #FF7B00)",
            color: "white",
            fontWeight: 700,
            border: "none",
            borderRadius: 12,
            padding: "0.8rem",
            fontSize: "15px",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "translateY(-2px)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = "translateY(0)")
          }
        >
          🔙 채팅으로 돌아가기
        </button>
      </div>
    </div>
  );
}
