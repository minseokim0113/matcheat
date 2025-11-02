"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function FindIdPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 250);
  }, []);

  useEffect(() => {
    if (!touched) return;
    if (!name.trim()) {
      setIsValid(false);
      setError("이름을 입력해주세요.");
    } else {
      setIsValid(true);
      setError("");
    }
  }, [name, touched]);

  const handleFindId = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("name", "==", name.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("해당 이름으로 가입된 계정이 없습니다.");
      } else {
        const userData = querySnapshot.docs[0].data();
        alert(`가입된 이메일은 ${userData.email} 입니다.`);
      }
    } catch (err) {
      console.error(err);
      setError("아이디를 찾는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFF8F1",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1.5rem",
        fontFamily: "'Noto Sans KR', sans-serif",
        color: "#3B2B1B",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 배경 오렌지 그라데이션 원 */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          left: "-100px",
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle at center, rgba(255,155,66,0.35), transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          right: "-120px",
          width: "320px",
          height: "320px",
          background:
            "radial-gradient(circle at center, rgba(255,200,150,0.25), transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* 메인 카드 */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#FFFDF9",
          borderRadius: "20px",
          padding: "2rem 1.8rem",
          boxShadow: "0 6px 18px rgba(255,155,66,0.25)",
          transform: animate ? "translateY(0)" : "translateY(30px)",
          opacity: animate ? 1 : 0,
          transition: "all 0.8s ease-out",
        }}
      >
        {/* 헤더 */}
        <h1
          style={{
            textAlign: "center",
            fontSize: "2rem",
            fontWeight: 900,
            color: "#FF7B00",
            marginBottom: "1.8rem",
            textShadow: "0 3px 10px rgba(255,155,66,0.25)",
          }}
        >
          🔍 아이디 찾기
        </h1>

        {/* 이름 입력 */}
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="가입 시 등록한 이름을 입력하세요"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!touched) setTouched(true);
            }}
            style={{
              width: "100%",
              border: error ? "2px solid #FF7B00" : "1px solid #FFD7B5",
              borderRadius: "10px",
              padding: "12px",
              background: "#FFF8F1",
              fontSize: "0.95rem",
              outline: "none",
              color: "#3B2B1B",
              boxShadow: "0 2px 6px rgba(255,155,66,0.15)",
            }}
          />
          {touched && error && (
            <p
              style={{
                color: "#FF7B00",
                fontSize: "0.85rem",
                marginTop: "6px",
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* 버튼 */}
        <button
          onClick={handleFindId}
          disabled={!isValid || loading}
          style={{
            width: "100%",
            background: isValid
              ? "linear-gradient(135deg, #FF9B42, #FF7B00)"
              : "#E5E7EB",
            color: "#fff",
            fontWeight: 800,
            fontSize: "1rem",
            padding: "14px",
            borderRadius: "999px",
            border: "none",
            cursor: isValid ? "pointer" : "not-allowed",
            transition: "all 0.25s ease",
            boxShadow: isValid ? "0 6px 16px rgba(255,123,0,0.35)" : "none",
          }}
          onMouseEnter={(e) => {
            if (isValid) e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {loading ? "조회 중..." : "아이디 찾기"}
        </button>

        {/* 링크 */}
        <div
          style={{
            textAlign: "center",
            marginTop: "1.8rem",
            fontSize: "0.9rem",
          }}
        >
          <p style={{ marginBottom: "0.6rem" }}>
            비밀번호를 잊으셨나요?{" "}
            <span
              style={{ color: "#FF7B00", cursor: "pointer", fontWeight: 700 }}
              onClick={() => router.push("/find-password")}
            >
              비밀번호 찾기
            </span>
          </p>
          <p>
            이미 계정이 있나요?{" "}
            <span
              style={{ color: "#FF7B00", cursor: "pointer", fontWeight: 700 }}
              onClick={() => router.push("/sign/signin")}
            >
              로그인
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
