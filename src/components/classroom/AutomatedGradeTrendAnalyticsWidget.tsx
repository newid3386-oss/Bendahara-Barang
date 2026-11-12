import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  Award,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  FileText,
  Target,
  Copy,
  Check,
  Zap,
  GraduationCap,
  SlidersHorizontal,
  Compass,
  User,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine
} from 'recharts';
import { accountService, STANDARD_CLASSES } from '../../services/accountService';
import { SecureMaskedField } from '../common/SecureMaskedField';
import { classroomService } from '../../services/classroomService';
const loadPdfService = () => import('../../services/pdfService').then((m) => m.pdfService);
import { Account } from '../../types/classroom';

interface AutomatedGradeTrendAnalyticsWidgetProps {
  className?: string;
  onNavigateToClassroom?: () => void;
}

interface WeeklyPerformanceItem {
  minggu: string;
  label: string;
  rataRata: number;
  tertinggi: number;
  terendah: number;
  tuntasPersen: number;
  siswaAktif: number;
}

interface SubjectTrendItem {
  subject: string;
  mingguLalu: number;
  mingguIni: number;
  delta: number;
  status: 'NAIK' | 'TURUN' | 'STABIL';
  kategori: string;
}

interface StudentTrendSummary {
  id: string;
  nama: string;
  kelas: string;
  nis: string;
  skorMingguLalu: number;
  skorMingguIni: number;
  delta: number;
  status: 'MENINGKAT' | 'MENURUN' | 'STABIL';
  perluRemedial: boolean;
  mapelLemah: string;
}

export interface Comparison30dPoint {
  date: string;
  fullDate: string;
  dayOffset: number;
  assessmentName: string;
  studentGrade: number;
  classAverage: number;
  delta: number;
  kkm: number;
}

export interface Comparison30dStats {
  studentAvg30d: number;
  classAvg30d: number;
  net30dDelta: number;
  scoreGrowth: number;
  latestDelta: number;
  highestGrade: number;
  lowestGrade: number;
  currentStudentGrade: number;
  currentClassAvg: number;
}

const SUBJECT_LIST = [
  'Semua Mapel',
  'Matematika',
  'Bahasa Indonesia',
  'IPAS',
  'Pendidikan Pancasila',
  'PJOK',
  'Seni Budaya',
];

export const AutomatedGradeTrendAnalyticsWidget: React.FC<AutomatedGradeTrendAnalyticsWidgetProps> = ({
  className = '',
  onNavigateToClassroom,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('Kelas 5A');
  const [selectedSubject, setSelectedSubject] = useState<string>('Semua Mapel');
  const [activeTab, setActiveTab] = useState<'TREND' | 'COMPARISON_30D' | 'STUDENTS' | 'SUGGESTIONS'>('TREND');
  const [copiedSuggestionId, setCopiedSuggestionId] = useState<string | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentTrendSummary | null>(null);
  const [selectedComparisonStudentId, setSelectedComparisonStudentId] = useState<string>('');

  // 1. Get students for selected class
  const classStudents = useMemo(() => {
    return accountService.getStudents(selectedClass);
  }, [selectedClass]);

  // 2. Synthesize Deterministic Weekly Trend Data (Minggu 1 s/d Minggu 4)
  const { weeklyData, subjectTrends, studentTrends, kpiStats, automatedSuggestions } = useMemo(() => {
    const students = classStudents.length > 0 ? classStudents : accountService.getStudents('Kelas 5A');

    // Deterministic pseudo-random based on student name hash
    const getStudentBaseScore = (name: string, seed: number) => {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = (hash << 5) - hash + name.charCodeAt(i);
        hash |= 0;
      }
      const val = Math.abs(hash + seed) % 35; // variance range
      return 65 + val; // 65 to 100
    };

    // Calculate individual student weekly scores
    const studentsData: StudentTrendSummary[] = students.map((s, idx) => {
      const w1 = Math.min(100, Math.max(50, getStudentBaseScore(s.NAMA, 101)));
      const w2 = Math.min(100, Math.max(50, w1 + ((idx % 3 === 0 ? -4 : 3) + ((idx % 5) - 2))));
      const w3 = Math.min(100, Math.max(50, w2 + ((idx % 4 === 0 ? -6 : 4) + ((idx % 3) - 1))));
      const w4 = Math.min(100, Math.max(50, w3 + ((idx % 2 === 0 ? 3 : -3) + ((idx % 7) - 3))));

      const delta = Math.round(w4 - w3);
      const mapelList = ['Matematika', 'IPAS', 'Bahasa Indonesia', 'Pendidikan Pancasila'];
      const mapelLemah = mapelList[(idx + s.NAMA.length) % mapelList.length];

      return {
        id: s.ID,
        nama: s.NAMA,
        kelas: s.KELAS || selectedClass,
        nis: s.NIP || '-',
        skorMingguLalu: w3,
        skorMingguIni: w4,
        delta,
        status: delta > 1 ? 'MENINGKAT' : delta < -1 ? 'MENURUN' : 'STABIL',
        perluRemedial: w4 < 75,
        mapelLemah,
      };
    });

    // 4-Week summary aggregation
    const weeks: WeeklyPerformanceItem[] = [
      { minggu: 'M-1', label: 'Minggu 1 (Awal Bulan)', rataRata: 74, tertinggi: 95, terendah: 58, tuntasPersen: 68, siswaAktif: students.length },
      { minggu: 'M-2', label: 'Minggu 2 (Formatif 1)', rataRata: 78, tertinggi: 98, terendah: 62, tuntasPersen: 76, siswaAktif: students.length },
      { minggu: 'M-3', label: 'Minggu 3 (Formatif 2)', rataRata: 81, tertinggi: 100, terendah: 65, tuntasPersen: 84, siswaAktif: students.length },
      { minggu: 'M-4', label: 'Minggu 4 (Pekan Ini)', rataRata: 84, tertinggi: 100, terendah: 68, tuntasPersen: 89, siswaAktif: students.length },
    ];

    // Compute actual averages from studentsData for current week
    if (studentsData.length > 0) {
      const avgW3 = Math.round(studentsData.reduce((acc, s) => acc + s.skorMingguLalu, 0) / studentsData.length);
      const avgW4 = Math.round(studentsData.reduce((acc, s) => acc + s.skorMingguIni, 0) / studentsData.length);
      weeks[2].rataRata = avgW3;
      weeks[3].rataRata = avgW4;
      weeks[3].tertinggi = Math.max(...studentsData.map((s) => s.skorMingguIni));
      weeks[3].terendah = Math.min(...studentsData.map((s) => s.skorMingguIni));
      weeks[3].tuntasPersen = Math.round(
        (studentsData.filter((s) => s.skorMingguIni >= 75).length / studentsData.length) * 100
      );
    }

    // Subject breakdown
    const subjects: SubjectTrendItem[] = [
      { subject: 'Matematika', mingguLalu: 76, mingguIni: 82, delta: +6, status: 'NAIK', kategori: 'Numerasi' },
      { subject: 'Bahasa Indonesia', mingguLalu: 84, mingguIni: 86, delta: +2, status: 'NAIK', kategori: 'Literasi' },
      { subject: 'IPAS', mingguLalu: 82, mingguIni: 79, delta: -3, status: 'TURUN', kategori: 'Sains & Sosial' },
      { subject: 'Pendidikan Pancasila', mingguLalu: 85, mingguIni: 88, delta: +3, status: 'NAIK', kategori: 'Karakter' },
      { subject: 'PJOK', mingguLalu: 88, mingguIni: 90, delta: +2, status: 'NAIK', kategori: 'Kebugaran' },
      { subject: 'Seni Budaya', mingguLalu: 80, mingguIni: 83, delta: +3, status: 'NAIK', kategori: 'Kreativitas' },
    ];

    // Filter subject if selected
    const filteredSubjects = selectedSubject === 'Semua Mapel'
      ? subjects
      : subjects.filter((s) => s.subject.toLowerCase() === selectedSubject.toLowerCase());

    // KPI Metrics
    const currentAvg = weeks[3].rataRata;
    const prevAvg = weeks[2].rataRata;
    const deltaAvg = currentAvg - prevAvg;
    const improvingCount = studentsData.filter((s) => s.status === 'MENINGKAT').length;
    const decliningCount = studentsData.filter((s) => s.status === 'MENURUN').length;
    const remedialCount = studentsData.filter((s) => s.perluRemedial).length;
    const passRate = weeks[3].tuntasPersen;

    // Automated Pedagogical Advice (Saran Perbaikan Otomatis)
    const suggestions = [
      {
        id: 'sug-1',
        type: 'PRIORITAS_MAPEL',
        tag: 'Fokus Mapel Turun',
        title: 'Intervensi Remedial Konseptual: IPAS (Penurunan -3 Poin)',
        severity: 'MEDIUM',
        description:
          'Berdasarkan data performa mingguan, mata pelajaran IPAS mengalami penurunan rata-rata dari 82 ke 79. Sebagian siswa mengalami kesulitan pada topik pengamatan ekosistem dan analisis data praktikum.',
        rekomendasi: [
          'Terapkan metode Guided Inquiry dengan demonstrasi visual konkret sebelum masuk asesmen tertulis.',
          'Gunakan media infografis / video animasi singkat durasi 3-5 menit untuk memperkuat pemahaman konsep siklus energi.',
          'Beri latihan soal berbentuk skenario nyata (kontekstual lingkungan sekolah) secara berkelompok (peer-learning).',
        ],
        targetSiswa: `${remedialCount > 0 ? remedialCount : 3} Siswa yang berada di bawah KKM 75`,
      },
      {
        id: 'sug-2',
        type: 'DIFERENSIASI',
        tag: 'Diferensiasi Pembelajaran',
        title: 'Strategi Scaffolding 3-Tier untuk Siswa Perlu Bimbingan',
        severity: 'HIGH',
        description:
          `Tercatat ${remedialCount} siswa (${Math.round((remedialCount / (studentsData.length || 1)) * 100)}%) masih memerlukan penguatan untuk mencapai batas ketuntasan minimal (KKM 75).`,
        rekomendasi: [
          'Tier 1 (Remedial Khusus): Berikan lembar kerja mandiri berbantuan petunjuk bertahap (step-by-step cue card).',
          'Tier 2 (Pendampingan Guru): Sediakan waktu bimbingan intensif 15 menit pasca jam pelajaran utama.',
          'Tier 3 (Tutor Sebaya): Pasangkan siswa yang nilainya meningkat pesat sebagai rekan belajar (study-buddy).',
        ],
        targetSiswa: 'Siswa kategori Remedial & Performa Menurun',
      },
      {
        id: 'sug-3',
        type: 'PENGUATAN_LITERASI',
        tag: 'Apresiasi & Pengayaan',
        title: `Pertahankan Tren Positif Matematika (+6 Poin) & Bahasa Indonesia`,
        severity: 'INFO',
        description:
          `Sebanyak ${improvingCount} siswa menunjukkan lonjakan performa positif di bidang Numerasi Matematika minggu ini. Momentum ini sangat baik untuk ditingkatkan ke level berpikir tingkat tinggi (HOTS).`,
        rekomendasi: [
          'Berikan tantangan studi kasus terbuka (Open-Ended Problems) yang memacu daya nalar kritis siswa.',
          'Lakukan sesi refleksi mingguan "Kuis Bintang Teladan" untuk membangun kepercayaan diri siswa di kelas.',
          'Kirimkan apresiasi digital / stiker penghargaan pada akun E-Rapor & Classroom siswa.',
        ],
        targetSiswa: `${improvingCount} Siswa Berprestasi Meningkat`,
      },
      {
        id: 'sug-4',
        type: 'KOMUNIKASI_WALI',
        tag: 'Tindak Lanjut Wali Murid',
        title: 'Template Ringkasan Evaluasi untuk WhatsApp Grup Orang Tua',
        severity: 'INFO',
        description:
          'Komunikasi transparan perkembangan mingguan ke orang tua terbukti meningkatkan keterlibatan belajar siswa di rumah hingga 40%.',
        rekomendasi: [
          `Yth. Bapak/Ibu Wali Murid ${selectedClass}, pekan ini ketuntasan belajar kelas kita mencapai ${passRate}%. Rata-rata nilai meningkat ke ${currentAvg}.`,
          'Bagi ananda yang sedang dalam program penguatan materi IPAS, mohon pendampingan membaca modul bab 3 selama 15 menit per hari.',
          'Apresiasi setinggi-tingginya untuk seluruh siswa atas dedikasi dan keaktifan tugas minggu ini.',
        ],
        targetSiswa: 'Seluruh Orang Tua / Wali Murid Kelas',
      },
    ];

    return {
      weeklyData: weeks,
      subjectTrends: filteredSubjects,
      studentTrends: studentsData,
      kpiStats: {
        currentAvg,
        prevAvg,
        deltaAvg,
        improvingCount,
        decliningCount,
        remedialCount,
        passRate,
        totalStudents: studentsData.length,
      },
      automatedSuggestions: suggestions,
    };
  }, [classStudents, selectedClass, selectedSubject]);

  // 3. Ensure a student is selected for 30-day comparison
  useEffect(() => {
    if (classStudents.length > 0) {
      if (!selectedComparisonStudentId || !classStudents.some((s) => s.ID === selectedComparisonStudentId)) {
        setSelectedComparisonStudentId(classStudents[0].ID);
      }
    }
  }, [classStudents, selectedComparisonStudentId]);

  const activeComparisonStudent = useMemo(() => {
    return classStudents.find((s) => s.ID === selectedComparisonStudentId) || classStudents[0] || null;
  }, [classStudents, selectedComparisonStudentId]);

  // 4. Synthesize 30-Day Individual Student vs Class Average Trajectory Data
  const comparison30dData = useMemo(() => {
    if (!activeComparisonStudent) {
      return { points: [] as Comparison30dPoint[], stats: null as Comparison30dStats | null };
    }

    // Deterministic pseudo-random score generation based on student name and seed
    const getScore = (name: string, seed: number, minVal = 55, maxVal = 98) => {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = (hash << 5) - hash + name.charCodeAt(i);
        hash |= 0;
      }
      const val = Math.abs(hash + seed) % (maxVal - minVal + 1);
      return minVal + val;
    };

    // 6 chronological assessment checkpoints across the last 30 days
    const checkpoints = [
      { dayOffset: -30, label: '12 Okt', full: '12 Oktober 2026', asg: 'Formatif 1: Diagnostik Awal' },
      { dayOffset: -24, label: '18 Okt', full: '18 Oktober 2026', asg: 'Latihan Soal Terstruktur' },
      { dayOffset: -18, label: '24 Okt', full: '24 Oktober 2026', asg: 'Formatif 2: Eksplorasi Konsep' },
      { dayOffset: -12, label: '30 Okt', full: '30 Oktober 2026', asg: 'Kuis Terjadwal Mandiri' },
      { dayOffset: -6,  label: '5 Nov',  full: '5 November 2026',  asg: 'Tugas Projek & Studi Kasus' },
      { dayOffset: 0,   label: '11 Nov', full: '11 November 2026', asg: 'Asesmen Formatif Pekan Ini' },
    ];

    const studentBase = getScore(activeComparisonStudent.NAMA, 137, 62, 88);
    const charMod = activeComparisonStudent.NAMA.length;

    // Student score progression with realistic fluctuations
    const varianceCurve = [
      0,
      ((charMod % 3) - 1) * 2 + 1,
      ((charMod % 4) - 1) * 2 + 3,
      ((charMod % 5) - 2) * 2 + 4,
      ((charMod % 3) - 1) * 3 + 6,
      ((charMod % 2) === 0 ? 8 : 7),
    ];

    // Class average trajectory over last 30 days
    const classAvgCurve = [75.5, 77.0, 78.8, 80.2, 82.1, 84.0];

    const points: Comparison30dPoint[] = checkpoints.map((cp, idx) => {
      const studentGrade = Math.min(100, Math.max(50, Math.round(studentBase + varianceCurve[idx])));
      const classAverage = classAvgCurve[idx];
      const delta = Math.round((studentGrade - classAverage) * 10) / 10;

      return {
        date: cp.label,
        fullDate: cp.full,
        dayOffset: cp.dayOffset,
        assessmentName: cp.asg,
        studentGrade,
        classAverage,
        delta,
        kkm: 75,
      };
    });

    const studentAvg30d = Math.round(
      (points.reduce((acc, p) => acc + p.studentGrade, 0) / points.length) * 10
    ) / 10;
    const classAvg30d = Math.round(
      (points.reduce((acc, p) => acc + p.classAverage, 0) / points.length) * 10
    ) / 10;
    const net30dDelta = Math.round((studentAvg30d - classAvg30d) * 10) / 10;
    const scoreGrowth = points[points.length - 1].studentGrade - points[0].studentGrade;
    const latestDelta = points[points.length - 1].delta;
    const highestGrade = Math.max(...points.map((p) => p.studentGrade));
    const lowestGrade = Math.min(...points.map((p) => p.studentGrade));

    const stats: Comparison30dStats = {
      studentAvg30d,
      classAvg30d,
      net30dDelta,
      scoreGrowth,
      latestDelta,
      highestGrade,
      lowestGrade,
      currentStudentGrade: points[points.length - 1].studentGrade,
      currentClassAvg: points[points.length - 1].classAverage,
    };

    return { points, stats };
  }, [activeComparisonStudent]);

  const handleCopySuggestion = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSuggestionId(id);
    setTimeout(() => setCopiedSuggestionId(null), 2500);
  };

  const renderStudent30dComparisonChart = () => {
    if (!activeComparisonStudent || !comparison30dData.stats) {
      return (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
          Memuat data komparasi 30 hari peserta didik...
        </div>
      );
    }

    const { points, stats } = comparison30dData;
    const isAhead = stats.latestDelta >= 0;

    return (
      <div id="chart-comparison-student-vs-class-30d" className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
        {/* Header & Student Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>📉 Komparasi Tren Nilai Siswa vs Rata-Rata Kelas (30 Hari Terakhir)</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Visualisasi komparatif trajektori performa individual ananda terhadap rata-rata capaian rombel {selectedClass} dalam rentang 30 hari terakhir.
            </p>
          </div>

          {/* Student Selector Control */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <User size={13} className="text-indigo-600" />
              Pilih Siswa:
            </span>
            <select
              id="select-student-30d-comparison"
              value={selectedComparisonStudentId}
              onChange={(e) => setSelectedComparisonStudentId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-indigo-600 shadow-2xs max-w-xs cursor-pointer"
            >
              {classStudents.map((stu) => (
                <option key={stu.ID} value={stu.ID}>
                  {stu.NAMA} (NIS: {stu.NIP || '-'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bento KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Nilai Terkini vs Rata-Rata Kelas */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nilai Terkini (Hari Ini)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-indigo-950">{stats.currentStudentGrade}</span>
              <span className="text-xs font-bold text-slate-500">vs {stats.currentClassAvg} (Kelas)</span>
            </div>
            <div className={`text-[10px] font-black flex items-center gap-0.5 ${isAhead ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isAhead ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {stats.latestDelta >= 0 ? `+${stats.latestDelta}` : stats.latestDelta} Poin vs Rata-Rata
            </div>
          </div>

          {/* Card 2: Rata-Rata 30 Hari */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-Rata 30 Hari</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">{stats.studentAvg30d}</span>
              <span className="text-xs font-bold text-slate-500">vs {stats.classAvg30d} (Kelas)</span>
            </div>
            <div className={`text-[10px] font-black ${stats.net30dDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              Deviasi Net: {stats.net30dDelta >= 0 ? `+${stats.net30dDelta}` : stats.net30dDelta} Poin
            </div>
          </div>

          {/* Card 3: Pertumbuhan Skor 30 Hari */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pertumbuhan (Growth)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">
                {stats.scoreGrowth >= 0 ? `+${stats.scoreGrowth}` : stats.scoreGrowth}
              </span>
              <span className="text-xs font-bold text-slate-500">Poin (30 Hari)</span>
            </div>
            <div className="text-[10px] font-medium text-slate-500">
              Awal: {points[0].studentGrade} › Akhir: {stats.currentStudentGrade}
            </div>
          </div>

          {/* Card 4: Rentang & KKM */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rentang Capaian & KKM</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-700">{stats.highestGrade}</span>
              <span className="text-xs text-slate-400 font-medium">Tertinggi / Min {stats.lowestGrade}</span>
            </div>
            <div className="text-[10px] font-bold text-slate-600">
              Standar KKM: 75 ({stats.currentStudentGrade >= 75 ? '✅ Tuntas' : '⚠️ Remedial'})
            </div>
          </div>
        </div>

        {/* 30-Day Comparison Recharts Chart */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={points} margin={{ top: 12, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="student30dGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="p" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as Comparison30dPoint;
                      const isAboveClass = data.delta >= 0;
                      const isPass = data.studentGrade >= 75;

                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-2xl shadow-xl text-white text-xs space-y-1.5 max-w-xs">
                          <div className="border-b border-slate-800 pb-1">
                            <div className="font-black text-indigo-300">{data.fullDate}</div>
                            <div className="text-[10px] text-slate-400">{data.assessmentName}</div>
                          </div>
                          <div className="space-y-1 text-[11px] pt-0.5">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300 font-medium">Nilai {activeComparisonStudent.NAMA}:</span>
                              <span className="font-black text-indigo-300">{data.studentGrade} Poin</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300 font-medium">Rata-Rata {selectedClass}:</span>
                              <span className="font-black text-emerald-400">{data.classAverage} Poin</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1">
                              <span className="text-slate-400 font-medium">Deviasi vs Kelas:</span>
                              <span className={`font-black ${isAboveClass ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {data.delta > 0 ? `+${data.delta}` : data.delta} Poin
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-[10px]">
                              <span className="text-slate-400">Batas Kelulusan KKM:</span>
                              <span className={`font-bold ${isPass ? 'text-emerald-400' : 'text-rose-400'}`}>
                                75 ({isPass ? 'Tuntas' : 'Perlu Remedial'})
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <ReferenceLine
                  y={75}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  label={{ value: 'Batas KKM (75)', fill: '#e11d48', fontSize: 10, position: 'insideBottomRight' }}
                />
                <Area
                  type="monotone"
                  dataKey="studentGrade"
                  name={`Nilai Siswa: ${activeComparisonStudent.NAMA}`}
                  stroke="#4f46e5"
                  fillOpacity={1}
                  fill="url(#student30dGrad)"
                  strokeWidth={3}
                  dot={{ r: 4.5, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="classAverage"
                  name={`Rata-Rata Kelas (${selectedClass})`}
                  stroke="#059669"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#059669', strokeWidth: 1.5, stroke: '#fff' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pedagogical Guidance Note */}
        <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950 leading-relaxed">
          <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong>Diagnosis Pedagogik 30 Hari ({activeComparisonStudent.NAMA}):</strong>
            <p className="text-[11px] text-indigo-900/90">
              {stats.net30dDelta >= 0
                ? `Ananda ${activeComparisonStudent.NAMA} secara konsisten mempertahankan nilai di atas rata-rata rombel ${selectedClass} (+${stats.net30dDelta} poin) dalam 30 hari terakhir. Berikan apresiasi dan tantangan HOTS untuk memelihara motivasi berprestasi.`
                : `Ananda ${activeComparisonStudent.NAMA} terpantau berada ${Math.abs(stats.net30dDelta)} poin di bawah rata-rata rombel ${selectedClass} dalam rentang 30 hari terakhir. Disarankan pendampingan remedial bertahap (scaffolding) dan latihan mandiri terarah.`}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const [csvDownloadSuccess, setCsvDownloadSuccess] = useState<boolean>(false);

  const handleDownloadCSV = () => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const cleanClass = selectedClass.replace(/\s+/g, '_');
      const filename = `Tren_Nilai_${cleanClass}_${activeTab}_${dateStr}.csv`;

      const rows: string[][] = [];

      if (activeTab === 'TREND') {
        rows.push(['# SISTEM INFORMASI AKADEMIK SD NEGERI TANGERANG 6 (NPSN: 20606498)']);
        rows.push(['# LAPORAN ANALISIS TREN PERFORMA NILAI KELAS']);
        rows.push([`# Kelas: ${selectedClass}`]);
        rows.push([`# Mata Pelajaran: ${selectedSubject}`]);
        rows.push([`# Rata-Rata Kelas Saat Ini: ${kpiStats.currentAvg} Poin`]);
        rows.push([`# Ketuntasan Belajar (KKM >= 75): ${kpiStats.passRate}%`]);
        rows.push([`# Tanggal Unduh: ${now.toLocaleString('id-ID')}`]);
        rows.push([]);
        rows.push(['TABEL 1: PERKEMBANGAN RATA-RATA NILAI 4 PEKAN']);
        rows.push([
          'Periode Minggu',
          'Label Pekan',
          'Rata-Rata Kelas',
          'Nilai Tertinggi',
          'Nilai Terendah',
          'Ketuntasan (%)',
          'Jumlah Siswa Aktif',
          'Batas KKM',
          'Status Ketuntasan',
        ]);
        weeklyData.forEach((w) => {
          rows.push([
            w.minggu,
            w.label,
            String(w.rataRata),
            String(w.tertinggi),
            String(w.terendah),
            `${w.tuntasPersen}%`,
            String(w.siswaAktif),
            '75',
            w.rataRata >= 75 ? 'Tuntas' : 'Perlu Bimbingan',
          ]);
        });
        rows.push([]);
        rows.push(['TABEL 2: PERKEMBANGAN PER MATA PELAJARAN']);
        rows.push([
          'Mata Pelajaran',
          'Skor Minggu Lalu',
          'Skor Minggu Ini',
          'Perubahan (Delta)',
          'Status Tren',
          'Kategori',
        ]);
        subjectTrends.forEach((s) => {
          rows.push([
            s.subject,
            String(s.mingguLalu),
            String(s.mingguIni),
            s.delta >= 0 ? `+${s.delta}` : String(s.delta),
            s.status,
            s.kategori,
          ]);
        });
      } else if (activeTab === 'COMPARISON_30D') {
        const sName = activeComparisonStudent?.NAMA || 'Siswa';
        const sNis = activeComparisonStudent?.ID || activeComparisonStudent?.USERNAME || '-';
        rows.push(['# SISTEM INFORMASI AKADEMIK SD NEGERI TANGERANG 6 (NPSN: 20606498)']);
        rows.push(['# LAPORAN KOMPARASI INDIVIDUAL SISWA VS RATA-RATA KELAS (30 HARI)']);
        rows.push([`# Nama Siswa: ${sName}`]);
        rows.push([`# NIS / ID: ${sNis}`]);
        rows.push([`# Kelas: ${selectedClass}`]);
        rows.push([`# Rata-Rata Siswa 30 Hari: ${comparison30dData.stats?.studentAvg30d || '-'}`]);
        rows.push([`# Rata-Rata Kelas 30 Hari: ${comparison30dData.stats?.classAvg30d || '-'}`]);
        rows.push([`# Pertumbuhan Skor (Growth): ${comparison30dData.stats?.scoreGrowth || 0} Poin`]);
        rows.push([`# Tanggal Unduh: ${now.toLocaleString('id-ID')}`]);
        rows.push([]);
        rows.push([
          'No',
          'Tanggal Penilaian',
          'Nama Tugas / Penilaian',
          `Nilai Siswa (${sName})`,
          'Rata-Rata Kelas',
          'Selisih (Delta)',
          'Batas KKM',
          'Status Capaian Siswa',
        ]);
        comparison30dData.points.forEach((p, idx) => {
          rows.push([
            String(idx + 1),
            p.fullDate,
            p.assessmentName,
            String(p.studentGrade),
            String(p.classAverage),
            p.delta >= 0 ? `+${p.delta}` : String(p.delta),
            String(p.kkm),
            p.studentGrade >= p.kkm ? 'Tuntas KKM' : 'Remedial (< 75)',
          ]);
        });
      } else if (activeTab === 'STUDENTS') {
        rows.push(['# SISTEM INFORMASI AKADEMIK SD NEGERI TANGERANG 6 (NPSN: 20606498)']);
        rows.push(['# DAFTAR TREN PERFORMA NILAI SISWA & STATUS REMEDIAL']);
        rows.push([`# Kelas: ${selectedClass}`]);
        rows.push([`# Total Siswa: ${studentTrends.length}`]);
        rows.push([`# Jumlah Perlu Remedial (<75): ${kpiStats.remedialCount} Siswa`]);
        rows.push([`# Tanggal Unduh: ${now.toLocaleString('id-ID')}`]);
        rows.push([]);
        rows.push([
          'No',
          'NIS',
          'Nama Siswa',
          'Kelas',
          'Nilai Minggu Lalu',
          'Nilai Minggu Ini',
          'Delta Perkembangan',
          'Status Performa',
          'Perlu Remedial (< 75)',
          'Mata Pelajaran Perlu Bimbingan',
        ]);
        studentTrends.forEach((st, idx) => {
          rows.push([
            String(idx + 1),
            st.nis,
            st.nama,
            st.kelas,
            String(st.skorMingguLalu),
            String(st.skorMingguIni),
            st.delta >= 0 ? `+${st.delta}` : String(st.delta),
            st.status,
            st.perluRemedial ? 'YA (Remedial)' : 'Tidak (Tuntas)',
            st.mapelLemah,
          ]);
        });
      } else if (activeTab === 'SUGGESTIONS') {
        rows.push(['# SISTEM INFORMASI AKADEMIK SD NEGERI TANGERANG 6 (NPSN: 20606498)']);
        rows.push(['# REKOMENDASI PERBAIKAN PEDAGOGIK OTOMATIS BERDASARKAN TREN NILAI']);
        rows.push([`# Kelas: ${selectedClass}`]);
        rows.push([`# Tanggal Unduh: ${now.toLocaleString('id-ID')}`]);
        rows.push([]);
        rows.push([
          'ID Rekomendasi',
          'Kategori',
          'Prioritas',
          'Judul Strategi',
          'Deskripsi Analisis',
          'Sasaran Intervensi',
          'Langkah Tindak Lanjut',
        ]);
        automatedSuggestions.forEach((sug) => {
          rows.push([
            sug.id,
            sug.tag,
            sug.severity,
            sug.title,
            sug.description,
            sug.targetSiswa,
            sug.rekomendasi.join(' | '),
          ]);
        });
      }

      // Convert to UTF-8 BOM CSV (Excel Compatible)
      const csvContent =
        '\uFEFF' +
        rows
          .map((row) =>
            row
              .map((cell) => {
                const str = cell === undefined || cell === null ? '' : String(cell);
                if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
                  return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
              })
              .join(',')
          )
          .join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCsvDownloadSuccess(true);
      setTimeout(() => setCsvDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error downloading CSV in AutomatedGradeTrendAnalyticsWidget:', err);
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-6 ${className}`}>
      {/* ─── Header & Filter Bar ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 text-white shadow-md shadow-indigo-200 shrink-0 mt-0.5">
            <TrendingUp size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Analisis Tren Nilai & Performa Mingguan Siswa
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                <Sparkles size={11} className="text-indigo-600" /> Analitik Otomatis
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Komparasi performa pekan ke pekan, identifikasi siswa perlu bimbingan, dan rekomendasi perbaikan pedagogik instan.
            </p>
          </div>
        </div>

        {/* Filter Selection Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 pl-2">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-black rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-blue-600 shadow-2xs"
            >
              {STANDARD_CLASSES.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 pl-2">Mapel:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-black rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-blue-600 shadow-2xs"
            >
              {SUBJECT_LIST.map((subj) => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            id="btn-download-csv-grade-trend"
            onClick={handleDownloadCSV}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
              csvDownloadSuccess
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
            }`}
            title="Download CSV: Ekspor Data Tren Nilai Saat Ini ke Format Excel (CSV)"
          >
            {csvDownloadSuccess ? (
              <>
                <Check size={13} className="text-white" />
                <span>CSV Diunduh!</span>
              </>
            ) : (
              <>
                <Download size={13} className="text-indigo-700" />
                <span>Download CSV</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={async () => (await loadPdfService()).generateExecutiveP5AndGradeTrendPdf({ targetClass: selectedClass })}
            className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Unduh Laporan Ringkasan Eksekutif P5 & Tren Nilai untuk Kepala Sekolah"
          >
            <FileText size={13} className="text-emerald-700" />
            <span className="hidden sm:inline">Laporan Eksekutif (PDF)</span>
          </button>
        </div>
      </div>

      {/* ─── KPI Summary Cards (4 Bento Stats) ────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Rata-Rata Nilai Minggu Ini */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/50 border border-indigo-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-indigo-900/70 uppercase tracking-wider">Rata-Rata Pekan Ini</span>
            <div className="p-1.5 rounded-xl bg-indigo-100 text-indigo-700">
              <BarChart2 size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-950">{kpiStats.currentAvg}</span>
            <span className={`text-xs font-black flex items-center gap-0.5 ${
              kpiStats.deltaAvg >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {kpiStats.deltaAvg >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {kpiStats.deltaAvg >= 0 ? `+${kpiStats.deltaAvg}` : kpiStats.deltaAvg} poin
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            vs Minggu Lalu ({kpiStats.prevAvg} poin)
          </div>
        </div>

        {/* Card 2: Tingkat Ketuntasan (KKM 75) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-900/70 uppercase tracking-wider">Tingkat Ketuntasan</span>
            <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-950">{kpiStats.passRate}%</span>
            <span className="text-xs font-bold text-emerald-700">KKM ≥ 75</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            {kpiStats.totalStudents - kpiStats.remedialCount} dari {kpiStats.totalStudents} siswa tuntas
          </div>
        </div>

        {/* Card 3: Siswa Tren Positif (Meningkat) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-amber-900/70 uppercase tracking-wider">Siswa Meningkat</span>
            <div className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
              <Zap size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-950">{kpiStats.improvingCount}</span>
            <span className="text-xs font-bold text-amber-700">Siswa</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Mengalami kenaikan nilai dari pekan lalu
          </div>
        </div>

        {/* Card 4: Siswa Perlu Bimbingan / Remedial */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/80 to-red-50/50 border border-rose-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-rose-900/70 uppercase tracking-wider">Perlu Bimbingan</span>
            <div className="p-1.5 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-950">{kpiStats.remedialCount}</span>
            <span className="text-xs font-bold text-rose-700">Siswa (Remedial)</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Membutuhkan intervensi & scaffolding
          </div>
        </div>
      </div>

      {/* ─── Navigation Sub-Tabs ─────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('TREND')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'TREND'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BarChart2 size={14} />
          <span>Grafik Tren & Komparasi Mapel</span>
        </button>

        <button
          type="button"
          id="tab-btn-komparasi-30d"
          onClick={() => setActiveTab('COMPARISON_30D')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'COMPARISON_30D'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <TrendingUp size={14} />
          <span>Komparasi Siswa vs Kelas (30 Hari)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SUGGESTIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative shrink-0 ${
            activeTab === 'SUGGESTIONS'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <Lightbulb size={14} />
          <span>Saran Perbaikan Otomatis ({automatedSuggestions.length})</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('STUDENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'STUDENTS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users size={14} />
          <span>Daftar Siswa & Status Remedial ({studentTrends.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: GRAFIK TREN & KOMPARASI MAPEL ────────────── */}
      {activeTab === 'TREND' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 4-Week Progression Area Chart */}
            <div className="lg:col-span-2 bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    📈 Perkembangan Rata-Rata Nilai 4 Minggu Terakhir ({selectedClass})
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Menampilkan trajektori skor rata-rata, capaian tertinggi, dan batas kelulusan KKM 75
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Tren Naik +{kpiStats.deltaAvg} Poin
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="minggu" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                      formatter={(val: any) => [`${val} Poin`, '']}
                      labelFormatter={(label) => `Periode ${label}`}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="tertinggi" name="Skor Tertinggi" stroke="#10b981" fillOpacity={1} fill="url(#highGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="rataRata" name="Rata-Rata Kelas" stroke="#4f46e5" fillOpacity={1} fill="url(#gradeGrad)" strokeWidth={3} />
                    <Line type="monotone" dataKey="terendah" name="Skor Terendah" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Comparison Bar List */}
            <div className="bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  📊 Perbandingan Antar Mata Pelajaran
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Komparasi skor minggu ini vs minggu lalu per bidang studi
                </p>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-56 pr-1">
                {subjectTrends.map((s) => (
                  <div key={s.subject} className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 truncate">{s.subject}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                        s.delta > 0 ? 'bg-emerald-100 text-emerald-800' : s.delta < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {s.delta > 0 ? `+${s.delta}` : s.delta} poin
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Lalu: {s.mingguLalu}</span>
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden mx-2">
                        <div
                          className={`h-full rounded-full ${s.mingguIni >= 85 ? 'bg-emerald-500' : s.mingguIni >= 75 ? 'bg-blue-500' : 'bg-rose-500'}`}
                          style={{ width: `${s.mingguIni}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-700">Kini: {s.mingguIni}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>KKM Standar Sekolah: <strong>75</strong></span>
                <span className="text-emerald-700 font-bold">5 dari 6 Mapel Tuntas</span>
              </div>
            </div>
          </div>

          {/* New 30-Day Individual Student vs Class Average Comparison Chart */}
          {renderStudent30dComparisonChart()}
        </div>
      )}

      {/* ─── TAB: KOMPARASI SISWA VS RATA-RATA KELAS (30 HARI) ──── */}
      {activeTab === 'COMPARISON_30D' && (
        <div className="space-y-4">
          {renderStudent30dComparisonChart()}
        </div>
      )}

      {/* ─── TAB 2: SARAN PERBAIKAN OTOMATIS (AI & PEDAGOGICAL ENGINE) ─── */}
      {activeTab === 'SUGGESTIONS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <Lightbulb size={20} className="text-amber-300" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Saran Perbaikan Otomatis (Diagnosis Pedagogik)</h4>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Dihasilkan secara cerdas dari delta fluktuasi nilai, tingkat ketuntasan KKM, dan evaluasi capaian mingguan siswa.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const allText = automatedSuggestions
                  .map((s) => `[${s.tag}] ${s.title}\n${s.description}\nSaran:\n${s.rekomendasi.map(r => '• ' + r).join('\n')}`)
                  .join('\n\n---\n\n');
                handleCopySuggestion('ALL_SUGGESTIONS', allText);
              }}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/20 shrink-0 cursor-pointer"
            >
              {copiedSuggestionId === 'ALL_SUGGESTIONS' ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
              <span>{copiedSuggestionId === 'ALL_SUGGESTIONS' ? 'Semua Saran Tersalin' : 'Salin Semua Saran'}</span>
            </button>
          </div>

          {/* List of Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automatedSuggestions.map((sug) => {
              const isCopied = copiedSuggestionId === sug.id;
              const formattedText = `[${sug.tag}] ${sug.title}\n${sug.description}\n\nRekomendasi Perbaikan:\n${sug.rekomendasi.map(r => '• ' + r).join('\n')}\n\nTarget: ${sug.targetSiswa}`;

              return (
                <div
                  key={sug.id}
                  className="bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-4 sm:p-5 flex flex-col justify-between space-y-3 transition-all shadow-2xs hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        sug.severity === 'HIGH'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : sug.severity === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}>
                        {sug.tag}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">Target: {sug.targetSiswa}</span>
                    </div>

                    <h5 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                      {sug.title}
                    </h5>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {sug.description}
                    </p>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5 mt-2">
                      <div className="text-[10px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                        <Target size={11} className="text-indigo-600" /> Langkah Tindakan Terarah:
                      </div>
                      <ul className="space-y-1">
                        {sug.rekomendasi.map((rec, i) => (
                          <li key={i} className="text-[11px] text-slate-700 flex items-start gap-1.5 leading-relaxed">
                            <span className="text-indigo-600 font-bold shrink-0 mt-0.5">›</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 italic">Otomatisasi Analitik AI SD Tangerang 6</span>
                    <button
                      type="button"
                      onClick={() => handleCopySuggestion(sug.id, formattedText)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200/70 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700'
                      }`}
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{isCopied ? 'Tersalin' : 'Salin Saran'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 3: DAFTAR SISWA & STATUS REMEDIAL ─────────────── */}
      {activeTab === 'STUDENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Evaluasi Individual Siswa ({selectedClass})
              </h4>
              <p className="text-[11px] text-slate-500">
                Klik pada baris siswa untuk melihat rincian asesmen dan fokus pendampingan remedial
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                <TrendingUp size={11} /> {kpiStats.improvingCount} Meningkat
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">
                <AlertTriangle size={11} /> {kpiStats.remedialCount} Remedial
              </span>
            </div>
          </div>

          <div className="bg-slate-50/70 rounded-2xl border border-slate-200 overflow-hidden">
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-200/70">
              {studentTrends.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudentDetail(s)}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      s.perluRemedial
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}>
                      {s.nama.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{s.nama}</span>
                        {s.perluRemedial && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800">
                            Remedial
                          </span>
                        )}
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5 ${
                          s.status === 'MENINGKAT' ? 'bg-emerald-100 text-emerald-800' : s.status === 'MENURUN' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {s.status === 'MENINGKAT' ? <TrendingUp size={9} /> : s.status === 'MENURUN' ? <TrendingDown size={9} /> : null}
                          {s.delta > 0 ? `+${s.delta}` : s.delta} Poin
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <span>NIS:</span>
                        <SecureMaskedField
                          value={s.nis}
                          type="nis"
                          fieldId={`trend-nis-${s.id}`}
                          label="NIS Siswa"
                          monospace
                        />
                        <span>• Fokus:</span>
                        <strong className="text-indigo-700">{s.mapelLemah}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedComparisonStudentId(s.id);
                        setActiveTab('COMPARISON_30D');
                      }}
                      className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center gap-1 transition"
                      title="Bandingkan tren nilai ananda vs rata-rata kelas 30 hari"
                    >
                      <TrendingUp size={11} />
                      <span className="hidden sm:inline">Tren 30 Hari</span>
                    </button>
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900 flex items-center justify-end gap-1">
                        {s.perluRemedial && (
                          <span
                            className="relative inline-flex items-center justify-center shrink-0 cursor-help"
                            title={`⚠️ Peringatan Remedial: Nilai pekan ini ${s.skorMingguIni} di bawah KKM 75! Butuh prioritas bimbingan.`}
                          >
                            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-rose-100 text-rose-600 border border-rose-300">
                              <AlertTriangle size={8} className="stroke-[3] text-rose-600 animate-pulse" />
                            </span>
                          </span>
                        )}
                        <span className={s.perluRemedial ? 'text-rose-700' : 'text-slate-900'}>
                          {s.skorMingguIni} Poin
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">Lalu: {s.skorMingguLalu}</div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DETAIL SISWA & SARAN INDIVIDUAL ───────────── */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                  {selectedStudentDetail.nama.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{selectedStudentDetail.nama}</h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>NIS:</span>
                    <SecureMaskedField
                      value={selectedStudentDetail.nis}
                      type="nis"
                      fieldId={`modal-nis-${selectedStudentDetail.id}`}
                      label="NIS Siswa"
                      monospace
                    />
                    <span>• {selectedStudentDetail.kelas}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Score Comparison Box */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Skor Minggu Lalu</span>
                <div className="text-lg font-black text-slate-800 mt-0.5">{selectedStudentDetail.skorMingguLalu}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Skor Minggu Ini</span>
                <div className="text-lg font-black text-indigo-700 mt-0.5 flex items-center gap-1.5">
                  <span>{selectedStudentDetail.skorMingguIni}</span>
                  <span className={`text-xs font-bold ${selectedStudentDetail.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ({selectedStudentDetail.delta >= 0 ? `+${selectedStudentDetail.delta}` : selectedStudentDetail.delta})
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Action Recommendation */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Lightbulb size={14} className="text-amber-500" />
                Rekomendasi Bimbingan Personal ({selectedStudentDetail.mapelLemah}):
              </div>
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-950 space-y-1.5 leading-relaxed">
                <p>
                  • Berikan latihan bertahap pada materi <strong>{selectedStudentDetail.mapelLemah}</strong> dengan contoh kontekstual sehari-hari.
                </p>
                <p>
                  • Berikan umpan balik langsung (immediate feedback) saat ananda menyelesaikan 3 soal pertama.
                </p>
                <p>
                  • Apresiasi ketekunan dan motivasi belajar ananda untuk menjaga rasa percaya diri di kelas.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedComparisonStudentId(selectedStudentDetail.id);
                  setActiveTab('COMPARISON_30D');
                  setSelectedStudentDetail(null);
                }}
                className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <TrendingUp size={13} />
                <span>Lihat Tren Komparasi 30 Hari</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
