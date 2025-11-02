// lib/reviewRepo.ts
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase"; // ✅ Firebase 연결

// ===== 리뷰 타입 정의 =====
export type ReviewDoc = {
  id?: string;
  placeId: string;
  author: string;
  text: string;
  rating?: number;
  createdAt?: any;
  authorId?: string; // ✅ 로그인 사용자 UID (보안 규칙 검증용)
};

// ===== 리뷰 실시간 구독 =====
export function listenReviews(
  placeId: string,
  cb: (rows: ReviewDoc[]) => void
) {
  if (!placeId) return () => {}; // placeId 없으면 구독하지 않음

  try {
    const q = query(
      collection(db, "reviews"),
      where("placeId", "==", String(placeId)), // ✅ 문자열 변환
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      console.log("📡 리뷰 스냅샷 수:", snap.size); // 디버그용
      const rows = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as ReviewDoc) })
      );
      cb(rows);
    });
  } catch (err) {
    console.error("listenReviews 오류:", err);
    return () => {};
  }
}

// ===== 리뷰 추가 =====
export async function addReviewDoc(
  input: Omit<ReviewDoc, "id" | "createdAt" | "authorId">
) {
  try {
    const user = auth.currentUser; // ✅ 로그인 사용자 확인
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!input.placeId) {
      console.error("addReviewDoc: placeId 누락");
      return;
    }

    if (!input.text?.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    // Firestore에 리뷰 추가
    await addDoc(collection(db, "reviews"), {
      ...input,
      placeId: String(input.placeId), // ✅ 항상 문자열로 변환
      authorId: user.uid, // ✅ Firebase UID 저장
      createdAt: serverTimestamp(), // ✅ 서버 기준 시각
    });

    console.log("✅ 리뷰 등록 성공:", input);
    alert("리뷰가 등록되었습니다!");
  } catch (err) {
    console.error("❌ 리뷰 등록 실패:", err);
    alert("리뷰 등록 중 오류가 발생했습니다.");
  }
}
