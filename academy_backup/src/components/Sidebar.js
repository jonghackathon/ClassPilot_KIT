import React, { useState } from "react";
import { useApp } from "../context/AppContext";

// ── SVG 라인 아이콘 ───────────────────────────────────────────
const IconUsers = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const IconClipboard = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const IconCheck = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const IconCalendar = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconBook = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const IconBarChart = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const IconReport = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconNote = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const IconKey = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const IconLogout = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const IconPencil = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

// ── 네비게이션 항목 ───────────────────────────────────────────
const NAV_ITEMS = [
  { id: "students",    label: "학생 목록",     Icon: IconUsers },
  { id: "assignments", label: "과제 관리",     Icon: IconClipboard },
  { id: "attendance",  label: "출석부",        Icon: IconCheck },
  { id: "schedule",    label: "시간표",        Icon: IconCalendar },
  { id: "curriculum",  label: "커리큘럼",      Icon: IconBook },
  { id: "progress",    label: "반별 진도 현황", Icon: IconBarChart },
  { id: "reports",     label: "월별 리포트",   Icon: IconReport },
  { id: "memo",        label: "메모장",        Icon: IconNote },
];

// ── 비밀번호 변경 모달 ─────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const { changePassword } = useApp();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (next.length < 4) { setError("새 비밀번호는 4자 이상이어야 합니다."); return; }
    if (next !== confirm) { setError("새 비밀번호가 일치하지 않습니다."); return; }
    const ok = await changePassword(current, next);
    if (!ok) { setError("현재 비밀번호가 올바르지 않습니다."); return; }
    setSuccess(true);
    setTimeout(onClose, 1200);
  };

  const inputCls = "w-full px-4 py-2.5 border border-[#E3DED8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] text-sm bg-white";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-6">비밀번호 변경</h2>
        {success ? (
          <p className="text-center text-[#2BAE9A] font-medium py-4">비밀번호가 변경되었습니다!</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">현재 비밀번호</label>
              <input type="password" value={current}
                onChange={(e) => { setCurrent(e.target.value); setError(""); }}
                className={inputCls} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">새 비밀번호</label>
              <input type="password" value={next}
                onChange={(e) => { setNext(e.target.value); setError(""); }}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">새 비밀번호 확인</label>
              <input type="password" value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                className={inputCls} />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-[#E3DED8] rounded-xl text-sm text-gray-600 hover:bg-[#F5F3F0] transition">
                취소
              </button>
              <button type="submit" disabled={!current || !next || !confirm}
                className="flex-1 py-2.5 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-teal-200 text-white rounded-xl text-sm font-semibold transition">
                변경하기
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const IconX = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── 사이드바 메인 ─────────────────────────────────────────────
export default function Sidebar({ isOpen, onClose }) {
  const { currentPage, setCurrentPage, logout, setSelectedStudent } = useApp();
  const [showPwModal, setShowPwModal] = useState(false);

  const handleNav = (id) => {
    setCurrentPage(id);
    if (id !== "assignments") setSelectedStudent(null);
    onClose(); // 모바일에서 메뉴 선택 시 사이드바 닫기
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-64
        md:static md:inset-auto md:w-56 md:min-h-screen md:translate-x-0 md:shrink-0
        bg-[#EDEAE5] border-r border-[#E3DED8] flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* 로고 */}
      <div className="px-6 py-5 border-b border-[#E3DED8] relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#2BAE9A] rounded-xl flex items-center justify-center text-white shrink-0">
            <IconPencil className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm leading-tight">지혜의숲-독서논술</p>
            <p className="text-gray-500 text-xs">학원 관리</p>
          </div>
        </div>
        {/* 모바일 닫기 버튼 */}
        <button
          onClick={onClose}
          className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:bg-white/60 transition"
          aria-label="메뉴 닫기"
        >
          <IconX className="w-5 h-5" />
        </button>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-white text-[#1a8a78] shadow-sm"
                  : "text-gray-600 hover:bg-white/60"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#2BAE9A]" : "text-gray-500"}`} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* 하단 액션 */}
      <div className="p-4 border-t border-[#E3DED8] space-y-0.5">
        <button
          onClick={() => setShowPwModal(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-white/60 transition"
        >
          <IconKey className="w-4 h-4 shrink-0" />
          비밀번호 변경
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
        >
          <IconLogout className="w-4 h-4 shrink-0" />
          로그아웃
        </button>
      </div>

      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
    </aside>
  );
}
