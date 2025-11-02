"use client";

import { useState, useEffect, useMemo } from "react";
import { db, auth } from "../../../firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  arrayRemove,
  deleteField,
} from "firebase/firestore";
import Link from "next/link";

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage: string;
  lastUpdated?: any;
  title?: string;
  unreadCount?: Record<string, number>;
}

export default function ChatListPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [hideOld, setHideOld] = useState<boolean>(true);
  const [hideDays, setHideDays] = useState<number>(30);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [leavingRoomId, setLeavingRoomId] = useState<string | null>(null);
  const [qtext, setQtext] = useState<string>("");

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) setCurrentUserId(user.uid);
    });
    return () => unsub();
  }, []);

  const toMs = (v: any) =>
    v?.toMillis ? v.toMillis() : typeof v === "number" ? v : 0;

  const timeAgo = (ms: number) => {
    if (!ms) return "";
    const diff = Date.now() - ms;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "방금 전";
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    return `${d}일 전`;
  };

  useEffect(() => {
    if (!currentUserId) return;
    const qRooms = query(
      collection(db, "chatRooms"),
      where("participants", "array-contains", currentUserId)
    );

    const unsubscribe = onSnapshot(qRooms, async (snapshot) => {
      const chatData: ChatRoom[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          participants: data.participants || [],
          lastMessage: data.lastMessage || "",
          lastUpdated: data.lastUpdated ?? 0,
          title: data.title || "",
          unreadCount: data.unreadCount || {},
        };
      });

      chatData.sort((a, b) => toMs(b.lastUpdated) - toMs(a.lastUpdated));

      const allUids = Array.from(new Set(chatData.flatMap((r) => r.participants)));
      const map: Record<string, string> = { ...usersMap };

      await Promise.all(
        allUids.map(async (uid) => {
          if (!map[uid]) {
            const userDoc = await getDoc(doc(db, "users", uid));
            map[uid] = userDoc.exists()
              ? (userDoc.data() as any)?.name ?? "알 수 없음"
              : "알 수 없음";
          }
        })
      );

      setUsersMap(map);
      setRooms(chatData);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const handleChatClick = async (roomId: string) => {
    if (!currentUserId) return;
    const chatRef = doc(db, "chatRooms", roomId);
    await updateDoc(chatRef, { [`unreadCount.${currentUserId}`]: 0 });
  };

  const handleLeaveRoom = async (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("이 채팅방을 나가시겠습니까?")) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      setLeavingRoomId(roomId);
      const roomRef = doc(db, "chatRooms", roomId);
      await updateDoc(roomRef, {
        [`unreadCount.${uid}`]: deleteField(),
        participants: arrayRemove(uid),
      });
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const data = snap.data() as any;
        const nowParticipants: string[] = data.participants || [];
        if (nowParticipants.length === 0) {
          const msgsCol = collection(db, "chatRooms", roomId, "messages");
          const msgsSnap = await getDocs(msgsCol);
          await Promise.all(msgsSnap.docs.map((d) => deleteDoc(d.ref)));
          await deleteDoc(roomRef);
        }
      }
    } catch (err) {
      console.error("나가기 실패:", err);
      alert("나가기 중 오류가 발생했습니다.");
    } finally {
      setLeavingRoomId(null);
    }
  };

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("이 채팅방을 삭제할까요? (모든 메시지도 삭제됩니다)")) return;
    try {
      setDeletingRoomId(roomId);
      const msgsCol = collection(db, "chatRooms", roomId, "messages");
      const msgsSnap = await getDocs(msgsCol);
      await Promise.all(msgsSnap.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(doc(db, "chatRooms", roomId));
    } catch (err) {
      console.error("채팅방 삭제 실패:", err);
      alert("채팅방 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingRoomId(null);
    }
  };

  const thresholdMs = hideDays * 24 * 60 * 60 * 1000;
  const filtered = useMemo(() => {
    const now = Date.now();
    return rooms.filter((r) => {
      if (hideOld) {
        const updated = toMs(r.lastUpdated);
        if (!updated || now - updated > thresholdMs) return false;
      }
      if (!qtext.trim()) return true;
      const others = r.participants
        .filter((uid) => uid !== currentUserId)
        .map((uid) => usersMap[uid] || uid)
        .join(", ");
      const hay = `${r.title ?? ""} ${others} ${r.lastMessage ?? ""}`.toLowerCase();
      return hay.includes(qtext.toLowerCase());
    });
  }, [rooms, hideOld, hideDays, qtext, currentUserId, usersMap]);

  return (
    <div
      style={{
        backgroundColor: "#FFF8F1",
        minHeight: "100vh",
        fontFamily: "'Noto Sans KR', sans-serif",
        color: "#3B2B1B",
      }}
    >
      {/* 상단 헤더 */}
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "linear-gradient(90deg, #FF9B42, #FF7B00)",
          color: "white",
          padding: "1rem 1.2rem",
          fontSize: "1.4rem",
          fontWeight: 800,
          textAlign: "center",
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          boxShadow:
            "0 3px 10px rgba(0,0,0,0.15), inset 0 -2px 6px rgba(255,255,255,0.25)",
          textShadow: "0 1px 2px rgba(0,0,0,0.25)",
          zIndex: 10,
        }}
      >
        💬 내 채팅방
      </header>

      {/* 검색창 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "1rem 0",
        }}
      >
        <input
          type="text"
          placeholder="채팅방, 참가자, 메시지 검색"
          value={qtext}
          onChange={(e) => setQtext(e.target.value)}
          style={{
            width: "92%",
            padding: "0.8rem 1rem",
            borderRadius: "999px",
            border: "none",
            background: "#FFF",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            fontSize: "0.95rem",
            outline: "none",
          }}
        />
      </div>

      {/* 채팅방 리스트 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.8rem",
          padding: "0 1rem 5rem",
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              background: "#FFF",
              borderRadius: 12,
              padding: "2rem",
              textAlign: "center",
              color: "#B45309",
              fontWeight: 600,
            }}
          >
            💭 채팅방이 없습니다.
          </div>
        ) : (
          filtered.map((room) => {
            const unread = room.unreadCount?.[currentUserId ?? ""] || 0;
            const otherNames = room.participants
              .filter((uid) => uid !== currentUserId)
              .map((uid) => usersMap[uid] || uid)
              .join(", ");
            const lastTs = toMs(room.lastUpdated);
            const avatarLetter = otherNames?.[0] ?? "?";

            return (
              <Link
                key={room.id}
                href={`/pages/chat/${room.id}`}
                onClick={() => handleChatClick(room.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#FFFDF9",
                  borderRadius: 16,
                  padding: "1rem 1.2rem",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#FFF3E0";
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#FFFDF9";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* 좌측 아바타 */}
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#FF9B42,#FF7B00)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    marginRight: "1rem",
                    flexShrink: 0,
                  }}
                >
                  {avatarLetter}
                </div>

                {/* 중앙 정보 */}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <strong style={{ fontSize: "1rem", color: "#2E1500" }}>
                      {room.title || "제목 없음"}
                    </strong>
                    <span style={{ fontSize: "0.8rem", color: "#A37C5B" }}>
                      {lastTs ? timeAgo(lastTs) : ""}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#6B4E2E",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    👥 {otherNames || "참가자 없음"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#7A5A3D",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginTop: 4,
                    }}
                  >
                    💬 {room.lastMessage || "새 메시지가 없습니다"}
                  </div>
                </div>

                {/* 오른쪽 버튼 */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  {unread > 0 && (
                    <span
                      style={{
                        background: "linear-gradient(135deg,#FF8C00,#FF5C00)",
                        color: "#fff",
                        borderRadius: "999px",
                        padding: "3px 8px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        boxShadow: "0 1px 4px rgba(255,123,0,0.3)",
                        marginBottom: 6,
                      }}
                    >
                      {unread}
                    </span>
                  )}

                  <button
                    style={{
                      background: "linear-gradient(90deg,#FF9B42,#FF7B00)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "6px 14px",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      boxShadow: "0 3px 8px rgba(255,123,0,0.3)",
                      transition: "0.2s",
                    }}
                  >
                    채팅
                  </button>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
