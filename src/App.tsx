import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
// import StatCard from "./components/Statcard";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import AIStudyAssistant from "./pages/AIStudyAssistant";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import AcademicPerformance from "./pages/AcademicPerformance";
import Notes from "./pages/Notes";
import StudyMaterials from "./pages/StudyMaterials";
import ExamCountdown from "./pages/ExamCountdown";
import StudyPlanner from "./pages/StudyPlanner";
import MCQGenerator from "./pages/MCQGenerator";
import MCQHistory from "./pages/MCQHistory";
import LabProgramGenerator from "./pages/LabProgramGenerator";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { initializeFirebaseNotifications } from "./services/firebaseNotificationManager";

function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!user) return;
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      unsubscribe = await initializeFirebaseNotifications();
    };

    void initialize();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);
  
  return (
    <BrowserRouter>
      <AppRoutes userExists={Boolean(user)} loading={loading} />
    </BrowserRouter>
  );
}

function AppRoutes({ userExists, loading }: { userExists: boolean; loading: boolean }) {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  if (loading && location.pathname === "/") {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="app-shell">
      {userExists && !isAuthPage && <Navbar />}
      <div className="flex">
        {userExists && !isAuthPage && <Sidebar />}
        <div className={userExists && !isAuthPage ? "page-surface" : "w-full"}>
          <Routes>
            <Route
              path="/"
              element={<Navigate to={userExists ? "/dashboard" : "/login"} replace />}
            />
            <Route
              path="/login"
              element={userExists ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
              path="/register"
              element={userExists ? <Navigate to="/dashboard" replace /> : <Register />}
            />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/ai-study-assistant" element={<AIStudyAssistant />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/academic-performance" element={<AcademicPerformance />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/study-materials" element={<StudyMaterials />} />
              <Route path="/exam-countdown" element={<ExamCountdown />} />
              <Route path="/study-planner" element={<StudyPlanner />} />
              <Route path="/mcq-generator" element={<MCQGenerator />} />
              <Route path="/mcq-history" element={<MCQHistory />} />
              <Route path="/lab-program-generator" element={<LabProgramGenerator />} />
            </Route>
            <Route
              path="*"
              element={<Navigate to={userExists ? "/dashboard" : "/login"} replace />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;