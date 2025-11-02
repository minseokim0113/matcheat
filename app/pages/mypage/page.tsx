"use client";
import { useRouter } from "next/navigation";
import {
  auth,
  db
} from "../../../firebase";
import {
  User,
  onAuthStateChanged,
  signOut,
  deleteUser,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [userData, setUserData] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let unsubUserData: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        unsubUserData = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) setUserData(snapshot.data());
        });
      } else {
        router.replace("/sign/signin");
      }
    });
    return () => {
      unsubAuth();
      if (unsubUserData) unsubUserData();
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("로그아웃 되었습니다!");
      router.replace("/sign/signin");
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  };

  const deleteDocs = async (paths: { col: string; id: string }[]) => {
    await Promise.all(paths.map(({ col, id }) => deleteDoc(doc(db, col, id))));
  };

  const deletePostWithSubs = async (postId: string) => {
    const participantsCol = collection(db, "posts", postId, "participants");
    const participantsSnap = await getDocs(participantsCol);
    await Promise.all(participantsSnap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, "posts", postId));
  };

  const chunk = <T,>(arr: T[], size = 10) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );

  const handleDeleteAccount = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      router.replace("/sign/signin");
      return;
    }
    if (deleting) return;

    const ok = confirm("정말 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.");
    if (!ok) return;

    setDeleting(true);
    try {
      const uid = user.uid;
      const myPostsQ = query(collection(db, "posts"), where("authorId", "==", uid));
      const myPostsSnap = await getDocs(myPostsQ);
      const myPostIds = myPostsSnap.docs.map((d) => d.id);

      const mySentReqQ = query(collection(db, "requests"), where("fromUserId", "==", uid));
      const mySentReqSnap = await getDocs(mySentReqQ);
      const mySentReqRefs = mySentReqSnap.docs.map((d) => ({ col: "requests", id: d.id }));
      await deleteDocs(mySentReqRefs);

      if (myPostIds.length > 0) {
        const chunks = chunk(myPostIds, 10);
        for (const ids of chunks) {
          const reqQ = query(collection(db, "requests"), where("postId", "in", ids));
          const reqSnap = await getDocs(reqQ);
          const reqRefs = reqSnap.docs.map((d) => ({ col: "requests", id: d.id }));
          await deleteDocs(reqRefs);
        }
      }

      for (const postId of myPostIds) {
        await deletePostWithSubs(postId);
      }

      await deleteDoc(doc(db, "users", uid));
      await deleteUser(user);

      alert("탈퇴가 완료되었습니다.");
      router.replace("/sign/signin");
    } catch (e) {
      console.error("탈퇴 오류:", e);
      alert("탈퇴 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const getGradientByGender = (gender?: string, color?: string) => {
    if (color) return `linear-gradient(135deg, ${color}, ${color}CC)`;
    if (gender === "남성") return "linear-gradient(135deg, #60A5FA, #3B82F6)";
    if (gender === "여성") return "linear-gradient(135deg, #F472B6, #EC4899)";
    return "linear-gradient(135deg, #FF9B42, #FF7B00)";
  };

  return (
    <div className="mypage">
      <header className="mypage-header">👤 내 프로필</header>

      {/* 프로필 카드 */}
      <section className="mypage-card">
        <div
          className="mypage-avatar"
          style={{
            background: getGradientByGender(userData?.gender, userData?.profileColor),
          }}
        >
          {userData?.name?.charAt(0) || "U"}
        </div>

        <h3 className="mypage-name">{userData?.name || "사용자"}</h3>
        <p className="mypage-email">{user?.email || "이메일 정보 없음"}</p>

        <div className="mypage-bio">
          💬 {userData?.bio || "아직 자기소개를 작성하지 않았어요 🙂"}
        </div>

        <div className="mypage-info">
          <div>🧠 <strong>MBTI:</strong> {userData?.mbti || "비공개"}</div>
          <div>🎂 <strong>나이:</strong> {userData?.age || "비공개"}</div>
          <div>🚻 <strong>성별:</strong> {userData?.gender || "비공개"}</div>
        </div>
      </section>

      {/* 버튼 목록 */}
      <section className="mypage-buttons">
        {[
          { text: "✏️ 프로필 수정", color: "#FF9B42", link: "/pages/profile" },
          { text: "🔒 비밀번호 변경", color: "#FFB366", link: "/pages/changepassword" },
          { text: "🗂 내가 쓴 글", color: "#FFD27F", link: "/pages/posts" },
          { text: "🚪 로그아웃", color: "#60A5FA", action: handleLogout },
          {
            text: deleting ? "탈퇴 진행 중..." : "🧹 탈퇴(계정 및 데이터 삭제)",
            color: deleting ? "#9CA3AF" : "#EF4444",
            action: handleDeleteAccount,
          },
        ].map((btn, i) => (
          <button
            key={i}
            className="mypage-btn"
            style={{ background: btn.color }}
            onClick={() => btn.link ? router.push(btn.link) : btn.action?.()}
          >
            {btn.text}
          </button>
        ))}
      </section>

      <style jsx>{`
        .mypage {
          min-height: 100vh;
          background: #FFF8F1;
          font-family: 'Noto Sans KR', sans-serif;
          color: #3B2B1B;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-bottom: 6rem;
        }

        .mypage-header {
          position: sticky;
          top: 0;
          width: 100%;
          text-align: center;
          background: linear-gradient(90deg, #FF9B42, #FF7B00);
          color: #fff;
          font-weight: 800;
          font-size: 1.3rem;
          padding: 1rem;
          border-bottom-left-radius: 18px;
          border-bottom-right-radius: 18px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.15);
          z-index: 10;
        }

        .mypage-card {
          margin-top: 2rem;
          background: #FFFDF9;
          border-radius: 22px;
          box-shadow: 0 8px 18px rgba(255,155,66,0.15);
          padding: 2rem 1.5rem;
          width: 90%;
          max-width: 420px;
          text-align: center;
          border: 2px solid #FFE7D0;
          transition: all 0.25s ease;
        }

        .mypage-avatar {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          color: white;
          font-weight: bold;
          font-size: 24px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        }

        .mypage-name {
          font-size: 1.35rem;
          font-weight: 800;
          color: #2E1500;
          margin-bottom: 4px;
        }

        .mypage-email {
          font-size: 0.9rem;
          color: #7A5A3D;
          margin-bottom: 14px;
        }

        .mypage-bio {
          background: #FFF7EE;
          border-radius: 12px;
          border: 1px solid #FFE3C2;
          padding: 14px 16px;
          color: #5A3A1C;
          line-height: 1.6;
          font-size: 14px;
          margin-bottom: 1rem;
        }

        .mypage-info {
          display: flex;
          justify-content: space-between;
          background: #FFF3E0;
          border-radius: 12px;
          padding: 12px 16px;
          color: #4B2E05;
          font-size: 0.9rem;
          font-weight: 600;
          margin-top: 10px;
        }

        .mypage-buttons {
          width: 90%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 2.2rem;
        }

        .mypage-btn {
          color: white;
          font-weight: 700;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          transition: all 0.25s;
        }

        .mypage-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 14px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
