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

type Category = "all" | "korean" | "chinese" | "western" | "japanese" | "cafe";

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
  const infoRef = useRef<any | null>(null);
  const myMarkerRef = useRef<any | null>(null);
  const myCircleRef = useRef<any | null>(null);

  const [q, setQ] = useState("");
  const [radius, setRadius] = useState(2000);
  const [activeCat, setActiveCat] = useState<Category>("all");
  const [results, setResults] = useState<PlaceItem[]>([]);
  const [selected, setSelected] = useState<PlaceItem | null>(null);
  const [myLocationActive, setMyLocationActive] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const push = (m: string) => setLog((p) => [...p, m]);

  const KAKAO_APPKEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!KAKAO_APPKEY) console.error("KAKAO JS KEY 누락");

  // ✅ Firestore 모집글 불러오기 (작성자 정보 포함)
  const loadRecruitPosts = async () => {
    try {
      const kakao = (window as any).kakao;
      const snapshot = await getDocs(collection(db, "posts"));
      const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      for (const post of posts) {
        const lat = post.lat ?? post.place?.lat;
        const lng = post.lng ?? post.place?.lng;
        if (!lat || !lng) continue;

        // ✅ 작성자 이름이 없으면 users 컬렉션에서 조회
        if (!post.authorName && post.authorId) {
          try {
            const userDoc = await getDoc(doc(db, "users", post.authorId));
            if (userDoc.exists()) post.authorName = userDoc.data().name || "익명";
          } catch (e) {
            console.warn("작성자 정보 조회 실패:", e);
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

        const infoHtml = `
          <div style="padding:8px;min-width:210px;">
            <strong>${post.title || "제목 없음"}</strong><br/>
            🍽 ${post.restaurant || "미정"}<br/>
            👤 ${post.authorName || "작성자 미상"}<br/>
            <button id="post-${post.id}"
              style="margin-top:6px;padding:5px 8px;background:#2563eb;color:white;border:none;border-radius:4px;cursor:pointer;">
              모집글 보러가기
            </button>
          </div>
        `;
        const infoWindow = new kakao.maps.InfoWindow({ content: infoHtml });

        kakao.maps.event.addListener(marker, "click", () => {
          if (infoRef.current) infoRef.current.close();
          infoWindow.open(mapRef.current, marker);
          infoRef.current = infoWindow;
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

  const init = () => {
    const kakao = (window as any).kakao;
    if (!kakao?.maps || !containerRef.current) return;

    const map = new kakao.maps.Map(containerRef.current, {
      center: new kakao.maps.LatLng(37.5665, 126.978),
      level: 5,
    });
    mapRef.current = map;
    loadRecruitPosts(); // ✅ 지도 로드 후 모집글 표시
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
    } else {
      const retry = setInterval(() => {
        if (w.kakao?.maps?.services) {
          clearInterval(retry);
          w.kakao.maps.load(init);
        }
      }, 300);
      return () => clearInterval(retry);
    }
  }, [KAKAO_APPKEY]);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  };
  const closeInfo = () => {
    if (infoRef.current) {
      infoRef.current.close();
      infoRef.current = null;
    }
  };
  const fitBoundsBy = (positions: any[]) => {
    const kakao = (window as any).kakao;
    const bounds = new kakao.maps.LatLngBounds();
    positions.forEach((p) => bounds.extend(p));
    if (!bounds.isEmpty()) mapRef.current.setBounds(bounds);
  };

  const goMyLocation = async (): Promise<boolean> => {
    if (!mapRef.current) return false;
    if (!("geolocation" in navigator)) {
      alert("이 브라우저는 위치 서비스를 지원하지 않습니다.");
      return false;
    }
    try {
      const pos = await getPosition({ enableHighAccuracy: true });
      const { latitude, longitude, accuracy } = pos.coords;
      const kakao = (window as any).kakao;
      const center = new kakao.maps.LatLng(latitude, longitude);
      mapRef.current.setCenter(center);
      mapRef.current.setLevel(4);
      if (myMarkerRef.current) myMarkerRef.current.setMap(null);
      if (myCircleRef.current) myCircleRef.current.setMap(null);
      myMarkerRef.current = new kakao.maps.Marker({ position: center, map: mapRef.current });
      const acc = Math.max(30, Math.min(accuracy || 200, 1500));
      myCircleRef.current = new kakao.maps.Circle({
        center,
        radius: acc,
        strokeWeight: 2,
        strokeColor: "#1e90ff",
        strokeOpacity: 0.85,
        fillColor: "#1e90ff",
        fillOpacity: 0.12,
      });
      myCircleRef.current.setMap(mapRef.current);
      return true;
    } catch (err) {
      console.error("위치 오류", err);
      return false;
    }
  };

  const toggleMyLocation = async () => {
    if (myLocationActive) {
      if (myMarkerRef.current) myMarkerRef.current.setMap(null);
      if (myCircleRef.current) myCircleRef.current.setMap(null);
      setMyLocationActive(false);
    } else {
      const ok = await goMyLocation();
      setMyLocationActive(!!ok);
    }
  };

  const runSearch = ({ keyword, categoryCode }: { keyword?: string; categoryCode?: string }) => {
    if (!mapRef.current) return;
    const kakao = (window as any).kakao;
    if (!kakao?.maps?.services) {
      setTimeout(() => runSearch({ keyword, categoryCode }), 500);
      return;
    }
    const ps = new kakao.maps.services.Places();
    const opts: any = {};
    if (myMarkerRef.current) {
      opts.location = myMarkerRef.current.getPosition();
      opts.radius = radius;
    } else {
      opts.bounds = mapRef.current.getBounds();
    }
    const cb = (data: any[], status: string) => {
      if (status !== kakao.maps.services.Status.OK) {
        clearMarkers();
        closeInfo();
        setResults([]);
        setSelected(null);
        return;
      }
      let filtered = data;
      if (activeCat === "korean")
        filtered = data.filter((d) => (d.category_name || "").includes("한식"));
      if (activeCat === "chinese")
        filtered = data.filter((d) => (d.category_name || "").includes("중식"));
      if (activeCat === "western")
        filtered = data.filter((d) => (d.category_name || "").includes("양식"));
      if (activeCat === "japanese")
        filtered = data.filter((d) => (d.category_name || "").includes("일식"));
      clearMarkers();
      closeInfo();
      setSelected(null);
      const positions: any[] = [];
      filtered.forEach((place) => {
        const pos = new kakao.maps.LatLng(Number(place.y), Number(place.x));
        positions.push(pos);
        const marker = new kakao.maps.Marker({ position: pos, map: mapRef.current });
        markersRef.current.push(marker);
        const addr = place.road_address_name || place.address_name || "";
        const content = `
          <div style="padding:8px;min-width:210px;">
            <strong>${place.place_name}</strong><br/>
            <span style="color:#666;">${addr}</span><br/>
          </div>`;
        const info = new kakao.maps.InfoWindow({ content });
        kakao.maps.event.addListener(marker, "click", () => {
          closeInfo();
          info.open(mapRef.current, marker);
          infoRef.current = info;
          setSelected({
            id: place.id,
            place_name: place.place_name,
            address_name: place.address_name,
            road_address_name: place.road_address_name,
            phone: place.phone,
            place_url: place.place_url,
            x: place.x,
            y: place.y,
            category_name: place.category_name,
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
    if (cat === "cafe") return runSearch({ categoryCode: "CE7" });
    if (cat === "korean") return runSearch({ keyword: "한식" });
    if (cat === "chinese") return runSearch({ keyword: "중식" });
    if (cat === "western") return runSearch({ keyword: "양식" });
    if (cat === "japanese") return runSearch({ keyword: "일식" });
    return runSearch({ keyword: q || "맛집" });
  };

  useEffect(() => {
    if (myCircleRef.current) myCircleRef.current.setRadius(radius);
  }, [radius]);

  useEffect(() => {
    const t = setTimeout(() => handleCategory("all"), 400);
    return () => clearTimeout(t);
  }, []);

  const goRecruitFromSelected = (p?: PlaceItem) => {
    const target = p ?? selected;
    if (!target) return;
    const url =
      `/pages/matches/uplist?source=map&placeId=${encodeURIComponent(target.id)}&placeName=${encodeURIComponent(target.place_name)}&lat=${encodeURIComponent(target.y)}&lng=${encodeURIComponent(target.x)}`;
    router.push(url);
  };

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold">카카오 지도</h1>

      {/* 🔎 검색바 */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCategory("all")}
          placeholder="검색어 (예: 파스타, 카페, 삼겹살)"
          className="px-4 py-2.5 border rounded-lg w-64 text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
        <button
          onClick={() => handleCategory("all")}
          className="px-4 py-2.5 border rounded-lg text-sm hover:bg-gray-50"
        >
          🔎 검색
        </button>

        <button
          onClick={toggleMyLocation}
          className={`px-4 py-2.5 border rounded-lg text-sm ${
            myLocationActive ? "bg-red-500 text-white" : "hover:bg-gray-50"
          }`}
        >
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
      </div>

      {/* 🍱 카테고리 버튼 바 */}
      <div className="flex flex-wrap gap-2 mt-2">
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
            className={`px-3 py-1.5 rounded-lg text-sm border ${
              activeCat === cat.key ? "bg-rose-500 text-white" : "hover:bg-gray-100"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 🗺 지도 */}
      <div ref={containerRef} style={{ height: 600 }} className="w-full rounded-xl border" />

      {/* 📋 검색 결과 목록 */}
      <div className="max-h-[400px] overflow-auto mt-4 border p-2 rounded-lg">
        <div className="text-sm font-semibold mb-2">{`검색 결과 (${results.length}건)`}</div>
        {results.map((p) => (
          <div key={p.id} className="py-2 border-b last:border-0">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{p.place_name}</div>
                <div className="text-xs text-gray-600">
                  {(p.road_address_name || p.address_name || "").slice(0, 60)}
                </div>
              </div>
              <button
                className="px-2 py-1 bg-rose-500 text-white text-xs rounded"
                onClick={() => goRecruitFromSelected(p)}
              >
                🍴 모집하기
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
