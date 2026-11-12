import React from 'react';
import { FileText, Printer, CheckCircle2, AlertCircle, Award, Sparkles, BookOpen, User } from 'lucide-react';
const loadPdfService = () => import('../../services/pdfService').then((m) => m.pdfService);

export interface StudentAggregatedGradeItem {
  siswaId: string;
  nis: string;
  siswaNama: string;
  kelas: string;
  tugasCount: number;
  nilaiTugas: number;
  kuisCount: number;
  nilaiKuis: number;
  presensiPct: number;
  nilaiAkhir: number;
  predikat: 'A' | 'B' | 'C' | 'D';
  kkmStatus: 'TUNTAS' | 'BELUM TUNTAS';
  kkmThreshold: number;
}

export const GRADING_PERIOD_OPTIONS = [
  'Semester Ganjil TA 2026/2027',
  'Semester Genap TA 2026/2027',
  'Tengah Semester Ganjil (PTS 1)',
  'Tengah Semester Genap (PTS 2)',
  'Akhir Semester Ganjil (PAS 1)',
  'Akhir Semester Genap (PAT 2)',
  'Sumatif Lingkup Materi 1 (SLM-1)',
  'Sumatif Lingkup Materi 2 (SLM-2)',
  'Sumatif Akhir Fase (Kurikulum Merdeka)',
  'Bulan Berjalan (November 2026)',
] as const;

interface StudentAggregatedGradeSummaryTableProps {
  reports: StudentAggregatedGradeItem[];
  targetClass: string;
  guruNama: string;
  guruNip?: string;
  kkmThreshold?: number;
  selectedGradingPeriod?: string;
  onGradingPeriodChange?: (period: string) => void;
  onSelectStudentChart?: (studentId: string) => void;
  onPreviewErapor?: (report: any) => void;
}

export const StudentAggregatedGradeSummaryTable: React.FC<StudentAggregatedGradeSummaryTableProps> = ({
  reports,
  targetClass,
  guruNama,
  guruNip = '19850412 201101 2 003',
  kkmThreshold = 75,
  selectedGradingPeriod: controlledPeriod,
  onGradingPeriodChange,
  onSelectStudentChart,
  onPreviewErapor,
}) => {
  const [internalPeriod, setInternalPeriod] = React.useState<string>('Semester Ganjil TA 2026/2027');
  const activePeriod = controlledPeriod || internalPeriod;

  const handlePeriodChange = (p: string) => {
    setInternalPeriod(p);
    if (onGradingPeriodChange) {
      onGradingPeriodChange(p);
    }
  };

  const totalStudents = reports.length;
  const tuntasCount = reports.filter((r) => r.kkmStatus === 'TUNTAS').length;
  const belumTuntasCount = totalStudents - tuntasCount;
  const avgClassScore = totalStudents > 0
    ? Math.round(reports.reduce((acc, r) => acc + r.nilaiAkhir, 0) / totalStudents)
    : 0;
  const totalTasksAssigned = totalStudents > 0
    ? Math.max(...reports.map((r) => r.tugasCount))
    : 0;

  const handleExportPdf = async () => {
    (await loadPdfService()).generateClassGradebookSummaryPdf(reports, targetClass, guruNama, guruNip, activePeriod);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
      {/* Header bar formatted for PDF export & overview */}
      <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-amber-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 font-bold">
              <Award size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">
                Tabel Rekapitulasi Nilai Agregat Siswa (Format Cetak PDF)
              </h3>
              <p className="text-xs text-slate-500">
                Ringkasan akumulasi seluruh tugas, kuis CBT, rata-rata nilai akhir, dan status ketuntasan KKM ({kkmThreshold})
              </p>
            </div>
          </div>
        </div>

        {/* Grading Period Selector & Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Grading Period Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Periode:</span>
            <select
              value={activePeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              aria-label="Pilih Periode Penilaian untuk Dokumen PDF"
              className="text-xs font-black text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
            >
              {GRADING_PERIOD_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="block text-[9px] text-emerald-600 font-black uppercase">Tuntas KKM</span>
            <span className="text-xs font-black text-emerald-800">{tuntasCount} Siswa</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
            <span className="block text-[9px] text-rose-600 font-black uppercase">Perlu Remedial</span>
            <span className="text-xs font-black text-rose-800">{belumTuntasCount} Siswa</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
            <span className="block text-[9px] text-blue-600 font-black uppercase">Rata Kelas</span>
            <span className="text-xs font-black text-blue-800">{avgClassScore}</span>
          </div>

          <button
            onClick={handleExportPdf}
            title={`Cetak tabel ringkasan agregat nilai siswa periode "${activePeriod}" ke dalam dokumen PDF resmi ber-kop surat`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer ml-1"
          >
            <Printer size={14} className="text-rose-100" />
            <span>Ekspor / Cetak Rekap PDF</span>
          </button>
        </div>
      </div>

      {/* Aggregated Grade Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
              <th className="p-4 w-12 text-center">No</th>
              <th className="p-4">NIS / ID</th>
              <th className="p-4">Nama Siswa</th>
              <th className="p-4 text-center">Total Tugas Terkumpul</th>
              <th className="p-4 text-center">Rata-rata Tugas</th>
              <th className="p-4 text-center">Kuis CBT</th>
              <th className="p-4 text-center">Kehadiran</th>
              <th className="p-4 text-center">Rata-rata Skor (NA)</th>
              <th className="p-4 text-center">Predikat</th>
              <th className="p-4 text-center">Status KKM ({kkmThreshold})</th>
              <th className="p-4 text-center">Aksi Dokumen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-400">
                  Tidak ada catatan nilai siswa untuk kelas ini.
                </td>
              </tr>
            ) : (
              reports.map((report, idx) => {
                const isTuntas = report.kkmStatus === 'TUNTAS';
                return (
                  <tr
                    key={report.siswaId}
                    className={`hover:bg-slate-50/80 transition ${
                      !isTuntas ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="p-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-4 font-mono font-bold text-slate-600">{report.nis}</td>
                    <td className="p-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            isTuntas ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {report.siswaNama.charAt(0)}
                        </div>
                        <span className="font-bold">{report.siswaNama}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                        <BookOpen size={11} className="text-slate-400" />
                        {report.tugasCount} Tugas
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-700">
                      {report.nilaiTugas}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-700">
                      {report.nilaiKuis} <span className="text-[10px] text-slate-400">({report.kuisCount} kuis)</span>
                    </td>
                    <td className="p-4 text-center font-bold text-emerald-600">
                      {report.presensiPct}%
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`text-sm font-black px-2.5 py-1 rounded-lg font-mono ${
                          isTuntas ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {report.nilaiAkhir}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`font-black text-xs px-2.5 py-1 rounded-lg ${
                          report.predikat === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : report.predikat === 'B'
                            ? 'bg-blue-100 text-blue-800'
                            : report.predikat === 'C'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {report.predikat}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-black text-[11px] px-2.5 py-1 rounded-full border ${
                          isTuntas
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isTuntas ? (
                          <>
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            TUNTAS
                          </>
                        ) : (
                          <>
                            <AlertCircle size={12} className="text-rose-600" />
                            BELUM TUNTAS
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => (await loadPdfService()).generateStudentProgressReportPdf(report as any, guruNama)}
                          title="Cetak Laporan Per Siswa Format PDF"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] border border-red-200 transition cursor-pointer"
                        >
                          <FileText size={12} />
                          <span>PDF</span>
                        </button>
                        {onPreviewErapor && (
                          <button
                            type="button"
                            onClick={() => onPreviewErapor(report)}
                            title="Buka Lembar E-Rapor"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] transition cursor-pointer"
                          >
                            <Printer size={12} />
                            <span>E-Rapor</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer statistics and metadata for PDF readiness */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-3">
          <span>
            <strong>Kelas:</strong> {targetClass}
          </span>
          <span>•</span>
          <span>
            <strong>Standar KKM:</strong> {kkmThreshold}
          </span>
          <span>•</span>
          <span>
            <strong>Cakupan Tugas:</strong> {totalTasksAssigned} Tugas Terkumpul
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]">
            Dokumen ini terformat siap ekspor cetak PDF resmi untuk rapat pleno wali murid dan arsip sekolah.
          </span>
        </div>
      </div>
    </div>
  );
};
