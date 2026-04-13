import React from "react";
import "./index.css";
import { AppProvider, useApp } from "./context/AppContext";
import LoginPage from "./components/LoginPage";
import Navbar from "./components/Navbar";
import StudentsPage from "./components/StudentsPage";
import AssignmentsPage from "./components/AssignmentsPage";
import ReportsPage from "./components/ReportsPage";
import ClassProgressPage from "./components/ClassProgressPage";
import AttendancePage from "./components/AttendancePage";
import SchedulePage from "./components/SchedulePage";
import CurriculumPage from "./components/CurriculumPage";
import MemoPage from "./components/MemoPage";

function AppContent() {
  const { isLoggedIn, currentPage } = useApp();

  if (!isLoggedIn) return <LoginPage />;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F3F0]">
      <Navbar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {currentPage === "students"    && <StudentsPage />}
        {currentPage === "assignments" && <AssignmentsPage />}
        {currentPage === "reports"     && <ReportsPage />}
        {currentPage === "progress"    && <ClassProgressPage />}
        {currentPage === "attendance"  && <AttendancePage />}
        {currentPage === "schedule"    && <SchedulePage />}
        {currentPage === "curriculum"  && <CurriculumPage />}
        {currentPage === "memo"        && <MemoPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
