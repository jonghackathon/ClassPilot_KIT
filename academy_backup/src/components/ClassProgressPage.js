import React, { useState, useMemo, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";

// ── 날짜 유틸 ─────────────────────────────────────────────────
function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 칩에 표시할 짧은 텍스트 추출: "초6 - 고전1300 - 1-2 자전거 도둑" → "자전거 도둑"
function chipText(text) {
  if (!text) return "";
  const parts = text.split(" - ");
  const last = parts[parts.length - 1].trim();
  return last.replace(/^[\d-]+\s+/, "") || last;
}

function getWeekRange(weekOffset = 0) {
  const now = new Date();
  const dow = now.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff + weekOffset * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return toDateStr(d);
  });
  const weekLabelMap = { 0: "이번 주", 1: "다음 주", 2: "2주 후", 3: "3주 후", 4: "4주 후", "-1": "지난 주", "-2": "2주 전", "-3": "3주 전" };
  return {
    start: toDateStr(mon), end: toDateStr(sun), days,
    label: `${mon.getMonth()+1}/${mon.getDate()} ~ ${sun.getMonth()+1}/${sun.getDate()}`,
    weekLabel: weekLabelMap[String(weekOffset)] ?? (weekOffset > 0 ? `${weekOffset}주 후` : `${Math.abs(weekOffset)}주 전`),
  };
}

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon … 6=Sun
  const days = [];
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, 1 - startDow + i);
    days.push({ date: toDateStr(d), currentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: toDateStr(new Date(year, month, i)), currentMonth: true });
  }
  const tail = days.length % 7;
  if (tail > 0) {
    for (let i = 1; i <= 7 - tail; i++) {
      days.push({ date: toDateStr(new Date(year, month + 1, i)), currentMonth: false });
    }
  }
  return days;
}

function formatDateFull(dateStr) {
  const d = new Date(dateStr);
  const dayKo = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${dayKo})`;
}

// ── 반별 색상 ─────────────────────────────────────────────────
const CLASS_CHIP_COLORS = [
  "bg-teal-100 text-teal-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
  "bg-lime-100 text-lime-700",
];

// ── 커리큘럼 차시 선택 모달 ───────────────────────────────────
function LessonPickerModal({ curriculum, onSelect, onClose }) {
  const [selectedClassId, setSelectedClassId] = useState(curriculum[0]?.id ?? null);
  const [expandedStages, setExpandedStages] = useState({});
  const selectedClass = curriculum.find((c) => c.id === selectedClassId);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[#E3DED8] flex items-center justify-between shrink-0">
          <h3 className="text-base text-gray-800">커리큘럼에서 선택</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-44 shrink-0 border-r border-[#E3DED8] overflow-y-auto p-2 space-y-1">
            {curriculum.map((cls) => (
              <button key={cls.id} onClick={() => setSelectedClassId(cls.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition ${selectedClassId === cls.id ? "bg-[#eef9f7] text-[#1a8a78]" : "text-gray-600 hover:bg-[#F5F3F0]"}`}>
                {cls.name}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!selectedClass ? (
              <p className="text-sm text-gray-400 text-center py-8">수업을 선택해주세요</p>
            ) : selectedClass.stages.map((stage) => {
              const isOpen = expandedStages[stage.id] !== false;
              return (
                <div key={stage.id} className="border border-[#E3DED8] rounded-xl overflow-hidden">
                  <button onClick={() => setExpandedStages((p) => ({ ...p, [stage.id]: !p[stage.id] }))}
                    className="w-full flex items-center justify-between px-3 py-2 bg-[#F5F3F0] hover:bg-[#EDEAE5] transition text-left">
                    <span className="text-xs text-gray-600">{stage.name}</span>
                    <span className={`text-gray-400 text-xs transition-transform ${isOpen ? "" : "-rotate-90"}`}>▾</span>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-[#F0EDE9]">
                      {stage.lessons.map((lesson) => (
                        <button key={lesson.id} onClick={() => onSelect(lesson, selectedClass, stage)}
                          className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-[#eef9f7] transition text-left group">
                          <span className="text-xs text-gray-400 font-mono w-12 shrink-0 mt-0.5">{lesson.number}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 group-hover:text-[#1a8a78] truncate">{lesson.title}</p>
                            <div className="flex gap-2 mt-0.5">
                              {lesson.book && <span className="text-xs text-gray-400 truncate">{lesson.book}</span>}
                              {lesson.theme && <span className="text-xs text-amber-500">{lesson.theme}</span>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 과제 자동 생성 뱃지 ──────────────────────────────────────
function AutoAssignBadge({ count }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-2 py-0.5">
      ✓ 과제 {count}건 자동 생성됨
    </span>
  );
}

// ── 날짜별 수업 내용 입력 섹션 ────────────────────────────────
function DateNotes({ scheduleId, members }) {
  const { weekNotes, setWeekNote, addAssignment } = useApp();

  const dateNotes = useMemo(() => {
    const prefix = `${scheduleId}::d::`;
    return Object.entries(weekNotes)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, text]) => ({ date: key.slice(prefix.length), text }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [weekNotes, scheduleId]);

  const [addingDate, setAddingDate] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newContent, setNewContent] = useState("");
  const [autoAssign, setAutoAssign] = useState(true);
  const [lastCreated, setLastCreated] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const handleAdd = () => {
    if (!newDate || !newContent.trim()) return;
    const content = newContent.trim();
    setWeekNote(scheduleId, `d::${newDate}`, content);
    if (autoAssign && members.length > 0) {
      members.forEach((student) => {
        addAssignment({ studentId: student.id, title: `${content} 에세이 쓰기`, type: "에세이", assignedDate: newDate, teacherNote: "", hasImage: false });
      });
      setLastCreated({ count: members.length });
    }
    setNewDate(""); setNewContent(""); setAutoAssign(false); setAddingDate(false);
  };

  const fmtDate = (dateStr) => {
    const [, m, d] = dateStr.split("-");
    const dayKo = ["일","월","화","수","목","금","토"][new Date(dateStr).getDay()];
    return `${parseInt(m)}/${parseInt(d)} (${dayKo})`;
  };

  return (
    <div className="mt-4 pt-4 border-t border-[#F0EDE9]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">날짜별 수업 내용</p>
        {!addingDate && (
          <button onClick={() => { setAddingDate(true); setNewDate(today); setLastCreated(null); }}
            className="text-xs px-2.5 py-1 rounded-lg bg-[#eef9f7] text-[#1a8a78] hover:bg-teal-100 transition font-medium">
            + 날짜 추가
          </button>
        )}
      </div>
      {lastCreated && <div className="mb-2"><AutoAssignBadge count={lastCreated.count} /></div>}
      {dateNotes.length > 0 && (
        <ul className="space-y-2 mb-3">
          {dateNotes.map(({ date, text }) => (
            <li key={date} className="group flex items-start gap-2">
              <span className="shrink-0 text-xs font-medium text-gray-400 w-20 pt-0.5">{fmtDate(date)}</span>
              <span className="flex-1 text-xs text-gray-700 leading-relaxed break-words">{chipText(text)}</span>
              <button onClick={() => setWeekNote(scheduleId, `d::${date}`, "")}
                className="shrink-0 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs mt-0.5" title="삭제">✕</button>
            </li>
          ))}
        </ul>
      )}
      {dateNotes.length === 0 && !addingDate && (
        <p className="text-xs text-gray-300 text-center py-2">날짜별 수업 내용을 추가해 한 달치를 미리 계획해보세요</p>
      )}
      {addingDate && (
        <div className="bg-[#F5F3F0] rounded-xl p-3 space-y-2">
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-[#E3DED8] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-white" />
          <input type="text" value={newContent} onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAddingDate(false); }}
            placeholder="수업 내용 입력..." autoFocus
            className="w-full px-2.5 py-1.5 border border-[#E3DED8] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-white" />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)} className="w-3.5 h-3.5 rounded accent-[#2BAE9A]" />
            <span className="text-xs text-gray-600">
              과제 자동 생성
              <span className="text-gray-400 ml-1">({members.length}명 · "{newContent.trim() ? newContent.trim() + " 에세이 쓰기" : "수업제목 에세이 쓰기"}")</span>
            </span>
          </label>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!newDate || !newContent.trim()}
              className="flex-1 py-1.5 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-teal-200 text-white rounded-lg text-xs font-medium transition">
              {autoAssign ? `저장 + 과제 ${members.length}건 생성` : "저장"}
            </button>
            <button onClick={() => { setAddingDate(false); setNewDate(""); setNewContent(""); setAutoAssign(false); }}
              className="px-3 py-1.5 border border-[#E3DED8] bg-white rounded-lg text-xs text-gray-500 hover:bg-[#EDEAE5] transition">
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 반 카드 ───────────────────────────────────────────────────
function ClassCard({ scheduleId, name, entry, members, weekStart, curriculum }) {
  const { weekNotes, setWeekNote, addAssignment } = useApp();
  const noteKey = `${scheduleId}::${weekStart}`;
  const savedNote = weekNotes[noteKey] || "";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(savedNote);
  const [showPicker, setShowPicker] = useState(false);
  const [autoAssign, setAutoAssign] = useState(true);
  const [assignCreated, setAssignCreated] = useState(null);
  const inputRef = useRef();

  useEffect(() => {
    setDraft(weekNotes[noteKey] || "");
    setEditing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteKey]);

  const save = (val, withAutoAssign = false) => {
    setWeekNote(scheduleId, weekStart, val);
    if (withAutoAssign && val.trim() && members.length > 0) {
      members.forEach((student) => {
        addAssignment({ studentId: student.id, title: `${val.trim()} 에세이 쓰기`, type: "에세이", assignedDate: weekStart, teacherNote: "", hasImage: false });
      });
      setAssignCreated(members.length);
      setAutoAssign(false);
    }
  };

  const handleBlur = () => { save(draft); if (!draft.trim()) setEditing(false); };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") { save(draft); inputRef.current?.blur(); }
    if (e.key === "Escape") { setDraft(savedNote); setEditing(false); }
  };
  const startEdit = () => { setAssignCreated(null); setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); };
  const handleSelectLesson = (lesson, cls) => {
    const text = `${cls.name} - ${lesson.number} ${lesson.title}`;
    setDraft(text); save(text); setShowPicker(false); setEditing(false);
  };
  const hasNote = !!savedNote.trim();

  return (
    <>
      <div className={`bg-white rounded-2xl border p-5 shadow-sm transition ${hasNote ? "border-[#2BAE9A] ring-1 ring-[#2BAE9A]/15" : "border-[#E3DED8]"}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-gray-800 text-base font-medium">{name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{entry ? `${entry.day}요일 ${entry.startTime}–${entry.endTime} · ` : ""}{members.length}명</p>
          </div>
          {hasNote && <span className="shrink-0 w-2 h-2 rounded-full bg-[#2BAE9A] mt-1.5" />}
        </div>

        <div className="min-h-[60px]">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">이번 주 수업 내용</p>
          {hasNote && !editing ? (
            <div>
              <button onClick={startEdit} className="w-full text-left group">
                <p className="text-[#1a8a78] text-sm font-bold leading-snug break-words">{savedNote}</p>
                <p className="text-xs text-gray-400 mt-1.5 group-hover:text-gray-500 transition">클릭하여 수정</p>
              </button>
              {assignCreated && <div className="mt-2"><AutoAssignBadge count={assignCreated} /></div>}
            </div>
          ) : (
            <div className="space-y-2">
              <input ref={inputRef} type="text" value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={handleBlur} onKeyDown={handleKeyDown} onClick={() => setEditing(true)}
                placeholder="이번 주 수업 내용 입력..."
                className="w-full px-3 py-2 text-sm border border-[#E3DED8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-[#F5F3F0] placeholder-gray-300" />
              {editing && draft.trim() && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)}
                    onMouseDown={(e) => e.stopPropagation()} className="w-3.5 h-3.5 rounded accent-[#2BAE9A]" />
                  <span className="text-xs text-gray-600">과제 자동 생성 <span className="text-gray-400">({members.length}명)</span></span>
                </label>
              )}
              <div className="flex items-center gap-2">
                {curriculum.length > 0 && (
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowPicker(true)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-[#E3DED8] text-gray-500 hover:border-[#2BAE9A] hover:text-[#1a8a78] hover:bg-[#eef9f7] transition">
                    커리큘럼에서 선택
                  </button>
                )}
                {editing && draft.trim() && (
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { save(draft, autoAssign); setEditing(false); }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#2BAE9A] text-white hover:bg-[#249e8c] transition">
                    {autoAssign ? "저장 + 과제 생성" : "저장"}
                  </button>
                )}
                {editing && (
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setDraft(savedNote); setEditing(false); setAutoAssign(false); }}
                    className="text-xs text-gray-400 hover:text-gray-600">취소</button>
                )}
              </div>
            </div>
          )}
        </div>

        <DateNotes scheduleId={scheduleId} members={members} />
      </div>

      {showPicker && (
        <LessonPickerModal curriculum={curriculum} onSelect={handleSelectLesson} onClose={() => setShowPicker(false)} />
      )}
    </>
  );
}

// ── 캘린더 날짜 클릭 모달 ─────────────────────────────────────
function CalendarDayModal({ date, classes, curriculum, onClose }) {
  const { weekNotes, setWeekNote, addAssignment } = useApp();
  const [addingFor, setAddingFor] = useState(null);
  const [content, setContent] = useState("");
  const [autoAssign, setAutoAssign] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [assignCreated, setAssignCreated] = useState(0);

  const dateKey = `d::${date}`;

  const notesForDate = classes
    .map(({ scheduleId, name, members }, idx) => ({
      scheduleId, name, members,
      text: weekNotes[`${scheduleId}::${dateKey}`] || "",
      color: CLASS_CHIP_COLORS[idx % CLASS_CHIP_COLORS.length],
    }))
    .filter((n) => n.text);

  const classesWithoutNote = classes.filter(
    ({ scheduleId }) => !weekNotes[`${scheduleId}::${dateKey}`]
  );

  const handleSave = () => {
    if (!content.trim() || !addingFor) return;
    const cls = classesWithoutNote.find((c) => c.scheduleId === addingFor);
    if (!cls) return;
    setWeekNote(addingFor, dateKey, content.trim());
    if (autoAssign && cls.members.length > 0) {
      cls.members.forEach((student) => {
        addAssignment({ studentId: student.id, title: `${content.trim()} 에세이 쓰기`, type: "에세이", assignedDate: date, teacherNote: "", hasImage: false });
      });
      setAssignCreated((n) => n + cls.members.length);
    }
    setContent(""); setAutoAssign(false); setAddingFor(null);
  };

  const handleSelectLesson = (lesson, cls) => {
    setContent(`${cls.name} - ${lesson.number} ${lesson.title}`);
    setShowPicker(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-[#E3DED8] flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-base font-bold text-gray-800">{formatDateFull(date)}</h3>
              <p className="text-xs text-gray-400 mt-0.5">수업 내용 확인 및 입력</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* 이 날 기록된 수업 */}
            {notesForDate.length > 0 && (
              <div className="space-y-2">
                {notesForDate.map(({ scheduleId, name, members, text, color }) => (
                  <div key={scheduleId} className="rounded-xl border border-[#E3DED8] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md mb-1 ${color}`}>{name} · {members.length}명</span>
                        <p className="text-sm text-gray-700 break-words">{chipText(text)}</p>
                      </div>
                      <button onClick={() => setWeekNote(scheduleId, dateKey, "")}
                        className="text-gray-300 hover:text-red-400 transition text-xs shrink-0 mt-1">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {assignCreated > 0 && <AutoAssignBadge count={assignCreated} />}

            {notesForDate.length === 0 && !addingFor && (
              <p className="text-center text-gray-400 text-sm py-4">이날 입력된 수업 내용이 없습니다</p>
            )}

            {/* 수업 추가 폼 */}
            {addingFor ? (
              <div className="bg-[#F5F3F0] rounded-xl p-3 space-y-2">
                <select value={addingFor} onChange={(e) => setAddingFor(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E3DED8] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2BAE9A]">
                  {classesWithoutNote.map((c) => (
                    <option key={c.scheduleId} value={c.scheduleId}>{c.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input type="text" value={content} onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setAddingFor(null); }}
                    placeholder="수업 내용 입력..." autoFocus
                    className="flex-1 px-2.5 py-1.5 border border-[#E3DED8] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-white" />
                  {curriculum.length > 0 && (
                    <button type="button" onClick={() => setShowPicker(true)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E3DED8] bg-white text-gray-500 hover:border-[#2BAE9A] hover:text-[#1a8a78] transition whitespace-nowrap">
                      커리큘럼
                    </button>
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)} className="w-3.5 h-3.5 rounded accent-[#2BAE9A]" />
                  <span className="text-xs text-gray-600">
                    과제 자동 생성
                    {addingFor && classesWithoutNote.find(c => c.scheduleId === addingFor) && (
                      <span className="text-gray-400 ml-1">({classesWithoutNote.find(c => c.scheduleId === addingFor).members.length}명)</span>
                    )}
                  </span>
                </label>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={!content.trim()}
                    className="flex-1 py-1.5 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-teal-200 text-white rounded-lg text-xs font-medium transition">
                    저장
                  </button>
                  <button onClick={() => { setAddingFor(null); setContent(""); setAutoAssign(false); }}
                    className="px-3 py-1.5 border border-[#E3DED8] bg-white rounded-lg text-xs text-gray-500 hover:bg-[#EDEAE5] transition">
                    취소
                  </button>
                </div>
              </div>
            ) : classesWithoutNote.length > 0 ? (
              <button onClick={() => setAddingFor(classesWithoutNote[0].scheduleId)}
                className="w-full py-2.5 border-2 border-dashed border-[#2BAE9A] text-[#1a8a78] rounded-xl text-xs font-medium hover:bg-[#eef9f7] transition">
                + 수업 내용 추가
              </button>
            ) : (
              <p className="text-center text-xs text-gray-400">모든 반의 수업 내용이 입력되었습니다</p>
            )}
          </div>
        </div>
      </div>

      {showPicker && (
        <LessonPickerModal curriculum={curriculum} onSelect={handleSelectLesson} onClose={() => setShowPicker(false)} />
      )}
    </>
  );
}

// ── 캘린더 뷰 ─────────────────────────────────────────────────
const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

function CalendarView({ classes, curriculum }) {
  const { weekNotes } = useApp();
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const today = toDateStr(now);
  const calDays = useMemo(() => buildCalendarDays(calYear, calMonth), [calYear, calMonth]);

  // date → [{ name, text, colorChip }]
  const eventMap = useMemo(() => {
    const map = {};
    classes.forEach(({ scheduleId, name }, idx) => {
      const chip = CLASS_CHIP_COLORS[idx % CLASS_CHIP_COLORS.length];
      const prefix = `${scheduleId}::d::`;
      Object.entries(weekNotes).forEach(([key, text]) => {
        if (key.startsWith(prefix) && text) {
          const date = key.slice(prefix.length);
          if (!map[date]) map[date] = [];
          map[date].push({ name, text, chip });
        }
      });
    });
    return map;
  }, [weekNotes, classes]);

  const prevMonth = () => { if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); } else setCalMonth((m) => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); } else setCalMonth((m) => m + 1); };

  return (
    <>
      {/* 월 네비게이터 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#EDEAE5] text-gray-500 transition text-xl leading-none">‹</button>
          <span className="text-lg font-bold text-gray-800 min-w-[120px] text-center">
            {calYear}년 {calMonth + 1}월
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#EDEAE5] text-gray-500 transition text-xl leading-none">›</button>
        </div>
        <button
          onClick={() => { setCalYear(now.getFullYear()); setCalMonth(now.getMonth()); }}
          className="text-xs px-3 py-1.5 rounded-xl bg-white border border-[#E3DED8] text-gray-600 hover:border-[#2BAE9A] hover:text-[#1a8a78] transition"
        >
          이번 달
        </button>
      </div>

      {/* 달력 */}
      <div className="bg-white rounded-2xl border border-[#E3DED8] overflow-hidden shadow-sm">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-[#E3DED8] bg-[#F5F3F0]">
          {DAY_LABELS.map((d, i) => (
            <div key={d} className={`py-2.5 text-center text-xs font-semibold ${i === 5 ? "text-blue-400" : i === 6 ? "text-red-400" : "text-gray-500"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className="grid grid-cols-7">
          {calDays.map(({ date, currentMonth }, idx) => {
            const events = eventMap[date] || [];
            const isToday = date === today;
            const dow = idx % 7; // 0=Mon … 5=Sat, 6=Sun
            const isSat = dow === 5, isSun = dow === 6;

            return (
              <div
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`min-h-[80px] md:min-h-[96px] p-1.5 border-b border-r border-[#F0EDE9] cursor-pointer transition hover:bg-[#F5F3F0] last:border-r-0 ${
                  !currentMonth ? "bg-gray-50/60" : ""
                } ${events.length > 0 ? "hover:bg-[#eef9f7]" : ""}`}
              >
                {/* 날짜 숫자 */}
                <div className="mb-1">
                  <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday ? "bg-[#2BAE9A] text-white" :
                    !currentMonth ? "text-gray-300" :
                    isSun ? "text-red-400" :
                    isSat ? "text-blue-400" :
                    "text-gray-700"
                  }`}>
                    {new Date(date + "T00:00:00").getDate()}
                  </span>
                </div>

                {/* 수업 이벤트 칩 */}
                <div className="space-y-0.5">
                  {events.slice(0, 2).map((ev, i) => (
                    <div key={i} className={`text-xs px-1.5 py-0.5 rounded truncate leading-tight ${ev.chip}`}>
                      {chipText(ev.text)}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="text-xs text-gray-400 px-1.5">+{events.length - 2}개</div>
                  )}
                  {events.length === 0 && currentMonth && (
                    <div className="text-xs text-gray-200 px-1 leading-tight">+</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 범례 */}
      {classes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {classes.map(({ name }, idx) => (
            <span key={idx} className={`text-xs px-2.5 py-1 rounded-lg font-medium ${CLASS_CHIP_COLORS[idx % CLASS_CHIP_COLORS.length]}`}>
              {name}
            </span>
          ))}
        </div>
      )}

      {selectedDate && (
        <CalendarDayModal
          date={selectedDate}
          classes={classes}
          curriculum={curriculum}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function ClassProgressPage() {
  const { students, schedule, curriculum, setCurrentPage } = useApp();
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState("card"); // "card" | "calendar"
  const weekRange = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  const classes = useMemo(() => {
    const map = {};
    students.forEach((s) => {
      const key = s.scheduleId ?? "unassigned";
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return Object.entries(map)
      .map(([key, members]) => {
        const entry = key !== "unassigned" ? schedule.find((e) => e.id === key || e.id === Number(key)) : null;
        const name = entry ? entry.title : (members[0]?.class || "미배정");
        return { scheduleId: key, name, entry, members };
      })
      .sort((a, b) => {
        if (a.scheduleId === "unassigned") return 1;
        if (b.scheduleId === "unassigned") return -1;
        return a.name.localeCompare(b.name, "ko");
      });
  }, [students, schedule]);

  if (students.length === 0) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-[#F5F3F0]">
        <div className="w-20 h-20 bg-[#eef9f7] rounded-2xl flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-[#2BAE9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-xl text-gray-700 mb-2">아직 학생이 없습니다</h2>
        <p className="text-gray-400 text-sm mb-6">학생 목록에서 학생을 추가하면 반별 수업 현황을 관리할 수 있습니다.</p>
        <button onClick={() => setCurrentPage("students")}
          className="px-5 py-2.5 bg-[#2BAE9A] text-white rounded-xl text-sm hover:bg-[#249e8c] transition">
          학생 추가하러 가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F5F3F0]">
      <div className="p-4 md:p-6 lg:p-8">

        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl text-gray-800">반별 수업 현황</h1>
            <p className="text-gray-500 text-sm mt-0.5">총 {classes.length}개 반</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 뷰 전환 탭 */}
            <div className="flex bg-white border border-[#E3DED8] rounded-xl p-0.5 shadow-sm">
              <button
                onClick={() => setViewMode("card")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewMode === "card" ? "bg-[#2BAE9A] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                카드 보기
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewMode === "calendar" ? "bg-[#2BAE9A] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                캘린더 보기
              </button>
            </div>

            {/* 주 네비게이터 (카드 뷰에서만) */}
            {viewMode === "card" && (
              <div className="flex items-center gap-1 bg-white border border-[#E3DED8] rounded-xl px-2 py-1.5 shadow-sm">
                <button onClick={() => setWeekOffset((o) => o - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F5F3F0] transition text-gray-500 text-lg">‹</button>
                <div className="text-center min-w-[130px]">
                  <p className="text-xs font-medium text-gray-700">{weekRange.weekLabel}</p>
                  <p className="text-xs text-gray-400">{weekRange.label}</p>
                </div>
                <button onClick={() => setWeekOffset((o) => o + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F5F3F0] transition text-gray-500 text-lg">›</button>
                {weekOffset !== 0 && (
                  <button onClick={() => setWeekOffset(0)}
                    className="ml-0.5 text-xs px-2 py-1 rounded-lg bg-[#eef9f7] text-[#1a8a78] hover:bg-teal-100 transition font-medium">
                    이번 주
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 카드 뷰 */}
        {viewMode === "card" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {classes.map(({ scheduleId, name, entry, members }) => (
              <ClassCard
                key={scheduleId}
                scheduleId={scheduleId}
                name={name}
                entry={entry}
                members={members}
                weekStart={weekRange.start}
                curriculum={curriculum}
              />
            ))}
          </div>
        )}

        {/* 캘린더 뷰 */}
        {viewMode === "calendar" && (
          <CalendarView classes={classes} curriculum={curriculum} />
        )}
      </div>
    </div>
  );
}
