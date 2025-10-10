"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../../../firebase"; // 경로 확인

export default function MatchesPage() {
  type Post = {
    id: string;
    category: string;
    title: string;
    content: string;
    authorId: string;    // ← 여기 추가
    authorName?: string; // 선택: 글 작성자 이름
    restaurant?: string; // 선택: 음식점 이름
    maxParticipants?: number; // ✅ 추가 (희망 인원)
    location?: string;        // ✅ 추가 (서울 구)
  };

export default function MatchesPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("전체");
  const [location, setLocation] = useState("전체"); // ✅ 추가: 장소 필터
  //const currentUserId = auth.currentUser?.uid;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // 로그인한 사용자 UID 가져오기
  useEffect(() => {
    setCurrentUserId(auth.currentUser?.uid || null);

    // auth 상태 변화 감지
    auth.onAuthStateChanged((user) => {
      setCurrentUserId(user ? user.uid : null);
    });
  }, []);

  // 삭제 함수
  const handleDelete = async (postId: string) => {
    if (!currentUserId) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
      alert("글이 삭제되었습니다.");
      fetchPosts(); // 삭제 후 다시 불러오기// 필요하면 posts 다시 불러오기
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  };
  const categories = ["전체", "한식", "중식", "일식", "양식"];
  const SEOUL_DISTRICTS = [
    "전체",
    "강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
    "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구",
    "성동구","성북구","송파구","양천구","영등포구","용산구","은평구",
    "종로구","중구","중랑구",
  ];

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

  useEffect(() => {
    fetchPosts();
  }, []);

  // 삭제 기능
  /*const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "posts", id));
    fetchPosts(); // 삭제 후 갱신
  };*/

  // 검색 + 카테고리 필터
  const filteredPosts = posts.filter((post) => {
    const matchesCategory = category === "전체" ? true : post.category === category;
    const matchesLocation = location === "전체" ? true : post.location === location;
    const matchesSearch = search
      ? post.title.includes(search) || post.content.includes(search)
      : true;
    return matchesCategory && matchesLocation && matchesSearch;
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

      {/* 장소 선택 필터 */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {SEOUL_DISTRICTS.map((dist) => (
          <button
            key={dist}
            onClick={() => setLocation(dist)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "5px",
              border: location === dist ? "2px solid #006633" : "1px solid #ccc",
              backgroundColor: location === dist ? "#006633" : "white",
              color: location === dist ? "white" : "#006633",
              cursor: "pointer",
            }}
          >
            {dist}
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
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "5px", marginBottom: "1rem", position: "relative", cursor: "pointer" }}
            onClick={() => router.push(`/pages/matches/${post.id}`)} // ✅ 상세 페이지 이동
          >
            <strong>{post.title}</strong>
            <p>인원: {post.maxParticipants || "미정"}</p>
            <p>장소: {post.location || "미정"}</p>

            {currentUserId && post.authorId === currentUserId && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // ✅ 상세 페이지로 안 넘어가게 막음
                  handleDelete(post.id);
                }}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  backgroundColor: "#ff4d4d",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  padding: "0.25rem 0.5rem",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                삭제
              </button>
            )}
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
