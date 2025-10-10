"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../../../firebase";

// 공통 상수
const CATEGORIES = ["한식", "중식", "일식", "양식"] as const;
const SEOUL_DISTRICTS = [
  "강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
  "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구",
  "성동구","성북구","송파구","양천구","영등포구","용산구","은평구",
  "종로구","중구","중랑구",
] as const;

const MBTI_TYPES = [
  "INTJ","INTP","ENTJ","ENTP",
  "INFJ","INFP","ENFJ","ENFP",
  "ISTJ","ISFJ","ESTJ","ESFJ",
  "ISTP","ISFP","ESTP","ESFP",
] as const;

export default function UplistPage() {
  const router = useRouter();

  // 로그인 사용자
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [authReady, setAuthReady] = useState(false);

  // 폼 상태
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("한식");
  const [maxParticipants, setMaxParticipants] = useState<number>(1);
  const [location, setLocation] = useState<string>("");
  const [preferredGender, setPreferredGender] = useState<"" | "male" | "female">("");
  const [preferredMbti, setPreferredMbti] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 로그인 상태 감지
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
      setCurrentUserName(user.displayName || "");
    }
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) {
        setCurrentUserId(u.uid);
        setCurrentUserName(u.displayName || "");
      } else {
        setCurrentUserId(null);
        setCurrentUserName("");
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // MBTI 토글
  const toggleMbti = (mbti: string) => {
    setPreferredMbti((prev) =>
      prev.includes(mbti) ? prev.filter((m) => m !== mbti) : [...prev, mbti]
    );
  };

  // 제출 버튼 활성화 여부
  const canSubmit = useMemo(() => {
    if (!authReady || !currentUserId) return false;
    if (submitting) return false;
    if (!title.trim() || !content.trim() || !restaurant.trim()) return false;
    if (maxParticipants <= 0) return false;
    return true;
  }, [authReady, currentUserId, submitting, title, content, restaurant, maxParticipants]);

  // 제출
  const handleSubmit = async () => {
    if (!canSubmit) {
      return alert("입력값 또는 로그인 상태를 확인해 주세요.");
    }

    setSubmitting(true);
    try {
      // Firestore에 들어갈 payload 구성 (undefined 필드는 제거)
      const payload: any = {
        authorId: currentUserId,
        title: title.trim(),
        content: content.trim(),
        restaurant: restaurant.trim(),
        category,
        maxParticipants,
        status: "open",
        createdAt: serverTimestamp(),
      };

      if (currentUserName) payload.authorName = currentUserName;
      if (location) payload.location = location;
      if (preferredGender) payload.preferredGender = preferredGender;
      if (preferredMbti.length) payload.preferredMbti = preferredMbti;

      await addDoc(collection(db, "posts"), payload);

      alert("글이 등록되었습니다.");
      router.push("/pages/matches");
      // App Router에서는 새로고침으로 목록 최신화
      // @ts-ignore
      router.refresh?.();
    } catch (e: any) {
      console.error("글 등록 실패:", e);
      alert(`글 등록 실패: ${e?.code || e?.name || "unknown"} / ${e?.message || e}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>글 등록</h1>

      {/* 음식점 */}
      <input
        type="text"
        placeholder="음식점 이름"
        value={restaurant}
        onChange={(e) => setRestaurant(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
      />

      {/* 카테고리 */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "5px",
              border: category === cat ? "2px solid #003366" : "1px solid #ccc",
              backgroundColor: category === cat ? "#003366" : "white",
              color: category === cat ? "white" : "#003366",
              cursor: "pointer",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 제목 */}
      <input
        type="text"
        placeholder="글 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
      />

      {/* 내용 */}
      <textarea
        placeholder="글 내용"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", minHeight: "100px" }}
      />

      {/* 모집 인원 */}
      <input
        type="number"
        min={1}
        placeholder="모집 인원"
        value={maxParticipants}
        onChange={(e) => setMaxParticipants(Math.max(1, Number(e.target.value)))}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
      />

      {/* 장소 (서울 구) */}
      <select
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
      >
        <option value="">장소 선택 (서울 내 구, 선택)</option>
        {SEOUL_DISTRICTS.map((dist) => (
          <option key={dist} value={dist}>{dist}</option>
        ))}
      </select>

      {/* 희망 성별 */}
      <select
        value={preferredGender}
        onChange={(e) => setPreferredGender(e.target.value as "" | "male" | "female")}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
      >
        <option value="">성별 무관</option>
        <option value="male">남성</option>
        <option value="female">여성</option>
      </select>

      {/* 희망 MBTI */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>희망 MBTI (복수 선택)</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {MBTI_TYPES.map((mbti) => {
            const active = preferredMbti.includes(mbti);
            return (
              <button
                key={mbti}
                type="button"
                onClick={() => toggleMbti(mbti)}
                style={{
                  padding: "0.3rem 0.6rem",
                  borderRadius: "5px",
                  border: active ? "2px solid #003366" : "1px solid #ccc",
                  backgroundColor: active ? "#003366" : "white",
                  color: active ? "white" : "#003366",
                  cursor: "pointer",
                }}
              >
                {mbti}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          padding: "0.5rem 1.5rem",
          backgroundColor: !canSubmit ? "#7f8c8d" : "#003366",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: !canSubmit ? "not-allowed" : "pointer",
        }}
      >
        {submitting ? "등록 중..." : "등록"}
      </button>
    </div>
  );
}

