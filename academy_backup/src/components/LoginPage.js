import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export default function LoginPage() {
  const { login } = useApp();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const ok = login(password);
      if (!ok) {
        setError("비밀번호가 올바르지 않습니다.");
        setPassword("");
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md border border-[#E3DED8] p-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#eef9f7] rounded-2xl mb-4">
            <svg className="w-8 h-8 text-[#2BAE9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">지혜의숲-독서논술</h1>
          <p className="text-gray-500 text-sm mt-1">선생님 관리 시스템</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 border border-[#E3DED8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] focus:border-transparent transition bg-white"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-teal-200 text-white font-semibold rounded-xl transition"
          >
            {loading ? "확인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
