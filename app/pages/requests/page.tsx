"use client";
import { useEffect, useState } from "react";
import {
  collection, query, where, getDocs, updateDoc, doc, getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
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

type Post = { title: string; authorId?: string };
type User = { name?: string };

export default function RequestsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [received, setReceived] = useState<RequestDoc[]>([]);
  const [sent, setSent] = useState<RequestDoc[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [postsMap, setPostsMap] = useState<Record<string, Post>>({});
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  const fetchRequests = async (me: string) => {
    const qRecv = query(collection(db, "requests"), where("toUserId", "==", me));
    const recvSnap = await getDocs(qRecv);
    const recv = recvSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as RequestDoc[];
    setReceived(recv);

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

  useEffect(() => { if (uid) fetchRequests(uid); }, [uid]);

  const act = async (reqId: string, action: "rejected" | "matched") => {
    await updateDoc(doc(db, "requests", reqId), { status: action });
    if (uid) fetchRequests(uid);
  };

  const statusColor = (s: RequestDoc["status"]) =>
    s === "pending" ? "#f0ad4e" : s === "rejected" ? "#d9534f" : "#0275d8";

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
      {activeTab === "received" && (
        received.length ? received.map((r) => (
          <div key={r.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0 }}>글 제목: {postsMap[r.postId]?.title || r.postId}</p>
              <p style={{ margin: 0 }}>보낸 사람: {usersMap[r.fromUserId]?.name || r.fromUserId}</p>
              <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
                {r.district ? `지역: ${r.district} ` : ""}
                {r.expectedCost ? `· 예상비용: ${r.expectedCost}` : ""}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => act(r.id, "matched")} style={{ background: "#0275d8", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>수락</button>
              <button onClick={() => act(r.id, "rejected")} style={{ background: "#d9534f", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>거절</button>
            </div>
          </div>
        )) : <p>받은 요청이 없습니다.</p>
      )}

      {/* 보낸 요청 */}
      {activeTab === "sent" && (
        sent.length ? sent.map((r) => (
          <div key={r.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0 }}>글 제목: {postsMap[r.postId]?.title || r.postId}</p>
              <p style={{ margin: 0 }}>상태: <span style={{ color: statusColor(r.status) }}>{r.status}</span></p>
              <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
                {r.district ? `지역: ${r.district} ` : ""}
                {r.expectedCost ? `· 예상비용: ${r.expectedCost}` : ""}
              </p>
            </div>
          </div>
        )) : <p>보낸 요청이 없습니다.</p>
      )}
    </div>
  );
}
