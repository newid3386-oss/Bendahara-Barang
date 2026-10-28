import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
  Filter,
  Check,
  Award,
  Layers,
  Camera,
  ExternalLink,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Account, P5Project, P5ProjectDailyLog } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';
import { accountService, STANDARD_CLASSES } from '../../services/accountService';

interface P5DailyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  initialKelas?: string;
  project?: P5Project;
}

const P5_DIMENSIONS = [
  'Beriman & Bertakwa',
  'Kebinekaan Global',
  'Gotong Royong',
  'Kemandirian',
  'Bernalar Kritis',
  'Kreativitas'
];

export const P5DailyLogModal: React.FC<P5DailyLogModalProps> = ({
  isOpen,
  onClose,
  account,
  initialKelas,
  project: initialProject,
}) => {
  const isGuru = account.ROLE === 'GURU' || account.ROLE === 'ADMIN' || account.ROLE === 'OPERATOR';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';
  const isSiswa = account.ROLE === 'SISWA';

  const [selectedKelas, setSelectedKelas] = useState<string>(initialKelas || account.KELAS || 'Kelas 4');
  const [logs, setLogs] = useState<P5ProjectDailyLog[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NEED_FEEDBACK' | 'REVIEWED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Active P5 Project
  const activeProject = useMemo(() => {
    if (initialProject && initialProject.KELAS === selectedKelas) return initialProject;
    return classroomService.getP5ProjectForClass(selectedKelas);
  }, [initialProject, selectedKelas]);

  // Form State for creating a new log (Student)
  const [isCreatingLog, setIsCreatingLog] = useState(false);
  const [logTanggal, setLogTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [logAktivitas, setLogAktivitas] = useState('');
  const [logRefleksi, setLogRefleksi] = useState('');
  const [logDimensi, setLogDimensi] = useState<string[]>(['Gotong Royong', 'Kreativitas']);
  const [logDokumentasi, setLogDokumentasi] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Teacher feedback modal / inline state
  const [feedbackingLogId, setFeedbackingLogId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadLogs = () => {
    if (isSiswa) {
      // Siswa sees their own logs for their class
      const userLogs = classroomService.getP5DailyLogs(selectedKelas, account.ID);
      setLogs(userLogs);
    } else {
      // Guru & Kepsek see all logs for selected class
      const classLogs = classroomService.getP5DailyLogs(selectedKelas);
      setLogs(classLogs);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      if (activeProject.STAGES.length > 0) {
        setSelectedStageId(activeProject.STAGES[0].ID);
      }
    }
  }, [isOpen, selectedKelas]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterStatus === 'NEED_FEEDBACK' && log.STATUS === 'REVIEWED') return false;
      if (filterStatus === 'REVIEWED' && log.STATUS !== 'REVIEWED') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = log.SISWA_NAMA.toLowerCase().includes(q);
        const matchAct = log.AKTIVITAS.toLowerCase().includes(q);
        const matchStage = (log.TAHAP_NAMA || '').toLowerCase().includes(q);
        if (!matchName && !matchAct && !matchStage) return false;
      }
      return true;
    });
  }, [logs, filterStatus, searchQuery]);

  const toggleDimensi = (dim: string) => {
    if (logDimensi.includes(dim)) {
      setLogDimensi(logDimensi.filter((d) => d !== dim));
    } else {
      setLogDimensi([...logDimensi, dim]);
    }
  };

  const handleSubmitNewLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logAktivitas.trim()) {
      setFormError('Mohon isi uraian kegiatan harian yang telah dikerjakan.');
      return;
    }

    const currentStage = activeProject.STAGES.find((s) => s.ID === selectedStageId);

    classroomService.saveP5DailyLog({
      PROJECT_ID: activeProject.ID,
      PROJECT_TITLE: activeProject.JUDUL,
      KELAS: selectedKelas,
      SISWA_ID: account.ID,
      SISWA_NAMA: account.NAMA,
      TANGGAL: logTanggal,
      TAHAP_ID: selectedStageId,
      TAHAP_NAMA: currentStage ? currentStage.NAME : 'Tahap Kegiatan',
      AKTIVITAS: logAktivitas.trim(),
      REFLEKSI: logRefleksi.trim(),
      DIMENSI_TERLATIH: logDimensi,
      DOKUMENTASI_URL: logDokumentasi.trim(),
      STATUS: 'SUBMITTED',
    });

    setIsCreatingLog(false);
    setLogAktivitas('');
    setLogRefleksi('');
    setLogDokumentasi('');
    setFormError(null);
    loadLogs();
    showToast('Jurnal kegiatan harian P5 berhasil dicatat dan dikirim ke Guru!');
  };

  const handleGiveFeedback = (logId: string) => {
    if (!feedbackText.trim()) return;
    const teacherName = account.NAMA || 'Guru Pembimbing';
    classroomService.giveP5DailyLogFeedback(logId, feedbackText.trim(), teacherName);
    setFeedbackingLogId(null);
    setFeedbackText('');
    loadLogs();
    showToast('Umpan balik dan evaluasi berhasil dikirim kepada siswa!');
  };

  const handleDeleteLog = (logId: string) => {
    if (window.confirm('Hapus entri jurnal harian ini?')) {
      classroomService.deleteP5DailyLog(logId);
      loadLogs();
      showToast('Entri log berhasil dihapus.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Toast Alert */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-60 bg-slate-900 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
            <Sparkles size={14} className="text-amber-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <BookOpen size={22} className="text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-200 text-[10px] font-black uppercase tracking-wider border border-purple-400/30">
                  Kurikulum Merdeka P5
                </span>
                <span className="text-[11px] text-indigo-200 font-bold">
                  {selectedKelas}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-1">
                Log Harian & Jurnal Refleksi Proyek P5
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5 max-w-2xl line-clamp-1">
                {activeProject.JUDUL} ({activeProject.TEMA})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Control Bar & Filter */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Class switcher for Guru / Kepsek */}
            {(isGuru || isKepsek) && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Kelas:</span>
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="font-bold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
                >
                  {STANDARD_CLASSES.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div className="flex bg-slate-200/60 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                  filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Semua ({logs.length})
              </button>
              {isGuru && (
                <button
                  type="button"
                  onClick={() => setFilterStatus('NEED_FEEDBACK')}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
                    filterStatus === 'NEED_FEEDBACK' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Clock size={11} className="text-amber-500" />
                  Perlu Umpan Balik ({logs.filter(l => l.STATUS !== 'REVIEWED').length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setFilterStatus('REVIEWED')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
                  filterStatus === 'REVIEWED' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 size={11} className="text-emerald-500" />
                Sudah Dinilai ({logs.filter(l => l.STATUS === 'REVIEWED').length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Create New Log for Student */}
            {isSiswa && !isCreatingLog && (
              <button
                type="button"
                onClick={() => setIsCreatingLog(true)}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Plus size={15} />
                <span>+ Catat Jurnal Harian</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* New Log Form (Student Submission) */}
          {isCreatingLog && (
            <div className="bg-purple-50/70 border-2 border-purple-200 rounded-3xl p-5 space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-purple-200">
                <div className="flex items-center gap-2 text-purple-900 font-black text-sm">
                  <Edit3 size={16} className="text-purple-700" />
                  <span>Tambah Catatan Kegiatan Harian Proyek P5</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingLog(false)}
                  className="p-1 rounded-lg text-purple-700 hover:bg-purple-200/60"
                >
                  <X size={16} />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-100 text-red-800 rounded-xl text-xs font-bold border border-red-200">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitNewLog} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                      Tanggal Pelaksanaan
                    </label>
                    <input
                      type="date"
                      value={logTanggal}
                      onChange={(e) => setLogTanggal(e.target.value)}
                      required
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                      Tahapan Alur Proyek
                    </label>
                    <select
                      value={selectedStageId}
                      onChange={(e) => setSelectedStageId(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-purple-600"
                    >
                      {activeProject.STAGES.map((stg) => (
                        <option key={stg.ID} value={stg.ID}>
                          {stg.NAME}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Uraian Aktivitas yang Dikerjakan Hari Ini *
                  </label>
                  <textarea
                    rows={3}
                    value={logAktivitas}
                    onChange={(e) => setLogAktivitas(e.target.value)}
                    placeholder="Contoh: Bersama kelompok 2 mengumpulkan sisa dedaunan di kebun sekolah, menimbang bahan seberat 5 kg, lalu memotong kecil-kecil untuk dimasukkan ke ember fermentasi..."
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Refleksi Diri / Tantangan & Pelajaran Baru (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={logRefleksi}
                    onChange={(e) => setLogRefleksi(e.target.value)}
                    placeholder="Contoh: Tadi sempat kesulitan memotong daun yang basah, namun setelah dibantu teman sekelompok pekerjaan jadi cepat selesai..."
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-purple-600"
                  />
                </div>

                {/* Dimensions Checkbox */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1.5">
                    Dimensi Profil Pancasila yang Dilatih / Dipraktikkan:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {P5_DIMENSIONS.map((dim) => {
                      const isSelected = logDimensi.includes(dim);
                      return (
                        <button
                          key={dim}
                          type="button"
                          onClick={() => toggleDimensi(dim)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-purple-700 text-white shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected && <Check size={12} />}
                          <span>{dim}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Tautan Foto Dokumentasi / Link Karya (Opsional)
                  </label>
                  <input
                    type="url"
                    value={logDokumentasi}
                    onChange={(e) => setLogDokumentasi(e.target.value)}
                    placeholder="https://drive.google.com/... atau URL gambar kegiatan"
                    className="w-full text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-purple-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-200">
                  <button
                    type="button"
                    onClick={() => setIsCreatingLog(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black shadow-md flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>Kirim Jurnal Harian</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Daily Logs */}
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <BookOpen size={24} />
                </div>
                <h4 className="text-sm font-black text-slate-700">Belum Ada Catatan Jurnal P5</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {isSiswa
                    ? 'Mulai dokumentasikan kegiatan harian proyek P5 Anda dengan menekan tombol "+ Catat Jurnal Harian" di atas.'
                    : `Belum ada peserta didik di ${selectedKelas} yang mengunggah jurnal harian untuk proyek ini.`}
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isReviewed = log.STATUS === 'REVIEWED';
                const isGivingFeedback = feedbackingLogId === log.ID;

                return (
                  <div
                    key={log.ID}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs p-5 space-y-4"
                  >
                    {/* Log Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center shrink-0">
                          {log.SISWA_NAMA.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{log.SISWA_NAMA}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">• {log.KELAS}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1 font-bold text-indigo-700">
                              <Calendar size={11} /> {log.TANGGAL}
                            </span>
                            {log.TAHAP_NAMA && (
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                                {log.TAHAP_NAMA}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isReviewed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            Telah Diberi Umpan Balik
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock size={12} className="text-amber-600" />
                            Menunggu Evaluasi Guru
                          </span>
                        )}

                        {/* Delete for creator or teacher */}
                        {(isGuru || account.ID === log.SISWA_ID) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(log.ID)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus entri log"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Log Activity Body */}
                    <div className="space-y-2">
                      <div className="text-xs text-slate-800 leading-relaxed font-medium">
                        {log.AKTIVITAS}
                      </div>

                      {log.REFLEKSI && (
                        <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-purple-900 leading-relaxed">
                          <span className="font-extrabold text-[10px] uppercase text-purple-700 block mb-0.5">
                            Refleksi Diri Siswa:
                          </span>
                          &ldquo;{log.REFLEKSI}&rdquo;
                        </div>
                      )}

                      {/* Dimensions tags */}
                      {log.DIMENSI_TERLATIH && log.DIMENSI_TERLATIH.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {log.DIMENSI_TERLATIH.map((dim, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              ✨ {dim}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Documentation Attachment */}
                      {log.DOKUMENTASI_URL && (
                        <div className="pt-1">
                          <a
                            href={log.DOKUMENTASI_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition"
                          >
                            <ExternalLink size={13} />
                            <span>Lihat Lampiran / Foto Dokumentasi</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Teacher Feedback Section */}
                    {log.FEEDBACK_GURU ? (
                      <div className="mt-3 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-emerald-950 font-black">
                            <Award size={15} className="text-emerald-700" />
                            <span>Catatan Umpan Balik Guru ({log.GURU_NAMA || 'Guru Pembimbing'})</span>
                          </div>
                          {log.FEEDBACK_AT && (
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              {new Date(log.FEEDBACK_AT).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                          {log.FEEDBACK_GURU}
                        </p>

                        {/* Option for teacher to update feedback */}
                        {isGuru && !isGivingFeedback && (
                          <div className="pt-1 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setFeedbackingLogId(log.ID);
                                setFeedbackText(log.FEEDBACK_GURU || '');
                              }}
                              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                            >
                              Ubah Umpan Balik
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      isGuru && !isGivingFeedback && (
                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setFeedbackingLogId(log.ID);
                              setFeedbackText('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black flex items-center gap-1.5 border border-indigo-200 transition cursor-pointer"
                          >
                            <MessageSquare size={13} />
                            <span>Beri Catatan Umpan Balik</span>
                          </button>
                        </div>
                      )
                    )}

                    {/* Teacher Input Box for Giving Feedback */}
                    {isGuru && isGivingFeedback && (
                      <div className="p-4 bg-indigo-50/70 rounded-2xl border-2 border-indigo-200 space-y-3 mt-3 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                            <MessageSquare size={14} className="text-indigo-600" />
                            Tulis Umpan Balik Langsung untuk {log.SISWA_NAMA}
                          </span>
                          <button
                            type="button"
                            onClick={() => setFeedbackingLogId(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X size={15} />
                          </button>
                        </div>

                        {/* Quick feedback suggestions */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 self-center">Template Cepat:</span>
                          {[
                            'Kerja sama tim sangat baik!',
                            'Dokumentasi rapi & observasi teliti.',
                            'Pertahankan inisiatif mandiri.',
                            'Bagus, perhatikan takaran & kebersihan.',
                          ].map((tmpl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setFeedbackText((prev) => (prev ? prev + ' ' + tmpl : tmpl))}
                              className="px-2 py-0.5 rounded-lg bg-white border border-indigo-200 text-indigo-800 text-[10px] font-semibold hover:bg-indigo-100 cursor-pointer"
                            >
                              + {tmpl}
                            </button>
                          ))}
                        </div>

                        <textarea
                          rows={3}
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Tuliskan catatan apresiasi, masukan perbaikan, atau tindak lanjut kegiatan P5 untuk siswa..."
                          className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white focus:outline-indigo-600"
                          autoFocus
                        />

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setFeedbackingLogId(null)}
                            className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGiveFeedback(log.ID)}
                            className="px-4 py-1.5 text-xs font-black bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl shadow-xs flex items-center gap-1"
                          >
                            <Send size={12} />
                            <span>Simpan Umpan Balik</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Total Log: {logs.length} entri</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">
              {logs.filter((l) => l.STATUS === 'REVIEWED').length} telah dievaluasi
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
