"use client";
import { useState, useEffect } from "react";
import {
  collection, query, where, getDocs, updateDoc, deleteDoc, doc,
  getDoc, addDoc, serverTimestamp, arrayUnion, runTransaction
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { useRouter } from "next/navigation";

interface ChatRoom {
  id: string;
  titles: string;
  participants: string[];
  lastMessage: string;
}
type Request = {
  id: string;
  postId: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "rejected" | "matched";
};
type Post = {
  title: string;
  authorId: string;
};
type User = {
  name: string;
  location?: string;
  mbti?: string;
};

export default function RequestsPage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [receivedRequests, setReceivedRequests] = useState<Request[]>([]);
  const [sentRequests, setSentRequests] = useState<Request[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [postsMap, setPostsMap] = useState<Record<string, Post>>({});
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setCurrentUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  const fetchRequests = async () => {
    if (!currentUserId) return;

    const receivedQuery = query(collection(db, "requests"), where("toUserId", "==", currentUserId));
    const receivedSnap = await getDocs(receivedQuery);
    const receivedData = receivedSnap.docs.map(d => ({ id: d.id, ...d.data() } as Request));
    setReceivedRequests(receivedData);

    const sentQuery = query(collection(db, "requests"), where("fromUserId", "==", currentUserId));
    const sentSnap = await getDocs(sentQuery);
    const sentData = sentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Request));
    setSentRequests(sentData);

    const allPostIds = Array.from(new Set([...receivedData, ...sentData].map(r => r.postId)));
    const posts: Record<string, Post> = {};
    for (const postId of allPostIds) {
      const postDoc = await getDoc(doc(db, "posts", postId));
      if (postDoc.exists()) posts[postId] = postDoc.data() as Post;
    }
    setPostsMap(posts);

    const userIds = Array.from(new Set([...receivedData, ...sentData].flatMap(r => [r.fromUserId, r.toUserId])));
    const users: Record<string, User> = {};
    for (const userId of userIds) {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) users[userId] = userDoc.data() as User;
    }
    setUsersMap(users);
  };

  useEffect(() => {
    if (!currentUserId) return;
    fetchRequests();
  }, [currentUserId]);

  // ✅ 수락/거절 처리: 수락 시 참가자 추가 + 인원 카운트 증가 + 자동 마감
  const handleReceivedAction = async (reqId: string, action: "rejected" | "matched") => {
    const req = receivedRequests.find(r => r.id === reqId);
    if (!req) return;

    if (action === "rejected") {
      await updateDoc(doc(db, "requests", reqId), { status: "rejected" });
      setReceivedRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "rejected" } : r));
      return;
    }

    try {
      await runTransaction(db, async (tx) => {
        const postRef = doc(db, "posts", req.postId);
        const snap = await tx.get(postRef);
        if (!snap.exists()) throw new Error("글이 존재하지 않습니다.");

        const post: any = snap.data();
        const max = Number(post.maxParticipants ?? 0);       // 0이면 무제한
        const cur = Number(post.participantsCount ?? 0);
        const status = (post.status ?? "open") as "open" | "closed";

        if (status === "closed") throw new Error("이미 모집이 마감되었습니다.");
        if (max > 0 && cur >= max) throw new Error("정원이 가득 찼습니다.");

        const participantRef = doc(db, "posts", req.postId, "participants", req.fromUserId);
        const mine = await tx.get(participantRef);

        let next = cur;
        if (!mine.exists()) {
          tx.set(participantRef, {
            uid: req.fromUserId,
            joinedAt: serverTimestamp(),
          });
          next = cur + 1;
        }

        const upd: any = { participantsCount: next };
        if (max > 0 && next >= max) upd.status = "closed";
        tx.update(postRef, upd);
      });

      await updateDoc(doc(db, "requests", reqId), { status: "matched" });

      // 로컬 상태 반영
      setReceivedRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "matched" } : r));
      alert("참가 처리되었습니다!");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "참가 처리 중 오류가 발생했습니다.");
    }
  };

  const handleCancelRequest = async (reqId: string) => {
    if (confirm("요청을 취소하시겠습니까?")) {
      await deleteDoc(doc(db, "requests", reqId));
      setSentRequests(prev => prev.filter(req => req.id !== reqId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#f0ad4e";
      case "rejected": return "#d9534f";
      case "matched": return "#0275d8";
      default: return "#ccc";
    }
  };

  const handleStartChat = async (req: Request) => {
    if (!currentUserId) return;
    try {
      const roomTitle = postsMap[req.postId]?.title || "제목 없음";
      const qy = query(collection(db, "chatRooms"), where("title", "==", roomTitle));
      const snapshot = await getDocs(qy);

      let chatRoomId: string | null = null;
      snapshot.forEach(d => { chatRoomId = d.id; });

      if (chatRoomId) {
        const roomRef = doc(db, "chatRooms", chatRoomId);
        await updateDoc(roomRef, { participants: arrayUnion(req.fromUserId) });
        router.push(`/pages/chat/${chatRoomId}`);
        return;
      }

      const newRoom = {
        title: roomTitle,
        participants: [req.fromUserId, req.toUserId],
        lastMessage: "",
        lastUpdated: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "chatRooms"), newRoom);
      router.push(`/pages/chat/${docRef.id}`);
    } catch (error) {
      console.error("❌ 채팅방 생성/참여 오류:", error);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      {/* 탭 */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <button
          style={{
            padding: "0.5rem 1rem",
            borderBottom: activeTab === "received" ? "2px solid #003366" : "2px solid transparent",
            fontWeight: activeTab === "received" ? "bold" : "normal",
            cursor: "pointer",
            background: "none",
            border: "none",
          }}
          onClick={() => setActiveTab("received")}
        >받은 요청</button>
        <button
          style={{
            padding: "0.5rem 1rem",
            borderBottom: activeTab === "sent" ? "2px solid #003366" : "2px solid transparent",
            fontWeight: activeTab === "sent" ? "bold" : "normal",
            cursor: "pointer",
            background: "none",
            border: "none",
          }}
          onClick={() => setActiveTab("sent")}
        >보낸 요청</button>
      </div>

      {/* 받은 요청 */}
      {activeTab === "received" && (
        receivedRequests.length ? receivedRequests.map((req) => {
          const sender = usersMap[req.fromUserId];
          return (
            <div key={req.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: ".75rem", marginBottom: ".75rem" }}>
              <p><strong>글 제목:</strong> {postsMap[req.postId]?.title || req.postId}</p>
              <p><strong>보낸 사람:</strong> {sender?.name || req.fromUserId}</p>
              {sender && (
                <>
                  <p><strong>위치:</strong> {sender.location || "비공개"}</p>
                  <p><strong>MBTI:</strong> {sender.mbti || "비공개"}</p>
                </>
              )}
              <div style={{ display: "flex", gap: ".5rem", marginTop: ".5rem", alignItems: "center" }}>
                {req.status === "pending" ? (
                  <>
                    <button
                      style={{ backgroundColor: "#0275d8", color: "#fff", border: "none", borderRadius: 5, padding: ".25rem .5rem", cursor: "pointer" }}
                      onClick={() => handleReceivedAction(req.id, "matched")}
                    >수락</button>
                    <button
                      style={{ backgroundColor: "#d9534f", color: "#fff", border: "none", borderRadius: 5, padding: ".25rem .5rem", cursor: "pointer" }}
                      onClick={() => handleReceivedAction(req.id, "rejected")}
                    >거절</button>
                  </>
                ) : req.status === "matched" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                    <span style={{ color: "#0275d8", fontWeight: "bold" }}>매치 완료</span>
                    <button
                      style={{ backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: 5, padding: ".25rem .5rem", cursor: "pointer" }}
                      onClick={() => handleStartChat(req)}
                    >채팅으로 이동</button>
                  </div>
                ) : (
                  <span style={{ color: "#d9534f", fontWeight: "bold" }}>거절됨</span>
                )}
              </div>
            </div>
          );
        }) : <p>받은 요청이 없습니다.</p>
      )}

      {/* 보낸 요청 */}
      {activeTab === "sent" && (
        sentRequests.length ? sentRequests.map((req) => (
          <div key={req.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: ".75rem", marginBottom: ".75rem" }}>
            <p><strong>글 제목:</strong> {postsMap[req.postId]?.title || req.postId}</p>
            <p>
              <strong>상태:</strong>{" "}
              <span style={{ color: getStatusColor(req.status) }}>
                {req.status === "pending" ? "대기중" : req.status === "matched" ? "매칭완료" : "거절됨"}
              </span>
            </p>
            {req.status === "pending" && (
              <button
                style={{ backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: 5, padding: ".25rem .5rem", cursor: "pointer", marginTop: ".5rem" }}
                onClick={() => handleCancelRequest(req.id)}
              >요청 취소</button>
            )}
            {req.status === "matched" && (
              <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginTop: ".5rem" }}>
                <span style={{ color: "#0275d8", fontWeight: "bold" }}>매치 완료</span>
                <button
                  style={{ backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: 5, padding: ".25rem .5rem", cursor: "pointer" }}
                  onClick={() => handleStartChat(req)}
                >채팅으로 이동</button>
              </div>
            )}
          </div>
        )) : <p>보낸 요청이 없습니다.</p>
      )}
    </div>
  );
}
