import { NavLink } from "react-router-dom";
import {
  BookOpen, Brain, CalendarDays, ClipboardCheck,
  GraduationCap, History, LayoutDashboard, Monitor, Sparkles, Timer,
  UserRound, Settings,
} from "lucide-react";

const mainLinks = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/attendance", "Attendance", ClipboardCheck],
  ["/academic-performance", "Academic Performance", GraduationCap],
  ["/exam-countdown", "Exams", CalendarDays],
] as const;
const studyLinks = [
  ["/ai-study-assistant", "AI Study Assistant", Sparkles],
  ["/study-materials", "Study Materials", BookOpen],
  ["/notes", "Notes", BookOpen],
  ["/mcq-generator", "MCQ Generator", Brain],
  ["/mcq-history", "MCQ History", History],
  ["/lab-program-generator", "Lab Programs", Monitor],
  ["/study-planner", "Study Planner", Timer],
] as const;

function Sidebar() {
  const renderLinks = (links: readonly (readonly [string, string, typeof LayoutDashboard])[]) =>
    links.map(([to, label, Icon]) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
            isActive
              ? "bg-violet-100 text-violet-900 shadow-[inset_0_0_0_1px_rgba(167,139,250,.35)]"
              : "text-slate-600 hover:bg-violet-50 hover:text-violet-900"
          }`
        }
      >
        <Icon className="h-[18px] w-[18px] shrink-0 text-violet-700" />
        <span className="nav-label truncate">{label}</span>
      </NavLink>
    ));

  return (
    <aside className="desktop-sidebar sticky top-0 z-20 flex h-screen w-64 shrink-0 flex-col border-r border-violet-100 bg-white p-4">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 shadow-lg shadow-violet-900/10">
          <Sparkles className="h-5 w-5 text-violet-800" />
        </div>
        <div className="brand-copy min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">AI College</p>
          <p className="truncate text-xs text-violet-700">Companion</p>
        </div>
      </div>
      <p className="section-label mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">Main</p>
      <nav className="space-y-1">{renderLinks(mainLinks)}</nav>
      <p className="section-label mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">Study</p>
      <nav className="space-y-1">{renderLinks(studyLinks)}</nav>
      <div className="mt-auto space-y-1 border-t border-violet-100 pt-4">
        <NavLink to="/profile" className="account-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-900">
          <UserRound className="h-[18px] w-[18px] text-violet-700" /><span className="nav-label">Profile</span>
        </NavLink>
        <button className="account-link flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-900">
          <Settings className="h-[18px] w-[18px] text-violet-700" /><span className="nav-label">Settings</span>
        </button>
      </div>
    </aside>
  );
}
export default Sidebar;
