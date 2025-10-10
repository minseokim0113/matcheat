"use client";

import { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import Link from "next/link";

interface ChatRoom {
  id: string;
  lastMessage: string;
}

export default function ChatListPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);

  useEffect(() => {
    // Firestore에서 chatRooms 컬렉션 구독
    const q = query(collection(db, "chatRooms"), orderBy("lastUpdated", "desc"));
    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        lastMessage: doc.data().lastMessage || "",
      }));
      setRooms(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>채팅 목록</h1>

      {rooms.length === 0 ? (
        <p style={{ textAlign: "center" }}>채팅이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {rooms.map(room => (
            <li
              key={room.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "10px",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
            >
              <Link href={`/chat/${room.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                {room.lastMessage || "새 채팅"}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}