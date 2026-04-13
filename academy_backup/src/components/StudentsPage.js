import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { GRADES } from "../data/sampleData";
import StudentModal from "./StudentModal";

const GRADE_COLORS = {
  "초등 1학년": "bg-emerald-50 text-emerald-700",
  "초등 2학년": "bg-emerald-50 text-emerald-700",
  "초등 3학년": "bg-emerald-50 text-emerald-700",
  "초등 4학년": "bg-teal-50 text-teal-700",
  "초등 5학년": "bg-teal-50 text-teal-700",
  "초등 6학년": "bg-teal-50 text-teal-700",
  "중등 1학년": "bg-blue-50 text-blue-700",
  "중등 2학년": "bg-blue-50 text-blue-700",
  "중등 3학년": "bg-blue-50 text-blue-700",
};

const AVATAR_COLORS = [
  "bg-teal-400", "bg-pink-400", "bg-violet-400",
  "bg-orange-400", "bg-sky-400", "bg-emerald-400",
];

function getAvatarColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

// 아이콘
const IconUserGroup = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconEdit = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
  </svg>
);

const IconTrash = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

export default function StudentsPage() {
  const { students, addStudent, updateStudent, deleteStudent, assignments, setCurrentPage, setSelectedStudent } = useApp();

  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sortBy, setSortBy] = useState("name");

  const existingClasses = useMemo(
    () => [...new Set(students.map((s) => s.class).filter(Boolean))].sort(),
    [students]
  );

  const filtered = useMemo(() => {
    let list = [...students];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (filterGrade) list = list.filter((s) => s.grade === filterGrade);
    if (filterClass) list = list.filter((s) => s.class === filterClass);
    list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "ko");
      if (sortBy === "grade") return GRADES.indexOf(a.grade) - GRADES.indexOf(b.grade);
      if (sortBy === "createdAt") return b.createdAt.localeCompare(a.createdAt);
      return 0;
    });
    return list;
  }, [students, search, filterGrade, filterClass, sortBy]);

  const stats = useMemo(() => ({
    total: students.length,
    elementary: students.filter((s) => s.grade.startsWith("초등")).length,
    middle: students.filter((s) => s.grade.startsWith("중등")).length,
  }), [students]);

  const getAssignmentCount = (studentId) =>
    assignments.filter((a) => a.studentId === studentId).length;

  const handleSave = (form) => {
    if (modal === "add") {
      addStudent(form);
    } else {
      updateStudent(modal.id, form);
    }
    setModal(null);
  };

  const handleDelete = () => {
    deleteStudent(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const handleGoAssignments = (student) => {
    setSelectedStudent(student);
    setCurrentPage("assignments");
  };

  const isFiltering = search || filterGrade || filterClass;

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto bg-[#F5F3F0]">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">학생 목록</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {students.length > 0 ? `총 ${students.length}명 등록됨` : "아직 등록된 학생이 없습니다"}
          </p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2BAE9A] hover:bg-[#249e8c] text-white rounded-xl text-sm font-semibold transition shadow-sm"
        >
          + 학생 추가
        </button>
      </div>

      {/* 학생 없을 때 */}
      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-[#eef9f7] rounded-2xl flex items-center justify-center text-[#2BAE9A] mb-5">
            <IconUserGroup />
          </div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">학생을 추가해보세요</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            이름, 학년, 반 정보를 입력하면<br />학생 목록이 만들어집니다.
          </p>
          <button
            onClick={() => setModal("add")}
            className="flex items-center gap-2 px-6 py-3 bg-[#2BAE9A] hover:bg-[#249e8c] text-white rounded-xl font-semibold transition shadow-sm"
          >
            + 첫 번째 학생 추가하기
          </button>
        </div>
      ) : (
        <>
          {/* 통계 카드 */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
            {[
              {
                label: "전체 학생", value: stats.total,
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                iconBg: "bg-[#eef9f7] text-[#2BAE9A]",
              },
              {
                label: "초등부", value: stats.elementary,
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                iconBg: "bg-emerald-50 text-emerald-600",
              },
              {
                label: "중등부", value: stats.middle,
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                ),
                iconBg: "bg-blue-50 text-blue-600",
              },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#E3DED8] shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{s.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                    {s.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 필터 바 */}
          <div className="bg-white rounded-2xl border border-[#E3DED8] p-4 mb-5 flex flex-wrap gap-3 items-center shadow-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 검색..."
              className="flex-1 min-w-[140px] px-3 py-2 border border-[#E3DED8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-[#F5F3F0]"
            />
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-3 py-2 border border-[#E3DED8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-[#F5F3F0]"
            >
              <option value="">전체 학년</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            {existingClasses.length > 0 && (
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-3 py-2 border border-[#E3DED8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-[#F5F3F0]"
              >
                <option value="">전체 반</option>
                {existingClasses.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-[#E3DED8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-[#F5F3F0]"
            >
              <option value="name">이름순</option>
              <option value="grade">학년순</option>
              <option value="createdAt">등록순</option>
            </select>
            {isFiltering && (
              <button
                onClick={() => { setSearch(""); setFilterGrade(""); setFilterClass(""); }}
                className="px-3 py-2 text-xs text-gray-400 hover:text-gray-600 underline"
              >
                초기화
              </button>
            )}
            <span className="text-xs text-gray-400 ml-auto">{filtered.length}명</span>
          </div>

          {/* 학생 카드 그리드 */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
              </svg>
              <p className="font-medium">검색 결과가 없습니다</p>
              <button
                onClick={() => { setSearch(""); setFilterGrade(""); setFilterClass(""); }}
                className="mt-3 text-sm text-[#2BAE9A] hover:underline"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((student) => {
                const assignCount = getAssignmentCount(student.id);
                return (
                  <div
                    key={student.id}
                    className="bg-white rounded-2xl border border-[#E3DED8] p-5 hover:shadow-md transition group shadow-sm"
                  >
                    {/* 학생 기본 정보 */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-11 h-11 rounded-xl ${getAvatarColor(student.id)} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                        {student.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 truncate">{student.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">등록 {student.createdAt}</p>
                      </div>
                    </div>

                    {/* 학년 · 반 배지 */}
                    <div className="flex gap-1.5 mb-4 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${GRADE_COLORS[student.grade] || "bg-gray-100 text-gray-600"}`}>
                        {student.grade}
                      </span>
                      {student.class && (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-700">
                          {student.class}
                        </span>
                      )}
                    </div>

                    {/* 메모 */}
                    {student.memo && (
                      <p className="text-xs text-gray-500 mb-4 bg-[#F5F3F0] rounded-lg px-3 py-2 line-clamp-2">
                        {student.memo}
                      </p>
                    )}

                    {/* 하단 액션 */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#F0EDE9]">
                      <span className="text-xs text-gray-400">
                        과제 <span className="font-semibold text-[#2BAE9A]">{assignCount}개</span>
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleGoAssignments(student)}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-[#eef9f7] text-[#1a8a78] hover:bg-teal-100 font-medium transition"
                        >
                          과제
                        </button>
                        <button
                          onClick={() => setModal(student)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-[#F5F3F0] hover:text-gray-600 transition"
                          title="수정"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(student)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                          title="삭제"
                        >
                          <IconTrash />
                        </button>
                      </div>
                      <div className="flex gap-1 group-hover:hidden">
                        <button
                          onClick={() => handleGoAssignments(student)}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-[#eef9f7] text-[#1a8a78] hover:bg-teal-100 font-medium transition"
                        >
                          과제
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 추가/수정 모달 */}
      {modal !== null && (
        <StudentModal
          student={modal === "add" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* 삭제 확인 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <IconTrash />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">학생 삭제</h3>
            <p className="text-gray-600 text-sm mb-1">
              <span className="font-semibold">{deleteConfirm.name}</span> 학생을 삭제할까요?
            </p>
            <p className="text-gray-400 text-xs mb-5">
              과제 기록과 첨삭 결과도 모두 삭제되며, 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-[#E3DED8] rounded-xl text-sm font-medium text-gray-600 hover:bg-[#F5F3F0] transition"
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
