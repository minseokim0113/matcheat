"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

type PlaceItem = {
  id: string;
  place_name: string;
  road_address_name?: string;
  address_name?: string;
  phone?: string;
  place_url?: string;
  x: string;
  y: string;
  category_name?: string;
};

type RecruitPost = {
  id: string;
  title?: string;
  restaurant?: string;
  authorId?: string;
  authorName?: string;
  lat?: number;
  lng?: number;
  place?: { lat?: number; lng?: number };
};

type Category = "all" | "korean" | "chinese" | "western" | "japanese" | "cafe";

function getPosition(opts: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, opts);
  });
}

export default function MapPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const recruitMarkersRef = useRef<any[]>([]);
  const infoRef = useRef<any | null>(null);
  const myMarkerRef = useRef<any | null>(null);
  const myCircleRef = useRef<any | null>(null);

  const [q, setQ] = useState("");
  const [radius, setRadius] = useState(2000);
  const [activeCat, setActiveCat] = useState<Category>("all");
  const [results, setResults] = useState<PlaceItem[]>([]);
  const [recruitVisible, setRecruitVisible] = useState(false);

  const KAKAO_APPKEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!KAKAO_APPKEY) console.error("KAKAO JS KEY 누락");

  // ==============================
  // 모집글 로드
  // ==============================
  const loadRecruitPosts = async () => {
    try {
      const kakao = (window as any).kakao;
      const snapshot = await getDocs(collection(db, "posts"));
      const posts: RecruitPost[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<RecruitPost, "id">),
      }));

      recruitMarkersRef.current.forEach((m) => m.setMap(null));
      recruitMarkersRef.current = [];

      for (const post of posts) {
        const lat = post.lat ?? post.place?.lat;
        const lng = post.lng ?? post.place?.lng;
        if (!lat || !lng) continue;

        if (!post.authorName && post.authorId) {
          try {
            const userRef = doc(db, "users", post.authorId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              const userData = userDoc.data() as { name?: string };
              post.authorName = userData.name || "익명";
            }
          } catch (err) {
            console.warn("작성자 불러오기 실패:", err);
          }
        }

        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(lat, lng),
          map: mapRef.current,
          title: post.title,
          image: new kakao.maps.MarkerImage(
            "https://cdn-icons-png.flaticon.com/512/3177/3177361.png",
            new kakao.maps.Size(30, 30)
          ),
        });
        recruitMarkersRef.current.push(marker);

        const infoHtml = `
          <div style="padding:10px;min-width:260px;max-width:300px;box-sizing:border-box;">
            <strong style="display:block;margin-bottom:4px;">${post.title || "제목 없음"}</strong>
            🍽 ${post.restaurant || "미정"}<br/>
            👤 ${post.authorName || "작성자 미상"}<br/>
            <button id="post-${post.id}"
              style="margin-top:8px;padding:6px 10px;background:#FF7B00;color:white;border:none;border-radius:6px;cursor:pointer;">
              모집글 보러가기
            </button>
          </div>
        `;
        const infoWindow = new kakao.maps.InfoWindow({
          content: infoHtml,
          zIndex: 5,
          pixelOffset: new kakao.maps.Point(0, -20),
        });

        kakao.maps.event.addListener(marker, "click", () => {
          if (infoRef.current && infoRef.current.marker === marker) {
            infoRef.current.close();
            infoRef.current = null;
            return;
          }

          if (infoRef.current) infoRef.current.close();

          infoWindow.open(mapRef.current, marker);
          infoRef.current = infoWindow;
          infoRef.current.marker = marker;

          setTimeout(() => {
            const btn = document.getElementById(`post-${post.id}`);
            if (btn) btn.onclick = () => router.push(`/pages/matches/${post.id}`);
          }, 100);
        });
      }
    } catch (err) {
      console.error("❌ Firestore 로드 실패:", err);
    }
  };

  // 모집글 보기/끄기
  const toggleRecruitPosts = async () => {
    if (recruitVisible) {
      recruitMarkersRef.current.forEach((m) => m.setMap(null));
      recruitMarkersRef.current = [];
      setRecruitVisible(false);
    } else {
      await loadRecruitPosts();
      setRecruitVisible(true);
    }
  };

  // 지도 초기화
  const init = () => {
    const kakao = (window as any).kakao;
    if (!kakao?.maps || !containerRef.current) return;
    const map = new kakao.maps.Map(containerRef.current, {
      center: new kakao.maps.LatLng(37.5665, 126.978),
      level: 5,
    });
    mapRef.current = map;
    setTimeout(() => mapRef.current?.relayout(), 0);
  };

  useEffect(() => {
    const w = window as any;
    if (w.kakao?.maps && w.kakao.maps.services) {
      w.kakao.maps.load(init);
      return;
    }

    const src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APPKEY}&autoload=false&libraries=services`;
    if (!document.querySelector(`script[src*="dapi.kakao.com"]`)) {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => (window as any).kakao.maps.load(init);
      document.head.appendChild(s);
    }
  }, [KAKAO_APPKEY]);

  // 장소 검색
  const runSearch = ({
    keyword,
    categoryCode,
    center,
  }: {
    keyword?: string;
    categoryCode?: string;
    center?: any;
  }) => {
    if (!mapRef.current) return;
    const kakao = (window as any).kakao;
    const ps = new kakao.maps.services.Places();
    const opts: any = {
      location:
        center ||
        (myMarkerRef.current
          ? myMarkerRef.current.getPosition()
          : mapRef.current.getCenter()),
      radius,
    };

    const showPlaces = (data: any[]) => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      const positions: any[] = [];

      data.forEach((place) => {
        const pos = new kakao.maps.LatLng(Number(place.y), Number(place.x));
        const marker = new kakao.maps.Marker({ position: pos, map: mapRef.current });
        markersRef.current.push(marker);
        positions.push(pos);

        const addr = place.road_address_name || place.address_name || "";
        const infoHtml = `
          <div style="padding:10px;min-width:260px;">
            <strong>${place.place_name}</strong><br/>
            ${addr}<br/>
            <button id="write-${place.id}"
              style="margin-top:8px;padding:6px 10px;background:#FF7B00;color:white;border:none;border-radius:6px;cursor:pointer;">
              🍴 이 장소로 모집글 작성
            </button>
          </div>
        `;
        const info = new kakao.maps.InfoWindow({
          content: infoHtml,
          zIndex: 5,
          pixelOffset: new kakao.maps.Point(0, -20),
        });

        kakao.maps.event.addListener(marker, "click", () => {
          if (infoRef.current && infoRef.current.marker === marker) {
            infoRef.current.close();
            infoRef.current = null;
            return;
          }
          if (infoRef.current) infoRef.current.close();
          info.open(mapRef.current, marker);
          infoRef.current = info;
          infoRef.current.marker = marker;

          setTimeout(() => {
            const btn = document.getElementById(`write-${place.id}`);
            if (btn) {
              btn.onclick = () => {
                const url = `/pages/matches/uplist?source=map&placeId=${encodeURIComponent(
                  place.id
                )}&placeName=${encodeURIComponent(
                  place.place_name
                )}&lat=${encodeURIComponent(
                  place.y
                )}&lng=${encodeURIComponent(place.x)}&category=${encodeURIComponent(
                  activeCat
                )}`;
                router.push(url);
              };
            }
          }, 100);
        });
      });

      if (positions.length) {
        const bounds = new kakao.maps.LatLngBounds();
        positions.forEach((p) => bounds.extend(p));
        mapRef.current.setBounds(bounds);
      }
      setResults(data as PlaceItem[]);
    };

    const cb = (data: any[], status: string) => {
      if (status === kakao.maps.services.Status.OK) showPlaces(data);
      else console.warn("검색 실패 또는 결과 없음");
    };

    if (categoryCode) ps.categorySearch(categoryCode, cb, opts);
    else ps.keywordSearch(keyword || "맛집", cb, opts);
  };

  const handleCategory = (cat: Category) => {
    setActiveCat(cat);
    if (cat === "cafe") return runSearch({ categoryCode: "CE7" });
    if (cat === "korean") return runSearch({ keyword: "한식" });
    if (cat === "chinese") return runSearch({ keyword: "중식" });
    if (cat === "western") return runSearch({ keyword: "양식" });
    if (cat === "japanese") return runSearch({ keyword: "일식" });
    return runSearch({ keyword: q || "맛집" });
  };

  // 내 위치 찾기
  const searchMyLocation = async () => {
    try {
      const pos = await getPosition({ enableHighAccuracy: true });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const kakao = (window as any).kakao;

      if (myMarkerRef.current) myMarkerRef.current.setMap(null);
      if (myCircleRef.current) myCircleRef.current.setMap(null);

      const marker = new kakao.maps.Marker({
        map: mapRef.current,
        position: new kakao.maps.LatLng(lat, lng),
        title: "내 위치",
        image: new kakao.maps.MarkerImage(
          "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
          new kakao.maps.Size(32, 39),
          { offset: new kakao.maps.Point(16, 39) }
        ),
      });
      myMarkerRef.current = marker;

      const circle = new kakao.maps.Circle({
        map: mapRef.current,
        center: marker.getPosition(),
        radius,
        strokeWeight: 2,
        strokeColor: "#FF7B00",
        strokeOpacity: 0.5,
        strokeStyle: "dashed",
        fillColor: "#FFB26B",
        fillOpacity: 0.1,
      });
      myCircleRef.current = circle;

      mapRef.current.setCenter(marker.getPosition());
      runSearch({ keyword: q || "맛집", center: marker.getPosition() });
    } catch (err) {
      console.error("내 위치 검색 실패:", err);
      alert("내 위치를 가져올 수 없습니다.");
    }
  };

  const goRecruitFromSelected = (p?: PlaceItem) => {
    const target = p ?? results[0];
    if (!target) return;
    const url = `/pages/matches/uplist?source=map&placeId=${encodeURIComponent(
      target.id
    )}&placeName=${encodeURIComponent(target.place_name)}&lat=${encodeURIComponent(
      target.y
    )}&lng=${encodeURIComponent(target.x)}&category=${encodeURIComponent(activeCat)}`;
    router.push(url);
  };

  // ===============================
  // 🎨 Matcheat 오렌지톤 디자인 적용
  // ===============================
  return (
    <div
      style={{
        backgroundColor: "#FFF8F1",
        minHeight: "100vh",
        fontFamily: "'Noto Sans KR', sans-serif",
        color: "#3B2B1B",
        padding: "1.2rem 1rem 6rem",
      }}
    >
      {/* 헤더 */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "linear-gradient(90deg, #FF9B42, #FF7B00)",
          color: "#fff",
          padding: "1rem 1.2rem",
          fontWeight: 900,
          fontSize: "1.3rem",
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          boxShadow: "0 3px 10px rgba(255,155,66,0.3)",
          textAlign: "center", // ✅ 가운데 정렬 추가
          letterSpacing: "0.5px", // ✅ 가독성 살짝 향상
        }}
      >
        🗺 밥친구 지도
      </header>

      {/* 검색 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.6rem",
          margin: "1.2rem 0 1.4rem",
          background: "#FFFDF9",
          borderRadius: 16,
          boxShadow: "0 4px 10px rgba(255,155,66,0.15)",
          padding: "0.9rem 1rem",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCategory("all")}
          placeholder="맛집, 카페, 한식 등을 검색해보세요 🍴"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: "0.95rem",
            background: "transparent",
            color: "#3B2B1B",
          }}
        />
        <button
          onClick={() => handleCategory("all")}
          style={{
            background: "linear-gradient(135deg, #FF9B42, #FF7B00)",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "0.65rem 1.1rem",
            fontWeight: 700,
            boxShadow: "0 4px 10px rgba(255,123,0,0.3)",
            cursor: "pointer",
          }}
        >
          🔍 검색
        </button>
        <button
          onClick={searchMyLocation}
          style={{
            background: "#FFF3E0",
            color: "#A0522D",
            border: "none",
            borderRadius: 10,
            padding: "0.65rem 1rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          📍 내 위치
        </button>
        <button
          onClick={toggleRecruitPosts}
          style={{
            background: recruitVisible
              ? "linear-gradient(135deg, #FF7B00, #FF9B42)"
              : "#FFE7CF",
            color: recruitVisible ? "white" : "#FF7B00",
            border: "none",
            borderRadius: 10,
            padding: "0.65rem 1rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.25s",
          }}
        >
          📢 모집글 {recruitVisible ? "끄기" : "보기"}
        </button>
      </div>

      {/* 카테고리 버튼 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        {[
          { key: "all", label: "전체" },
          { key: "korean", label: "한식" },
          { key: "chinese", label: "중식" },
          { key: "western", label: "양식" },
          { key: "japanese", label: "일식" },
          { key: "cafe", label: "카페" },
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => handleCategory(cat.key as Category)}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "0.55rem 1.2rem",
              fontSize: "0.9rem",
              fontWeight: 700,
              background:
                activeCat === cat.key
                  ? "linear-gradient(135deg, #FF9B42, #FF7B00)"
                  : "rgba(255, 241, 224, 0.9)",
              color: activeCat === cat.key ? "#fff" : "#4B2F14",
              boxShadow:
                activeCat === cat.key
                  ? "0 3px 8px rgba(255,123,0,0.35)"
                  : "0 2px 4px rgba(0,0,0,0.05)",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 지도 */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: 580,
          borderRadius: 18,
          border: "2px solid #FFE0BA",
          boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      />

      {/* 결과 목록 */}
      <div
        style={{
          marginTop: "1.8rem",
          background: "#FFFDF9",
          borderRadius: 16,
          boxShadow: "0 6px 16px rgba(255,155,66,0.15)",
          padding: "1.2rem 1.4rem",
        }}
      >
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 800,
            color: "#A0522D",
            marginBottom: "1rem",
          }}
        >
          🔍 검색 결과 ({results.length}건)
        </h3>

        {results.length === 0 ? (
          <p style={{ color: "#9C8A7B", fontSize: "0.9rem" }}>
            검색 결과가 없습니다.
          </p>
        ) : (
          results.map((p) => (
            <div
              key={p.id}
              onClick={() => goRecruitFromSelected(p)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.9rem 1rem",
                borderRadius: 12,
                background: "#FFFFFF",
                boxShadow: "0 4px 10px rgba(0,0,0,0.03)",
                marginBottom: "0.7rem",
                border: "1.5px solid #FFE5C0",
                cursor: "pointer",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-3px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: "1rem", color: "#3B2B1B" }}>
                  🍽 {p.place_name}
                </strong>
                <p
                  style={{
                    color: "#7A5A3D",
                    fontSize: "0.85rem",
                    marginTop: "4px",
                  }}
                >
                  📍 {p.road_address_name || p.address_name || "주소 정보 없음"}
                </p>
              </div>
              <button
                style={{
                  background: "linear-gradient(135deg, #FF9B42, #FF7B00)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "0.55rem 0.9rem",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  boxShadow: "0 4px 10px rgba(255,123,0,0.3)",
                  cursor: "pointer",
                }}
              >
                모집하기
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
