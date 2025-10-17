"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../../../../../firebase";

// 간단 ICS 생성기
function downloadICS({
  title,
  description,
  startAt, // Date
  durationMinutes = 90,
  locationText,
}: {
  title: string;
  description?: string;
  startAt: Date;
  durationMinutes?: number;
  locationText?: string;
}) {
  const dt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const end = new Date(startAt.getTime() + durationMinutes * 60 * 1000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LunchMate//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `DTSTAMP:${dt(new Date())}`,
    `DTSTART:${dt(startAt)}`,
    `DTEND:${dt(end)}`,
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description.replace(/\n/g, "\\n")}` : "",
    locationText ? `LOCATION:${locationText}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "event.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export default function UplistPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // 지도에서 온 파라미터
  const source = sp.get("source"); // 'map' | null
  const placeId = sp.get("placeId");
  const placeName = sp.get("placeName");
  const lat = sp.get("lat");
  const lng = sp.get("lng");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");

  // 폼 상태
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [category, setCategory] = useState("한식");
  const [maxParticipants, setMaxParticipants] = useState<number>(2);

  const [location, setLocation] = useState(""); // 서울 구 단위
  const [preferredGender, setPreferredGender] = useState("");
  const [preferredMbti, setPreferredMbti] = useState<string[]>([]);
  const [chatLink, setChatLink] = useState(""); // 오픈채팅/링크

  // 모임 시간: 날짜 + 시간(로컬)
  const [meetDate, setMeetDate] = useState<string>(""); // yyyy-mm-dd
  const [meetTime, setMeetTime] = useState<string>("19:00"); // HH:mm

  const categories = ["한식", "중식", "일식", "양식", "카페"];
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
  ];

  // 로그인
  useEffect(() => {
    const u = auth.currentUser;
    if (u) {
      setCurrentUserId(u.uid);
      setCurrentUserName(u.displayName || "");
    }
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
        setCurrentUserName(user.displayName || "");
      } else {
        setCurrentUserId(null);
        setCurrentUserName("");
      }
    });
    return () => unsub();
  }, []);

  // 지도에서 오면 프리필
  useEffect(() => {
    if (source === "map") {
      if (placeName && !restaurant) setRestaurant(placeName);
      if (placeName && !title) setTitle(`${placeName} 같이 가실 분?`);
    }
  }, [source, placeName, restaurant, title]);

  const toggleMbti = (mbti: string) => {
    setPreferredMbti((prev) =>
      prev.includes(mbti) ? prev.filter((m) => m !== mbti) : [...prev, mbti]
    );
  };

  const fromMapBadge = useMemo(
    () =>
      source === "map" ? (
        <span
          style={{
            marginLeft: "0.5rem",
            fontSize: "0.75rem",
            padding: "0.1rem 0.4rem",
            borderRadius: "6px",
            backgroundColor: "#ffe4e6",
            color: "#be123c",
            border: "1px solid #fecdd3",
          }}
        >
          지도에서 작성됨
        </span>
      ) : null,
    [source]
  );

  // meetAt(Timestamp) 계산
  const getMeetAt = (): Timestamp | null => {
    if (!meetDate || !meetTime) return null;
    const [hh, mm] = meetTime.split(":").map((v) => parseInt(v, 10));
    const d = new Date(meetDate);
    d.setHours(hh, mm, 0, 0);
    return Timestamp.fromDate(d);
  };

  const handleSubmit = async () => {
    if (!currentUserId) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!title || !restaurant) {
      alert("음식점 이름과 제목은 필수입니다.");
      return;
    }
    const meetAtTs = getMeetAt();
    if (!meetAtTs) {
      const ok = confirm("모임 시간을 입력하지 않았습니다. 지금 그대로 등록할까요?");
      if (!ok) return;
    }

    try {
      // posts doc 생성
      const payload: any = {
        authorId: currentUserId,
        authorName: currentUserName,
        title,
        content,
        restaurant,
        category,
        location,
        preferredGender,
        preferredMbti,
        maxParticipants,
        status: "open", // open|full|closed
        createdAt: Timestamp.now(),
        chatLink: chatLink || null,
      };

      // 지도에서 작성 정보 + place 저장
      if (source === "map") {
        payload.source = "map";
        payload.place = {
          id: placeId || null,
          name: placeName || restaurant,
          lat: lat ? Number(lat) : null,
          lng: lng ? Number(lng) : null,
          address: null, // 필요 시 지도에서 주소도 넘겨 저장 가능
        };
      }

      if (meetAtTs) payload.meetAt = meetAtTs;

      const postRef = await addDoc(collection(db, "posts"), payload);

      // 참가자 서브컬렉션: 작성자 본인 자동 참여
      await setDoc(
        doc(db, "posts", postRef.id, "participants", currentUserId),
        {
          uid: currentUserId,
          name: currentUserName || "익명",
          joinedAt: Timestamp.now(),
        }
      );

      // 꽉찬 상태 처리(최대인원 1인 설정 등 대비)
      if (maxParticipants <= 1) {
        await setDoc(
          doc(db, "posts", postRef.id),
          { status: "full" },
          { merge: true }
        );
      }

      // ICS 빠른 다운(옵션) — 모임 시간 입력되어 있으면 생성
      if (meetAtTs) {
        const meetDateObj = meetAtTs.toDate();
        downloadICS({
          title: `[밥친구] ${restaurant}`,
          description: content || `${restaurant} 밥친구 모임`,
          startAt: meetDateObj,
          durationMinutes: 90,
          locationText:
            (source === "map" && placeName) ? `${placeName}` : restaurant,
        });
      }

      alert("글이 등록되었습니다.");
      router.push("/pages/matches"); // 홈으로 이동
    } catch (err) {
      console.error(err);
      alert("글 등록에 실패했습니다.");
    }
  };

  // 빠른 프리셋 버튼
  const quickSetMeetAt = (preset: "TODAY_NOON" | "TODAY_EVENING" | "TOMORROW_EVENING") => {
    const now = new Date();
    const pad = (n: number) => `${n}`.padStart(2, "0");

    let d = new Date(now);
    let h = 19, m = 0;

    if (preset === "TODAY_NOON") { h = 12; m = 30; }
    if (preset === "TODAY_EVENING") { h = 19; m = 0; }
    if (preset === "TOMORROW_EVENING") { d = new Date(now.getTime() + 86400000); h = 19; m = 0; }

    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());

    setMeetDate(`${yyyy}-${MM}-${dd}`);
    setMeetTime(`${pad(h)}:${pad(m)}`);
  };

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
        글 등록
        {fromMapBadge}
      </h1>

      {source === "map" && (
        <div style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
          선택한 장소: <b>{placeName}</b>
          {lat && lng ? ` · (${lat}, ${lng})` : null}
        </div>
      )}

      {/* 음식점 */}
      <input
        type="text"
        placeholder="음식점 이름"
        value={restaurant}
        onChange={(e) => setRestaurant(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: 8 }}
      />

      {/* 카테고리 */}
      <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
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
        style={{ width: "100%", padding: "10px", marginBottom: 8 }}
      />

      {/* 내용 */}
      <textarea
        placeholder="글 내용 (만날 장소, 분위기, 예산 등)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ width: "100%", padding: "10px", minHeight: 100, marginBottom: 8 }}
      />

      {/* 모임 시간 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label>모임 날짜</label>
        <input type="date" value={meetDate} onChange={(e) => setMeetDate(e.target.value)} />
        <label>시간</label>
        <input type="time" value={meetTime} onChange={(e) => setMeetTime(e.target.value)} />
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" onClick={() => quickSetMeetAt("TODAY_NOON")} style={{ border: "1px solid #ccc", padding: "6px 8px", borderRadius: 6 }}>오늘 점심</button>
          <button type="button" onClick={() => quickSetMeetAt("TODAY_EVENING")} style={{ border: "1px solid #ccc", padding: "6px 8px", borderRadius: 6 }}>오늘 저녁</button>
          <button type="button" onClick={() => quickSetMeetAt("TOMORROW_EVENING")} style={{ border: "1px solid #ccc", padding: "6px 8px", borderRadius: 6 }}>내일 저녁</button>
        </div>
      </div>

      {/* 모집 인원 */}
      <input
        type="number"
        min={1}
        placeholder="모집 인원"
        value={maxParticipants}
        onChange={(e) => setMaxParticipants(Number(e.target.value))}
        style={{ width: "100%", padding: "10px", marginBottom: 8 }}
      />

      {/* 지역 (서울 구) */}
      <select
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: 8 }}
      >
        <option value="">장소 선택 (서울 내 구)</option>
        {SEOUL_DISTRICTS.map((dist) => (
          <option key={dist} value={dist}>{dist}</option>
        ))}
      </select>

      {/* 희망 성별 */}
      <select
        value={preferredGender}
        onChange={(e) => setPreferredGender(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: 8 }}
      >
        <option value="">성별 무관</option>
        <option value="male">남성</option>
        <option value="female">여성</option>
      </select>

      {/* 희망 MBTI */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>희망 MBTI (선택)</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {MBTI_TYPES.map((mbti) => (
            <button
              key={mbti}
              type="button"
              onClick={() => toggleMbti(mbti)}
              style={{
                padding: "6px 8px",
                borderRadius: 8,
                border: preferredMbti.includes(mbti) ? "2px solid #003366" : "1px solid #ccc",
                backgroundColor: preferredMbti.includes(mbti) ? "#003366" : "white",
                color: preferredMbti.includes(mbti) ? "white" : "#003366",
                cursor: "pointer",
              }}
            >
              {mbti}
            </button>
          ))}
        </div>
      </div>

      {/* 채팅 링크 */}
      <input
        type="url"
        placeholder="오픈채팅/연락 링크 (선택)"
        value={chatLink}
        onChange={(e) => setChatLink(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: 12 }}
      />

      <button
        onClick={handleSubmit}
        style={{
          padding: "10px 18px",
          backgroundColor: "#003366",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        등록
      </button>
    </div>
  );
}
