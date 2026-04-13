import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { ASSIGNMENT_TYPES, TYPE_COLORS } from "./AssignmentForm";
import AssignmentForm from "./AssignmentForm";
import FeedbackPanel from "./FeedbackPanel";

const AVATAR_COLORS = [
  "bg-teal-400", "bg-pink-400", "bg-teal-400",
  "bg-orange-400", "bg-purple-400", "bg-blue-400",
];
function getAvatarColor(id) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }
function formatDate(dateStr) {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}

// ── 공통: 반별 그룹 계산 ──────────────────────────────────────
function useGroups(students, schedule, search) {
  return useMemo(() => {
    const scheduleMap = Object.fromEntries(schedule.map((e) => [String(e.id), e]));
    const groupMap = {};
    students.forEach((s) => {
      const key = s.scheduleId ? String(s.scheduleId) : "unassigned";
      if (!groupMap[key]) groupMap[key] = [];
      groupMap[key].push(s);
    });
    const q = search.trim();
    return Object.entries(groupMap)
      .map(([key, members]) => {
        const entry = key !== "unassigned" ? scheduleMap[key] : null;
        const filtered = q ? members.filter((s) => s.name.includes(q)) : members;
        return {
          key,
          label: entry ? entry.title : (members[0]?.class || "미배정"),
          sub: entry ? `${entry.day}요일 ${entry.startTime}–${entry.endTime}` : "반 미배정",
          members: [...filtered].sort((a, b) => a.name.localeCompare(b.name, "ko")),
        };
      })
      .filter((g) => g.members.length > 0)
      .sort((a, b) => {
        if (a.key === "unassigned") return 1;
        if (b.key === "unassigned") return -1;
        return a.label.localeCompare(b.label, "ko");
      });
  }, [students, schedule, search]);
}

// ── 단일 학생 선택 화면 ───────────────────────────────────────
function StudentPickerScreen({ students, assignments, schedule, currentStudent, onSelect, onCancel }) {
  const [search, setSearch] = useState("");
  const groups = useGroups(students, schedule, search);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F3F0]">
      <div className="bg-white border-b border-[#E3DED8] px-4 md:px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800">학생 선택</h2>
            <p className="text-sm text-gray-400 mt-0.5">반별로 학생을 선택하세요</p>
          </div>
          {currentStudent && (
            <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 border border-[#E3DED8] rounded-xl hover:bg-gray-50 transition">취소</button>
          )}
        </div>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="이름으로 검색..."
          className="w-full px-4 py-2.5 border border-[#E3DED8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-[#F5F3F0]"
          autoFocus />
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-5xl mb-4">👥</p>
            <p className="text-lg font-semibold text-gray-600 mb-1">등록된 학생이 없습니다</p>
            <p className="text-sm text-gray-400">학생 목록에서 먼저 학생을 추가해주세요</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-base font-medium text-gray-500">검색 결과가 없습니다</p>
          </div>
        ) : groups.map(({ key, label, sub, members }) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <h3 className="text-sm font-bold text-gray-700">{label}</h3>
              <span className="text-xs text-[#2BAE9A] bg-[#eef9f7] px-2 py-0.5 rounded-lg font-medium">{sub}</span>
              <span className="text-xs text-gray-400">{members.length}명</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {members.map((s) => {
                const assignCount = assignments.filter((a) => a.studentId === s.id).length;
                const isSelected = currentStudent?.id === s.id;
                return (
                  <button key={s.id} onClick={() => onSelect(s)}
                    className={`flex flex-col items-center p-4 rounded-2xl border-2 transition group ${isSelected ? "border-[#2BAE9A] bg-[#eef9f7] shadow-sm" : "border-[#E3DED8] bg-white hover:border-[#2BAE9A] hover:shadow-md"}`}>
                    <div className={`w-12 h-12 rounded-xl ${getAvatarColor(s.id)} flex items-center justify-center text-white font-bold text-xl mb-2.5`}>{s.name.charAt(0)}</div>
                    <p className={`text-sm font-semibold leading-tight ${isSelected ? "text-[#1a8a78]" : "text-gray-800"}`}>{s.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.grade}</p>
                    <p className="text-xs text-gray-300 mt-2">과제 {assignCount}개</p>
                    {isSelected && <span className="mt-1.5 text-xs font-semibold text-[#2BAE9A]">✓ 선택됨</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 일괄 과제 추가: 학생 다중 선택 화면 ──────────────────────
function BulkStudentPickerScreen({ students, assignments, schedule, onConfirm, onCancel }) {
  const [search, setSearch] = useState("");
  const [checkedIds, setCheckedIds] = useState(new Set());
  const groups = useGroups(students, schedule, search);

  const toggle = (id) => setCheckedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleGroup = (members) => {
    const ids = members.map((s) => s.id);
    const allChecked = ids.every((id) => checkedIds.has(id));
    setCheckedIds((prev) => { const next = new Set(prev); if (allChecked) ids.forEach((id) => next.delete(id)); else ids.forEach((id) => next.add(id)); return next; });
  };
  const checkedStudents = students.filter((s) => checkedIds.has(s.id));

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F3F0]">
      <div className="bg-white border-b border-[#E3DED8] px-4 md:px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800">일괄 과제 추가</h2>
            <p className="text-sm text-gray-400 mt-0.5">과제를 받을 학생을 선택하세요</p>
          </div>
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 border border-[#E3DED8] rounded-xl hover:bg-gray-50 transition">취소</button>
        </div>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="이름으로 검색..."
          className="w-full px-4 py-2.5 border border-[#E3DED8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE9A] bg-[#F5F3F0]"
          autoFocus />
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 pb-28">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-base font-medium text-gray-500">검색 결과가 없습니다</p>
          </div>
        ) : groups.map(({ key, label, sub, members }) => {
          const allChecked = members.every((s) => checkedIds.has(s.id));
          const someChecked = members.some((s) => checkedIds.has(s.id));
          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <button onClick={() => toggleGroup(members)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${allChecked ? "bg-[#2BAE9A] border-[#2BAE9A] text-white" : someChecked ? "bg-teal-50 border-[#2BAE9A] text-[#1a8a78]" : "bg-white border-[#E3DED8] text-gray-500 hover:border-[#2BAE9A]"}`}>
                  {allChecked ? "✓ 전체 해제" : "반 전체 선택"}
                </button>
                <h3 className="text-sm font-bold text-gray-700">{label}</h3>
                <span className="text-xs text-[#2BAE9A] bg-[#eef9f7] px-2 py-0.5 rounded-lg font-medium">{sub}</span>
                <span className="text-xs text-gray-400">{members.length}명</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {members.map((s) => {
                  const checked = checkedIds.has(s.id);
                  const assignCount = assignments.filter((a) => a.studentId === s.id).length;
                  return (
                    <button key={s.id} onClick={() => toggle(s.id)}
                      className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition ${checked ? "border-[#2BAE9A] bg-[#eef9f7] shadow-sm" : "border-[#E3DED8] bg-white hover:border-[#2BAE9A] hover:shadow-md"}`}>
                      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${checked ? "bg-[#2BAE9A] border-[#2BAE9A]" : "border-gray-300 bg-white"}`}>
                        {checked && <span className="text-white text-xs font-bold leading-none">✓</span>}
                      </div>
                      <div className={`w-12 h-12 rounded-xl ${getAvatarColor(s.id)} flex items-center justify-center text-white font-bold text-xl mb-2.5`}>{s.name.charAt(0)}</div>
                      <p className={`text-sm font-semibold leading-tight ${checked ? "text-[#1a8a78]" : "text-gray-800"}`}>{s.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.grade}</p>
                      <p className="text-xs text-gray-300 mt-2">과제 {assignCount}개</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E3DED8] px-4 py-3 flex items-center justify-between gap-4 shadow-lg z-30">
        <div className="text-sm text-gray-600">
          {checkedStudents.length > 0 ? (
            <span><span className="font-bold text-[#1a8a78]">{checkedStudents.length}명</span> 선택됨
              <span className="text-xs text-gray-400 ml-2 hidden sm:inline">({checkedStudents.map((s) => s.name).join(", ")})</span>
            </span>
          ) : <span className="text-gray-400">학생을 선택해주세요</span>}
        </div>
        <button disabled={checkedStudents.length === 0} onClick={() => onConfirm(checkedStudents)}
          className="px-5 py-2.5 bg-[#2BAE9A] hover:bg-[#249e8c] disabled:bg-teal-200 text-white rounded-xl text-sm font-semibold transition shrink-0">
          {checkedStudents.length > 0 ? `${checkedStudents.length}명에게 과제 추가 →` : "과제 추가"}
        </button>
      </div>
    </div>
  );
}

// ── 과제 목록 아이템 ──────────────────────────────────────────
function AssignmentItem({ a, isSelected, selectMode, checked, onCheck, onClick, onEdit, onDeleteConfirm }) {
  return (
    <li
      onClick={() => selectMode ? onCheck(a.id) : onClick(a)}
      className={`px-3 py-3 cursor-pointer transition group ${isSelected && !selectMode ? "bg-[#eef9f7]" : checked ? "bg-teal-50/60" : "hover:bg-gray-50"}`}
    >
      <div className="flex items-start gap-2">
        {/* 체크박스 (선택 모드) */}
        {selectMode && (
          <div className={`shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition ${checked ? "bg-[#2BAE9A] border-[#2BAE9A]" : "border-gray-300"}`}>
            {checked && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${TYPE_COLORS[a.type] || "bg-gray-100 text-gray-500"}`}>{a.type}</span>
            <span className="text-xs text-gray-400">{formatDate(a.assignedDate)}</span>
          </div>
          <p className={`text-sm font-medium truncate ${isSelected && !selectMode ? "text-[#1a8a78]" : "text-gray-700"}`}>{a.title}</p>
          <div className="flex items-center gap-2 mt-1">
            {a.hasImage && <span className="text-xs text-gray-400">📷</span>}
            {a.textInput && <span className="text-xs text-gray-400">⌨️</span>}
            {a.feedback && <span className="text-xs text-green-600 font-medium">✓ 첨삭</span>}
          </div>
        </div>
        {!selectMode && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onEdit(a); }}
              className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600" title="수정">✏️</button>
            <button onClick={(e) => { e.stopPropagation(); onDeleteConfirm(a); }}
              className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="삭제">🗑️</button>
          </div>
        )}
      </div>
    </li>
  );
}

// ── 과제 목록 패널 ────────────────────────────────────────────
function AssignmentListPanel({
  assignments: list, filterType, setFilterType, typeCounts,
  selectedAssignment, setSelectedAssignment,
  selectMode, setSelectMode, checkedIds, setCheckedIds,
  onEdit, onDeleteConfirm, onDeleteSelected, onAdd,
}) {
  const [folderView, setFolderView] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});

  // 폴더 그룹: curriculumName 기준
  const folders = useMemo(() => {
    const map = {};
    list.forEach((a) => {
      const key = a.curriculumName?.trim() || "기타";
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return Object.entries(map)
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => {
        if (a.name === "기타") return 1;
        if (b.name === "기타") return -1;
        return a.name.localeCompare(b.name, "ko");
      });
  }, [list]);

  const toggleFolder = (name) => setExpandedFolders((p) => ({ ...p, [name]: p[name] === false ? true : p[name] === true ? false : true }));
  const isFolderOpen = (name) => expandedFolders[name] !== false; // default open

  const toggleCheck = (id) => setCheckedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleAll = () => {
    if (checkedIds.size === list.length) setCheckedIds(new Set());
    else setCheckedIds(new Set(list.map((a) => a.id)));
  };

  const exitSelectMode = () => { setSelectMode(false); setCheckedIds(new Set()); };

  const renderItem = (a) => (
    <AssignmentItem
      key={a.id}
      a={a}
      isSelected={selectedAssignment?.id === a.id}
      selectMode={selectMode}
      checked={checkedIds.has(a.id)}
      onCheck={toggleCheck}
      onClick={setSelectedAssignment}
      onEdit={onEdit}
      onDeleteConfirm={onDeleteConfirm}
    />
  );

  return (
    <div className="w-full md:w-72 shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-gray-100 bg-white overflow-hidden max-h-[40vh] md:max-h-none">
      {/* 상단 툴바 */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-50 space-y-2">
        {/* 뷰 전환 + 선택 모드 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setFolderView(false)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${!folderView ? "bg-white text-gray-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
              목록
            </button>
            <button onClick={() => setFolderView(true)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${folderView ? "bg-white text-gray-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
              폴더
            </button>
          </div>
          {!selectMode ? (
            <button onClick={() => setSelectMode(true)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E3DED8] text-gray-500 hover:border-red-300 hover:text-red-500 transition">
              선택
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={toggleAll}
                className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                {checkedIds.size === list.length ? "해제" : "전체"}
              </button>
              <button onClick={exitSelectMode}
                className="text-xs px-2 py-1 rounded-lg border border-[#E3DED8] text-gray-400 hover:bg-gray-50 transition">
                취소
              </button>
            </div>
          )}
        </div>

        {/* 유형 필터 (목록 뷰에서만) */}
        {!folderView && (
          <div className="flex flex-wrap gap-1">
            {["전체", ...ASSIGNMENT_TYPES].map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium transition ${filterType === t ? "bg-[#2BAE9A] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {t}
                {typeCounts[t] !== undefined && <span className={`ml-1 ${filterType === t ? "opacity-80" : "opacity-60"}`}>{typeCounts[t]}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 과제 목록 */}
      <div className="flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 py-10">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm">과제가 없습니다</p>
            <button onClick={onAdd} className="mt-3 text-xs text-[#2BAE9A] hover:underline">+ 과제 추가</button>
          </div>
        ) : folderView ? (
          /* 폴더 뷰 */
          <div>
            {folders.map(({ name, items }) => (
              <div key={name}>
                {/* 폴더 헤더 */}
                <button
                  onClick={() => toggleFolder(name)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition border-b border-gray-100 text-left"
                >
                  <span className="text-sm">{isFolderOpen(name) ? "📂" : "📁"}</span>
                  <span className="flex-1 text-xs font-semibold text-gray-700 truncate">{name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{items.length}</span>
                  <span className={`text-gray-400 text-xs transition-transform ${isFolderOpen(name) ? "" : "-rotate-90"}`}>▾</span>
                </button>
                {/* 폴더 내용 */}
                {isFolderOpen(name) && (
                  <ul className="divide-y divide-gray-50">
                    {items
                      .sort((a, b) => b.assignedDate.localeCompare(a.assignedDate))
                      .map(renderItem)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* 목록 뷰 */
          <ul className="divide-y divide-gray-50">
            {list.map(renderItem)}
          </ul>
        )}
      </div>

      {/* 선택 삭제 하단 바 */}
      {selectMode && checkedIds.size > 0 && (
        <div className="border-t border-[#E3DED8] px-3 py-2.5 bg-white flex items-center justify-between gap-2 shrink-0">
          <span className="text-xs text-gray-600">
            <span className="font-bold text-red-500">{checkedIds.size}개</span> 선택됨
          </span>
          <button
            onClick={() => onDeleteSelected([...checkedIds])}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}

// ── 과제 관리 메인 ────────────────────────────────────────────
export default function AssignmentsPage() {
  const {
    students, assignments, schedule,
    addAssignment, updateAssignment, deleteAssignment,
    setCurrentPage,
    selectedStudent, setSelectedStudent,
  } = useApp();

  const [localStudent, setLocalStudent] = useState(selectedStudent);
  const [filterType, setFilterType] = useState("전체");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // single | { ids: [...] }
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);

  // 일괄 과제 추가
  const [bulkPickerOpen, setBulkPickerOpen] = useState(false);
  const [bulkStudents, setBulkStudents] = useState([]);
  const [showBulkForm, setShowBulkForm] = useState(false);

  // 다중 선택 삭제
  const [selectMode, setSelectMode] = useState(false);
  const [checkedIds, setCheckedIds] = useState(new Set());

  const currentStudent = localStudent || selectedStudent;

  useEffect(() => {
    if (!currentStudent) setStudentPickerOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const studentAssignments = useMemo(() => {
    if (!currentStudent) return [];
    let list = assignments.filter((a) => a.studentId === currentStudent.id);
    if (filterType !== "전체") list = list.filter((a) => a.type === filterType);
    return list.sort((a, b) => b.assignedDate.localeCompare(a.assignedDate));
  }, [assignments, currentStudent, filterType]);

  const handleSaveAssignment = (formOrArray) => {
    if (editingAssignment) {
      updateAssignment(editingAssignment.id, formOrArray);
      if (selectedAssignment?.id === editingAssignment.id) {
        setSelectedAssignment((prev) => ({ ...prev, ...formOrArray }));
      }
    } else if (Array.isArray(formOrArray)) {
      let lastA;
      formOrArray.forEach((form) => { lastA = addAssignment({ ...form, studentId: currentStudent.id, hasImage: false }); });
      setSelectedAssignment(lastA);
    } else {
      const newA = addAssignment({ ...formOrArray, studentId: currentStudent.id, hasImage: false });
      setSelectedAssignment(newA);
    }
    setShowForm(false);
    setEditingAssignment(null);
  };

  const handleBulkSave = (formOrArray) => {
    const forms = Array.isArray(formOrArray) ? formOrArray : [formOrArray];
    bulkStudents.forEach((student) => {
      forms.forEach((form) => { addAssignment({ ...form, studentId: student.id, hasImage: false }); });
    });
    setShowBulkForm(false);
    setBulkStudents([]);
  };

  const handleEdit = (a) => { setEditingAssignment(a); setShowForm(true); };

  // 단건 삭제
  const handleDelete = () => {
    if (deleteConfirm.ids) {
      // 다건 삭제
      deleteConfirm.ids.forEach((id) => {
        deleteAssignment(id);
        if (selectedAssignment?.id === id) setSelectedAssignment(null);
      });
      setSelectMode(false);
      setCheckedIds(new Set());
    } else {
      deleteAssignment(deleteConfirm.id);
      if (selectedAssignment?.id === deleteConfirm.id) setSelectedAssignment(null);
    }
    setDeleteConfirm(null);
  };

  const handleDeleteSelected = (ids) => {
    setDeleteConfirm({ ids, count: ids.length });
  };

  const syncedSelected = useMemo(() => {
    if (!selectedAssignment) return null;
    return assignments.find((a) => a.id === selectedAssignment.id) || null;
  }, [assignments, selectedAssignment]);

  const typeCounts = useMemo(() => {
    if (!currentStudent) return {};
    const all = assignments.filter((a) => a.studentId === currentStudent.id);
    return ASSIGNMENT_TYPES.reduce((acc, t) => {
      acc[t] = all.filter((a) => a.type === t).length;
      return acc;
    }, { 전체: all.length });
  }, [assignments, currentStudent]);

  const handleSelectStudent = (s) => {
    setLocalStudent(s); setSelectedStudent(s);
    setSelectedAssignment(null); setFilterType("전체");
    setStudentPickerOpen(false);
    setSelectMode(false); setCheckedIds(new Set());
  };

  const handleBulkConfirm = (selected) => {
    setBulkStudents(selected); setBulkPickerOpen(false); setShowBulkForm(true);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F5F3F0]">

      {bulkPickerOpen ? (
        <BulkStudentPickerScreen
          students={students} assignments={assignments} schedule={schedule}
          onConfirm={handleBulkConfirm} onCancel={() => setBulkPickerOpen(false)}
        />
      ) : studentPickerOpen ? (
        <StudentPickerScreen
          students={students} assignments={assignments} schedule={schedule}
          currentStudent={currentStudent} onSelect={handleSelectStudent}
          onCancel={() => setStudentPickerOpen(false)}
        />
      ) : (
        <>
          {/* 상단 헤더 */}
          <header className="bg-white border-b border-[#E3DED8] px-4 md:px-6 py-4 flex items-center gap-4 shrink-0">
            <button onClick={() => { setCurrentPage("students"); setSelectedStudent(null); }}
              className="text-sm text-gray-400 hover:text-gray-600 transition flex items-center gap-1 shrink-0">
              ← 학생 목록
            </button>

            {currentStudent ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl ${getAvatarColor(currentStudent.id)} flex items-center justify-center text-white font-bold shrink-0`}>
                  {currentStudent.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 text-sm leading-tight truncate">{currentStudent.name}</p>
                  <p className="text-xs text-gray-400 truncate">{currentStudent.grade} · {currentStudent.class}</p>
                </div>
                <button onClick={() => setStudentPickerOpen(true)} className="ml-1 text-xs text-[#2BAE9A] hover:underline shrink-0">변경</button>
              </div>
            ) : (
              <button onClick={() => setStudentPickerOpen(true)} className="text-sm text-[#1a8a78] font-medium hover:underline">학생 선택 →</button>
            )}

            <div className="ml-auto flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400 hidden sm:inline">{currentStudent ? `과제 ${typeCounts["전체"] || 0}개` : ""}</span>
              <button onClick={() => setBulkPickerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 border border-[#2BAE9A] text-[#1a8a78] rounded-xl text-sm font-medium hover:bg-[#eef9f7] transition">
                <span className="text-base leading-none">⊕</span>
                <span className="hidden sm:inline">일괄 추가</span>
              </button>
              {currentStudent && (
                <button onClick={() => { setEditingAssignment(null); setShowForm(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#2BAE9A] hover:bg-[#249e8c] text-white rounded-xl text-sm font-medium transition">
                  + 과제 추가
                </button>
              )}
            </div>
          </header>

          {!currentStudent ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <p className="text-6xl mb-3">👤</p>
              <p className="text-lg font-medium text-gray-400">학생을 선택해주세요</p>
              <button onClick={() => setStudentPickerOpen(true)}
                className="mt-4 px-5 py-2.5 bg-[#2BAE9A] text-white rounded-xl text-sm font-medium hover:bg-[#249e8c] transition">
                학생 선택
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              <AssignmentListPanel
                assignments={studentAssignments}
                filterType={filterType} setFilterType={setFilterType}
                typeCounts={typeCounts}
                selectedAssignment={syncedSelected}
                setSelectedAssignment={setSelectedAssignment}
                selectMode={selectMode} setSelectMode={setSelectMode}
                checkedIds={checkedIds} setCheckedIds={setCheckedIds}
                onEdit={handleEdit}
                onDeleteConfirm={(a) => setDeleteConfirm(a)}
                onDeleteSelected={handleDeleteSelected}
                onAdd={() => { setEditingAssignment(null); setShowForm(true); }}
              />
              <FeedbackPanel assignment={syncedSelected} student={currentStudent} />
            </div>
          )}
        </>
      )}

      {showForm && (
        <AssignmentForm assignment={editingAssignment} studentName={currentStudent?.name}
          onSave={handleSaveAssignment} onClose={() => { setShowForm(false); setEditingAssignment(null); }} />
      )}

      {showBulkForm && (
        <AssignmentForm assignment={null} studentName={`${bulkStudents.length}명에게 일괄 추가`}
          onSave={handleBulkSave} onClose={() => { setShowBulkForm(false); setBulkStudents([]); }} />
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">과제 삭제</h3>
            {deleteConfirm.ids ? (
              <>
                <p className="text-sm text-gray-600 mb-1">
                  선택한 <span className="font-semibold text-red-600">{deleteConfirm.count}개</span>의 과제를 삭제할까요?
                </p>
                <p className="text-xs text-gray-400 mb-5">첨삭 결과와 사진도 함께 삭제됩니다.</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold text-red-600">"{deleteConfirm.title}"</span> 과제를 삭제할까요?
                </p>
                <p className="text-xs text-gray-400 mb-5">첨삭 결과와 사진도 함께 삭제됩니다.</p>
              </>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">취소</button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
