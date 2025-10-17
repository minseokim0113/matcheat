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
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db, auth } from "../../../../firebase";

type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
  readBy?: string[];
};

export default function ChatRoom() {
  const params = useParams();
  const router = useRouter();
  const chatId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [usersMap, setUsersMap] = useState<Record<string, { name: string; profileColor: string }>>({});
  const [roomTitle, setRoomTitle] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [readLineIndex, setReadLineIndex] = useState<number | null>(null); // 표시선 위치

  // 모든 사용자 정보 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      const usersCol = collection(db, "users");
      const usersSnapshot = await getDocs(usersCol);
      const map: Record<string, { name: string; profileColor: string }> = {};
      usersSnapshot.docs.forEach(u => {
        const data = u.data();
        map[u.id] = {
          name: data?.name ?? "알 수 없음",
          profileColor: data?.profileColor ?? "#bbb",
        };
      });
      setUsersMap(map);
    };
    fetchUsers();
  }, []);

  // 방 제목 + 참여자 가져오기
  useEffect(() => {
    const fetchRoomTitle = async () => {
      if (!chatId) return;
      const roomDocRef = doc(db, "chatRooms", chatId);
      const roomSnap = await getDoc(roomDocRef);
      if (roomSnap.exists()) {
        const data = roomSnap.data();
        setRoomTitle(data.title || "채팅방");
        setParticipants(data.participants || []);
      }
    };
    fetchRoomTitle();
  }, [chatId]);

  // 실시간 메시지 구독
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, "chatRooms", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp"));

    const unsubscribe = onSnapshot(q, snapshot => {
      const msgs: ChatMessage[] = snapshot.docs.map(doc => {
        const data = doc.data() as ChatMessage;
        return { id: doc.id, ...data };
      });
      setMessages(msgs);

      // 입장 시 한 번만 읽음 표시선 위치 계산
      if (readLineIndex === null && auth.currentUser) {
        const firstUnreadIndex = msgs.findIndex(m => !(m.readBy || []).includes(auth.currentUser!.uid));
        setReadLineIndex(firstUnreadIndex === -1 ? null : firstUnreadIndex);

        // 읽지 않은 위치로 스크롤
        setTimeout(() => {
          const scrollContainer = bottomRef.current?.parentElement;
          if (scrollContainer) {
            if (msgs.length === 0 || firstUnreadIndex === -1) {
              scrollContainer.scrollTop = scrollContainer.scrollHeight;
            } else {
              const msgElements = scrollContainer.querySelectorAll(".chat-msg");
              const targetEl = msgElements[firstUnreadIndex] as HTMLElement | undefined;
              if (targetEl) {
                scrollContainer.scrollTop = targetEl.offsetTop - 10;
              }
            }
          }
        }, 50);
      }
    });

    return () => unsubscribe();
  }, [chatId, readLineIndex]);

  // 메시지 보내기
  const sendMessage = async () => {
    const currentUser = auth.currentUser;
    if (!input.trim() || !currentUser) return;

    const messagesRef = collection(db, "chatRooms", chatId, "messages");
    const roomRef = doc(db, "chatRooms", chatId);

    await addDoc(messagesRef, {
      senderId: currentUser.uid,
      text: input,
      timestamp: serverTimestamp(),
      readBy: [currentUser.uid],
    });

    // 참여자 중 본인 제외 → unreadCount +1
    const unreadUpdates: Record<string, any> = {};
    participants.forEach(uid => {
      if (uid !== currentUser.uid) unreadUpdates[`unreadCount.${uid}`] = increment(1);
    });

    await updateDoc(roomRef, {
      lastMessage: input,
      lastSenderId: currentUser.uid,
      lastUpdated: serverTimestamp(),
      ...unreadUpdates,
    });

    setInput("");

    // 새 메시지 입력 시 맨 아래로 스크롤
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  // 읽음 처리
  const markMessagesAsRead = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const roomRef = doc(db, "chatRooms", chatId);
    await updateDoc(roomRef, {
      [`unreadCount.${currentUser.uid}`]: 0,
    });

    // 메시지에 본인 읽음 추가
    const messagesRef = collection(db, "chatRooms", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp"));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(async docSnap => {
      const m = docSnap.data() as ChatMessage;
      if (!(m.readBy || []).includes(currentUser.uid)) {
        await updateDoc(doc(db, "chatRooms", chatId, "messages", docSnap.id), {
          readBy: [...(m.readBy || []), currentUser.uid],
        });
      }
    });
  };

  // 방 입장 시 읽음 처리
  useEffect(() => {
    if (chatId && auth.currentUser) markMessagesAsRead();
  }, [chatId, auth.currentUser]);

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
      <h1 style={{ textAlign: "center" }}>{roomTitle}</h1>

      <div style={{ textAlign: "center", fontSize: "14px", color: "#555", marginBottom: "10px" }}>
        <strong>참여자:</strong>{" "}
        {participants?.map(uid => usersMap[uid]?.name || uid).join(", ")}
      </div>

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
        {messages.map((msg, idx) => {
          const isMine = msg.senderId === auth.currentUser?.uid;
          const sender = usersMap[msg.senderId] || { name: "알 수 없음", profileColor: "#bbb" };
          const showReadLine = idx === readLineIndex;

          // 안 읽은 사람 수
          const unreadCount = participants.filter(uid => !(msg.readBy || []).includes(uid)).length;

          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column" }}>
              {showReadLine && (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#4f46e5",
                    margin: "8px 0",
                  }}
                >
                  ── 아직 읽지 않은 메시지 ──
                </div>
              )}

              <div
                className="chat-msg"
                style={{
                  display: "flex",
                  flexDirection: isMine ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  marginBottom: "12px",
                }}
              >
                {/* 프로필 */}
                {!isMine && (
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: sender.profileColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "14px",
                      marginRight: "8px",
                    }}
                  >
                    {sender.name.slice(0, 1)}
                  </div>
                )}

                {/* 말풍선 */}
                <span
                  style={{
                    display: "inline-block",
                    padding: "8px 14px",
                    borderRadius: "20px",
                    backgroundColor: isMine ? "#4f46e5" : "#e5e7eb",
                    color: isMine ? "white" : "black",
                    maxWidth: "70%",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </span>

                {/* 시간 & 안읽음 */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMine ? "flex-start" : "flex-end",
                    marginLeft: isMine ? "8px" : "0",
                    marginRight: isMine ? "0" : "8px",
                    fontSize: "10px",
                    color: "#555",
                  }}
                >
                  <span>{unreadCount > 0 ? unreadCount : ""}</span>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            </div>
          );
        })}
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
