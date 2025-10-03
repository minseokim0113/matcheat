"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../../firebase";

export default function UplistPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const categories = ["한식", "중식", "일식", "양식"];

  const handleRegister = async () => {
    if (!title.trim() || !category || !content.trim()) {
      alert("제목/카테고리/내용을 모두 입력하세요."); return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) return alert("로그인이 필요합니다.");

    try {
      setSubmitting(true);
      await addDoc(collection(db, "posts"), {
        title: title.trim(),
        category,
        content: content.trim(),
        authorId: uid,                // 👈 요청 toUserId로 사용됨
        createdAt: serverTimestamp(),
      });
      router.push("/pages/matches");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>글 등록</h1>

      <input
        type="text"
        placeholder="제목 입력"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ padding: "0.5rem", width: "100%", marginBottom: "1rem", borderRadius: "5px", border: "1px solid #ccc" }}
      />

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

      <textarea
        placeholder="내용 입력"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ width: "100%", height: "100px", padding: "0.5rem", marginBottom: "1rem", borderRadius: "5px", border: "1px solid #ccc" }}
      />

      <button
        onClick={handleRegister}
        disabled={submitting}
        style={{ padding: "0.5rem 1.5rem", backgroundColor: submitting ? "#7f8c8d" : "#003366", color: "white", border: "none", borderRadius: "5px", cursor: submitting ? "not-allowed" : "pointer" }}
      >
        {submitting ? "등록 중..." : "등록"}
      </button>
    </div>
  );
}
