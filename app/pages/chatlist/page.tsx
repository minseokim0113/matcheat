"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../../firebase";
import { collection, onSnapshot, query, where, orderBy, getDoc, doc } from "firebase/firestore";
import Link from "next/link";

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage: string;
}

export default function ChatListPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({}); // uid -> 이름

  // 로그인된 사용자 가져오기
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) setCurrentUserId(user.uid);
    });
    return () => unsubscribeAuth();
  }, []);

  // 방 가져오기
  useEffect(() => {
    if (!currentUserId) return;

    const q = query(
      collection(db, "chatRooms"),
      where("participants", "array-contains", currentUserId),
      orderBy("lastUpdated", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      async snapshot => {
        const chatData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            participants: data.participants || [],
            lastMessage: data.lastMessage || "",
          };
        });

        // UID -> 이름 매핑
        const allUids = Array.from(new Set(chatData.flatMap(r => r.participants)));
        const map: Record<string, string> = { ...usersMap };

        await Promise.all(allUids.map(async uid => {
          if (!map[uid]) {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) map[uid] = userDoc.data()?.name ?? "알 수 없음";
            else map[uid] = "알 수 없음";
          }
        }));

        setUsersMap(map);
        setRooms(chatData);
      },
      error => {
        console.error("❌ 채팅방 구독 오류:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>내 채팅 목록</h1>

      {rooms.length === 0 ? (
        <p style={{ textAlign: "center" }}>참여 중인 채팅방이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {rooms.map(room => {
            // 현재 로그인 유저 제외하고 다른 참여자 이름만 표시
            const otherNames = room.participants
              .filter(uid => uid !== currentUserId)
              .map(uid => usersMap[uid] || uid);

            return (
              <li
                key={room.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "10px",
                  cursor: "pointer",
                }}
              >
                <Link href={`/pages/chat/${room.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div>
                    <strong>참여자:</strong> {otherNames.join(", ")}
                  </div>
                  <div>{room.lastMessage || "새 채팅"}</div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
