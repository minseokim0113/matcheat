"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../../../firebase";

export default function UplistPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");

  const categories = ["한식", "중식", "일식", "양식"];

  const handleRegister = async () => {
    if (!title || !category || !content) return;

    await addDoc(collection(db, "posts"), { title, category, content });
    router.push("/pages/matches");
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
        style={{ padding: "0.5rem 1.5rem", backgroundColor: "#003366", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
      >
        등록
      </button>
    </div>
  );
}
