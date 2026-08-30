import React, { useState, useEffect } from 'react';
import {
  BookOpen, GraduationCap, FileText, ClipboardList, LogOut, School, Plus,
  ChevronRight, ArrowLeft, CheckCircle2, Clock, Award, Users, Calendar, X,
  Send, Star, MessageSquare, LayoutDashboard,
} from 'lucide-react';
import { accountService } from '../services/accountService';
import { classroomService } from '../services/classroomService';
import { Account } from '../types/classroom';
import { ClassroomCourse, ClassroomAssignment, ClassroomSubmission, ClassroomReport } from '../types/classroom';

interface ClassroomAppProps {
  onLogout: () => void;
}

type ClassPage = 'dashboard' | 'courses' | 'assignments' | 'reports';

export const ClassroomApp: React.FC<ClassroomAppProps> = ({ onLogout }) => {
  const [account, setAccount] = useState<Account | null>(accountService.getActiveClassroomAccount());
  const [page, setPage] = useState<ClassPage>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobileNav, setIsMobileNav] = useState(false);

  useEffect(() => {
    accountService.initAccounts();
    classroomService.initClassroom();
  }, []);

  const refresh = () => setRefreshKey((k) => k + 1);
  useEffect(() => { refresh(); }, [page]);

  if (!account) {
    onLogout();
    return null;
  }

  const isSiswa = account.ROLE === 'SISWA';
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';

  const allCourses = classroomService.getCourses();
  const courses = isSiswa
    ? classroomService.getCoursesForSiswa(account.ID)
    : isGuru
    ? classroomService.getCoursesForGuru(account.ID)
    : allCourses;

  const allAssignments = isSiswa
    ? courses.flatMap((c) => classroomService.getAssignments(c.ID))
    : isGuru
    ? courses.flatMap((c) => classroomService.getAssignments(c.ID))
    : classroomService.getAssignments();

  const mySubmissions = isSiswa ? classroomService.getSubmissions(undefined, account.ID) : [];
  const allSubmissions = classroomService.getSubmissions();
  const reports = isGuru ? classroomService.getReportsForGuru(account.ID) : classroomService.getReports();

  const navItems: { id: ClassPage; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Kelas Saya', icon: School },
    { id: 'assignments', label: 'Tugas & Materi', icon: ClipboardList },
    { id: 'reports', label: 'Laporan Guru', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Bar */}
      <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white sticky top-0 z-30 shadow-lg">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileNav(!isMobileNav)} className="lg:hidden p-2 rounded-lg hover:bg-white/10">
              <BookOpen size={20} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center">
              <GraduationCap size={22} className="text-blue-200" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight leading-none">SDN Tangerang 6 Classroom</h1>
              <span className="text-[10px] text-blue-300 font-semibold">Pembelajaran Online Terpadu</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold leading-none">{account.NAMA}</div>
              <div className="text-[10px] text-blue-300 mt-0.5">{account.ROLE}{account.KELAS ? ` • ${account.KELAS}` : ''}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center font-bold text-sm">
              {account.NAMA.charAt(0)}
            </div>
            <button onClick={onLogout} className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-slate-200 hover:text-white transition-colors" title="Keluar">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`fixed lg:static top-16 bottom-0 left-0 z-20 w-60 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 lg:translate-x-0 ${isMobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
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
            Classroom v1.0 • Terpisah dari SIPERSEDA
          </div>
        </aside>

        {isMobileNav && <div className="fixed inset-0 top-16 z-10 bg-slate-950/50 lg:hidden" onClick={() => setIsMobileNav(false)} />}

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full" key={refreshKey}>
          {page === 'dashboard' && (
            <DashboardView account={account} courses={courses} assignments={allAssignments} reports={reports} submissions={isSiswa ? mySubmissions : allSubmissions} onNavigate={setPage} />
          )}
          {page === 'courses' && (
            <CoursesView account={account} courses={courses} selectedCourseId={selectedCourseId} onSelect={setSelectedCourseId} onRefresh={refresh} />
          )}
          {page === 'assignments' && (
            <AssignmentsView account={account} courses={courses} assignments={allAssignments} onRefresh={refresh} />
          )}
          {page === 'reports' && (
            <ReportsView account={account} reports={reports} onRefresh={refresh} />
          )}
        </main>
      </div>
    </div>
  );
};

// ============ DASHBOARD ============
const DashboardView: React.FC<{
  account: Account;
  courses: ClassroomCourse[];
  assignments: ClassroomAssignment[];
  reports: ClassroomReport[];
  submissions: ClassroomSubmission[];
  onNavigate: (p: ClassPage) => void;
}> = ({ account, courses, assignments, reports, submissions, onNavigate }) => {
  const isSiswa = account.ROLE === 'SISWA';
  const isGuru = account.ROLE === 'GURU';
  const pendingTasks = isSiswa
    ? assignments.filter((a) => !submissions.find((s) => s.ASSIGNMENT_ID === a.ID && s.STATUS !== 'DRAFT')).length
    : 0;
  const submittedCount = submissions.filter((s) => s.STATUS === 'SUBMITTED' || s.STATUS === 'GRADED').length;
  const gradedCount = submissions.filter((s) => s.STATUS === 'GRADED').length;
  const pendingReports = reports.filter((r) => r.STATUS === 'DIKIRIM').length;
  const myReportCount = isGuru ? reports.length : 0;

  const stats = [
    { label: 'Kelas Aktif', value: courses.length, icon: School, color: 'text-blue-700 bg-blue-100' },
    { label: 'Tugas & Materi', value: assignments.length, icon: ClipboardList, color: 'text-indigo-700 bg-indigo-100' },
    ...(isSiswa
      ? [
          { label: 'Tugas Belum Selesai', value: pendingTasks, icon: Clock, color: 'text-amber-700 bg-amber-100' },
          { label: 'Sudah Dikumpulkan', value: submittedCount, icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-100' },
        ]
      : isGuru
      ? [
          { label: 'Laporan Dibuat', value: myReportCount, icon: FileText, color: 'text-emerald-700 bg-emerald-100' },
          { label: 'Laporan Menunggu Nilai', value: pendingReports, icon: Award, color: 'text-amber-700 bg-amber-100' },
        ]
      : [
          { label: 'Laporan Menunggu Nilai', value: pendingReports, icon: Award, color: 'text-amber-700 bg-amber-100' },
          { label: 'Total Laporan', value: reports.length, icon: FileText, color: 'text-emerald-700 bg-emerald-100' },
        ]),
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-2 text-blue-300 text-xs font-bold mb-1">
          <GraduationCap size={14} /> Selamat Datang
        </div>
        <h2 className="text-xl font-black">{account.NAMA}</h2>
        <p className="text-blue-200 text-xs mt-1">
          {account.ROLE === 'SISWA' ? `Siswa ${account.KELAS || ''}` : account.ROLE === 'GURU' ? 'Guru Pengampu' : 'Kepala Sekolah'} • SD Negeri Tangerang 6
        </p>
      </div>

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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
          <School size={16} className="text-blue-700" /> Kelas Terbaru
        </h3>
        {courses.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Belum ada kelas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courses.slice(0, 4).map((c) => (
              <div key={c.ID} className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{c.KODE_KELAS}</span>
                  <span className="text-[10px] text-slate-400">{c.SISWA_IDS.length} Siswa</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{c.NAMA}</h4>
                <p className="text-[11px] text-slate-500 mt-1">{c.GURU_NAMA}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => onNavigate('courses')} className="mt-4 text-blue-700 hover:text-blue-900 font-bold text-xs flex items-center gap-1">
          Lihat Semua Kelas <ChevronRight size={14} />
        </button>
      </div>

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

      {(isGuru || account.ROLE === 'KEPALA SEKOLAH') && pendingReports > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
            <Award size={16} /> {pendingReports} Laporan {isGuru ? 'Terkirim Menunggu Penilaian' : 'Menunggu Dinilai Kepala Sekolah'}
          </div>
          <button onClick={() => onNavigate('reports')} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs flex items-center gap-1">
            {isGuru ? 'Lihat Laporan' : 'Beri Penilaian'} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

// ============ COURSES ============
const CoursesView: React.FC<{
  account: Account;
  courses: ClassroomCourse[];
  selectedCourseId: string | null;
  onSelect: (id: string | null) => void;
  onRefresh: () => void;
}> = ({ account, courses, selectedCourseId, onSelect, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const [showCreate, setShowCreate] = useState(false);
  const allSiswa = accountService.getAccounts('CLASSROOM').filter((a) => a.ROLE === 'SISWA');

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
          <span className="font-mono text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">{selectedCourse.KODE_KELAS}</span>
          <h2 className="text-lg font-black mt-2">{selectedCourse.NAMA}</h2>
          <p className="text-blue-200 text-xs mt-1">{selectedCourse.DESKRIPSI}</p>
          <div className="flex items-center gap-3 mt-3 text-[11px] text-blue-200">
            <span className="flex items-center gap-1"><Users size={12} /> {enrolled.length} Siswa</span>
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
              {courseAssignments.map((a) => (
                <div key={a.ID} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${a.TYPE === 'TUGAS' ? 'bg-amber-100 text-amber-800' : a.TYPE === 'ULANGAN' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>{a.TYPE}</span>
                      <h4 className="text-xs font-bold text-slate-800">{a.JUDUL}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{a.DESKRIPSI}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0"><Calendar size={11} /> {a.DEADLINE}</span>
                </div>
              ))}
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
          <p className="text-xs text-slate-500">{isGuru ? 'Kelola kelas pembelajaran Anda' : 'Kelas yang Anda ikuti'}</p>
        </div>
        {isGuru && (
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5">
            <Plus size={14} /> Buat Kelas
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
                  <span className="text-[10px] text-slate-400">{c.SISWA_IDS.length} Siswa</span>
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
      <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><Users size={16} className="text-blue-700" /> Kelola Siswa</h3>
      {enrolled.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Terdaftar ({enrolled.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {enrolled.map((s) => (
              <span key={s.ID} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                {s.NAMA}
                <button onClick={() => { classroomService.unenrollSiswa(course.ID, s.ID); onRefresh(); }} className="hover:text-rose-600"><X size={11} /></button>
              </span>
            ))}
          </div>
        </div>
      )}
      {unenrolled.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Belum Terdaftar</p>
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
  const [tingkat, setTingkat] = useState('Kelas 1');
  const [deskripsi, setDeskripsi] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    classroomService.saveCourse({ NAMA: nama, KODE_KELAS: kode, KELAS_TINGKAT: tingkat, DESKRIPSI: deskripsi, GURU_ID: account.ID, GURU_NAMA: account.NAMA, SISWA_IDS: [] });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Buat Kelas Baru</h3>
          <button type="button" onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Kelas</label>
          <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="cth: Kelas 1A - Tema Lingkungan" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Kode Kelas</label>
            <input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="1A-2026" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Tingkat</label>
            <select value={tingkat} onChange={(e) => setTingkat(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600">
              {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map((k) => <option key={k}>{k}</option>)}
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

// ============ ASSIGNMENTS ============
const AssignmentsView: React.FC<{
  account: Account;
  courses: ClassroomCourse[];
  assignments: ClassroomAssignment[];
  onRefresh: () => void;
}> = ({ account, courses, assignments, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const [showCreate, setShowCreate] = useState(false);
  const [submitFor, setSubmitFor] = useState<ClassroomAssignment | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Tugas & Materi</h2>
          <p className="text-xs text-slate-500">{isGuru ? 'Buat dan kelola tugas untuk kelas Anda' : 'Kerjakan tugas dari guru Anda'}</p>
        </div>
        {isGuru && (
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5">
            <Plus size={14} /> Buat Tugas
          </button>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <ClipboardList size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Belum ada tugas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => {
            const course = courses.find((c) => c.ID === a.COURSE_ID);
            const mySub = account.ROLE === 'SISWA' ? classroomService.getSubmissions(a.ID, account.ID)[0] : undefined;
            const subCount = classroomService.getSubmissions(a.ID).length;
            return (
              <div key={a.ID} className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${a.TYPE === 'TUGAS' ? 'bg-amber-100 text-amber-800' : a.TYPE === 'ULANGAN' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>{a.TYPE}</span>
                      <h4 className="text-xs font-bold text-slate-800">{a.JUDUL}</h4>
                      {mySub && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${mySub.STATUS === 'GRADED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {mySub.STATUS === 'GRADED' ? `Dinilai: ${mySub.NILAI}` : 'Terkirim'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{a.DESKRIPSI}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><School size={11} /> {course?.KODE_KELAS || '-'}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> Deadline: {a.DEADLINE}</span>
                      {!account.ROLE || account.ROLE !== 'SISWA' ? <span className="flex items-center gap-1"><Users size={11} /> {subCount} dikumpulkan</span> : null}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {account.ROLE === 'SISWA' && a.TYPE !== 'MATERI' && (
                      <button onClick={() => setSubmitFor(a)} className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] flex items-center gap-1">
                        {mySub ? 'Lihat' : 'Kerjakan'}
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
        <CreateAssignmentModal account={account} courses={courses} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); onRefresh(); }} />
      )}
      {submitFor && (
        <SubmitAssignmentModal assignment={submitFor} siswa={account} onClose={() => setSubmitFor(null)} onSaved={() => { setSubmitFor(null); onRefresh(); }} />
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

// ============ REPORTS ============
const ReportsView: React.FC<{ account: Account; reports: ClassroomReport[]; onRefresh: () => void }> = ({ account, reports, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';
  const [showCreate, setShowCreate] = useState(false);
  const [gradeFor, setGradeFor] = useState<ClassroomReport | null>(null);

  const pendingReports = reports.filter((r) => r.STATUS === 'DIKIRIM');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Laporan Guru</h2>
          <p className="text-xs text-slate-500">
            {isGuru ? 'Buat laporan untuk dinilai Kepala Sekolah' : isKepsek ? 'Nilai laporan dari guru-guru' : 'Daftar laporan pembelajaran'}
          </p>
        </div>
        {isGuru && (
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5">
            <Plus size={14} /> Buat Laporan
          </button>
        )}
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
  const [judul, setJudul] = useState('');
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
          <h3 className="text-base font-black text-slate-900">Buat Laporan</h3>
          <button type="button" onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Judul Laporan</label>
          <input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="cth: Laporan Bulanan Kelas 1A" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" autoFocus />
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
          <label className="text-xs font-semibold text-slate-700 block mb-1">Isi Laporan</label>
          <textarea value={isi} onChange={(e) => setIsi(e.target.value)} rows={6} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600" placeholder="Tulis isi laporan pembelajaran..." />
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
  const [nilai, setNilai] = useState(80);
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
          <h3 className="text-base font-black text-slate-900">Nilai Laporan</h3>
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
          <label className="text-xs font-semibold text-slate-700 block mb-1">Feedback / Catatan</label>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-600" placeholder="Tulis catatan untuk guru..." />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500">Batal</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5"><Star size={12} /> Beri Nilai</button>
        </div>
      </form>
    </div>
  );
};
