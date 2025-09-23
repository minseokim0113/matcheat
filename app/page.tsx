import { getServerSession } from "next-auth";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">MatchEats (웹 MVP)</h1>
      {session ? (
        <div className="border rounded-2xl p-4">
          <p>안녕하세요, {session.user?.email}</p>
          <div className="mt-2">
            <Link className="border rounded-2xl px-3 py-2" href="/onboarding">온보딩</Link>
            <span> </span>
            <Link className="border rounded-2xl px-3 py-2" href="/discover">추천 보러가기</Link>
          </div>
        </div>
      ) : (
        <div className="border rounded-2xl p-4">
          <p>로그인이 필요합니다.</p>
          <Link className="border rounded-2xl px-3 py-2" href="/signin">로그인</Link>
        </div>
      )}
    </div>
  )
}
