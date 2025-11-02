"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase";

export default function MatchesPage() {
  type Post = {
    id: string;
    category: string;
    title: string;
    content: string;
    authorId: string;
    authorName?: string;
    restaurant?: string;
    maxParticipants?: number;
    location?: string;
    status?: "open" | "closed";
    participantsCount?: number;
    createdAt?: Date | null;
  };

  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("전체");
  const [location, setLocation] = useState("전체");
  const [showClosed, setShowClosed] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "fill-desc" | "fill-asc">("latest");

  useEffect(() => {
    const qy = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qy, async (snap) => {
      const list: Post[] = [];
      const updates: Promise<any>[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        const curr = data.participantsCount ?? 0;
        const max = data.maxParticipants ?? undefined;
        const status: "open" | "closed" = data.status ?? "open";
        const full = typeof max === "number" && max > 0 ? curr >= max : false;
        if (full && status !== "closed") {
          updates.push(
            updateDoc(doc(db, "posts", d.id), {
              status: "closed",
              closedAt: serverTimestamp(),
            }).catch(() => {})
          );
        }
        list.push({
          id: d.id,
          category: data.category ?? "기타",
          title: data.title ?? "(제목 없음)",
          content: data.content ?? "",
          authorId: data.authorId ?? "",
          authorName: data.authorName ?? "",
          restaurant: data.restaurant ?? "",
          maxParticipants: max,
          location: data.location ?? "",
          status,
          participantsCount: curr,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
        });
      });
      setPosts(list);
      if (updates.length) Promise.allSettled(updates);
    });
    return () => unsub();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (!showClosed && p.status === "closed") return false;
      const matchC = category === "전체" ? true : p.category === category;
      const matchL = location === "전체" ? true : p.location === location;
      const matchS = search
        ? p.title?.includes(search) || p.content?.includes(search)
        : true;
      return matchC && matchL && matchS;
    });
  }, [posts, showClosed, category, location, search]);

  const sortedPosts = useMemo(() => {
    const arr = [...filteredPosts];
    arr.sort((a, b) => {
      const aCnt = a.participantsCount ?? 0;
      const bCnt = b.participantsCount ?? 0;
      const aMax = a.maxParticipants ?? 0;
      const bMax = b.maxParticipants ?? 0;
      if (sortBy === "latest")
        return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
      const aRate = aMax ? aCnt / aMax : 0;
      const bRate = bMax ? bCnt / bMax : 0;
      return sortBy === "fill-desc" ? bRate - aRate : aRate - bRate;
    });
    return arr;
  }, [filteredPosts, sortBy]);

  const seoulDistricts = [
    "전체", "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구",
    "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구",
    "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"
  ];

  const formatDate = (date: Date | null) => {
    if (!date) return "시간 정보 없음";
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    if (isToday) return `오늘 ${hours}:${minutes}`;
    return `${date.getMonth() + 1}월 ${date.getDate()}일 ${hours}:${minutes}`;
  };

  return (
    <div
      style={{
        backgroundColor: "#FFF8F1",
        minHeight: "100vh",
        fontFamily: "'Noto Sans KR', sans-serif",
        padding: "1.2rem 1rem 6rem",
        color: "#3B2B1B",
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
          fontSize: "1.4rem",
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          boxShadow: "0 3px 10px rgba(255,155,66,0.25)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <span
          style={{
            textAlign: "center",
            width: "100%",
            letterSpacing: "0.5px",
          }}
        >
          🍚 밥친구 매칭
        </span>

        {/* 정렬 옵션 */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            position: "absolute",
            right: "1.2rem",
            padding: "7px 12px",
            borderRadius: 10,
            border: "none",
            background: "#FFF3E0",
            color: "#B64E00",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <option value="latest">최신순</option>
          <option value="fill-desc">채움률 높은순</option>
          <option value="fill-asc">채움률 낮은순</option>
        </select>
      </header>

      {/* 검색창 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          margin: "1.2rem 0 1.3rem",
          background: "#FFFDF9",
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(255,155,66,0.15)",
          padding: "0.8rem 1rem",
        }}
      >
        <span style={{ fontSize: "1.3rem", color: "#FF7B00" }}>🔍</span>
        <input
          type="text"
          placeholder="오늘은 누구와 밥을 먹을까요?"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: "0.95rem",
            background: "transparent",
            color: "#3B2B1B",
          }}
        />
      </div>

      {/* 카테고리 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1rem",
          justifyContent: "center",
        }}
      >
        {["전체", "한식", "중식", "일식", "양식", "분식", "카페"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "0.55rem 1.2rem",
              fontSize: "0.9rem",
              fontWeight: 700,
              background:
                category === cat
                  ? "linear-gradient(135deg,#FF9B42,#FF7B00)"
                  : "rgba(255, 241, 224, 0.9)",
              color: category === cat ? "#fff" : "#4B2F14",
              boxShadow:
                category === cat
                  ? "0 3px 8px rgba(255,123,0,0.35)"
                  : "0 2px 4px rgba(0,0,0,0.05)",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 지역 선택 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
          gap: "0.4rem",
          marginBottom: "1.4rem",
        }}
      >
        {seoulDistricts.map((dist) => (
          <button
            key={dist}
            onClick={() => setLocation(dist)}
            style={{
              border: "none",
              borderRadius: 12,
              background:
                location === dist
                  ? "linear-gradient(135deg, #FF9B42, #FF7B00)"
                  : "#FFF3E0",
              color: location === dist ? "#fff" : "#5B3A1C",
              padding: "0.45rem 0.6rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              transition: "all 0.25s",
            }}
          >
            {dist}
          </button>
        ))}
      </div>

      {/* 게시글 카드 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {sortedPosts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#A37C5B",
              fontWeight: 600,
              marginTop: "2rem",
            }}
          >
            🍴 현재 모집 중인 글이 없습니다.
          </div>
        ) : (
          sortedPosts.map((post) => {
            const curr = post.participantsCount ?? 0;
            const hasMax =
              typeof post.maxParticipants === "number" &&
              post.maxParticipants > 0;
            const full = hasMax ? curr >= (post.maxParticipants as number) : false;
            const pct = hasMax
              ? Math.min(
                  100,
                  Math.round((curr / (post.maxParticipants as number)) * 100)
                )
              : 0;

            return (
              <div
                key={post.id}
                onClick={() => router.push(`/pages/matches/${post.id}`)}
                style={{
                  background: "#FFFDF9",
                  borderRadius: 20,
                  padding: "1.2rem 1.3rem",
                  border: full
                    ? "2px solid #E0E0E0"
                    : "2px solid transparent",
                  boxShadow: full
                    ? "0 4px 10px rgba(0,0,0,0.05)"
                    : "0 6px 16px rgba(255,155,66,0.15)",
                  transition: "all 0.25s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.border = "2px solid #FF9B42";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.border = "2px solid transparent";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.4rem",
                  }}
                >
                  <strong style={{ fontSize: "1.05rem", color: "#2E1500" }}>
                    {post.title}
                  </strong>
                  <span
                    style={{
                      background: full ? "#C9C9C9" : "#FF9B42",
                      color: "#fff",
                      borderRadius: 8,
                      padding: "3px 8px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}
                  >
                    {full ? "마감" : "모집중"}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "#7A5A3D",
                    marginBottom: "0.3rem",
                  }}
                >
                  🍱 {post.category} | ✍️ {post.authorName || "익명"}
                </div>

                <p
                  style={{
                    margin: "4px 0 2px",
                    color: "#5B3A1C",
                    fontSize: "0.95rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {post.content || "내용 없음"}
                </p>

                <p style={{ color: "#7A5A3D", fontSize: "0.9rem" }}>
                  📍 {post.location || "장소 미정"}
                </p>

                {hasMax && (
                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        height: 8,
                        background: "#FFEFD8",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: full
                            ? "#C9C9C9"
                            : "linear-gradient(90deg, #FF9B42, #FF7B00)",
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "#A37C5B",
                        marginTop: 2,
                        display: "block",
                        textAlign: "right",
                      }}
                    >
                      {curr}/{post.maxParticipants}명
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 플로팅 버튼 */}
      <button
        onClick={() => router.push("/pages/matches/uplist")}
        style={{
          position: "fixed",
          right: "1.5rem",
          bottom: "5rem",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #FF9B42, #FF7B00)",
          color: "#fff",
          fontSize: "1.8rem",
          fontWeight: 700,
          border: "none",
          boxShadow: "0 6px 16px rgba(255,155,66,0.4)",
          cursor: "pointer",
          transition: "0.25s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)") }
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)") }
      >
        +
      </button>
    </div>
  );
}
