'use client';
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage(){
  const [email, setEmail] = useState('');
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full border rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">로그인 (이메일만)</h1>
        <input
          className="w-full border rounded p-2 mb-3"
          placeholder="demo1@example.com"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
        <button
          className="w-full rounded-2xl border px-4 py-2 font-medium"
          onClick={()=>signIn('credentials', { email, callbackUrl: '/' })}
        >로그인</button>
        <p className="text-sm text-gray-500 mt-3">데모용: 임의 이메일로 바로 로그인 됩니다.</p>
      </div>
    </div>
  );
}
