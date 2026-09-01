import React, { useState, useEffect } from 'react';
import {
  QrCode, X, Download, RefreshCw, CheckCircle2, AlertCircle,
  FolderArchive, School, User, Layers
} from 'lucide-react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { Account } from '../../types/classroom';

interface BulkQrGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Account[];
  selectedClass: string;
}

export const BulkQrGeneratorModal: React.FC<BulkQrGeneratorModalProps> = ({
  isOpen,
  onClose,
  students,
  selectedClass,
}) => {
  if (!isOpen) return null;

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [currentStudentName, setCurrentStudentName] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalStudents = students.length;

  const startBulkGeneration = async () => {
    if (students.length === 0) return;
    setIsProcessing(true);
    setIsCompleted(false);
    setErrorMsg(null);
    setProgressCount(0);

    const zip = new JSZip();
    const folder = zip.folder(`QR_Siswa_${selectedClass.replace(/\s+/g, '_')}`) || zip;

    try {
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        setCurrentStudentName(student.NAMA);
        setProgressCount(i + 1);

        // 1. Generate QR Payload (compatible with StudentAssignmentQrModal scanner)
        const payload = JSON.stringify({
          app: 'SDN_TANGERANG_6_CLASSROOM',
          type: 'STUDENT_ID_QR',
          studentId: student.ID,
          studentName: student.NAMA,
          studentNis: student.NIP || '-',
          studentKelas: student.KELAS || selectedClass,
          username: student.USERNAME,
          verifiedAt: new Date().toISOString(),
        });

        // 2. Generate QR Code Data URL
        const qrDataUrl = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 1,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });

        // 3. Render High Resolution ID Card Canvas
        const canvas = document.createElement('canvas');
        canvas.width = 650;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 650, 800);

          // Card Outer Border
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(10, 10, 630, 780, 24);
          ctx.stroke();

          // Header Navy Background
          ctx.fillStyle = '#1e3a8a';
          ctx.beginPath();
          ctx.roundRect(10, 10, 630, 120, [24, 24, 0, 0]);
          ctx.fill();

          // Header Text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SD NEGERI TANGERANG 6', 325, 48);

          ctx.font = '13px sans-serif';
          ctx.fillStyle = '#93c5fd';
          ctx.fillText('KARTU IDENTITAS DIGITAL & QR TUGAS SISWA', 325, 78);

          ctx.font = '11px sans-serif';
          ctx.fillStyle = '#bfdbfe';
          ctx.fillText('Tahun Ajaran 2026/2027 • Dinas Pendidikan Kota Tangerang', 325, 102);

          // Student Info Box
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(40, 150, 570, 130, 16);
          ctx.fill();
          ctx.stroke();

          // Student Name
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(student.NAMA, 65, 190);

          // Student Details
          ctx.font = '14px sans-serif';
          ctx.fillStyle = '#475569';
          ctx.fillText(`NIS / NISN   : ${student.NIP || '-'}`, 65, 222);
          ctx.fillText(`Kelas / Rombel: ${student.KELAS || selectedClass}   •   Akun: @${student.USERNAME}`, 65, 252);

          // QR Code Frame
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(165, 300, 320, 320, 16);
          ctx.fill();
          ctx.stroke();

          // Draw QR Image onto Canvas
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = qrDataUrl;
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          ctx.drawImage(img, 180, 315, 290, 290);

          // Badge / Verification Stamp
          ctx.fillStyle = '#065f46';
          ctx.font = 'bold 15px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✓ TERVERIFIKASI RESMI DIGITAL', 325, 655);

          // Instructions
          ctx.fillStyle = '#64748b';
          ctx.font = '12px sans-serif';
          ctx.fillText('Gunakan kartu ini untuk presensi harian & pemindaian status tugas cepat.', 325, 695);
          ctx.fillText(`ID Dokumen: ${student.ID} • Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 325, 725);

          // Footer Strip
          ctx.fillStyle = '#1e3a8a';
          ctx.beginPath();
          ctx.roundRect(10, 755, 630, 35, [0, 0, 24, 24]);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SISTEM INFORMASI AKADEMIK SDN TANGERANG 6', 325, 777);

          // Convert Canvas to PNG Base64 and add to ZIP
          const dataUrl = canvas.toDataURL('image/png');
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
          
          const cleanName = student.NAMA.replace(/[^a-zA-Z0-9]/g, '_');
          const fileName = `QR_${(student.KELAS || selectedClass).replace(/\s+/g, '_')}_${student.NIP || student.ID}_${cleanName}.png`;
          folder.file(fileName, base64Data, { base64: true });
        }
      }

      // Generate ZIP archive blob
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const url = URL.createObjectURL(zipBlob);
      setDownloadUrl(url);
      setIsCompleted(true);

      // Trigger automatic download
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_Kartu_Siswa_${selectedClass.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
    } catch (err: any) {
      console.error('Failed to generate bulk QR ZIP:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses pembuatan QR ZIP');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Auto-trigger generation upon open if not yet completed
    if (isOpen && !isCompleted && !isProcessing && progressCount === 0) {
      startBulkGeneration();
    }
  }, [isOpen]);

  const percentage = totalStudents > 0 ? Math.round((progressCount / totalStudents) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 text-indigo-200 flex items-center justify-center font-black text-sm border border-indigo-400/30 shadow-xs">
              <FolderArchive size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Bulk QR Generator (ZIP)</h3>
              <p className="text-xs text-slate-300 font-semibold">{selectedClass} • {totalStudents} Siswa</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-center text-slate-800">
          {isProcessing ? (
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-inner animate-pulse">
                <RefreshCw size={24} className="animate-spin" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900">
                  Membuat Kartu QR Fisik Siswa ({progressCount} / {totalStudents})
                </h4>
                <p className="text-xs text-slate-500 truncate max-w-xs mx-auto">
                  Memproses: <strong className="text-blue-700 font-bold">{currentStudentName || 'Menyiapkan...'}</strong>
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-200"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
                  <span>Progres Pembuatan</span>
                  <span>{percentage}%</span>
                </div>
              </div>
            </div>
          ) : isCompleted ? (
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-inner">
                <CheckCircle2 size={30} />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900">
                  Pembuatan Berhasil!
                </h4>
                <p className="text-xs text-slate-500">
                  Semua <strong className="text-slate-800 font-bold">{totalStudents} kartu QR</strong> telah dikemas dalam arsip ZIP siap cetak untuk kartu identitas fisik.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-1 text-left">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                  Format Kartu Identitas:
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed pl-4">
                  Resolusi tinggi (650×800 px) dengan kop resmi SDN Tangerang 6, nama siswa, NIS, kelas, dan payload scanner tugas instan.
                </p>
              </div>

              {downloadUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = `QR_Kartu_Siswa_${selectedClass.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.zip`;
                    link.click();
                  }}
                  className="w-full py-3 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-700/25 transition active:scale-95 cursor-pointer"
                >
                  <Download size={15} /> Unduh Ulang File ZIP
                </button>
              )}
            </div>
          ) : errorMsg ? (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-sm font-bold text-rose-900">Gagal Membuat QR ZIP</h4>
              <p className="text-xs text-slate-500">{errorMsg}</p>
              <button
                type="button"
                onClick={startBulkGeneration}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Coba Lagi
              </button>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium">
            Format: PNG (High DPI) di dalam .ZIP
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
