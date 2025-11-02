"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function FindPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [step, setStep] = useState<"email" | "security" | "success">("email");
  const [userDocData, setUserDocData] = useState<any>(null);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 250);
    return () => clearTimeout(timer);
  }, []);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailNext = async () => {
    if (!validateEmail(email)) {
      setError("올바른 이메일을 입력해주세요.");
      return;
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      setError("등록된 계정이 없습니다.");
    } else {
      const docData = querySnapshot.docs[0].data();
      docData.uid = querySnapshot.docs[0].id;
      setUserDocData(docData);
      setSecurityQuestion(docData.securityQuestion || "보안 질문이 없습니다.");
      setStep("security");
      setError("");
    }
  };

  const generateTempPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSecurityAnswer = async () => {
    if (!answerInput.trim()) {
      setAnswerError("답변을 입력해주세요.");
      return;
    }

    if (!userDocData) {
      setAnswerError("사용자 정보를 찾을 수 없습니다.");
      return;
    }

    if (
      userDocData.securityAnswer?.trim().toLowerCase() !==
      answerInput.trim().toLowerCase()
    ) {
      setAnswerError("보안 질문 답변이 일치하지 않습니다.");
      return;
    }

    try {
      const newTempPassword = generateTempPassword();
      const res = await fetch("/api/sendTempPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userDocData.uid,
          tempPassword: newTempPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "임시 비밀번호 발급 실패");

      setTempPassword(newTempPassword);
      setStep("success");
      setAnswerError("");
    } catch (err: any) {
      setAnswerError(err.message || "오류가 발생했습니다.");
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
      {/* 배경 장식 */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          left: "-100px",
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle, rgba(255,155,66,0.35), transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-120px",
          right: "-100px",
          width: "340px",
          height: "340px",
          background:
            "radial-gradient(circle, rgba(255,200,150,0.25), transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* 카드 */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#FFFDF9",
          borderRadius: "20px",
          boxShadow: "0 6px 18px rgba(255,155,66,0.25)",
          padding: "2rem 1.8rem",
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
          🔑 비밀번호 찾기
        </h1>

        {/* STEP 1: 이메일 입력 */}
        {step === "email" && (
          <>
            <input
              type="email"
              placeholder="가입 시 등록한 이메일을 입력하세요"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
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
                marginBottom: "0.8rem",
                color: "#3B2B1B",
                boxShadow: "0 2px 6px rgba(255,155,66,0.15)",
              }}
            />
            {touched && error && (
              <p style={{ color: "#FF7B00", fontSize: "0.85rem", marginBottom: "0.8rem" }}>
                {error}
              </p>
            )}
            <button
              onClick={handleEmailNext}
              style={buttonStyle(true)}
            >
              다음
            </button>
          </>
        )}

        {/* STEP 2: 보안 질문 */}
        {step === "security" && (
          <>
            <p
              style={{
                marginBottom: "12px",
                fontWeight: 600,
                color: "#3B2B1B",
                textAlign: "center",
              }}
            >
              {securityQuestion}
            </p>
            <input
              type="text"
              placeholder="보안 질문 답변 입력"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              style={{
                width: "100%",
                border: answerError ? "2px solid #FF7B00" : "1px solid #FFD7B5",
                borderRadius: "10px",
                padding: "12px",
                background: "#FFF8F1",
                fontSize: "0.95rem",
                marginBottom: "0.8rem",
                outline: "none",
              }}
            />
            {answerError && (
              <p style={{ color: "#FF7B00", fontSize: "0.85rem", marginBottom: "0.8rem" }}>
                {answerError}
              </p>
            )}
            <button onClick={handleSecurityAnswer} style={buttonStyle(true)}>
              확인
            </button>
          </>
        )}

        {/* STEP 3: 성공 */}
        {step === "success" && (
          <>
            <p
              style={{
                marginBottom: "1rem",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              ✅ 보안 질문이 확인되었습니다.
            </p>
            {tempPassword && (
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <p style={{ fontWeight: 700, marginBottom: "0.5rem" }}>임시 비밀번호</p>
                <p
                  style={{
                    background: "#FFF3E8",
                    padding: "12px",
                    borderRadius: "10px",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "#FF7B00",
                    letterSpacing: "0.5px",
                  }}
                >
                  {tempPassword}
                </p>
                <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
                  로그인 후 반드시 비밀번호를 변경해주세요.
                </p>
              </div>
            )}
            <button onClick={() => router.push("/sign/signin")} style={buttonStyle(true)}>
              로그인 페이지로 이동
            </button>
          </>
        )}

        {/* 하단 링크 */}
        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem" }}>
          이미 계정이 있나요?{" "}
          <span
            style={{ color: "#FF7B00", cursor: "pointer", fontWeight: 700 }}
            onClick={() => router.push("/sign/signin")}
          >
            로그인
          </span>
        </div>
      </div>
    </div>
  );
}

const buttonStyle = (active: boolean) => ({
  width: "100%",
  background: active
    ? "linear-gradient(135deg, #FF9B42, #FF7B00)"
    : "#E5E7EB",
  color: "#fff",
  fontWeight: 800,
  fontSize: "1rem",
  padding: "14px",
  borderRadius: "999px",
  border: "none",
  cursor: active ? "pointer" : "not-allowed",
  boxShadow: active ? "0 6px 16px rgba(255,123,0,0.35)" : "none",
  transition: "all 0.25s ease",
});
