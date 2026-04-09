import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";

// ── 아이콘 ────────────────────────────────────────────────────
const IconPencil = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);
const IconKey = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);
const IconLogout = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const IconDots = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

// ── 메뉴 항목 ─────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "attendance",  label: "출석부"   },
  { id: "assignments", label: "과제관리" },
  { id: "progress",    label: "반별진도" },
  { id: "schedule",    label: "시간표"   },
  { id: "curriculum",  label: "커리큘럼" },
  { id: "reports",     label: "리포트"   },
  { id: "students",    label: "학생목록" },
  { id: "memo",        label: "메모장"   },
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

  const inputCls =
    "w-full px-4 py-2.5 border border-[#E3DED8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] text-sm bg-white";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4">
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

// ── 상단 네비게이션 바 ────────────────────────────────────────
export default function Navbar() {
  const { currentPage, setCurrentPage, logout, setSelectedStudent } = useApp();
  const [showPwModal, setShowPwModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const activeRef = useRef();
  const navRef = useRef();

  // 활성 탭이 보이도록 스크롤
  useEffect(() => {
    if (activeRef.current && navRef.current) {
      activeRef.current.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  }, [currentPage]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleNav = (id) => {
    setCurrentPage(id);
    if (id !== "assignments") setSelectedStudent(null);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#EDEAE5] border-b border-[#E3DED8] shadow-sm">
        <div className="flex items-center h-13 min-h-[52px]">

          {/* ── 로고 (왼쪽 고정) ── */}
          <div className="flex items-center gap-2 shrink-0 pl-3 pr-2 border-r border-[#E3DED8] self-stretch">
            <div className="w-7 h-7 bg-[#2BAE9A] rounded-lg flex items-center justify-center text-white shrink-0">
              <IconPencil />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="font-bold text-gray-800 text-xs whitespace-nowrap">지혜의숲-독서논술</p>
              <p className="text-gray-500 text-[10px]">학원 관리</p>
            </div>
            <p className="sm:hidden font-bold text-gray-800 text-xs whitespace-nowrap">지혜의숲</p>
          </div>

          {/* ── 가로 스크롤 탭 네비 ── */}
          <nav
            ref={navRef}
            className="flex-1 flex items-center overflow-x-auto h-full"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
            {NAV_ITEMS.map(({ id, label }) => {
              const isActive = currentPage === id;
              return (
                <button
                  key={id}
                  ref={isActive ? activeRef : null}
                  onClick={() => handleNav(id)}
                  className={`
                    relative flex items-center justify-center h-full px-3.5 shrink-0
                    text-sm font-medium whitespace-nowrap transition-colors
                    ${isActive
                      ? "text-[#1a8a78]"
                      : "text-gray-500 hover:text-gray-800 hover:bg-white/40"
                    }
                  `}
                >
                  {label}
                  {/* 활성 탭 하단 인디케이터 */}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#2BAE9A]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── 우측 더보기 버튼 (비번/로그아웃) ── */}
          <div className="shrink-0 pr-2 pl-1 border-l border-[#E3DED8] self-stretch flex items-center" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className={`p-2 rounded-lg transition ${
                dropdownOpen ? "bg-white text-gray-700" : "text-gray-500 hover:bg-white/60"
              }`}
              aria-label="더보기"
            >
              <IconDots />
            </button>

            {/* 드롭다운 */}
            {dropdownOpen && (
              <div className="absolute right-2 top-[52px] bg-white rounded-2xl shadow-xl border border-[#E3DED8] py-1.5 w-44 z-50">
                <button
                  onClick={() => { setShowPwModal(true); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-[#F5F3F0] transition"
                >
                  <IconKey />
                  비밀번호 변경
                </button>
                <div className="my-1 border-t border-[#F0EDE9]" />
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
                >
                  <IconLogout />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
    </>
  );
}
