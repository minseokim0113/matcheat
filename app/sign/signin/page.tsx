"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 200);
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    setIsFormValid(validateEmail(email) && password.length >= 8);
  }, [email, password]);

  const handleLogin = async () => {
    const newErrors: { email?: string; password?: string; general?: string } = {};
    if (!validateEmail(email)) newErrors.email = "올바른 이메일을 입력해주세요.";
    if (password.length < 8) newErrors.password = "비밀번호는 8자리 이상이어야 합니다.";
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("로그인 성공!");
        router.push("/pages/matches");
      } catch (err: any) {
        let message = "로그인에 실패했습니다.";
        if (err.code === "auth/user-not-found") message = "가입되지 않은 이메일입니다.";
        else if (err.code === "auth/wrong-password") message = "비밀번호가 잘못되었습니다.";
        else if (err.code === "auth/invalid-email") message = "잘못된 이메일 형식입니다.";
        setErrors({ general: message });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        backgroundColor: "#FFF8F1",
        fontFamily: "'Noto Sans KR', sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 오렌지빛 그라데이션 장식 */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          left: "-120px",
          width: "350px",
          height: "350px",
          background:
            "radial-gradient(circle at center, rgba(255,155,66,0.35), transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          right: "-100px",
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle at center, rgba(255,200,150,0.25), transparent 70%)",
          borderRadius: "50%",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "380px",
          textAlign: "center",
          background: "#FFFDF9",
          borderRadius: "20px",
          padding: "2.4rem 2rem",
          boxShadow: "0 6px 18px rgba(255,155,66,0.25)",
          transform: animate ? "translateY(0)" : "translateY(30px)",
          opacity: animate ? 1 : 0,
          transition: "all 0.8s ease-out",
        }}
      >
        {/* 타이틀 */}
        <h1
          style={{
            fontSize: "2.8rem",
            fontWeight: 900,
            color: "#FF7B00",
            marginBottom: "0.8rem",
            textShadow: "0 2px 8px rgba(255,155,66,0.25)",
          }}
        >
          밥친구
        </h1>
        <p
          style={{
            color: "#5B3A1C",
            fontSize: "1rem",
            marginBottom: "2rem",
            opacity: 0.85,
          }}
        >
          따뜻한 식사, 새로운 인연 🍲 <br /> 이메일로 로그인해주세요.
        </p>

        {/* 이메일 입력 */}
        <input
          type="email"
          placeholder="이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            border: errors.email ? "2px solid #FF3B30" : "1px solid #FFD7B5",
            marginBottom: "12px",
            fontSize: "15px",
            outline: "none",
            background: "#FFF8F1",
            color: "#3B2B1B",
            boxShadow: "0 2px 6px rgba(255,155,66,0.15)",
          }}
        />
        {errors.email && (
          <p style={{ color: "#FF3B30", fontSize: "12px", marginBottom: "8px" }}>
            {errors.email}
          </p>
        )}

        {/* 비밀번호 입력 */}
        <input
          type="password"
          placeholder="비밀번호 (8자리 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            border: errors.password ? "2px solid #FF3B30" : "1px solid #FFD7B5",
            marginBottom: "14px",
            fontSize: "15px",
            outline: "none",
            background: "#FFF8F1",
            color: "#3B2B1B",
            boxShadow: "0 2px 6px rgba(255,155,66,0.15)",
          }}
        />
        {errors.password && (
          <p style={{ color: "#FF3B30", fontSize: "12px", marginBottom: "10px" }}>
            {errors.password}
          </p>
        )}

        {/* 로그인 버튼 */}
        <button
          onClick={handleLogin}
          disabled={!isFormValid || isLoading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "999px",
            border: "none",
            fontWeight: 700,
            fontSize: "1rem",
            color: "#fff",
            background: isFormValid
              ? "linear-gradient(135deg, #FF9B42, #FF7B00)"
              : "rgba(255,167,100,0.5)",
            cursor: isFormValid ? "pointer" : "not-allowed",
            boxShadow: isFormValid
              ? "0 6px 16px rgba(255,123,0,0.35)"
              : "0 2px 6px rgba(0,0,0,0.1)",
            marginBottom: "1.2rem",
            transition: "all 0.25s ease",
          }}
        >
          {isLoading ? "로그인 중..." : "로그인"}
        </button>

        {errors.general && (
          <p style={{ color: "#FF3B30", fontSize: "12px", marginBottom: "16px" }}>
            {errors.general}
          </p>
        )}

        {/* 아이디/비밀번호 찾기 */}
        <div
          style={{
            fontSize: "13px",
            color: "#7A5A3D",
            marginBottom: "1.8rem",
          }}
        >
          <span
            onClick={() => router.push("/find-id")}
            style={{
              cursor: "pointer",
              textDecoration: "underline",
              marginRight: "10px",
            }}
          >
            아이디 찾기
          </span>
          |
          <span
            onClick={() => router.push("/find-password")}
            style={{
              cursor: "pointer",
              textDecoration: "underline",
              marginLeft: "10px",
            }}
          >
            비밀번호 찾기
          </span>
        </div>

        {/* 회원가입 버튼 */}
        <button
          onClick={() => router.push("/sign/signup")}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "999px",
            border: "none",
            fontWeight: 700,
            fontSize: "1rem",
            color: "#fff",
            background: "linear-gradient(135deg, #FF7B00, #FF9B42)",
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(255,123,0,0.35)",
            transition: "all 0.25s ease",
          }}
        >
          회원가입
        </button>
      </div>
    </div>
  );
}
