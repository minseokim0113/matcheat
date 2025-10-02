"use client";

import { useEffect, useRef, useState } from "react";
import { listenReviews, addReviewDoc, ReviewDoc } from "@/lib/reviewRepo";

// ===== 타입 =====
type PlaceItem = {
  id: string;
  place_name: string;
  road_address_name?: string;
  address_name?: string;
  phone?: string;
  place_url?: string;
  x: string; // lon
  y: string; // lat
  category_name?: string;
};

type Category = "all" | "korean" | "chinese" | "western" | "japanese" | "cafe";

// ===== 유틸: 하버사인 =====
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function MapPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  // 마커/오버레이
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any | null>(null);
  const myMarkerRef = useRef<any | null>(null);
  const myCircleRef = useRef<any | null>(null);

  // 앱 내 길찾기(직선) 오버레이
  const routeLineRef = useRef<any | null>(null);
  const routeLabelRef = useRef<any | null>(null);

  // 상태
  const [q, setQ] = useState("");
  const [radius, setRadius] = useState(2000);
  const [activeCat, setActiveCat] = useState<Category>("all");
  const [results, setResults] = useState<PlaceItem[]>([]);
  const [selected, setSelected] = useState<PlaceItem | null>(null);
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [travelMode, setTravelMode] = useState<"walk" | "bike" | "car">("walk");

  const [log, setLog] = useState<string[]>([]);
  const push = (m: string) => setLog((p) => [...p, m]);

  // 키: env -> 폴백(하드코딩)
  const KAKAO_APPKEY =
    process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "c52b34203031e869b9052dbd927d7df2";

  // 지도 초기화
  const init = () => {
  const w = window as any;
  const kakao = w.kakao;
  if (!kakao?.maps) { push("kakao.maps 없음"); return; }
  if (!containerRef.current) { push("container 없음"); return; }

  const map = new kakao.maps.Map(containerRef.current, {
    center: new kakao.maps.LatLng(37.5665, 126.9780),
    level: 5,
  });
  mapRef.current = map;
  push("지도 생성 완료 ✅");
};

  // SDK 로드
  useEffect(() => {
  const w = window as any;
  if (w.kakao?.maps) {
    push("SDK 이미 존재 → init");
    w.kakao.maps.load(init);
    return;
  }
  const src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APPKEY}&autoload=false&libraries=services`;
  push(`SDK 로드 시도: ${src}`);
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  s.onload = () => { push("SDK 로드 완료"); (window as any).kakao.maps.load(init); };
  s.onerror = (e) => { push("SDK 로드 실패 ❌"); console.error("SDK load error", e, src); };
  document.head.appendChild(s);
  return () => { s.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [KAKAO_APPKEY]);

  // ===== 공통 유틸 =====
  const clearMarkers = () => { markersRef.current.forEach(m => m.setMap(null)); markersRef.current = []; };
  const closeInfo = () => { if (infoRef.current) { infoRef.current.close(); infoRef.current = null; } };
  const fitBoundsBy = (positions: any[]) => {
    const kakao = (window as any).kakao;
    const bounds = new kakao.maps.LatLngBounds();
    positions.forEach((p) => bounds.extend(p));
    if (!bounds.isEmpty()) mapRef.current.setBounds(bounds);
  };

  // 📍 내 위치
  const goMyLocation = () => {
    if (!mapRef.current) return;
    const isSecure =
      typeof window !== "undefined" &&
      (location.protocol === "https:" || location.hostname === "localhost");
    if (!isSecure) {
      alert("모바일에서 내 위치는 HTTPS에서만 동작해요. (배포/터널 권장)");
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const kakao = (window as any).kakao;
        const center = new kakao.maps.LatLng(latitude, longitude);
        mapRef.current.setCenter(center);

        if (myMarkerRef.current) myMarkerRef.current.setMap(null);
        if (myCircleRef.current) myCircleRef.current.setMap(null);

        myMarkerRef.current = new kakao.maps.Marker({ position: center, map: mapRef.current });
        myCircleRef.current = new kakao.maps.Circle({
          center, radius,
          strokeWeight: 2, strokeColor: "#1e90ff", strokeOpacity: 0.8,
          fillColor: "#1e90ff", fillOpacity: 0.1,
        });
        myCircleRef.current.setMap(mapRef.current);
      },
      (err) => { console.error(err); alert("현재 위치를 가져올 수 없습니다."); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // 🔎 검색
  const runSearch = ({ keyword, categoryCode }:{ keyword?: string; categoryCode?: string; }) => {
    if (!mapRef.current) return;
    const kakao = (window as any).kakao;
    const ps = new kakao.maps.services.Places();

    const opts: any = {};
    if (myMarkerRef.current) { opts.location = myMarkerRef.current.getPosition(); opts.radius = radius; }
    else { opts.bounds = mapRef.current.getBounds(); }

    const cb = (data: any[], status: string) => {
      if (status !== kakao.maps.services.Status.OK) {
        clearMarkers(); closeInfo(); setResults([]); setSelected(null); return;
      }

      let filtered = data;
      if (activeCat === "korean")   filtered = data.filter(d => (d.category_name || "").includes("한식"));
      if (activeCat === "chinese")  filtered = data.filter(d => (d.category_name || "").includes("중식"));
      if (activeCat === "western")  filtered = data.filter(d => (d.category_name || "").includes("양식"));
      if (activeCat === "japanese") filtered = data.filter(d => (d.category_name || "").includes("일식"));

      clearMarkers(); closeInfo(); setSelected(null);
      const positions: any[] = [];
      filtered.forEach((place) => {
        const pos = new kakao.maps.LatLng(Number(place.y), Number(place.x));
        positions.push(pos);
        const marker = new kakao.maps.Marker({ position: pos, map: mapRef.current });
        markersRef.current.push(marker);

        const addr = place.road_address_name || place.address_name || "";
        const toUrl = `https://map.kakao.com/link/to/${encodeURIComponent(place.place_name)},${place.y},${place.x}`;

        const content = `
          <div style="padding:8px;min-width:210px;">
            <strong>${place.place_name}</strong><br/>
            <span style="color:#666;">${addr}</span><br/>
            ${place.phone ? `<span style="color:#888;">${place.phone}</span><br/>` : ""}
            <div style="margin-top:6px;display:flex;gap:8px;">
              <a href="${place.place_url || "#"}" target="_blank" rel="noreferrer">상세보기</a>
              <a href="${toUrl}" target="_blank" rel="noreferrer">길찾기</a>
            </div>
          </div>
        `;
        const info = new kakao.maps.InfoWindow({ content });

        kakao.maps.event.addListener(marker, "click", () => {
          closeInfo(); info.open(mapRef.current, marker); infoRef.current = info;
          setSelected({
            id: place.id, place_name: place.place_name,
            address_name: place.address_name, road_address_name: place.road_address_name,
            phone: place.phone, place_url: place.place_url,
            x: place.x, y: place.y, category_name: place.category_name,
          });
        });
      });

      if (positions.length) fitBoundsBy(positions);
      setResults(filtered as PlaceItem[]);
    };

    if (categoryCode) ps.categorySearch(categoryCode, cb, opts);
    else ps.keywordSearch(keyword || "맛집", cb, opts);
  };

  const handleCategory = (cat: Category) => {
    setActiveCat(cat);
    if (cat === "cafe")      return runSearch({ categoryCode: "CE7" });
    if (cat === "korean")    return runSearch({ keyword: "한식" });
    if (cat === "chinese")   return runSearch({ keyword: "중식" });
    if (cat === "western")   return runSearch({ keyword: "양식" });
    if (cat === "japanese")  return runSearch({ keyword: "일식" });
    return runSearch({ keyword: q || "맛집" });
  };

  useEffect(() => { if (myCircleRef.current) myCircleRef.current.setRadius(radius); }, [radius]);

  useEffect(() => {
    const t = setTimeout(() => handleCategory("all"), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== 앱 내 길찾기(직선) =====
  const clearRoute = () => {
    if (routeLineRef.current) routeLineRef.current.setMap(null);
    if (routeLabelRef.current) routeLabelRef.current.setMap(null);
    routeLineRef.current = null; routeLabelRef.current = null;
  };

  const drawSimpleRoute = (toLat: number, toLng: number) => {
    const kakao = (window as any).kakao;
    if (!mapRef.current || !myMarkerRef.current) {
      alert("먼저 📍내 위치를 설정하세요."); return;
    }
    clearRoute();

    const from = myMarkerRef.current.getPosition();
    const to = new kakao.maps.LatLng(toLat, toLng);

    routeLineRef.current = new kakao.maps.Polyline({
      path: [from, to],
      strokeWeight: 4, strokeColor: "#1e90ff", strokeOpacity: 0.85, strokeStyle: "solid",
    });
    routeLineRef.current.setMap(mapRef.current);

    const distKm = haversine(from.getLat(), from.getLng(), toLat, toLng);
    const distM = Math.round(distKm * 1000);

    const speedMpm =
      travelMode === "walk" ? 70 : travelMode === "bike" ? 250 : 667; // 4.2km/h, 15km/h, 40km/h 대략
    const minutes = Math.max(1, Math.round(distM / speedMpm));

    const mid = new kakao.maps.LatLng((from.getLat()+toLat)/2, (from.getLng()+toLng)/2);
    routeLabelRef.current = new kakao.maps.CustomOverlay({
      position: mid, yAnchor: 1.2,
      content: `
        <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:6px 10px;font-size:12px;">
          거리: ${distM.toLocaleString()}m · ${travelMode === "car" ? "차" : travelMode === "bike" ? "자전거" : "도보"} 약 ${minutes}분
        </div>
      `,
    });
    routeLabelRef.current.setMap(mapRef.current);

    const bounds = new kakao.maps.LatLngBounds(); bounds.extend(from); bounds.extend(to);
    mapRef.current.setBounds(bounds);
  };

  // ===== 선택 장소의 리뷰 실시간 구독 =====
  useEffect(() => {
    if (!selected?.id) { setReviews([]); return; }
    const unsub = listenReviews(selected.id, setReviews);
    return () => unsub && unsub();
  }, [selected?.id]);

  // ===== 렌더 =====
  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold">카카오 지도</h1>

      {/* 컨트롤 바 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 검색 */}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCategory("all")}
          placeholder="검색어 (예: 파스타, 카페, 삼겹살)"
          className="px-4 py-2.5 border rounded-lg w-64 text-sm tracking-wide
                     focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
        <button onClick={() => handleCategory("all")} className="px-4 py-2.5 border rounded-lg text-sm hover:bg-gray-50">
          🔎 검색
        </button>

        <button onClick={goMyLocation} className="px-4 py-2.5 border rounded-lg text-sm hover:bg-gray-50">
          📍 내 위치
        </button>

        <label className="ml-2 text-sm text-gray-600">반경</label>
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="px-2 py-2 border rounded"
        >
          <option value={1000}>1km</option>
          <option value={2000}>2km</option>
          <option value={3000}>3km</option>
          <option value={5000}>5km</option>
        </select>

        {/* 카테고리 칩 */}
        <div className="-mx-4 md:mx-0 mt-2 w-full">
          <div className="px-4 pb-1 flex gap-2 overflow-x-auto no-scrollbar md:overflow-visible md:flex-wrap">
            {[
              { key: "korean",   label: "🍚 한식" },
              { key: "chinese",  label: "🥡 중식" },
              { key: "western",  label: "🍝 양식" },
              { key: "japanese", label: "🍣 일식" },
              { key: "cafe",     label: "☕ 카페" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleCategory(tab.key as any)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm tracking-wide transition
                  ${activeCat === (tab.key as any)
                    ? "bg-white shadow text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 앱 내 길찾기 모드 */}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-gray-600">이동수단</span>
          <select
            value={travelMode}
            onChange={(e) => setTravelMode(e.target.value as any)}
            className="px-2 py-2 border rounded"
          >
            <option value="walk">도보</option>
            <option value="bike">자전거</option>
            <option value="car">차</option>
          </select>
          <button onClick={clearRoute} className="px-3 py-2 border rounded">경로 지우기</button>
        </div>
      </div>

      {/* 레이아웃: 지도 + 우측 패널 */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-4">
        {/* 지도 */}
        <div
          ref={containerRef}
          className="w-full rounded-xl border h-[70vh] md:h-[600px]"
        />

        {/* 우측 패널: 결과/상세/리뷰 */}
        <div className="max-h-[600px] overflow-auto rounded-xl border p-2 space-y-3">
          <div className="text-sm font-semibold">
            {activeCat === "korean" && "🍚 한식"}
            {activeCat === "chinese" && "🥡 중식"}
            {activeCat === "western" && "🍝 양식"}
            {activeCat === "japanese" && "🍣 일식"}
            {activeCat === "cafe" && "☕ 카페"}
            {activeCat === "all" && "🔎 전체 검색"}
            {` 결과 (${results.length}건)`}
          </div>

          {/* 결과 목록 */}
          <div className="divide-y">
            {results.map((p) => {
              const kakao = (window as any).kakao;
              return (
                <div key={p.id} className="py-2">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      className="text-left"
                      onClick={() => {
                        const pos = new kakao.maps.LatLng(Number(p.y), Number(p.x));
                        mapRef.current.setCenter(pos);
                        mapRef.current.setLevel(4);
                        const marker = markersRef.current.find((m) => {
                          const mp = m.getPosition();
                          return mp.getLat() === pos.getLat() && mp.getLng() === pos.getLng();
                        });
                        if (marker) {
                          const addr = p.road_address_name || p.address_name || "";
                          const content = `
                            <div style="padding:8px;min-width:210px;">
                              <strong>${p.place_name}</strong><br/>
                              <span style="color:#666;">${addr}</span><br/>
                              ${p.phone ? `<span style="color:#888;">${p.phone}</span><br/>` : ""}
                              <div style="margin-top:6px;display:flex;gap:8px;">
                                <a href="${p.place_url || "#"}" target="_blank" rel="noreferrer">상세보기</a>
                                <a href="https://map.kakao.com/link/to/${encodeURIComponent(p.place_name)},${p.y},${p.x}" target="_blank" rel="noreferrer">길찾기</a>
                              </div>
                            </div>
                          `;
                          const info = new kakao.maps.InfoWindow({ content });
                          closeInfo(); info.open(mapRef.current, marker); infoRef.current = info;
                        }
                        setSelected(p);
                      }}
                    >
                      <div className="font-medium">{p.place_name}</div>
                      <div className="text-xs text-gray-600">
                        {(p.road_address_name || p.address_name || "").slice(0, 60)}
                      </div>
                      {p.phone && <div className="text-xs text-gray-500">{p.phone}</div>}
                    </button>

                    {/* 앱 내 길찾기(직선) */}
                    <button
                      className="px-2 py-1 border rounded text-xs"
                      onClick={() => drawSimpleRoute(Number(p.y), Number(p.x))}
                    >
                      앱 내 길찾기
                    </button>
                  </div>
                </div>
              );
            })}
            {results.length === 0 && (
              <div className="text-sm text-gray-500 py-4">결과가 없습니다.</div>
            )}
          </div>

          {/* 선택된 가게 상세 + 리뷰 */}
          {selected && (
            <PlaceDetail
              place={selected}
              reviews={reviews}
              onPanTo={() => {
                const kakao = (window as any).kakao;
                const pos = new kakao.maps.LatLng(Number(selected.y), Number(selected.x));
                mapRef.current.panTo(pos);
              }}
              onRoute={() => drawSimpleRoute(Number(selected.y), Number(selected.x))}
            />
          )}
        </div>
      </div>

      {/* 디버그 로그 보려면 주석 해제 */}
      {/* <pre className="text-xs text-gray-500 whitespace-pre-wrap">{log.join("\n")}</pre> */}
    </div>
  );
}

// ===== 상세 + 리뷰 컴포넌트 =====
function PlaceDetail({
  place, reviews, onPanTo, onRoute,
}: {
  place: PlaceItem;
  reviews: ReviewDoc[];
  onPanTo: () => void;
  onRoute: () => void;
}) {
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState<number | "">("");

  return (
    <div className="mt-2 p-3 border rounded space-y-2">
      <div className="font-semibold">{place.place_name}</div>
      <div className="text-xs text-gray-600">
        {(place.road_address_name || place.address_name || "").slice(0, 100)}
      </div>
      {place.phone && <div className="text-xs text-gray-500">{place.phone}</div>}
      <div className="flex gap-2">
        <button className="px-2 py-1 border rounded text-xs" onClick={onPanTo}>
          지도이동
        </button>
        <button className="px-2 py-1 border rounded text-xs" onClick={onRoute}>
          앱 내 길찾기
        </button>
        {place.place_url && (
          <a
            href={place.place_url}
            target="_blank"
            rel="noreferrer"
            className="px-2 py-1 border rounded text-xs"
          >
            카카오 상세보기
          </a>
        )}
      </div>

      {/* 리뷰 목록 */}
      <div className="mt-2">
        <div className="text-sm font-medium">리뷰</div>
        {reviews.length === 0 && <div className="text-xs text-gray-500">아직 리뷰가 없습니다.</div>}
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="text-xs border rounded p-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.author || "익명"}</span>
                {r.rating ? <span>{"★".repeat(r.rating)}</span> : null}
              </div>
              <div className="mt-1 whitespace-pre-wrap">{r.text}</div>
              {/* createdAt은 서버타임스탬프라 포맷이 지연될 수 있음 */}
            </div>
          ))}
        </div>

        {/* 리뷰 작성 */}
        <form
          className="mt-2 space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim()) return;
            await addReviewDoc({
              placeId: place.id,
              author: (author || "익명").slice(0, 30),
              text: text.trim().slice(0, 1000),
              rating: typeof rating === "number" ? rating : undefined,
            });
            setText("");
          }}
        >
          <div className="flex gap-2">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="작성자 (선택)"
              className="px-2 py-1 border rounded text-xs"
            />
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value ? Number(e.target.value) : "")}
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="">평점(선택)</option>
              <option value="1">★☆☆☆☆</option>
              <option value="2">★★☆☆☆</option>
              <option value="3">★★★☆☆</option>
              <option value="4">★★★★☆</option>
              <option value="5">★★★★★</option>
            </select>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="리뷰를 입력하세요"
            className="w-full h-20 px-2 py-1 border rounded text-xs"
          />
          <button className="px-3 py-1 border rounded text-xs">리뷰 등록</button>
        </form>
      </div>
    </div>
  );
}
