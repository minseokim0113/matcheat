"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function ProfilePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<"남성" | "여성" | "">("");
  const [profileColor, setProfileColor] = useState("#60a5fa");

  const [district, setDistrict] = useState("");
  const [mbti, setMbti] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const seoulDistricts = [
    "강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
    "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구",
    "성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"
  ];

  const mbtiList = [
    "ISTJ","ISFJ","INFJ","INTJ",
    "ISTP","ISFP","INFP","INTP",
    "ESTP","ESFP","ENFP","ENTP",
    "ESTJ","ESFJ","ENFJ","ENTJ"
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        alert("로그인이 필요합니다.");
        router.push("/sign/signin");
        return;
      }
      setUid(user.uid);
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setName(data.name || "");
        setBio(data.bio || "");
        setGender(data.gender || "");
        setProfileColor(data.profileColor || "#60a5fa");
        setDistrict(data.district || "");
        setMbti(data.mbti || "");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSave = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        name,
        bio,
        gender,
        profileColor,
        district,
        mbti,
        updatedAt: new Date(),
      });
      alert("프로필이 성공적으로 수정되었습니다!");
      router.push("/pages/mypage");
    } catch (error) {
      console.error("프로필 수정 실패:", error);
      alert("프로필 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "50px", color: "#7A5A3D" }}>
        로딩 중...
      </div>
    );

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
        paddingBottom: "5rem",
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
        ✏️ 프로필 수정
      </header>

      {/* 본문 카드 */}
      <div
        style={{
          background: "#FFFDF9",
          borderRadius: 20,
          boxShadow: "0 6px 14px rgba(0,0,0,0.07)",
          padding: "2rem 1.5rem",
          width: "90%",
          maxWidth: "420px",
          marginTop: "1rem",
        }}
      >
        {/* 이름 */}
        <label style={labelStyle}>이름</label>
        <input
          type="text"
          placeholder="이름 입력"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />

        {/* 자기소개 */}
        <label style={labelStyle}>자기소개</label>
        <textarea
          placeholder="자기소개 입력"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          style={{ ...inputStyle, height: "100px", resize: "none" }}
        />

        {/* 성별 */}
        <label style={labelStyle}>성별</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as "남성" | "여성")}
          style={inputStyle}
        >
          <option value="">성별 선택</option>
          <option value="남성">남성</option>
          <option value="여성">여성</option>
        </select>

        {/* 사는 구 */}
        <label style={labelStyle}>사는 구</label>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          style={inputStyle}
        >
          <option value="">사는 구 선택</option>
          {seoulDistricts.map((gu) => (
            <option key={gu} value={gu}>
              {gu}
            </option>
          ))}
        </select>

        {/* MBTI */}
        <label style={labelStyle}>MBTI</label>
        <select
          value={mbti}
          onChange={(e) => setMbti(e.target.value)}
          style={inputStyle}
        >
          <option value="">MBTI 선택</option>
          {mbtiList.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        {/* 색상 선택 */}
        <label style={{ ...labelStyle, marginBottom: "8px" }}>
          프로필 색상 🎨
        </label>
        <input
          type="color"
          value={profileColor}
          onChange={(e) => setProfileColor(e.target.value)}
          style={{
            width: "100%",
            height: "44px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: "1.8rem",
          }}
        />

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving
              ? "linear-gradient(135deg, #9CA3AF, #A5A5A5)"
              : "linear-gradient(135deg, #FF9B42, #FF7B00)",
            color: "white",
            fontWeight: 700,
            padding: "0.9rem",
            borderRadius: 12,
            border: "none",
            width: "100%",
            fontSize: "15px",
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 6px 14px rgba(0,0,0,0.1)",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) =>
            !saving &&
            (e.currentTarget.style.transform = "translateY(-2px)")
          }
          onMouseLeave={(e) =>
            !saving && (e.currentTarget.style.transform = "translateY(0)")
          }
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: "0.95rem",
  color: "#5A3A1C",
  marginBottom: "6px",
  marginTop: "1rem",
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginBottom: "1rem",
  padding: "0.7rem 0.8rem",
  borderRadius: "8px",
  border: "1px solid #FFE3C2",
  backgroundColor: "#FFF9F4",
  fontSize: "0.95rem",
  color: "#3B2B1B",
  outline: "none",
};
