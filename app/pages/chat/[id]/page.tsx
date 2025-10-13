"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../../../firebase";

type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
  senderName?: string;
};

export default function ChatRoom() {
  const params = useParams();
  const router = useRouter();
  const chatId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  // 🔹 모든 사용자 이름 한 번 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      const usersCol = collection(db, "users");
      const usersSnapshot = await getDocs(usersCol);
      const map: Record<string, string> = {};
      usersSnapshot.docs.forEach(u => {
        map[u.id] = u.data()?.name ?? "알 수 없음";
      });
      setUsersMap(map);
    };
    fetchUsers();
  }, []);

  // 🔹 실시간 메시지 구독
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, "chatRooms", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp"));

    const unsubscribe = onSnapshot(q, snapshot => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data() as ChatMessage;
        return {
          id: doc.id,
          ...data,
          senderName: usersMap[data.senderId] || "알 수 없음",
        };
      });
      setMessages(msgs);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => unsubscribe();
  }, [chatId, usersMap]);

  const sendMessage = async () => {
    if (!input.trim() || !auth.currentUser) return;

    const messagesRef = collection(db, "chatRooms", chatId, "messages");
    await addDoc(messagesRef, {
      senderId: auth.currentUser.uid,
      text: input,
      timestamp: serverTimestamp(),
    });
    setInput("");
  };

  const leaveChat = () => router.push("/pages/chatlist");

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return "";
    const date = ts.toDate();
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>채팅방</h1>

      <div
        style={{
          height: "400px",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              textAlign: msg.senderId === auth.currentUser?.uid ? "right" : "left",
              marginBottom: "12px",
            }}
          >
            {/* 상대방 이름 */}
            {msg.senderId !== auth.currentUser?.uid && (
              <div style={{ fontSize: "12px", color: "#555", marginBottom: "2px" }}>
                {msg.senderName}
              </div>
            )}

            <div style={{ display: "inline-block", position: "relative" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "8px 14px",
                  borderRadius: "20px",
                  backgroundColor:
                    msg.senderId === auth.currentUser?.uid ? "#4f46e5" : "#e5e7eb",
                  color: msg.senderId === auth.currentUser?.uid ? "white" : "black",
                  maxWidth: "70%",
                  wordBreak: "break-word",
                }}
              >
                {msg.text}
              </span>

              {/* 시간 표시 */}
              <span
                style={{
                  fontSize: "10px",
                  color: "#999",
                  marginLeft: "6px",
                  verticalAlign: "bottom",
                }}
              >
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
          onKeyDown={e => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            backgroundColor: "#4f46e5",
            color: "white",
            border: "none",
          }}
        >
          보내기
        </button>
      </div>

      <button
        onClick={leaveChat}
        style={{
          padding: "8px 16px",
          borderRadius: "8px",
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        나가기
      </button>
    </div>
  );
}

