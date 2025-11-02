"use client";
import { useState, useEffect, useRef } from "react";
import {
  collection, query, where, getDocs, updateDoc, deleteDoc, doc,
  getDoc, addDoc, serverTimestamp, runTransaction
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

interface ChatRoom {
  id: string;
  title: string;
  participants: string[];
  lastMessage: string;
  lastUpdated?: any;
}

type Request = {
  id: string;
  postId: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "rejected" | "matched";
  createdAt?: any;
};

type Post = { title: string; authorId: string; };
type User = { name: string; district?: string; mbti?: string; };

export default function RequestsPage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [receivedRequests, setReceivedRequests] = useState<Request[]>([]);
  const [sentRequests, setSentRequests] = useState<Request[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [postsMap, setPostsMap] = useState<Record<string, Post>>({});
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});

  const postsRef = useRef(postsMap);
  const usersRef = useRef(usersMap);
  useEffect(() => { postsRef.current = postsMap; }, [postsMap]);
  useEffect(() => { usersRef.current = usersMap; }, [usersMap]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUserId(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  const safeTitle = (postId: string) => {
    const title = postsMap[postId]?.title ?? "제목 없음";
    try { return decodeURIComponent(escape(title)); } catch { return title; }
  };

  const ensureData = async (reqs: Request[]) => {
    const nextPosts = { ...postsRef.current };
    const nextUsers = { ...usersRef.current };

    const postIds = Array.from(new Set(reqs.map(r => r.postId)));
    const userIds = Array.from(new Set(reqs.flatMap(r => [r.fromUserId, r.toUserId])));

    for (const pid of postIds) {
      if (!nextPosts[pid]) {
        const docSnap = await getDoc(doc(db, "posts", pid));
        nextPosts[pid] = docSnap.exists()
          ? (docSnap.data() as Post)
          : { title: "(삭제된 게시글)", authorId: "" };
      }
    }

    for (const uid of userIds) {
      if (!nextUsers[uid]) {
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists()) nextUsers[uid] = docSnap.data() as User;
      }
    }

    setPostsMap(nextPosts);
    setUsersMap(nextUsers);
  };

  useEffect(() => {
    if (!currentUserId) return;
    const load = async () => {
      const recvSnap = await getDocs(query(collection(db, "requests"), where("toUserId", "==", currentUserId)));
      const sentSnap = await getDocs(query(collection(db, "requests"), where("fromUserId", "==", currentUserId)));
      const recv = recvSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      const sent = sentSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      await ensureData([...recv, ...sent]);
      setReceivedRequests(recv);
      setSentRequests(sent);
    };
    load();
  }, [currentUserId]);

  const handleAction = async (reqId: string, type: "matched" | "rejected") => {
    const req = receivedRequests.find(r => r.id === reqId);
    if (!req) return;
    if (type === "rejected") {
      await updateDoc(doc(db, "requests", reqId), { status: "rejected" });
      toast.error("요청을 거절했습니다.");
      return;
    }

    try {
      await runTransaction(db, async (tx) => {
        const postRef = doc(db, "posts", req.postId);
        const snap = await tx.get(postRef);
        if (!snap.exists()) throw new Error("글이 없습니다.");
        const post: any = snap.data();
        const max = post.maxParticipants ?? 0;
        const cur = post.participantsCount ?? 0;
        if (max > 0 && cur >= max) throw new Error("정원이 찼습니다.");
        tx.update(postRef, { participantsCount: cur + 1 });
      });
      await updateDoc(doc(db, "requests", reqId), { status: "matched" });
      toast.success("참가 처리 완료!");
    } catch (e: any) {
      toast.error(e.message || "오류 발생");
    }
  };

  const handleCancel = async (reqId: string) => {
    if (confirm("요청을 취소하시겠습니까?")) {
      await deleteDoc(doc(db, "requests", reqId));
      toast("요청을 취소했습니다.", { icon: "↩️" });
    }
  };

  const handleChat = async (req: Request) => {
    if (!currentUserId) return;
    const title = postsMap[req.postId]?.title || "제목 없음";
    const q = query(collection(db, "chatRooms"), where("title", "==", title));
    const snap = await getDocs(q);
    let id: string | null = null;
    snap.forEach((d) => (id = d.id));
    if (id) router.push(`/pages/chat/${id}`);
    else {
      const newRoom = await addDoc(collection(db, "chatRooms"), {
        title, participants: [req.fromUserId, req.toUserId], lastMessage: "", lastUpdated: serverTimestamp(),
      });
      router.push(`/pages/chat/${newRoom.id}`);
    }
  };

  const list = activeTab === "received" ? receivedRequests : sentRequests;

  return (
    <main className="rq-page">
      <Toaster position="bottom-center" />
      <header className="rq-header">
        🍚 밥친구 요청함
        <div className="rq-tabs">
          <button className={activeTab === "received" ? "active" : ""} onClick={() => setActiveTab("received")}>받은 요청</button>
          <button className={activeTab === "sent" ? "active" : ""} onClick={() => setActiveTab("sent")}>보낸 요청</button>
        </div>
      </header>

      <section className="rq-list">
        {list.length ? (
          list.map((req) => {
            const user = usersMap[activeTab === "received" ? req.fromUserId : req.toUserId];
            const isReceived = activeTab === "received";
            const userName = user?.name || "알 수 없음";
            const initial = userName !== "알 수 없음" ? userName.charAt(0) : "👤";

            return (
              <div key={req.id} className="rq-item">
                <div className="rq-left">
                  <div className="rq-profile">
                    <div className="rq-avatar">{initial}</div>
                    <div className="rq-text">
                      <div className="rq-title">{safeTitle(req.postId)}</div>
                      {isReceived ? (
                        <div className="rq-info">
                          <span>{user?.name || "알 수 없음"}</span>
                          <span>{user?.district || "비공개"}</span>
                          <span>{user?.mbti || "비공개"}</span>
                        </div>
                      ) : (
                        <div className="rq-info">
                          <span>받는 사람: {user?.name || "알 수 없음"}</span>
                        </div>
                      )}
                      <div className={`rq-status ${req.status}`}>
                        {req.status === "pending" ? "대기중" : req.status === "matched" ? "매칭완료" : "거절됨"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rq-right">
                  {req.status === "pending" && isReceived && (
                    <>
                      <button className="btn primary" onClick={() => handleAction(req.id, "matched")}>수락</button>
                      <button className="btn danger" onClick={() => handleAction(req.id, "rejected")}>거절</button>
                    </>
                  )}
                  {req.status === "pending" && !isReceived && (
                    <button className="btn neutral" onClick={() => handleCancel(req.id)}>취소</button>
                  )}
                  {req.status === "matched" && (
                    <button className="btn chat" onClick={() => handleChat(req)}>채팅</button>
                  )}
                  {req.status === "rejected" && (
                    <span className="rq-reject">거절됨</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rq-empty">요청이 없습니다.</div>
        )}
      </section>

      <style jsx global>{`
        .rq-page {
          background: linear-gradient(to bottom, #FFF3E0, #FFF8F1, #FFFDFB);
          min-height: 100vh;
          font-family: "Noto Sans KR", sans-serif;
          color: #3B2B1B;
        }
        .rq-header {
          position: sticky;
          top: 0;
          background: linear-gradient(135deg, #FF9B42, #FF7B00);
          color: #fff;
          text-align: center;
          font-weight: 800;
          font-size: 1.3rem;
          padding: 1rem;
          border-bottom-left-radius: 18px;
          border-bottom-right-radius: 18px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.15);
        }
        .rq-tabs {
          display: flex;
          justify-content: center;
          margin-top: 0.8rem;
          gap: 0.5rem;
        }
        .rq-tabs button {
          border: none;
          padding: 0.5rem 1.3rem;
          border-radius: 999px;
          background: #FFF3E0;
          color: #A0522D;
          font-weight: 700;
          cursor: pointer;
        }
        .rq-tabs button.active {
          background: linear-gradient(135deg, #FF9B42, #FF7B00);
          color: #fff;
          box-shadow: 0 4px 10px rgba(255,123,0,0.3);
        }
        .rq-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding: 1rem 0.8rem 5rem;
        }
        .rq-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #FFFDF9;
          border-radius: 14px;
          padding: 0.9rem 1rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          transition: background 0.25s ease;
        }
        .rq-item:hover { background: #FFF3E0; }
        .rq-profile {
          display: flex;
          align-items: center;
          gap: 0.9rem;
        }
        .rq-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF9B42, #FF7B00);
          color: #fff;
          font-weight: 800;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .rq-title {
          font-weight: 800;
          font-size: 1rem;
          color: #2E1500;
          margin-bottom: 3px;
        }
        .rq-info {
          font-size: 0.9rem;
          color: #7A5A3D;
          display: flex;
          gap: 0.6rem;
        }
        .rq-status {
          font-size: 0.85rem;
          margin-top: 4px;
          font-weight: 700;
        }
        .rq-status.pending { color: #B86A00; }
        .rq-status.matched { color: #FF7B00; }
        .rq-status.rejected { color: #A62828; }
        .rq-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.4rem;
          margin-left: 1rem;
        }
        .btn {
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .btn.primary {
          background: linear-gradient(135deg, #FF9B42, #FF7B00);
          color: white;
        }
        .btn.danger {
          background: linear-gradient(135deg, #F87171, #EF4444);
          color: white;
        }
        .btn.neutral {
          background: #E5E7EB;
          color: #3B2B1B;
        }
        .btn.chat {
          background: linear-gradient(135deg, #FFD27F, #FFB366);
          color: #3B2B1B;
        }
        .rq-empty {
          text-align: center;
          background: #fff;
          border-radius: 12px;
          color: #9C8A7B;
          font-weight: 600;
          padding: 2rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
      `}</style>
    </main>
  );
}
