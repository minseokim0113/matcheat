"use client";
import { useEffect, useState } from "react";
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
};

const CATEGORIES = ["한식", "중식", "일식", "양식"];
const LOCATIONS = [
  "강남구", "서초구", "송파구", "마포구", "용산구",
  "광진구", "중랑구", "성동구", "노원구", "강서구",
];
const GENDERS = ["성별 무관", "남성", "여성"];
const MBTIS = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

export default function PostsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editData, setEditData] = useState<Partial<Post>>({});

  // 로그인 추적
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  // 내 글 불러오기
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
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];
        setPosts(fetched);
      } catch (err) {
        console.error("게시글 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyPosts();
  }, [uid]);

  // 삭제
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

  // 수정 시작
  const startEditing = (post: Post) => {
    setEditingPost(post);
    setEditData(post);
  };

  // 수정 취소
  const cancelEditing = () => {
    setEditingPost(null);
    setEditData({});
  };

  // 수정 저장
  const handleUpdate = async () => {
    if (!editingPost) return;
    try {
      await updateDoc(doc(db, "posts", editingPost.id), editData);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id ? { ...p, ...editData } : p
        )
      );
      alert("수정 완료!");
      cancelEditing();
    } catch (err) {
      console.error("수정 실패:", err);
    }
  };

  // 입력 변경 핸들러
  const handleChange = (key: keyof Post, value: any) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  if (loading)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>불러오는 중...</p>
      </div>
    );

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
        내가 쓴 글
      </h1>

      {posts.length === 0 ? (
        <p style={{ color: "#6b7280" }}>아직 작성한 글이 없습니다.</p>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            style={{
              border: "1px solid #ddd",
              padding: "1rem",
              borderRadius: "12px",
              background: "white",
              marginBottom: "1rem",
            }}
          >
            {editingPost?.id === post.id ? (
              <>
                {/* 음식점 이름 */}
                <input
                  value={editData.restaurant ?? ""}
                  placeholder="음식점 이름"
                  onChange={(e) => handleChange("restaurant", e.target.value)}
                  style={inputStyle}
                />

                {/* 카테고리 선택 */}
                <div style={{ marginBottom: "10px" }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleChange("category", cat)}
                      style={{
                        ...buttonStyle,
                        backgroundColor:
                          editData.category === cat ? "#2563eb" : "white",
                        color: editData.category === cat ? "white" : "#2563eb",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* 제목 & 내용 */}
                <input
                  value={editData.title ?? ""}
                  placeholder="글 제목"
                  onChange={(e) => handleChange("title", e.target.value)}
                  style={inputStyle}
                />
                <textarea
                  value={editData.content ?? ""}
                  placeholder="글 내용"
                  onChange={(e) => handleChange("content", e.target.value)}
                  style={{ ...inputStyle, height: "80px" }}
                />

                {/* 모집 인원 */}
                <input
                  type="number"
                  value={editData.maxParticipants ?? ""}
                  placeholder="모집 인원"
                  onChange={(e) =>
                    handleChange("maxParticipants", Number(e.target.value))
                  }
                  style={inputStyle}
                />

                {/* 장소 선택 */}
                <select
                  value={editData.location ?? ""}
                  onChange={(e) => handleChange("location", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">장소 선택 (서울 내 구)</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>

                {/* 성별 선택 */}
                <select
                  value={editData.preferredGender ?? ""}
                  onChange={(e) => handleChange("preferredGender", e.target.value)}
                  style={inputStyle}
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                {/* MBTI 선택 */}
                <div style={{ marginBottom: "10px" }}>
                  {MBTIS.map((m) => (
                    <button
                      key={m}
                      onClick={() =>
                        handleChange(
                          "preferredMbti",
                          editData.preferredMbti?.includes(m)
                            ? editData.preferredMbti.filter((x) => x !== m)
                            : [...(editData.preferredMbti || []), m]
                        )
                      }
                      style={{
                        ...buttonStyle,
                        backgroundColor: editData.preferredMbti?.includes(m)
                          ? "#2563eb"
                          : "white",
                        color: editData.preferredMbti?.includes(m)
                          ? "white"
                          : "#2563eb",
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* 저장 & 취소 */}
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button style={saveBtn} onClick={handleUpdate}>
                    저장
                  </button>
                  <button style={cancelBtn} onClick={cancelEditing}>
                    취소
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontWeight: "bold" }}>{post.title}</h2>
                <p>{post.content}</p>
                <p>🍽️ 음식점: {post.restaurant}</p>
                <p>📂 카테고리: {post.category}</p>
                <p>📍 위치: {post.location}</p>
                <p>👥 모집 인원: {post.maxParticipants}</p>
                <p>🚻 성별: {post.preferredGender}</p>
                <p>🧠 희망 MBTI: {post.preferredMbti?.join(", ")}</p>
                <p style={{ color: "#9ca3af", fontSize: "0.8rem" }}>
                  작성일:{" "}
                  {post.createdAt &&
                    new Date(
                      typeof post.createdAt === "object" &&
                        post.createdAt.toDate
                        ? post.createdAt.toDate()
                        : post.createdAt
                    ).toLocaleString()}
                </p>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button style={editBtn} onClick={() => startEditing(post)}>
                    수정
                  </button>
                  <button style={deleteBtn} onClick={() => handleDelete(post.id)}>
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ✅ 스타일 정의
const inputStyle: React.CSSProperties = {
  width: "100%",
  marginBottom: "8px",
  padding: "8px",
  border: "1px solid #ccc",
  borderRadius: "6px",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #2563eb",
  borderRadius: "6px",
  padding: "6px 10px",
  marginRight: "5px",
  cursor: "pointer",
  background: "white",
  color: "#2563eb",
};

const editBtn = {
  flex: 1,
  backgroundColor: "#60a5fa",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "8px 12px",
  cursor: "pointer",
};

const deleteBtn = {
  flex: 1,
  backgroundColor: "#f87171",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "8px 12px",
  cursor: "pointer",
};

const saveBtn = {
  flex: 1,
  backgroundColor: "#3b82f6",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "8px 12px",
  cursor: "pointer",
};

const cancelBtn = {
  flex: 1,
  backgroundColor: "#9ca3af",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "8px 12px",
  cursor: "pointer",
};
