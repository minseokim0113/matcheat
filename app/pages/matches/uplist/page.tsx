"use client";
import { Suspense } from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addDoc, collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../../../../firebase";

// ✅ ICS 생성 함수
async function downloadICS({
  title,
  description,
  startAt,
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
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

  const end = new Date(startAt.getTime() + durationMinutes * 60 * 1000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MatchEat//EN",
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

  const file = new File([ics], "match_eat_event.ics", { type: "text/calendar" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: `[밥친구] ${title}`,
        text: "모임 일정이 생성되었습니다. 캘린더에 추가해보세요!",
        files: [file],
      });
    } catch {
      console.log("사용자가 공유를 취소했습니다.");
    }
  } else {
    alert("📅 모임 일정이 생성되었습니다. 캘린더 앱에서 직접 추가해주세요!");
  }
}

// ✅ 1️⃣ 바깥쪽: Suspense로 감싸는 부모
export default function UplistPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <InnerUplistPage />
    </Suspense>
  );
}

function InnerUplistPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const source = sp.get("source");
  const placeId = sp.get("placeId");
  const placeName = sp.get("placeName");
  const latParam = sp.get("lat");
  const lngParam = sp.get("lng");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [category, setCategory] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<number>(2);
  const [location, setLocation] = useState("");
  const [preferredGender, setPreferredGender] = useState("");
  const [preferredMbti, setPreferredMbti] = useState<string[]>([]);
  const [chatLink, setChatLink] = useState("");
  const [lat, setLat] = useState<number | null>(latParam ? Number(latParam) : null);
  const [lng, setLng] = useState<number | null>(lngParam ? Number(lngParam) : null);

  const [meetDate, setMeetDate] = useState("");
  const [meetTime, setMeetTime] = useState("19:00");

  const mapRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<any>(null);

  const categories = ["한식", "중식", "일식", "양식", "카페"];
  const MBTI_TYPES = [
    "INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP",
    "ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP",
  ];

  useEffect(() => {
    const u = auth.currentUser;
    if (u) {
      setCurrentUserId(u.uid);
      setCurrentUserName(u.displayName || "익명");
    }
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
        setCurrentUserName(user.displayName || "익명");
      } else {
        setCurrentUserId(null);
        setCurrentUserName("");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (source === "map" && placeName && !restaurant) {
      setRestaurant(placeName);
      setTitle(`${placeName} 같이 가실 분?`);
    }
  }, [source, placeName, restaurant]);

  useEffect(() => {
    if (source === "map") return;

    const loadMap = () => {
      const w = window as any;
      const kakao = w.kakao;
      if (!kakao?.maps || !mapRef.current) return;

      const map = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(37.5665, 126.978),
        level: 4,
      });

      const geocoder = new kakao.maps.services.Geocoder();

      kakao.maps.event.addListener(map, "click", (mouseEvent: any) => {
        const latlng = mouseEvent.latLng;
        if (markerRef.current) markerRef.current.setMap(null);
        markerRef.current = new kakao.maps.Marker({ position: latlng, map });

        const latValue = latlng.getLat();
        const lngValue = latlng.getLng();

        setLat(latValue);
        setLng(lngValue);

        geocoder.coord2Address(lngValue, latValue, (result: any, status: any) => {
          if (status === kakao.maps.services.Status.OK) {
            const addr =
              result[0].road_address?.address_name ||
              result[0].address.address_name;
            setLocation(addr);
          }
        });
      });
    };

    const w = window as any;
    if (w.kakao?.maps && w.kakao.maps.services) {
      w.kakao.maps.load(loadMap);
    } else {
      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&libraries=services&autoload=false`;
      script.async = true;
      script.onload = () => (window as any).kakao.maps.load(loadMap);
      document.head.appendChild(script);
    }
  }, [source]);

  const toggleMbti = (mbti: string) => {
    setPreferredMbti((prev) =>
      prev.includes(mbti) ? prev.filter((m) => m !== mbti) : [...prev, mbti]
    );
  };

  const getMeetAt = (): Timestamp | null => {
    if (!meetDate || !meetTime) return null;
    const [hh, mm] = meetTime.split(":").map(Number);
    const d = new Date(meetDate);
    d.setHours(hh, mm, 0, 0);
    return Timestamp.fromDate(d);
  };

  const handleSubmit = async () => {
    if (!currentUserId) return alert("로그인이 필요합니다.");
    if (!title || !restaurant) return alert("음식점 이름과 제목은 필수입니다.");
    if (!lat || !lng) return alert("위치를 선택해주세요.");
    if (!category) return alert("카테고리를 선택해주세요.");

    try {
      const meetAtTs = getMeetAt();

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
        status: "open",
        participantsCount: 1,
        chatLink: chatLink || null,
        createdAt: Timestamp.now(),
      };

      if (maxParticipants === 1) payload.status = "closed";

      payload.place = {
        id: placeId || null,
        name: placeName || restaurant,
        lat: lat,
        lng: lng,
        address: location,
      };

      if (source === "map") payload.source = "map";
      if (meetAtTs) {
        downloadICS({
          title: `[밥친구] ${restaurant}`,
          description: content || `${restaurant} 모임`,
          startAt: meetAtTs.toDate(),
          locationText: location || restaurant,
        });
      }

      const postRef = await addDoc(collection(db, "posts"), payload);

      await setDoc(doc(db, "posts", postRef.id, "participants", currentUserId), {
        uid: currentUserId,
        name: currentUserName,
        joinedAt: Timestamp.now(),
      });

      await setDoc(doc(db, "posts", postRef.id), { participantsCount: 1 }, { merge: true });

      alert("글이 등록되었습니다!");
      router.push("/pages/matches");
    } catch (err) {
      console.error("글 등록 실패:", err);
      alert("글 등록에 실패했습니다.");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#FFF8F1",
        minHeight: "100vh",
        fontFamily: "'Noto Sans KR', sans-serif",
        padding: "1.5rem",
        color: "#3B2B1B",
      }}
    >
      {/* 상단 헤더 */}
      <header
        style={{
          background: "linear-gradient(90deg, #FF9B42, #FF7B00)",
          color: "#fff",
          padding: "1rem 1.2rem",
          borderRadius: 18,
          marginBottom: "1.2rem",
          fontWeight: 800,
          fontSize: "1.3rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        ✏️ 모집글 작성
      </header>

      {/* 지도 정보 */}
      {source === "map" ? (
        <div style={{ fontSize: 14, color: "#5B3A1C", marginBottom: 16 }}>
          📍 선택된 장소: <b>{placeName}</b> ({lat}, {lng})
        </div>
      ) : (
        <>
          <div
            ref={mapRef}
            style={{
              width: "100%",
              height: "250px",
              border: "2px solid #FFD9A3",
              borderRadius: "16px",
              marginBottom: "0.8rem",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            }}
          />
          {lat && lng && (
            <div style={{ fontSize: 14, color: "#5B3A1C", marginBottom: 16 }}>
              📍 선택된 위치: <b>{lat.toFixed(5)}, {lng.toFixed(5)}</b><br />
              🏠 주소: {location || "주소 변환 중..."}
            </div>
          )}
        </>
      )}

      {/* 입력 폼 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        <input
          type="text"
          placeholder="🍴 음식점 이름"
          value={restaurant}
          onChange={(e) => setRestaurant(e.target.value)}
          style={{
            padding: "0.8rem",
            borderRadius: 12,
            border: "1.8px solid #FFB26B",
            fontSize: "0.95rem",
          }}
        />

        {/* 카테고리 버튼 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 999,
                border: "none",
                background: category === cat ? "#FF7B00" : "#FFF3E0",
                color: category === cat ? "#fff" : "#4B2F14",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow:
                  category === cat
                    ? "0 3px 8px rgba(255,123,0,0.35)"
                    : "0 2px 4px rgba(0,0,0,0.05)",
                transition: "all 0.25s ease",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="📌 글 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            padding: "0.8rem",
            borderRadius: 12,
            border: "1.8px solid #FFB26B",
            fontSize: "0.95rem",
          }}
        />

        <textarea
          placeholder="✍️ 글 내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            padding: "0.8rem",
            borderRadius: 12,
            border: "1.8px solid #FFB26B",
            minHeight: 120,
            fontSize: "0.95rem",
          }}
        />

        {/* 모임 시간 */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <label>📅 날짜</label>
          <input
            type="date"
            value={meetDate}
            onChange={(e) => setMeetDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
          <label>🕒 시간</label>
          <input type="time" value={meetTime} onChange={(e) => setMeetTime(e.target.value)} />
        </div>

        <input
          type="number"
          min={1}
          placeholder="👥 모집 인원"
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(Number(e.target.value))}
          style={{
            padding: "0.8rem",
            borderRadius: 12,
            border: "1.8px solid #FFB26B",
            fontSize: "0.95rem",
          }}
        />

        <select
          value={preferredGender}
          onChange={(e) => setPreferredGender(e.target.value)}
          style={{
            padding: "0.8rem",
            borderRadius: 12,
            border: "1.8px solid #FFB26B",
            fontSize: "0.95rem",
          }}
        >
          <option value="">성별 무관</option>
          <option value="male">남성</option>
          <option value="female">여성</option>
        </select>

        {/* MBTI 선택 */}
        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>MBTI 희망 유형</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {MBTI_TYPES.map((mbti) => (
              <button
                key={mbti}
                onClick={() => toggleMbti(mbti)}
                style={{
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: preferredMbti.includes(mbti)
                    ? "2px solid #FF7B00"
                    : "1px solid #FFDAB5",
                  background: preferredMbti.includes(mbti)
                    ? "#FF7B00"
                    : "#FFF8F1",
                  color: preferredMbti.includes(mbti) ? "#fff" : "#5B3A1C",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "0.25s",
                }}
              >
                {mbti}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          style={{
            padding: "0.9rem 1.2rem",
            background: "linear-gradient(135deg, #FF9B42, #FF6A00)",
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: "1rem",
            fontWeight: 700,
            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            cursor: "pointer",
            marginTop: "0.8rem",
          }}
        >
          ✅ 등록하기
        </button>
      </div>
    </div>
  );
}
