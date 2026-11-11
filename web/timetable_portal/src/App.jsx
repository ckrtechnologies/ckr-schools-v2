const BASE_PATH = import.meta.env.BASE_URL || "/";
const ROUTER_BASENAME = BASE_PATH.replace(/\/$/, "") || "/";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import PortalLayout from "./layouts/PortalLayout";
import TimeTable from "./pages/TimeTable";
import ProxiesPage from "./pages/ProxiesPage";
import GeneratorPage from "./pages/GeneratorPage";
import TeacherScheduleModule from "./modules/teacher_schedule/TeacherScheduleModule";
import RoomSchedulesPage from "./pages/RoomSchedulesPage";
import SubjectManagerModule from "./modules/subjects/SubjectManagerModule";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <ToastContainer theme="colored" position="top-right" autoClose={3000} style={{ zIndex: 999999 }} />
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Portal Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <PortalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TimeTable />} />
          <Route path="timetable" element={<TimeTable />} />
          <Route path="classes" element={<TimeTable />} />
          <Route path="proxies" element={<ProxiesPage />} />
          <Route path="teachers" element={<TeacherScheduleModule key="teachers" initialView="routine" />} />
          <Route path="allotment" element={<TeacherScheduleModule key="allotment" initialView="allotment" />} />
          <Route path="matrix" element={<TeacherScheduleModule key="matrix" initialView="matrix" />} />
          <Route path="quotas" element={<TeacherScheduleModule key="quotas" initialView="matrix" />} />
          <Route path="generator" element={<GeneratorPage />} />
          <Route path="subjects" element={<SubjectManagerModule />} />
          <Route path="rooms" element={<RoomSchedulesPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/timetable" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
