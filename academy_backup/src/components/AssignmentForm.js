import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";

export const ASSIGNMENT_TYPES = ["에세이", "독서과제", "어휘"];

const TYPE_COLORS = {
  에세이: "bg-teal-50 text-teal-700",
  독서과제: "bg-blue-50 text-blue-700",
  어휘: "bg-emerald-50 text-emerald-700",
};

export { TYPE_COLORS };

// ── 커리큘럼 차시 다중 선택 패널 ──────────────────────────────
function LessonPicker({ curriculum, onSelect, onClose }) {
  const [selectedClassId, setSelectedClassId] = useState(curriculum[0]?.id ?? null);
  const [expandedStages, setExpandedStages] = useState({});
  const [selectedLessons, setSelectedLessons] = useState([]);

  const selectedClass = curriculum.find((c) => c.id === selectedClassId);

  const toggleStage = (id) =>
    setExpandedStages((p) => ({ ...p, [id]: !p[id] }));

  const isChecked = (lessonId) => selectedLessons.some((l) => l.lesson.id === lessonId);

  const toggleLesson = (lesson, cls, stage) => {
    if (isChecked(lesson.id)) {
      setSelectedLessons((prev) => prev.filter((l) => l.lesson.id !== lesson.id));
    } else {
      setSelectedLessons((prev) => [...prev, { lesson, className: cls.name, stageName: stage.name }]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="px-5 py-4 border-b border-[#E3DED8] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-800">커리큘럼에서 선택</h3>
            <p className="text-xs text-gray-400 mt-0.5">여러 차시를 한꺼번에 선택할 수 있어요</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 수업 목록 */}
          <div className="w-44 shrink-0 border-r border-[#E3DED8] overflow-y-auto p-2 space-y-1">
            {curriculum.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition ${
                  selectedClassId === cls.id
                    ? "bg-[#eef9f7] text-[#1a8a78] font-semibold"
                    : "text-gray-600 hover:bg-[#F5F3F0]"
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>

          {/* 차시 목록 (체크박스) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!selectedClass ? (
              <p className="text-sm text-gray-400 text-center py-8">수업을 선택해주세요</p>
            ) : (
              selectedClass.stages.map((stage) => {
                const isOpen = expandedStages[stage.id] !== false;
                return (
                  <div key={stage.id} className="border border-[#E3DED8] rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleStage(stage.id)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-[#F5F3F0] hover:bg-[#EDEAE5] transition text-left"
                    >
                      <span className="text-xs font-bold text-gray-600">{stage.name}</span>
                      <span className={`text-gray-400 text-xs transition-transform ${isOpen ? "" : "-rotate-90"}`}>▾</span>
                    </button>
                    {isOpen && (
                      <div className="divide-y divide-[#F0EDE9]">
                        {stage.lessons.map((lesson) => {
                          const checked = isChecked(lesson.id);
                          return (
                            <label
                              key={lesson.id}
                              className={`w-full flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition ${
                                checked ? "bg-[#eef9f7]" : "hover:bg-[#F5F3F0]"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleLesson(lesson, selectedClass, stage)}
                                className="mt-0.5 shrink-0 w-4 h-4 rounded accent-[#2BAE9A]"
                              />
                              <span className="text-xs text-gray-400 font-mono w-10 shrink-0 mt-0.5">{lesson.number}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${checked ? "text-[#1a8a78]" : "text-gray-800"}`}>
                                  {lesson.title}
                                </p>
                                <div className="flex gap-2 mt-0.5">
                                  {lesson.book && <span className="text-xs text-gray-400 truncate">📖 {lesson.book}</span>}
                                  {lesson.theme && <span className="text-xs text-amber-500">{lesson.theme}</span>}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 하단 완료 버튼 */}
        <div className="px-5 py-3 border-t border-[#E3DED8] flex items-center justify-between shrink-0 bg-[#F5F3F0] rounded-b-2xl">
          <span className="text-sm text-gray-500">
            {selectedLessons.length > 0
              ? <span className="text-[#1a8a78] font-semibold">{selectedLessons.length}개 선택됨</span>
              : "차시를 선택하세요"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 border border-[#E3DED8] bg-white rounded-xl hover:bg-[#EDEAE5] transition"
            >
              취소
            </button>
            <button
              onClick={() => selectedLessons.length > 0 && onSelect(selectedLessons)}
              disabled={selectedLessons.length === 0}
              className="px-4 py-2 text-sm font-semibold bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-teal-200 text-white rounded-xl transition"
            >
              {selectedLessons.length > 1 ? `${selectedLessons.length}개 과제 추가` : "선택 완료"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 과제 추가/수정 폼 ─────────────────────────────────────────
export default function AssignmentForm({ assignment, studentName, onSave, onClose }) {
  const { curriculum } = useApp();
  const isEdit = !!assignment;
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    title: "",
    type: ASSIGNMENT_TYPES[0],
    assignedDate: today,
    teacherNote: "",
  });
  const [lessonRefs, setLessonRefs] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (assignment) {
      setForm({
        title: assignment.title,
        type: assignment.type,
        assignedDate: assignment.assignedDate,
        teacherNote: assignment.teacherNote || "",
      });
    }
  }, [assignment]);

  const handleSelectLessons = (selections) => {
    setLessonRefs(selections);
    if (selections.length === 1) {
      setForm((f) => ({ ...f, title: selections[0].lesson.title }));
    } else {
      // 다중 선택 시 제목은 각 레슨 이름으로 자동 지정됨
      setForm((f) => ({ ...f, title: "" }));
    }
    setShowPicker(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (lessonRefs.length > 1) {
      onSave(lessonRefs.map((ref) => ({
        ...form,
        title: ref.lesson.title,
        curriculumName: ref.className,
      })));
    } else {
      if (!form.title.trim()) return;
      onSave({
        ...form,
        curriculumName: lessonRefs.length === 1 ? lessonRefs[0].className : (form.curriculumName || ""),
      });
    }
  };

  const canSubmit = lessonRefs.length > 1 || form.title.trim().length > 0;

  const inputCls = "w-full px-3 py-2.5 border border-[#E3DED8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-[#F5F3F0]";

  return (
    <>
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {isEdit ? "과제 수정" : "과제 추가"}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">{studentName}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 커리큘럼에서 선택 */}
            {!isEdit && curriculum.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="w-full flex items-center justify-between px-4 py-2.5 border border-dashed border-[#2BAE9A] bg-[#eef9f7] hover:bg-teal-50 rounded-xl text-sm transition"
                >
                  <span className="text-[#1a8a78] font-medium">커리큘럼에서 선택</span>
                  <span className="text-xs text-teal-400">여러 차시 동시 선택 가능</span>
                </button>

                {/* 단일 선택 표시 */}
                {lessonRefs.length === 1 && (
                  <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-amber-700 font-semibold truncate">
                        {lessonRefs[0].className} · {lessonRefs[0].stageName}
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        [{lessonRefs[0].lesson.number}]
                        {lessonRefs[0].lesson.book && ` 📖 ${lessonRefs[0].lesson.book}`}
                        {lessonRefs[0].lesson.theme && ` · ${lessonRefs[0].lesson.theme}`}
                      </p>
                    </div>
                    <button type="button" onClick={() => { setLessonRefs([]); setForm(f => ({ ...f, title: "" })); }}
                      className="text-amber-400 hover:text-amber-600 text-sm shrink-0">✕</button>
                  </div>
                )}

                {/* 다중 선택 표시 */}
                {lessonRefs.length > 1 && (
                  <div className="mt-2 bg-teal-50 border border-teal-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-teal-700">
                        {lessonRefs.length}개 차시 선택 → 과제 {lessonRefs.length}개 일괄 추가
                      </p>
                      <button type="button" onClick={() => setLessonRefs([])}
                        className="text-teal-400 hover:text-teal-600 text-xs">전체 해제</button>
                    </div>
                    <ul className="space-y-1 max-h-28 overflow-y-auto">
                      {lessonRefs.map((ref) => (
                        <li key={ref.lesson.id} className="flex items-center gap-1.5 text-xs text-teal-700">
                          <span className="text-teal-400">✓</span>
                          <span className="font-mono text-teal-400 shrink-0">{ref.lesson.number}</span>
                          <span className="truncate">{ref.lesson.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 제목 (단일 선택이거나 다중 미선택 시) */}
            {lessonRefs.length !== 1 || isEdit ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  과제 제목 {lessonRefs.length > 1 ? "" : "*"}
                </label>
                {lessonRefs.length > 1 ? (
                  <p className="text-xs text-gray-400 px-3 py-2 bg-[#F5F3F0] rounded-xl">
                    각 차시 제목으로 자동 입력됩니다
                  </p>
                ) : (
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="예: 에세이 3회차, 어린왕자 독서과제"
                    className={inputCls}
                    autoFocus={isEdit}
                  />
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">과제 제목 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="예: 에세이 3회차, 어린왕자 독서과제"
                  className={inputCls}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">과제 유형</label>
                <div className="flex flex-wrap gap-1.5">
                  {ASSIGNMENT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        form.type === t
                          ? TYPE_COLORS[t] + " ring-2 ring-offset-1 ring-[#2BAE9A]"
                          : "bg-[#F5F3F0] text-gray-500 hover:bg-[#EDEAE5]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                <input
                  type="date"
                  value={form.assignedDate}
                  onChange={(e) => setForm({ ...form, assignedDate: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">선생님 메모</label>
              <textarea
                value={form.teacherNote}
                onChange={(e) => setForm({ ...form, teacherNote: e.target.value })}
                placeholder="과제 관련 메모 (선택)"
                rows={2}
                className={`${inputCls} resize-none`}
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
                disabled={!canSubmit}
                className="flex-1 py-2.5 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-teal-200 text-white rounded-xl text-sm font-medium transition"
              >
                {lessonRefs.length > 1
                  ? `${lessonRefs.length}개 과제 추가`
                  : isEdit ? "수정 완료" : "추가"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showPicker && (
        <LessonPicker
          curriculum={curriculum}
          onSelect={handleSelectLessons}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
