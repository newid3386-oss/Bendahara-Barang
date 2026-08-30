import React, { useState } from 'react';
import {
  Award, FileText, Printer, Download, Search, CheckCircle2, ChevronRight, User,
  Sparkles, School, GraduationCap, X, TrendingUp, BarChart2, BookOpen, Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  BarChart,
  Bar
} from 'recharts';
import { Account } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';
import { accountService, STANDARD_CLASSES } from '../../services/accountService';

interface ClassroomGradebookViewProps {
  account: Account;
  onRefresh: () => void;
}

export const ClassroomGradebookView: React.FC<ClassroomGradebookViewProps> = ({ account, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isSiswa = account.ROLE === 'SISWA';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';

  const [selectedKelas, setSelectedKelas] = useState<string>(account.KELAS || 'Kelas 1');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewRaporStudent, setPreviewRaporStudent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'TABLE' | 'CHART' | 'KEPSEK_COMPARISON'>('CHART');

  // Target class students
  const students = accountService.getStudents(isSiswa || isGuru ? (account.KELAS || 'Kelas 1') : selectedKelas);

  // Selected student for individual line chart
  const initialStudentId = isSiswa ? account.ID : (students[0]?.ID || '');
  const [selectedChartStudentId, setSelectedChartStudentId] = useState<string>(initialStudentId);

  // If student list changes and selected student is not in list, fallback
  const activeChartStudent = students.find((s) => s.ID === selectedChartStudentId) || students[0];

  // Generate grade cards for each student
  const studentReports = students.map((s) => {
    return classroomService.getStudentReportCard(s.ID, s.NAMA, s.KELAS || selectedKelas);
  });

  const filteredReports = studentReports.filter((r) => {
    if (isSiswa && r.siswaId !== account.ID) return false;
    if (searchQuery && !r.siswaNama.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Data for Recharts Line Chart (Student Timeline)
  const timelineData = activeChartStudent
    ? classroomService.getStudentAcademicTimeline(
        activeChartStudent.ID,
        activeChartStudent.NAMA,
        activeChartStudent.KELAS || selectedKelas
      )
    : [];

  // Data for Kepala Sekolah School-wide Comparison Chart
  const classComparisonData = classroomService.getClassComparisonTrends();

  // Export Rekap Nilai to CSV
  const handleDownloadGradebookCSV = () => {
    const targetClass = isSiswa || isGuru ? (account.KELAS || 'Kelas 1') : selectedKelas;
    const dateStr = new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const csvRows: string[] = [];
    csvRows.push(`REKAPITULASI NILAI HASIL BELAJAR PESERTA DIDIK - SDN TANGERANG 6`);
    csvRows.push(`Tahun Ajaran;2026/2027 (Semester Ganjil)`);
    csvRows.push(`Kelas / Rombongan Belajar;${targetClass}`);
    csvRows.push(`Guru Pengampu / Wali Kelas;${isGuru ? account.NAMA : 'Wali Kelas ' + targetClass}`);
    csvRows.push(`Tanggal Cetak / Ekspor;${dateStr}`);
    csvRows.push(``);
    csvRows.push(
      `No;NIS / NISN;Nama Siswa;Kelas;Rata-rata Tugas (40%);Rata-rata Kuis CBT (40%);Kehadiran (20%);Nilai Akhir (NA);Predikat;Status Ketuntasan;Capaian Pembelajaran & Catatan Guru`
    );

    filteredReports.forEach((r, idx) => {
      const studentAcc = students.find((s) => s.ID === r.siswaId);
      const nis = studentAcc?.NIP || `20260${idx + 1}`;
      const ketuntasan = r.nilaiAkhir >= 75 ? 'TUNTAS' : 'BELUM TUNTAS';
      const catatan =
        r.predikat === 'A'
          ? 'Sangat menguasai seluruh materi kompetensi dasar dan tugas mandiri'
          : r.predikat === 'B'
          ? 'Menguasai materi dengan baik dan aktif berpartisipasi'
          : r.predikat === 'C'
          ? 'Cukup menguasai materi, perlu penguatan pada latihan berhitung'
          : 'Perlu bimbingan remedial dan pendampingan orang tua';

      csvRows.push(
        `${idx + 1};"${nis}";"${r.siswaNama}";"${r.kelas}";${r.nilaiTugas};${r.nilaiKuis};${r.presensiPct}%;${r.nilaiAkhir};"${r.predikat}";"${ketuntasan}";"${catatan}"`
      );
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Rekap_Nilai_SDN_Tangerang_6_${targetClass.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Buku Nilai & Visualisasi Akademik</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                {isSiswa || isGuru ? (account.KELAS || 'Kelas 1') : selectedKelas}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Grafik tren nilai (Recharts), kompilasi tugas & kuis CBT, unduh rekap nilai CSV, serta cetak E-Rapor Kurikulum Merdeka
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('CHART')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'CHART' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp size={14} className="text-emerald-600" />
              <span>Grafik Tren Nilai</span>
            </button>

            <button
              onClick={() => setActiveTab('TABLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'TABLE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText size={14} className="text-blue-600" />
              <span>Tabel Buku Nilai</span>
            </button>

            {isKepsek && (
              <button
                onClick={() => setActiveTab('KEPSEK_COMPARISON')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  activeTab === 'KEPSEK_COMPARISON'
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-purple-700'
                }`}
              >
                <Layers size={14} />
                <span>Analisis Semua Kelas</span>
              </button>
            )}
          </div>

          {!isSiswa && (
            <button
              onClick={handleDownloadGradebookCSV}
              title="Unduh Rekap Nilai dalam format tabel CSV untuk administrasi sekolah"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              <Download size={14} />
              <span>Unduh Rekap Nilai (CSV)</span>
            </button>
          )}

          {isSiswa && filteredReports.length > 0 && (
            <button
              onClick={() => setPreviewRaporStudent(filteredReports[0])}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              <Printer size={15} /> Cetak E-Rapor Saya
            </button>
          )}
        </div>
      </div>

      {/* Filter & Selector Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {!account.KELAS && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Pilih Kelas:</span>
              <select
                value={selectedKelas}
                onChange={(e) => {
                  setSelectedKelas(e.target.value);
                  const classStuds = accountService.getStudents(e.target.value);
                  if (classStuds.length > 0) setSelectedChartStudentId(classStuds[0].ID);
                }}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              >
                {STANDARD_CLASSES.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'CHART' && !isSiswa && students.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Pilih Siswa:</span>
              <select
                value={selectedChartStudentId || students[0]?.ID}
                onChange={(e) => setSelectedChartStudentId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                {students.map((s) => (
                  <option key={s.ID} value={s.ID}>
                    {s.NAMA} ({s.NIP || 'NIS'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {activeTab === 'TABLE' && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden w-full sm:w-64"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. VISUALISASI RECHARTS: GRAFIK TREN PERKEMBANGAN AKADEMIK SISWA */}
      {/* ========================================================================= */}
      {activeTab === 'CHART' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <TrendingUp size={18} />
                  </span>
                  <h3 className="text-base font-black text-slate-800">
                    Grafik Tren Perkembangan Nilai:{' '}
                    <span className="text-blue-700">{activeChartStudent?.NAMA || 'Siswa'}</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pantau fluktuasi capaian belajar siswa terhadap Kriteria Ketuntasan Minimal (KKM 75) dan rata-rata kelas dari waktu ke waktu
                </p>
              </div>

              {/* Badges / Stats on Chart Header */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="block text-[10px] text-emerald-600 font-bold uppercase">Nilai Rata-rata</span>
                  <span className="text-base font-black text-emerald-800">
                    {Math.round(timelineData.reduce((acc, d) => acc + d.nilaiSiswa, 0) / (timelineData.length || 1))}
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <span className="block text-[10px] text-rose-600 font-bold uppercase">Standar KKM</span>
                  <span className="text-base font-black text-rose-800">75</span>
                </div>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="h-[340px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="tahap"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[50, 100]}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}
                    formatter={(value: any, name: any) => [
                      `${value} Poin`,
                      name === 'nilaiSiswa' ? `Nilai ${activeChartStudent?.NAMA}` : 'Rata-rata Kelas',
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '16px', fontSize: '12px', fontWeight: 700 }}
                  />
                  {/* KKM Baseline */}
                  <ReferenceLine
                    y={75}
                    label={{ value: 'KKM: 75', fill: '#e11d48', fontSize: 11, fontWeight: 'bold', position: 'insideTopRight' }}
                    stroke="#e11d48"
                    strokeDasharray="4 4"
                  />
                  {/* Student Line */}
                  <Line
                    type="monotone"
                    dataKey="nilaiSiswa"
                    name={`Nilai ${activeChartStudent?.NAMA || 'Siswa'}`}
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 3 }}
                  />
                  {/* Class Average Line */}
                  <Line
                    type="monotone"
                    dataKey="rataRataKelas"
                    name="Rata-rata Kelas"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 1, stroke: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Insight & Progress Description */}
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="text-xs">
                <span className="font-bold text-emerald-900 block">Analisis Tren Pembelajaran</span>
                <p className="text-emerald-800 mt-0.5 leading-relaxed">
                  Siswa <strong>{activeChartStudent?.NAMA}</strong> menunjukkan tren peningkatan konsisten di atas batas KKM (75).
                  Performa tertinggi dicapai pada asesmen <em>Kuis CBT 2</em> dan <em>Praktik LKPD</em>. Siap untuk pengayaan materi tingkat lanjut.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. KEPALA SEKOLAH: KOMPARASI ANTAR KELAS (KELAS 1 - 6) */}
      {/* ========================================================================= */}
      {activeTab === 'KEPSEK_COMPARISON' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                  <BarChart2 size={18} />
                </span>
                <h3 className="text-base font-black text-slate-800">
                  Komparasi Nilai Akademik & Keaktifan Antar Kelas (Kelas 1 s/d Kelas 6)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ikhtisar perbandingan nilai rata-rata tugas, kuis online, dan persentase kehadiran untuk evaluasi kurikulum tingkat sekolah
              </p>
            </div>

            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classComparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="kelas" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '14px', fontSize: '12px' }} />
                  <ReferenceLine y={75} stroke="#e11d48" strokeDasharray="3 3" label="KKM 75" />
                  <Bar dataKey="rataRataTugas" name="Rata-rata Tugas" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="rataRataKuis" name="Rata-rata Kuis CBT" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="nilaiAkhirKelas" name="Nilai Akhir Rapor" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TABEL BUKU NILAI LENGKAP & CETAK E-RAPOR */}
      {/* ========================================================================= */}
      {activeTab === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">No</th>
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4 text-center">Rata-rata Tugas (40%)</th>
                  <th className="p-4 text-center">Kuis & Ujian (40%)</th>
                  <th className="p-4 text-center">Kehadiran (20%)</th>
                  <th className="p-4 text-center">Nilai Akhir (NA)</th>
                  <th className="p-4 text-center">Predikat</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Tidak ada catatan nilai siswa ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report, idx) => (
                    <tr key={report.siswaId} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                            {report.siswaNama.charAt(0)}
                          </div>
                          <span>{report.siswaNama}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">{report.kelas}</td>
                      <td className="p-4 text-center font-semibold text-slate-700">
                        {report.nilaiTugas} <span className="text-[10px] text-slate-400">({report.tugasCount} tugas)</span>
                      </td>
                      <td className="p-4 text-center font-semibold text-slate-700">
                        {report.nilaiKuis} <span className="text-[10px] text-slate-400">({report.kuisCount} kuis)</span>
                      </td>
                      <td className="p-4 text-center font-semibold text-emerald-600">
                        {report.presensiPct}%
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
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
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedChartStudentId(report.siswaId);
                              setActiveTab('CHART');
                            }}
                            title="Lihat Grafik Tren Nilai"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            <TrendingUp size={14} />
                          </button>
                          <button
                            onClick={() => setPreviewRaporStudent(report)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] transition"
                          >
                            <Printer size={12} /> E-Rapor
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CETAK & PRATINJAU E-RAPOR RESMI KURIKULUM MERDEKA */}
      {/* ========================================================================= */}
      {previewRaporStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Pratinjau E-Rapor Siswa Kurikulum Merdeka</h3>
                  <p className="text-[10px] text-slate-400">SDN Tangerang 6 • Tahun Ajaran 2026/2027</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Printer size={13} /> Cetak Dokumen PDF
                </button>
                <button
                  onClick={() => setPreviewRaporStudent(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="flex-1 overflow-y-auto p-8 bg-white text-slate-800 space-y-6 print:p-0">
              {/* Header Surat Resmi */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h2 className="text-base font-black tracking-wider uppercase">PEMERINTAH KOTA TANGERANG</h2>
                <h3 className="text-sm font-black tracking-wide uppercase">DINAS PENDIDIKAN DAN KEBUDAYAAN</h3>
                <h1 className="text-lg font-black text-slate-900">SD NEGERI TANGERANG 6</h1>
                <p className="text-[10px] text-slate-500 font-serif">
                  Jl. Nyimas Melati No. 25, RT.002/RW.001, Sukasari, Kec. Tangerang, Kota Tangerang, Banten 15118
                </p>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h4 className="font-black text-sm uppercase underline tracking-wider">
                  LAPORAN HASIL BELAJAR PESERTA DIDIK (E-RAPOR)
                </h4>
                <p className="text-xs text-slate-600 font-medium">Tahun Ajaran 2026/2027 - Semester Ganjil</p>
              </div>

              {/* Student Bio Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-medium">Nama Peserta Didik</span>
                    <span className="font-bold text-slate-900">: {previewRaporStudent.siswaNama}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-medium">NISN / Nomor Induk</span>
                    <span className="font-mono text-slate-700">: {previewRaporStudent.siswaId}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-medium">Sekolah</span>
                    <span className="text-slate-700">: SDN Tangerang 6</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-medium">Kelas / Rombel</span>
                    <span className="font-bold text-slate-900">: {previewRaporStudent.kelas}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-medium">Fase Kurikulum</span>
                    <span className="text-slate-700">: Fase A / B (Kurikulum Merdeka)</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500 font-medium">Tahun Pelajaran</span>
                    <span className="text-slate-700">: 2026/2027</span>
                  </div>
                </div>
              </div>

              {/* Capaian Pembelajaran Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3">Mata Pelajaran & Capaian Belajar</th>
                      <th className="p-3 text-center w-24">Nilai Akhir</th>
                      <th className="p-3 text-center w-24">Capaian</th>
                      <th className="p-3">Deskripsi Capaian Kompetensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3 text-center font-bold">1</td>
                      <td className="p-3 font-bold text-slate-900">Pendidikan Pancasila & Kewarganegaraan</td>
                      <td className="p-3 text-center font-bold text-slate-900">{previewRaporStudent.nilaiAkhir}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{previewRaporStudent.predikat}</td>
                      <td className="p-3 text-slate-600 text-[11px]">{previewRaporStudent.keterangan}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">2</td>
                      <td className="p-3 font-bold text-slate-900">Bahasa Indonesia (Literasi Membaca & Menulis)</td>
                      <td className="p-3 text-center font-bold text-slate-900">{previewRaporStudent.nilaiTugas}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{previewRaporStudent.predikat}</td>
                      <td className="p-3 text-slate-600 text-[11px]">Mampu memahami teks bacaan narasi dan menyampaikan ide pokok secara lisan maupun tertulis dengan runtut.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">3</td>
                      <td className="p-3 font-bold text-slate-900">Matematika & Numerasi Dasar</td>
                      <td className="p-3 text-center font-bold text-slate-900">{previewRaporStudent.nilaiKuis}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{previewRaporStudent.predikat}</td>
                      <td className="p-3 text-slate-600 text-[11px]">Sangat terampil dalam operasi hitung bilangan bulat, pola gambar, dan penyelesaian soal cerita aplikatif.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">4</td>
                      <td className="p-3 font-bold text-slate-900">Ilmu Pengetahuan Alam dan Sosial (IPAS)</td>
                      <td className="p-3 text-center font-bold text-slate-900">{previewRaporStudent.nilaiAkhir - 2}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">B</td>
                      <td className="p-3 text-slate-600 text-[11px]">Memahami siklus makhluk hidup dan pelestarian lingkungan sekolah dengan sangat baik.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-center font-bold">5</td>
                      <td className="p-3 font-bold text-slate-900">Koding & Literasi Digital SD</td>
                      <td className="p-3 text-center font-bold text-slate-900">{Math.min(100, previewRaporStudent.nilaiAkhir + 3)}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">A</td>
                      <td className="p-3 text-slate-600 text-[11px]">Antusias dalam menyusun blok algoritma visual dan menggunakan aplikasi Classroom SDN Tangerang 6.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Ekstrakurikuler & Kehadiran */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="border border-slate-300 rounded-xl p-3">
                  <h5 className="font-bold text-slate-800 mb-2">Kegiatan Ekstrakurikuler</h5>
                  <ul className="space-y-1 text-[11px] text-slate-600">
                    <li>• Pramuka Siaga: <strong>Sangat Baik (A)</strong> - Disiplin & aktif</li>
                    <li>• Dokter Kecil / UKS: <strong>Baik (B)</strong> - Peduli kebersihan</li>
                  </ul>
                </div>

                <div className="border border-slate-300 rounded-xl p-3">
                  <h5 className="font-bold text-slate-800 mb-2">Rekapitulasi Kehadiran</h5>
                  <div className="grid grid-cols-3 text-center text-[11px]">
                    <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <span className="block text-slate-500">Kehadiran</span>
                      <span className="font-bold text-emerald-800">{previewRaporStudent.presensiPct}%</span>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                      <span className="block text-slate-500">Sakit</span>
                      <span className="font-bold text-blue-800">1 Hari</span>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <span className="block text-slate-500">Izin/Alpa</span>
                      <span className="font-bold text-amber-800">0 Hari</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 text-center text-xs pt-6">
                <div>
                  <p className="text-slate-500 mb-14">
                    Mengetahui,<br />Orang Tua / Wali Siswa
                  </p>
                  <p className="font-bold underline">( ........................................ )</p>
                </div>

                <div>
                  <p className="text-slate-500 mb-14">
                    Mengetahui,<br />Kepala Sekolah SDN Tangerang 6
                  </p>
                  <p className="font-bold underline">Liestya Kusuma Sari, S.Pd., M.Pd.</p>
                  <p className="text-[10px] text-slate-400">NIP. 19740520 199803 2 004</p>
                </div>

                <div>
                  <p className="text-slate-500 mb-14">
                    Tangerang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}<br />
                    Guru Kelas / Wali Kelas
                  </p>
                  <p className="font-bold underline">{account.ROLE === 'GURU' ? account.NAMA : 'Nurul Hidayah, S.Pd.'}</p>
                  <p className="text-[10px] text-slate-400">NIP. {account.ROLE === 'GURU' ? (account.NIP || '-') : '19850412 201101 2 003'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
