import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  CheckCircle2,
  Clock,
  Circle,
  Award,
  Sparkles,
  ChevronDown,
  Layers,
  Edit3,
  Calendar,
  UserCheck,
  Send,
  Loader2,
  Bot,
  User,
  Trash2,
  BookOpen,
  AlertTriangle,
  BellRing,
  AlertCircle,
  X,
  Check,
  Download,
  Plus,
  ListPlus,
  FileText,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Account, P5Project, P5ProjectStage } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';
import { STANDARD_CLASSES } from '../../services/accountService';
import { playFeedback } from '../../utils/feedback';
import { P5DailyLogModal } from './P5DailyLogModal';

interface P5ProjectTrackerWidgetProps {
  account: Account;
  className?: string;
}

export const P5ProjectTrackerWidget: React.FC<P5ProjectTrackerWidgetProps> = ({ account, className = '' }) => {
  const isGuru = account.ROLE === 'GURU' || account.ROLE === 'ADMIN' || account.ROLE === 'OPERATOR';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';
  const isSiswa = account.ROLE === 'SISWA';

  // Default class selection
  const [selectedKelas, setSelectedKelas] = useState<string>(account.KELAS || 'Kelas 4');
  const [project, setProject] = useState<P5Project>(() => classroomService.getP5ProjectForClass(selectedKelas));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDailyLogModal, setShowDailyLogModal] = useState(false);

  const dailyLogsCount = useMemo(() => {
    return isSiswa
      ? classroomService.getP5DailyLogs(selectedKelas, account.ID).length
      : classroomService.getP5DailyLogs(selectedKelas).length;
  }, [selectedKelas, isSiswa, account.ID, showDailyLogModal]);

  // P5 AI Mentor Bot States
  const [showP5Bot, setShowP5Bot] = useState(false);
  const [p5Messages, setP5Messages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: `Halo! Saya **AI Mentor Karakter & Ide Kreatif P5**. 🧭✨\n\nSaya siap membantu Bapak/Ibu Guru merancang proyek P5 tingkat sekolah dasar.\n\nSilakan pilih salah satu pertanyaan cepat di bawah atau ketikkan pertanyaan Anda sendiri!`,
    },
  ]);
  const [p5Input, setP5Input] = useState('');
  const [p5Loading, setP5Loading] = useState(false);

  const handleSendP5Message = async (textToSend?: string) => {
    const text = (textToSend || p5Input).trim();
    if (!text || p5Loading) return;

    // Add user message
    const userMsg = { sender: 'user' as const, text };
    setP5Messages((prev) => [...prev, userMsg]);
    if (!textToSend) setP5Input('');
    setP5Loading(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          assistantType: 'P5_MENTOR',
          userName: account.NAMA,
          userRole: account.ROLE,
        }),
      });

      const result = await response.json();
      if (result.success && result.data?.reply) {
        setP5Messages((prev) => [
          ...prev,
          { sender: 'bot' as const, text: result.data.reply },
        ]);
      } else {
        setP5Messages((prev) => [
          ...prev,
          { sender: 'bot' as const, text: 'Maaf, saya tidak dapat memproses tanggapan saat ini. Silakan coba beberapa saat lagi.' },
        ]);
      }
    } catch (error) {
      console.error('Error contacting P5 Bot:', error);
      setP5Messages((prev) => [
        ...prev,
        { sender: 'bot' as const, text: 'Koneksi ke asisten AI terputus. Silakan periksa jaringan internet Anda.' },
      ]);
    } finally {
      setP5Loading(false);
    }
  };

  useEffect(() => {
    const updated = classroomService.getP5ProjectForClass(selectedKelas);
    setProject(updated);
  }, [selectedKelas]);

  // Deadline & Early Warning (< 3 Days) Calculations for Student Discipline
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [customDeadlineInput, setCustomDeadlineInput] = useState('');

  const projectDeadline = useMemo(() => {
    return project.DEADLINE || '2026-11-07';
  }, [project.DEADLINE]);

  const deadlineInfo = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [y, m, d] = (projectDeadline || '2026-11-07').split('-').map(Number);
    const deadlineDate = new Date(y, (m || 1) - 1, d || 1);
    const diffMs = deadlineDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const isCompleted = project.PERCENTAGE >= 100;
    const isApproaching = !isCompleted && daysRemaining >= 0 && daysRemaining < 3;
    const isOverdue = !isCompleted && daysRemaining < 0;
    const isUrgent = isApproaching || isOverdue;

    const formattedDate = deadlineDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return {
      projectDeadline,
      deadlineDate,
      daysRemaining,
      isApproaching,
      isOverdue,
      isUrgent,
      formattedDate,
    };
  }, [projectDeadline, project.PERCENTAGE]);

  // Early warning notification trigger on load/class change when deadline < 3 days
  useEffect(() => {
    if (deadlineInfo.isUrgent) {
      playFeedback('warning');
      const msg = deadlineInfo.isOverdue
        ? `⚠️ Perhatian Kedisiplinan: Tenggat waktu proyek P5 ${selectedKelas} telah terlampaui (${deadlineInfo.formattedDate}). Segera selesaikan evaluasi akhir!`
        : `⚠️ Peringatan Dini: Proyek P5 ${selectedKelas} mendekati batas tenggat waktu (${deadlineInfo.daysRemaining === 0 ? 'Hari Ini!' : `${deadlineInfo.daysRemaining} hari lagi`}). Tingkatkan kedisiplinan belajar siswa!`;
      setToastMessage(msg);
      const timer = setTimeout(() => setToastMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [selectedKelas, deadlineInfo.isUrgent, deadlineInfo.daysRemaining, deadlineInfo.isOverdue, deadlineInfo.formattedDate]);

  const handleBroadcastDisciplineReminder = () => {
    playFeedback('success');
    const msg = `📢 Notifikasi Kedisiplinan Terkirim! Peringatan tenggat waktu (${deadlineInfo.daysRemaining <= 0 ? 'Hari Ini' : `${deadlineInfo.daysRemaining} Hari Lagi`}) berhasil disiarkan kepada seluruh siswa & kelompok ${selectedKelas}.`;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5500);
  };

  const handleUpdateDeadline = (newDate: string) => {
    if (!newDate) return;
    const updated = classroomService.updateP5ProjectDeadline(project.ID, newDate, account.NAMA || 'Guru');
    setProject(updated);
    setShowDeadlineModal(false);
    playFeedback('success');
    setToastMessage(`Tenggat waktu proyek diperbarui ke tanggal ${newDate}!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStageStatusChange = (
    stageId: string,
    newStatus: 'BELUM_MULAI' | 'SEDANG_BERJALAN' | 'SELESAI'
  ) => {
    const updated = classroomService.updateP5StageStatus(
      project.ID,
      stageId,
      newStatus,
      account.NAMA || 'Guru'
    );
    setProject(updated);

    const stageObj = updated.STAGES.find((s) => s.ID === stageId);
    setToastMessage(`Status "${stageObj?.NAME || 'Tahapan'}" diperbarui menjadi ${newStatus.replace('_', ' ')}!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // State & Handlers for Manual Milestone Target Creation by Teacher
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneTargetDate, setNewMilestoneTargetDate] = useState('');
  const [newMilestoneStatus, setNewMilestoneStatus] = useState<'BELUM_MULAI' | 'SEDANG_BERJALAN' | 'SELESAI'>('BELUM_MULAI');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleOpenAddMilestone = () => {
    const nextNumber = project.STAGES.length + 1;
    setNewMilestoneName(`Tahap ${nextNumber}: `);
    setNewMilestoneDesc('');
    setNewMilestoneTargetDate(projectDeadline || '');
    setNewMilestoneStatus('BELUM_MULAI');
    setShowAddMilestoneModal(true);
    playFeedback('click');
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneName.trim()) {
      setToastMessage('Nama milestone target tidak boleh kosong!');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const updated = classroomService.addP5Stage(
      project.ID,
      {
        NAME: newMilestoneName.trim(),
        DESCRIPTION: newMilestoneDesc.trim() || 'Aksi dan pencapaian target proyek oleh siswa.',
        STATUS: newMilestoneStatus,
        TARGET_DATE: newMilestoneTargetDate || undefined,
      },
      account.NAMA || 'Guru'
    );

    setProject(updated);
    setShowAddMilestoneModal(false);
    playFeedback('success');
    setToastMessage(`Milestone target baru "${newMilestoneName.trim()}" berhasil ditambahkan!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteMilestone = (stageId: string, stageName: string) => {
    if (project.STAGES.length <= 1) {
      setToastMessage('Proyek minimal harus memiliki 1 tahapan milestone!');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    const updated = classroomService.deleteP5Stage(project.ID, stageId, account.NAMA || 'Guru');
    setProject(updated);
    playFeedback('warning');
    setToastMessage(`Milestone "${stageName}" telah dihapus.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handler for Generating & Downloading P5 Milestone Summary PDF
  const handleDownloadP5SummaryPDF = () => {
    try {
      setIsDownloadingPdf(true);
      playFeedback('click');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // 1. Header / Kop Surat Resmi SDN Tangerang 6
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('PEMERINTAH KOTA TANGERANG', 105, 14, { align: 'center' });
      doc.setFontSize(10);
      doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', 105, 19, { align: 'center' });
      doc.setFontSize(13);
      doc.setTextColor(79, 70, 229);
      doc.text('SD NEGERI TANGERANG 6', 105, 25, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Jl. Sukamanah V No. 16, Kec. Tangerang, Kota Tangerang, Banten 15118', 105, 29, { align: 'center' });

      // Decorative double border line
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.8);
      doc.line(14, 32, 196, 32);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(14, 33.2, 196, 33.2);

      // 2. Document Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('RINGKASAN PROGRES & MILESTONE CAPAIAN P5', 105, 41, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Projek Penguatan Profil Pelajar Pancasila (Kurikulum Merdeka)', 105, 46, { align: 'center' });

      // 3. Project Information Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 50, 182, 38, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(79, 70, 229);
      doc.text('INFORMASI PROYEK', 18, 56);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      // Left Column
      doc.text('Rombel / Kelas', 18, 62);
      doc.text(`: ${selectedKelas}`, 55, 62);
      doc.text('Tema Proyek', 18, 67);
      doc.text(`: ${project.TEMA}`, 55, 67);
      doc.text('Judul Proyek', 18, 72);
      doc.setFont('helvetica', 'bold');
      doc.text(`: ${project.JUDUL.substring(0, 42)}${project.JUDUL.length > 42 ? '...' : ''}`, 55, 72);
      doc.setFont('helvetica', 'normal');
      doc.text('Target Dimensi', 18, 77);
      doc.text(`: ${project.DIMENSI.join(', ')}`, 55, 77);
      doc.text('Batas Tenggat (Deadline)', 18, 82);
      doc.text(`: ${deadlineInfo.formattedDate}`, 55, 82);

      // Right Column (Progress Summary)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Total Capaian Proyek', 130, 62);
      doc.setFontSize(15);
      doc.setTextColor(79, 70, 229);
      doc.text(`${project.PERCENTAGE}%`, 130, 69);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const completedCount = project.STAGES.filter((s) => s.STATUS === 'SELESAI').length;
      doc.text(`(${completedCount} dari ${project.STAGES.length} Tahap Selesai)`, 130, 74);
      doc.text(`Jurnal Siswa: ${dailyLogsCount} Log Refleksi`, 130, 79);
      doc.text(`Status: ${project.PERCENTAGE >= 75 ? 'Tercapai Sangat Baik' : 'Sedang Dalam Progres'}`, 130, 84);

      // 4. Section: Daftar Milestone Siswa dan Status Pencapaian (Ringkas)
      let currentY = 94;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text('DAFTAR MILESTONE SISWA & STATUS PENCAPAIAN (RINGKAS)', 14, currentY);

      const allMilestonesTableData = project.STAGES.map((s, idx) => {
        const statusLabel =
          s.STATUS === 'SELESAI'
            ? 'SELESAI'
            : s.STATUS === 'SEDANG_BERJALAN'
            ? 'SEDANG BERJALAN'
            : 'BELUM MULAI';
        const dateDisplay =
          s.STATUS === 'SELESAI'
            ? (s.COMPLETED_AT || 'Tercapai')
            : (s.TARGET_DATE || project.DEADLINE || '-');
        return [
          String(idx + 1),
          s.NAME,
          s.DESCRIPTION || project.DESKRIPSI || '-',
          dateDisplay,
          statusLabel,
        ];
      });

      autoTable(doc, {
        startY: currentY + 3,
        head: [['No', 'Judul Milestone', 'Deskripsi Proyek / Capaian Siswa', 'Target / Selesai', 'Status Pencapaian']],
        body: allMilestonesTableData,
        theme: 'striped',
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left',
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 50, fontStyle: 'bold' },
          2: { cellWidth: 72 },
          3: { cellWidth: 26, halign: 'center' },
          4: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const raw = String(data.cell.raw);
            if (raw.includes('SELESAI')) {
              data.cell.styles.textColor = [16, 185, 129];
            } else if (raw.includes('SEDANG BERJALAN')) {
              data.cell.styles.textColor = [217, 119, 6];
            } else {
              data.cell.styles.textColor = [100, 116, 139];
            }
          }
        },
        margin: { left: 14, right: 14 },
      });

      // 5. Signatures Footer
      const tableFinalY = (doc as any).lastAutoTable?.finalY || currentY + 40;
      const signY = Math.min(245, Math.max(tableFinalY + 12, 220));

      const todayStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      // Left signer (Kepala Sekolah)
      doc.text('Mengetahui,', 25, signY);
      doc.text('Kepala Sekolah SD Negeri Tangerang 6', 25, signY + 5);
      doc.setFont('helvetica', 'bold');
      doc.text('H. SUHANDA, M.Pd.', 25, signY + 24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('NIP. 19680512 199303 1 005', 25, signY + 28);

      // Right signer (Guru / Fasilitator P5)
      doc.setFontSize(8.5);
      doc.text(`Kota Tangerang, ${todayStr}`, 135, signY);
      doc.text('Fasilitator / Koordinator P5,', 135, signY + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(account.NAMA || 'Guru Kelas', 135, signY + 24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Wali / Guru ${selectedKelas}`, 135, signY + 28);

      // Bottom Running Footer Note
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Dokumen resmi Sistem Informasi Akademik SDN Tangerang 6 • Dicetak otomatis pada ${new Date().toLocaleString('id-ID')} WIB`,
        105,
        287,
        { align: 'center' }
      );

      // Save PDF
      const sanitizedClass = selectedKelas.replace(/\s+/g, '_');
      const filename = `Ringkasan_P5_${sanitizedClass}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      playFeedback('success');
      setToastMessage('Dokumen PDF ringkasan progres milestone P5 berhasil diunduh!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Error generating P5 summary PDF:', err);
      setToastMessage('Gagal mengunduh PDF ringkasan proyek.');
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const getStatusBadge = (status: P5ProjectStage['STATUS']) => {
    switch (status) {
      case 'SELESAI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" /> Selesai
          </span>
        );
      case 'SEDANG_BERJALAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
            <Clock size={12} className="text-blue-600" /> Sedang Berjalan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
            <Circle size={12} className="text-slate-400" /> Belum Mulai
          </span>
        );
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-6 relative overflow-hidden ${className}`}>
      {/* Background Accent Decorative Pattern */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-100/40 via-purple-100/30 to-pink-100/20 rounded-full blur-2xl -z-0 pointer-events-none" />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-4 right-4 z-20 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 border border-slate-700"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 text-white uppercase tracking-wider shadow-xs flex items-center gap-1">
              <Compass size={12} /> P5 Kurikulum Merdeka
            </span>
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Tema: {project.TEMA}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
            {project.JUDUL}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {project.DESKRIPSI}
          </p>
        </div>

        {/* Actions Header container */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Download P5 Summary PDF Button */}
          <button
            id="btn-unduh-ringkasan-p5"
            type="button"
            disabled={isDownloadingPdf}
            onClick={handleDownloadP5SummaryPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-2xs border border-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50"
            title="Unduh ringkasan dokumen PDF progres milestone siswa yang sudah dicapai"
          >
            {isDownloadingPdf ? (
              <Loader2 size={13} className="animate-spin text-white" />
            ) : (
              <Download size={13} className="text-white" />
            )}
            <span>{isDownloadingPdf ? 'Mengunduh...' : 'Unduh Ringkasan'}</span>
          </button>

          {/* Add Milestone Target Button for Teachers/Kepsek */}
          {(isGuru || isKepsek) && (
            <button
              id="btn-tambah-milestone-p5"
              type="button"
              onClick={handleOpenAddMilestone}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-2xs border border-indigo-600 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all cursor-pointer select-none active:scale-95"
              title="Tambah tahapan atau milestone target baru secara manual untuk siswa"
            >
              <Plus size={13} className="stroke-[3]" />
              <span>Tambah Milestone</span>
            </button>
          )}

          {/* Daily Activity Log Button */}
          <button
            type="button"
            onClick={() => setShowDailyLogModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-2xs border border-purple-600 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white transition-all cursor-pointer select-none"
            title="Buka jurnal refleksi dan log kegiatan harian proyek P5"
          >
            <BookOpen size={13} />
            <span>Jurnal Log Harian P5</span>
            {dailyLogsCount > 0 && (
              <span className="bg-white/25 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                {dailyLogsCount}
              </span>
            )}
          </button>

          {/* P5 AI Mentor Bot Trigger Button */}
          <button
            type="button"
            onClick={() => setShowP5Bot(!showP5Bot)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-2xs border transition-all cursor-pointer select-none ${
              showP5Bot
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            }`}
          >
            <Sparkles size={13} className={showP5Bot ? 'text-white' : 'text-indigo-600'} />
            <span>AI Mentor P5</span>
          </button>

          {/* Class Switcher for Teachers/Kepsek */}
          {(isGuru || isKepsek) && (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <Layers size={14} className="text-slate-500 ml-2" />
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none pr-3 cursor-pointer py-1"
              >
                {STANDARD_CLASSES.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* P5 AI Mentor Bot Section */}
      <AnimatePresence>
        {showP5Bot && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 mb-6 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-indigo-100/60 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Sparkles size={12} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-indigo-950">AI Mentor Karakter & Ide P5</h4>
                  <p className="text-[10px] text-indigo-700/80">Konsultan cerdas proyek Kurikulum Merdeka</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setP5Messages([
                  {
                    sender: 'bot',
                    text: `Halo! Saya **AI Mentor Karakter & Ide Kreatif P5**. 🧭✨\n\nSaya siap membantu Bapak/Ibu Guru merancang proyek P5 tingkat sekolah dasar.\n\nSilakan pilih salah satu pertanyaan cepat di bawah atau ketikkan pertanyaan Anda sendiri!`,
                  }
                ])}
                className="p-1 rounded-md hover:bg-indigo-100 text-indigo-600 transition"
                title="Bersihkan Percakapan"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Chat History Panel */}
            <div className="max-h-[200px] overflow-y-auto mb-3 pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-indigo-200">
              {p5Messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-3xs'
                    }`}
                  >
                    <div className="whitespace-pre-line">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}

              {p5Loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-xl p-3 text-xs text-indigo-600 flex items-center gap-2 shadow-3xs">
                    <Loader2 size={12} className="animate-spin" />
                    <span>AI Mentor sedang merumuskan ide...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions Pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => handleSendP5Message("Berikan saya ide kegiatan proyek kreatif P5 tema Gaya Hidup Berkelanjutan")}
                className="px-2.5 py-1 rounded-lg bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 text-[10px] text-indigo-950 font-bold shadow-2xs transition cursor-pointer"
              >
                💡 Ide Gaya Hidup Berkelanjutan
              </button>
              <button
                type="button"
                onClick={() => handleSendP5Message("Bagaimana rancangan rubrik penilaian karakter gotong royong dan kreatif (BB, MB, BSH, SAB)?")}
                className="px-2.5 py-1 rounded-lg bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 text-[10px] text-indigo-950 font-bold shadow-2xs transition cursor-pointer"
              >
                📐 Rubrik Capaian Karakter
              </button>
              <button
                type="button"
                onClick={() => handleSendP5Message("Beri contoh tahapan alur proyek P5 untuk tema Kewirausahaan tingkat SD")}
                className="px-2.5 py-1 rounded-lg bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 text-[10px] text-indigo-950 font-bold shadow-2xs transition cursor-pointer"
              >
                📑 Alur Tema Kewirausahaan
              </button>
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendP5Message();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={p5Input}
                onChange={(e) => setP5Input(e.target.value)}
                placeholder="Tanyakan ide proyek, indikator dimensi, atau draf modul P5..."
                disabled={p5Loading}
                className="flex-1 bg-white border border-indigo-100 text-xs px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-indigo-950 placeholder:text-indigo-400"
              />
              <button
                type="submit"
                disabled={p5Loading || !p5Input.trim()}
                className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send size={13} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EARLY WARNING DEADLINE NOTIFICATION BANNER (< 3 HARI) */}
      <AnimatePresence>
        {deadlineInfo.isUrgent && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            className={`relative z-10 mb-6 p-4 sm:p-5 rounded-2xl border shadow-lg overflow-hidden transition-all ${
              deadlineInfo.isOverdue
                ? 'bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 text-white border-rose-500/70 shadow-rose-900/40'
                : 'bg-gradient-to-r from-amber-950 via-orange-950 to-amber-900 text-white border-amber-500/80 shadow-amber-900/40'
            }`}
          >
            {/* Ambient Alert Glow Accent */}
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`p-3 rounded-2xl shrink-0 flex items-center justify-center shadow-md ${
                  deadlineInfo.isOverdue
                    ? 'bg-rose-600 text-white ring-4 ring-rose-400/30 animate-bounce'
                    : 'bg-gradient-to-br from-amber-500 to-orange-500 text-white ring-4 ring-amber-400/30 animate-bounce'
                }`}>
                  <AlertTriangle size={24} className="stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                      deadlineInfo.isOverdue
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-400 text-slate-950 font-black'
                    }`}>
                      <BellRing size={12} className="animate-spin" style={{ animationDuration: '4s' }} />
                      {deadlineInfo.isOverdue
                        ? 'TENGGAT WAKTU TERLAMPAUI!'
                        : `PERINGATAN DINI: TENGGAT < 3 HARI (${deadlineInfo.daysRemaining === 0 ? 'HARI INI' : `${deadlineInfo.daysRemaining} HARI LAGI`})`}
                    </span>
                    <span className="text-[11px] font-mono text-amber-200 font-bold">
                      Tenggat: {deadlineInfo.formattedDate}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white leading-snug">
                    {deadlineInfo.isOverdue
                      ? `Batas Waktu Pengumpulan Proyek Telah Lewat`
                      : `Percepatan Kedisiplinan Proyek: Waktu Tersisa ${deadlineInfo.daysRemaining === 0 ? 'Kurang dari 24 Jam' : `${deadlineInfo.daysRemaining} Hari`}`}
                  </h4>
                  <p className="text-xs text-amber-100/90 mt-1 max-w-2xl leading-relaxed">
                    Tenggat penyelesaian tahapan proyek P5 <strong className="text-white underline decoration-amber-400">{project.JUDUL}</strong> semakin dekat. 
                    Tingkatkan kedisiplinan belajar siswa: pastikan semua tim mengunggah dokumentasi aksi dan menyelesaikan <strong>Jurnal Refleksi Harian</strong> sebelum batas waktu!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleBroadcastDisciplineReminder}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
                  title="Kirimkan notifikasi dorongan kedisiplinan kepada seluruh siswa"
                >
                  <Send size={13} className="text-slate-950" />
                  <span>Siarkan Nudge Siswa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDailyLogModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition active:scale-95 cursor-pointer"
                  title="Periksa kepatuhan pengisian jurnal log refleksi harian siswa"
                >
                  <BookOpen size={13} />
                  <span>Cek Jurnal Siswa</span>
                </button>

                {isGuru && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDeadlineInput(projectDeadline);
                      setShowDeadlineModal(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-amber-200 hover:text-white font-bold text-xs border border-amber-500/40 transition active:scale-95 cursor-pointer"
                    title="Atur ulang tenggat waktu proyek ini"
                  >
                    <Calendar size={13} />
                    <span>Ubah Tenggat</span>
                  </button>
                )}
              </div>
            </div>

            {/* Visual Discipline & Time Countdown Bar */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-amber-200/90 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>
                  Status Kedisiplinan: <strong className="text-white">{project.PERCENTAGE >= 75 ? 'Tinggi (On Track)' : 'Perlu Intervensi & Bimbingan Intensif'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded bg-black/30 border border-white/10 text-white font-bold">
                  {project.STAGES.filter((s) => s.STATUS === 'SELESAI').length}/{project.STAGES.length} Tahap Beres
                </span>
                <span className="px-2 py-0.5 rounded bg-black/30 border border-white/10 text-amber-300 font-bold">
                  {dailyLogsCount} Jurnal Terkumpul
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overall Progress Section */}
      <div className="relative z-10 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl mb-6 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
              <Award size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Progres Penyelesaian Proyek</span>
                {deadlineInfo.isUrgent ? (
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-rose-500/30 text-rose-300 border border-rose-400/40 animate-pulse flex items-center gap-1">
                    <AlertTriangle size={10} />
                    {deadlineInfo.isOverdue ? 'Lewat Tenggat' : `< 3 Hari (${deadlineInfo.daysRemaining} hari)`}
                  </span>
                ) : (
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Tenggat: {deadlineInfo.formattedDate}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                {isSiswa ? `Kelas ${account.KELAS}` : selectedKelas} • Terakhir diubah {new Date(project.UPDATED_AT).toLocaleDateString('id-ID')}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-amber-400 leading-none">{project.PERCENTAGE}%</div>
            <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mt-0.5">Capaian Proyek</div>
          </div>
        </div>

        {/* Animated Framer-Motion Progress Bar */}
        <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-indigo-400 shadow-sm"
            initial={{ width: 0 }}
            animate={{ width: `${project.PERCENTAGE}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>

        {/* Dimension Badges */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400">Target Dimensi P5:</span>
          {project.DIMENSI.map((dim, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/15 text-slate-200 border border-white/10"
            >
              ✨ {dim}
            </span>
          ))}
        </div>
      </div>

      {/* Project Stages Step-by-Step Tracker */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={14} className="text-indigo-600" />
            Tahapan Alur Proyek P5 ({project.STAGES.filter((s) => s.STATUS === 'SELESAI').length}/{project.STAGES.length} Tahap Selesai)
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            {(isGuru || isKepsek) && (
              <button
                type="button"
                onClick={handleOpenAddMilestone}
                className="text-[10px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-3xs"
                title="Tambah milestone target baru untuk siswa secara manual"
              >
                <Plus size={11} className="stroke-[3]" />
                <span>+ Tambah Milestone Baru</span>
              </button>
            )}
            {isGuru && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                <Edit3 size={11} /> Klik status untuk memperbarui
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {project.STAGES.map((stage, index) => {
            const isCompleted = stage.STATUS === 'SELESAI';
            const isInProgress = stage.STATUS === 'SEDANG_BERJALAN';

            return (
              <motion.div
                key={stage.ID}
                whileHover={{ y: -2 }}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300'
                    : isInProgress
                    ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300 ring-2 ring-blue-400/20'
                    : 'bg-slate-50/60 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      Langkah {index + 1}
                    </span>
                    {getStatusBadge(stage.STATUS)}
                  </div>

                  <h5 className="text-xs font-extrabold text-slate-900 mb-1 leading-snug">
                    {stage.NAME}
                  </h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    {stage.DESCRIPTION}
                  </p>

                  {/* Early Warning Badge on Stage if In Progress and Urgent */}
                  {isInProgress && deadlineInfo.isUrgent && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                        <AlertTriangle size={11} className="text-amber-600" />
                        Tenggat &lt; 3 Hari ({deadlineInfo.daysRemaining <= 0 ? 'Hari Ini!' : `${deadlineInfo.daysRemaining} hari tersisa`})
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Updater for Teacher or Completion Date for Student */}
                <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between mt-auto gap-2">
                  <div className="text-[10px] text-slate-400 font-medium truncate">
                    {stage.COMPLETED_AT ? (
                      <span className="text-emerald-700 font-bold">Selesai: {stage.COMPLETED_AT}</span>
                    ) : stage.TARGET_DATE ? (
                      <span className="text-indigo-700 font-bold">Target: {stage.TARGET_DATE}</span>
                    ) : (
                      <span className="italic">{isInProgress ? 'Dalam Pengerjaan' : 'Tahap Berikutnya'}</span>
                    )}
                  </div>

                  {/* Teacher Interactive Status Controls & Delete Action */}
                  {isGuru ? (
                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                      <select
                        value={stage.STATUS}
                        onChange={(e) =>
                          handleStageStatusChange(
                            stage.ID,
                            e.target.value as 'BELUM_MULAI' | 'SEDANG_BERJALAN' | 'SELESAI'
                          )
                        }
                        className="bg-white border border-slate-300 text-[11px] font-bold rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs"
                      >
                        <option value="BELUM_MULAI">⭕ Belum Mulai</option>
                        <option value="SEDANG_BERJALAN">⏳ Sedang Berjalan</option>
                        <option value="SELESAI">✅ Selesai</option>
                      </select>

                      {project.STAGES.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMilestone(stage.ID, stage.NAME)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title={`Hapus milestone ${stage.NAME}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    !stage.COMPLETED_AT && (
                      <span className="text-[10px] text-slate-400 font-medium italic">
                        {isInProgress ? 'Dalam Pengerjaan Kelas' : 'Tahap Berikutnya'}
                      </span>
                    )
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* P5 Project Deadline Settings Modal for Teachers */}
      <AnimatePresence>
        {showDeadlineModal && (
          <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-800"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Ubah Batas Tenggat Waktu Proyek P5</h3>
                    <p className="text-[11px] text-slate-500">{selectedKelas} • {project.JUDUL}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeadlineModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Pilih Tanggal Batas Tenggat (Deadline):
                  </label>
                  <input
                    type="date"
                    value={customDeadlineInput}
                    onChange={(e) => setCustomDeadlineInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                  />
                </div>

                <div>
                  <span className="font-bold text-slate-600 text-[11px] block mb-1.5">
                    Pilihan Preset Cepat (Uji Notifikasi):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomDeadlineInput('2026-11-07')}
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left text-[11px] font-bold text-amber-900 transition flex items-center justify-between cursor-pointer"
                    >
                      <span>⚡ 2 Hari Lagi (&lt; 3 Hari)</span>
                      <span className="text-[9px] font-mono text-amber-700">07 Nov</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomDeadlineInput('2026-11-06')}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-left text-[11px] font-bold text-rose-900 transition flex items-center justify-between cursor-pointer"
                    >
                      <span>🔥 Besok (1 Hari)</span>
                      <span className="text-[9px] font-mono text-rose-700">06 Nov</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomDeadlineInput('2026-11-05')}
                      className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 border border-rose-300 text-left text-[11px] font-bold text-rose-950 transition flex items-center justify-between cursor-pointer"
                    >
                      <span>🚨 Hari Ini (Urgent)</span>
                      <span className="text-[9px] font-mono text-rose-800">05 Nov</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomDeadlineInput('2026-11-12')}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left text-[11px] font-bold text-emerald-900 transition flex items-center justify-between cursor-pointer"
                    >
                      <span>🌱 1 Minggu Lagi</span>
                      <span className="text-[9px] font-mono text-emerald-700">12 Nov</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                  💡 <strong>Catatan Kedisiplinan:</strong> Sistem peringatan dini otomatis aktif saat tenggat waktu tersisa <strong>kurang dari 3 hari</strong> (&lt; 3 hari), membunyikan chime audio dan menampilkan banner prioritas percepatan aksi siswa.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeadlineModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateDeadline(customDeadlineInput)}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} />
                  <span>Simpan Tenggat Waktu</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* P5 Add Milestone Target Modal for Teachers */}
      <AnimatePresence>
        {showAddMilestoneModal && (
          <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 text-slate-800 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <ListPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Tambah Milestone Target P5 Baru</h3>
                    <p className="text-[11px] text-slate-500">{selectedKelas} • {project.JUDUL}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMilestoneModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateMilestone} className="space-y-3.5 text-xs">
                <div>
                  <label htmlFor="input-judul-milestone" className="font-bold text-slate-700 block mb-1">
                    Judul Milestone: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-judul-milestone"
                    type="text"
                    required
                    value={newMilestoneName}
                    onChange={(e) => setNewMilestoneName(e.target.value)}
                    placeholder="Contoh: Tahap 5: Gelar Karya & Pameran Terbuka"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label htmlFor="input-deskripsi-proyek-milestone" className="font-bold text-slate-700 block mb-1">
                    Deskripsi Proyek:
                  </label>
                  <textarea
                    id="input-deskripsi-proyek-milestone"
                    rows={2}
                    value={newMilestoneDesc}
                    onChange={(e) => setNewMilestoneDesc(e.target.value)}
                    placeholder="Deskripsi proyek atau target capaian siswa..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="input-target-tanggal-milestone" className="font-bold text-slate-700 block mb-1">
                      Target Tanggal Penyelesaian:
                    </label>
                    <input
                      id="input-target-tanggal-milestone"
                      type="date"
                      value={newMilestoneTargetDate}
                      onChange={(e) => setNewMilestoneTargetDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>

                  <div>
                    <label htmlFor="select-status-milestone" className="font-bold text-slate-700 block mb-1">
                      Status Awal Milestone:
                    </label>
                    <select
                      id="select-status-milestone"
                      value={newMilestoneStatus}
                      onChange={(e) => setNewMilestoneStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                      <option value="BELUM_MULAI">⭕ Belum Mulai</option>
                      <option value="SEDANG_BERJALAN">⏳ Sedang Berjalan</option>
                      <option value="SELESAI">✅ Selesai</option>
                    </select>
                  </div>
                </div>

                {/* Preset Suggestions for Kurikulum Merdeka */}
                <div>
                  <span className="font-bold text-slate-600 text-[11px] block mb-1.5">
                    💡 Inspirasi Cepat Tahapan P5:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { name: `Tahap ${project.STAGES.length + 1}: Gelar Karya & Pameran Terbuka`, desc: 'Siswa memamerkan hasil inovasi produk dan portofolio proyek kepada warga sekolah.' },
                      { name: `Tahap ${project.STAGES.length + 1}: Pembuatan Infografis & Video Kampanye`, desc: 'Kelompok merancang media kampanye edukatif bertema peduli lingkungan.' },
                      { name: `Tahap ${project.STAGES.length + 1}: Asesmen Sumatif & Refleksi Diri`, desc: 'Evaluasi ketercapaian dimensi profil pelajar pancasila dan penilaian antarteman.' },
                      { name: `Tahap ${project.STAGES.length + 1}: Aksi Nyata Berkelanjutan di Rumah`, desc: 'Penerapan kebiasaan baik dan pemilahan sampah organik di lingkungan keluarga.' },
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setNewMilestoneName(preset.name);
                          setNewMilestoneDesc(preset.desc);
                        }}
                        className="p-2 rounded-xl bg-indigo-50/60 hover:bg-indigo-100/80 border border-indigo-100 text-left transition cursor-pointer"
                      >
                        <div className="font-bold text-indigo-950 text-[11px] truncate">{preset.name}</div>
                        <div className="text-[10px] text-indigo-700/70 truncate">{preset.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                  📌 <strong>Catatan:</strong> Milestone yang ditambahkan akan langsung dihitung ke dalam kalkulasi progres persentase keseluruhan proyek P5 siswa kelas {selectedKelas}.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddMilestoneModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Simpan Milestone Target</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* P5 Daily Activity Log & Teacher Feedback Modal */}
      <P5DailyLogModal
        isOpen={showDailyLogModal}
        onClose={() => setShowDailyLogModal(false)}
        account={account}
        initialKelas={selectedKelas}
        project={project}
      />
    </div>
  );
};
