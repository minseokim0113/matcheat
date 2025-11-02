"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../../firebase";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";
import { Lock, ArrowLeft } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = auth.currentUser;
    if (!user || !user.email) {
      toast.error("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("새 비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);
      toast.success("비밀번호가 성공적으로 변경되었습니다!");
      setTimeout(() => router.push("/pages/mypage"), 1500);
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/wrong-password") {
        toast.error("현재 비밀번호가 올바르지 않습니다.");
      } else {
        toast.error("비밀번호 변경 중 오류가 발생했습니다.");
      }
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
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Noto Sans KR', sans-serif",
        color: "#3B2B1B",
        padding: "2rem 1rem",
      }}
    >
      <Toaster position="top-center" />

      {/* 헤더 */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          width: "100%",
          background: "linear-gradient(90deg, #FF9B42, #FF7B00)",
          color: "#fff",
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
        🔒 비밀번호 변경
      </header>

      {/* 카드 */}
      <div
        style={{
          background: "#FFFDF9",
          borderRadius: 20,
          boxShadow: "0 6px 14px rgba(0,0,0,0.07)",
          padding: "2rem 1.8rem",
          width: "90%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Lock size={48} color="#FF7B00" style={{ marginBottom: "1rem" }} />
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            비밀번호 변경
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#7A5A3D" }}>
            보안을 위해 주기적으로 비밀번호를 변경하세요.
          </p>
        </div>

        {/* 입력 폼 */}
        <form
          onSubmit={handlePasswordChange}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginTop: "0.5rem",
          }}
        >
          <label style={labelStyle}>현재 비밀번호</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="현재 비밀번호를 입력하세요"
            style={inputStyle}
          />

          <label style={labelStyle}>새 비밀번호</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="새 비밀번호를 입력하세요"
            style={inputStyle}
          />

          <label style={labelStyle}>새 비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="다시 한 번 입력하세요"
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading
                ? "linear-gradient(135deg, #9CA3AF, #A5A5A5)"
                : "linear-gradient(135deg, #FF9B42, #FF7B00)",
              color: "white",
              fontWeight: 700,
              padding: "0.9rem",
              borderRadius: 12,
              border: "none",
              width: "100%",
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 6px 14px rgba(0,0,0,0.1)",
              transition: "all 0.25s ease",
              marginTop: "0.5rem",
            }}
            onMouseEnter={(e) =>
              !loading && (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseLeave={(e) =>
              !loading && (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            {loading ? "변경 중..." : "비밀번호 변경하기"}
          </button>
        </form>

        {/* 돌아가기 버튼 */}
        <button
          onClick={() => router.push("/pages/mypage")}
          style={{
            marginTop: "1.5rem",
            background: "#FFF3E0",
            color: "#B64E00",
            fontWeight: 700,
            padding: "0.8rem",
            borderRadius: 10,
            border: "none",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "#FFE0B2")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "#FFF3E0")
          }
        >
          <ArrowLeft size={16} /> 돌아가기
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "0.9rem",
  color: "#5A3A1C",
};

const inputStyle: React.CSSProperties = {
  padding: "0.7rem 0.9rem",
  borderRadius: "8px",
  border: "1px solid #FFE3C2",
  backgroundColor: "#FFF9F4",
  fontSize: "0.95rem",
  color: "#3B2B1B",
  outline: "none",
  width: "100%",
};
