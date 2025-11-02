"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaMapMarkedAlt, FaClipboardList, FaHome, FaComments, FaUser } from "react-icons/fa";
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import {
  collection, query, where, onSnapshot
} from "firebase/firestore";

export default function BottomNav() {
  const pathname = usePathname();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => setCurrentUserId(user?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      setUnreadTotal(0);
      return;
    }
    const qRooms = query(
      collection(db, "chatRooms"),
      where("participants", "array-contains", currentUserId)
    );
    const unsub = onSnapshot(qRooms, (snap) => {
      let total = 0;
      snap.forEach((d) => {
        const data: any = d.data();
        const val = Number(data?.unreadCount?.[currentUserId] ?? 0);
        total += Number.isFinite(val) && val > 0 ? val : 0;
      });
      setUnreadTotal(total);
    });
    return () => unsub();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      setPendingCount(0);
      return;
    }
    const qReq = query(
      collection(db, "requests"),
      where("toUserId", "==", currentUserId),
      where("status", "==", "pending")
    );
    const unsub = onSnapshot(qReq, (snap) => setPendingCount(snap.size));
    return () => unsub();
  }, [currentUserId]);

  const menus = [
    { name: "지도", path: "/pages/map", icon: <FaMapMarkedAlt /> },
    { name: "요청란", path: "/pages/requests", icon: <FaClipboardList />, badge: pendingCount },
    { name: "홈", path: "/pages/matches", icon: <FaHome /> },
    { name: "채팅", path: "/pages/chatlist", icon: <FaComments />, badge: unreadTotal },
    { name: "마이페이지", path: "/pages/mypage", icon: <FaUser /> },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        right: 12,
        height: 70,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        // 🎨 밝은 크림톤으로 변경 (상단보다 연함)
        background: "linear-gradient(135deg, #FFE8C2, #FFF3E0)",
        borderRadius: 22,
        boxShadow: "0 6px 18px rgba(255, 155, 66, 0.25)",
        padding: "0 10px",
        zIndex: 100,
        backdropFilter: "blur(6px)",
      }}
    >
      {menus.map((m) => {
        const isActive = pathname === m.path;
        return (
          <Link
            key={m.path}
            href={m.path}
            style={{
              flex: 1,
              textAlign: "center",
              textDecoration: "none",
              color: isActive ? "#B64E00" : "#6B3A1E",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: isActive ? 800 : 600,
              transition: "all .25s",
              position: "relative",
              transform: isActive ? "scale(1.08)" : "scale(1)",
            }}
          >
            <div
              style={{
                fontSize: "1.6rem",
                marginBottom: 2,
                position: "relative",
                filter: isActive ? "drop-shadow(0 0 4px rgba(255,140,0,0.4))" : "none",
                transition: "0.2s",
              }}
            >
              {m.icon}
              {(m.badge ?? 0) > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -10,
                    background: "#ff4757",
                    color: "#fff",
                    borderRadius: "50%",
                    padding: "3px 7px",
                    fontSize: ".7rem",
                    fontWeight: 700,
                    minWidth: 18,
                    textAlign: "center",
                    lineHeight: 1,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                  }}
                >
                  {m.badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: ".85rem",
                textShadow: isActive ? "0 1px 4px rgba(255,155,66,0.3)" : "none",
              }}
            >
              {m.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
