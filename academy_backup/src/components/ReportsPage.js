import React, { useState, useMemo, useRef } from "react";
import { useApp } from "../context/AppContext";
import { ASSIGNMENT_TYPES, TYPE_COLORS } from "./AssignmentForm";
import { generateGrowthReport } from "../api/claude";

// ── 마크다운 렌더러 ────────────────────────────────────────────
function RenderMd({ text, className = "" }) {
  if (!text) return null;
  const lines = text.split("\n");
  const els = [];
  let k = 0;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      els.push(
        <h4 key={k++} className="text-sm font-bold text-gray-800 mt-4 mb-1.5 first:mt-0">
          {line.slice(3)}
        </h4>
      );
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      els.push(
        <li key={k++} className="text-sm text-gray-700 ml-4 list-disc leading-relaxed">
          {line.slice(2)}
        </li>
      );
    } else if (line.trim() === "") {
      els.push(<div key={k++} className="h-1" />);
    } else {
      els.push(<p key={k++} className="text-sm text-gray-700 leading-relaxed">{line}</p>);
    }
  }
  return <div className={className}>{els}</div>;
}

// ── 로고 업로더 ────────────────────────────────────────────────
function LogoUploader({ logo, onChange }) {
  const ref = useRef();
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex items-center gap-2">
      {logo ? (
        <>
          <img src={logo} alt="로고" className="h-8 object-contain rounded" />
          <button
            onClick={() => onChange("")}
            className="text-xs text-gray-400 hover:text-red-500 transition"
          >
            ✕ 제거
          </button>
        </>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[#E3DED8] rounded-xl text-xs text-gray-500 hover:border-[#2BAE9A] hover:text-[#1a8a78] transition"
        >
          📁 로고 업로드
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}

// ── 아바타 색 ─────────────────────────────────────────────────
const AVATAR_COLORS = ["bg-teal-400","bg-pink-400","bg-orange-400","bg-purple-400","bg-blue-400"];
const avatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

// ── 날짜 포맷 ─────────────────────────────────────────────────
function fmtDate(dateStr) {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

// ── 출석 통계 ─────────────────────────────────────────────────
function useAttStats(attendance, studentId, monthStr) {
  return useMemo(() => {
    const records = [];
    Object.entries(attendance).forEach(([date, byStudent]) => {
      if (date.startsWith(monthStr) && byStudent[studentId] !== undefined) {
        records.push({ date, status: byStudent[studentId] });
      }
    });
    records.sort((a, b) => a.date.localeCompare(b.date));
    const total   = records.length;
    const present = records.filter((r) => r.status === "출석").length;
    const absent  = records.filter((r) => r.status === "결석").length;
    const late    = records.filter((r) => r.status === "지각").length;
    const others  = total - present - absent - late;
    return { records, total, present, absent, late, others };
  }, [attendance, studentId, monthStr]);
}

// ── 커리큘럼 노트 ─────────────────────────────────────────────
function useCurrNotes(weekNotes, scheduleId, monthStr) {
  return useMemo(() => {
    if (!scheduleId) return [];
    const prefix = `${scheduleId}::`;
    const notes = [];
    Object.entries(weekNotes).forEach(([key, text]) => {
      if (!key.startsWith(prefix)) return;
      const rest = key.slice(prefix.length);
      let date;
      if (rest.startsWith("d::")) {
        date = rest.slice(3);
        if (!date.startsWith(monthStr)) return;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(rest)) {
        if (!rest.startsWith(monthStr)) return;
        date = rest;
      } else {
        return;
      }
      notes.push({ date, text });
    });
    return notes.sort((a, b) => a.date.localeCompare(b.date));
  }, [weekNotes, scheduleId, monthStr]);
}

// ── 인쇄 전용 리포트 레이아웃 ─────────────────────────────────
function PrintableReport({
  logo, student, monthLabel, scheduleEntry,
  currNotes, attStats, myAssignments, feedbackCount,
  comment, growth,
}) {
  const attRate = attStats.total > 0
    ? Math.round((attStats.present / attStats.total) * 100)
    : null;

  // 마크다운을 일반 텍스트 블록으로 렌더링 (print 환경에서 간결하게)
  const renderGrowthPrint = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <p key={i} style={{ fontWeight: "bold", marginTop: 12, marginBottom: 4, fontSize: 13, color: "#1a1a1a" }}>
            {line.slice(3)}
          </p>
        );
      }
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return (
          <p key={i} style={{ fontSize: 12, color: "#333", paddingLeft: 12, marginBottom: 3 }}>
            • {line.slice(2)}
          </p>
        );
      }
      if (!line.trim()) return <div key={i} style={{ height: 4 }} />;
      return (
        <p key={i} style={{ fontSize: 12, color: "#333", marginBottom: 3, lineHeight: 1.7 }}>
          {line}
        </p>
      );
    });
  };

  return (
    <div
      className="print-area"
      style={{
        display: "none",
        fontFamily: "'Apple SD Gothic Neo', '맑은 고딕', sans-serif",
        background: "white",
        padding: "0",
      }}
    >
      {/* ── 헤더 ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "3px solid #2BAE9A", paddingBottom: 16, marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {logo ? (
            <img src={logo} alt="로고" style={{ height: 48, objectFit: "contain" }} />
          ) : (
            <div style={{
              width: 48, height: 48, background: "#2BAE9A", borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: "bold", fontSize: 20,
            }}>
              🌲
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontWeight: "bold", fontSize: 16, color: "#1a1a1a" }}>
              지혜의숲 독서논술
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#666" }}>월간 학습 리포트</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: "bold", color: "#2BAE9A" }}>{monthLabel}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888" }}>
            {new Date().toLocaleDateString("ko-KR")} 발행
          </p>
        </div>
      </div>

      {/* ── 학생 정보 ── */}
      <div style={{
        background: "#F5F3F0", borderRadius: 12, padding: "14px 20px",
        marginBottom: 24, display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: "#2BAE9A",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: "bold", fontSize: 20, flexShrink: 0,
        }}>
          {student.name.charAt(0)}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 18, fontWeight: "bold", color: "#1a1a1a" }}>
            {student.name}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#666" }}>
            {student.grade}{student.class ? ` · ${student.class}` : ""}
            {scheduleEntry ? ` · ${scheduleEntry.title} (${scheduleEntry.day}요일 ${scheduleEntry.startTime}–${scheduleEntry.endTime})` : ""}
          </p>
        </div>
      </div>

      {/* ── 섹션 1: 커리큘럼 진도 ── */}
      <div style={{ marginBottom: 20, breakInside: "avoid" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
          borderLeft: "4px solid #2BAE9A", paddingLeft: 10,
        }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: "bold", color: "#1a1a1a" }}>
            1. 이달 수업 커리큘럼 진도
          </p>
        </div>
        {currNotes.length === 0 ? (
          <p style={{ fontSize: 12, color: "#aaa", paddingLeft: 14 }}>수업 기록 없음</p>
        ) : (
          <div style={{ paddingLeft: 14 }}>
            {currNotes.map((n, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                <span style={{
                  flexShrink: 0, fontSize: 11, fontWeight: "bold",
                  color: "#2BAE9A", background: "#eef9f7",
                  padding: "2px 7px", borderRadius: 6, whiteSpace: "nowrap",
                }}>
                  {fmtDate(n.date)}
                </span>
                <span style={{ fontSize: 12, color: "#333", lineHeight: 1.6 }}>{n.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #eee", marginBottom: 20 }} />

      {/* ── 섹션 2: 출석률 ── */}
      <div style={{ marginBottom: 20, breakInside: "avoid" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
          borderLeft: "4px solid #3B82F6", paddingLeft: 10,
        }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: "bold", color: "#1a1a1a" }}>
            2. 이달 출석 현황
          </p>
        </div>
        {attStats.total === 0 ? (
          <p style={{ fontSize: 12, color: "#aaa", paddingLeft: 14 }}>출석 기록 없음</p>
        ) : (
          <div style={{ paddingLeft: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  height: 10, background: "#f0f0f0", borderRadius: 5, overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", borderRadius: 5,
                    background: attRate >= 90 ? "#22c55e" : attRate >= 70 ? "#2BAE9A" : "#f59e0b",
                    width: `${attRate}%`,
                  }} />
                </div>
              </div>
              <span style={{ fontSize: 18, fontWeight: "bold", color: "#2BAE9A", flexShrink: 0 }}>
                {attRate}%
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "출석", val: attStats.present, color: "#16a34a", bg: "#f0fdf4" },
                { label: "결석", val: attStats.absent,  color: "#dc2626", bg: "#fef2f2" },
                { label: "지각", val: attStats.late,    color: "#d97706", bg: "#fffbeb" },
                ...(attStats.others > 0 ? [{ label: "기타", val: attStats.others, color: "#6b7280", bg: "#f9fafb" }] : []),
              ].map(({ label, val, color, bg }) => (
                <span key={label} style={{
                  fontSize: 11, fontWeight: "bold", padding: "3px 10px",
                  borderRadius: 8, background: bg, color,
                }}>
                  {label} {val}회
                </span>
              ))}
              <span style={{ fontSize: 11, color: "#888", alignSelf: "center" }}>
                (총 {attStats.total}회 기록)
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #eee", marginBottom: 20 }} />

      {/* ── 섹션 3: 과제 현황 ── */}
      <div style={{ marginBottom: 20, breakInside: "avoid" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
          borderLeft: "4px solid #8B5CF6", paddingLeft: 10,
        }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: "bold", color: "#1a1a1a" }}>
            3. 이달 과제 현황
          </p>
        </div>
        {myAssignments.length === 0 ? (
          <p style={{ fontSize: 12, color: "#aaa", paddingLeft: 14 }}>이달 과제 없음</p>
        ) : (
          <div style={{ paddingLeft: 14 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 12, fontWeight: "bold", padding: "3px 10px",
                borderRadius: 8, background: "#eef9f7", color: "#1a8a78",
              }}>
                총 {myAssignments.length}개
              </span>
              <span style={{
                fontSize: 12, padding: "3px 10px", borderRadius: 8,
                background: "#f0fdf4", color: "#16a34a",
              }}>
                첨삭완료 {feedbackCount}개
              </span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F5F3F0" }}>
                  <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: "600", color: "#555", borderRadius: "4px 0 0 4px" }}>유형</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: "600", color: "#555" }}>과제명</th>
                  <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: "600", color: "#555" }}>날짜</th>
                  <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: "600", color: "#555", borderRadius: "0 4px 4px 0" }}>첨삭</th>
                </tr>
              </thead>
              <tbody>
                {myAssignments.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "5px 8px", color: "#555" }}>{a.type}</td>
                    <td style={{ padding: "5px 8px", color: "#222" }}>{a.title}</td>
                    <td style={{ padding: "5px 8px", textAlign: "center", color: "#888" }}>{fmtDate(a.assignedDate)}</td>
                    <td style={{ padding: "5px 8px", textAlign: "center", color: a.feedback ? "#16a34a" : "#ccc", fontWeight: a.feedback ? "bold" : "normal" }}>
                      {a.feedback ? "✓" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #eee", marginBottom: 20 }} />

      {/* ── 섹션 4: 선생님 코멘트 ── */}
      {comment && (
        <>
          <div style={{ marginBottom: 20, breakInside: "avoid" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
              borderLeft: "4px solid #F59E0B", paddingLeft: 10,
            }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: "bold", color: "#1a1a1a" }}>
                4. 선생님 코멘트
              </p>
            </div>
            <div style={{
              paddingLeft: 14,
              background: "#FFFBEB", borderRadius: 8, padding: "12px 16px",
              borderLeft: "none",
            }}>
              <p style={{ margin: 0, fontSize: 12, color: "#333", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {comment}
              </p>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #eee", marginBottom: 20 }} />
        </>
      )}

      {/* ── 섹션 5: AI 성장 평가 ── */}
      {growth && (
        <div style={{ marginBottom: 20, breakInside: "avoid" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
            borderLeft: "4px solid #22c55e", paddingLeft: 10,
          }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: "bold", color: "#1a1a1a" }}>
              5. AI 성장 평가
            </p>
          </div>
          <div style={{
            paddingLeft: 14,
            background: "#f0fdf4", borderRadius: 8, padding: "12px 16px",
          }}>
            {renderGrowthPrint(growth)}
          </div>
        </div>
      )}

      {/* ── 푸터 ── */}
      <div style={{
        borderTop: "2px solid #E3DED8", marginTop: 32, paddingTop: 12,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>
          지혜의숲 독서논술 · 월간 학습 리포트
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>
          발행일: {new Date().toLocaleDateString("ko-KR")}
        </p>
      </div>
    </div>
  );
}

// ── 개별 학생 리포트 화면 ──────────────────────────────────────
function StudentReport({ student, monthStr, monthLabel, logo, onBack }) {
  const { assignments, attendance, schedule, weekNotes, reportData, saveReportComment, saveReportGrowth, apiKey } = useApp();

  const myAssignments = useMemo(() =>
    assignments
      .filter((a) => a.studentId === student.id && a.assignedDate?.startsWith(monthStr))
      .sort((a, b) => a.assignedDate.localeCompare(b.assignedDate)),
    [assignments, student.id, monthStr]
  );
  const feedbackCount = myAssignments.filter((a) => a.feedback).length;

  const attStats   = useAttStats(attendance, student.id, monthStr);
  const currNotes  = useCurrNotes(weekNotes, student.scheduleId ? String(student.scheduleId) : null, monthStr);
  const scheduleEntry = schedule.find(
    (s) => s.id === student.scheduleId || s.id === Number(student.scheduleId)
  );

  const rdKey = `${student.id}_${monthStr}`;
  const [comment, setComment] = useState(() => reportData[rdKey]?.comment || "");
  const handleComment = (v) => { setComment(v); saveReportComment(student.id, monthStr, v); };

  const [growth, setGrowth] = useState(() => reportData[rdKey]?.growth || "");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  const handleGenerate = async () => {
    if (!apiKey) { setGenError("API 키가 설정되지 않았습니다."); return; }
    setGenerating(true);
    setGenError("");
    try {
      const weekNotesText = currNotes.map((n) => `• ${fmtDate(n.date)} - ${n.text}`).join("\n");
      const feedbacks = myAssignments.filter((a) => a.feedback).map((a) => a.feedback);
      const attRate = attStats.total > 0
        ? `출석 ${attStats.present}회 / 총 ${attStats.total}회 (${Math.round(attStats.present / attStats.total * 100)}%)`
        : "기록 없음";

      const result = await generateGrowthReport({
        apiKey,
        studentName: student.name, grade: student.grade, className: student.class,
        assignments: myAssignments, feedbacks, weekNotesText, attendanceRate: attRate, monthLabel,
      });
      setGrowth(result);
      saveReportGrowth(student.id, monthStr, result);
    } catch (e) {
      setGenError(e.message === "API_KEY_NOT_SET" ? "API 키가 설정되지 않았습니다." : e.message);
    } finally {
      setGenerating(false);
    }
  };

  const attRate = attStats.total > 0 ? Math.round(attStats.present / attStats.total * 100) : null;

  return (
    <>
      {/* ── 화면용 ── */}
      <div className="no-print flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="bg-white border-b border-[#E3DED8] px-4 md:px-6 py-3 shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 shrink-0">← 목록</button>
            <div className="w-px h-4 bg-gray-200 shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-bold text-gray-800 truncate">{student.name} 학생 리포트</p>
              <p className="text-xs text-gray-400 truncate">{monthLabel} · {student.grade} · {student.class}</p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-[#2BAE9A] hover:bg-[#249e8c] text-white rounded-xl text-sm font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            PDF 저장
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto bg-[#F5F3F0] p-4 md:p-6">
          <div className="max-w-2xl space-y-4">

            {/* ── 1. 커리큘럼 진도 ── */}
            <section className="bg-white rounded-2xl border border-[#E3DED8] shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F0EDE9] flex items-center gap-2 bg-teal-50/50">
                <span className="w-5 h-5 rounded-md bg-[#2BAE9A] text-white text-xs flex items-center justify-center font-bold shrink-0">1</span>
                <h3 className="text-sm font-bold text-gray-800">이달 수업 커리큘럼 진도</h3>
              </div>
              <div className="p-5">
                {currNotes.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    이달 수업 기록이 없습니다.
                    <span className="text-[#2BAE9A] ml-1">반별 진도 현황</span>에서 날짜별 수업 내용을 입력하면 여기에 표시됩니다.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {currNotes.map((n, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="shrink-0 text-xs font-semibold text-[#2BAE9A] bg-teal-50 px-2.5 py-1 rounded-lg">
                          {fmtDate(n.date)}
                        </span>
                        <span className="text-sm text-gray-700 leading-relaxed pt-0.5">{n.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* ── 2. 출석률 ── */}
            <section className="bg-white rounded-2xl border border-[#E3DED8] shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F0EDE9] flex items-center gap-2 bg-blue-50/50">
                <span className="w-5 h-5 rounded-md bg-blue-500 text-white text-xs flex items-center justify-center font-bold shrink-0">2</span>
                <h3 className="text-sm font-bold text-gray-800">이달 출석 현황</h3>
              </div>
              <div className="p-5">
                {attStats.total === 0 ? (
                  <p className="text-sm text-gray-400">이달 출석 기록이 없습니다. 출석부에서 기록을 추가해주세요.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-gray-500">출석률</span>
                          <span className="text-sm font-bold text-[#1a8a78]">{attRate}%</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${attRate >= 90 ? "bg-green-500" : attRate >= 70 ? "bg-[#2BAE9A]" : "bg-amber-400"}`}
                            style={{ width: `${attRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-[#1a8a78]">
                          {attStats.present}
                          <span className="text-base font-normal text-gray-400">/{attStats.total}</span>
                        </p>
                        <p className="text-xs text-gray-400">출석/전체</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "출석", val: attStats.present, cls: "bg-green-50 text-green-700" },
                        { label: "결석", val: attStats.absent,  cls: "bg-red-50 text-red-600" },
                        { label: "지각", val: attStats.late,    cls: "bg-amber-50 text-amber-700" },
                        ...(attStats.others > 0 ? [{ label: "기타", val: attStats.others, cls: "bg-gray-50 text-gray-600" }] : []),
                      ].map(({ label, val, cls }) => (
                        <span key={label} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${cls}`}>
                          {label} {val}회
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── 3. 과제 현황 ── */}
            <section className="bg-white rounded-2xl border border-[#E3DED8] shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F0EDE9] flex items-center gap-2 bg-purple-50/50">
                <span className="w-5 h-5 rounded-md bg-purple-500 text-white text-xs flex items-center justify-center font-bold shrink-0">3</span>
                <h3 className="text-sm font-bold text-gray-800">이달 과제 현황</h3>
              </div>
              <div className="p-5">
                {myAssignments.length === 0 ? (
                  <p className="text-sm text-gray-400">이달 제출한 과제가 없습니다.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-[#eef9f7] text-[#1a8a78] text-sm font-bold rounded-xl">
                        총 {myAssignments.length}개
                      </span>
                      {ASSIGNMENT_TYPES.map((t) => {
                        const n = myAssignments.filter((a) => a.type === t).length;
                        if (!n) return null;
                        return (
                          <span key={t} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${TYPE_COLORS[t]}`}>
                            {t} {n}개
                          </span>
                        );
                      })}
                      <span className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-xl">
                        첨삭완료 {feedbackCount}/{myAssignments.length}
                      </span>
                    </div>
                    <ul className="divide-y divide-gray-50">
                      {myAssignments.map((a) => (
                        <li key={a.id} className="flex items-center gap-2 py-2.5">
                          <span className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold ${TYPE_COLORS[a.type] || "bg-gray-100 text-gray-500"}`}>
                            {a.type}
                          </span>
                          <span className="flex-1 text-sm text-gray-700 truncate">{a.title}</span>
                          <span className="shrink-0 text-xs text-gray-400">{fmtDate(a.assignedDate)}</span>
                          <span className={`shrink-0 text-xs font-semibold ${a.feedback ? "text-green-600" : "text-gray-300"}`}>
                            {a.feedback ? "✓ 첨삭" : "미완"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            {/* ── 4. 선생님 코멘트 ── */}
            <section className="bg-white rounded-2xl border border-[#E3DED8] shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F0EDE9] flex items-center gap-2 bg-amber-50/50">
                <span className="w-5 h-5 rounded-md bg-amber-500 text-white text-xs flex items-center justify-center font-bold shrink-0">4</span>
                <h3 className="text-sm font-bold text-gray-800">선생님 코멘트</h3>
              </div>
              <div className="p-5">
                <textarea
                  value={comment}
                  onChange={(e) => handleComment(e.target.value)}
                  placeholder="학부모에게 전달할 코멘트를 입력하세요.&#10;&#10;예) 이번 달 OO이는 에세이 쓰기에서 큰 발전을 보였습니다..."
                  rows={5}
                  className="w-full px-4 py-3 border border-[#E3DED8] rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] resize-none bg-[#F5F3F0] leading-relaxed"
                />
                <p className="text-xs text-gray-400 mt-1.5">✓ 자동 저장됩니다</p>
              </div>
            </section>

            {/* ── 5. AI 성장 평가 ── */}
            <section className="bg-white rounded-2xl border border-[#E3DED8] shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F0EDE9] flex items-center justify-between bg-green-50/50">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-green-500 text-white text-xs flex items-center justify-center font-bold shrink-0">5</span>
                  <h3 className="text-sm font-bold text-gray-800">AI 성장 평가</h3>
                </div>
                {growth && (
                  <button
                    onClick={() => { setGrowth(""); saveReportGrowth(student.id, monthStr, ""); }}
                    className="text-xs text-gray-400 hover:text-red-500 transition"
                  >
                    삭제
                  </button>
                )}
              </div>
              <div className="p-5">
                {!apiKey && !growth && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                    <p className="text-sm font-semibold text-amber-800">Claude API 키가 필요합니다</p>
                    <p className="text-xs text-amber-600 mt-0.5">과제 관리 → AI 첨삭 패널에서 API 키를 먼저 등록해주세요</p>
                  </div>
                )}
                {growth ? (
                  <div className="space-y-3">
                    <div className="bg-[#eef9f7] rounded-xl p-4">
                      <RenderMd text={growth} />
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="w-full py-2 rounded-xl text-xs font-medium text-[#1a8a78] hover:bg-[#eef9f7] border border-[#2BAE9A]/30 transition disabled:opacity-50"
                    >
                      {generating ? "생성 중..." : "↺ 다시 생성"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !apiKey || myAssignments.length === 0}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-[#F5F3F0] disabled:text-gray-400 disabled:cursor-not-allowed text-white"
                  >
                    {generating ? "생성 중입니다..." :
                     myAssignments.length === 0 ? "이달 과제가 없습니다" :
                     !apiKey ? "API 키를 먼저 등록하세요" :
                     "✨ AI 성장 평가 자동 생성"}
                  </button>
                )}
                {genError && (
                  <p className="text-red-500 text-xs mt-3 bg-red-50 rounded-lg px-3 py-2">{genError}</p>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* ── 인쇄 전용 리포트 ── */}
      <PrintableReport
        logo={logo}
        student={student}
        monthLabel={monthLabel}
        scheduleEntry={scheduleEntry}
        currNotes={currNotes}
        attStats={attStats}
        myAssignments={myAssignments}
        feedbackCount={feedbackCount}
        comment={comment}
        growth={growth}
      />
    </>
  );
}

// ── 개요 뷰 학생 카드 ─────────────────────────────────────────
function StudentOverviewCard({ report, monthStr, onClick }) {
  const { attendance } = useApp();
  const attStats = useAttStats(attendance, report.id, monthStr);
  const attRate = attStats.total > 0 ? Math.round(attStats.present / attStats.total * 100) : null;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-[#E3DED8] p-4 shadow-sm hover:shadow-md hover:border-[#2BAE9A] transition text-left w-full group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${avatarColor(report.id)} flex items-center justify-center text-white font-bold shrink-0`}>
          {report.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm group-hover:text-[#1a8a78] transition truncate">{report.name}</p>
          <p className="text-xs text-gray-400 truncate">{report.grade} · {report.class}</p>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-[#2BAE9A] transition shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[#F5F3F0] rounded-xl p-2">
          <p className="text-lg font-bold text-[#1a8a78]">{report.totalCount}</p>
          <p className="text-[10px] text-gray-400">과제</p>
        </div>
        <div className="bg-[#F5F3F0] rounded-xl p-2">
          <p className="text-lg font-bold text-green-600">{report.feedbackCount}</p>
          <p className="text-[10px] text-gray-400">첨삭완료</p>
        </div>
        <div className="bg-[#F5F3F0] rounded-xl p-2">
          <p className={`text-lg font-bold ${attRate !== null ? (attRate >= 90 ? "text-green-600" : attRate >= 70 ? "text-[#1a8a78]" : "text-amber-600") : "text-gray-300"}`}>
            {attRate !== null ? `${attRate}%` : "—"}
          </p>
          <p className="text-[10px] text-gray-400">출석률</p>
        </div>
      </div>
    </button>
  );
}

// ── 메인 ─────────────────────────────────────────────────────
export default function ReportsPage() {
  const { students, assignments, setCurrentPage, logo, saveLogo } = useApp();

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const monthStr   = `${year}-${String(month).padStart(2, "0")}`;
  const monthLabel = `${year}년 ${month}월`;

  const prevMonth = () => { if (month === 1) { setYear((y) => y - 1); setMonth(12); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear((y) => y + 1); setMonth(1); } else setMonth((m) => m + 1); };

  const handleLogoChange = (b64) => { saveLogo(b64); };

  const monthlyAssignments = useMemo(
    () => assignments.filter((a) => a.assignedDate?.startsWith(monthStr)),
    [assignments, monthStr]
  );

  const studentReports = useMemo(() =>
    students.map((s) => {
      const sA = monthlyAssignments.filter((a) => a.studentId === s.id);
      return { ...s, assignments: sA, totalCount: sA.length, feedbackCount: sA.filter((a) => a.feedback).length };
    }).sort((a, b) => b.totalCount - a.totalCount || a.name.localeCompare(b.name, "ko")),
    [students, monthlyAssignments]
  );

  const activeReports   = studentReports.filter((r) => r.totalCount > 0);
  const inactiveReports = studentReports.filter((r) => r.totalCount === 0);

  const totalStats = useMemo(() => ({
    total: monthlyAssignments.length,
    feedbackDone: monthlyAssignments.filter((a) => a.feedback).length,
    activeStudents: activeReports.length,
  }), [monthlyAssignments, activeReports]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  if (selectedStudent) {
    return (
      <>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-area { display: block !important; }
            body { margin: 0; background: white; }
            @page { size: A4; margin: 15mm 18mm; }
          }
          .print-area { display: none; }
        `}</style>
        <StudentReport
          student={selectedStudent}
          monthStr={monthStr}
          monthLabel={monthLabel}
          logo={logo}
          onBack={() => setSelectedStudentId(null)}
        />
      </>
    );
  }

  // ── 개요 뷰 ─────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-auto bg-[#F5F3F0]">
      <div className="p-4 md:p-6 lg:p-8">

        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl md:text-2xl text-gray-800">월별 리포트</h1>
            <p className="text-gray-500 text-sm mt-0.5">학생을 선택해 상세 리포트를 확인하고 PDF로 저장하세요</p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <LogoUploader logo={logo} onChange={handleLogoChange} />
            <p className="text-xs text-gray-400">로고는 PDF 리포트에 자동 포함됩니다</p>
          </div>
        </div>

        {/* 월 네비게이터 */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E3DED8] px-5 py-3 mb-5 shadow-sm">
          <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F5F3F0] transition text-gray-500 text-lg">‹</button>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{monthLabel}</p>
            <p className="text-xs text-gray-400">
              {totalStats.activeStudents}명 활동 · 과제 {totalStats.total}개 · 첨삭 {totalStats.feedbackDone}개
            </p>
          </div>
          <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F5F3F0] transition text-gray-500 text-lg">›</button>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "전체 과제", value: totalStats.total, color: "text-[#1a8a78]", icon: "📝", sub: `${totalStats.activeStudents}명 활동` },
            { label: "첨삭 완료", value: totalStats.feedbackDone, color: "text-green-600", icon: "✨", sub: totalStats.total > 0 ? `완료율 ${Math.round(totalStats.feedbackDone / totalStats.total * 100)}%` : "—" },
            { label: "활동 학생", value: totalStats.activeStudents, color: "text-blue-600", icon: "👥", sub: `미활동 ${students.length - totalStats.activeStudents}명` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#E3DED8] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400">{s.label}</p>
                <span className="text-base">{s.icon}</span>
              </div>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* 학생 목록 */}
        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-5xl mb-4">👥</p>
            <p className="text-lg font-semibold text-gray-600 mb-1">등록된 학생이 없습니다</p>
            <button onClick={() => setCurrentPage("students")}
              className="mt-3 px-5 py-2.5 bg-[#2BAE9A] text-white rounded-xl text-sm font-medium hover:bg-[#249e8c] transition">
              학생 추가하러 가기
            </button>
          </div>
        ) : (
          <>
            {/* 활동 학생 */}
            {activeReports.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-600 mb-3">
                  이달 활동 학생 <span className="font-normal text-gray-400">({activeReports.length}명)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {activeReports.map((r) => (
                    <StudentOverviewCard
                      key={r.id}
                      report={r}
                      monthStr={monthStr}
                      onClick={() => setSelectedStudentId(r.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 미활동 학생 */}
            {inactiveReports.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-3">
                  이달 과제 없음 <span className="text-gray-300">({inactiveReports.length}명)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {inactiveReports.map((r) => (
                    <StudentOverviewCard
                      key={r.id}
                      report={r}
                      monthStr={monthStr}
                      onClick={() => setSelectedStudentId(r.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
