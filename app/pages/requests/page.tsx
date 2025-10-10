"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore"; // ✅ deleteDoc 추가
import { db } from "../../../firebase";

type RequestDoc = {
  id: string;
  postId: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "rejected" | "matched";
  expectedCost?: string | null;
  district?: string | null;
};

type Post = {
  title: string;
  authorId: string;
};

type User = {
  name: string;
  location?: string;  // ✅ 위치 정보 추가
  mbti?: string;      // ✅ MBTI 정보 추가
};

export default function RequestsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [received, setReceived] = useState<RequestDoc[]>([]);
  const [sent, setSent] = useState<RequestDoc[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [postsMap, setPostsMap] = useState<Record<string, Post>>({});
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});

  const fetchRequests = async () => {
    //if (!currentUserId) return; // ✅ fetchRequests() 안 확정x
    // 받은 요청
    const receivedQuery = query(collection(db, "requests"), where("toUserId", "==", currentUserId));
    const receivedSnap = await getDocs(receivedQuery);
    const receivedData = receivedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request));
    setReceivedRequests(receivedData);

    const qSent = query(collection(db, "requests"), where("fromUserId", "==", me));
    const sentSnap = await getDocs(qSent);
    const snt = sentSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as RequestDoc[];
    setSent(snt);

    const postIds = Array.from(new Set([...recv, ...snt].map((r) => r.postId)));
    const userIds = Array.from(new Set([...recv, ...snt].flatMap((r) => [r.fromUserId, r.toUserId])));

    const posts: Record<string, Post> = {};
    for (const pid of postIds) {
      const pd = await getDoc(doc(db, "posts", pid));
      if (pd.exists()) posts[pid] = pd.data() as Post;
    }
    setPostsMap(posts);

    const users: Record<string, User> = {};
    for (const id of userIds) {
      const ud = await getDoc(doc(db, "users", id));
      if (ud.exists()) users[id] = ud.data() as User;
    }
    setUsersMap(users);
  };

  useEffect(() => {
    //if (!currentUserId) return; // ✅ 확정x
    fetchRequests();
  }, [currentUserId]);

  // 받은 요청 → 수락 / 거절
  const handleReceivedAction = async (reqId: string, action: "rejected" | "matched") => {
    await updateDoc(doc(db, "requests", reqId), { status: action });
    if (uid) fetchRequests(uid);
  };

  // ✅ 보낸 요청 → 요청 취소
  const handleCancelRequest = async (reqId: string) => {
    if (confirm("요청을 취소하시겠습니까?")) {
      await deleteDoc(doc(db, "requests", reqId));
      fetchRequests();
    }
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
          onClick={() => setActiveTab("received")}
          style={{ padding: "0.5rem 1rem", borderBottom: activeTab === "received" ? "2px solid #003366" : "2px solid transparent", background: "none", border: "none", cursor: "pointer", fontWeight: activeTab === "received" ? "bold" : "normal" }}
        >
          받은 요청
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          style={{ padding: "0.5rem 1rem", borderBottom: activeTab === "sent" ? "2px solid #003366" : "2px solid transparent", background: "none", border: "none", cursor: "pointer", fontWeight: activeTab === "sent" ? "bold" : "normal" }}
        >
          보낸 요청
        </button>
      </div>

      {/* 받은 요청 */}
      {activeTab === "received" &&
        (receivedRequests.length ? (
          receivedRequests.map(req => {
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
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>글 제목:</strong> {postsMap[req.postId]?.title || req.postId}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>보낸 사람:</strong> {sender?.name || req.fromUserId}
                </p>

                {/* ✅ 요청자 상세 정보 표시 */}
                {sender && (
                  <>
                    <p style={{ margin: "0.25rem 0" }}>
                      <strong>위치:</strong> {sender.location || "비공개"}
                    </p>
                    <p style={{ margin: "0.25rem 0" }}>
                      <strong>MBTI:</strong> {sender.mbti || "비공개"}
                    </p>
                  </>
                )}

                {/* 수락/거절 버튼 */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
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
          sentRequests.map(req => (
            <div
              key={req.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <p style={{ margin: "0.25rem 0" }}>
                <strong>글 제목:</strong> {postsMap[req.postId]?.title || req.postId}
              </p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>상태:</strong>{" "}
                <span style={{ color: getStatusColor(req.status) }}>
                  {req.status === "pending"
                    ? "대기중"
                    : req.status === "matched"
                    ? "매칭완료"
                    : "거절됨"}
                </span>
              </p>

              {/* ✅ 요청 취소 버튼 */}
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
          </div>
        )) : <p>보낸 요청이 없습니다.</p>
      )}
    </div>
  );
}
