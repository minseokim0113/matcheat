/*"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

interface Message {
  id: string;
  text: string;
  isMine: boolean;
}

interface ChatPageProps {
  params: { id: string };
}

export default function ChatRoom({ params }: ChatPageProps) {
  const chatId = params.id;
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // 실시간 메시지 구독
  useEffect(() => {
    const q = query(collection(db, `chatRooms/${chatId}/messages`), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, snapshot => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        isMine: doc.data().isMine
      }));
      setMessages(msgs);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setNewMessage("");
    await addDoc(collection(db, `chatRooms/${chatId}/messages`), {
      text: newMessage,
      isMine: true,
      timestamp: serverTimestamp()
    });
    
  };
   useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 나가기 버튼
  const leaveChat = () => router.push("/chatlist"); // 요청 목록으로 돌아가기

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>채팅방</h1>

      <div style={{ height: "400px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", marginBottom: "10px", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ textAlign: msg.isMine ? "right" : "left", marginBottom: "8px" }}>
            <span style={{ display: "inline-block", padding: "6px 12px", borderRadius: "20px", backgroundColor: msg.isMine ? "#4f46e5" : "#e5e7eb", color: msg.isMine ? "white" : "black", maxWidth: "70%" }}>
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요"
          style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
          onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
        />
        <button onClick={sendMessage} style={{ padding: "10px 16px", borderRadius: "8px", backgroundColor: "#4f46e5", color: "white", border: "none" }}>보내기</button>
      </div>

      <button onClick={leaveChat} style={{ padding: "8px 16px", borderRadius: "8px", backgroundColor: "#ef4444", color: "white", border: "none", cursor: "pointer" }}>
        나가기
      </button>
    </div>
  );
}
*/

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
} from "firebase/firestore";
import { db, auth } from "../../../../firebase";

type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
};

export default function ChatRoom() {
  const params = useParams();
  const router = useRouter();
  const chatId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, "chatRooms", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ChatMessage)
      );
      setMessages(msgs);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => unsubscribe();
  }, [chatId]);

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

  const leaveChat = () => router.push("../chatlist");

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
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              textAlign:
                msg.senderId === auth.currentUser?.uid ? "right" : "left",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: "20px",
                backgroundColor:
                  msg.senderId === auth.currentUser?.uid
                    ? "#4f46e5"
                    : "#e5e7eb",
                color:
                  msg.senderId === auth.currentUser?.uid ? "white" : "black",
                maxWidth: "70%",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
          onKeyDown={(e) => {
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