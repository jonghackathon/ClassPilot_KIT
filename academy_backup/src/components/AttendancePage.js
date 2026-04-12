import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { GRADES } from "../data/sampleData";

// ── 상수 ──────────────────────────────────────────────────────
const STATUSES = [
  { key: "출석", short: "O",  color: "bg-green-100 text-green-700 ring-green-300",  text: "text-green-600",  bg: "bg-green-50" },
  { key: "지각", short: "△",  color: "bg-yellow-100 text-yellow-700 ring-yellow-300", text: "text-yellow-600", bg: "bg-yellow-50" },
  { key: "조퇴", short: "▽",  color: "bg-orange-100 text-orange-700 ring-orange-300", text: "text-orange-600", bg: "bg-orange-50" },
  { key: "결석", short: "X",  color: "bg-red-100 text-red-700 ring-red-300",       text: "text-red-500",   bg: "bg-red-50" },
];
const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.key, s]));
const STATUS_CYCLE = [null, "출석", "지각", "조퇴", "결석"];

const WEEKDAYS = ["월", "화", "수", "목", "금", "토"];
// JS getDay(): 0=일,1=월,...,6=토 → our index 0=월,...,5=토 (일요일은 5=토로 fallback)
const jsToIdx = (jsDay) => (jsDay === 0 ? 5 : jsDay - 1);

const AVATAR_COLORS = ["bg-teal-400","bg-pink-400","bg-teal-400","bg-orange-400","bg-purple-400","bg-blue-400"];
const getAvatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

// ── 날짜 유틸 ─────────────────────────────────────────────────
function toDateStr(date) { return date.toISOString().split("T")[0]; }

function formatShort(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatFull(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const wd = ["일","월","화","수","목","금","토"][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${wd})`;
}

// 특정 주(weekOffset=0이 이번주)의 dayIdx번째 날짜 반환 (dayIdx: 0=월..5=토)
function getWeekDayDate(dayIdx, weekOffset) {
  const now = new Date();
  const dow = now.getDay();
  const diff = dow === 0 ? -6 : 1 - dow; // 이번 주 월요일까지 거리
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + weekOffset * 7);
  const d = new Date(monday);
  d.setDate(monday.getDate() + dayIdx);
  return toDateStr(d);
}

// 특정 주(weekOffset=0이 이번주)의 월~토 날짜 배열
function getWeekDates(weekOffset) {
  const now = new Date();
  const dow = now.getDay();
  const diff = dow === 0 ? -6 : 1 - dow; // 이번 주 월요일까지 차이
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + weekOffset * 7);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateStr(d);
  });
}

function getRecentDates(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return toDateStr(d);
  });
}

// ── 학생 목록 + 반별 그룹 (공통) ────────────────────────────
function useSortedStudents(students) {
  return useMemo(() => {
    const sorted = [...students].sort((a, b) => {
      const gi = GRADES.indexOf(a.grade) - GRADES.indexOf(b.grade);
      return gi !== 0 ? gi : a.name.localeCompare(b.name, "ko");
    });
    const grouped = {};
    sorted.forEach((s) => {
      const key = s.class || "미배정";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s);
    });
    return { sorted, grouped: Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b,"ko")) };
  }, [students]);
}

// ── 일별 출석 섹션 (요일별/주별 탭에서 공용) ─────────────────
function DailyAttendanceList({ date, students, entryGroups, attendance, markAttendance, homework, markHomework, absenceReason, markAbsenceReason }) {
  const dayAtt = attendance[date] || {};
  const dayHw = homework[date] || {};
  const dayAr = absenceReason[date] || {};

  const stats = STATUSES.reduce((acc, s) => {
    acc[s.key] = students.filter((st) => dayAtt[st.id] === s.key).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* 통계 */}
      <div className="grid grid-cols-4 gap-3">
        {STATUSES.map((s) => (
          <div key={s.key} className={`${s.bg} rounded-2xl px-4 py-3 text-center`}>
            <p className={`text-2xl font-bold ${s.text}`}>{stats[s.key]}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.key}</p>
          </div>
        ))}
      </div>

      {/* 수업별 목록 (ID 기준으로 독립) */}
      {entryGroups.map(({ entry, members }) => (
        <div key={entry.id}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-gray-700">{entry.title}</span>
            <span className="text-xs text-[#2BAE9A] font-medium bg-[#eef9f7] px-2 py-0.5 rounded-lg">
              {entry.startTime}–{entry.endTime}
            </span>
            <span className="text-xs text-gray-400">{members.length}명</span>
            <div className="flex-1 h-px bg-gray-200" />
            {members.length > 0 && (
              <button
                onClick={() => members.forEach((s) => markAttendance(date, s.id, "출석"))}
                className="text-xs text-green-600 hover:underline font-medium"
              >
                전체 출석
              </button>
            )}
          </div>
          {members.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-4 py-4 text-center text-xs text-gray-400">
              배정된 학생 없음 — 시간표에서 학생을 배정해주세요
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {members.map((student) => {
                const status = dayAtt[student.id] || null;
                const hw = dayHw[student.id] || null;
                const ar = dayAr[student.id] || "";
                const needsReason = status === "결석" || status === "지각" || status === "조퇴";
                return (
                  <div key={student.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${getAvatarColor(student.id)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                        {student.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm">{student.name}</p>
                        <p className="text-xs text-gray-400">{student.grade}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          {STATUSES.map((s) => {
                            const isActive = status === s.key;
                            return (
                              <button
                                key={s.key}
                                onClick={() => markAttendance(date, student.id, isActive ? null : s.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                  isActive ? `${s.color} ring-2` : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                }`}
                              >
                                {s.key}
                              </button>
                            );
                          })}
                        </div>
                        <div className="w-px h-5 bg-gray-200 shrink-0" />
                        <div className="flex gap-1 items-center">
                          <span className="text-xs text-gray-400 shrink-0">과제</span>
                          {["O", "X"].map((v) => (
                            <button
                              key={v}
                              onClick={() => markHomework(date, student.id, hw?.done === v ? null : v, hw?.done === v ? "" : (hw?.note || ""))}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                                hw?.done === v
                                  ? v === "O"
                                    ? "bg-green-100 text-green-700 ring-2 ring-green-300"
                                    : "bg-red-100 text-red-600 ring-2 ring-red-300"
                                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* 과제 미완료 사유 */}
                    {hw?.done === "X" && (
                      <div className="mt-2 ml-12">
                        <input
                          type="text"
                          placeholder="미완료 내용 (예: 에세이 안 가져옴)"
                          key={`hw-${student.id}-${date}`}
                          defaultValue={hw?.note || ""}
                          onBlur={(e) => {
                            const note = e.target.value.trim();
                            if (note !== (hw?.note || "")) {
                              markHomework(date, student.id, "X", note);
                            }
                          }}
                          className="w-full text-xs px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                        />
                      </div>
                    )}
                    {/* 결석/지각/조퇴 사유 */}
                    {needsReason && (
                      <div className="mt-2 ml-12">
                        <input
                          type="text"
                          placeholder={`${status} 사유 (예: 감기, 병원, 경조사)`}
                          key={`ar-${student.id}-${date}`}
                          defaultValue={ar}
                          onBlur={(e) => {
                            const reason = e.target.value.trim();
                            if (reason !== ar) {
                              markAbsenceReason(date, student.id, reason);
                            }
                          }}
                          className="w-full text-xs px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── 반 배정 모달 ──────────────────────────────────────────────
function AssignModal({ unassignedStudents, scheduleEntries, onAssign, onClose }) {
  const [targetEntry, setTargetEntry] = useState(scheduleEntries[0] ?? null);
  const [checked, setChecked] = useState(new Set());

  const toggle = (id) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setChecked(checked.size === unassignedStudents.length
      ? new Set()
      : new Set(unassignedStudents.map((s) => s.id))
    );

  const handleAssign = () => {
    if (checked.size === 0 || !targetEntry) return;
    onAssign(targetEntry, [...checked]);
    setChecked(new Set());
  };

  // 남은 미배정 학생 수 (이미 배정된 것 반영은 부모에서 처리)
  // eslint-disable-next-line no-unused-vars
  const remaining = unassignedStudents.filter((s) => !checked.has(s.id));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh]">
        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">반 배정</h2>
            <p className="text-xs text-gray-400 mt-0.5">미배정 학생 {unassignedStudents.length}명</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* 수업 선택 */}
        <div className="px-6 py-4 border-b border-gray-50 shrink-0">
          <p className="text-xs font-semibold text-gray-500 mb-2">배정할 수업</p>
          <div className="flex flex-col gap-2">
            {scheduleEntries.map((e) => (
              <button
                key={e.id}
                onClick={() => setTargetEntry(e)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition ${
                  targetEntry?.id === e.id
                    ? "bg-[#2BAE9A] border-[#2BAE9A] text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-[#2BAE9A]"
                }`}
              >
                <span className="font-semibold">{e.title}</span>
                <span className={`text-xs ${targetEntry?.id === e.id ? "text-teal-200" : "text-gray-400"}`}>
                  {e.day} {e.startTime}–{e.endTime}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 학생 체크리스트 */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-3 flex items-center justify-between border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-500">학생 선택</p>
            <button onClick={toggleAll} className="text-xs text-[#2BAE9A] hover:underline">
              {checked.size === unassignedStudents.length ? "전체 해제" : "전체 선택"}
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {unassignedStudents.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-gray-50 transition"
              >
                <input
                  type="checkbox"
                  checked={checked.has(s.id)}
                  onChange={() => toggle(s.id)}
                  className="w-4 h-4 accent-teal-500"
                />
                <div className={`w-8 h-8 rounded-lg ${getAvatarColor(s.id)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.grade}</p>
                </div>
                {s.class && (
                  <span className="text-xs text-gray-300">{s.class}</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* 하단 배정 버튼 */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={handleAssign}
            disabled={checked.size === 0 || !targetEntry}
            className="w-full py-3 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-teal-200 text-white rounded-xl text-sm font-semibold transition"
          >
            {checked.size > 0
              ? `선택한 ${checked.size}명 → ${targetEntry?.title ?? ""} 배정`
              : "학생을 선택해주세요"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function AttendancePage() {
  const { students, attendance, markAttendance, homework, markHomework, absenceReason, markAbsenceReason, schedule, updateStudent } = useApp();

  const todayStr = toDateStr(new Date());
  const todayDayIdx = jsToIdx(new Date().getDay());

  // 탭: "day" | "week" | "summary"
  const [tab, setTab] = useState("day");

  // ── 요일별 상태
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayDayIdx);
  // 0=이번 주, -1=지난 주
  const [dayWeekOffset, setDayWeekOffset] = useState(0);
  // 선택된 날짜 (기본: 오늘)
  const [dayDate, setDayDate] = useState(() => todayStr);

  // 요일 버튼 클릭 → 해당 주의 해당 요일 날짜로 이동
  const handleSelectDay = (idx) => {
    setSelectedDayIdx(idx);
    setDayDate(getWeekDayDate(idx, dayWeekOffset));
  };

  // 주 전환 (이번 주 ↔ 지난 주)
  const handleWeekToggle = (offset) => {
    setDayWeekOffset(offset);
    setDayDate(getWeekDayDate(selectedDayIdx, offset));
  };

  // dayDate ±1일 이동 (요일도 함께 갱신, 주 오프셋 보정)
  const moveDayDate = (delta) => {
    const d = new Date(dayDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    const newStr = toDateStr(d);
    setDayDate(newStr);
    const newDayIdx = jsToIdx(d.getDay());
    setSelectedDayIdx(newDayIdx);
    // 날짜 이동 시 오프셋도 맞춤
    const thisWeekDate = getWeekDayDate(newDayIdx, 0);
    const lastWeekDate = getWeekDayDate(newDayIdx, -1);
    if (newStr === thisWeekDate) setDayWeekOffset(0);
    else if (newStr === lastWeekDate) setDayWeekOffset(-1);
  };

  // ── 주별 상태
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  // 주별 셀 클릭 → 상태 순환
  const cycleAttendance = (date, studentId) => {
    const current = (attendance[date] || {})[studentId] || null;
    const idx = STATUS_CYCLE.indexOf(current);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    markAttendance(date, studentId, next);
  };

  // ── 전체 요약
  const recentDates = useMemo(() => getRecentDates(30), []);
  const summaryData = useMemo(() => {
    return students
      .map((s) => {
        const count = (key) =>
          recentDates.filter((d) => (attendance[d] || {})[s.id] === key).length;
        const marked = recentDates.filter((d) => (attendance[d] || {})[s.id]).length;
        const present = count("출석"), late = count("지각"),
              earlyLeave = count("조퇴"), absent = count("결석");
        return {
          student: s, present, late, earlyLeave, absent, marked,
          rate: marked > 0 ? Math.round(((present + late) / marked) * 100) : null,
        };
      })
      .sort((a, b) => {
        const gi = GRADES.indexOf(a.student.grade) - GRADES.indexOf(b.student.grade);
        return gi !== 0 ? gi : a.student.name.localeCompare(b.student.name, "ko");
      });
  }, [students, attendance, recentDates]);

  const { sorted: allStudents, grouped } = useSortedStudents(students);

  // 전체 시간표에 등록된 항목 ID 집합
  const allScheduleIds = useMemo(
    () => new Set(schedule.map((e) => e.id)),
    [schedule]
  );

  // 시간표 수업에 배정되지 않은 학생들 (scheduleId 없거나 존재하지 않는 항목)
  const unassignedStudents = useMemo(
    () => allStudents.filter((s) => !s.scheduleId || !allScheduleIds.has(s.scheduleId)),
    [allStudents, allScheduleIds]
  );

  const [showAssignModal, setShowAssignModal] = useState(false);

  // 선택한 학생들을 특정 수업 항목으로 배정 (scheduleId + class 동시 설정)
  const assignStudents = (entry, studentIds) => {
    studentIds.forEach((id) => updateStudent(id, { scheduleId: entry.id, class: entry.title }));
  };

  // 요일별 탭: 선택 요일의 시간표 수업 → 해당 반 학생만 필터
  const dayScheduleEntries = useMemo(
    () => schedule
      .filter((e) => e.day === WEEKDAYS[selectedDayIdx])
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [schedule, selectedDayIdx]
  );
  // 요일별: 각 수업 항목(ID 기준)에 배정된 학생 그룹
  const dayGrouped = useMemo(() =>
    dayScheduleEntries.map((entry) => ({
      entry,
      members: allStudents
        .filter((s) => s.scheduleId === entry.id)
        .sort((a, b) => {
          const gi = GRADES.indexOf(a.grade) - GRADES.indexOf(b.grade);
          return gi !== 0 ? gi : a.name.localeCompare(b.name, "ko");
        }),
    })),
    [dayScheduleEntries, allStudents]
  );
  const dayStudents = useMemo(
    () => dayGrouped.flatMap((g) => g.members),
    [dayGrouped]
  );

  if (students.length === 0) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-[#F5F3F0]">
        <div className="w-20 h-20 bg-[#eef9f7] rounded-2xl flex items-center justify-center text-4xl mb-5">📋</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">학생을 먼저 추가해주세요</h2>
        <p className="text-gray-400 text-sm">학생 목록에 학생이 등록되면 출석을 관리할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F3F0]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E3DED8] px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">출석부</h1>
            <p className="text-xs text-gray-400 mt-0.5">출석을 기록하세요</p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[
              { id: "day",     label: "요일별" },
              { id: "week",    label: "주별"   },
              { id: "summary", label: "전체"   },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                  tab === t.id ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* ══ 요일별 탭 ══════════════════════════════════════════ */}
        {tab === "day" && (
          <>
            {/* 주 전환 버튼 */}
            <div className="flex items-center gap-2">
              {[{ offset: 0, label: "이번 주" }, { offset: -1, label: "지난 주" }].map(({ offset, label }) => (
                <button
                  key={offset}
                  onClick={() => handleWeekToggle(offset)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    dayWeekOffset === offset
                      ? "bg-[#2BAE9A] text-white border-[#2BAE9A] shadow"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#2BAE9A]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 요일 셀렉터 (날짜 표시 포함) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-3 flex gap-2">
              {WEEKDAYS.map((d, i) => {
                const weekDayDate = getWeekDayDate(i, dayWeekOffset);
                const dayNum = new Date(weekDayDate + "T00:00:00").getDate();
                const isToday = weekDayDate === todayStr;
                const isSelected = i === selectedDayIdx && dayDate === weekDayDate;
                return (
                  <button
                    key={d}
                    onClick={() => handleSelectDay(i)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition relative flex flex-col items-center gap-0.5 ${
                      isSelected
                        ? "bg-[#2BAE9A] text-white shadow"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-xs font-semibold">{d}</span>
                    <span className={`text-xs font-normal ${isSelected ? "text-teal-100" : isToday ? "text-[#2BAE9A] font-bold" : "text-gray-400"}`}>
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? "bg-teal-200" : "bg-teal-400"}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 날짜 네비게이터 */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-4 py-3">
              <button
                onClick={() => moveDayDate(-1)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-500 text-xl"
              >‹</button>
              <div className="flex items-center gap-3">
                <p className="text-base font-bold text-gray-800">{formatFull(dayDate)}</p>
                {dayDate !== todayStr && (
                  <button
                    onClick={() => { setDayDate(todayStr); setSelectedDayIdx(todayDayIdx); setDayWeekOffset(0); }}
                    className="text-xs text-[#2BAE9A] hover:underline"
                  >
                    오늘로
                  </button>
                )}
                <input
                  type="date"
                  value={dayDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newIdx = jsToIdx(new Date(val + "T00:00:00").getDay());
                    setDayDate(val);
                    setSelectedDayIdx(newIdx);
                    const thisWeekDate = getWeekDayDate(newIdx, 0);
                    const lastWeekDate = getWeekDayDate(newIdx, -1);
                    if (val === thisWeekDate) setDayWeekOffset(0);
                    else if (val === lastWeekDate) setDayWeekOffset(-1);
                  }}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] text-gray-500"
                />
              </div>
              <button
                onClick={() => moveDayDate(1)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-500 text-xl"
              >›</button>
            </div>

            {dayScheduleEntries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 px-6 py-10 text-center">
                <p className="text-3xl mb-3">🗓️</p>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {WEEKDAYS[selectedDayIdx]}요일 시간표가 없습니다
                </p>
                <p className="text-xs text-gray-400">
                  시간표에서 {WEEKDAYS[selectedDayIdx]}요일 수업을 추가하면 해당 반 학생이 자동으로 표시됩니다.
                </p>
              </div>
            ) : dayStudents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 px-6 py-8 text-center">
                <p className="text-3xl mb-3">👤</p>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  {WEEKDAYS[selectedDayIdx]}요일 수업반에 배정된 학생이 없습니다
                </p>
                {unassignedStudents.length > 0 ? (
                  <>
                    <p className="text-xs text-gray-400 mb-5">
                      미배정 학생 {unassignedStudents.length}명 · 누가 어느 수업인지 직접 선택해주세요
                    </p>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="px-6 py-2.5 bg-[#2BAE9A] hover:bg-[#249e8c] text-white rounded-xl text-sm font-semibold transition"
                    >
                      반 배정하기
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    모든 학생이 다른 요일 수업에 배정되어 있습니다.
                  </p>
                )}
              </div>
            ) : (
              <DailyAttendanceList
                date={dayDate}
                students={dayStudents}
                entryGroups={dayGrouped}
                attendance={attendance}
                markAttendance={markAttendance}
                homework={homework}
                markHomework={markHomework}
                absenceReason={absenceReason}
                markAbsenceReason={markAbsenceReason}
              />
            )}
          </>
        )}

        {/* ══ 주별 탭 ════════════════════════════════════════════ */}
        {tab === "week" && (
          <>
            {/* 주 네비게이터 */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-4 py-3">
              <button
                onClick={() => setWeekOffset((o) => o - 1)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-500 text-xl"
              >‹</button>
              <div className="text-center">
                <p className="text-base font-bold text-gray-800">
                  {formatShort(weekDates[0])} ~ {formatShort(weekDates[5])}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {weekOffset === 0 ? "이번 주" : weekOffset === -1 ? "지난 주" : `${Math.abs(weekOffset)}주 전`}
                </p>
              </div>
              <button
                onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
                disabled={weekOffset === 0}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 disabled:opacity-30 transition text-gray-500 text-xl"
              >›</button>
            </div>

            {/* 범례 */}
            <div className="flex items-center gap-4 px-1">
              {STATUSES.map((s) => (
                <span key={s.key} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${s.color}`}>
                    {s.short}
                  </span>
                  {s.key}
                </span>
              ))}
              <span className="text-xs text-gray-400 ml-auto">셀 클릭으로 상태 변경</span>
            </div>

            {/* 주별 그리드 */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap sticky left-0 bg-gray-50 z-10 min-w-[120px]">
                        학생
                      </th>
                      {weekDates.map((date, i) => {
                        const isToday = date === todayStr;
                        const isFuture = date > todayStr;
                        return (
                          <th
                            key={date}
                            className={`px-2 py-3 text-center whitespace-nowrap min-w-[72px] ${
                              isToday ? "bg-[#eef9f7]" : ""
                            }`}
                          >
                            <p className={`text-xs font-bold ${isToday ? "text-[#1a8a78]" : isFuture ? "text-gray-300" : "text-gray-600"}`}>
                              {WEEKDAYS[i]}
                            </p>
                            <p className={`text-xs mt-0.5 font-normal ${isToday ? "text-teal-400" : isFuture ? "text-gray-300" : "text-gray-400"}`}>
                              {formatShort(date)}
                            </p>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.map(([cls, members]) => (
                      <React.Fragment key={cls}>
                        {/* 반 구분 행 */}
                        <tr className="bg-gray-50/70">
                          <td
                            colSpan={7}
                            className="px-4 py-1.5 text-xs font-bold text-gray-500 sticky left-0 bg-gray-50/70"
                          >
                            {cls}
                            <span className="ml-1.5 font-normal text-gray-400">{members.length}명</span>
                          </td>
                        </tr>
                        {members.map((student) => (
                          <tr key={student.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                            {/* 학생 이름 - sticky */}
                            <td className="px-4 py-2.5 sticky left-0 bg-white hover:bg-gray-50/50 z-10">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg ${getAvatarColor(student.id)} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                                  {student.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800 text-sm leading-tight whitespace-nowrap">{student.name}</p>
                                  <p className="text-xs text-gray-400 leading-tight">{student.grade}</p>
                                </div>
                              </div>
                            </td>
                            {/* 날짜별 셀 */}
                            {weekDates.map((date, i) => {
                              const status = (attendance[date] || {})[student.id] || null;
                              const isFuture = date > todayStr;
                              const isToday = date === todayStr;
                              const cfg = status ? STATUS_MAP[status] : null;
                              return (
                                <td
                                  key={date}
                                  className={`px-2 py-2 text-center ${isToday ? "bg-[#eef9f7]/50" : ""}`}
                                >
                                  <button
                                    disabled={isFuture}
                                    onClick={() => cycleAttendance(date, student.id)}
                                    className={`w-9 h-9 rounded-xl mx-auto flex items-center justify-center text-sm font-bold transition ${
                                      isFuture
                                        ? "cursor-default opacity-0"
                                        : cfg
                                          ? `${cfg.color} ring-1 hover:opacity-80`
                                          : "bg-gray-100 text-gray-300 hover:bg-gray-200 hover:text-gray-400"
                                    }`}
                                    title={isFuture ? "" : (status || "미기록 → 클릭하여 변경")}
                                  >
                                    {cfg ? cfg.short : "·"}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ 전체 현황 탭 (최근 30일) ═══════════════════════════ */}
        {tab === "summary" && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-xs text-gray-400">
              최근 30일 기준 · 출석 기록된 날만 집계됩니다
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 font-semibold text-gray-600 whitespace-nowrap">학생</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">학년</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">반</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-green-600 whitespace-nowrap">출석</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-yellow-600 whitespace-nowrap">지각</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-orange-600 whitespace-nowrap">조퇴</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-red-500 whitespace-nowrap">결석</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-[#1a8a78] whitespace-nowrap">출석률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {summaryData.map(({ student, present, late, earlyLeave, absent, rate }) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg ${getAvatarColor(student.id)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-800 whitespace-nowrap">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">{student.grade}</td>
                        <td className="px-3 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{student.class || "-"}</td>
                        <td className="px-3 py-3 text-center">{present > 0 ? <span className="font-semibold text-green-600">{present}</span> : <span className="text-gray-200">-</span>}</td>
                        <td className="px-3 py-3 text-center">{late > 0 ? <span className="font-semibold text-yellow-600">{late}</span> : <span className="text-gray-200">-</span>}</td>
                        <td className="px-3 py-3 text-center">{earlyLeave > 0 ? <span className="font-semibold text-orange-600">{earlyLeave}</span> : <span className="text-gray-200">-</span>}</td>
                        <td className="px-3 py-3 text-center">{absent > 0 ? <span className="font-semibold text-red-500">{absent}</span> : <span className="text-gray-200">-</span>}</td>
                        <td className="px-3 py-3 text-center">
                          {rate !== null ? (
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                              rate >= 90 ? "bg-green-100 text-green-700" :
                              rate >= 70 ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-600"
                            }`}>{rate}%</span>
                          ) : (
                            <span className="text-gray-300 text-xs">기록없음</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 반 배정 모달 */}
      {showAssignModal && (
        <AssignModal
          unassignedStudents={unassignedStudents}
          scheduleEntries={dayScheduleEntries}
          onAssign={(className, ids) => assignStudents(className, ids)}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
}
