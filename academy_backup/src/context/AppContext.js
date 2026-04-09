import React, { createContext, useContext, useState, useEffect } from "react";
import { INITIAL_CURRICULUM } from "../data/curriculumData";
import { supabase } from "../lib/supabase";

const AppContext = createContext();

// ── 쿠키 유틸 (localStorage/sessionStorage 미사용) ────────────
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Strict`;
}
function getCookie(name) {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}
function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}
function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── DB row → JS 객체 변환 헬퍼 ────────────────────────────────
function rowToMemo(r) {
  return {
    id: r.id,
    title: r.title || "",
    content: r.content || "",
    category: r.category || "기타",
    createdAt: r.created_at || "",
    updatedAt: r.updated_at || "",
    archived: r.archived || false,
  };
}
function rowToStudent(r) {
  return {
    id: r.id,
    name: r.name,
    grade: r.grade || "",
    class: r.class_name || "",
    memo: r.memo || "",
    createdAt: r.created_at || "",
    scheduleId: r.schedule_id ?? null,
  };
}
function rowToAssignment(r) {
  const imageUrls = r.image_urls || [];
  return {
    id: r.id,
    studentId: r.student_id,
    title: r.title,
    type: r.type || "",
    assignedDate: r.assigned_date || "",
    teacherNote: r.teacher_note || "",
    createdAt: r.created_at || "",
    imageUrls,
    hasImage: imageUrls.length > 0,
  };
}
function rowToSchedule(r) {
  return {
    id: r.id,
    day: r.day || "",
    startTime: r.start_time || "",
    endTime: r.end_time || "",
    title: r.title || "",
    note: r.note || "",
    color: r.color || "indigo",
  };
}

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [missingTables, setMissingTables] = useState([]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [storedPassword, setStoredPassword] = useState("1234");
  const [apiKey, setApiKeyState] = useState("");

  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [schedule, setSchedule] = useState([]);
  const [curriculum, setCurriculum] = useState(INITIAL_CURRICULUM);
  const [weekNotes, setWeekNotes] = useState({});
  const [homework, setHomework] = useState({});
  const [absenceReason, setAbsenceReason] = useState({});
  const [memos, setMemos] = useState([]);
  const [reportData, setReportData] = useState({});
  const [logo, setLogoState] = useState("");

  const [currentPage, setCurrentPage] = useState("attendance");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // ── 초기 데이터 로드 ─────────────────────────────────────────
  useEffect(() => {
    async function loadAll() {
      try {
        const [
          { data: sData, error: sErr },
          { data: aData, error: aErr },
          { data: schData, error: schErr },
          { data: attData, error: attErr },
          { data: wnData, error: wnErr },
          { data: curData, error: curErr },
          { data: memoData, error: memoErr },
          { data: rdData, error: rdErr },
          { data: settingsData, error: settingsErr },
        ] = await Promise.all([
          supabase.from("students").select("*").order("id"),
          supabase.from("assignments").select("*").order("id"),
          supabase.from("schedule_items").select("*").order("id"),
          supabase.from("attendance_records").select("*"),
          supabase.from("week_notes").select("*"),
          supabase.from("curriculum_classes").select("*").order("sort_order"),
          supabase.from("memos").select("*").order("id"),
          supabase.from("report_data").select("*"),
          supabase.from("app_settings").select("*"),
        ]);

        if (sErr) throw sErr;
        if (aErr) throw aErr;
        if (schErr) throw schErr;
        if (attErr) throw attErr;
        if (wnErr) throw wnErr;
        if (curErr) throw curErr;
        const missing = [];
        if (memoErr)     { console.error("memos 로드 실패:", memoErr);       missing.push("memos"); }
        if (rdErr)       { console.error("report_data 로드 실패:", rdErr);    missing.push("report_data"); }
        if (settingsErr) { console.error("app_settings 로드 실패:", settingsErr); missing.push("app_settings"); }
        if (missing.length > 0) { setMissingTables(missing); }

        if (sData) setStudents(sData.map(rowToStudent));
        if (aData) setAssignments(aData.map(rowToAssignment));
        if (schData) setSchedule(schData.map(rowToSchedule));

        if (attData) {
          const att = {};
          const hw = {};
          const ar = {};
          attData.forEach((r) => {
            if (!att[r.date]) att[r.date] = {};
            if (r.status) att[r.date][r.student_id] = r.status;
            // 과제 O/X (attendance_records에 통합 저장)
            if (r.homework_status) {
              if (!hw[r.date]) hw[r.date] = {};
              hw[r.date][r.student_id] = { done: r.homework_status, note: r.homework_note || "" };
            }
            // 결석/지각/조퇴 사유
            if (r.absence_reason) {
              if (!ar[r.date]) ar[r.date] = {};
              ar[r.date][r.student_id] = r.absence_reason;
            }
          });
          setAttendance(att);
          setHomework(hw);
          setAbsenceReason(ar);
        }

        if (wnData) {
          const notes = {};
          wnData.forEach((r) => {
            notes[`${r.schedule_id}::${r.week_start}`] = r.text;
          });
          setWeekNotes(notes);
        }

        if (memoData) {
          setMemos(memoData.map(rowToMemo).sort((a, b) => b.id - a.id));
        }

        if (rdData) {
          const rd = {};
          rdData.forEach((r) => {
            rd[`${r.student_id}_${r.month_str}`] = {
              comment: r.comment || "",
              growth: r.growth || "",
            };
          });
          setReportData(rd);
        }

        if (settingsData) {
          const logoSetting = settingsData.find((s) => s.key === "logo");
          if (logoSetting) setLogoState(logoSetting.value || "");
          const pwSetting = settingsData.find((s) => s.key === "password");
          if (pwSetting && pwSetting.value) {
            setStoredPassword(pwSetting.value);
          } else {
            supabase
              .from("app_settings")
              .upsert({ key: "password", value: "1234" }, { onConflict: "key" })
              .then(({ error }) => { if (error) console.error(error); });
          }
          const apiKeySetting = settingsData.find((s) => s.key === "claude_api_key");
          if (apiKeySetting) setApiKeyState(apiKeySetting.value || "");

          // 자동 로그인: 쿠키 토큰 ↔ Supabase 세션 토큰 검증
          const cookieToken = getCookie("academy_session");
          const sessionSetting = settingsData.find((s) => s.key === "session_token");
          if (cookieToken && sessionSetting?.value) {
            try {
              const session = JSON.parse(sessionSetting.value);
              if (session.token === cookieToken && new Date(session.expires_at) > new Date()) {
                setIsLoggedIn(true);
              }
            } catch (_) {}
          }
        }

        if (curData && curData.length > 0) {
          setCurriculum(
            curData.map((r) => ({ id: r.id, name: r.name, stages: r.stages }))
          );
        } else {
          // 첫 실행 시 기본 커리큘럼 저장
          const rows = INITIAL_CURRICULUM.map((c, i) => ({
            id: c.id,
            name: c.name,
            stages: c.stages,
            sort_order: i,
          }));
          await supabase.from("curriculum_classes").insert(rows);
          setCurriculum(INITIAL_CURRICULUM);
        }
      } catch (err) {
        console.error("Supabase 데이터 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  // ── 인증 ─────────────────────────────────────────────────────
  const login = (password) => {
    if (password !== storedPassword) return false;
    setIsLoggedIn(true);
    // 세션 토큰 생성 → 쿠키(30일) + Supabase 저장
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 864e5).toISOString();
    setCookie("academy_session", token, 30);
    supabase
      .from("app_settings")
      .upsert({ key: "session_token", value: JSON.stringify({ token, expires_at: expiresAt }) }, { onConflict: "key" })
      .then(({ error }) => { if (error) console.error(error); });
    return true;
  };

  const changePassword = async (current, next) => {
    if (current !== storedPassword) return false;
    setStoredPassword(next);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "password", value: next }, { onConflict: "key" });
    if (error) { console.error(error); return false; }
    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
    deleteCookie("academy_session");
    supabase
      .from("app_settings")
      .delete()
      .eq("key", "session_token")
      .then(({ error }) => { if (error) console.error(error); });
  };

  const saveApiKey = (key) => {
    setApiKeyState(key);
    supabase
      .from("app_settings")
      .upsert({ key: "claude_api_key", value: key }, { onConflict: "key" })
      .then(({ error }) => { if (error) console.error(error); });
  };

  // ── 학생 CRUD ─────────────────────────────────────────────────
  const addStudent = (student) => {
    const newStudent = {
      ...student,
      id: Date.now(),
      createdAt: new Date().toISOString().split("T")[0],
    };
    setStudents((prev) => [...prev, newStudent]);
    supabase
      .from("students")
      .insert({
        id: newStudent.id,
        name: newStudent.name,
        grade: newStudent.grade,
        class_name: newStudent.class,
        memo: newStudent.memo,
        created_at: newStudent.createdAt,
        schedule_id: newStudent.scheduleId ?? null,
      })
      .then(({ error }) => { if (error) console.error(error); });
    return newStudent;
  };

  const updateStudent = (id, updates) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    const db = {};
    if ("name" in updates) db.name = updates.name;
    if ("grade" in updates) db.grade = updates.grade;
    if ("class" in updates) db.class_name = updates.class;
    if ("memo" in updates) db.memo = updates.memo;
    if ("scheduleId" in updates) db.schedule_id = updates.scheduleId;
    supabase
      .from("students")
      .update(db)
      .eq("id", id)
      .then(({ error }) => { if (error) console.error(error); });
  };

  const deleteStudent = (id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setAssignments((prev) => prev.filter((a) => a.studentId !== id));
    supabase.from("students").delete().eq("id", id)
      .then(({ error }) => { if (error) console.error(error); });
    supabase.from("assignments").delete().eq("student_id", id)
      .then(({ error }) => { if (error) console.error(error); });
    supabase.from("attendance_records").delete().eq("student_id", id)
      .then(({ error }) => { if (error) console.error(error); });
  };

  // ── 과제 CRUD ─────────────────────────────────────────────────
  const addAssignment = (assignment) => {
    const newAssignment = {
      ...assignment,
      id: Date.now(),
      createdAt: new Date().toISOString().split("T")[0],
    };
    setAssignments((prev) => [...prev, newAssignment]);
    supabase
      .from("assignments")
      .insert({
        id: newAssignment.id,
        student_id: newAssignment.studentId,
        title: newAssignment.title,
        type: newAssignment.type,
        assigned_date: newAssignment.assignedDate,
        teacher_note: newAssignment.teacherNote,
        created_at: newAssignment.createdAt,
      })
      .then(({ error }) => { if (error) console.error(error); });
    return newAssignment;
  };

  const updateAssignment = (id, updates) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    const db = {};
    if ("title" in updates) db.title = updates.title;
    if ("type" in updates) db.type = updates.type;
    if ("assignedDate" in updates) db.assigned_date = updates.assignedDate;
    if ("teacherNote" in updates) db.teacher_note = updates.teacherNote;
    supabase
      .from("assignments")
      .update(db)
      .eq("id", id)
      .then(({ error }) => { if (error) console.error(error); });
  };

  const deleteAssignment = (id) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    supabase.from("assignments").delete().eq("id", id)
      .then(({ error }) => { if (error) console.error(error); });
    // Storage 파일 정리
    supabase.storage.from("assignment-images").list(String(id))
      .then(({ data }) => {
        if (data?.length) {
          const paths = data.map((f) => `${id}/${f.name}`);
          supabase.storage.from("assignment-images").remove(paths);
        }
      });
  };

  // ── 시간표 CRUD ───────────────────────────────────────────────
  const addScheduleItem = (item) => {
    const newItem = { ...item, id: item.id ?? Date.now() };
    setSchedule((prev) => [...prev, newItem]);
    supabase
      .from("schedule_items")
      .insert({
        id: newItem.id,
        day: newItem.day,
        start_time: newItem.startTime,
        end_time: newItem.endTime,
        title: newItem.title,
        note: newItem.note,
        color: newItem.color,
      })
      .then(({ error }) => { if (error) console.error(error); });
  };

  const updateScheduleItem = (id, updates) => {
    setSchedule((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    const db = {};
    if ("day" in updates) db.day = updates.day;
    if ("startTime" in updates) db.start_time = updates.startTime;
    if ("endTime" in updates) db.end_time = updates.endTime;
    if ("title" in updates) db.title = updates.title;
    if ("note" in updates) db.note = updates.note;
    if ("color" in updates) db.color = updates.color;
    supabase
      .from("schedule_items")
      .update(db)
      .eq("id", id)
      .then(({ error }) => { if (error) console.error(error); });
  };

  const deleteScheduleItem = (id) => {
    setSchedule((prev) => prev.filter((s) => s.id !== id));
    supabase.from("schedule_items").delete().eq("id", id)
      .then(({ error }) => { if (error) console.error(error); });
  };

  // ── 출석 ──────────────────────────────────────────────────────
  const markAttendance = (date, studentId, status) => {
    setAttendance((prev) => {
      const day = { ...(prev[date] || {}) };
      if (status === null) {
        delete day[studentId];
      } else {
        day[studentId] = status;
      }
      return { ...prev, [date]: day };
    });
    if (status === null) {
      // 출석 취소: 과제/사유 데이터가 있으면 status만 초기화, 없으면 행 삭제
      const hasHomework = homework[date]?.[studentId];
      const hasAbsenceReason = absenceReason[date]?.[studentId];
      if (hasHomework || hasAbsenceReason) {
        supabase
          .from("attendance_records")
          .update({ status: "" })
          .eq("date", date)
          .eq("student_id", studentId)
          .then(({ error }) => {
            if (error) console.error("출석 취소 실패:", error);
          });
      } else {
        supabase
          .from("attendance_records")
          .delete()
          .eq("date", date)
          .eq("student_id", studentId)
          .then(({ error }) => {
            if (error) {
              console.error("출석 삭제 실패:", error);
              alert("출석 저장에 실패했습니다. 네트워크 연결을 확인해주세요.");
            }
          });
      }
    } else {
      supabase
        .from("attendance_records")
        .upsert({ date, student_id: studentId, status }, { onConflict: "date,student_id" })
        .then(({ error }) => {
          if (error) {
            console.error("출석 저장 실패:", error);
            setAttendance((prev) => {
              const day = { ...(prev[date] || {}) };
              delete day[studentId];
              return { ...prev, [date]: day };
            });
            alert("출석 저장에 실패했습니다. 네트워크 연결을 확인해주세요.");
          }
        });
    }
  };

  // ── 과제 완료 여부 (attendance_records 통합 저장) ──────────────
  const markHomework = (date, studentId, done, note = "") => {
    setHomework((prev) => {
      const day = { ...(prev[date] || {}) };
      if (done === null) {
        delete day[studentId];
      } else {
        day[studentId] = { done, note };
      }
      return { ...prev, [date]: day };
    });
    // status NOT NULL 제약 때문에 현재 출석 상태도 함께 포함 (없으면 '' 기본값)
    const currentStatus = attendance[date]?.[studentId] || "";
    supabase
      .from("attendance_records")
      .upsert(
        {
          date,
          student_id: studentId,
          status: currentStatus,
          homework_status: done ?? null,
          homework_note: done ? note : "",
        },
        { onConflict: "date,student_id" }
      )
      .then(({ error }) => {
        if (error) console.error("과제 저장 실패:", error);
      });
  };

  // ── 결석/지각/조퇴 사유 (attendance_records 통합 저장) ─────────
  const markAbsenceReason = (date, studentId, reason) => {
    setAbsenceReason((prev) => {
      const day = { ...(prev[date] || {}) };
      if (!reason) {
        delete day[studentId];
      } else {
        day[studentId] = reason;
      }
      return { ...prev, [date]: day };
    });
    // status NOT NULL 제약 때문에 현재 출석 상태도 함께 포함 (없으면 '' 기본값)
    const currentStatus = attendance[date]?.[studentId] || "";
    supabase
      .from("attendance_records")
      .upsert(
        {
          date,
          student_id: studentId,
          status: currentStatus,
          absence_reason: reason || "",
        },
        { onConflict: "date,student_id" }
      )
      .then(({ error }) => {
        if (error) console.error("사유 저장 실패:", error);
      });
  };

  // ── 수업 노트 ─────────────────────────────────────────────────
  const setWeekNote = (scheduleId, weekStart, text) => {
    const key = `${scheduleId}::${weekStart}`;
    setWeekNotes((prev) => {
      if (!text.trim()) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: text };
    });
    if (!text.trim()) {
      supabase
        .from("week_notes")
        .delete()
        .eq("schedule_id", String(scheduleId))
        .eq("week_start", weekStart)
        .then(({ error }) => { if (error) console.error(error); });
    } else {
      supabase
        .from("week_notes")
        .upsert(
          { schedule_id: String(scheduleId), week_start: weekStart, text },
          { onConflict: "schedule_id,week_start" }
        )
        .then(({ error }) => { if (error) console.error(error); });
    }
  };

  // ── 커리큘럼 CRUD ─────────────────────────────────────────────
  const _saveCurriculumStages = (classId, stages) => {
    supabase
      .from("curriculum_classes")
      .update({ stages })
      .eq("id", classId)
      .then(({ error }) => { if (error) console.error(error); });
  };

  const addCurriculumClass = (name) => {
    const newCls = { id: String(Date.now()), name, stages: [] };
    setCurriculum((prev) => {
      const next = [...prev, newCls];
      supabase
        .from("curriculum_classes")
        .insert({ id: newCls.id, name: newCls.name, stages: [], sort_order: next.length - 1 })
        .then(({ error }) => { if (error) console.error(error); });
      return next;
    });
    return newCls;
  };

  const updateCurriculumClass = (id, updates) => {
    setCurriculum((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    supabase
      .from("curriculum_classes")
      .update({ name: updates.name })
      .eq("id", id)
      .then(({ error }) => { if (error) console.error(error); });
  };

  const deleteCurriculumClass = (id) => {
    setCurriculum((prev) => prev.filter((c) => c.id !== id));
    supabase.from("curriculum_classes").delete().eq("id", id)
      .then(({ error }) => { if (error) console.error(error); });
  };

  const addCurriculumStage = (classId, name) => {
    const newStage = { id: String(Date.now()), name, lessons: [] };
    setCurriculum((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        const stages = [...c.stages, newStage];
        _saveCurriculumStages(classId, stages);
        return { ...c, stages };
      })
    );
  };

  const addCurriculumLesson = (classId, stageId, lesson) => {
    const newLesson = { ...lesson, id: String(Date.now()) };
    setCurriculum((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        const stages = c.stages.map((s) => {
          if (s.id !== stageId) return s;
          return { ...s, lessons: [...s.lessons, newLesson] };
        });
        _saveCurriculumStages(classId, stages);
        return { ...c, stages };
      })
    );
  };

  const updateCurriculumLesson = (classId, stageId, lessonId, updates) => {
    setCurriculum((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        const stages = c.stages.map((s) => {
          if (s.id !== stageId) return s;
          return {
            ...s,
            lessons: s.lessons.map((l) =>
              l.id === lessonId ? { ...l, ...updates } : l
            ),
          };
        });
        _saveCurriculumStages(classId, stages);
        return { ...c, stages };
      })
    );
  };

  const deleteCurriculumLesson = (classId, stageId, lessonId) => {
    setCurriculum((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        const stages = c.stages.map((s) => {
          if (s.id !== stageId) return s;
          return { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) };
        });
        _saveCurriculumStages(classId, stages);
        return { ...c, stages };
      })
    );
  };

  // ── 메모 CRUD ─────────────────────────────────────────────────
  const addMemo = ({ title, content, category }) => {
    const now = new Date().toISOString();
    const newMemo = {
      id: Date.now(),
      title,
      content,
      category,
      createdAt: now,
      updatedAt: now,
      archived: false,
    };
    setMemos((prev) => [newMemo, ...prev]);
    supabase
      .from("memos")
      .insert({
        id: newMemo.id,
        title,
        content,
        category,
        created_at: now,
        updated_at: now,
        archived: false,
      })
      .then(({ error }) => { if (error) console.error(error); });
    return newMemo;
  };

  const updateMemo = (id, updates) => {
    const now = new Date().toISOString();
    setMemos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: now } : m))
    );
    const db = { updated_at: now };
    if ("title" in updates) db.title = updates.title;
    if ("content" in updates) db.content = updates.content;
    if ("category" in updates) db.category = updates.category;
    if ("archived" in updates) db.archived = updates.archived;
    if ("createdAt" in updates) db.created_at = updates.createdAt;
    supabase
      .from("memos")
      .update(db)
      .eq("id", id)
      .then(({ error }) => { if (error) console.error(error); });
  };

  const deleteMemo = (id) => {
    setMemos((prev) => prev.filter((m) => m.id !== id));
    supabase.from("memos").delete().eq("id", id)
      .then(({ error }) => { if (error) console.error(error); });
  };

  // ── 리포트 데이터 ──────────────────────────────────────────────
  const saveReportComment = (studentId, monthStr, comment) => {
    const key = `${studentId}_${monthStr}`;
    setReportData((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), comment },
    }));
    supabase
      .from("report_data")
      .upsert(
        { student_id: studentId, month_str: monthStr, comment },
        { onConflict: "student_id,month_str" }
      )
      .then(({ error }) => { if (error) console.error(error); });
  };

  const saveReportGrowth = (studentId, monthStr, growth) => {
    const key = `${studentId}_${monthStr}`;
    setReportData((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), growth },
    }));
    supabase
      .from("report_data")
      .upsert(
        { student_id: studentId, month_str: monthStr, growth },
        { onConflict: "student_id,month_str" }
      )
      .then(({ error }) => { if (error) console.error(error); });
  };

  // ── 앱 설정 (로고) ────────────────────────────────────────────
  const saveLogo = (base64) => {
    setLogoState(base64);
    supabase
      .from("app_settings")
      .upsert({ key: "logo", value: base64 }, { onConflict: "key" })
      .then(({ error }) => { if (error) console.error(error); });
  };

  // ── 이미지 (Supabase Storage) ─────────────────────────────────
  // imagesInput: base64 dataURL 또는 https:// URL 혼합 배열
  // 반환값: 업로드 완료된 https:// URL 배열
  const saveImage = async (assignmentId, imagesInput) => {
    const list = imagesInput || [];

    const urlImages  = list.filter((img) => img.startsWith("http"));
    const base64Images = list.filter((img) => img.startsWith("data:"));

    // base64 → Storage 업로드
    const uploadedUrls = await Promise.all(
      base64Images.map(async (base64) => {
        const mimeType = base64.split(";")[0].split(":")[1] || "image/jpeg";
        const ext = mimeType.split("/")[1] || "jpg";
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `${assignmentId}/${filename}`;

        const blob = await fetch(base64).then((r) => r.blob());
        const { error } = await supabase.storage
          .from("assignment-images")
          .upload(path, blob, { contentType: mimeType });
        if (error) throw error;

        const { data } = supabase.storage
          .from("assignment-images")
          .getPublicUrl(path);
        return data.publicUrl;
      })
    );

    const allUrls = [...urlImages, ...uploadedUrls];

    // 상태 업데이트
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? { ...a, imageUrls: allUrls, hasImage: allUrls.length > 0 }
          : a
      )
    );

    // DB 업데이트
    supabase.from("assignments")
      .update({ image_urls: allUrls })
      .eq("id", assignmentId)
      .then(({ error }) => { if (error) console.error("image_urls 저장 실패:", error); });

    return allUrls;
  };

  // assignments 상태에서 이미지 URL 배열 반환
  const getImage = (assignmentId) => {
    const a = assignments.find((a) => a.id === assignmentId);
    return a?.imageUrls || [];
  };

  // ── 로딩 화면 ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#2BAE9A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">데이터 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // ── 누락 테이블 에러 화면 ──────────────────────────────────────
  if (missingTables.length > 0) {
    return (
      <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Supabase 테이블 누락</h2>
            <p className="text-sm text-gray-500">아래 테이블이 Supabase에 없습니다. SQL을 실행해주세요.</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
            {missingTables.map((t) => (
              <p key={t} className="text-sm font-mono text-red-700 font-semibold">❌ {t}</p>
            ))}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
            <p className="text-xs font-semibold text-gray-600 mb-2">Supabase 대시보드 → SQL Editor에서 실행:</p>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{`create table if not exists memos (
  id         bigint primary key,
  title      text default '',
  content    text default '',
  category   text default '',
  created_at text not null,
  updated_at text not null,
  archived   boolean default false
);
alter table memos disable row level security;

create table if not exists report_data (
  student_id bigint not null references students(id) on delete cascade,
  month_str  text not null,
  comment    text default '',
  growth     text default '',
  primary key (student_id, month_str)
);
alter table report_data disable row level security;

create table if not exists app_settings (
  key   text primary key,
  value text default ''
);
alter table app_settings disable row level security;`}</pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-[#2BAE9A] hover:bg-[#249e8c] text-white rounded-xl text-sm font-semibold transition"
          >
            SQL 실행 후 새로고침
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        isLoggedIn, login, logout, changePassword,
        students, addStudent, updateStudent, deleteStudent,
        assignments, addAssignment, updateAssignment, deleteAssignment, saveImage, getImage,
        attendance, markAttendance, homework, markHomework, absenceReason, markAbsenceReason,
        schedule, addScheduleItem, updateScheduleItem, deleteScheduleItem,
        curriculum, addCurriculumClass, updateCurriculumClass, deleteCurriculumClass,
        addCurriculumStage, addCurriculumLesson, updateCurriculumLesson, deleteCurriculumLesson,
        weekNotes, setWeekNote,
        memos, addMemo, updateMemo, deleteMemo,
        reportData, saveReportComment, saveReportGrowth,
        logo, saveLogo,
        apiKey, saveApiKey,
        currentPage, setCurrentPage,
        selectedStudent, setSelectedStudent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
