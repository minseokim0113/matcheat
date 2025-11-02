// app/chat/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp,
  doc, getDocs, getDoc, updateDoc, increment, runTransaction, deleteDoc,
  arrayRemove, deleteField, arrayUnion,
} from "firebase/firestore";

// 🔧 경로 별칭(@)을 쓰는 구조라면 이렇게, 아니면 상대경로로 바꿔줘: ../../../../firebase
import { db, auth } from "@/firebase";

import { onAuthStateChanged } from "firebase/auth";
import LocationShareMap from "../../../components/LocationShareMap";

// ===================== 타입 =====================
type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
  readBy?: string[];
};

type Meeting = { lat: number; lng: number; name?: string };

// ===================== 페이지 컴포넌트 =====================
export default function ChatRoom() {
  const params = useParams() as { id: string | string[] };
  const router = useRouter();
  const chatId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [usersMap, setUsersMap] = useState<Record<string, { name: string; profileColor: string }>>({});
  const [roomTitle, setRoomTitle] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [readLineIndex, setReadLineIndex] = useState<number | null>(null);

  // 🔧 위치공유용 상태 추가
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [currentUser, setCurrentUser] = useState<{ uid: string; displayName?: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const enterTimeRef = useRef<number>(Date.now()); // 입장 시간 기록

  // ===================== 공통: 사용자 로드 =====================
  useEffect(() => {
    const fetchUsers = async () => {
      const usersCol = collection(db, "users");
      const usersSnapshot = await getDocs(usersCol);
      const map: Record<string, { name: string; profileColor: string }> = {};
      usersSnapshot.docs.forEach((u) => {
        const data = u.data() as any;
        map[u.id] = {
          name: data?.name ?? "알 수 없음",
          profileColor: data?.profileColor ?? "#FF9B42", // 🎨 chatlist 톤
        };
      });
      setUsersMap(map);
    };
    fetchUsers();
  }, []);

  // ===================== 채팅방 메타/가드 =====================
  useEffect(() => {
    const fetchRoomTitle = async () => {
      if (!chatId) return;
      const roomDocRef = doc(db, "chatRooms", chatId);
      const roomSnap = await getDoc(roomDocRef);
      if (roomSnap.exists()) {
        const data = roomSnap.data() as any;
        setRoomTitle(data.title || "채팅방");
        const ps = data.participants || [];
        setParticipants(ps);

        const uid = auth.currentUser?.uid;
        if (uid && !ps.includes(uid)) {
          alert("이 채팅방의 참가자가 아닙니다.");
          router.replace("/pages/chatlist");
        }
      } else {
        alert("존재하지 않는 채팅방입니다.");
        router.replace("/pages/chatlist");
      }
    };
    fetchRoomTitle();
  }, [chatId, router]);

  // ===================== 메시지 실시간 구독 =====================
  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, "chatRooms", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp"));

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map((doc) => {
        const data = doc.data() as ChatMessage;
        const { id: _ignoredId, ...rest } = data;
        return { id: doc.id, ...rest };
      });
      setMessages(msgs);

      // 입장 시 1회 읽음 경계선 계산 + 스크롤
      if (readLineIndex === null && auth.currentUser) {
        const uid = auth.currentUser.uid;
        const firstUnreadIndex = msgs.findIndex((m) => {
          const t = m.timestamp?.toDate ? m.timestamp.toDate().getTime() : 0;
          return t < enterTimeRef.current && !(m.readBy || []).includes(uid);
        });
        setReadLineIndex(firstUnreadIndex === -1 ? null : firstUnreadIndex);

        setTimeout(() => {
          const scroller = scrollRef.current;
          if (!scroller) return;

          if (firstUnreadIndex !== -1) {
            const el = scroller.querySelectorAll(".chat-msg")[firstUnreadIndex] as HTMLElement | undefined;
            if (el) scroller.scrollTop = el.offsetTop - scroller.clientHeight / 3;
          } else {
            scroller.scrollTop = scroller.scrollHeight;
          }
        }, 50);
      }
    });
    return () => unsubscribe();
  }, [chatId, readLineIndex]);

  // ===================== 메시지 보내기 =====================
  const sendMessage = async () => {
    const user = auth.currentUser;
    if (!input.trim() || !user || !chatId) return;

    if (!participants.includes(user.uid)) {
      alert("채팅방 참가자가 아니라서 메시지를 보낼 수 없습니다.");
      return;
    }

    const messagesRef = collection(db, "chatRooms", chatId, "messages");
    const roomRef = doc(db, "chatRooms", chatId);

    await addDoc(messagesRef, {
      senderId: user.uid,
      text: input,
      timestamp: serverTimestamp(),
      readBy: [user.uid],
    });

    const unreadUpdates: Record<string, any> = {};
    participants.forEach((uid) => {
      if (uid !== user.uid) unreadUpdates[`unreadCount.${uid}`] = increment(1);
    });

    await updateDoc(roomRef, {
      lastMessage: input,
      lastSenderId: user.uid,
      lastUpdated: serverTimestamp(),
      ...unreadUpdates,
    });

    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
  };

  // ===================== 읽음 처리 =====================
  const markMessagesAsRead = async () => {
    const user = auth.currentUser;
    if (!user || !chatId) return;

    const roomRef = doc(db, "chatRooms", chatId);
    await updateDoc(roomRef, { [`unreadCount.${user.uid}`]: 0 });

    const messagesRef = collection(db, "chatRooms", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp"));
    const snapshot = await getDocs(q);
    await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const m = docSnap.data() as ChatMessage;
        if (!(m.readBy || []).includes(user.uid)) {
          await updateDoc(doc(db, "chatRooms", chatId, "messages", docSnap.id), {
            readBy: arrayUnion(user.uid),
          });
        }
      })
    );
  };

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setReadLineIndex(null);
        markMessagesAsRead();
      }
    };
    scroller.addEventListener("scroll", handleScroll);
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, [chatId]);

  useEffect(() => {
    if (chatId && auth.currentUser) markMessagesAsRead();
  }, [chatId]);

  // ===================== 위치공유: 현재 유저/약속 장소 로드 =====================
  useEffect(() => {
    // 로그인 사용자
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setCurrentUser({ uid: u.uid, displayName: u.displayName ?? u.email ?? "유저" });
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!chatId) return;
    (async () => {
      // 우선 rooms/{id}.meeting에서 가져오고, 없으면 chatRooms의 메타에서 대체하거나 하드코드
      const snap = await getDoc(doc(db, "rooms", chatId));
      const data = snap.data() as any;
      if (data?.meeting?.lat && data?.meeting?.lng) {
        setMeeting({
          lat: data.meeting.lat,
          lng: data.meeting.lng,
          name: data.meeting.name ?? "약속 장소",
        });
      } else {
        // 필요 시 chatRooms에서도 시도해보고, 그래도 없으면 임시값
        setMeeting({ lat: 37.5665, lng: 126.9780, name: "을지로" });
      }
    })();
  }, [chatId]);

  // ===================== 나만 나가기 =====================
  const leaveOnlyMe = async () => {
    const user = auth.currentUser;
    if (!user || !chatId) return;
    const roomRef = doc(db, "chatRooms", chatId);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) return;
      const data = snap.data() as any;
      const before: string[] = data.participants || [];
      if (!before.includes(user.uid)) return;
      tx.update(roomRef, {
        participants: arrayRemove(user.uid),
        [`unreadCount.${user.uid}`]: deleteField(),
      });
    });

    const refreshed = await getDoc(roomRef);
    if (refreshed.exists()) {
      const data = refreshed.data() as any;
      const nowParticipants: string[] = data.participants || [];
      if (nowParticipants.length === 0) {
        const msgsCol = collection(db, "chatRooms", chatId, "messages");
        const msgsSnap = await getDocs(msgsCol);
        await Promise.all(msgsSnap.docs.map((d) => deleteDoc(d.ref)));
        await deleteDoc(roomRef);
      }
    }

    router.replace("/pages/chatlist");
  };

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return "";
    const date = ts.toDate();
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const me = auth.currentUser?.uid;

  return (
    <div className="chatWrap">
      {/* 헤더 */}
      <header className="header">
        <button className="iconBtn" onClick={() => router.back()} aria-label="뒤로가기">←</button>
        <div className="headMid">
          <div className="roomTitle" title={roomTitle}>{roomTitle}</div>
          <div className="roomMeta" title={participants.map((u) => usersMap[u]?.name || u).join(", ")}>
            {participants.map((u) => usersMap[u]?.name || u).join(", ")}
          </div>
        </div>
        <button className="leaveBtn" onClick={leaveOnlyMe}>나가기</button>
      </header>

      {/* 메시지 리스트 */}
      <div className="list" ref={scrollRef}>
        {messages.map((msg, idx) => {
          const isMine = msg.senderId === me;
          const sender = usersMap[msg.senderId] || { name: "?", profileColor: "#FFB97A" };
          const showReadLine = idx === readLineIndex;
          const unreadCount = participants.filter((uid) => !(msg.readBy || []).includes(uid)).length;

          return (
            <div key={msg.id} className="row">
              {showReadLine && <div className="unreadSep">―― 아직 읽지 않은 메시지 ――</div>}

              <div className={`msg ${isMine ? "mine" : "other"} chat-msg`}>
                {!isMine && (
                  <div
                    className="avatar"
                    style={{ background: sender.profileColor, cursor: "pointer" }}
                    title={sender.name}
                    onClick={() => router.push(`/pages/userprofile/${msg.senderId}`)}
                  >
                    {sender.name.slice(0, 1)}
                  </div>
                )}

                <div className="bubbleWrap">
                  {!isMine && (
                    <div
                      className="senderName"
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push(`/pages/userprofile/${msg.senderId}`)}
                    >
                      {sender.name}
                    </div>
                  )}
                  <div className={`bubble ${isMine ? "bubbleMine" : "bubbleOther"}`}>{msg.text}</div>

                  <div className={`meta ${isMine ? "metaMine" : "metaOther"}`}>
                    <span className="metaUnread">{unreadCount > 0 ? unreadCount : ""}</span>
                    <span className="metaTime">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="composer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="input"
          onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
        />
        <button className="sendBtn" onClick={sendMessage}>보내기</button>
      </div>

      {/* 🔥 위치공유 섹션: 채팅 아래에 붙임 (원하면 상단/사이드로 이동 가능) */}
      <div className="locationSec">
        <h2 className="locationTitle">📍 약속 장소 위치 공유</h2>
        {currentUser && meeting ? (
          <LocationShareMap roomId={chatId!} currentUser={currentUser} meeting={meeting} />
        ) : (
          <div className="locationLoading">위치 공유 로딩중…</div>
        )}
      </div>

      {/* 🎨 디자인만 변경: chatlist 톤과 통일 */}
      <style jsx>{`
  :global(html, body) { background: #FFF8F1; height: 100%; }
.chatWrap {
  height: 100svh;
  max-width: 720px;
  margin: 0 auto;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  background: #FFFDF9;
  border: 1px solid #F4E7DA;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0,0,0,0.06);
  font-family: 'Noto Sans KR', sans-serif;
  color: #3B2B1B;
}

/* 헤더 */
.header {
  position: sticky; top: 0; z-index: 5;
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px;
  padding: 12px;
  background: linear-gradient(90deg, #FF9B42, #FF7B00);
  color: #fff;
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.15);
}
.iconBtn {
  border: none; background: rgba(255,255,255,0.2); color: #fff;
  border-radius: 10px; height: 36px; width: 36px; cursor: pointer; font-weight: 800;
}
.headMid { min-width: 0; text-align: center; }
.roomTitle { font-weight: 800; font-size: 16px; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.roomMeta { font-size:12px; color: rgba(255,255,255,0.9); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top: 2px; }
.leaveBtn {
  border: none; background:#FFF3E0; color:#A15D00; font-weight:800;
  border-radius:10px; padding:8px 10px; cursor:pointer;
}

/* 리스트 */
.list {
  overflow-y:auto; padding:16px 14px;
  background: #FFF8F1;
}
.row + .row { margin-top: 8px; }
.unreadSep {
  text-align:center; font-size:12px; color:#FF7B00; margin:10px 0 12px;
}

/* 메시지 정렬 */
.msg {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 92%;
  margin-bottom: 6px;
}
.msg.mine {
  margin-left: auto;
  justify-content: flex-end;
}
.msg.other {
  justify-content: flex-start;
}

/* 프로필 */
.avatar {
  flex-shrink: 0;
  width:34px; height:34px;
  border-radius:50%;
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:900;
  font-size:14px;
  box-shadow:0 2px 6px rgba(0,0,0,.15);
  margin-right: 4px;
}

/* 버블 */
.bubbleWrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}
.msg.mine .bubbleWrap {
  align-items: flex-end;
}
.senderName {
  font-size:11px; color:#6B4E2E; padding-left:4px;
}
.bubble {
  padding:10px 14px;
  border-radius:16px;
  max-width:min(560px,78vw);
  word-break:break-word;
  line-height:1.45;
  box-shadow:0 2px 10px rgba(0,0,0,.06);
}
.bubbleOther {
  background:#FFFDF9; color:#3B2B1B; border-top-left-radius:6px; border:1px solid #F4E7DA;
}
.bubbleMine {
  background: linear-gradient(135deg,#FF9B42,#FF7B00); color:#fff; border-top-right-radius:6px;
  box-shadow: 0 6px 16px rgba(255,123,0,0.25);
}

/* 메타 */
.meta { display:inline-flex; gap:6px; align-items:center; font-size:11px; color:#A37C5B; padding:0 4px; margin-top:2px; }
.metaMine { justify-content:flex-end; } 
.metaOther { justify-content:flex-start; }
.metaUnread { color:#B91C1C; min-width:10px; text-align:right; font-weight:800; }
.metaTime { color:#A37C5B; }

/* 입력창 */
.composer {
  position:sticky; bottom:0; padding:10px; background:#FFF6ED;
  border-top:1px solid #F4E7DA; display:grid; grid-template-columns:1fr auto; gap:8px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
}
.input {
  width:100%; height:44px; border-radius:999px; border:none; padding:0 14px; outline:none; background:#fff;
  box-shadow:0 2px 6px rgba(0,0,0,0.06); font-size: 15px;
}
.sendBtn {
  border:none; height:44px; min-width:92px; padding:0 16px; border-radius:12px;
  background:#FF7B00; color:#fff; font-weight:800; cursor:pointer; box-shadow:0 6px 16px rgba(255,123,0,.35);
}
.sendBtn:active { transform: translateY(1px); }

/* 위치공유 섹션 */
.locationSec {
  background: #FFF8F1;
  border-top: 1px solid #F4E7DA;
  padding: 16px 14px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
.locationTitle {
  width: 100%;
  text-align: center;
  font-size: 1rem;
  font-weight: 800;
  color: #3B2B1B;
  background: #FFF3E0;
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.locationLoading {
  font-size: 0.9rem;
  color: #A37C5B;
}

/* 🔥 버튼 스타일 (부모 구조 무관하게 적용) */
:global(.locationSec button) {
  background: linear-gradient(90deg, #FF9B42, #FF7B00) !important;
  color: #fff !important;
  border: none !important;
  border-radius: 999px !important;
  padding: 10px 22px !important;
  font-size: 0.92rem !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  box-shadow: 0 4px 12px rgba(255, 123, 0, 0.25) !important;
  transition: all 0.2s ease !important;
  font-family: 'Noto Sans KR', sans-serif !important;
  letter-spacing: -0.3px !important;
  display: inline-flex !important;
  margin: 0 !important;
}

/* ✅ 버튼 간격 강제 */
:global(.locationSec button + button) {
  margin-left: 18px !important;
}

:global(.locationSec button:hover) {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 14px rgba(255, 123, 0, 0.3) !important;
  background: linear-gradient(90deg, #FFAC5E, #FF8B20) !important;
}

:global(.locationSec button:active) {
  transform: translateY(1px) !important;
  box-shadow: 0 2px 6px rgba(255, 123, 0, 0.25) !important;
}

`}</style>
    </div>
  );
}
