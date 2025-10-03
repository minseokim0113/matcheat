"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase"; // 경로 확인

export default function MatchesPage() {
  type Post = {
    id: string;
    category: string;
    title: string;
    content: string;
  };

  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("전체");

  const categories = ["전체", "한식", "중식", "일식", "양식"];

  // Firestore에서 게시글 불러오기
  const fetchPosts = async () => {
    const querySnapshot = await getDocs(collection(db, "posts"));
    const postsArray = querySnapshot.docs.map((doc) => {
       const data = doc.data() as Omit<Post, "id">; // id 제외 Post 타입
       return { id: doc.id, ...data };
    });
    setPosts(postsArray);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 삭제 기능
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "posts", id));
    fetchPosts(); // 삭제 후 갱신
  };

  // 검색 + 카테고리 필터
  const filteredPosts = posts.filter((post) => {
    const matchesCategory = category === "전체" ? true : post.category === category;
    const matchesSearch = search
      ? post.title.includes(search) || post.content.includes(search)
      : true;
    return matchesCategory && matchesSearch;
  });

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

      {/* 카테고리 선택 */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {categories.map((cat) => (
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
        {filteredPosts.map((post) => (
          <div key={post.id} style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "5px", marginBottom: "1rem", position: "relative" }}>
            <strong>{post.category} - {post.title}</strong>
            <p>{post.content}</p>
            <button
              onClick={() => handleDelete(post.id)}
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
          </div>
        ))}
      </div>
    </div>
  );
}
