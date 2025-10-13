"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { useRouter } from "next/navigation";

interface ChatRoom {
  id: string;
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
    const receivedData = receivedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request));
    setReceivedRequests(receivedData);

    const sentQuery = query(collection(db, "requests"), where("fromUserId", "==", currentUserId));
    const sentSnap = await getDocs(sentQuery);
    const sentData = sentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request));
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

  // 받은 요청 처리 → 수락/거절
  const handleReceivedAction = async (reqId: string, action: "rejected" | "matched") => {
    await updateDoc(doc(db, "requests", reqId), { status: action });

    // ✅ 로컬 상태 즉시 업데이트 → UI 바로 반영
    setReceivedRequests(prev =>
      prev.map(req => (req.id === reqId ? { ...req, status: action } : req))
    );
  };

  // 요청 취소
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

  // ✅ 채팅 연결 버튼
  const handleStartChat = async (req: Request) => {
    if (!currentUserId) return;

    const userA = req.fromUserId;
    const userB = req.toUserId;

    try {
      // 1️⃣ 이미 두 사람이 포함된 방이 있는지 확인
      const q = query(collection(db, "chatRooms"), where("participants", "array-contains", currentUserId));
      const snapshot = await getDocs(q);

      let existingRoomId: string | null = null;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(userA) && data.participants.includes(userB)) {
          existingRoomId = doc.id;
        }
      });

      // 2️⃣ 이미 존재하면 해당 방으로 이동
      if (existingRoomId) {
        router.push(`/pages/chat/${existingRoomId}`);
        return;
      }

      // 3️⃣ 없으면 새 방 생성
      const newRoom = {
        participants: [userA, userB],
        lastMessage: "",
        lastUpdated: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "chatRooms"), newRoom);
      console.log("✅ 새 채팅방 생성:", docRef.id);

      // 4️⃣ chatlist로 이동 (방이 생겼으므로 목록에 자동 반영)
      router.push("/pages/chatlist");
    } catch (error) {
      console.error("❌ 채팅방 생성 오류:", error);
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
        >
          받은 요청
        </button>
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
        >
          보낸 요청
        </button>
      </div>

      {/* 받은 요청 */}
      {activeTab === "received" &&
        (receivedRequests.length ? (
          receivedRequests.map((req) => {
            const sender = usersMap[req.fromUserId];
            return (
              <div
                key={req.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <p><strong>글 제목:</strong> {postsMap[req.postId]?.title || req.postId}</p>
                <p><strong>보낸 사람:</strong> {sender?.name || req.fromUserId}</p>

                {sender && (
                  <>
                    <p><strong>위치:</strong> {sender.location || "비공개"}</p>
                    <p><strong>MBTI:</strong> {sender.mbti || "비공개"}</p>
                  </>
                )}

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {req.status === "pending" ? (
                    <>
                      <button
                        style={{
                          backgroundColor: "#0275d8",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          padding: "0.25rem 0.5rem",
                          cursor: "pointer",
                        }}
                        onClick={() => handleReceivedAction(req.id, "matched")}
                      >
                        수락
                      </button>
                      <button
                        style={{
                          backgroundColor: "#d9534f",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          padding: "0.25rem 0.5rem",
                          cursor: "pointer",
                        }}
                        onClick={() => handleReceivedAction(req.id, "rejected")}
                      >
                        거절
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{ color: "#0275d8", fontWeight: "bold" }}>매치 완료</span>
                      <button
                        style={{
                          backgroundColor: "#4f46e5",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          padding: "0.25rem 0.5rem",
                          cursor: "pointer",
                        }}
                        onClick={() => handleStartChat(req)}
                      >
                        채팅으로 이동
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p>받은 요청이 없습니다.</p>
        ))}

      {/* 보낸 요청 */}
      {activeTab === "sent" &&
        (sentRequests.length ? (
          sentRequests.map((req) => (
            <div
              key={req.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <p><strong>글 제목:</strong> {postsMap[req.postId]?.title || req.postId}</p>
              <p>
                <strong>상태:</strong>{" "}
                <span style={{ color: getStatusColor(req.status) }}>
                  {req.status === "pending"
                    ? "대기중"
                    : req.status === "matched"
                    ? "매칭완료"
                    : "거절됨"}
                </span>
              </p>
              {req.status === "pending" && (
                <button
                  style={{
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    padding: "0.25rem 0.5rem",
                    cursor: "pointer",
                    marginTop: "0.5rem",
                  }}
                  onClick={() => handleCancelRequest(req.id)}
                >
                  요청 취소
                </button>
              )}
            </div>
          ))
        ) : (
          <p>보낸 요청이 없습니다.</p>
        ))}
    </div>
  );
}