import React, { useState, useEffect, useMemo } from "react";
import { GRADES } from "../data/sampleData";
import { useApp } from "../context/AppContext";

export default function StudentModal({ student, onSave, onClose }) {
  const { students, schedule } = useApp();
  const isEdit = !!student;

  const [form, setForm] = useState({
    name: "",
    grade: GRADES[0],
    class: "",
    scheduleId: null,
    memo: "",
  });
  const [nameError, setNameError] = useState("");
  const [customClass, setCustomClass] = useState("");

  const scheduleEntries = useMemo(() =>
    [...schedule].sort((a, b) => {
      const dayDiff = ["월","화","수","목","금","토"].indexOf(a.day) - ["월","화","수","목","금","토"].indexOf(b.day);
      return dayDiff !== 0 ? dayDiff : a.startTime.localeCompare(b.startTime);
    }),
    [schedule]
  );

  const scheduleEntryIds = useMemo(() => new Set(scheduleEntries.map(e => e.id)), [scheduleEntries]);
  const scheduleTitles = useMemo(() => new Set(scheduleEntries.map(e => e.title)), [scheduleEntries]);
  const extraClasses = useMemo(() =>
    [...new Set(students.map((s) => s.class).filter(Boolean))]
      .filter((c) => !scheduleTitles.has(c))
      .sort(),
    [students, scheduleTitles]
  );

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name,
        grade: student.grade,
        class: student.class,
        scheduleId: student.scheduleId ?? null,
        memo: student.memo || "",
      });
      if (student.class && !scheduleEntryIds.has(student.scheduleId)) {
        setCustomClass(student.class);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setNameError("이름을 입력해주세요.");
      return;
    }
    const duplicate = students.find(
      (s) => s.name === trimmedName && s.id !== student?.id
    );
    if (duplicate) {
      setNameError(`이미 등록된 이름입니다. (${duplicate.grade} · ${duplicate.class})`);
      return;
    }
    onSave({ ...form, name: trimmedName });
  };

  const inputCls = "w-full px-3.5 py-2.5 border border-[#E3DED8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] transition bg-[#F5F3F0]";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col">

        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E3DED8] flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? "학생 정보 수정" : "학생 추가"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-[#F5F3F0] hover:text-gray-600 transition text-lg"
          >
            ✕
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* 이름 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              이름 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setNameError("");
              }}
              placeholder="예: 김지우"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] transition bg-[#F5F3F0] ${
                nameError ? "border-red-300" : "border-[#E3DED8]"
              }`}
              autoFocus
            />
            {nameError && (
              <p className="mt-1 text-xs text-red-500">{nameError}</p>
            )}
          </div>

          {/* 학년 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">학년</label>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="col-span-3 text-xs text-gray-400 font-medium mb-0.5">초등</div>
              {GRADES.filter((g) => g.startsWith("초등")).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm({ ...form, grade: g })}
                  className={`py-2 rounded-xl text-xs font-medium border transition ${
                    form.grade === g
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-[#E3DED8] text-gray-600 hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                >
                  {g.replace("초등 ", "")}
                </button>
              ))}
              <div className="col-span-3 text-xs text-gray-400 font-medium mt-1 mb-0.5">중등</div>
              {GRADES.filter((g) => g.startsWith("중등")).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm({ ...form, grade: g })}
                  className={`py-2 rounded-xl text-xs font-medium border transition ${
                    form.grade === g
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-[#E3DED8] text-gray-600 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {g.replace("중등 ", "")}
                </button>
              ))}
            </div>
          </div>

          {/* 반 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">반</label>

            {scheduleEntries.length > 0 ? (
              <div className="space-y-1.5">
                {scheduleEntries.map((entry) => {
                  const isSelected = form.scheduleId === entry.id;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, class: entry.title, scheduleId: entry.id });
                        setCustomClass("");
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition ${
                        isSelected
                          ? "bg-[#2BAE9A] border-[#2BAE9A] text-white"
                          : "bg-[#F5F3F0] border-[#E3DED8] text-gray-700 hover:border-[#2BAE9A] hover:bg-[#eef9f7]"
                      }`}
                    >
                      <span className="font-semibold">{entry.title}</span>
                      <span className={`text-xs ${isSelected ? "text-teal-100" : "text-gray-400"}`}>
                        {entry.day} {entry.startTime}
                      </span>
                    </button>
                  );
                })}

                {extraClasses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {extraClasses.map((c) => (
                      <button key={c} type="button"
                        onClick={() => { setForm({ ...form, class: c, scheduleId: null }); setCustomClass(""); }}
                        className={`px-2.5 py-1 rounded-lg text-xs transition ${
                          form.class === c && !form.scheduleId
                            ? "bg-[#2BAE9A] text-white"
                            : "bg-[#F5F3F0] text-gray-500 hover:bg-[#eef9f7] hover:text-[#1a8a78]"
                        }`}
                      >{c}</button>
                    ))}
                  </div>
                )}

                <div className="pt-1">
                  <input
                    type="text"
                    value={customClass}
                    onChange={(e) => {
                      setCustomClass(e.target.value);
                      setForm({ ...form, class: e.target.value, scheduleId: null });
                    }}
                    placeholder="직접 입력..."
                    className="w-full px-3.5 py-2 border border-dashed border-[#E3DED8] rounded-xl text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] focus:border-solid bg-[#F5F3F0]"
                  />
                </div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={form.class}
                  onChange={(e) => setForm({ ...form, class: e.target.value, scheduleId: null })}
                  placeholder="예: A반, 월요일반, 심화반"
                  className={inputCls}
                />
                {extraClasses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {extraClasses.map((c) => (
                      <button key={c} type="button"
                        onClick={() => setForm({ ...form, class: c, scheduleId: null })}
                        className={`px-2.5 py-1 rounded-lg text-xs transition ${
                          form.class === c
                            ? "bg-[#2BAE9A] text-white"
                            : "bg-[#F5F3F0] text-gray-500 hover:bg-[#eef9f7] hover:text-[#1a8a78]"
                        }`}
                      >{c}</button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">메모 <span className="font-normal text-gray-400">(선택)</span></label>
            <textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="학생 특이사항, 부모님 연락처 등"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* 버튼 */}
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
              className="flex-1 py-2.5 bg-[#2BAE9A] hover:bg-[#249e8c] text-white rounded-xl text-sm font-semibold transition"
            >
              {isEdit ? "수정 완료" : "학생 추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
