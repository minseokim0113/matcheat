import BottomNav from "../components/bottomNav";
import Link from "next/link";


export default function AppLayout({ children }) {
  return (
    <div style={{ paddingBottom: "100px", backgroundColor: "#f0f8ff", minHeight: "100vh" }}>
      
      {/* 상단 헤더 */}
      <header
        style={{
          position: "fixed", // 스크롤에도 항상 보이도록 고정
          top: 0,
          left: 0,
          right: 0,
          height: "80px", // 기존보다 줄인 높이
          background: "linear-gradient(90deg, #4da6ff, #80c1ff)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          borderBottomLeftRadius: "20px",
          borderBottomRightRadius: "20px",
          textAlign: "center",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          zIndex: 1000, // 다른 요소 위로 표시
          padding: "0.5rem 0",
        }}
      >
        <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0 }}>🍚 밥친구</h1>
        <p style={{ fontSize: "0.8rem", marginTop: "2px", fontWeight: "500" }}>
          오늘 같이 밥 먹을 친구를 찾아보세요!
        </p>
      </header>

      {/* 페이지 내용 */}
      <main style={{ marginTop: "80px" }}>{children}</main> 
      {/* marginTop으로 고정 헤더 공간 확보 */}

      {/*채팅*/}
      <Link href="/chat">채팅</Link>

      {/* 하단 메뉴바 */}
      <BottomNav />
    </div>
  );
}

