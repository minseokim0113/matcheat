"use client";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";

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
  name?: string;
  location?: string;
  mbti?: string;
};

export default function RequestsPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [received, setReceived] = useState<RequestDoc[]>([]);
  const [sent, setSent] = useState<RequestDoc[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

  const [postsMap, setPostsMap] = useState<Record<string, Post>>({});
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});

  const [loading, setLoading] = useState(false);

  // 로그인 상태 구독
  useEffect(() => {
    setCurrentUserId(auth.currentUser?.uid ?? null);
    const unsub = auth.onAuthStateChanged((u) => {
      setCurrentUserId(u ? u.uid : null);
    });
    return () => unsub();
  }, []);

  // 요청/참조 데이터 로드
  const fetchRequests = async () => {
    if (!currentUserId) {
      setReceived([]);
      setSent([]);
      setPostsMap({});
      setUsersMap({});
      return;
    }

    setLoading(true);
    try {
      // 받은 요청
      const qReceived = query(
        collection(db, "requests"),
        where("toUserId", "==", currentUserId)
      );
      const rSnap = await getDocs(qReceived);
      const recv: RequestDoc[] = rSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      // 보낸 요청
      const qSent = query(
        collection(db, "requests"),
        where("fromUserId", "==", currentUserId)
      );
      const sSnap = await getDocs(qSent);
      const snt: RequestDoc[] = sSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      setReceived(recv);
      setSent(snt);

      // 참조: posts
      const postIds = Array.from(new Set([...recv, ...snt].map((r) => r.postId)));
      const posts: Record<string, Post> = {};
      await Promise.all(
        postIds.map(async (pid) => {
          try {
            const pd = await getDoc(doc(db, "posts", pid));
            if (pd.exists()) posts[pid] = pd.data() as Post;
          } catch {
            /* ignore */
          }
        })
      );
      setPostsMap(posts);

      // 참조: users
      const userIds = Array.from(
        new Set([...recv, ...snt].flatMap((r) => [r.fromUserId, r.toUserId]))
      );
      const users: Record<string, User> = {};
      await Promise.all(
        userIds.map(async (uid) => {
          try {
            const ud = await getDoc(doc(db, "users", uid));
            if (ud.exists()) users[uid] = ud.data() as User;
          } catch {
            /* ignore */
          }
        })
      );
      setUsersMap(users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // 받은 요청 수락/거절
  const handleReceivedAction = async (
    reqId: string,
    action: "rejected" | "matched"
  ) => {
    await updateDoc(doc(db, "requests", reqId), { status: action });
    fetchRequests();
  };

  // 보낸 요청 취소
  const handleCancelRequest = async (reqId: string) => {
    if (!confirm("요청을 취소하시겠습니까?")) return;
    await deleteDoc(doc(db, "requests", reqId));
    fetchRequests();
  };

  const getStatusColor = (status: RequestDoc["status"]) => {
    switch (status) {
      case "pending":
        return "#f0ad4e";
      case "rejected":
        return "#d9534f";
      case "matched":
        return "#0275d8";
      default:
        return "#ccc";
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      {/* 탭 */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <button
          onClick={() => setActiveTab("received")}
          style={{
            padding: "0.5rem 1rem",
            borderBottom:
              activeTab === "received"
                ? "2px solid #003366"
                : "2px solid transparent",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: activeTab === "received" ? "bold" : "normal",
          }}
        >
          받은 요청
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          style={{
            padding: "0.5rem 1rem",
            borderBottom:
              activeTab === "sent"
                ? "2px solid #003366"
                : "2px solid transparent",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: activeTab === "sent" ? "bold" : "normal",
          }}
        >
          보낸 요청
        </button>
      </div>

      {loading && <p>불러오는 중…</p>}

      {/* 받은 요청 */}
      {activeTab === "received" && !loading && (
        <>
          {received.length ? (
            received.map((req) => {
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
                    <strong>글 제목:</strong>{" "}
                    {postsMap[req.postId]?.title || req.postId}
                  </p>
                  <p style={{ margin: "0.25rem 0" }}>
                    <strong>보낸 사람:</strong>{" "}
                    {sender?.name || req.fromUserId}
                  </p>

                  {/* 요청자 상세 */}
                  {sender && (
                    <>
                      <p style={{ margin: "0.25rem 0" }}>
                        <strong>위치:</strong>{" "}
                        {sender.location || "비공개"}
                      </p>
                      <p style={{ margin: "0.25rem 0" }}>
                        <strong>MBTI:</strong> {sender.mbti || "비공개"}
                      </p>
                    </>
                  )}

                  {/* 수락/거절 */}
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <button
                      style={{
                        backgroundColor: "#0275d8",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        padding: "0.25rem 0.5rem",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        handleReceivedAction(req.id, "matched")
                      }
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
                      onClick={() =>
                        handleReceivedAction(req.id, "rejected")
                      }
                    >
                      거절
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p>받은 요청이 없습니다.</p>
          )}
        </>
      )}

      {/* 보낸 요청 */}
      {activeTab === "sent" && !loading && (
        <>
          {sent.length ? (
            sent.map((req) => (
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
                  <strong>글 제목:</strong>{" "}
                  {postsMap[req.postId]?.title || req.postId}
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

                {/* 요청 취소 */}
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
          )}
        </>
      )}
    </div>
  );
}
