"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaMapMarkedAlt, FaClipboardList, FaHome, FaComments, FaUser } from "react-icons/fa";
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function BottomNav() {
  const pathname = usePathname();
  const [unreadTotal, setUnreadTotal] = useState(0);
  const currentUserId = auth.currentUser?.uid;

  // 🔹 안읽은 메시지 합산
  useEffect(() => {
    if (!currentUserId) return;

    const q = query(
      collection(db, "chatRooms"),
      where("participants", "array-contains", currentUserId)
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      let total = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        total += data.unreadCount?.[currentUserId] ?? 0;
      });
      setUnreadTotal(total);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const menus = [
    { name: "지도", path: "/pages/map", icon: <FaMapMarkedAlt /> },
    { name: "요청란", path: "/pages/requests", icon: <FaClipboardList /> },
    { name: "홈", path: "/pages/matches", icon: <FaHome /> },
    { name: "채팅", path: "/pages/chatlist", icon: <FaComments />, badge: unreadTotal },
    { name: "마이페이지", path: "/pages/mypage", icon: <FaUser /> },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 10,
        left: 10,
        right: 10,
        height: "70px",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        padding: "0 10px",
        zIndex: 100,
      }}
    >
      {menus.map((menu) => {
        const isActive = pathname === menu.path;
        return (
          <Link
            key={menu.path}
            href={menu.path}
            style={{
              flex: 1,
              textAlign: "center",
              color: isActive ? "#4da6ff" : "#888888",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: isActive ? "bold" : "500",
              transition: "all 0.2s",
              position: "relative", // 🔹 배지 위치 기준
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "2px", position: "relative" }}>
              {menu.icon}
              {/* 🔹 채팅 배지 */}
              {(menu.badge ?? 0) > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -10,
                    backgroundColor: "red",
                    color: "white",
                    borderRadius: "50%",
                    padding: "2px 6px",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                  }}
                >
                  {menu.badge}
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.85rem" }}>{menu.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
