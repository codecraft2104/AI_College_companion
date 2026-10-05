import { LogOut, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const titles: Record<string, [string, string]> = {
  "/dashboard": ["Dashboard", "Your academic overview"],
  "/attendance": ["Attendance", "Stay consistent with your classes"],
  "/academic-performance": ["Academic Performance", "Track your progress"],
  "/exam-countdown": ["Exams", "Prepare with confidence"],
  "/ai-study-assistant": ["AI Study Assistant", "Your personal learning copilot"],
  "/study-materials": ["Study Materials", "Everything you need to revise"],
  "/notes": ["Notes", "Organize your thinking"],
  "/mcq-generator": ["MCQ Generator", "Practice smarter with AI"],
  "/mcq-history": ["MCQ History", "Your practice performance"],
  "/lab-program-generator": ["Lab Programs", "Build and understand better"],
  "/study-planner": ["Study Planner", "Make every study session count"],
  "/profile": ["Profile", "Manage your student account"],
};

function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [title, subtitle] = titles[location.pathname] ?? ["AI College Companion", "Your personal AI assistant"];

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-10 border-b border-violet-100 bg-white/95 backdrop-blur-xl">
      <div className="flex min-h-[76px] items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="hidden h-9 w-9 items-center justify-center rounded-lg bg-violet-100 sm:flex">
            <Sparkles className="h-4 w-4 text-violet-700" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            <div className="hidden items-center gap-2 border-l border-violet-100 pl-4 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-900">
                {(user.email?.[0] ?? "S").toUpperCase()}
              </div>
              <span className="max-w-40 truncate text-sm text-slate-700">{user.email}</span>
            </div>
            <button aria-label="Log out" onClick={handleLogout} className="rounded-lg p-2 text-slate-600 hover:bg-red-50 hover:text-red-700">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
export default Navbar;
