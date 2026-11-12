import React, { useState, useMemo, useCallback } from 'react';
import {
  HeartHandshake,
  Award,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Calendar,
  Filter,
  Plus,
  ChevronDown,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Search,
  X,
  MessageSquare,
  ThumbsUp,
  HelpCircle,
  Eye,
  Trash2,
  Edit3,
  BookOpen,
  MapPin,
  CalendarDays,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  StudentBehaviorLog,
  BehaviorCategory,
  BehaviorType,
  BehaviorAnalysisInsight,
  Account,
  RemedialGuidanceSession,
  RemedialSessionStatus
} from '../../types/classroom';
import { classroomService } from '../../services/classroomService';
import { accountService, STANDARD_CLASSES } from '../../services/accountService';

export interface BehaviorAnalysisWidgetProps {
  currentClass?: string;
  currentUser?: Account | null;
  onOpenComprehensiveReport?: (studentId: string) => void;
}

export const BehaviorAnalysisWidget: React.FC<BehaviorAnalysisWidgetProps> = ({
  currentClass,
  currentUser,
  onOpenComprehensiveReport,
}) => {
  const isGuru = currentUser?.ROLE === 'GURU';
  const initialClass = currentClass || (isGuru && currentUser?.KELAS ? currentUser.KELAS : 'Kelas 4B');
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [activeTab, setActiveTab] = useState<'ANALISIS' | 'JADWAL_REMEDIAL'>('ANALISIS');
  const [filterType, setFilterType] = useState<'SEMUA' | 'POSITIF' | 'PERLU_PERHATIAN'>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // New Observation Log Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [newLogSiswaId, setNewLogSiswaId] = useState<string>('');
  const [newLogKategori, setNewLogKategori] = useState<BehaviorCategory>('KEDISIPLINAN');
  const [newLogTipe, setNewLogTipe] = useState<BehaviorType>('POSITIF');
  const [newLogJudul, setNewLogJudul] = useState('');
  const [newLogCatatan, setNewLogCatatan] = useState('');
  const [newLogTindakLanjut, setNewLogTindakLanjut] = useState('');

  // Remedial Guidance Schedule Modal & States
  const [isRemedialModalOpen, setIsRemedialModalOpen] = useState(false);
  const [remSiswaId, setRemSiswaId] = useState<string>('');
  const [remMapel, setRemMapel] = useState<string>('Matematika');
  const [remTopik, setRemTopik] = useState<string>('');
  const [remTanggal, setRemTanggal] = useState<string>(() => {
    const d = new Date(Date.now() + 86400000 * 2);
    return d.toISOString().slice(0, 10);
  });
  const [remHari, setRemHari] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Kamis');
  const [remJamMulai, setRemJamMulai] = useState<string>('13:00');
  const [remJamSelesai, setRemJamSelesai] = useState<string>('14:00');
  const [remRuangan, setRemRuangan] = useState<string>('Ruang Bimbingan Konseling / Remedial');
  const [remCatatan, setRemCatatan] = useState<string>('');
  const [remTargetKompetensi, setRemTargetKompetensi] = useState<string>('Pemulihan pemahaman materi & ketuntasan KKM');
  const [remSyncCalendar, setRemSyncCalendar] = useState<boolean>(true);
  const [remedialFilterStatus, setRemedialFilterStatus] = useState<'SEMUA' | 'TERJADWAL' | 'SELESAI'>('SEMUA');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch insights and raw logs
  const insights: BehaviorAnalysisInsight = useMemo(() => {
    // refresh dependency
    void refreshTrigger;
    return classroomService.getBehaviorAnalysisInsights(selectedClass === 'Semua' ? undefined : selectedClass);
  }, [selectedClass, refreshTrigger]);

  const allLogs: StudentBehaviorLog[] = useMemo(() => {
    void refreshTrigger;
    return classroomService.getBehaviorLogs(selectedClass === 'Semua' ? undefined : selectedClass);
  }, [selectedClass, refreshTrigger]);

  // Filtered log entries
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const matchType = filterType === 'SEMUA' || log.TIPE === filterType;
      const matchSearch =
        searchQuery === '' ||
        log.SISWA_NAMA.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.JUDUL.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.CATATAN.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.KATEGORI.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [allLogs, filterType, searchQuery]);

  // Available students in selected class for logging
  const classStudents = useMemo(() => {
    try {
      const allAccs = accountService.getAccounts();
      const students = allAccs.filter((a) => a.ROLE === 'SISWA');
      if (selectedClass && selectedClass !== 'Semua') {
        const target = selectedClass.toLowerCase();
        return students.filter((s) => (s.KELAS || '').toLowerCase().includes(target));
      }
      return students;
    } catch {
      return [];
    }
  }, [selectedClass]);

  const handleSaveNewLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogSiswaId || !newLogJudul.trim() || !newLogCatatan.trim()) {
      showToast('⚠️ Mohon lengkapi nama siswa, judul perilaku, dan catatan observasi.');
      return;
    }

    const targetStudent = classStudents.find((s) => s.ID === newLogSiswaId);
    const studentName = targetStudent ? targetStudent.NAMA : 'Peserta Didik';
    const studentClass = targetStudent?.KELAS || selectedClass || 'Kelas 4B';

    classroomService.addBehaviorLog({
      SISWA_ID: newLogSiswaId,
      SISWA_NAMA: studentName,
      NISN: (targetStudent as any)?.NISN || undefined,
      KELAS: studentClass,
      TANGGAL: new Date().toISOString().slice(0, 10),
      KATEGORI: newLogKategori,
      TIPE: newLogTipe,
      POIN: newLogTipe === 'POSITIF' ? 10 : -5,
      JUDUL: newLogJudul.trim(),
      CATATAN: newLogCatatan.trim(),
      GURU_ID: currentUser?.ID || 'GURU-001',
      GURU_NAMA: currentUser?.NAMA || 'Nurul Hidayah, S.Pd.',
      TINDAK_LANJUT: newLogTindakLanjut.trim() || (newLogTipe === 'POSITIF' ? 'Pemberian apresiasi di depan kelas' : 'Bimbingan wali kelas'),
      STATUS_TINDAK_LANJUT: newLogTipe === 'POSITIF' ? 'SELESAI' : 'DALAM_PANTAUAN',
    });

    setIsLogModalOpen(false);
    setNewLogSiswaId('');
    setNewLogJudul('');
    setNewLogCatatan('');
    setNewLogTindakLanjut('');
    setRefreshTrigger((k) => k + 1);
    showToast(`✅ Catatan karakter untuk ${studentName} berhasil disimpan.`);
  };

  const handleDeleteLog = (id: string, siswaNama: string) => {
    if (confirm(`Hapus catatan karakter untuk ananda ${siswaNama}?`)) {
      classroomService.deleteBehaviorLog(id);
      setRefreshTrigger((k) => k + 1);
      showToast('🗑️ Catatan karakter berhasil dihapus.');
    }
  };

  // Remedial Guidance Sessions
  const remedialSessions: RemedialGuidanceSession[] = useMemo(() => {
    void refreshTrigger;
    return classroomService.getRemedialSessions(selectedClass === 'Semua' ? undefined : selectedClass);
  }, [selectedClass, refreshTrigger]);

  const filteredRemedialSessions = useMemo(() => {
    return remedialSessions.filter((s) => {
      const matchStatus = remedialFilterStatus === 'SEMUA' || s.STATUS === remedialFilterStatus;
      const matchSearch =
        searchQuery === '' ||
        s.SISWA_NAMA.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.MAPEL.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.TOPIK.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.RUANGAN.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [remedialSessions, remedialFilterStatus, searchQuery]);

  const handleOpenRemedialModal = (studentId?: string, defaultSubject?: string, defaultTopic?: string) => {
    const student = studentId ? classStudents.find((s) => s.ID === studentId) : classStudents[0];
    setRemSiswaId(student?.ID || (classStudents[0]?.ID || ''));
    setRemMapel(defaultSubject || 'Matematika');
    setRemTopik(defaultTopic ? `Bimbingan Khusus: ${defaultTopic}` : 'Penguatan Konsep & Remedial Khusus');
    const nextDate = new Date(Date.now() + 86400000 * 2);
    setRemTanggal(nextDate.toISOString().slice(0, 10));
    const daysArr: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu')[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dIdx = nextDate.getDay() === 0 ? 0 : nextDate.getDay() - 1;
    setRemHari(daysArr[dIdx] || 'Kamis');
    setRemJamMulai('13:00');
    setRemJamSelesai('14:00');
    setRemRuangan('Ruang Bimbingan Konseling / Remedial');
    setRemCatatan('');
    setRemTargetKompetensi('Pemulihan pemahaman materi & pemenuhan KKM');
    setRemSyncCalendar(true);
    setIsRemedialModalOpen(true);
  };

  const handleSaveRemedial = (e: React.FormEvent) => {
    e.preventDefault();
    const student = classStudents.find((s) => s.ID === remSiswaId) || {
      ID: remSiswaId || 'SIS-002',
      NAMA: 'Peserta Didik',
      KELAS: selectedClass !== 'Semua' ? selectedClass : 'Kelas 4B',
    };

    classroomService.saveRemedialSession({
      SISWA_ID: student.ID,
      SISWA_NAMA: student.NAMA,
      KELAS: student.KELAS || (selectedClass !== 'Semua' ? selectedClass : 'Kelas 4B'),
      MAPEL: remMapel,
      TOPIK: remTopik.trim() || 'Sesi Remedial Terpadu',
      TANGGAL: remTanggal,
      HARI: remHari,
      JAM_MULAI: remJamMulai,
      JAM_SELESAI: remJamSelesai,
      RUANGAN: remRuangan,
      GURU_ID: currentUser?.ID || 'GURU-001',
      GURU_NAMA: currentUser?.NAMA || 'Nurul Hidayah, S.Pd.',
      CATATAN: remCatatan.trim(),
      TARGET_KOMPETENSI: remTargetKompetensi.trim() || 'Pencapaian ketuntasan KKM',
      STATUS: 'TERJADWAL',
      syncToCalendar: remSyncCalendar,
    });

    setIsRemedialModalOpen(false);
    setRefreshTrigger((k) => k + 1);
    showToast(`✅ Sesi bimbingan remedial ananda ${student.NAMA} berhasil dijadwalkan & disinkronkan ke kalender kelas!`);
  };

  const handleToggleRemedialStatus = (id: string, currentStatus: RemedialSessionStatus) => {
    const nextStatus = currentStatus === 'TERJADWAL' ? 'SELESAI' : 'TERJADWAL';
    classroomService.updateRemedialSessionStatus(id, nextStatus);
    setRefreshTrigger((k) => k + 1);
    showToast(`✅ Status sesi bimbingan diperbarui menjadi: ${nextStatus === 'SELESAI' ? 'Selesai Dilaksanakan' : 'Terjadwal'}.`);
  };

  const handleDeleteRemedial = (id: string, siswaNama: string) => {
    if (confirm(`Hapus jadwal bimbingan remedial ananda ${siswaNama}? Jadwal terkait di kalender kelas juga akan dihapus.`)) {
      classroomService.deleteRemedialSession(id);
      setRefreshTrigger((k) => k + 1);
      showToast('🗑️ Jadwal bimbingan remedial dan jadwal kalender kelas terkait berhasil dihapus.');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-slate-900 transition-all">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between border-b border-slate-800 animate-in fade-in">
          <span>{toastMsg}</span>
          <button type="button" onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Widget Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-teal-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-300 ring-1 ring-teal-400/40 shrink-0">
            <HeartHandshake size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-lg text-white">Analisis Perilaku & Catatan Karakter</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/30 text-teal-200 border border-teal-400/30">
                Profil Pelajar Pancasila
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Bimbingan Remedial
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Observasi karakter, deteksi dini siswa butuh perhatian, serta manajemen jadwal bimbingan remedial khusus terintegrasi kalender.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700 text-xs font-bold rounded-xl px-3 py-2 pr-8 focus:outline-teal-400 appearance-none cursor-pointer"
            >
              <option value="Semua">Semua Kelas</option>
              {STANDARD_CLASSES.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => handleOpenRemedialModal()}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            title="Kelola & Tetapkan Jadwal Bimbingan Remedial Khusus Terintegrasi Kalender Kelas"
          >
            <Calendar size={14} strokeWidth={2.5} />
            <span>+ Jadwal Remedial</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLogModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>+ Catat Karakter</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher: Analisis Karakter vs Jadwal Bimbingan Remedial */}
      <div className="flex items-center px-4 sm:px-6 pt-2 bg-slate-950 border-b border-slate-800 gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('ANALISIS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'ANALISIS'
              ? 'bg-white text-slate-900 border-teal-500 shadow-sm'
              : 'text-slate-400 hover:text-white border-transparent hover:bg-slate-900/60'
          }`}
        >
          <HeartHandshake size={15} className={activeTab === 'ANALISIS' ? 'text-teal-600' : 'text-slate-400'} />
          <span>Analisis Observasi Karakter</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono font-bold">
            {insights.totalLogs}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('JADWAL_REMEDIAL')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'JADWAL_REMEDIAL'
              ? 'bg-white text-slate-900 border-indigo-500 shadow-sm'
              : 'text-slate-400 hover:text-white border-transparent hover:bg-slate-900/60'
          }`}
        >
          <Calendar size={15} className={activeTab === 'JADWAL_REMEDIAL' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>Jadwal Bimbingan Remedial Khusus</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-mono font-bold">
            {remedialSessions.filter((s) => s.STATUS === 'TERJADWAL').length} Aktif
          </span>
          <span className="hidden sm:inline px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
            Terintegrasi Kalender
          </span>
        </button>
      </div>

      {activeTab === 'ANALISIS' ? (
        <>
          {/* KPI Summary Cards Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-6 bg-slate-50 border-b border-slate-200">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400">Total Catatan</div>
            <div className="text-lg font-black text-slate-900">{insights.totalLogs} Observasi</div>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400">Perilaku Positif</div>
            <div className="text-lg font-black text-emerald-700">
              {insights.positiveCount} <span className="text-xs font-semibold text-slate-500">({insights.positiveRatio}%)</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-rose-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400">Perlu Perhatian Lebih</div>
            <div className="text-lg font-black text-rose-700">
              {insights.needsAttentionCount} <span className="text-xs font-semibold text-slate-500">Siswa/Kasus</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-teal-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400">Indeks Karakter</div>
            <div className="text-lg font-black text-teal-800">
              {insights.positiveRatio >= 70 ? 'SANGAT BAIK (A)' : 'BAIK (B)'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Dual Insight Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6 border-b border-slate-200">
        
        {/* Column 1: Siswa Menunjukkan Peningkatan / Perilaku Positif */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Award size={16} className="text-emerald-600" />
                Siswa Berperilaku Positif & Berprestasi Sikap
              </h4>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {insights.topPositiveStudents.length} Siswa Teladan
            </span>
          </div>

          <div className="space-y-2.5">
            {insights.topPositiveStudents.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                Belum ada catatan perilaku positif tercatat untuk filter ini.
              </div>
            ) : (
              insights.topPositiveStudents.map((st, idx) => (
                <div
                  key={st.siswaId}
                  className="p-3.5 bg-gradient-to-r from-emerald-50/60 to-white rounded-2xl border border-emerald-200/90 shadow-2xs hover:shadow-xs transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-slate-900 truncate">{st.siswaNama}</span>
                        <span className="text-[10px] font-bold text-slate-400">({st.kelas})</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {st.badges.map((b, bIdx) => (
                          <span
                            key={bIdx}
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-[280px]">
                        "{st.recentHighlight}"
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <div className="text-xs font-black text-emerald-700">+{st.totalScore} Poin</div>
                    {onOpenComprehensiveReport && (
                      <button
                        type="button"
                        onClick={() => onOpenComprehensiveReport(st.siswaId)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                        title="Cetak Laporan Ringkasan Komprehensif (Nilai, Presensi, Catatan Karakter)"
                      >
                        <Printer size={11} /> Cetak Rapor
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Siswa Memerlukan Perhatian & Bimbingan Khusus */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
              <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle size={16} className="text-rose-600" />
                Siswa Memerlukan Perhatian & Pendampingan
              </h4>
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              {insights.studentsNeedingAttention.length} Perlu Intervensi
            </span>
          </div>

          <div className="space-y-2.5">
            {insights.studentsNeedingAttention.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                Tidak ada siswa yang memerlukan perhatian mendesak saat ini. Semua dalam kondisi tertib kondusif!
              </div>
            ) : (
              insights.studentsNeedingAttention.map((st) => (
                <div
                  key={st.siswaId}
                  className="p-3.5 bg-gradient-to-r from-rose-50/70 to-white rounded-2xl border border-rose-300 shadow-2xs hover:shadow-xs transition flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-black text-xs text-slate-900 truncate">{st.siswaNama}</span>
                      <span className="text-[10px] font-bold text-slate-400">({st.kelas})</span>
                    </div>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
                        st.urgency === 'TINGGI'
                          ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      Urgensi: {st.urgency}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {st.criticalCategories.map((cat, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-800 border border-rose-300"
                      >
                        ⚠️ {cat}
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-500 font-medium">
                      • {st.attentionCount} kali catatan observasi
                    </span>
                  </div>

                  <div className="p-2 bg-rose-50/80 rounded-xl border border-rose-200 text-[11px] text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="leading-tight font-medium">
                      <strong>Tindak Lanjut Rekomendasi:</strong> {st.recommendedAction}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenRemedialModal(st.siswaId, 'Matematika', st.recommendedAction)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shrink-0 flex items-center gap-1 transition cursor-pointer shadow-2xs"
                        title="Atur Sesi Bimbingan Remedial Khusus Terintegrasi Kalender Kelas"
                      >
                        <Calendar size={11} /> + Jadwal Remedial
                      </button>
                      {onOpenComprehensiveReport && (
                        <button
                          type="button"
                          onClick={() => onOpenComprehensiveReport(st.siswaId)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shrink-0 flex items-center gap-1 transition cursor-pointer"
                          title="Cetak Laporan Ringkasan Komprehensif untuk Bahan Pembinaan / Rapat Orang Tua"
                        >
                          <Printer size={11} /> Rapor PDF
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown & Distribution Progress Bars */}
      <div className="p-4 sm:p-6 bg-slate-50/70 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={14} className="text-teal-700" />
            Distribusi Observasi Karakter per Kategori
          </h4>
          <span className="text-[10px] font-bold text-slate-500">
            Total {insights.totalLogs} catatan tercatat
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {insights.categoryBreakdown.map((cat) => {
            const posPct = cat.total > 0 ? Math.round((cat.positive / cat.total) * 100) : 0;
            return (
              <div key={cat.category} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="truncate">{cat.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({cat.total})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                  <div style={{ width: `${posPct}%` }} className="h-full bg-emerald-500" title={`Positif: ${cat.positive}`} />
                  <div style={{ width: `${100 - posPct}%` }} className="h-full bg-rose-400" title={`Perhatian: ${cat.needsAttention}`} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                  <span className="text-emerald-700">Positif: {cat.positive}</span>
                  <span className="text-rose-600">Perhatian: {cat.needsAttention}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filterable Table / Roster of Behavior Logs */}
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Daftar Catatan Observasi Guru ({filteredLogs.length})
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Type Filter Buttons */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('SEMUA')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterType === 'SEMUA' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Semua ({allLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('POSITIF')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterType === 'POSITIF' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Positif ({insights.positiveCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('PERLU_PERHATIAN')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterType === 'PERLU_PERHATIAN' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Perlu Perhatian ({insights.needsAttentionCount})
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative flex-1 sm:w-56">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari siswa atau perilaku..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-teal-500"
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
              Tidak ada data catatan karakter yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isPos = log.TIPE === 'POSITIF';
              return (
                <div
                  key={log.ID}
                  className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isPos
                      ? 'bg-emerald-50/30 border-emerald-200/80 hover:bg-emerald-50/50'
                      : 'bg-rose-50/40 border-rose-200/90 hover:bg-rose-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-xs ${
                        isPos ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      {isPos ? '+' + Math.abs(log.POIN) : log.POIN}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs text-slate-900">{log.SISWA_NAMA}</span>
                        <span className="text-[10px] font-bold text-slate-400">({log.KELAS})</span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border ${
                            isPos
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {log.KATEGORI}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar size={11} /> {log.TANGGAL}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-800 mt-0.5">{log.JUDUL}</div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{log.CATATAN}</p>
                      {log.TINDAK_LANJUT && (
                        <div className="text-[10px] text-teal-800 font-semibold mt-1 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-teal-600" />
                          <span>Tindak Lanjut: {log.TINDAK_LANJUT}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {onOpenComprehensiveReport && (
                      <button
                        type="button"
                        onClick={() => onOpenComprehensiveReport(log.SISWA_ID)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                        title="Cetak Laporan Ringkasan Komprehensif Resmi Siswa"
                      >
                        <FileText size={12} /> Cetak Rapor
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteLog(log.ID, log.SISWA_NAMA)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="Hapus Catatan Karakter"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
        </>
      ) : (
        /* ==================================================== */
        /* TAB 2: JADWAL BIMBINGAN REMEDIAL KHUSUS (INTEGRATED) */
        /* ==================================================== */
        <div className="space-y-6">
          {/* Calendar Integration Context Banner */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-teal-50 border-b border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
                <CalendarDays size={22} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-sm text-slate-900">
                    Manajemen Bimbingan Remedial Terintegrasi Kalender Kelas
                  </h4>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ⚡ Auto-Sync Kalender Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  Guru dapat menetapkan sesi bimbingan remedial khusus untuk peserta didik dengan intervensi belajar atau catatan sikap. Seluruh jadwal langsung tersinkronisasi ke modul Jadwal Pelajaran & Kalender Kelas secara real-time.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenRemedialModal()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 shrink-0 shadow-md transition cursor-pointer self-start md:self-center"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>+ Tetapkan Jadwal Baru</span>
            </button>
          </div>

          {/* Remedial Summary KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 sm:px-6">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400">Total Bimbingan</div>
                <div className="text-lg font-black text-slate-900">{remedialSessions.length} Sesi</div>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-amber-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400">Terjadwal (Aktif)</div>
                <div className="text-lg font-black text-amber-700">
                  {remedialSessions.filter((s) => s.STATUS === 'TERJADWAL').length} Sesi
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400">Selesai Dilaksanakan</div>
                <div className="text-lg font-black text-emerald-700">
                  {remedialSessions.filter((s) => s.STATUS === 'SELESAI').length} Tuntas
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-teal-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
                <Layers size={18} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400">Sinkron Kalender</div>
                <div className="text-lg font-black text-teal-800">
                  100% Terhubung
                </div>
              </div>
            </div>
          </div>

          {/* Filter Toolbar & Search */}
          <div className="px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setRemedialFilterStatus('SEMUA')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  remedialFilterStatus === 'SEMUA' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Semua ({remedialSessions.length})
              </button>
              <button
                type="button"
                onClick={() => setRemedialFilterStatus('TERJADWAL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  remedialFilterStatus === 'TERJADWAL' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Terjadwal ({remedialSessions.filter((s) => s.STATUS === 'TERJADWAL').length})
              </button>
              <button
                type="button"
                onClick={() => setRemedialFilterStatus('SELESAI')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  remedialFilterStatus === 'SELESAI' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Selesai ({remedialSessions.filter((s) => s.STATUS === 'SELESAI').length})
              </button>
            </div>

            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari siswa, mapel, topik..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500"
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* List of Remedial Guidance Sessions */}
          <div className="px-4 sm:px-6 pb-6 space-y-3">
            {filteredRemedialSessions.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CalendarDays size={24} />
                </div>
                <div>
                  <h5 className="font-black text-sm text-slate-800">Tidak ada jadwal bimbingan remedial ditemukan</h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mulai jadwalkan sesi bimbingan remedial baru untuk mendampingi ananda mencapai target KKM.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenRemedialModal()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus size={14} /> Jadwalkan Sesi Sekarang
                </button>
              </div>
            ) : (
              filteredRemedialSessions.map((session) => {
                const isTerjadwal = session.STATUS === 'TERJADWAL';
                return (
                  <div
                    key={session.ID}
                    className={`p-4 rounded-2xl border transition shadow-2xs hover:shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isTerjadwal
                        ? 'bg-gradient-to-r from-amber-50/40 via-white to-indigo-50/30 border-amber-200/90'
                        : 'bg-emerald-50/30 border-emerald-200/90'
                    }`}
                  >
                    {/* Student & Session Info */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900">{session.SISWA_NAMA}</span>
                        <span className="text-[11px] font-bold text-slate-500">({session.KELAS})</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                          {session.MAPEL}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isTerjadwal
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isTerjadwal ? '⏳ Terjadwal' : '✅ Selesai'}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <BookOpen size={13} className="text-indigo-600 shrink-0" />
                        <span>Fokus Topik: {session.TOPIK}</span>
                      </div>

                      {session.TARGET_KOMPETENSI && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                          <span>Target Capaian: {session.TARGET_KOMPETENSI}</span>
                        </div>
                      )}

                      {/* Schedule, Room & Calendar Sync Badge */}
                      <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] text-slate-600">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          <Calendar size={12} className="text-indigo-600" />
                          <span>{session.HARI}, {session.TANGGAL}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          <Clock size={12} className="text-amber-600" />
                          <span>{session.JAM_MULAI} - {session.JAM_SELESAI}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          <MapPin size={12} className="text-rose-500" />
                          <span>{session.RUANGAN}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          <UserCheck size={12} className="text-teal-600" />
                          <span>Guru: {session.GURU_NAMA}</span>
                        </span>
                      </div>

                      {/* Auto Calendar Integration Indicator */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                        <Sparkles size={11} className="text-indigo-600" />
                        <span>Terintegrasi Otomatis ke Jadwal & Kalender Kelas ({session.KELAS})</span>
                      </div>

                      {session.CATATAN && (
                        <p className="text-[11px] text-slate-500 italic bg-white/70 p-2 rounded-xl border border-slate-100">
                          "{session.CATATAN}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRemedialStatus(session.ID, session.STATUS)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                          isTerjadwal
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                        }`}
                        title={isTerjadwal ? 'Tandai sesi bimbingan remedial telah selesai dilaksanakan' : 'Kembalikan status menjadi terjadwal'}
                      >
                        <CheckCircle2 size={13} />
                        <span>{isTerjadwal ? 'Tandai Selesai' : 'Batal Selesai'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRemedial(session.ID, session.SISWA_NAMA)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus sesi bimbingan dan bersihkan jadwal terkait di kalender kelas"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal: + Jadwal Bimbingan Remedial Khusus (Terintegrasi Kalender) */}
      {isRemedialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-300 my-8">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Tetapkan Jadwal Bimbingan Remedial Khusus</h3>
                  <p className="text-[10px] text-indigo-200/90 flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-300" />
                    <span>Terintegrasi Langsung ke Kalender & Jadwal Pelajaran Kelas</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRemedialModalOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRemedial} className="p-6 space-y-4 text-xs">
              {/* Target Student */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Pilih Peserta Didik Target:
                </label>
                <select
                  value={remSiswaId}
                  onChange={(e) => setRemSiswaId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-indigo-600 cursor-pointer"
                  required
                >
                  {classStudents.map((s) => (
                    <option key={s.ID} value={s.ID}>
                      {s.NAMA} — {s.KELAS || selectedClass || 'Kelas 4B'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject & Day Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Mata Pelajaran:
                  </label>
                  <select
                    value={remMapel}
                    onChange={(e) => setRemMapel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-indigo-600 cursor-pointer"
                  >
                    <option value="Matematika">Matematika</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="IPAS">IPAS</option>
                    <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                    <option value="PJOK">PJOK</option>
                    <option value="Seni Budaya">Seni Budaya</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="Pendidikan Agama">Pendidikan Agama</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Hari Pelaksanaan:
                  </label>
                  <select
                    value={remHari}
                    onChange={(e) => setRemHari(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-indigo-600 cursor-pointer"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                  </select>
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Topik & Fokus Penguatan Materi Remedial:
                </label>
                <input
                  type="text"
                  value={remTopik}
                  onChange={(e) => setRemTopik(e.target.value)}
                  placeholder="Contoh: Operasi Hitung Pecahan & Penyelesaian Soal Cerita"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-indigo-600"
                  required
                />
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Tanggal:
                  </label>
                  <input
                    type="date"
                    value={remTanggal}
                    onChange={(e) => setRemTanggal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-indigo-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Jam Mulai:
                  </label>
                  <input
                    type="time"
                    value={remJamMulai}
                    onChange={(e) => setRemJamMulai(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-indigo-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Jam Selesai:
                  </label>
                  <input
                    type="time"
                    value={remJamSelesai}
                    onChange={(e) => setRemJamSelesai(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-indigo-600"
                    required
                  />
                </div>
              </div>

              {/* Room & Target Competency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Ruangan / Lokasi:
                  </label>
                  <input
                    type="text"
                    value={remRuangan}
                    onChange={(e) => setRemRuangan(e.target.value)}
                    placeholder="Contoh: Ruang BK / Pojok Literasi Kelas"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-indigo-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Target Capaian KKM / Asesmen:
                  </label>
                  <input
                    type="text"
                    value={remTargetKompetensi}
                    onChange={(e) => setRemTargetKompetensi(e.target.value)}
                    placeholder="Contoh: Target KKM 75 & Pemulihan Nilai"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-indigo-600"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Catatan Khusus Pembimbingan:
                </label>
                <textarea
                  value={remCatatan}
                  onChange={(e) => setRemCatatan(e.target.value)}
                  rows={2}
                  placeholder="Catatan strategi scaffolding, media konkret yang digunakan, atau konfirmasi pendampingan..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-indigo-600"
                />
              </div>

              {/* Calendar Sync Checkbox */}
              <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200/90 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="remSyncCheck"
                  checked={remSyncCalendar}
                  onChange={(e) => setRemSyncCalendar(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="remSyncCheck" className="text-xs text-indigo-950 font-medium cursor-pointer">
                  <strong className="block font-black text-indigo-900">
                    Integrasikan langsung ke Jadwal & Kalender Kelas
                  </strong>
                  Sesi ini akan otomatis ditambahkan ke kalender mata pelajaran kelas sehingga siswa dan guru dapat memantau jadwal di menu Jadwal Pelajaran.
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRemedialModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar size={14} />
                  <span>Simpan & Sinkronkan ke Kalender</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: + Catat Karakter Siswa */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-300">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/30 text-teal-200">
                  <HeartHandshake size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Catat Karakter & Perilaku Siswa</h3>
                  <p className="text-[10px] text-teal-200/80">Dokumentasi Sikap & Profil Pelajar Pancasila</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewLog} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              {/* Select Student */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Pilih Peserta Didik ({selectedClass}):
                </label>
                <select
                  value={newLogSiswaId}
                  onChange={(e) => setNewLogSiswaId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-teal-600"
                  required
                >
                  <option value="">-- Pilih Nama Siswa --</option>
                  {classStudents.map((st) => (
                    <option key={st.ID} value={st.ID}>
                      {st.NAMA} - {st.KELAS || selectedClass}
                    </option>
                  ))}
                </select>
              </div>

              {/* Behavior Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewLogTipe('POSITIF')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                    newLogTipe === 'POSITIF'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ✨ Perilaku Positif (+10 Poin)
                </button>
                <button
                  type="button"
                  onClick={() => setNewLogTipe('PERLU_PERHATIAN')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                    newLogTipe === 'PERLU_PERHATIAN'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ⚠️ Perlu Perhatian (-5 Poin)
                </button>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Kategori Profil Karakter:
                </label>
                <select
                  value={newLogKategori}
                  onChange={(e) => setNewLogKategori(e.target.value as BehaviorCategory)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-teal-600"
                >
                  <option value="KEDISIPLINAN">Kedisiplinan & Ketaatan Aturan</option>
                  <option value="GOTONG_ROYONG">Gotong Royong & Kepedulian Sosial</option>
                  <option value="KEJUJURAN">Kejujuran & Integritas Siswa</option>
                  <option value="TANGGUNG_JAWAB">Tanggung Jawab Belajar & Tugas</option>
                  <option value="KESANTUNAN">Kesantunan & Adab 5S</option>
                  <option value="KEMANDIRIAN">Kemandirian Belajar & Inisiatif</option>
                  <option value="KEPEMIMPINAN">Kepemimpinan & Tutor Sebaya</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Judul Ringkasan Perilaku:
                </label>
                <input
                  type="text"
                  value={newLogJudul}
                  onChange={(e) => setNewLogJudul(e.target.value)}
                  placeholder="Contoh: Inisiatif Membantu Teman saat Praktik P5"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-teal-600"
                  required
                />
              </div>

              {/* Detail Narrative Note */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Catatan Observasi Lengkap:
                </label>
                <textarea
                  value={newLogCatatan}
                  onChange={(e) => setNewLogCatatan(e.target.value)}
                  rows={3}
                  placeholder="Deskripsikan situasi, kronologi, atau dampak tindakan siswa di kelas..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-teal-600"
                  required
                />
              </div>

              {/* Follow-up Action */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Rencana Tindak Lanjut Guru:
                </label>
                <input
                  type="text"
                  value={newLogTindakLanjut}
                  onChange={(e) => setNewLogTindakLanjut(e.target.value)}
                  placeholder="Contoh: Apresiasi di depan kelas / Bimbingan wali kelas & konfirmasi ortu"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-teal-600"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-md cursor-pointer"
                >
                  Simpan Catatan Karakter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
