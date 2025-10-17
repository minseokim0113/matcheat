"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../../firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import Link from "next/link";

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage: string;
  lastUpdated?: any;
  title?: string;
  unreadCount?: Record<string, number>; // 🔹 사용자별 안읽은 수
}

export default function ChatListPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({}); // uid → 이름 매핑

  // ✅ 로그인된 사용자 가져오기
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) setCurrentUserId(user.uid);
    });
    return () => unsubscribeAuth();
  }, []);

  // ✅ 채팅방 실시간 구독
  useEffect(() => {
    if (!currentUserId) return;

    const q = query(
      collection(db, "chatRooms"),
      where("participants", "array-contains", currentUserId)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const chatData: ChatRoom[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            participants: data.participants || [],
            lastMessage: data.lastMessage || "",
            lastUpdated: data.lastUpdated ?? 0,
            title: data.title || "",
            unreadCount: data.unreadCount || {}, // 🔹 추가
          };
        });

        // ⏱️ 최신 메시지 순 정렬
        chatData.sort((a, b) => {
          const toMs = (v: any) =>
            v?.toMillis ? v.toMillis() : typeof v === "number" ? v : 0;
          return toMs(b.lastUpdated) - toMs(a.lastUpdated);
        });

        // 👤 UID → 이름 매핑
        const allUids = Array.from(new Set(chatData.flatMap((r) => r.participants)));
        const map: Record<string, string> = { ...usersMap };

        await Promise.all(
          allUids.map(async (uid) => {
            if (!map[uid]) {
              const userDoc = await getDoc(doc(db, "users", uid));
              map[uid] = userDoc.exists()
                ? userDoc.data()?.name ?? "알 수 없음"
                : "알 수 없음";
            }
          })
        );

        setUsersMap(map);
        setRooms(chatData);
      },
      (error) => {
        console.error("❌ 채팅방 구독 오류:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  // ✅ 채팅방 클릭 → 안읽은 메시지 초기화
  const handleChatClick = async (roomId: string) => {
    if (!currentUserId) return;
    const chatRef = doc(db, "chatRooms", roomId);

    await updateDoc(chatRef, {
      [`unreadCount.${currentUserId}`]: 0,
    });
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>내 채팅 목록</h1>

      {rooms.length === 0 ? (
        <p style={{ textAlign: "center" }}>참여 중인 채팅방이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {rooms.map((room) => {
            const unread = room.unreadCount?.[currentUserId ?? ""] || 0;
            const otherNames = room.participants
              .filter((uid) => uid !== currentUserId)
              .map((uid) => usersMap[uid] || uid)
              .join(", ");

            return (
              <li
                key={room.id}
                onClick={() => handleChatClick(room.id)}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "10px",
                  cursor: "pointer",
                  backgroundColor: unread > 0 ? "#f8f9ff" : "white",
                }}
              >
                <Link
                  href={`/pages/chat/${room.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong>채팅방 제목:</strong> {room.title || "제목 없음"}
                        <span style={{ fontSize: "12px", color: "#555" }}>
                          ({room.participants.length}명)
                        </span>
                      </div>
                      <div>
                        <strong>참여자:</strong> {otherNames}
                      </div>
                      <div>{room.lastMessage || "새 채팅"}</div>
                    </div>

                    {/* 🔴 안읽은 메시지 배지 */}
                    {unread > 0 && (
                      <div
                        style={{
                          backgroundColor: "red",
                          color: "white",
                          borderRadius: "50%",
                          minWidth: "22px",
                          height: "22px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {unread}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
