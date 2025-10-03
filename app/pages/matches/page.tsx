"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp, getDoc,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";

type Post = {
  id: string;
  category: string;
  title: string;
  content: string;
  authorId: string; // 요청 받는 사람(uid)
};

const CATEGORIES = ["전체", "한식", "중식", "일식", "양식"] as const;
const SEOUL_DISTRICTS = [
  "강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
  "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구",
  "성동구","성북구","송파구","양천구","영등포구","용산구","은평구",
  "종로구","중구","중랑구",
] as const;

export default function MatchesPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("전체");

  // 요청 모달 상태
  const [open, setOpen] = useState(false);
  const [targetPost, setTargetPost] = useState<Post | null>(null);
  const [expectedCost, setExpectedCost] = useState("");
  const [district, setDistrict] = useState<string>("강남구");
  const [sending, setSending] = useState(false);

  // 글 로드
  const fetchPosts = async () => {
    const snap = await getDocs(collection(db, "posts"));
    const rows = snap.docs.map((d) => {
      const raw = d.data() as any;
      const p: Post = {
        id: d.id,
        category: String(raw.category ?? ""),
        title: String(raw.title ?? ""),
        content: String(raw.content ?? ""),
        // 혹시 기존 문서가 uid/userId로 저장돼 있으면 보정
        authorId: String(raw.authorId ?? raw.uid ?? raw.userId ?? ""),
      };
      return p;
    });
    setPosts(rows);
  };
  useEffect(() => { fetchPosts(); }, []);

  // 삭제
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "posts", id));
    fetchPosts();
  };

  // 필터
  const filtered = posts.filter((p) => {
    const byCat = category === "전체" ? true : p.category === category;
    const q = search.trim().toLowerCase();
    const byQ = q ? (p.title + p.content).toLowerCase().includes(q) : true;
    return byCat && byQ;
  });

  // 모달 열기
  const openRequestModal = (post: Post) => {
    setTargetPost(post);
    setExpectedCost("");
    setDistrict("강남구");
    setOpen(true);
  };

  // 요청 생성 (authorId 보정 + undefined 필드 제거)
  const sendRequest = async () => {
    if (!targetPost) return;
    const fromUserId = auth.currentUser?.uid;
    if (!fromUserId) return alert("로그인이 필요합니다.");

    setSending(true);
    try {
      // 글 문서 재조회로 authorId 보정
      let toUserId: string | undefined = targetPost.authorId;
      try {
        const ps = await getDoc(doc(db, "posts", targetPost.id));
        if (ps.exists()) {
          const d = ps.data() as any;
          toUserId = d?.authorId ?? d?.uid ?? d?.userId ?? toUserId;
        }
      } catch (e) {
        console.warn("post re-fetch failed", e);
      }

      if (!toUserId) {
        console.error("toUserId missing for post:", targetPost.id);
        return alert("글 작성자(authorId)를 찾을 수 없습니다. uplist가 authorId를 저장하는지 확인해 주세요.");
      }
      if (toUserId === fromUserId) {
        return alert("본인 글에는 요청을 보낼 수 없어요.");
      }

      const payload: any = {
        postId: targetPost.id,
        fromUserId,
        toUserId,
        status: "pending",
        createdAt: serverTimestamp(),
      };
      if (expectedCost.trim()) payload.expectedCost = expectedCost.trim();
      if (district) payload.district = district;

      await addDoc(collection(db, "requests"), payload);
      setOpen(false);
      router.push("/pages/requests");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif", paddingBottom: "90px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>모임 찾기</h1>

      {/* 검색 */}
      <input
        type="text"
        placeholder="검색어 입력"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "0.5rem", width: "100%", marginBottom: "1rem", borderRadius: "5px", border: "1px solid #ccc" }}
      />

      {/* 카테고리 */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
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

      {/* 글 등록 버튼 */}
      <button
        onClick={() => router.push("/pages/matches/uplist")}
        style={{ padding: "0.5rem 1.5rem", backgroundColor: "#003366", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginBottom: "1rem" }}
      >
        글 등록
      </button>

      {/* 글 리스트 */}
      <div>
        {filtered.map((post) => (
          <div key={post.id} style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "5px", marginBottom: "1rem" }}>
            <strong>{post.category} - {post.title}</strong>
            <p>{post.content}</p>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => openRequestModal(post)}
                style={{ backgroundColor: "#0275d8", color: "white", border: "none", borderRadius: "5px", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "0.9rem" }}
              >
                요청 보내기
              </button>

              <button
                onClick={() => handleDelete(post.id)}
                style={{ backgroundColor: "#ff4d4d", color: "white", border: "none", borderRadius: "5px", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "0.9rem" }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 요청 모달 */}
      {open && targetPost && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ width: "min(580px, 92vw)", background: "#fff", borderRadius: 12, padding: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                “{targetPost.title}” 에 요청 보내기
              </h3>
              <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 14, color: "#444" }}>예상 비용 (선택)</label>
                <input
                  value={expectedCost}
                  onChange={(e) => setExpectedCost(e.target.value)}
                  placeholder="예) 1.5만~2만"
                  style={{ padding: "0.6rem", borderRadius: 8, border: "1px solid #ddd" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 14, color: "#444" }}>만나고 싶은 지역(자치구)</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
                  {SEOUL_DISTRICTS.map((gu) => {
                    const active = district === gu;
                    return (
                      <button
                        key={gu}
                        onClick={() => setDistrict(gu)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: active ? "2px solid #003366" : "1px solid #ddd",
                          background: active ? "#003366" : "#fff",
                          color: active ? "#fff" : "#003366",
                          cursor: "pointer",
                        }}
                      >
                        {gu}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setOpen(false)}
                style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}
              >
                취소
              </button>
              <button
                onClick={sendRequest}
                disabled={sending}
                style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "none", background: sending ? "#7f8c8d" : "#003366", color: "#fff", cursor: sending ? "not-allowed" : "pointer" }}
              >
                {sending ? "전송 중..." : "요청 보내기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
