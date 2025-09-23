'use client';
import { useEffect, useState } from 'react';

type Candidate = { id:string; name:string|null; email:string; score:number; profile:any };

export default function Discover(){
  const [list, setList] = useState<Candidate[]>([]);
  const [info, setInfo] = useState<string>('');

  async function load(){
    const res = await fetch('/api/recommendations');
    const data = await res.json();
    setList(data.list || []);
  }
  useEffect(()=>{ load(); }, []);

  async function like(toUserId: string){
    await fetch('/api/like', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ toUserId }) });
    const r = await fetch('/api/match/ensure', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ otherUserId: toUserId }) });
    const data = await r.json();
    if (data.matched) setInfo(`매칭 성사! matchId=${data.matchId}`);
    else setInfo('좋아요 완료! (상대도 좋아요 하면 매칭됩니다)');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">추천 리스트</h1>
      {info && <p className="mb-3">{info}</p>}
      <div className="grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'1rem'}}>
        {list.map(c => (
          <div key={c.id} className="border rounded-2xl p-3">
            <div className="font-bold mb-1">{c.name || c.email}</div>
            <div className="text-sm mb-2">점수: {c.score}</div>
            <div className="text-sm mb-2">
              지역: {c.profile.region || '-'} / 예산: {c.profile.budgetMin ?? '-'}~{c.profile.budgetMax ?? '-'}
            </div>
            <button className="border rounded-2xl px-3 py-1" onClick={()=>like(c.id)}>좋아요</button>
          </div>
        ))}
      </div>
    </div>
  );
}
