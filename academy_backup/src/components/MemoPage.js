import React, { useState, useRef } from "react";
import { useApp } from "../context/AppContext";

const CATEGORIES = ["공지사항", "특이사항", "학생 메모", "기타"];

const CATEGORY_STYLES = {
  공지사항:   { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700",  dot: "bg-amber-400" },
  특이사항:   { bg: "bg-red-50",   border: "border-red-200",   badge: "bg-red-100 text-red-700",    dot: "bg-red-400" },
  "학생 메모": { bg: "bg-blue-50",  border: "border-blue-200",  badge: "bg-blue-100 text-blue-700",   dot: "bg-blue-400" },
  기타:       { bg: "bg-gray-50",  border: "border-gray-200",  badge: "bg-gray-100 text-gray-600",  dot: "bg-gray-400" },
};

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isRecent(memo) {
  if (memo.archived) return false;
  return Date.now() - new Date(memo.createdAt).getTime() < ONE_WEEK_MS;
}

function formatDate(isoStr) {
  const d = new Date(isoStr);
  const Y = d.getFullYear(), M = d.getMonth() + 1, D = d.getDate();
  const H = String(d.getHours()).padStart(2, "0"), Min = String(d.getMinutes()).padStart(2, "0");
  return `${Y}.${String(M).padStart(2,"0")}.${String(D).padStart(2,"0")} ${H}:${Min}`;
}

function formatDateShort(isoStr) {
  const d = new Date(isoStr);
  const M = d.getMonth() + 1, D = d.getDate();
  const H = String(d.getHours()).padStart(2, "0"), Min = String(d.getMinutes()).padStart(2, "0");
  return `${M}/${D} ${H}:${Min}`;
}

// ── 메모 작성/수정 모달 ────────────────────────────────────────
function MemoModal({ memo, onSave, onClose }) {
  const isEdit = !!memo;
  const [title, setTitle] = useState(memo?.title || "");
  const [content, setContent] = useState(memo?.content || "");
  const [category, setCategory] = useState(memo?.category || "기타");
  const contentRef = useRef();

  const canSave = title.trim() || content.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({ title: title.trim(), content: content.trim(), category });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E3DED8]">
          <h2 className="text-lg font-bold text-gray-800">{isEdit ? "메모 수정" : "새 메모"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const style = CATEGORY_STYLES[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      category === cat
                        ? `${style.badge} ring-2 ring-offset-1 ring-[#2BAE9A]`
                        : "bg-[#F5F3F0] text-gray-500 hover:bg-[#EDEAE5]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목 (선택)"
              autoFocus
              className="w-full px-3 py-2.5 border border-[#E3DED8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-[#F5F3F0]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="메모 내용을 자유롭게 입력하세요"
              rows={6}
              className="w-full px-3 py-2.5 border border-[#E3DED8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-[#F5F3F0] resize-none leading-relaxed"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#E3DED8] rounded-xl text-sm font-medium text-gray-600 hover:bg-[#F5F3F0] transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="flex-1 py-2.5 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-teal-200 text-white rounded-xl text-sm font-medium transition"
            >
              {isEdit ? "수정 완료" : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 메모 카드 ─────────────────────────────────────────────────
function MemoCard({ memo, onEdit, onDelete, onArchive, onUnarchive, showArchiveBtn }) {
  const style = CATEGORY_STYLES[memo.category] || CATEGORY_STYLES["기타"];
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition group ${style.bg} ${style.border}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`shrink-0 w-2 h-2 rounded-full ${style.dot}`} />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md shrink-0 ${style.badge}`}>
            {memo.category}
          </span>
          {memo.title && (
            <p className="text-sm font-bold text-gray-800 truncate">{memo.title}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => onEdit(memo)}
            className="p-1.5 rounded-lg hover:bg-white/80 text-gray-400 hover:text-gray-600 transition text-xs"
            title="수정"
          >
            ✏️
          </button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={() => onDelete(memo.id)}
                className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-medium"
              >
                삭제
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 rounded-lg bg-white/80 text-gray-500 text-xs"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg hover:bg-white/80 text-gray-400 hover:text-red-500 transition text-xs"
              title="삭제"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {memo.content && (
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mt-2">
          {memo.content}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 gap-2">
        <p className="text-xs text-gray-400">
          {memo.updatedAt !== memo.createdAt
            ? `수정 ${formatDateShort(memo.updatedAt)}`
            : formatDate(memo.createdAt)}
        </p>
        {showArchiveBtn && (
          <button
            onClick={() => onArchive(memo.id)}
            className="text-xs text-gray-400 hover:text-[#2BAE9A] transition px-2 py-1 rounded-lg hover:bg-white/70"
            title="보관하기"
          >
            보관하기 →
          </button>
        )}
        {memo.archived && onUnarchive && (
          <button
            onClick={() => onUnarchive(memo.id)}
            className="text-xs text-gray-400 hover:text-[#2BAE9A] transition px-2 py-1 rounded-lg hover:bg-white/70"
            title="메인으로 복원"
          >
            ← 복원
          </button>
        )}
      </div>
    </div>
  );
}

// ── 날짜 구분선 (보관함용) ─────────────────────────────────────
function DateDivider({ label }) {
  return (
    <div className="col-span-full flex items-center gap-3 mt-2 mb-1">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-[#E3DED8]" />
    </div>
  );
}

function getDateLabel(isoStr) {
  const d = new Date(isoStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// ── 메인 메모장 페이지 ────────────────────────────────────────
export default function MemoPage() {
  const { memos, addMemo, updateMemo, deleteMemo } = useApp();
  const [filterCategory, setFilterCategory] = useState("전체");
  const [showModal, setShowModal] = useState(false);
  const [editingMemo, setEditingMemo] = useState(null);
  const [search, setSearch] = useState("");
  const [viewArchive, setViewArchive] = useState(false);

  const handleSave = ({ title, content, category }) => {
    if (editingMemo) {
      updateMemo(editingMemo.id, { title, content, category });
    } else {
      addMemo({ title, content, category });
    }
    setShowModal(false);
    setEditingMemo(null);
  };

  const handleEdit = (memo) => { setEditingMemo(memo); setShowModal(true); };
  const handleDelete = (id) => deleteMemo(id);
  const handleClose = () => { setShowModal(false); setEditingMemo(null); };

  const handleArchive = (id) => {
    updateMemo(id, { archived: true });
  };
  const handleUnarchive = (id) => {
    const now = new Date().toISOString();
    updateMemo(id, { archived: false, createdAt: now });
  };

  // 메인: 1주일 이내 + 수동 미보관
  const recentMemos = memos.filter((m) => isRecent(m));
  // 보관함: 수동 보관 또는 1주일 초과
  const archivedMemos = memos
    .filter((m) => !isRecent(m))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const applyFilter = (list) =>
    list.filter((m) => {
      const matchCat = filterCategory === "전체" || m.category === filterCategory;
      const q = search.trim();
      const matchSearch = !q || m.title?.includes(q) || m.content?.includes(q);
      return matchCat && matchSearch;
    });

  const displayMemos = applyFilter(viewArchive ? archivedMemos : recentMemos);

  const countSource = viewArchive ? archivedMemos : recentMemos;
  const categoryCounts = countSource.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, { 전체: countSource.length });

  // 보관함: 날짜별 그룹
  const groupedArchive = (() => {
    const groups = [];
    let lastLabel = null;
    displayMemos.forEach((m) => {
      const label = getDateLabel(m.createdAt);
      if (label !== lastLabel) { groups.push({ type: "divider", label }); lastLabel = label; }
      groups.push({ type: "memo", memo: m });
    });
    return groups;
  })();

  return (
    <div className="flex-1 overflow-auto bg-[#F5F3F0]">
      <div className="p-4 md:p-6 lg:p-8">

        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl text-gray-800">
                {viewArchive ? "보관함" : "메모장"}
              </h1>
              {!viewArchive && archivedMemos.length > 0 && (
                <button
                  onClick={() => setViewArchive(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E3DED8] text-xs font-medium text-gray-600 hover:border-[#2BAE9A] hover:text-[#2BAE9A] transition"
                >
                  보관함
                  <span className="bg-gray-200 text-gray-600 text-xs rounded-full px-1.5 py-0.5 font-semibold">
                    {archivedMemos.length}
                  </span>
                </button>
              )}
              {viewArchive && (
                <button
                  onClick={() => setViewArchive(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E3DED8] text-xs font-medium text-gray-600 hover:border-[#2BAE9A] hover:text-[#2BAE9A] transition"
                >
                  ← 메인으로
                </button>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              {viewArchive
                ? `보관된 메모 ${archivedMemos.length}개`
                : "최근 1주일 메모가 표시됩니다"}
            </p>
          </div>
          {!viewArchive && (
            <button
              onClick={() => { setEditingMemo(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2BAE9A] hover:bg-[#249e8c] text-white rounded-xl text-sm font-medium transition shrink-0"
            >
              <span className="text-lg leading-none">+</span>
              새 메모 작성
            </button>
          )}
        </div>

        {/* 검색 + 필터 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="메모 검색..."
            className="flex-1 px-4 py-2.5 border border-[#E3DED8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-white"
          />
          <div className="flex flex-wrap gap-2">
            {["전체", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
                  filterCategory === cat
                    ? "bg-[#2BAE9A] text-white"
                    : "bg-white border border-[#E3DED8] text-gray-600 hover:border-[#2BAE9A]"
                }`}
              >
                {cat}
                {categoryCounts[cat] !== undefined && (
                  <span className={`ml-1 ${filterCategory === cat ? "opacity-80" : "opacity-50"}`}>
                    {categoryCounts[cat]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 메모 목록 */}
        {displayMemos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-5xl mb-4">{viewArchive ? "📦" : "📝"}</p>
            {viewArchive ? (
              <>
                <p className="text-base font-medium text-gray-500">보관된 메모가 없습니다</p>
                <p className="text-sm text-gray-400 mt-1">
                  1주일이 지난 메모나 직접 보관한 메모가 여기에 쌓입니다
                </p>
              </>
            ) : memos.length === 0 ? (
              <>
                <p className="text-lg font-semibold text-gray-600 mb-1">아직 메모가 없습니다</p>
                <p className="text-sm text-gray-400 mb-5">공지사항, 특이사항, 학생 메모를 자유롭게 작성해보세요</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-5 py-2.5 bg-[#2BAE9A] text-white rounded-xl text-sm font-medium hover:bg-[#249e8c] transition"
                >
                  첫 메모 작성하기
                </button>
              </>
            ) : (
              <>
                <p className="text-base font-medium text-gray-500">최근 1주일 메모가 없습니다</p>
                <p className="text-sm text-gray-400 mt-1">
                  지난 메모는 보관함에서 확인하세요
                </p>
                <button
                  onClick={() => setViewArchive(true)}
                  className="mt-4 px-4 py-2 bg-white border border-[#E3DED8] text-sm text-gray-600 rounded-xl hover:border-[#2BAE9A] hover:text-[#2BAE9A] transition"
                >
                  보관함 보기 ({archivedMemos.length})
                </button>
              </>
            )}
          </div>
        ) : viewArchive ? (
          /* 보관함: 날짜별 구분선 */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groupedArchive.map((item, i) =>
              item.type === "divider" ? (
                <DateDivider key={`div-${i}`} label={item.label} />
              ) : (
                <MemoCard
                  key={item.memo.id}
                  memo={item.memo}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onUnarchive={handleUnarchive}
                  showArchiveBtn={false}
                />
              )
            )}
          </div>
        ) : (
          /* 메인: 최근 메모 */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayMemos.map((memo) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onArchive={handleArchive}
                showArchiveBtn={true}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <MemoModal
          memo={editingMemo}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
