import BottomNav from "../components/bottomNav";

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0f4ff", // 로그인 페이지처럼 연한 파란 배경
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: "60px", // 메뉴바 높이만큼 여백
      }}
    >
      {/* 메인 카드 */}
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          textAlign: "center",
          width: "90%",
          maxWidth: "500px",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#003366" }}>
          홈
        </h1>
        <p style={{ fontSize: "1rem", color: "#444" }}>
          밥친구에 오신 걸 환영합니다! <br />
          아래 메뉴에서 원하는 기능을 선택하세요.
        </p>
      </div>

      {/* 하단 메뉴바 */}
      <BottomNav />
    </div>
  );
}
