import React, { useState, useRef, useMemo } from "react";
import { useApp } from "../context/AppContext";

const DAYS = ["월", "화", "수", "목", "금", "토"];

const START_HOUR = 9;   // 09:00
const END_HOUR   = 22;  // 22:00
const TOTAL_HOURS = END_HOUR - START_HOUR;
const PX_PER_HOUR = 80; // px
const TOTAL_HEIGHT = TOTAL_HOURS * PX_PER_HOUR;

const COLOR_OPTIONS = [
  { key: "indigo", label: "인디고", block: "bg-[#2BAE9A] text-white",   header: "bg-teal-100 border-teal-300" },
  { key: "blue",   label: "블루",   block: "bg-blue-500 text-white",     header: "bg-blue-100 border-blue-300" },
  { key: "teal",   label: "청록",   block: "bg-teal-500 text-white",     header: "bg-teal-100 border-teal-300" },
  { key: "green",  label: "초록",   block: "bg-green-500 text-white",    header: "bg-green-100 border-green-300" },
  { key: "purple", label: "보라",   block: "bg-purple-500 text-white",   header: "bg-purple-100 border-purple-300" },
  { key: "pink",   label: "핑크",   block: "bg-pink-500 text-white",     header: "bg-pink-100 border-pink-300" },
  { key: "orange", label: "주황",   block: "bg-orange-400 text-white",   header: "bg-orange-100 border-orange-300" },
  { key: "rose",   label: "로즈",   block: "bg-rose-500 text-white",     header: "bg-rose-100 border-rose-300" },
];
const COLOR_MAP = Object.fromEntries(COLOR_OPTIONS.map((c) => [c.key, c]));

const GRADES_ORDER = ["초등 1학년","초등 2학년","초등 3학년","초등 4학년","초등 5학년","초등 6학년","중등 1학년","중등 2학년","중등 3학년"];
const AVATAR_COLORS = ["bg-teal-400","bg-pink-400","bg-teal-400","bg-orange-400","bg-purple-400","bg-blue-400"];
const getAvatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToPx(minutes) {
  return ((minutes - START_HOUR * 60) / 60) * PX_PER_HOUR;
}

// eslint-disable-next-line no-unused-vars
function formatDuration(start, end) {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
}

// ── 수업 추가/수정 모달 ──────────────────────────────────────
function ScheduleModal({ item, suggestions = [], students = [], updateStudent, onSave, onDelete, onClose }) {
  const isEdit = !!item?.id;
  const [form, setForm] = useState({
    day: item?.day ?? "월",
    startTime: item?.startTime ?? "14:00",
    endTime: item?.endTime ?? "15:30",
    title: item?.title ?? "",
    note: item?.note ?? "",
    color: item?.color ?? "indigo",
  });
  const [error, setError] = useState("");
  const [showSug, setShowSug] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const titleRef = useRef();

  // 이 항목의 ID (신규는 미리 생성, 기존은 그대로)
  const savedId = useRef(item?.id ?? Date.now()).current;

  // 학생 배정: 이미 이 수업에 배정된 학생 pre-check
  const [checked, setChecked] = useState(() =>
    item?.id
      ? new Set(students.filter((s) => s.scheduleId === item.id).map((s) => s.id))
      : new Set()
  );
  const [studentSearch, setStudentSearch] = useState("");

  const sortedStudents = useMemo(() =>
    [...students]
      .filter((s) => !studentSearch || s.name.includes(studentSearch))
      .sort((a, b) => {
        const gi = GRADES_ORDER.indexOf(a.grade) - GRADES_ORDER.indexOf(b.grade);
        return gi !== 0 ? gi : a.name.localeCompare(b.name, "ko");
      }),
    [students, studentSearch]
  );

  const toggleStudent = (id) =>
    setChecked((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setChecked(checked.size === sortedStudents.length
      ? new Set() : new Set(sortedStudents.map((s) => s.id)));

  const set = (key, val) => { setForm((f) => ({ ...f, [key]: val })); setError(""); };

  const filteredSug = useMemo(() => {
    const q = form.title.trim().toLowerCase();
    if (!q) return suggestions;
    return suggestions.filter((s) => s.title.toLowerCase().includes(q));
  }, [suggestions, form.title]);

  const selectSuggestion = (s) => {
    setForm((f) => ({ ...f, title: s.title, color: s.color, note: f.note || s.note }));
    setShowSug(false);
    setHighlight(-1);
  };

  const handleTitleKeyDown = (e) => {
    if (!showSug || filteredSug.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filteredSug.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      selectSuggestion(filteredSug[highlight]);
    } else if (e.key === "Escape") {
      setShowSug(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("수업 이름을 입력해주세요."); return; }
    if (timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)) {
      setError("종료 시간이 시작 시간보다 늦어야 합니다."); return;
    }
    // 학생 반 자동 업데이트 (scheduleId로 특정 수업 항목과 1:1 연결)
    students.forEach((s) => {
      const wasHere = s.scheduleId === item?.id;
      const isNowChecked = checked.has(s.id);
      if (isNowChecked) {
        updateStudent(s.id, { scheduleId: savedId, class: form.title.trim() });
      } else if (wasHere) {
        updateStudent(s.id, { scheduleId: null, class: "" });
      }
    });
    onSave({ ...form, id: savedId });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-7 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">{isEdit ? "수업 수정" : "수업 추가"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 요일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">요일</label>
            <div className="flex gap-2">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("day", d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
                    form.day === d
                      ? "bg-[#2BAE9A] text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                min="09:00" max="21:30"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
                min="09:30" max="22:00"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A]"
              />
            </div>
          </div>

          {/* 수업명 + 자동완성 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">수업 이름 *</label>
            <input
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={(e) => { set("title", e.target.value); setShowSug(true); setHighlight(-1); }}
              onFocus={() => setShowSug(true)}
              onBlur={() => setTimeout(() => setShowSug(false), 150)}
              onKeyDown={handleTitleKeyDown}
              placeholder="예: 초3반, 중1 논술반"
              autoFocus={!isEdit}
              autoComplete="off"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A]"
            />
            {showSug && filteredSug.length > 0 && (
              <ul className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {filteredSug.map((s, i) => {
                  const colorCfg = COLOR_MAP[s.color] || COLOR_MAP.indigo;
                  return (
                    <li
                      key={s.title}
                      onMouseDown={() => selectSuggestion(s)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer text-sm transition ${
                        highlight === i ? "bg-[#eef9f7] text-[#1a8a78]" : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full shrink-0 ${colorCfg.block}`} />
                      <span className="font-medium">{s.title}</span>
                      {s.note && <span className="text-xs text-gray-400 truncate">{s.note}</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모 <span className="text-gray-400 font-normal">(선택)</span></label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="교실, 담당 사항 등"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A]"
            />
          </div>

          {/* 색상 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">색상</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => set("color", c.key)}
                  className={`w-8 h-8 rounded-xl ${c.block} transition ${
                    form.color === c.key ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "opacity-70 hover:opacity-100"
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* 학생 배정 */}
          {students.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  학생 배정
                  <span className="ml-1.5 text-xs text-gray-400 font-normal">({checked.size}/{students.length}명 선택)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="이름 검색"
                    className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#2BAE9A] w-24"
                  />
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs text-[#1a8a78] hover:text-[#1a8a78] font-medium"
                  >
                    {checked.size === sortedStudents.length ? "전체 해제" : "전체 선택"}
                  </button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                {sortedStudents.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">검색 결과 없음</p>
                ) : (
                  sortedStudents.map((s) => {
                    const isChecked = checked.has(s.id);
                    const avatarIdx = parseInt(s.id, 10) || 0;
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                          isChecked ? "bg-[#eef9f7]" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStudent(s.id)}
                          className="accent-teal-500"
                        />
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(avatarIdx)}`}>
                          {s.name[0]}
                        </div>
                        <span className="text-sm text-gray-800 flex-1">{s.name}</span>
                        <span className="text-xs text-gray-400">{s.grade}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-3 pt-1">
            {isEdit && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium transition"
              >
                삭제
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#2BAE9A] hover:bg-[#249e8c] text-white rounded-xl text-sm font-semibold transition"
            >
              {isEdit ? "수정 완료" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export default function SchedulePage() {
  const { schedule, addScheduleItem, updateScheduleItem, deleteScheduleItem, students, updateStudent } = useApp();
  const [modal, setModal] = useState(null); // null | "add" | item
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [addDay, setAddDay] = useState("월"); // 빈 셀 클릭 시 기본 요일

  const scrollRef = useRef();

  const openAdd = (day = "월") => {
    setAddDay(day);
    setModal("add");
  };

  const handleSave = (form) => {
    if (modal === "add") {
      addScheduleItem(form);
    } else {
      updateScheduleItem(modal.id, form);
    }
    setModal(null);
  };

  const handleDelete = () => {
    deleteScheduleItem(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  // 자동완성용 고유 수업 목록 (title 기준, 가장 최근 항목의 color/note 사용)
  const suggestions = useMemo(() => {
    const map = {};
    [...schedule].reverse().forEach((s) => {
      if (!map[s.title]) map[s.title] = { title: s.title, color: s.color, note: s.note || "" };
    });
    return Object.values(map).sort((a, b) => a.title.localeCompare(b.title, "ko"));
  }, [schedule]);

  // 요일별 수업 그룹
  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = schedule
      .filter((s) => s.day === d)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {});

  // 시간 레이블 (정시)
  const hourLabels = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F3F0]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E3DED8] px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-800">주간 시간표</h1>
          <p className="text-xs text-gray-400 mt-0.5">요일별 수업 일정을 관리합니다</p>
        </div>
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2BAE9A] hover:bg-[#249e8c] text-white rounded-xl text-sm font-semibold transition"
        >
          + 수업 추가
        </button>
      </header>

      {/* 그리드 */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="min-w-[700px]">
          {/* 요일 헤더 */}
          <div className="flex sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
            <div className="w-14 shrink-0" /> {/* 시간 컬럼 여백 */}
            {DAYS.map((d) => (
              <div
                key={d}
                className="flex-1 text-center py-3 text-sm font-bold text-gray-700 border-l border-gray-100 cursor-pointer hover:bg-[#eef9f7] transition select-none"
                onClick={() => openAdd(d)}
                title={`${d}요일에 수업 추가`}
              >
                {d}
                <span className="text-xs text-gray-400 font-normal ml-1">요일</span>
              </div>
            ))}
          </div>

          {/* 시간 그리드 본문 */}
          <div className="flex">
            {/* 시간 레이블 컬럼 */}
            <div className="w-14 shrink-0 relative" style={{ height: TOTAL_HEIGHT }}>
              {hourLabels.map((h) => (
                <div
                  key={h}
                  className="absolute right-2 text-xs text-gray-400 leading-none"
                  style={{ top: (h - START_HOUR) * PX_PER_HOUR - 6 }}
                >
                  {h === END_HOUR ? "" : `${h}:00`}
                </div>
              ))}
            </div>

            {/* 요일별 컬럼 */}
            {DAYS.map((d) => (
              <div
                key={d}
                className="flex-1 relative border-l border-gray-100 cursor-pointer"
                style={{ height: TOTAL_HEIGHT }}
                onClick={() => openAdd(d)}
              >
                {/* 시간 구분선 */}
                {hourLabels.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
                  />
                ))}
                {/* 30분 구분선 (점선) */}
                {hourLabels.slice(0, -1).map((h) => (
                  <div
                    key={`${h}-half`}
                    className="absolute left-0 right-0 border-t border-dashed border-gray-50"
                    style={{ top: (h - START_HOUR) * PX_PER_HOUR + PX_PER_HOUR / 2 }}
                  />
                ))}

                {/* 수업 블록 */}
                {byDay[d].map((item) => {
                  const startMin = timeToMinutes(item.startTime);
                  const endMin   = timeToMinutes(item.endTime);
                  const top    = minutesToPx(startMin);
                  const height = ((endMin - startMin) / 60) * PX_PER_HOUR;
                  const colorCfg = COLOR_MAP[item.color] || COLOR_MAP.indigo;
                  const isShort = height < 48;

                  return (
                    <div
                      key={item.id}
                      className={`absolute left-1 right-1 rounded-xl px-2.5 py-1.5 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer select-none ${colorCfg.block}`}
                      style={{ top: top + 2, height: height - 4 }}
                      onClick={(e) => { e.stopPropagation(); setModal(item); }}
                      title={`${item.title}  ${item.startTime}–${item.endTime}`}
                    >
                      <p className={`font-bold leading-tight truncate ${isShort ? "text-xs" : "text-sm"}`}>
                        {item.title}
                      </p>
                      {!isShort && (
                        <p className="text-xs opacity-80 mt-0.5 leading-tight">
                          {item.startTime} – {item.endTime}
                        </p>
                      )}
                      {!isShort && item.note && (
                        <p className="text-xs opacity-70 mt-0.5 truncate">{item.note}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 범례: 수업 목록 요약 */}
      {schedule.length > 0 && (
        <div className="bg-white border-t border-gray-100 px-6 py-3 flex flex-wrap gap-2 shrink-0">
          {[...new Set(schedule.map((s) => s.title))].map((title) => {
            const item = schedule.find((s) => s.title === title);
            const colorCfg = COLOR_MAP[item.color] || COLOR_MAP.indigo;
            return (
              <span key={title} className={`px-3 py-1 rounded-lg text-xs font-medium ${colorCfg.block}`}>
                {title}
              </span>
            );
          })}
          <span className="ml-auto text-xs text-gray-400 self-center">
            총 {schedule.length}개 수업
          </span>
        </div>
      )}

      {/* 수업 추가/수정 모달 */}
      {modal !== null && (
        <ScheduleModal
          item={modal === "add" ? { day: addDay } : modal}
          suggestions={suggestions}
          students={students}
          updateStudent={updateStudent}
          onSave={handleSave}
          onDelete={() => { setDeleteConfirm(modal); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}

      {/* 삭제 확인 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">수업 삭제</h3>
            <p className="text-sm text-gray-600 mb-5">
              <span className="font-semibold">{deleteConfirm.title}</span> ({deleteConfirm.day}요일 {deleteConfirm.startTime}–{deleteConfirm.endTime})를 삭제할까요?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
