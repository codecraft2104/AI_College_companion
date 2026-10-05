import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, ClipboardCheck, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/profileService";
import { getSubjects, getAttendance, calculateOverallAttendance } from "../services/attendanceService";
import { getExams, type Exam } from "../services/examService";
import { getStudyTasks, type StudyTask } from "../services/studyTaskService";
import { calculateCGPA, getSemesterResults, type SemesterResult } from "../services/cgpaService";

interface ProfileSummary { full_name?: string; department?: string; semester?: number; college?: string; }
interface AttendanceRow { attended_classes: number; total_classes: number; }

function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [semesters, setSemesters] = useState<SemesterResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [profileData, examData, taskData, semesterData, subjectData] = await Promise.all([
          getProfile(user.id), getExams(), getStudyTasks(), getSemesterResults(), getSubjects(user.id),
        ]);
        const attendanceData = await Promise.all(subjectData.map((subject) => getAttendance(user.id, subject.id)));
        setProfile(profileData as ProfileSummary);
        setExams(examData); setTasks(taskData); setSemesters(semesterData);
        setAttendance(attendanceData.filter((row): row is AttendanceRow => row !== null));
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally { setLoading(false); }
    };
    void load();
  }, [user]);

  const overallAttendance = calculateOverallAttendance(attendance);
  const pendingTasks = tasks.filter((task) => !task.completed).length;
  const nextExam = useMemo(() => exams.find((exam) => new Date(exam.exam_date) > new Date()), [exams]);
  const cgpa = calculateCGPA(semesters);
  const completedClasses = attendance.reduce((sum, row) => sum + row.attended_classes, 0);
  const totalClasses = attendance.reduce((sum, row) => sum + row.total_classes, 0);

  if (loading) return <main className="px-6 py-8 sm:px-8"><div className="premium-card h-36 animate-pulse bg-white/[.03]" /></main>;

  return (
    <main className="px-6 py-8 sm:px-8">
      <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="muted-label mb-2">Academic overview</p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Good evening{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} <span className="text-violet-300">✦</span>
          </h2>
          <p className="mt-2 text-slate-400">Everything you need for college, organized in one place.</p>
        </div>
        <Link to="/ai-study-assistant" className="gradient-button inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold">
          <Sparkles className="h-4 w-4" /> Ask your AI assistant
        </Link>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="premium-card p-5"><div className="mb-5 flex items-center justify-between"><span className="rounded-lg bg-violet-500/10 p-2 text-violet-300"><ClipboardCheck className="h-5 w-5" /></span><span className="text-xs text-slate-500">This semester</span></div><p className="text-sm text-slate-400">Overall attendance</p><p className="mt-1 text-3xl font-bold text-white">{overallAttendance}%</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" style={{ width: `${Math.min(overallAttendance, 100)}%` }} /></div><p className="mt-2 text-xs text-slate-500">{completedClasses} present of {totalClasses} classes</p></div>
        <div className="premium-card p-5"><div className="mb-5 flex items-center justify-between"><span className="rounded-lg bg-indigo-500/10 p-2 text-indigo-300"><Target className="h-5 w-5" /></span><span className="text-xs text-slate-500">Weighted</span></div><p className="text-sm text-slate-400">Current CGPA</p><p className="mt-1 text-3xl font-bold text-white">{cgpa.toFixed(2)}</p><p className="mt-5 text-xs text-slate-500">{semesters.length ? `${semesters.length} semester${semesters.length > 1 ? "s" : ""} recorded` : "Add semester results to begin"}</p></div>
        <div className="premium-card p-5"><div className="mb-5 flex items-center justify-between"><span className="rounded-lg bg-fuchsia-500/10 p-2 text-fuchsia-300"><CalendarDays className="h-5 w-5" /></span><span className="text-xs text-slate-500">Next up</span></div><p className="text-sm text-slate-400">Upcoming exam</p><p className="mt-1 truncate text-xl font-bold text-white">{nextExam?.subject ?? "No exams yet"}</p><p className="mt-5 text-xs text-slate-500">{nextExam ? new Date(nextExam.exam_date).toLocaleDateString(undefined, { dateStyle: "medium" }) : "Plan your first exam"}</p></div>
        <div className="premium-card p-5"><div className="mb-5 flex items-center justify-between"><span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-300"><CheckCircle2 className="h-5 w-5" /></span><span className="text-xs text-slate-500">Your momentum</span></div><p className="text-sm text-slate-400">Pending study tasks</p><p className="mt-1 text-3xl font-bold text-white">{pendingTasks}</p><p className="mt-5 text-xs text-slate-500">{tasks.length - pendingTasks} completed so far</p></div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section className="premium-card p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-semibold text-white">Upcoming exams</h3><p className="mt-1 text-sm text-slate-500">Stay ahead of your deadlines</p></div><Link to="/exam-countdown" className="text-sm text-violet-300 hover:text-white">View all <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>{exams.slice(0, 3).map((exam) => <div key={exam.id} className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[.025] p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-violet-500/10 p-2 text-violet-300"><BookOpen className="h-4 w-4" /></div><div><p className="font-medium text-white">{exam.subject}</p><p className="text-xs text-slate-500">{new Date(exam.exam_date).toLocaleString()}</p></div></div><span className="text-xs text-violet-300">{Math.max(0, Math.ceil((new Date(exam.exam_date).getTime() - Date.now()) / 86400000))} days</span></div>)}{exams.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No exams scheduled yet.</p>}</section>
        <section className="premium-card overflow-hidden bg-gradient-to-br from-violet-950/50 to-[#101016] p-6"><Sparkles className="mb-5 h-6 w-6 text-violet-300" /><h3 className="text-xl font-semibold text-white">Need help studying?</h3><p className="mt-2 text-sm leading-6 text-slate-400">Ask AI College Companion to explain a concept, summarize a chapter, or build a study plan for you.</p><Link to="/ai-study-assistant" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-white">Start a conversation <ArrowRight className="h-4 w-4" /></Link></section>
      </div>
    </main>
  );
}
export default Dashboard;
