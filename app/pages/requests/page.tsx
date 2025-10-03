"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

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
};

export default function RequestsPage({ currentUserId }: { currentUserId: string }) {
  const [receivedRequests, setReceivedRequests] = useState<Request[]>([]);
  const [sentRequests, setSentRequests] = useState<Request[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [postsMap, setPostsMap] = useState<Record<string, Post>>({});
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});

  const fetchRequests = async () => {
    // 받은 요청
    const receivedQuery = query(collection(db, "requests"), where("toUserId", "==", currentUserId));
    const receivedSnap = await getDocs(receivedQuery);
    const receivedData = receivedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request));
    setReceivedRequests(receivedData);

    // 보낸 요청
    const sentQuery = query(collection(db, "requests"), where("fromUserId", "==", currentUserId));
    const sentSnap = await getDocs(sentQuery);
    const sentData = sentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request));
    setSentRequests(sentData);

    // 글 정보 가져오기
    const allPostIds = Array.from(new Set([...receivedData, ...sentData].map(r => r.postId)));
    const posts: Record<string, Post> = {};
    for (const postId of allPostIds) {
      const postDoc = await getDoc(doc(db, "posts", postId));
      if (postDoc.exists()) posts[postId] = postDoc.data() as Post;
    }
    setPostsMap(posts);

    // 사용자 정보 가져오기
    const userIds = Array.from(new Set([...receivedData, ...sentData].flatMap(r => [r.fromUserId, r.toUserId])));
    const users: Record<string, User> = {};
    for (const userId of userIds) {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) users[userId] = userDoc.data() as User;
    }
    setUsersMap(users);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReceivedAction = async (reqId: string, action: "rejected" | "matched") => {
    await updateDoc(doc(db, "requests", reqId), { status: action });
    fetchRequests();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#f0ad4e"; // 대기중
      case "rejected": return "#d9534f"; // 거절됨
      case "matched": return "#0275d8"; // 매칭완료
      default: return "#ccc";
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
          receivedRequests.map(req => (
            <div key={req.id} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "0.5rem", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0 }}>글 제목: {postsMap[req.postId]?.title || req.postId}</p>
                <p style={{ margin: 0 }}>보낸 사람: {usersMap[req.fromUserId]?.name || req.fromUserId}</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  style={{ backgroundColor: "#0275d8", color: "white", border: "none", borderRadius: "5px", padding: "0.25rem 0.5rem", cursor: "pointer" }}
                  onClick={() => handleReceivedAction(req.id, "matched")}
                >
                  수락
                </button>
                <button
                  style={{ backgroundColor: "#d9534f", color: "white", border: "none", borderRadius: "5px", padding: "0.25rem 0.5rem", cursor: "pointer" }}
                  onClick={() => handleReceivedAction(req.id, "rejected")}
                >
                  거절
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>받은 요청이 없습니다.</p>
        ))}

      {/* 보낸 요청 */}
      {activeTab === "sent" &&
        (sentRequests.length ? (
          sentRequests.map(req => (
            <div key={req.id} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "0.5rem", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0 }}>글 제목: {postsMap[req.postId]?.title || req.postId}</p>
                <p style={{ margin: 0 }}>상태: <span style={{ color: getStatusColor(req.status) }}>{req.status}</span></p>
              </div>
            </div>
          ))
        ) : (
          <p>보낸 요청이 없습니다.</p>
        ))}
    </div>
  );
}
