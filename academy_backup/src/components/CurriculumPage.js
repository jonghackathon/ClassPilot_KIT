import React, { useState } from "react";
import { useApp } from "../context/AppContext";

function LessonModal({ lesson, onSave, onClose }) {
  const isEdit = !!lesson?.id;
  const [form, setForm] = useState({
    number: lesson?.number ?? "",
    title: lesson?.title ?? "",
    book: lesson?.book ?? "",
    theme: lesson?.theme ?? "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-800">{isEdit ? "차시 수정" : "차시 추가"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">차시 번호</label>
            <input value={form.number} onChange={(e) => set("number", e.target.value)}
              placeholder="예: 1-1, 901-1, 1차시"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">제목 *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)}
              placeholder="수업 제목"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A]" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">도서</label>
            <input value={form.book} onChange={(e) => set("book", e.target.value)}
              placeholder="교재/도서명"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">기법/주제</label>
            <input value={form.theme} onChange={(e) => set("theme", e.target.value)}
              placeholder="학습 기법 또는 주제"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A]" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">취소</button>
          <button
            onClick={() => { if (form.title.trim()) onSave({ ...form, id: lesson?.id }); }}
            disabled={!form.title.trim()}
            className="flex-1 py-2 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-teal-200 text-white rounded-xl text-sm font-semibold transition">
            {isEdit ? "수정 완료" : "추가"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClassModal({ cls, onSave, onClose }) {
  const isEdit = !!cls;
  const [name, setName] = useState(cls?.name ?? "");
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-800">{isEdit ? "수업 이름 수정" : "수업 추가"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="예: 초4 - 친절한 설명 Logos"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A]"
          autoFocus />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">취소</button>
          <button
            onClick={() => { if (name.trim()) onSave(name.trim()); }}
            disabled={!name.trim()}
            className="flex-1 py-2 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-teal-200 text-white rounded-xl text-sm font-semibold transition">
            {isEdit ? "수정" : "추가"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StageModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-800">단계 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="예: 1단계 문화&역사"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A]"
          autoFocus />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">취소</button>
          <button
            onClick={() => { if (name.trim()) onSave(name.trim()); }}
            disabled={!name.trim()}
            className="flex-1 py-2 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-teal-200 text-white rounded-xl text-sm font-semibold transition">
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CurriculumPage() {
  const { curriculum, addCurriculumClass, updateCurriculumClass, deleteCurriculumClass,
    addCurriculumStage, addCurriculumLesson, updateCurriculumLesson, deleteCurriculumLesson } = useApp();

  const [selectedId, setSelectedId] = useState(curriculum[0]?.id ?? null);
  const [expandedStages, setExpandedStages] = useState({});
  const [modal, setModal] = useState(null);
  // modal: null | { type: "class"|"classEdit"|"stage"|"lesson"|"lessonEdit", classId?, stageId?, lesson? }

  const selectedClass = curriculum.find((c) => c.id === selectedId);

  const toggleStage = (stageId) =>
    setExpandedStages((p) => ({ ...p, [stageId]: !p[stageId] }));

  // initialize: if selectedId is null or not found, pick first
  const effectiveSelected = selectedClass ?? curriculum[0];

  const totalLessons = (cls) => cls.stages.reduce((s, st) => s + st.lessons.length, 0);

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#F5F3F0]">
      {/* 좌측: 수업 목록 */}
      <aside className="w-full md:w-60 shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-100 flex flex-col max-h-[35vh] md:max-h-none">
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700">수업 목록</h2>
          <button
            onClick={() => setModal({ type: "class" })}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#eef9f7] text-[#1a8a78] hover:bg-teal-100 text-sm font-bold transition"
          >+</button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {curriculum.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedId(cls.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition text-sm ${
                selectedId === cls.id
                  ? "bg-[#eef9f7] text-[#1a8a78] font-semibold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <p className="truncate">{cls.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-normal">{totalLessons(cls)}차시</p>
            </button>
          ))}
        </nav>
      </aside>

      {/* 우측: 수업 상세 */}
      <div className="flex-1 overflow-y-auto">
        {!effectiveSelected ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-gray-400 text-sm">수업을 추가해주세요</p>
          </div>
        ) : (
          <div className="p-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-800">{effectiveSelected.name}</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {effectiveSelected.stages.length}개 단계 · {totalLessons(effectiveSelected)}차시
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setModal({ type: "classEdit", cls: effectiveSelected })}
                  className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50 transition"
                >이름 수정</button>
                <button
                  onClick={() => setModal({ type: "stage", classId: effectiveSelected.id })}
                  className="px-3 py-1.5 border border-teal-200 text-[#1a8a78] rounded-xl text-xs hover:bg-[#eef9f7] transition"
                >+ 단계 추가</button>
                <button
                  onClick={() => {
                    if (window.confirm(`"${effectiveSelected.name}" 수업을 삭제할까요?`)) {
                      deleteCurriculumClass(effectiveSelected.id);
                      setSelectedId(curriculum.find((c) => c.id !== effectiveSelected.id)?.id ?? null);
                    }
                  }}
                  className="px-3 py-1.5 border border-red-200 text-red-500 rounded-xl text-xs hover:bg-red-50 transition"
                >삭제</button>
              </div>
            </div>

            {/* 단계 + 차시 */}
            <div className="space-y-4">
              {effectiveSelected.stages.map((stage) => {
                const isOpen = expandedStages[stage.id] !== false; // default open
                return (
                  <div key={stage.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {/* 단계 헤더 */}
                    <div className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => toggleStage(stage.id)}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-700">{stage.name}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{stage.lessons.length}차시</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setModal({ type: "lesson", classId: effectiveSelected.id, stageId: stage.id }); }}
                          className="px-2.5 py-1 bg-[#eef9f7] text-[#1a8a78] rounded-lg text-xs font-medium hover:bg-teal-100 transition"
                        >+ 차시</button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`"${stage.name}" 단계를 삭제할까요?`))
                              updateCurriculumClass(effectiveSelected.id, {
                                stages: effectiveSelected.stages.filter((s) => s.id !== stage.id),
                              });
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition text-xs"
                        >✕</button>
                        <span className={`text-gray-400 transition-transform ${isOpen ? "" : "-rotate-90"} text-xs`}>▾</span>
                      </div>
                    </div>

                    {/* 차시 목록 */}
                    {isOpen && (
                      <div className="divide-y divide-gray-50">
                        {stage.lessons.length === 0 ? (
                          <p className="px-5 py-4 text-xs text-gray-400 text-center">차시가 없습니다</p>
                        ) : (
                          stage.lessons.map((lesson, idx) => (
                            <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition group">
                              <span className="w-6 h-6 rounded-full bg-[#eef9f7] text-[#2BAE9A] text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div className="w-16 shrink-0">
                                <span className="text-xs text-gray-400 font-mono">{lesson.number}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{lesson.title}</p>
                              </div>
                              {lesson.book && (
                                <span className="text-xs text-gray-400 truncate max-w-[120px] shrink-0">📖 {lesson.book}</span>
                              )}
                              {lesson.theme && (
                                <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg truncate max-w-[100px] shrink-0">{lesson.theme}</span>
                              )}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                                <button
                                  onClick={() => setModal({ type: "lessonEdit", classId: effectiveSelected.id, stageId: stage.id, lesson })}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-400 text-xs"
                                >✏️</button>
                                <button
                                  onClick={() => deleteCurriculumLesson(effectiveSelected.id, stage.id, lesson.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 text-xs"
                                >🗑️</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 모달들 */}
      {modal?.type === "class" && (
        <ClassModal
          onSave={(name) => {
            const newCls = addCurriculumClass(name);
            setSelectedId(newCls.id);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "classEdit" && (
        <ClassModal
          cls={modal.cls}
          onSave={(name) => { updateCurriculumClass(modal.cls.id, { name }); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "stage" && (
        <StageModal
          onSave={(name) => { addCurriculumStage(modal.classId, name); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {(modal?.type === "lesson" || modal?.type === "lessonEdit") && (
        <LessonModal
          lesson={modal.lesson}
          onSave={(lessonData) => {
            if (modal.type === "lessonEdit") {
              updateCurriculumLesson(modal.classId, modal.stageId, modal.lesson.id, lessonData);
            } else {
              addCurriculumLesson(modal.classId, modal.stageId, lessonData);
            }
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
