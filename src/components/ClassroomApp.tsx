import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, GraduationCap, FileText, ClipboardList, LogOut, School, Plus,
  ChevronRight, ArrowLeft, CheckCircle2, Clock, Award, Users, Calendar, X,
  Send, Star, MessageSquare, LayoutDashboard, Lock, Unlock, AlertTriangle,
  UserCheck, Search, HelpCircle, Check, Sparkles, Video, Bookmark, Printer,
  AlertCircle, CheckSquare, TrendingUp, BarChart2, Flame, Bell, HeartHandshake,
  ShieldCheck, Edit3, Eye, Download, Filter, Cloud, Mail, Copy
} from 'lucide-react';
import { accountService, STANDARD_CLASSES } from '../services/accountService';
import { classroomService } from '../services/classroomService';
import { pdfService } from '../services/pdfService';
import { FirebaseCloudSyncModal } from './FirebaseCloudSyncModal';
import { ClassroomAIAssistantModal } from './classroom/ClassroomAIAssistantModal';
import { Account, StatusKelulusan, KebutuhanKhusus } from '../types/classroom';
import { ClassroomCourse, ClassroomAssignment, ClassroomSubmission, ClassroomReport } from '../types/classroom';
import { ClassroomForumView } from './classroom/ClassroomForumView';
import { ClassroomAttendanceView } from './classroom/ClassroomAttendanceView';
import { ClassroomQuizCBTView } from './classroom/ClassroomQuizCBTView';
import { ClassroomMaterialsView } from './classroom/ClassroomMaterialsView';
import { ClassroomGradebookView } from './classroom/ClassroomGradebookView';
import { ClassroomScheduleView } from './classroom/ClassroomScheduleView';
import { ClassroomMediaView } from './classroom/ClassroomMediaView';

// ==========================================
// DEADLINE WARNING NOTIFICATION UTILITY (<24h)
// ==========================================
export const getDeadlineWarning = (deadlineStr?: string): {
  isUrgent: boolean;
  isOverdue: boolean;
  text: string;
  badgeClass: string;
  cardHighlight: string;
} | null => {
  if (!deadlineStr) return null;
  const now = new Date();
  const deadline = new Date(deadlineStr + (deadlineStr.includes('T') ? '' : 'T23:59:59'));
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) {
    return {
      isUrgent: true,
      isOverdue: true,
      text: 'Lewat Tenggat Waktu',
      badgeClass: 'bg-rose-600 text-white font-extrabold shadow-2xs',
      cardHighlight: 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-300',
    };
  } else if (diffHours <= 24) {
    return {
      isUrgent: true,
      isOverdue: false,
      text: '🚨 Tenggat < 24 Jam (Hari Ini)',
      badgeClass: 'bg-red-600 text-white font-black animate-pulse shadow-2xs flex items-center gap-1',
      cardHighlight: 'border-red-400 bg-red-50/25 ring-1 ring-red-400 shadow-xs',
    };
  } else if (diffHours <= 72) {
    return {
      isUrgent: false,
      isOverdue: false,
      text: `⏳ Sisa ${Math.ceil(diffHours / 24)} Hari`,
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
      cardHighlight: 'border-amber-200',
    };
  }
  return null;
};

interface ClassroomAppProps {
  onLogout: () => void;
}

type ClassPage =
  | 'dashboard'
  | 'forum'
  | 'attendance'
  | 'quizzes'
  | 'materials'
  | 'media'
  | 'courses'
  | 'students'
  | 'assignments'
  | 'gradebook'
  | 'schedule'
  | 'reports';

export const ClassroomApp: React.FC<ClassroomAppProps> = ({ onLogout }) => {
  const [account, setAccount] = useState<Account | null>(accountService.getActiveClassroomAccount());
  const [page, setPage] = useState<ClassPage>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobileNav, setIsMobileNav] = useState(false);
  const [showUnlockInfo, setShowUnlockInfo] = useState(false);

  useEffect(() => {
    accountService.initAccounts();
    classroomService.initClassroom();
    // Sync current account from localStorage if updated
    const active = accountService.getActiveClassroomAccount();
    if (active) setAccount(active);
  }, [refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);
  useEffect(() => { refresh(); }, [page]);

  if (!account) {
    onLogout();
    return null;
  }

  const isSiswa = account.ROLE === 'SISWA';
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';

  // Check if Guru needs one-time class selection & locking
  const needsClassLock = isGuru && (!account.KELAS || !account.KELAS_LOCKED);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const allCourses = classroomService.getCourses();
  const courses = isSiswa
    ? classroomService.getCoursesForSiswa(account.ID, account.KELAS)
    : isGuru
    ? classroomService.getCoursesForGuru(account.ID, account.KELAS)
    : allCourses;

  const allAssignments = isSiswa
    ? courses.flatMap((c) => classroomService.getAssignments(c.ID))
    : isGuru
    ? courses.flatMap((c) => classroomService.getAssignments(c.ID))
    : classroomService.getAssignments();

  const mySubmissions = isSiswa ? classroomService.getSubmissions(undefined, account.ID) : [];
  const allSubmissions = classroomService.getSubmissions();
  const reports = isGuru ? classroomService.getReportsForGuru(account.ID) : classroomService.getReports();

  const classStudents = isGuru && account.KELAS
    ? accountService.getStudents(account.KELAS)
    : accountService.getStudents();

  const navItems: { id: ClassPage; label: string; icon: any; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'forum', label: 'Forum Diskusi & Stream', icon: MessageSquare },
    { id: 'attendance', label: 'Presensi & Kehadiran', icon: UserCheck },
    { id: 'quizzes', label: 'Kuis & Ujian CBT', icon: Award },
    { id: 'materials', label: 'Bahan Ajar & Modul', icon: BookOpen },
    { id: 'media', label: 'Media Pembelajaran', icon: Video },
    { id: 'courses', label: 'Kelas Saya', icon: School },
    { id: 'assignments', label: 'Tugas & PR Siswa', icon: ClipboardList },
    { id: 'gradebook', label: 'Buku Nilai & E-Rapor', icon: Printer },
    { id: 'schedule', label: 'Jadwal & Kalender', icon: Calendar },
    ...((isGuru || isKepsek) ? [{ id: 'students' as ClassPage, label: isGuru ? `Data Siswa (${account.KELAS || 'Kelas'})` : 'Data Siswa Semua Kelas', icon: Users }] : []),
    { id: 'reports', label: 'Laporan Guru (Kepsek)', icon: FileText },
  ];

  const handleClassLocked = (updatedAccount: Account) => {
    setAccount(updatedAccount);
    refresh();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased">
      {/* ONE-TIME CLASS LOCK PROMPT MODAL FOR TEACHERS */}
      {needsClassLock && (
        <TeacherClassLockModal
          guruAccount={account}
          onLocked={handleClassLocked}
          onLogout={onLogout}
        />
      )}

      {/* Top Bar */}
      <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white sticky top-0 z-30 shadow-lg">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileNav(!isMobileNav)} className="lg:hidden p-2 rounded-lg hover:bg-white/10">
              <BookOpen size={20} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center shadow-inner">
              <GraduationCap size={22} className="text-blue-200" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight leading-none">SDN Tangerang 6 Classroom</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-blue-300 font-semibold">Portal Pembelajaran Terpadu</span>
                {isGuru && account.KELAS && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <Lock size={9} /> {account.KELAS} (Terkunci)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold leading-none">{account.NAMA}</div>
              <div className="text-[10px] text-blue-300 mt-0.5 flex items-center justify-end gap-1.5">
                <span>{account.ROLE}</span>
                {account.KELAS && <span>• {account.KELAS}</span>}
                {isGuru && account.KELAS_LOCKED && (
                  <button
                    onClick={() => setShowUnlockInfo(true)}
                    className="inline-flex items-center gap-0.5 text-amber-300 hover:underline cursor-pointer"
                    title="Info Kunci Kelas"
                  >
                    <Lock size={10} /> Terkunci
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowAIAssistant(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition border shadow-xs ${
                isSiswa
                  ? 'bg-indigo-500/30 hover:bg-indigo-500/40 text-amber-300 border-indigo-400/40'
                  : isGuru
                  ? 'bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 border-emerald-400/40'
                  : 'bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 border-purple-400/40'
              }`}
              title={
                isSiswa
                  ? 'AI Asisten Belajar Siswa (Tanya Pelajaran & Panduan Tugas)'
                  : isGuru
                  ? 'AI Asisten Guru (Penyusun RPP, Modul Ajar & Evaluasi)'
                  : 'AI Asisten Kepala Sekolah (Supervisi Akademik & Analisis Mutu)'
              }
            >
              <Sparkles size={14} className="text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">
                {isSiswa ? 'AI Belajar' : isGuru ? 'AI Guru' : 'AI Supervisi'}
              </span>
            </button>
            <button
              onClick={() => setShowCloudModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 font-bold text-xs transition"
              title="Sinkronisasi Cloud Realtime"
            >
              <Cloud size={15} />
              <span className="hidden sm:inline">Cloud Sync</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
            <div className="w-9 h-9 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center font-bold text-sm shadow-xs">
              {account.NAMA.charAt(0)}
            </div>
            <button onClick={onLogout} className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-slate-200 hover:text-white transition-colors" title="Keluar">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Teacher Lock Info Banner */}
      {isGuru && account.KELAS_LOCKED && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 sm:px-6 py-2 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-blue-900 min-w-0">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Lock size={12} />
            </div>
            <span className="font-bold truncate">
              Kelas Pengampu Terkunci: <span className="text-emerald-700 font-extrabold">{account.KELAS}</span>
            </span>
            <span className="text-[11px] text-slate-600 hidden md:inline">
              (Data siswa otomatis disesuaikan secara permanen)
            </span>
          </div>
          <button
            onClick={() => setShowUnlockInfo(true)}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline shrink-0 flex items-center gap-1"
          >
            <HelpCircle size={13} /> Butuh Buka Kunci?
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`fixed lg:static top-16 bottom-0 left-0 z-20 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 lg:translate-x-0 ${isMobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Status Pengguna</div>
            <div className="text-xs font-bold text-white truncate">{account.NAMA}</div>
            <div className="text-[11px] text-blue-400 font-semibold mt-0.5">
              {account.ROLE} {account.KELAS ? `• ${account.KELAS}` : ''}
            </div>
            {isGuru && (
              <div className="mt-2.5 p-2 bg-slate-800/80 rounded-xl border border-slate-700 text-[10px] text-slate-300 flex items-center gap-1.5">
                <Lock size={12} className="text-emerald-400 shrink-0" />
                <span>Kelas {account.KELAS || '-'} (Terkunci 1x)</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setPage(item.id); setSelectedCourseId(null); setIsMobileNav(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    page === item.id ? 'bg-blue-700 text-white shadow-sm font-bold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={16} className={page === item.id ? 'text-blue-200' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
            Classroom Terpadu SDN Tangerang 6
          </div>
        </aside>

        {isMobileNav && <div className="fixed inset-0 top-16 z-10 bg-slate-950/50 lg:hidden" onClick={() => setIsMobileNav(false)} />}

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full" key={refreshKey}>
          {page === 'dashboard' && (
            <DashboardView
              account={account}
              courses={courses}
              assignments={allAssignments}
              reports={reports}
              submissions={isSiswa ? mySubmissions : allSubmissions}
              studentsCount={classStudents.length}
              onNavigate={setPage}
            />
          )}
          {page === 'forum' && (
            <ClassroomForumView
              account={account}
              onRefresh={refresh}
            />
          )}
          {page === 'attendance' && (
            <ClassroomAttendanceView
              account={account}
              onRefresh={refresh}
            />
          )}
          {page === 'quizzes' && (
            <ClassroomQuizCBTView
              account={account}
              onRefresh={refresh}
            />
          )}
          {page === 'materials' && (
            <ClassroomMaterialsView
              account={account}
              onRefresh={refresh}
            />
          )}
          {page === 'media' && (
            <ClassroomMediaView
              account={account}
              courses={courses}
              refresh={refresh}
            />
          )}
          {page === 'courses' && (
            <CoursesView
              account={account}
              courses={courses}
              selectedCourseId={selectedCourseId}
              onSelect={setSelectedCourseId}
              onRefresh={refresh}
            />
          )}
          {page === 'students' && (
            <StudentsListView
              account={account}
              onRefresh={refresh}
            />
          )}
          {page === 'assignments' && (
            <AssignmentsView
              account={account}
              courses={courses}
              assignments={allAssignments}
              onRefresh={refresh}
            />
          )}
          {page === 'gradebook' && (
            <ClassroomGradebookView
              account={account}
              onRefresh={refresh}
            />
          )}
          {page === 'schedule' && (
            <ClassroomScheduleView
              account={account}
              onRefresh={refresh}
            />
          )}
          {page === 'reports' && (
            <ReportsView
              account={account}
              reports={reports}
              onRefresh={refresh}
            />
          )}
        </main>
      </div>

      {/* Unlock Info Modal */}
      {showUnlockInfo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Lock size={16} />
                </div>
                <h3 className="text-sm font-black text-slate-900">Sistem Penguncian Kelas Guru</h3>
              </div>
              <button type="button" onClick={() => setShowUnlockInfo(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                <strong>Ketentuan Penguncian:</strong> Sesuai instruksi sistem, guru hanya dapat memilih kelas mengajar sebanyak <strong>1 kali</strong> saat awal masuk. Setelah itu, kelas terkunci otomatis untuk menjaga integritas data siswa dan pembelajaran.
              </p>
              <p>
                <strong>Cara Mengubah Kelas:</strong> Jika guru perlu berpindah kelas (misal: rotasi tahun ajaran baru atau pertukaran kelas), silakan hubungi <strong>Administrator Sistem</strong> untuk membuka kunci kelas melalui <strong>Panel Admin</strong>.
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-800">
              <span className="font-bold">Akun Anda:</span> {account.NAMA} ({account.USERNAME})<br />
              <span className="font-bold">Kelas Saat Ini:</span> {account.KELAS || 'Belum diatur'}<br />
              <span className="font-bold">Status:</span> {account.KELAS_LOCKED ? '🔒 Terkunci Permanen' : '🔓 Terbuka'}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowUnlockInfo(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Firebase Firestore Cloud Sync Modal */}
      <FirebaseCloudSyncModal
        isOpen={showCloudModal}
        onClose={() => setShowCloudModal(false)}
      />

      {/* Role-Specific Classroom AI Assistant Modal (Siswa, Guru, Kepala Sekolah) */}
      <ClassroomAIAssistantModal
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        account={account}
      />
    </div>
  );
};

// ============ TEACHER ONE-TIME CLASS SELECTION & LOCK MODAL ============
const TeacherClassLockModal: React.FC<{
  guruAccount: Account;
  onLocked: (account: Account) => void;
  onLogout: () => void;
}> = ({ guruAccount, onLocked, onLogout }) => {
  const [selectedClass, setSelectedClass] = useState<string>('Kelas 1');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const classesSummary = accountService.getClassSummary();

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) {
      setError('Silakan pilih kelas mengajar Anda terlebih dahulu.');
      return;
    }
    if (!confirmed) {
      setError('Anda harus menyetujui pernyataan konfirmasi penguncian kelas.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const updated = accountService.lockTeacherClass(guruAccount.ID, selectedClass);
      setIsSaving(false);
      if (updated) {
        onLocked(updated);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
              <Lock size={24} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle size={12} /> Pengaturan Satu Kali (1x) Terkunci
              </span>
              <h2 className="text-lg font-black text-white mt-0.5">
                Pilih & Kunci Kelas Mengajar Anda
              </h2>
              <p className="text-xs text-blue-200">
                Selamat Datang, <strong>{guruAccount.NAMA}</strong> (Guru SDN Tangerang 6)
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          {/* Notice Box */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <Lock size={14} /> Ketentuan Penting Sistem Classroom:
            </div>
            <p>
              1. Pemilihan kelas hanya dapat dilakukan <strong>SATU KALI (1x)</strong> pada saat pertama kali Anda masuk ke Classroom.
            </p>
            <p>
              2. Setelah Anda memilih kelas dan menekan tombol konfirmasi, <strong>kelas ini akan langsung terkunci</strong>. Data seluruh siswa pada kelas tersebut akan <strong>secara otomatis disinkronkan</strong> ke dalam akun mengajar Anda.
            </p>
            <p>
              3. Untuk mengubah atau mereset kelas setelah dikunci, diperlukan persetujuan dan pembukaan kunci melalui <strong>Akun Administrator</strong>.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-black text-slate-900 block mb-2 uppercase tracking-wide">
              Pilih Kelas yang Anda Ampu:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {STANDARD_CLASSES.map((cls) => {
                const summary = classesSummary.find((c) => c.kelas === cls);
                const count = summary ? summary.studentCount : 0;
                const isSelected = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => { setSelectedClass(cls); setError(null); }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                        <Check size={12} />
                      </div>
                    )}
                    <div className="font-black text-sm text-slate-900">{cls}</div>
                    <div className="text-[11px] text-blue-700 font-bold mt-1 flex items-center gap-1">
                      <Users size={12} /> {count} Siswa Terdaftar
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                      {summary && summary.students.length > 0
                        ? summary.students.map((s) => s.NAMA.split(' ')[0]).slice(0, 3).join(', ') + '...'
                        : 'Siswa siap disinkronkan'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student Preview Box */}
          {selectedClass && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-emerald-600" />
                  Pratinjau Siswa di <span className="text-blue-700 font-extrabold">{selectedClass}</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {accountService.getStudents(selectedClass).length} Siswa akan langsung masuk ke kelas Anda
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {accountService.getStudents(selectedClass).map((s) => (
                  <span key={s.ID} className="inline-flex items-center gap-1 text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> {s.NAMA} ({s.NIP || 'NIS'})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 leading-snug">
                Saya menyatakan dengan sungguh-sungguh bahwa saya adalah <strong>Guru Pengampu {selectedClass}</strong> dan menyetujui bahwa pilihan ini akan <strong>terkunci permanen</strong>.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs"
            >
              Batal & Keluar
            </button>
            <button
              type="submit"
              disabled={isSaving || !confirmed}
              className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Lock size={14} />
              {isSaving ? 'Menyinkronkan & Mengunci...' : `Konfirmasi & Kunci ${selectedClass}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============ DASHBOARD VIEW ============
const DashboardView: React.FC<{
  account: Account;
  courses: ClassroomCourse[];
  assignments: ClassroomAssignment[];
  reports: ClassroomReport[];
  submissions: ClassroomSubmission[];
  studentsCount: number;
  onNavigate: (p: ClassPage) => void;
  onRefresh?: () => void;
}> = ({ account, courses, assignments, reports, submissions, studentsCount, onNavigate, onRefresh }) => {
  const isSiswa = account.ROLE === 'SISWA';
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';

  const [activeGradeSubmission, setActiveGradeSubmission] = useState<ClassroomSubmission | null>(null);
  const [showTeacherToast, setShowTeacherToast] = useState<boolean>(true);

  // Submissions with status 'SUBMITTED' waiting for teacher grading
  const pendingSubmissionsForTeacher = isGuru
    ? submissions.filter((sub) => {
        if (sub.STATUS !== 'SUBMITTED') return false;
        const asg = assignments.find((a) => a.ID === sub.ASSIGNMENT_ID);
        if (asg) {
          const course = courses.find((c) => c.ID === asg.COURSE_ID);
          if (course) return true;
        }
        const student = accountService.getAccountById(sub.SISWA_ID);
        return student?.KELAS === account.KELAS;
      })
    : [];

  const pendingTasks = isSiswa
    ? assignments.filter((a) => !submissions.find((s) => s.ASSIGNMENT_ID === a.ID && s.STATUS !== 'DRAFT')).length
    : 0;
  const submittedCount = submissions.filter((s) => s.STATUS === 'SUBMITTED' || s.STATUS === 'GRADED').length;
  const pendingReports = reports.filter((r) => r.STATUS === 'DIKIRIM').length;
  const myReportCount = isGuru ? reports.length : 0;

  // Urgent assignments (<24h deadline) for student
  const urgentAssignments = isSiswa
    ? assignments.filter((a) => {
        const isDone = submissions.some((s) => s.ASSIGNMENT_ID === a.ID && s.STATUS !== 'DRAFT');
        if (isDone) return false;
        const warn = getDeadlineWarning(a.DEADLINE);
        return warn?.isUrgent;
      })
    : [];

  const stats = [
    { label: 'Kelas Aktif', value: courses.length, icon: School, color: 'text-blue-700 bg-blue-100' },
    ...(isGuru
      ? [
          { label: `Siswa ${account.KELAS || ''}`, value: studentsCount, icon: Users, color: 'text-emerald-700 bg-emerald-100' },
          { label: 'Tugas & Materi', value: assignments.length, icon: ClipboardList, color: 'text-indigo-700 bg-indigo-100' },
          { label: 'Tugas Perlu Dinilai', value: pendingSubmissionsForTeacher.length, icon: Award, color: 'text-amber-700 bg-amber-100' },
        ]
      : isSiswa
      ? [
          { label: 'Tugas & Materi', value: assignments.length, icon: ClipboardList, color: 'text-indigo-700 bg-indigo-100' },
          { label: 'Tugas Belum Selesai', value: pendingTasks, icon: Clock, color: 'text-amber-700 bg-amber-100' },
          { label: 'Sudah Dikumpulkan', value: submittedCount, icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-100' },
        ]
      : [
          { label: 'Total Siswa Semua Kelas', value: studentsCount, icon: Users, color: 'text-emerald-700 bg-emerald-100' },
          { label: 'Laporan Guru Menunggu Nilai', value: pendingReports, icon: Award, color: 'text-amber-700 bg-amber-100' },
          { label: 'Total Laporan', value: reports.length, icon: FileText, color: 'text-purple-700 bg-purple-100' },
        ]),
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold mb-1">
            <GraduationCap size={16} /> Portal Akademik Terpadu
          </div>
          <h2 className="text-2xl font-black">{account.NAMA}</h2>
          <p className="text-blue-200 text-xs mt-1 max-w-xl">
            {isSiswa
              ? `Siswa ${account.KELAS || ''} • NIS: ${account.NIP || '-'}`
              : isGuru
              ? `Guru Pengampu ${account.KELAS || ''} • NIP: ${account.NIP || '-'} (Terkunci Otomatis)`
              : 'Kepala Sekolah • Penilai Laporan Guru'} • SD Negeri Tangerang 6
          </p>

          {isGuru && account.KELAS && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur-xs border border-white/25 px-3 py-1.5 rounded-xl text-xs">
              <Lock size={13} className="text-emerald-300" />
              <span>Siswa otomatis terkelompok ke <strong>{account.KELAS}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* TEACHER NOTIFICATION TOAST / BANNER FOR 'SUBMITTED' TASKS */}
      {isGuru && pendingSubmissionsForTeacher.length > 0 && showTeacherToast && (
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-800 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 border border-emerald-400/30">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 shrink-0 text-white animate-bounce">
              <Bell size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-400/30 px-2 py-0.5 rounded-md border border-emerald-300/40">
                  Notifikasi Tugas Masuk
                </span>
                <span className="text-[10px] font-bold text-emerald-200">
                  Status: SUBMITTED
                </span>
              </div>
              <h3 className="text-sm font-black mt-1">
                Ada {pendingSubmissionsForTeacher.length} Tugas Baru yang Dikumpulkan Siswa dan Perlu Dinilai!
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Siswa telah mengirimkan jawaban tugas. Segera periksa dan berikan penilaian agar nilai akademik terupdate.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveGradeSubmission(pendingSubmissionsForTeacher[0])}
              className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-black transition active:scale-95 shadow-md flex items-center gap-1.5"
            >
              <Award size={14} /> Beri Nilai Sekarang ({pendingSubmissionsForTeacher.length})
            </button>
            <button
              onClick={() => setShowTeacherToast(false)}
              className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition"
              title="Tutup Notifikasi"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* URGENT DEADLINE BANNER (< 24 HOURS) FOR SISWA */}
      {isSiswa && urgentAssignments.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 shrink-0 text-white animate-pulse">
              <AlertCircle size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-white/20 px-2 py-0.5 rounded-md">
                Peringatan Tenggat Waktu
              </span>
              <h3 className="text-sm font-black mt-1">
                Ada {urgentAssignments.length} Tugas dengan Tenggat &lt; 24 Jam!
              </h3>
              <p className="text-xs text-red-100 mt-0.5">
                Segera selesaikan dan kumpulkan agar nilai akademik Anda tetap maksimal.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('assignments')}
            className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 rounded-xl text-xs font-black transition active:scale-95 shrink-0 shadow-xs"
          >
            Buka Daftar Tugas &rarr;
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <Icon size={20} />
              </div>
              <div className="text-2xl font-black text-slate-900">{s.value}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* GURU: DAFTAR TUGAS BARU DIKUMPULKAN SISWA (STATUS SUBMITTED) */}
      {isGuru && pendingSubmissionsForTeacher.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <ClipboardList size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Tugas Baru Dikumpulkan Siswa ({pendingSubmissionsForTeacher.length} Menunggu Penilaian)
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar pengumpulan tugas dengan status 'SUBMITTED' yang siap diperiksa dan diberi nilai
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('assignments')}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              Buka Semua Tugas <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingSubmissionsForTeacher.map((sub) => {
              const asg = assignments.find((a) => a.ID === sub.ASSIGNMENT_ID);
              const course = courses.find((c) => c.ID === asg?.COURSE_ID);
              return (
                <div key={sub.ID} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {sub.SISWA_NAMA}
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        SUBMITTED
                      </span>
                    </div>
                    <div className="text-xs font-bold text-blue-800 mb-1">
                      {asg?.JUDUL || 'Tugas Siswa'}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-white/80 p-2 rounded-lg border border-slate-100 mb-2">
                      "{sub.ISI || 'Lampiran tugas terlampir'}"
                    </p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <Clock size={11} /> Dikirim: {sub.SUBMITTED_AT}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500">
                      {course?.NAMA || account.KELAS}
                    </span>
                    <button
                      onClick={() => setActiveGradeSubmission(sub)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs active:scale-95"
                    >
                      <Award size={13} /> Beri Nilai
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grade Submission Modal when clicked from Dashboard */}
      {activeGradeSubmission && (
        <GradeSubmissionModal
          submission={activeGradeSubmission}
          guru={account}
          onClose={() => setActiveGradeSubmission(null)}
          onGraded={() => {
            setActiveGradeSubmission(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* SISWA: RINGKASAN STATUS TUGAS PER MATA PELAJARAN (PROGRESS BARS) */}
      {/* ========================================================================= */}
      {isSiswa && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <CheckSquare size={16} className="text-blue-700" />
                Ringkasan Status Tugas per Mata Pelajaran
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau progres penyelesaian tugas di setiap mata pelajaran kelas {account.KELAS}
              </p>
            </div>
            <button
              onClick={() => onNavigate('assignments')}
              className="text-blue-700 hover:text-blue-900 font-bold text-xs flex items-center gap-1"
            >
              Lihat Semua Tugas <ChevronRight size={14} />
            </button>
          </div>

          {courses.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Belum ada mata pelajaran terdaftar.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => {
                const courseTasks = assignments.filter((a) => a.COURSE_ID === course.ID && a.TYPE !== 'MATERI');
                const totalTasks = courseTasks.length;
                const completedTasks = courseTasks.filter((a) =>
                  submissions.some((s) => s.ASSIGNMENT_ID === a.ID && s.STATUS !== 'DRAFT')
                ).length;

                const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
                const isComplete = totalTasks > 0 && completedTasks === totalTasks;

                return (
                  <div
                    key={course.ID}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-mono text-[9px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {course.KODE_KELAS}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">{course.NAMA}</h4>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isComplete
                            ? 'bg-emerald-100 text-emerald-800'
                            : percentage > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {totalTasks === 0 ? 'Belum Ada Tugas' : `${completedTasks} / ${totalTasks} Selesai`}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 mt-3">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-500">Progres Penyelesaian</span>
                        <span className={isComplete ? 'text-emerald-700' : 'text-blue-700'}>
                          {totalTasks === 0 ? '100%' : `${percentage}%`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete ? 'bg-emerald-500' : percentage > 50 ? 'bg-blue-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${totalTasks === 0 ? 100 : percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* KEPALA SEKOLAH: MONITORING PROGRES TUGAS SEMUA ROMBEL (KELAS 1 - 6) */}
      {/* ========================================================================= */}
      {isKepsek && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BarChart2 size={16} className="text-purple-700" />
                Monitoring Progres Tugas & Kelulusan Semua Rombel (Kelas 1 s/d Kelas 6)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengawasan komprehensif tingkat kepatuhan pengumpulan tugas siswa se-SDN Tangerang 6
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-purple-100 text-purple-800 rounded-xl">
              Tahun Ajaran 2026/2027
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {STANDARD_CLASSES.map((kelasName, idx) => {
              const classCourses = classroomService.getCoursesForGuru('', kelasName);
              const classAssignments = classroomService.getAssignments();
              const classTasks = classAssignments.filter((a) => {
                const c = classroomService.getCourses().find((co) => co.ID === a.COURSE_ID);
                return c?.KELAS_TINGKAT === kelasName;
              });

              // Seeded progress for school overview
              const completionPct = [92, 88, 95, 84, 96, 98][idx] || 90;

              return (
                <div key={kelasName} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-800">{kelasName}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {completionPct}% Selesai
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mt-2">
                    <span>{classCourses.length} Mapel Aktif</span>
                    <span>4 Siswa Terdaftar</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Classroom Suite Shortcuts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-amber-500" />
          Menu & Fitur Lengkap Classroom SDN Tangerang 6
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('forum')}
            className="p-3.5 rounded-2xl bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200 text-left transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition">
              <MessageSquare size={16} />
            </div>
            <div className="font-bold text-xs text-slate-900">Forum Diskusi</div>
            <div className="text-[10px] text-slate-500">Stream & Tanya Guru</div>
          </button>

          <button
            onClick={() => onNavigate('attendance')}
            className="p-3.5 rounded-2xl bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200 text-left transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition">
              <UserCheck size={16} />
            </div>
            <div className="font-bold text-xs text-slate-900">Presensi Harian</div>
            <div className="text-[10px] text-slate-500">Absen & Rekap</div>
          </button>

          <button
            onClick={() => onNavigate('quizzes')}
            className="p-3.5 rounded-2xl bg-purple-50/60 hover:bg-purple-100/70 border border-purple-200 text-left transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition">
              <Award size={16} />
            </div>
            <div className="font-bold text-xs text-slate-900">Kuis Online CBT</div>
            <div className="text-[10px] text-slate-500">Ujian & Auto-Score</div>
          </button>

          <button
            onClick={() => onNavigate('materials')}
            className="p-3.5 rounded-2xl bg-sky-50/60 hover:bg-sky-100/70 border border-sky-200 text-left transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition">
              <BookOpen size={16} />
            </div>
            <div className="font-bold text-xs text-slate-900">Modul & E-Book</div>
            <div className="text-[10px] text-slate-500">Bahan Ajar & LKPD</div>
          </button>

          <button
            onClick={() => onNavigate('gradebook')}
            className="p-3.5 rounded-2xl bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200 text-left transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition">
              <Printer size={16} />
            </div>
            <div className="font-bold text-xs text-slate-900">Buku Nilai & Rapor</div>
            <div className="text-[10px] text-slate-500">E-Rapor Cetak PDF</div>
          </button>

          <button
            onClick={() => onNavigate('schedule')}
            className="p-3.5 rounded-2xl bg-indigo-50/60 hover:bg-indigo-100/70 border border-indigo-200 text-left transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition">
              <Calendar size={16} />
            </div>
            <div className="font-bold text-xs text-slate-900">Jadwal Belajar</div>
            <div className="text-[10px] text-slate-500">Kalender Akademik</div>
          </button>
        </div>
      </div>

      {/* Class Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <School size={16} className="text-blue-700" />
            {isGuru ? `Kelas Mengajar (${account.KELAS})` : 'Kelas Terdaftar'}
          </h3>
          <button onClick={() => onNavigate('courses')} className="text-blue-700 hover:text-blue-900 font-bold text-xs flex items-center gap-1">
            Lihat Semua <ChevronRight size={14} />
          </button>
        </div>

        {courses.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Belum ada kelas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courses.slice(0, 4).map((c) => (
              <div key={c.ID} className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition-all bg-slate-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{c.KODE_KELAS}</span>
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <Users size={11} /> {c.SISWA_IDS.length} Siswa Terdaftar
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mt-1">{c.NAMA}</h4>
                <p className="text-[11px] text-slate-500 mt-1">{c.GURU_NAMA}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student List Shortcut for Teacher */}
      {isGuru && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <Users size={18} className="text-emerald-700" />
              Kelompok Siswa {account.KELAS} ({studentsCount} Siswa Aktif)
            </div>
            <p className="text-xs text-emerald-800 mt-1">
              Data siswa secara otomatis dikelompokkan dan disinkronkan ke kelas Anda.
            </p>
          </div>
          <button
            onClick={() => onNavigate('students')}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shrink-0"
          >
            Buka Daftar Siswa <ChevronRight size={14} />
          </button>
        </div>
      )}

      {isSiswa && pendingTasks > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
            <Clock size={16} /> {pendingTasks} Tugas Belum Selesai
          </div>
          <button onClick={() => onNavigate('assignments')} className="text-amber-700 hover:text-amber-900 font-bold text-xs flex items-center gap-1">
            Kerjakan Sekarang <ChevronRight size={14} />
          </button>
        </div>
      )}

      {(isGuru || isKepsek) && pendingReports > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-purple-900 font-bold text-sm mb-2">
            <Award size={16} /> {pendingReports} Laporan {isGuru ? 'Terkirim Menunggu Penilaian' : 'Menunggu Dinilai Kepala Sekolah'}
          </div>
          <button onClick={() => onNavigate('reports')} className="text-purple-700 hover:text-purple-900 font-bold text-xs flex items-center gap-1">
            {isGuru ? 'Lihat Laporan' : 'Beri Penilaian'} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

// ============ STUDENTS LIST VIEW ============
const StudentsListView: React.FC<{
  account: Account;
  onRefresh: () => void;
}> = ({ account, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';
  const [selectedClass, setSelectedClass] = useState<string>(isGuru ? (account.KELAS || 'Kelas 1') : 'Semua');
  const [search, setSearch] = useState('');
  const [filterKelulusan, setFilterKelulusan] = useState<string>('SEMUA');
  const [filterKebutuhan, setFilterKebutuhan] = useState<string>('SEMUA');
  const [editingStudent, setEditingStudent] = useState<Account | null>(null);

  const allClasses = ['Semua', ...STANDARD_CLASSES];
  const allStudents = isGuru && account.KELAS
    ? accountService.getStudents(account.KELAS)
    : selectedClass === 'Semua'
    ? accountService.getStudents()
    : accountService.getStudents(selectedClass);

  const filteredStudents = allStudents.filter((s) => {
    const matchesSearch =
      s.NAMA.toLowerCase().includes(search.toLowerCase()) ||
      (s.NIP && s.NIP.includes(search)) ||
      s.USERNAME.toLowerCase().includes(search.toLowerCase());

    const matchesKelulusan =
      filterKelulusan === 'SEMUA' || (s.STATUS_KELULUSAN || 'AKTIF') === filterKelulusan;

    const matchesKebutuhan =
      filterKebutuhan === 'SEMUA'
        ? true
        : filterKebutuhan === 'INKLUSI_ALL'
        ? s.KEBUTUHAN_KHUSUS && s.KEBUTUHAN_KHUSUS !== 'REGULER'
        : (s.KEBUTUHAN_KHUSUS || 'REGULER') === filterKebutuhan;

    return matchesSearch && matchesKelulusan && matchesKebutuhan;
  });

  // Summary counts for current viewed cohort
  const totalCount = allStudents.length;
  const regulerCount = allStudents.filter((s) => !s.KEBUTUHAN_KHUSUS || s.KEBUTUHAN_KHUSUS === 'REGULER').length;
  const inklusiCount = allStudents.filter((s) => s.KEBUTUHAN_KHUSUS && s.KEBUTUHAN_KHUSUS !== 'REGULER' && s.KEBUTUHAN_KHUSUS !== 'CERDAS_ISTIMEWA').length;
  const cerdasCount = allStudents.filter((s) => s.KEBUTUHAN_KHUSUS === 'CERDAS_ISTIMEWA').length;
  const lulusCount = allStudents.filter((s) => s.STATUS_KELULUSAN === 'LULUS').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            {isGuru ? `Data Siswa ${account.KELAS}` : 'Data Siswa & Pengelompokan Kelas'}
          </h2>
          <p className="text-xs text-slate-500">
            {isGuru
              ? `Daftar siswa yang otomatis dikelompokkan ke dalam ${account.KELAS}`
              : 'Daftar seluruh siswa terkelompok berdasarkan kelas SDN Tangerang 6'}
          </p>
        </div>
        {isGuru && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
            <Lock size={13} /> Kelas Terkunci: {account.KELAS}
          </div>
        )}
      </div>

      {/* STATS OVERVIEW CARDS FOR SEGMENTS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => { setFilterKelulusan('SEMUA'); setFilterKebutuhan('SEMUA'); }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterKelulusan === 'SEMUA' && filterKebutuhan === 'SEMUA'
              ? 'bg-blue-900 text-white border-blue-900 shadow-sm ring-2 ring-blue-500/50'
              : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
          }`}
        >
          <span className={`text-[10px] font-bold block ${filterKelulusan === 'SEMUA' && filterKebutuhan === 'SEMUA' ? 'text-blue-200' : 'text-slate-400'}`}>
            Total Siswa
          </span>
          <div className="text-xl font-black mt-0.5">{totalCount}</div>
          <span className={`text-[9px] font-semibold ${filterKelulusan === 'SEMUA' && filterKebutuhan === 'SEMUA' ? 'text-blue-300' : 'text-slate-500'}`}>
            Semua Peserta
          </span>
        </button>

        <button
          onClick={() => { setFilterKelulusan('SEMUA'); setFilterKebutuhan('REGULER'); }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterKebutuhan === 'REGULER'
              ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm ring-2 ring-emerald-500/50'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <span className={`text-[10px] font-bold block ${filterKebutuhan === 'REGULER' ? 'text-emerald-200' : 'text-slate-400'}`}>
            Siswa Reguler
          </span>
          <div className="text-xl font-black mt-0.5">{regulerCount}</div>
          <span className={`text-[9px] font-semibold ${filterKebutuhan === 'REGULER' ? 'text-emerald-200' : 'text-emerald-600'}`}>
            Standar Kurikulum
          </span>
        </button>

        <button
          onClick={() => { setFilterKelulusan('SEMUA'); setFilterKebutuhan('INKLUSI_ALL'); }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterKebutuhan === 'INKLUSI_ALL'
              ? 'bg-purple-900 text-white border-purple-900 shadow-sm ring-2 ring-purple-500/50'
              : 'bg-white text-slate-800 border-slate-200 hover:border-purple-300'
          }`}
        >
          <span className={`text-[10px] font-bold block ${filterKebutuhan === 'INKLUSI_ALL' ? 'text-purple-200' : 'text-slate-400'}`}>
            Inklusi (ABK)
          </span>
          <div className="text-xl font-black mt-0.5">{inklusiCount}</div>
          <span className={`text-[9px] font-semibold ${filterKebutuhan === 'INKLUSI_ALL' ? 'text-purple-200' : 'text-purple-600'}`}>
            Pendampingan Khusus
          </span>
        </button>

        <button
          onClick={() => { setFilterKelulusan('SEMUA'); setFilterKebutuhan('CERDAS_ISTIMEWA'); }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterKebutuhan === 'CERDAS_ISTIMEWA'
              ? 'bg-amber-800 text-white border-amber-800 shadow-sm ring-2 ring-amber-500/50'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
          }`}
        >
          <span className={`text-[10px] font-bold block ${filterKebutuhan === 'CERDAS_ISTIMEWA' ? 'text-amber-200' : 'text-slate-400'}`}>
            Cerdas Istimewa
          </span>
          <div className="text-xl font-black mt-0.5">{cerdasCount}</div>
          <span className={`text-[9px] font-semibold ${filterKebutuhan === 'CERDAS_ISTIMEWA' ? 'text-amber-200' : 'text-amber-600'}`}>
            Program Akselerasi
          </span>
        </button>

        <button
          onClick={() => { setFilterKelulusan('LULUS'); setFilterKebutuhan('SEMUA'); }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterKelulusan === 'LULUS'
              ? 'bg-teal-800 text-white border-teal-800 shadow-sm ring-2 ring-teal-500/50'
              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-300'
          }`}
        >
          <span className={`text-[10px] font-bold block ${filterKelulusan === 'LULUS' ? 'text-teal-200' : 'text-slate-400'}`}>
            Siswa Lulus
          </span>
          <div className="text-xl font-black mt-0.5">{lulusCount}</div>
          <span className={`text-[9px] font-semibold ${filterKelulusan === 'LULUS' ? 'text-teal-200' : 'text-teal-600'}`}>
            Alumni & Lulusan
          </span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Class Selection Tabs (Kepala Sekolah) */}
        {isKepsek && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-slate-400 mr-2 shrink-0 flex items-center gap-1">
              <School size={13} /> Kelas:
            </span>
            {allClasses.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedClass === c
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Dropdowns for Filter Status Kelulusan and Kebutuhan Khusus */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa atau NIS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-blue-600"
            />
          </div>

          {/* Filter Status Kelulusan (Kepsek & Guru) */}
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              <ShieldCheck size={12} className="text-blue-600" /> Status Kelulusan
            </div>
            <select
              value={filterKelulusan}
              onChange={(e) => setFilterKelulusan(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-blue-600 text-slate-700"
            >
              <option value="SEMUA">Semua Status Kelulusan</option>
              <option value="AKTIF">Siswa Aktif</option>
              <option value="LULUS">Sudah Lulus (Alumni)</option>
              <option value="PINDAH">Mutasi / Pindah Sekolah</option>
              <option value="DROPOUT">Non-Aktif / Drop Out</option>
            </select>
          </div>

          {/* Filter Kebutuhan Khusus / Inklusi (Kepsek & Guru) */}
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              <HeartHandshake size={12} className="text-purple-600" /> Segmen Kebutuhan Khusus
            </div>
            <select
              value={filterKebutuhan}
              onChange={(e) => setFilterKebutuhan(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-blue-600 text-slate-700"
            >
              <option value="SEMUA">Semua Kebutuhan (Reguler & ABK)</option>
              <option value="REGULER">Siswa Reguler</option>
              <option value="INKLUSI_ALL">Semua Inklusi / ABK</option>
              <option value="AUTISME">Autisme Spectrum</option>
              <option value="TUNARUNGU">Tunarungu / Gangguan Pendengaran</option>
              <option value="TUNANETRA">Tunanetra / Gangguan Penglihatan</option>
              <option value="DISLEKSIA">Disleksia / Kesulitan Belajar</option>
              <option value="CERDAS_ISTIMEWA">Cerdas Istimewa (Gifted/Talented)</option>
              <option value="LAINNYA">Kebutuhan Khusus Lainnya</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Cards / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800">
              Menampilkan {filteredStudents.length} dari {totalCount} Siswa
            </span>
            {(filterKelulusan !== 'SEMUA' || filterKebutuhan !== 'SEMUA') && (
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold">
                Filter Aktif
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-bold">
            Tahun Ajaran 2026/2027
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-10 text-center">
            <Users size={36} className="text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Tidak ada siswa ditemukan pada segmen ini.</p>
            <button
              onClick={() => { setFilterKelulusan('SEMUA'); setFilterKebutuhan('SEMUA'); setSearch(''); }}
              className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStudents.map((s, idx) => {
              const studentSubmissions = classroomService.getSubmissions(undefined, s.ID);
              const graded = studentSubmissions.filter((sub) => sub.STATUS === 'GRADED');
              const avgScore = graded.length > 0
                ? Math.round(graded.reduce((acc, sub) => acc + (sub.NILAI || 0), 0) / graded.length)
                : '-';

              const kelulusanStatus = s.STATUS_KELULUSAN || 'AKTIF';
              const kebutuhan = s.KEBUTUHAN_KHUSUS || 'REGULER';

              return (
                <div key={s.ID} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs shrink-0 mt-0.5 sm:mt-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate">{s.NAMA}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {s.KELAS || 'Tanpa Kelas'}
                        </span>

                        {/* Status Kelulusan Badge */}
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            kelulusanStatus === 'LULUS'
                              ? 'bg-teal-100 text-teal-800 border-teal-300'
                              : kelulusanStatus === 'PINDAH'
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : kelulusanStatus === 'DROPOUT'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {kelulusanStatus === 'LULUS' ? '🎓 LULUS' : kelulusanStatus === 'PINDAH' ? 'MUTASI' : kelulusanStatus === 'DROPOUT' ? 'DROP OUT' : 'AKTIF'}
                        </span>

                        {/* Kebutuhan Khusus Badge */}
                        {kebutuhan !== 'REGULER' && (
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              kebutuhan === 'CERDAS_ISTIMEWA'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-purple-100 text-purple-900 border-purple-300'
                            }`}
                          >
                            <HeartHandshake size={10} />
                            {kebutuhan.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>NIS: <strong className="font-mono text-slate-700">{s.NIP || '-'}</strong></span>
                        <span>•</span>
                        <span>Username: @{s.USERNAME}</span>
                        {s.CATATAN_INKLUSI && (
                          <>
                            <span>•</span>
                            <span className="text-purple-700 font-medium italic">
                              "{s.CATATAN_INKLUSI}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Tugas / Nilai Rata-rata</div>
                      <div className="text-xs font-bold text-slate-800">
                        {studentSubmissions.length} Tugas • <span className="text-emerald-600 font-black">{avgScore}</span>
                      </div>
                    </div>

                    {(isGuru || isKepsek) && (
                      <button
                        onClick={() => setEditingStudent(s)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Edit3 size={12} />
                        <span>Kelola Inklusi & Status</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Student Special Needs & Graduation Status Modal */}
      {editingStudent && (
        <EditStudentSpecialNeedsModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSaved={() => {
            setEditingStudent(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

// ============ COURSES VIEW ============
const CoursesView: React.FC<{
  account: Account;
  courses: ClassroomCourse[];
  selectedCourseId: string | null;
  onSelect: (id: string | null) => void;
  onRefresh: () => void;
}> = ({ account, courses, selectedCourseId, onSelect, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const [showCreate, setShowCreate] = useState(false);
  const allSiswa = accountService.getStudents(account.KELAS);

  const selectedCourse = courses.find((c) => c.ID === selectedCourseId);

  if (selectedCourse) {
    const courseAssignments = classroomService.getAssignments(selectedCourse.ID);
    const enrolled = accountService.getAccounts('CLASSROOM').filter((a) => selectedCourse.SISWA_IDS.includes(a.ID));
    return (
      <div className="space-y-5">
        <button onClick={() => onSelect(null)} className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900">
          <ArrowLeft size={14} /> Kembali ke Daftar Kelas
        </button>
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">{selectedCourse.KODE_KELAS}</span>
            <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded">
              {selectedCourse.KELAS_TINGKAT}
            </span>
          </div>
          <h2 className="text-lg font-black mt-2">{selectedCourse.NAMA}</h2>
          <p className="text-blue-200 text-xs mt-1">{selectedCourse.DESKRIPSI}</p>
          <div className="flex items-center gap-3 mt-3 text-[11px] text-blue-200">
            <span className="flex items-center gap-1"><Users size={12} /> {enrolled.length} Siswa Terdaftar Otomatis</span>
            <span className="flex items-center gap-1"><ClipboardList size={12} /> {courseAssignments.length} Tugas</span>
            <span className="flex items-center gap-1"><GraduationCap size={12} /> {selectedCourse.GURU_NAMA}</span>
          </div>
        </div>

        {isGuru && (
          <EnrollmentManager course={selectedCourse} allSiswa={allSiswa} enrolled={enrolled} onRefresh={onRefresh} />
        )}

        <div>
          <h3 className="text-sm font-black text-slate-900 mb-3">Tugas & Materi di Kelas Ini</h3>
          {courseAssignments.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Belum ada tugas.</p>
          ) : (
            <div className="space-y-2">
              {courseAssignments.map((a) => {
                const warn = getDeadlineWarning(a.DEADLINE);
                return (
                  <div
                    key={a.ID}
                    className={`bg-white p-4 rounded-xl border flex items-center justify-between gap-3 ${
                      warn?.isUrgent ? 'border-red-400 bg-red-50/20 ring-1 ring-red-300' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            a.TYPE === 'TUGAS'
                              ? 'bg-amber-100 text-amber-800'
                              : a.TYPE === 'ULANGAN'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {a.TYPE}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">{a.JUDUL}</h4>
                        {warn && (
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${warn.badgeClass}`}
                          >
                            <AlertCircle size={10} />
                            {warn.text}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{a.DESKRIPSI}</p>
                    </div>
                    <span
                      className={`text-[10px] flex items-center gap-1 shrink-0 ${
                        warn?.isUrgent ? 'text-red-700 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <Calendar size={11} /> {a.DEADLINE}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Kelas Saya</h2>
          <p className="text-xs text-slate-500">
            {isGuru ? `Kelola kelas pembelajaran ${account.KELAS || ''}` : 'Kelas yang Anda ikuti'}
          </p>
        </div>
        {isGuru && (
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5">
            <Plus size={14} /> Buat Mata Pelajaran Baru
          </button>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <School size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Belum ada kelas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => {
            const cnt = classroomService.getAssignments(c.ID).length;
            return (
              <button key={c.ID} onClick={() => onSelect(c.ID)} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{c.KODE_KELAS}</span>
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <Users size={11} /> {c.SISWA_IDS.length} Siswa Terdaftar
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{c.NAMA}</h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{c.DESKRIPSI}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1"><GraduationCap size={12} /> {c.GURU_NAMA}</span>
                  <span className="flex items-center gap-1"><ClipboardList size={12} /> {cnt} Tugas</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showCreate && isGuru && (
        <CreateCourseModal account={account} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); onRefresh(); }} />
      )}
    </div>
  );
};

const EnrollmentManager: React.FC<{
  course: ClassroomCourse;
  allSiswa: Account[];
  enrolled: Account[];
  onRefresh: () => void;
}> = ({ course, allSiswa, enrolled, onRefresh }) => {
  const unenrolled = allSiswa.filter((s) => !course.SISWA_IDS.includes(s.ID));
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
        <Users size={16} className="text-blue-700" /> Sinkronisasi Siswa ({course.KELAS_TINGKAT})
      </h3>
      {enrolled.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Siswa Terdaftar ({enrolled.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {enrolled.map((s) => (
              <span key={s.ID} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-emerald-200">
                {s.NAMA} ({s.NIP || 'NIS'})
                <button onClick={() => { classroomService.unenrollSiswa(course.ID, s.ID); onRefresh(); }} className="hover:text-rose-600 ml-1"><X size={11} /></button>
              </span>
            ))}
          </div>
        </div>
      )}
      {unenrolled.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Siswa Tambahan Belum Masuk</p>
          <div className="flex flex-wrap gap-1.5">
            {unenrolled.map((s) => (
              <button key={s.ID} onClick={() => { classroomService.enrollSiswa(course.ID, s.ID); onRefresh(); }} className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-1 rounded-lg hover:bg-blue-100 hover:text-blue-800">
                <Plus size={11} /> {s.NAMA}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CreateCourseModal: React.FC<{ account: Account; onClose: () => void; onSaved: () => void }> = ({ account, onClose, onSaved }) => {
  const [nama, setNama] = useState('');
  const [kode, setKode] = useState('');
  const [tingkat, setTingkat] = useState(account.KELAS || 'Kelas 1');
  const [deskripsi, setDeskripsi] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    const studentsInClass = accountService.getStudents(tingkat).map((s) => s.ID);
    classroomService.saveCourse({
      NAMA: nama,
      KODE_KELAS: kode || `KLS-${Date.now().toString().slice(-4)}`,
      KELAS_TINGKAT: tingkat,
      DESKRIPSI: deskripsi,
      GURU_ID: account.ID,
      GURU_NAMA: account.NAMA,
      SISWA_IDS: studentsInClass,
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Buat Mata Pelajaran Baru</h3>
          <button type="button" onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Mata Pelajaran / Modul</label>
          <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="cth: Kelas 1 - Literasi Membaca" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Kode Kelas</label>
            <input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="KLS1-2026" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Tingkat Kelas</label>
            <select value={tingkat} onChange={(e) => setTingkat(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600">
              {STANDARD_CLASSES.map((k) => <option key={k}>{k}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Deskripsi</label>
          <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={3} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500">Batal</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs">Simpan</button>
        </div>
      </form>
    </div>
  );
};

// ============ ASSIGNMENTS VIEW ============
const AssignmentsView: React.FC<{
  account: Account;
  courses: ClassroomCourse[];
  assignments: ClassroomAssignment[];
  onRefresh: () => void;
}> = ({ account, courses, assignments, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isSiswa = account.ROLE === 'SISWA';
  const [showCreate, setShowCreate] = useState(false);
  const [submitFor, setSubmitFor] = useState<ClassroomAssignment | null>(null);
  const [reviewFor, setReviewFor] = useState<ClassroomAssignment | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'URGENT' | 'PENDING' | 'DONE'>('ALL');

  const filteredAssignments = assignments.filter((a) => {
    const mySub = isSiswa ? classroomService.getSubmissions(a.ID, account.ID)[0] : undefined;
    const isDone = mySub && mySub.STATUS !== 'DRAFT';
    const warn = getDeadlineWarning(a.DEADLINE);

    if (filterType === 'URGENT') return !isDone && warn?.isUrgent;
    if (filterType === 'PENDING') return !isDone && a.TYPE !== 'MATERI';
    if (filterType === 'DONE') return isDone;
    return true;
  });

  const urgentCount = assignments.filter((a) => {
    const isDone = isSiswa && classroomService.getSubmissions(a.ID, account.ID).some((s) => s.STATUS !== 'DRAFT');
    return !isDone && getDeadlineWarning(a.DEADLINE)?.isUrgent;
  }).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ClipboardList className="text-blue-700" size={20} />
            Tugas & Materi Pembelajaran
          </h2>
          <p className="text-xs text-slate-500">
            {isGuru ? `Kelola tugas & materi untuk kelas ${account.KELAS || ''}` : 'Daftar penugasan terstruktur dari guru'}
          </p>
        </div>
        {isGuru && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
          >
            <Plus size={14} /> Buat Tugas Baru
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            filterType === 'ALL'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua ({assignments.length})
        </button>
        {isSiswa && (
          <>
            <button
              onClick={() => setFilterType('URGENT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'URGENT'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              <Flame size={13} className="text-red-500" />
              Tenggat &lt; 24 Jam ({urgentCount})
            </button>
            <button
              onClick={() => setFilterType('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterType === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Belum Dikerjakan
            </button>
            <button
              onClick={() => setFilterType('DONE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterType === 'DONE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Sudah Selesai
            </button>
          </>
        )}
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <ClipboardList size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Tidak ada tugas pada filter ini.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredAssignments.map((a) => {
            const course = courses.find((c) => c.ID === a.COURSE_ID);
            const mySub = isSiswa ? classroomService.getSubmissions(a.ID, account.ID)[0] : undefined;
            const isDone = mySub && mySub.STATUS !== 'DRAFT';
            const subCount = classroomService.getSubmissions(a.ID).length;
            const deadlineWarn = !isDone ? getDeadlineWarning(a.DEADLINE) : null;

            return (
              <div
                key={a.ID}
                className={`bg-white p-4 rounded-xl border transition-all ${
                  deadlineWarn?.isUrgent
                    ? 'border-red-400 bg-red-50/20 ring-1 ring-red-400 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          a.TYPE === 'TUGAS'
                            ? 'bg-amber-100 text-amber-800'
                            : a.TYPE === 'ULANGAN'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {a.TYPE}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800">{a.JUDUL}</h4>

                      {/* Status / Grade Badge */}
                      {mySub && (
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            mySub.STATUS === 'GRADED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {mySub.STATUS === 'GRADED' ? `Dinilai: ${mySub.NILAI} / 100` : 'Terkirim'}
                        </span>
                      )}

                      {/* DEADLINE WARNING BADGE (<24H / OVERDUE) */}
                      {deadlineWarn && (
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${deadlineWarn.badgeClass}`}
                        >
                          <AlertCircle size={10} />
                          {deadlineWarn.text}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{a.DESKRIPSI}</p>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <School size={11} /> {course?.KODE_KELAS || '-'} • {course?.NAMA || 'Mata Pelajaran'}
                      </span>
                      <span
                        className={`flex items-center gap-1 font-semibold ${
                          deadlineWarn?.isUrgent ? 'text-red-700 font-bold' : 'text-slate-500'
                        }`}
                      >
                        <Calendar size={11} /> Tenggat: {a.DEADLINE || 'Tidak ada'}
                      </span>
                      {!isSiswa && (
                        <span className="flex items-center gap-1 text-slate-600 font-bold">
                          <Users size={11} /> {subCount} siswa mengumpulkan
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isGuru && (
                      <button
                        onClick={() => setReviewFor(a)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] flex items-center gap-1 transition shadow-2xs"
                      >
                        <Eye size={12} /> Periksa ({subCount})
                      </button>
                    )}

                    {isSiswa && a.TYPE !== 'MATERI' && (
                      <button
                        onClick={() => setSubmitFor(a)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition ${
                          deadlineWarn?.isUrgent && !isDone
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs animate-pulse'
                            : 'bg-blue-700 hover:bg-blue-800 text-white'
                        }`}
                      >
                        {mySub ? 'Lihat Jawaban' : 'Kerjakan Sekarang'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && isGuru && (
        <CreateAssignmentModal
          account={account}
          courses={courses}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            onRefresh();
          }}
        />
      )}
      {submitFor && (
        <SubmitAssignmentModal
          assignment={submitFor}
          siswa={account}
          onClose={() => setSubmitFor(null)}
          onSaved={() => {
            setSubmitFor(null);
            onRefresh();
          }}
        />
      )}
      {reviewFor && (
        <ReviewAssignmentSubmissionsModal
          assignment={reviewFor}
          guru={account}
          onClose={() => setReviewFor(null)}
          onRefresh={() => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

const CreateAssignmentModal: React.FC<{ account: Account; courses: ClassroomCourse[]; onClose: () => void; onSaved: () => void }> = ({ account, courses, onClose, onSaved }) => {
  const [courseId, setCourseId] = useState(courses[0]?.ID || '');
  const [judul, setJudul] = useState('');
  const [type, setType] = useState<ClassroomAssignment['TYPE']>('TUGAS');
  const [deadline, setDeadline] = useState('');
  const [deskripsi, setDeskripsi] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !courseId) return;
    classroomService.saveAssignment({ COURSE_ID: courseId, JUDUL: judul, TYPE: type, DEADLINE: deadline, DESKRIPSI: deskripsi, GURU_ID: account.ID, GURU_NAMA: account.NAMA });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Buat Tugas / Materi</h3>
          <button type="button" onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Kelas</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600">
            {courses.map((c) => <option key={c.ID} value={c.ID}>{c.KODE_KELAS} - {c.NAMA}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Judul</label>
          <input value={judul} onChange={(e) => setJudul(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Tipe</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600">
              <option value="TUGAS">Tugas</option>
              <option value="MATERI">Materi</option>
              <option value="ULANGAN">Ulangan</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Deskripsi</label>
          <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={3} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500">Batal</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs">Simpan</button>
        </div>
      </form>
    </div>
  );
};

const SubmitAssignmentModal: React.FC<{ assignment: ClassroomAssignment; siswa: Account; onClose: () => void; onSaved: () => void }> = ({ assignment, siswa, onClose, onSaved }) => {
  const existing = classroomService.getSubmissions(assignment.ID, siswa.ID)[0];
  const [isi, setIsi] = useState(existing?.ISI || '');
  const [fileLink, setFileLink] = useState(existing?.FILE_LINK || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    classroomService.saveSubmission({
      ASSIGNMENT_ID: assignment.ID, COURSE_ID: assignment.COURSE_ID, SISWA_ID: siswa.ID, SISWA_NAMA: siswa.NAMA,
      ISI: isi, FILE_LINK: fileLink, STATUS: 'SUBMITTED',
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">{existing ? 'Jawaban Tugas' : 'Kerjakan Tugas'}</h3>
            <p className="text-[11px] text-slate-500">{assignment.JUDUL}</p>
          </div>
          <button type="button" onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-800">{assignment.DESKRIPSI}</div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Jawaban / Tulis di sini</label>
          <textarea value={isi} onChange={(e) => setIsi(e.target.value)} rows={5} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" placeholder="Tulis jawaban atau catatan..." autoFocus />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Link File (Google Drive / foto pekerjaan)</label>
          <input value={fileLink} onChange={(e) => setFileLink(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" placeholder="https://..." />
        </div>
        {existing?.STATUS === 'GRADED' && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs"><Star size={14} /> Nilai: {existing.NILAI}</div>
            {existing.FEEDBACK && <p className="text-[11px] text-emerald-700 mt-1">{existing.FEEDBACK}</p>}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500">Tutup</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5"><Send size={12} /> Kumpulkan</button>
        </div>
      </form>
    </div>
  );
};

// ============ REPORTS VIEW ============
const ReportsView: React.FC<{ account: Account; reports: ClassroomReport[]; onRefresh: () => void }> = ({ account, reports, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';
  const [showCreate, setShowCreate] = useState(false);
  const [gradeFor, setGradeFor] = useState<ClassroomReport | null>(null);

  const pendingReports = reports.filter((r) => r.STATUS === 'DIKIRIM');

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">Laporan Pembelajaran Guru</h2>
          <p className="text-xs text-slate-500">
            {isGuru
              ? `Kelola laporan kelas ${account.KELAS || ''} untuk diserahkan ke Kepala Sekolah`
              : isKepsek
              ? 'Evaluasi, supervisi, dan nilai seluruh laporan pembelajaran guru'
              : 'Daftar rekapitulasi laporan pembelajaran'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {reports.length > 0 && (
            <button
              onClick={() =>
                pdfService.generateConsolidatedTeacherReportsPdf(
                  reports,
                  isKepsek ? account.NAMA : 'Liestya Kusuma Sari, S.Pd., M.Pd.',
                  isKepsek ? account.NIP : '198406192009022007'
                )
              }
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-slate-900/20 transition-all hover:scale-[1.02]"
              title="Unduh seluruh ringkasan dan rincian laporan guru ke dalam 1 file PDF resmi berkop surat"
            >
              <Download size={14} className="text-emerald-400" />
              <span>Download All Reports (PDF)</span>
            </button>
          )}
          {isGuru && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-700/20"
            >
              <Plus size={14} /> Buat Laporan
            </button>
          )}
        </div>
      </div>

      {isKepsek && pendingReports.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-2">
          <Award size={18} className="text-amber-700" />
          <span className="text-xs font-bold text-amber-800">{pendingReports.length} laporan menunggu penilaian Anda.</span>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <FileText size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Belum ada laporan.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.ID} className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      r.STATUS === 'DINILAI' ? 'bg-emerald-100 text-emerald-800' : r.STATUS === 'DIKIRIM' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>{r.STATUS}</span>
                    <h4 className="text-xs font-bold text-slate-800">{r.JUDUL}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{r.ISI}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><GraduationCap size={11} /> {r.GURU_NAMA}</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {r.PERIODE}</span>
                    {r.STATUS === 'DINILAI' && <span className="flex items-center gap-1 text-emerald-600 font-bold"><Star size={11} /> Nilai: {r.NILAI}</span>}
                  </div>
                </div>
                {isKepsek && r.STATUS === 'DIKIRIM' && (
                  <button onClick={() => setGradeFor(r)} className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1 shrink-0">
                    <Award size={12} /> Nilai
                  </button>
                )}
              </div>
              {r.STATUS === 'DINILAI' && r.FEEDBACK && (
                <div className="mt-2 p-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-700 flex items-start gap-1.5">
                  <MessageSquare size={12} className="mt-0.5 shrink-0" /> {r.FEEDBACK}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && isGuru && (
        <CreateReportModal account={account} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); onRefresh(); }} />
      )}
      {gradeFor && isKepsek && (
        <GradeReportModal report={gradeFor} kepsek={account} onClose={() => setGradeFor(null)} onSaved={() => { setGradeFor(null); onRefresh(); }} />
      )}
    </div>
  );
};

const CreateReportModal: React.FC<{ account: Account; onClose: () => void; onSaved: () => void }> = ({ account, onClose, onSaved }) => {
  const [judul, setJudul] = useState(`Laporan Pembelajaran ${account.KELAS || ''} - ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`);
  const [kategori, setKategori] = useState('Laporan Bulanan');
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 7));
  const [isi, setIsi] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'DIKIRIM'>('DIKIRIM');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !isi.trim()) return;
    const saved = classroomService.saveReport({ JUDUL: judul, KATEGORI: kategori, PERIODE: periode, ISI: isi, GURU_ID: account.ID, GURU_NAMA: account.NAMA, STATUS: status });
    if (status === 'DIKIRIM') classroomService.submitReport(saved.ID);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Buat Laporan ({account.KELAS || 'Guru'})</h3>
          <button type="button" onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Judul Laporan</label>
          <input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="cth: Laporan Bulanan Kelas 1" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Kategori</label>
            <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600">
              {['Laporan Bulanan', 'Laporan Tengah Semester', 'Laporan Akhir Semester', 'Laporan Kegiatan', 'Laporan Lainnya'].map((k) => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Periode</label>
            <input type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Isi Laporan Pembelajaran</label>
          <textarea value={isi} onChange={(e) => setIsi(e.target.value)} rows={6} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" placeholder="Tulis capaian siswa, kendala, dan evaluasi pembelajaran..." />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => setStatus('DRAFT')} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 border border-slate-200">Simpan Draft</button>
          <button type="submit" onClick={() => setStatus('DIKIRIM')} className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5"><Send size={12} /> Kirim ke Kepala Sekolah</button>
        </div>
      </form>
    </div>
  );
};

const GradeReportModal: React.FC<{ report: ClassroomReport; kepsek: Account; onClose: () => void; onSaved: () => void }> = ({ report, kepsek, onClose, onSaved }) => {
  const [nilai, setNilai] = useState(85);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    classroomService.gradeReport(report.ID, nilai, feedback, kepsek.NAMA);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Nilai Laporan Guru</h3>
          <button type="button" onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-800">{report.JUDUL}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">{report.GURU_NAMA} • {report.PERIODE}</p>
          <p className="text-[11px] text-slate-600 mt-2 whitespace-pre-wrap">{report.ISI}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Nilai (0-100)</label>
          <input type="number" min={0} max={100} value={nilai} onChange={(e) => setNilai(Number(e.target.value))} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-600" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Feedback / Catatan Evaluasi</label>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-600" placeholder="Tulis catatan dan arahan untuk guru..." />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500">Batal</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5"><Star size={12} /> Beri Nilai</button>
        </div>
      </form>
    </div>
  );
};

// ============ MODAL: EDIT STUDENT SPECIAL NEEDS & STATUS ============
const EditStudentSpecialNeedsModal: React.FC<{
  student: Account;
  onClose: () => void;
  onSaved: () => void;
}> = ({ student, onClose, onSaved }) => {
  const [statusKelulusan, setStatusKelulusan] = useState<StatusKelulusan>(student.STATUS_KELULUSAN || 'AKTIF');
  const [kebutuhanKhusus, setKebutuhanKhusus] = useState<KebutuhanKhusus>(student.KEBUTUHAN_KHUSUS || 'REGULER');
  const [catatanInklusi, setCatatanInklusi] = useState(student.CATATAN_INKLUSI || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    accountService.updateStudentSpecialNeeds(student.ID, {
      STATUS_KELULUSAN: statusKelulusan,
      KEBUTUHAN_KHUSUS: kebutuhanKhusus,
      CATATAN_INKLUSI: catatanInklusi,
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <HeartHandshake size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Kelola Status & Inklusi Siswa</h3>
              <p className="text-xs text-slate-500">{student.NAMA} ({student.KELAS || 'Tanpa Kelas'})</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-400">NISN / ID:</span>
            <span className="font-mono font-bold text-slate-800">{student.NIP || student.ID}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-400">Rombel Kelas:</span>
            <span className="font-bold text-emerald-700">{student.KELAS || 'Kelas 1'}</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-blue-600" />
            Status Kelulusan & Keaktifan
          </label>
          <select
            value={statusKelulusan}
            onChange={(e) => setStatusKelulusan(e.target.value as StatusKelulusan)}
            className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-blue-600 bg-white"
          >
            <option value="AKTIF">Siswa Aktif Belajar</option>
            <option value="LULUS">Lulus (Alumni)</option>
            <option value="PINDAH">Mutasi / Pindah Sekolah</option>
            <option value="DROPOUT">Non-Aktif / Drop Out</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
            <HeartHandshake size={14} className="text-purple-600" />
            Kategori Kebutuhan Khusus / Inklusi
          </label>
          <select
            value={kebutuhanKhusus}
            onChange={(e) => setKebutuhanKhusus(e.target.value as KebutuhanKhusus)}
            className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-purple-600 bg-white"
          >
            <option value="REGULER">Reguler (Standar Kurikulum Nasional)</option>
            <option value="AUTISME">Autisme Spectrum</option>
            <option value="TUNARUNGU">Tunarungu (Gangguan Pendengaran)</option>
            <option value="TUNANETRA">Tunanetra (Gangguan Penglihatan)</option>
            <option value="DISLEKSIA">Disleksia (Kesulitan Belajar Spesifik)</option>
            <option value="CERDAS_ISTIMEWA">Cerdas Istimewa (Gifted & Talented)</option>
            <option value="LAINNYA">Kebutuhan Khusus Lainnya</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Catatan Pendampingan Khusus & Rencana Pembelajaran Individual (PPI)
          </label>
          <textarea
            value={catatanInklusi}
            onChange={(e) => setCatatanInklusi(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-purple-600"
            placeholder="cth: Memerlukan media visual berhuruf besar dan bimbingan guru pendamping..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">
            Batal
          </button>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20">
            <Check size={14} /> Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
};

// ============ MODAL: REVIEW ASSIGNMENT SUBMISSIONS (FOR TEACHERS) ============
const ReviewAssignmentSubmissionsModal: React.FC<{
  assignment: ClassroomAssignment;
  guru: Account;
  onClose: () => void;
  onRefresh: () => void;
}> = ({ assignment, guru, onClose, onRefresh }) => {
  const submissions = classroomService.getSubmissions(assignment.ID);
  const [selectedSub, setSelectedSub] = useState<ClassroomSubmission | null>(null);

  const course = useMemo(() => classroomService.getCourses().find((c) => c.ID === assignment.COURSE_ID), [assignment.COURSE_ID]);
  const enrolledStudents = useMemo(() => accountService.getStudents().filter((s) => course?.SISWA_IDS.includes(s.ID)), [course]);
  
  const missingStudents = useMemo(() => {
    const submittedIds = submissions.map((s) => s.SISWA_ID);
    return enrolledStudents.filter((s) => !submittedIds.includes(s.ID));
  }, [submissions, enrolledStudents]);

  const handleRemindAll = () => {
    if (missingStudents.length === 0) {
      alert("Semua siswa sudah mengumpulkan tugas.");
      return;
    }
    const emails = missingStudents.map(s => s.EMAIL).filter(Boolean).join(',');
    if (!emails) {
      alert("Tidak ada alamat email yang ditemukan untuk siswa yang belum mengumpulkan.");
      return;
    }
    const subject = `Peringatan: Tugas Belum Terkumpul - ${assignment.JUDUL}`;
    const body = `Halo,\n\nMengingatkan bahwa tugas "${assignment.JUDUL}" untuk kelas ${course?.JUDUL || ''} belum Anda kumpulkan.\nMohon segera diselesaikan sebelum batas waktu.\n\nTerima kasih.`;
    window.open(`mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              {assignment.TYPE}
            </span>
            <h3 className="text-base font-black text-slate-900 mt-1">{assignment.JUDUL}</h3>
            <p className="text-xs text-slate-500">Daftar jawaban dan pengumpulan tugas dari siswa</p>
          </div>
          <div className="flex items-center gap-3">
            {missingStudents.length > 0 && (
              <button
                onClick={handleRemindAll}
                className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Mail size={14} /> Remind {missingStudents.length} Siswa
              </button>
            )}
            <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Belum ada siswa yang mengumpulkan tugas ini.
            </div>
          ) : (
            submissions.map((sub, idx) => (
              <div key={sub.ID} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900">{sub.SISWA_NAMA}</h4>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          sub.STATUS === 'GRADED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sub.STATUS === 'GRADED' ? `Dinilai: ${sub.NILAI}/100` : 'SUBMITTED (Belum Dinilai)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{sub.ISI}"
                    </p>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                      <Clock size={11} /> Dikirim pada: {sub.SUBMITTED_AT}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => setSelectedSub(sub)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Award size={13} /> {sub.STATUS === 'GRADED' ? 'Edit Nilai' : 'Beri Nilai'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2 shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
            Tutup
          </button>
        </div>
      </div>

      {selectedSub && (
        <GradeSubmissionModal
          submission={selectedSub}
          guru={guru}
          onClose={() => setSelectedSub(null)}
          onGraded={() => {
            setSelectedSub(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

// ============ MODAL: GRADE STUDENT SUBMISSION ============
const GradeSubmissionModal: React.FC<{
  submission: ClassroomSubmission;
  guru: Account;
  onClose: () => void;
  onGraded: () => void;
}> = ({ submission, guru, onClose, onGraded }) => {
  const [nilai, setNilai] = useState<number>(submission.NILAI || 90);
  const [feedback, setFeedback] = useState<string>(submission.FEEDBACK || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    classroomService.gradeSubmission(submission.ID, nilai, feedback, guru.NAMA);
    onGraded();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4 backdrop-blur-xs">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Penilaian Tugas Siswa</h3>
              <p className="text-xs text-slate-500">{submission.SISWA_NAMA}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Jawaban Siswa</span>
          <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap font-sans">{submission.ISI}</p>
          {submission.LAMPIRAN_URL && (
            <div className="mt-2 text-[11px] text-blue-600 font-bold flex items-center gap-1">
              <FileText size={12} /> Lampiran: {submission.LAMPIRAN_URL}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Nilai Angka (0 - 100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={nilai}
            onChange={(e) => setNilai(Number(e.target.value))}
            className="w-full px-3.5 py-2 text-sm font-bold rounded-xl border border-slate-200 focus:outline-emerald-600 bg-white"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Catatan & Umpan Balik Guru</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="Tulis pujian, evaluasi, atau saran perbaikan untuk siswa..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-600"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">
            Batal
          </button>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20">
            <Check size={14} /> Simpan & Berikan Nilai
          </button>
        </div>
      </form>
    </div>
  );
};
