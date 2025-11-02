"use client";
import { useEffect, useState, useRef } from "react";
import { db, auth } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

type Post = {
  id: string;
  restaurant?: string;
  category?: string;
  title?: string;
  content?: string;
  location?: string;
  maxParticipants?: number;
  preferredGender?: string;
  preferredMbti?: string[];
  createdAt?: any;
  authorId?: string;
  lat?: number;
  lng?: number;
  meetAt?: any;
};

const CATEGORIES = ["한식", "중식", "일식", "양식"];
const LOCATIONS = [
  "강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
  "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구",
  "성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"
];
const GENDERS = ["성별 무관", "남성", "여성"];
const MBTIS = [
  "INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP",
  "ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"
];

export default function PostsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editData, setEditData] = useState<Partial<Post>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUid(user ? user.uid : null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchMyPosts = async () => {
      if (!uid) return;
      try {
        const q = query(
          collection(db, "posts"),
          where("authorId", "==", uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Post[];
        setPosts(fetched);
      } catch (err) {
        console.error("게시글 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyPosts();
  }, [uid]);

  const handleDelete = async (postId: string) => {
    if (!confirm("정말 이 글을 삭제할까요?")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      alert("삭제 완료!");
    } catch (err) {
      console.error("삭제 실패:", err);
    }
  };

  const startEditing = (post: Post) => { setEditingPost(post); setEditData(post); };
  const cancelEditing = () => { setEditingPost(null); setEditData({}); };
  const handleUpdate = async () => {
    if (!editingPost) return;
    try {
      await updateDoc(doc(db, "posts", editingPost.id), editData);
      setPosts((prev) =>
        prev.map((p) => (p.id === editingPost.id ? { ...p, ...editData } : p))
      );
      alert("수정 완료!");
      cancelEditing();
    } catch (err) {
      console.error("수정 실패:", err);
    }
  };
  const handleChange = (key: keyof Post, value: any) =>
    setEditData((prev) => ({ ...prev, [key]: value }));

  if (loading)
    return <div style={{ textAlign: "center", marginTop: "3rem", color: "#7A5A3D" }}>불러오는 중...</div>;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFF8F1",
        fontFamily: "'Noto Sans KR', sans-serif",
        color: "#3B2B1B",
        padding: "2rem 1rem",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "linear-gradient(90deg, #FF9B42, #FF7B00)",
          color: "white",
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
        내가 쓴 글 ✍️
      </header>

      <div
        style={{
          backgroundColor: "#FFF3E0",
          borderRadius: "12px",
          padding: "1rem",
          textAlign: "center",
          color: "#5A3A1C",
          marginBottom: "1.5rem",
          fontWeight: 600,
        }}
      >
        📊 총 작성 글 수: {posts.length} 개
      </div>

      {posts.length === 0 ? (
        <p style={{ textAlign: "center", color: "#9CA3AF" }}>작성한 글이 없습니다.</p>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            editingPost={editingPost}
            editData={editData}
            onChange={handleChange}
            onUpdate={handleUpdate}
            onEdit={startEditing}
            onCancel={cancelEditing}
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  );
}

/* ---------- 카드 ---------- */
function PostCard({
  post,
  editingPost,
  editData,
  onChange,
  onUpdate,
  onEdit,
  onCancel,
  onDelete,
}: any) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || editingPost?.id !== post.id) return;
    const w = window as any;
    const loadMap = () => {
      const kakao = w.kakao;
      const center = new kakao.maps.LatLng(
        editData.lat || post.lat || 37.5665,
        editData.lng || post.lng || 126.978
      );
      const map = new kakao.maps.Map(mapRef.current, { center, level: 4 });
      markerRef.current = new kakao.maps.Marker({ position: center, map });
      kakao.maps.event.addListener(map, "click", (mouseEvent: any) => {
        const latlng = mouseEvent.latLng;
        markerRef.current.setPosition(latlng);
        onChange("lat", latlng.getLat());
        onChange("lng", latlng.getLng());
      });
    };
    if (w.kakao && w.kakao.maps) setTimeout(() => w.kakao.maps.load(loadMap), 200);
    else {
      const s = document.createElement("script");
      s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false`;
      s.onload = () => setTimeout(() => w.kakao.maps.load(loadMap), 200);
      document.head.appendChild(s);
    }
  }, [editingPost, post.id, editData.lat, editData.lng]);

  return (
    <div
      style={{
        background: "#FFFDF9",
        borderRadius: "14px",
        boxShadow: "0 6px 14px rgba(0,0,0,0.07)",
        padding: "1.4rem",
        marginBottom: "1.5rem",
      }}
    >
      {editingPost?.id === post.id ? (
        <>
          <input
            value={editData.restaurant ?? ""}
            placeholder="음식점 이름"
            onChange={(e) => onChange("restaurant", e.target.value)}
            style={inputStyle}
          />
          <div style={{ marginBottom: "10px" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => onChange("category", cat)}
                style={{
                  ...tagButton,
                  backgroundColor: editData.category === cat ? "#FF9B42" : "#FFF9F4",
                  color: editData.category === cat ? "white" : "#FF7B00",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            value={editData.title ?? ""}
            placeholder="글 제목"
            onChange={(e) => onChange("title", e.target.value)}
            style={inputStyle}
          />
          <textarea
            value={editData.content ?? ""}
            placeholder="글 내용"
            onChange={(e) => onChange("content", e.target.value)}
            style={{ ...inputStyle, height: "80px" }}
          />
          <input
            type="number"
            value={editData.maxParticipants ?? ""}
            placeholder="모집 인원"
            onChange={(e) => onChange("maxParticipants", Number(e.target.value))}
            style={inputStyle}
          />
          <select
            value={editData.location ?? ""}
            onChange={(e) => onChange("location", e.target.value)}
            style={inputStyle}
          >
            <option value="">장소 선택 (서울 내 구)</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* ✅ 모임 일시 */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input
              type="date"
              value={
                editData.meetAt
                  ? new Date(editData.meetAt.seconds * 1000)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              onChange={(e) => {
                const date = e.target.value;
                const old = editData.meetAt
                  ? new Date(editData.meetAt.seconds * 1000)
                  : new Date();
                const [h, m] = [
                  old.getHours().toString().padStart(2, "0"),
                  old.getMinutes().toString().padStart(2, "0"),
                ];
                const newDate = new Date(`${date}T${h}:${m}`);
                onChange("meetAt", { seconds: Math.floor(newDate.getTime() / 1000) });
              }}
              style={inputStyle}
            />
            <input
              type="time"
              value={
                editData.meetAt
                  ? new Date(editData.meetAt.seconds * 1000)
                      .toTimeString()
                      .slice(0, 5)
                  : "19:00"
              }
              onChange={(e) => {
                const time = e.target.value;
                const base = editData.meetAt
                  ? new Date(editData.meetAt.seconds * 1000)
                  : new Date();
                const [h, m] = time.split(":").map(Number);
                base.setHours(h, m, 0, 0);
                onChange("meetAt", { seconds: Math.floor(base.getTime() / 1000) });
              }}
              style={inputStyle}
            />
          </div>

          <div ref={mapRef} style={mapBox} />

          <select
            value={editData.preferredGender ?? ""}
            onChange={(e) => onChange("preferredGender", e.target.value)}
            style={inputStyle}
          >
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <div style={{ marginBottom: "10px" }}>
            {MBTIS.map((m) => (
              <button
                key={m}
                onClick={() =>
                  onChange(
                    "preferredMbti",
                    editData.preferredMbti?.includes(m)
                      ? editData.preferredMbti.filter((x) => x !== m)
                      : [...(editData.preferredMbti || []), m]
                  )
                }
                style={{
                  ...tagButton,
                  backgroundColor: editData.preferredMbti?.includes(m)
                    ? "#FF9B42"
                    : "#FFF9F4",
                  color: editData.preferredMbti?.includes(m)
                    ? "white"
                    : "#FF7B00",
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button style={mainBtn} onClick={onUpdate}>
              저장
            </button>
            <button style={grayBtn} onClick={onCancel}>
              취소
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "6px" }}>
            {post.title}
          </h3>
          <p style={{ color: "#5A3A1C", marginBottom: "6px" }}>{post.content}</p>
          <p>🍽️ {post.restaurant}</p>
          <p>📍 {post.location || "주소 미등록"}</p>
          <p>👥 모집 {post.maxParticipants}명 / 🚻 {post.preferredGender}</p>
          {post.meetAt && (
            <p>🕓 {new Date(post.meetAt.seconds * 1000).toLocaleString()}</p>
          )}
          <p style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>
            작성일:{" "}
            {post.createdAt &&
              new Date(post.createdAt.seconds * 1000).toLocaleString()}
          </p>

          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button style={mainBtn} onClick={() => onEdit(post)}>
              수정
            </button>
            <button style={redBtn} onClick={() => onDelete(post.id)}>
              삭제
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- 스타일 ---------- */
const inputStyle: React.CSSProperties = {
  width: "100%",
  marginBottom: "8px",
  padding: "10px",
  border: "1px solid #FFE3C2",
  borderRadius: "8px",
  background: "#FFF9F4",
  color: "#3B2B1B",
  fontSize: "0.95rem",
};

const tagButton: React.CSSProperties = {
  border: "1px solid #FF9B42",
  borderRadius: "6px",
  padding: "6px 10px",
  marginRight: "5px",
  cursor: "pointer",
  background: "#FFF9F4",
  color: "#FF7B00",
  fontWeight: 600,
  fontSize: "0.85rem",
};

const mapBox: React.CSSProperties = {
  width: "100%",
  height: "220px",
  borderRadius: "8px",
  border: "1px solid #FFE3C2",
  marginBottom: "10px",
};

const mainBtn = {
  flex: 1,
  background: "linear-gradient(135deg, #FF9B42, #FF7B00)",
  color: "white",
  fontWeight: 700,
  border: "none",
  borderRadius: "10px",
  padding: "10px 12px",
  cursor: "pointer",
};

const grayBtn = {
  flex: 1,
  backgroundColor: "#9CA3AF",
  color: "white",
  fontWeight: 700,
  border: "none",
  borderRadius: "10px",
  padding: "10px 12px",
  cursor: "pointer",
};

const redBtn = {
  flex: 1,
  backgroundColor: "#EF4444",
  color: "white",
  fontWeight: 700,
  border: "none",
  borderRadius: "10px",
  padding: "10px 12px",
  cursor: "pointer",
};
