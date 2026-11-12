import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, BarChart2, Users, AlertTriangle, CheckCircle2, ChevronRight,
  Search, BookOpen, Download, Printer, RefreshCw, Sparkles, Plus, Award,
  X, HelpCircle, FileText, Send, Flame, ShieldAlert, GraduationCap, ArrowRight, Save, Filter,
  Compass, Target, Eye, Layers, Check, SlidersHorizontal, Bell, FileDown, Brain, Lightbulb,
  CheckCheck, Clock, HeartHandshake
} from 'lucide-react';
import {
  Account,
  ClassroomSubmission,
  SubjectKkmAlert,
  AssignmentErrorPattern,
  RemedialModule,
  SpecialInterventionStudent,
} from '../../types/classroom';
import { ResponsiveContainer, BarChart, AreaChart, RadarChart, ComposedChart, PieChart, Area, Line, Bar, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, Pie } from 'recharts';
import { classroomService, DEFAULT_SUBJECT_KKM } from '../../services/classroomService';
import { accountService, STANDARD_CLASSES } from '../../services/accountService';
import { pdfService } from '../../services/pdfService';
import { P5RadarChartWidget } from './P5RadarChartWidget';
import { P5DailyLogModal } from './P5DailyLogModal';
import { BehaviorAnalysisWidget } from './BehaviorAnalysisWidget';

interface DashboardAnalitikGuruProps {
  account: Account;
  onRefresh?: () => void;
}

export const DashboardAnalitikGuru: React.FC<DashboardAnalitikGuruProps> = ({ account, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';
  const isSiswa = account.ROLE === 'SISWA';

  // State management
  const [activeMainTab, setActiveMainTab] = useState<'AKADEMIK' | 'POLA_KESALAHAN' | 'ANALISIS_PERILAKU' | 'P5_PROGRESS' | 'PROFIL_PANCASILA'>('AKADEMIK');
  const [selectedKelas, setSelectedKelas] = useState<string>(account.KELAS || 'Kelas 1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'OVERVIEW' | 'DISTRIBUTION' | 'DIAGNOSTIC' | 'RADAR'>('OVERVIEW');
  const [selectedP5DimensionFilter, setSelectedP5DimensionFilter] = useState<string>('ALL');

  // P5 Radar Comparison Tab State
  const [selectedRadarStudentId, setSelectedRadarStudentId] = useState<string>('ALL');
  const [showTargetBenchmark, setShowTargetBenchmark] = useState<boolean>(true);
  const [showSchoolBenchmark, setShowSchoolBenchmark] = useState<boolean>(true);
  const [showDailyLogModal, setShowDailyLogModal] = useState<boolean>(false);

  // Load P5 achievements for students from localStorage
  const [studentP5, setStudentP5] = useState<Record<string, Record<string, 'BB' | 'MB' | 'BSH' | 'SAB'>>>(() => {
    try {
      const stored = localStorage.getItem('BB_CLASSROOM_STUDENT_P5_ACHIEVEMENTS_V1');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const updateStudentP5Dimension = (studentId: string, dimension: string, level: 'BB' | 'MB' | 'BSH' | 'SAB') => {
    const updated = {
      ...studentP5,
      [studentId]: {
        ...(studentP5[studentId] || {}),
        [dimension]: level,
      },
    };
    setStudentP5(updated);
    localStorage.setItem('BB_CLASSROOM_STUDENT_P5_ACHIEVEMENTS_V1', JSON.stringify(updated));
    forceUpdate();
  };

  // AI Remedial generator states
  const [remedialModalOpen, setRemedialModalOpen] = useState(false);
  const [remedialStudent, setRemedialStudent] = useState<{ id: string; nama: string; score: number } | null>(null);
  const [remedialSubject, setRemedialSubject] = useState('Matematika');
  const [remedialTopic, setRemedialTopic] = useState('Pecahan Sederhana & Logika Dasar');
  const [isGenerating, setIsGenerating] = useState(false);
  const [worksheetContent, setWorksheetContent] = useState('');

  // Re-evaluation states
  const [reEvalModalOpen, setReEvalModalOpen] = useState(false);
  const [reEvalStudent, setReEvalStudent] = useState<{ id: string; nama: string; currentScore: number } | null>(null);
  const [newScore, setNewScore] = useState<number>(80);
  const [reEvalNotes, setReEvalNotes] = useState('Lulus pasca remedial pendampingan terfokus');

  // AI Teacher Tips states
  const [aiTipsLoading, setAiTipsLoading] = useState(false);
  const [aiGeneratedTips, setAiGeneratedTips] = useState<string | null>(null);

  // Load and refresh counts
  const [dataVersion, setDataVersion] = useState(0);

  // Subject KKM Target & Executive Report States
  const [showSubjectKkmModal, setShowSubjectKkmModal] = useState<boolean>(false);
  const [kkmTargets, setKkmTargets] = useState<Record<string, number>>(() => classroomService.getSubjectKkmTargets());
  const [subjectAlerts, setSubjectAlerts] = useState<SubjectKkmAlert[]>([]);
  const [dismissAlertBanner, setDismissAlertBanner] = useState<boolean>(false);
  const [isGeneratingExecutivePdf, setIsGeneratingExecutivePdf] = useState<boolean>(false);
  const [executivePdfFeedback, setExecutivePdfFeedback] = useState<string | null>(null);

  useEffect(() => {
    const alerts = classroomService.checkSubjectKkmAlerts(selectedKelas, true);
    setSubjectAlerts(alerts);
    setKkmTargets(classroomService.getSubjectKkmTargets());
  }, [selectedKelas, dataVersion]);

  const handleDownloadExecutivePdf = async () => {
    try {
      setIsGeneratingExecutivePdf(true);
      await pdfService.generateExecutiveP5AndGradeTrendPdf({
        targetClass: selectedKelas,
        schoolYear: '2026/2027',
        semester: 'Semester Ganjil',
        guruNama: account.NAMA,
        guruNip: account.NIP || '19820315 200801 1 007',
      });
      setExecutivePdfFeedback('Laporan Ringkasan Eksekutif P5 & Tren Nilai berhasil diunduh dalam format PDF.');
      setTimeout(() => setExecutivePdfFeedback(null), 5000);
    } catch (err) {
      console.error(err);
      alert('Gagal menghasilkan PDF Eksekutif. Silakan coba kembali.');
    } finally {
      setIsGeneratingExecutivePdf(false);
    }
  };

  const handleSaveKkmTargets = (updatedTargets: Record<string, number>) => {
    classroomService.saveSubjectKkmTargets(updatedTargets);
    setKkmTargets(updatedTargets);
    const alerts = classroomService.checkSubjectKkmAlerts(selectedKelas, true);
    setSubjectAlerts(alerts);
    setShowSubjectKkmModal(false);
    forceUpdate();
  };

  // Error Pattern Analysis & Adaptive Remedial Module States
  const [selectedErrorSubjectFilter, setSelectedErrorSubjectFilter] = useState<string>('Semua');
  const [selectedErrorCategoryFilter, setSelectedErrorCategoryFilter] = useState<string>('ALL');
  const [previewRemedialModule, setPreviewRemedialModule] = useState<RemedialModule | null>(null);
  const [showPracticeHints, setShowPracticeHints] = useState<Record<number, boolean>>({});
  const [showPracticeAnswers, setShowPracticeAnswers] = useState<Record<number, boolean>>({});
  const [showMonthlyExecutivePdfModal, setShowMonthlyExecutivePdfModal] = useState<boolean>(false);
  const [monthlyPdfMonth, setMonthlyPdfMonth] = useState<string>('November 2026');
  const [isGeneratingMonthlyPdf, setIsGeneratingMonthlyPdf] = useState<boolean>(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [interventionSearchQuery, setInterventionSearchQuery] = useState<string>('');

  const handleDownloadMonthlyExecutivePdf = async (month: string = monthlyPdfMonth) => {
    try {
      setIsGeneratingMonthlyPdf(true);
      await pdfService.generateMonthlyClassPerformanceExecutivePdf({
        kelas: selectedKelas,
        bulan: month,
        waliKelas: account.NAMA,
        waliKelasNip: account.NIP || '19850612 201001 2 015',
        schoolYear: '2026/2027',
        semester: 'Semester Ganjil',
      });
      setShowMonthlyExecutivePdfModal(false);
      setExecutivePdfFeedback(`Laporan Eksekutif Performa Kelas Bulanan (${month}) untuk ${selectedKelas} berhasil diunduh dalam format PDF.`);
      setTimeout(() => setExecutivePdfFeedback(null), 5000);
    } catch (err) {
      console.error(err);
      alert('Gagal menghasilkan Laporan Eksekutif Bulanan. Silakan coba kembali.');
    } finally {
      setIsGeneratingMonthlyPdf(false);
    }
  };

  const handleAssignPatternModule = (pattern: AssignmentErrorPattern) => {
    const studentIds = pattern.affectedStudents.map(s => s.id);
    if (studentIds.length === 0) {
      alert('Tidak ada siswa di bawah KKM pada pola kesalahan ini.');
      return;
    }
    const res = classroomService.assignRemedialModule(pattern.recommendedModuleId, studentIds, selectedKelas, pattern.topic);
    setActionToast(res.message);
    setTimeout(() => setActionToast(null), 4500);
    forceUpdate();
  };

  const handleAssignDirectModule = (moduleId: string, studentIds: string[]) => {
    const res = classroomService.assignRemedialModule(moduleId, studentIds, selectedKelas);
    setActionToast(res.message);
    setTimeout(() => setActionToast(null), 4500);
    forceUpdate();
  };

  const forceUpdate = () => {
    setDataVersion(prev => prev + 1);
    if (onRefresh) onRefresh();
  };

  // Error patterns computed
  const errorPatterns = useMemo(() => {
    return classroomService.getAssignmentErrorPatterns(selectedKelas, selectedErrorSubjectFilter);
  }, [selectedKelas, selectedErrorSubjectFilter, dataVersion]);

  const filteredErrorPatterns = useMemo(() => {
    if (selectedErrorCategoryFilter === 'ALL') return errorPatterns;
    return errorPatterns.filter(p => p.category === selectedErrorCategoryFilter);
  }, [errorPatterns, selectedErrorCategoryFilter]);

  const specialInterventionStudents = useMemo(() => {
    return classroomService.getSpecialInterventionStudents(selectedKelas);
  }, [selectedKelas, dataVersion]);

  const filteredInterventionStudents = useMemo(() => {
    if (!interventionSearchQuery.trim()) return specialInterventionStudents;
    const q = interventionSearchQuery.toLowerCase();
    return specialInterventionStudents.filter(
      s => s.siswaNama.toLowerCase().includes(q) || s.nisn.includes(q) || s.criticalSubjects.some(cs => cs.toLowerCase().includes(q))
    );
  }, [specialInterventionStudents, interventionSearchQuery]);

  const remedialCatalog = useMemo(() => {
    return classroomService.getRemedialModuleCatalog();
  }, [dataVersion]);

  // 1. Get students lists based on role/selected class
  const students = useMemo(() => {
    const targetClass = isSiswa ? (account.KELAS || 'Kelas 1') : selectedKelas;
    return accountService.getStudents(targetClass);
  }, [selectedKelas, account.KELAS, isSiswa, dataVersion]);

  // 2. Fetch or calculate academic reports
  const studentReports = useMemo(() => {
    return students.map((s) => {
      return classroomService.getStudentReportCard(s.ID, s.NAMA, s.KELAS || selectedKelas);
    });
  }, [students, selectedKelas, dataVersion]);

  // Filter based on search query
  const filteredReports = useMemo(() => {
    return studentReports.filter((r) => {
      if (isSiswa && r.siswaId !== account.ID) return false;
      return r.siswaNama.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [studentReports, searchQuery, isSiswa, account.ID]);

  // 3. Overall Statistics
  const stats = useMemo(() => {
    if (studentReports.length === 0) {
      return { avgScore: 0, total: 0, remedialCount: 0, passRate: 0, topScorer: '-' };
    }
    const sum = studentReports.reduce((acc, curr) => acc + curr.nilaiAkhir, 0);
    const avgScore = Math.round(sum / studentReports.length);
    const remedialCount = studentReports.filter(r => r.nilaiAkhir < 75).length;
    const passRate = Math.round(((studentReports.length - remedialCount) / studentReports.length) * 100);

    // Find top scorer
    let topVal = -1;
    let topName = '-';
    studentReports.forEach(r => {
      if (r.nilaiAkhir > topVal) {
        topVal = r.nilaiAkhir;
        topName = r.siswaNama;
      }
    });

    return {
      avgScore,
      total: studentReports.length,
      remedialCount,
      passRate,
      topScorer: topVal >= 0 ? `${topName} (${topVal})` : '-'
    };
  }, [studentReports]);

  // 4. Data for recharts: Class Grade Distribution Categories
  const distributionData = useMemo(() => {
    let countBelow70 = 0;
    let count70To74 = 0;
    let count75To79 = 0;
    let count80To84 = 0;
    let count85To89 = 0;
    let count90Plus = 0;

    studentReports.forEach((r) => {
      const score = r.nilaiAkhir;
      if (score < 70) countBelow70++;
      else if (score < 75) count70To74++;
      else if (score < 80) count75To79++;
      else if (score < 85) count80To84++;
      else if (score < 90) count85To89++;
      else count90Plus++;
    });

    return [
      { name: '< 70 (Sangat Rendah)', count: countBelow70, fill: '#ef4444' },
      { name: '70 - 74 (Perlu Remedial)', count: count70To74, fill: '#f97316' },
      { name: '75 - 79 (Cukup)', count: count75To79, fill: '#eab308' },
      { name: '80 - 84 (Baik)', count: count80To84, fill: '#3b82f6' },
      { name: '85 - 89 (Sangat Baik)', count: count85To89, fill: '#06b6d4' },
      { name: '90 - 100 (Istimewa)', count: count90Plus, fill: '#10b981' },
    ];
  }, [studentReports]);

  // Pie chart data for remedial vs non-remedial
  const pieData = useMemo(() => {
    const remedial = stats.remedialCount;
    const passed = stats.total - remedial;
    return [
      { name: 'Tuntas KKM', value: passed, fill: '#10b981' },
      { name: 'Perlu Remedial', value: remedial, fill: '#f97316' },
    ];
  }, [stats]);

  // Individual Student chart data for compare
  const compareData = useMemo(() => {
    return studentReports.map((r) => ({
      name: r.siswaNama.split(' ')[0], // short name
      fullName: r.siswaNama,
      'Nilai Akhir': r.nilaiAkhir,
      'Rata-rata Tugas': r.nilaiTugas,
      'Rata-rata Kuis': r.nilaiKuis,
      'Tingkat Kehadiran (%)': r.presensiPct,
    }));
  }, [studentReports]);

  // Dynamic Radar Chart Data representing 6 P5 Karakter Dimensions for the selected class average
  const radarData = useMemo(() => {
    const baseVal = stats.avgScore || 78;
    return [
      { subject: 'Beriman & Bertakwa', Kompetensi: Math.min(100, Math.round(baseVal * 1.12)), fullMark: 100 },
      { subject: 'Kebinekaan Global', Kompetensi: Math.min(100, Math.round(baseVal * 0.98)), fullMark: 100 },
      { subject: 'Gotong Royong', Kompetensi: Math.min(100, Math.round(baseVal * 1.15)), fullMark: 100 },
      { subject: 'Kemandirian', Kompetensi: Math.min(100, Math.round(baseVal * 0.94)), fullMark: 100 },
      { subject: 'Bernalar Kritis', Kompetensi: Math.min(100, Math.round(baseVal * 1.05)), fullMark: 100 },
      { subject: 'Kreativitas', Kompetensi: Math.min(100, Math.round(baseVal * 1.02)), fullMark: 100 },
    ];
  }, [stats.avgScore]);

  // Load P5 active project for class
  const activeP5Project = useMemo(() => {
    return classroomService.getP5ProjectForClass(selectedKelas);
  }, [selectedKelas, dataVersion]);

  // Filtered P5 projects list based on selected dimension filter
  const filteredP5ProjectsList = useMemo(() => {
    const all = classroomService.getP5Projects();
    if (selectedP5DimensionFilter === 'ALL') return all;
    return all.filter((p) => {
      const dims = p.DIMENSI || [];
      return dims.some((d) => d.toLowerCase().includes(selectedP5DimensionFilter.toLowerCase()));
    });
  }, [selectedP5DimensionFilter, dataVersion]);

  const displayedP5Project = useMemo(() => {
    if (selectedP5DimensionFilter === 'ALL') return activeP5Project;
    return filteredP5ProjectsList[0] || activeP5Project;
  }, [filteredP5ProjectsList, activeP5Project, selectedP5DimensionFilter]);

  // Dedicated P5 Profil Pelajar Pancasila 6 Dimensions Recharts Radar Data
  const p5RadarComparisonData = useMemo(() => {
    const dimensionsList = [
      { key: 'Beriman & Bertakwa', label: 'Beriman & Bertakwa', icon: '🙏', desc: 'Akhlak kepada Tuhan YME, sesama manusia & alam semesta' },
      { key: 'Kebinekaan Global', label: 'Kebinekaan Global', icon: '🌍', desc: 'Menghargai keberagaman budaya & komunikasi interkultural' },
      { key: 'Gotong Royong', label: 'Gotong Royong', icon: '🤝', desc: 'Kolaborasi tim, kepedulian bersama, dan berbagi peran' },
      { key: 'Kemandirian', label: 'Kemandirian', icon: '🌟', desc: 'Prakarsa belajar mandiri, regulasi emosi & tanggung jawab' },
      { key: 'Bernalar Kritis', label: 'Bernalar Kritis', icon: '💡', desc: 'Menganalisis informasi, mengevaluasi fakta & penalaran logis' },
      { key: 'Kreativitas', label: 'Kreativitas', icon: '🎨', desc: 'Menghasilkan gagasan orisinal, karya inovatif & orisinalitas' },
    ];

    const ratingToScore = (r?: 'BB' | 'MB' | 'BSH' | 'SAB') => {
      switch (r) {
        case 'SAB': return 95;
        case 'BSH': return 85;
        case 'MB': return 70;
        case 'BB': return 50;
        default: return 82;
      }
    };

    return dimensionsList.map((dim) => {
      let totalClassScore = 0;
      let count = 0;
      let bshCount = 0;
      let sabCount = 0;
      let mbCount = 0;
      let bbCount = 0;

      students.forEach((s) => {
        const studentRatings = studentP5[s.ID];
        const rating = studentRatings ? studentRatings[dim.key] : 'BSH';
        const score = ratingToScore(rating);
        totalClassScore += score;
        count++;
        if (rating === 'SAB') sabCount++;
        else if (rating === 'BSH') bshCount++;
        else if (rating === 'MB') mbCount++;
        else if (rating === 'BB') bbCount++;
      });

      const classAvg = count > 0 ? Math.round(totalClassScore / count) : 82;

      let studentScore: number | undefined;
      let studentRating: 'BB' | 'MB' | 'BSH' | 'SAB' | undefined;
      if (selectedRadarStudentId !== 'ALL') {
        studentRating = studentP5[selectedRadarStudentId]?.[dim.key] || 'BSH';
        studentScore = ratingToScore(studentRating);
      }

      // Benchmark school average (baseline across classes)
      const schoolAvg = Math.min(95, Math.max(70, Math.round(classAvg * 0.97 + 2)));

      return {
        dimensi: dim.label,
        key: dim.key,
        icon: dim.icon,
        desc: dim.desc,
        'Capaian Kelas': classAvg,
        'Target Standar': 85,
        'Rata-Rata Sekolah': schoolAvg,
        ...(studentScore !== undefined ? { 'Siswa Terpilih': studentScore } : {}),
        studentRating,
        bshCount,
        sabCount,
        mbCount,
        bbCount,
        totalStudents: count,
        predikat: classAvg >= 92 ? 'SAB' : classAvg >= 80 ? 'BSH' : classAvg >= 65 ? 'MB' : 'BB',
      };
    });
  }, [students, studentP5, selectedRadarStudentId]);

  const selectedRadarStudent = useMemo(() => {
    if (selectedRadarStudentId === 'ALL') return null;
    return students.find((s) => s.ID === selectedRadarStudentId) || null;
  }, [students, selectedRadarStudentId]);

  // Contextual Teacher Tips & Analytics Engine
  const teacherTipsData = useMemo(() => {
    const allAssignments = classroomService.getAssignments();
    const courses = classroomService.getCourses();
    const classCourses = courses.filter(c => c.KODE_KELAS.includes(selectedKelas.replace(' ', '')) || c.KODE_KELAS.toLowerCase().includes(selectedKelas.toLowerCase().replace(' ', '')));
    const classCourseIds = classCourses.map(c => c.ID);

    // Get assignments for these courses
    const classAssignments = allAssignments.filter(a => classCourseIds.includes(a.COURSE_ID) || a.GURU_ID === account.ID);

    // 1. Calculate upcoming deadlines (within 30 days or any deadline in the future)
    const now = new Date();
    const upcomingAssignments = classAssignments.filter(a => {
      if (!a.DEADLINE) return false;
      const deadlineDate = new Date(a.DEADLINE);
      return deadlineDate >= now;
    }).sort((a, b) => new Date(a.DEADLINE).getTime() - new Date(b.DEADLINE).getTime());

    // 2. Identify low performing subjects based on course submissions
    const subjectPerformance: Record<string, { totalScore: number; count: number; name: string }> = {};
    
    classCourses.forEach(c => {
      subjectPerformance[c.ID] = { totalScore: 0, count: 0, name: c.NAMA };
    });

    const allSubmissions = classroomService.getSubmissions();
    allSubmissions.forEach(sub => {
      if (sub.NILAI !== undefined && subjectPerformance[sub.COURSE_ID]) {
        subjectPerformance[sub.COURSE_ID].totalScore += sub.NILAI;
        subjectPerformance[sub.COURSE_ID].count += 1;
      }
    });

    const lowPerformingSubjects: Array<{ id: string; name: string; avg: number }> = [];
    Object.entries(subjectPerformance).forEach(([courseId, data]) => {
      if (data.count > 0) {
        const avg = Math.round(data.totalScore / data.count);
        if (avg < 75) {
          lowPerformingSubjects.push({ id: courseId, name: data.name, avg });
        }
      }
    });

    // 3. Formulate smart, tailored tips based on data
    const tips: Array<{ id: string; type: 'DEADLINE' | 'PERFORMANCE' | 'ATTENDANCE' | 'GENERAL'; title: string; desc: string; severity: 'high' | 'medium' | 'info'; actionLabel?: string; actionType?: string }> = [];

    // Add upcoming deadline tips
    upcomingAssignments.slice(0, 2).forEach(asg => {
      const daysLeft = Math.ceil((new Date(asg.DEADLINE).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const mapelName = classCourses.find(c => c.ID === asg.COURSE_ID)?.NAMA || 'Mata Pelajaran';
      tips.push({
        id: `deadline-${asg.ID}`,
        type: 'DEADLINE',
        title: `Tenggat Dekat: ${asg.JUDUL}`,
        desc: `Tugas ${mapelName} akan berakhir dalam ${daysLeft} hari (${new Date(asg.DEADLINE).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}). Beritahukan siswa agar segera mengumpulkan sebelum tenggat waktu.`,
        severity: daysLeft <= 3 ? 'high' : 'medium',
        actionLabel: 'Kirim Pengingat',
        actionType: 'REMIND'
      });
    });

    // Add performance tips
    lowPerformingSubjects.forEach(sub => {
      tips.push({
        id: `perf-${sub.id}`,
        type: 'PERFORMANCE',
        title: `Mapel ${sub.name} Perlu Pendampingan`,
        desc: `Rata-rata kelas untuk ${sub.name} adalah ${sub.avg} (Target KKM: 75). Disarankan menjadwalkan kelas klinik sore atau membuat AI Remedial Worksheet khusus.`,
        severity: 'high',
        actionLabel: 'Buat Program Remedial',
        actionType: 'REMEDIAL'
      });
    });

    // If attendance is low
    const avgAttendance = stats.total > 0 ? Math.round(studentReports.reduce((acc, r) => acc + r.presensiPct, 0) / stats.total) : 95;
    if (avgAttendance < 92) {
      tips.push({
        id: 'att-low',
        type: 'ATTENDANCE',
        title: 'Evaluasi Kehadiran Kelas',
        desc: `Tingkat kehadiran rata-rata kelas saat ini ${avgAttendance}% (di bawah target ideal 95%). Berikan pendampingan wali kelas khusus untuk memotivasi siswa agar rajin hadir.`,
        severity: 'medium',
        actionLabel: 'Laporan Presensi',
        actionType: 'ATTENDANCE_REPORT'
      });
    }

    // Default general tips if empty
    if (tips.length === 0) {
      tips.push({
        id: 'gen-excellent',
        type: 'GENERAL',
        title: 'Kinerja Kelas Sangat Unggul!',
        desc: `Selamat! Seluruh subjek pengajaran dan kehadiran berada dalam koridor target mutu SDN Tangerang 6. Pertahankan dengan memberikan lencana penghargaan prestasi.`,
        severity: 'info',
        actionLabel: 'Berikan Penghargaan',
        actionType: 'APPRECIATE'
      });
    }

    return {
      upcomingAssignments,
      lowPerformingSubjects,
      avgAttendance,
      tips
    };
  }, [selectedKelas, studentReports, stats, account.ID]);

  const handleGenerateAITeacherTips = async () => {
    setAiTipsLoading(true);
    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Berikan 3 saran bimbingan pengajaran kontekstual untuk guru wali kelas ${selectedKelas} di SDN Tangerang 6 berdasarkan ringkasan data rapor kelas berikut:
- Jumlah Siswa: ${stats.total} orang
- Rata-rata Nilai Kelas: ${stats.avgScore}/100
- Jumlah Siswa di bawah KKM (75): ${stats.remedialCount} orang
- Tingkat Kelulusan KKM: ${stats.passRate}%
- Tingkat kehadiran rata-rata presensi: ${teacherTipsData.avgAttendance}%

Tolong buat tips pengajaran yang ramah anak, terstruktur ala Kurikulum Merdeka, singkat (maksimal 3 poin ringkas), serta sebutkan kearifan lokal Tangerang (seperti Festival Cisadane, Kuliner Laksa Tangerang, Danau Cipondoh, atau batik Tangerang) sebagai bentuk variasi kontekstual pembelajaran yang menarik bagi guru.`,
          assistantType: 'CLASSROOM_GURU',
          userRole: 'GURU',
          userName: account.NAMA
        })
      });

      if (!response.ok) throw new Error('Failed to generate AI tips');
      const data = await response.json();
      setAiGeneratedTips(data.reply || data.message || null);
    } catch (err) {
      // Premium offline fallback matching local context rules
      setTimeout(() => {
        setAiGeneratedTips(`🌟 **REKOMENDASI BELAJAR AI (SDN TANGERANG 6)**

1. **Apersepsi Berbasis Sungai Cisadane**: Rerata kelas saat ini ${stats.avgScore}. Untuk mempertahankan semangat, buat kuis kelompok bermateri muatan lokal sejarah festival Cisadane saat memulai kelas esok hari.
2. **Klinik Remedial Laksa**: Dengan ${stats.remedialCount} siswa di bawah KKM 75, adakan kelompok belajar terbimbing menggunakan peragaan nyata pembagian mangkuk Laksa Tangerang hangat agar siswa makin paham pecahan matematika dasar secara gembira.
3. **Penguatan Karakter P5**: Maksimalkan dimensi gotong royong dengan menunjuk siswa aktif memimpin kerja kelompok di Danau Cipondoh buatan kelas.`);
      }, 700);
    } finally {
      setAiTipsLoading(false);
    }
  };

  const handleExecuteTipAction = (actionType?: string, tipTitle?: string) => {
    if (actionType === 'REMIND') {
      classroomService.addNotification({
        USER_ID: 'ALL',
        KELAS: selectedKelas,
        TITLE: `🔔 Pengingat Tugas: ${tipTitle?.replace('Tenggat Dekat: ', '')}`,
        MESSAGE: `Semangat belajar! Bapak/Ibu Guru mengingatkan agar kalian tidak lupa mengumpulkan lembar tugas tepat waktu ya.`,
        TYPE: 'DEADLINE',
      });
      alert(`Sukses! Notifikasi pengingat otomatis untuk tugas "${tipTitle?.replace('Tenggat Dekat: ', '')}" telah dikirimkan ke seluruh siswa Kelas ${selectedKelas}!`);
      forceUpdate();
    } else if (actionType === 'REMEDIAL') {
      const lowStudents = studentReports.filter(r => r.nilaiAkhir < 75);
      if (lowStudents.length > 0) {
        const targetStudent = lowStudents[0];
        handleGenerateWorksheet(targetStudent.siswaNama, targetStudent.nilaiAkhir);
      } else {
        alert("Semua siswa saat ini tuntas di atas KKM!");
      }
    } else if (actionType === 'ATTENDANCE_REPORT') {
      alert(`Rekapitulasi persentase kehadiran (${teacherTipsData.avgAttendance}%) berhasil diunduh dan dipersiapkan untuk laporan paguyuban orang tua murid.`);
    } else if (actionType === 'APPRECIATE') {
      alert(`🎉 Selamat! Piagam apresiasi digital bintang emas "Siswa Teladan Pancasila" telah berhasil diposting ke mading portal kelas.`);
    }
  };

  // 5. Generate Kurikulum Merdeka AI Worksheet (Real Gemini assistant or realistic offline simulation)
  const handleGenerateWorksheet = async (studentName: string, currentScore: number) => {
    setIsGenerating(true);
    setWorksheetContent('');
    setRemedialStudent({ id: selectedStudentId || '', nama: studentName, score: currentScore });
    setRemedialModalOpen(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Buatlah Lembar Kegiatan Remedial format terstruktur Kurikulum Merdeka untuk siswa SD berikut:
Siswa: ${studentName} (Mata Pelajaran: ${remedialSubject}, Nilai saat ini: ${currentScore}/100)
Mata Pelajaran/Topik: ${remedialTopic}
Nama Sekolah: SDN Tangerang 6

Tolong susun dalam format bahasa Indonesia resmi:
1. Penjelasan konsep kunci secara sangat ramah anak SD (1 paragraf pendek yang interaktif, gunakan analogi sehari-hari di Tangerang).
2. 3 soal latihan adaptif (dari yang mudah sekali ke sedang) bertema kontekstual kearifan lokal Tangerang / Banten (misal: Sungai Cisadane, Danau Cipondoh, Kuliner Laksa, atau Benteng Heritage).
3. Hint (petunjuk bantuan) untuk membantu siswa menjawab setiap soal secara mandiri.`,
          assistantType: 'CLASSROOM_GURU',
          userRole: 'GURU',
          userName: account.NAMA
        })
      });

      if (!response.ok) throw new Error('Failed API call');
      const data = await response.json();
      setWorksheetContent(data.reply || data.message || '');
    } catch (err) {
      // Premium offline fallback matching local context rules
      setTimeout(() => {
        setWorksheetContent(`### 🌟 LEMBAR PENDAMPINGAN & EVALUASI REMEDIAL (KURIKULUM MERDEKA)
**UPT SATUAN PENDIDIKAN SDN TANGERANG 6**
*Tahun Pelajaran 2026/2027 - Program Intervensi Dini Capaian KKM*

* **Nama Peserta Didik:** ${studentName}
* **Rombongan Belajar:** ${selectedKelas}
* **Mata Pelajaran:** ${remedialSubject}
* **Materi / Topik Utama:** ${remedialTopic}
* **Skor Diagnostik Awal:** ${currentScore} / 100 (Kriteria Ketuntasan Minimal: 75)

---

#### 📘 Bagian 1: Mari Mengingat & Memahami Konsep!
Hai **${studentName}** yang cerdas! Jangan patah semangat ya. Yuk, kita ingat kembali konsep dasar tentang **${remedialTopic}**. 
Bayangkan kamu sedang berada di **Festival Sungai Cisadane** yang ramai di dekat sekolah kita. Paman pedagang memiliki beberapa bungkus **Laksa Tangerang** yang hangat dan lezat. Memahami konsep belajar ini sama menariknya dengan membagikan laksa tersebut secara adil ke meja teman-temanmu. Ingat, matematika dan pemecahan masalah selalu bekerja selangkah demi selangkah! Kita hanya perlu melihat angka atau tantangan secara perlahan dan gembira.

---

#### 📝 Bagian 2: Mari Berlatih (Tantangan Kontekstual Tangerang)

##### **Soal 1 (Tingkat Dasar - Penjumlahan Danau Cipondoh):**
Di tepi **Danau Cipondoh**, terdapat 14 perahu bebek berwarna hijau dan 18 perahu bebek berwarna merah muda yang disewa oleh pengunjung sekolah. Berapakah jumlah keseluruhan perahu bebek yang sedang berada di tepi danau tersebut?
* *Jawaban Siswa:* ............................................................
* *💡 Hint (Petunjuk):* Gunakan penjumlahan bersusun pendek. Jumlahkan satuannya terlebih dahulu (4 + 8 = 12, tulis 2 simpan 1), lalu tambahkan ke puluhannya (1 + 1 + 1).

##### **Soal 2 (Tingkat Menengah - Pembagian Kuliner Laksa):**
Ibu Guru membawa **27 piring emping khas Banten** untuk dibagikan secara merata kepada 3 kelompok belajar di kelasmu. Berapakah piring emping yang diterima oleh masing-masing kelompok siswa secara adil?
* *Jawaban Siswa:* ............................................................
* *💡 Hint (Petunjuk):* Pembagian adalah pembagian berulang. Kamu bisa membagi angka 27 dengan angka 3 secara beruntun sampai habis, atau mencari angka berapa yang jika dikalikan 3 menghasilkan 27.

##### **Soal 3 (Tingkat Penerapan - Nilai Tempat Pasar Lama):**
Di kawasan **Pasar Lama Tangerang**, terdapat sebuah gapura bertuliskan angka **408** tahun berdiri. Pada bilangan **408**, tentukan angka yang menempati nilai tempat **Ratusan**, **Puluhan**, dan **Satuan**!
* *Jawaban Siswa:*
  * Ratusan: .........
  * Puluhan: .........
  * Satuan: .........
* *💡 Hint (Petunjuk):* Nilai tempat selalu dibaca dari paling kanan: paling kanan adalah Satuan (8), tengah adalah Puluhan (0), dan paling kiri adalah Ratusan (4).

---

#### ✍️ Catatan Motivasi Guru:
*“Luar biasa, ${studentName}! Setiap langkah kecil perjuangan belajarmu hari ini akan membawamu meraih impian besar esok hari. Ibu/Bapak Guru selalu mendampingi dan bangga dengan usahamu!”*`);
      }, 700);
    } finally {
      setIsGenerating(false);
    }
  };

  // 6. Fast-Track Re-evaluation score save (Direct cache modification & re-load!)
  const handleSaveReEval = () => {
    if (!reEvalStudent) return;

    // Retrieve submissions for the student to update the lowest score to the new passing score
    const submissions = classroomService.getSubmissions(undefined, reEvalStudent.id);
    const gradedSubmissions = submissions.filter(s => s.STATUS === 'GRADED');

    if (gradedSubmissions.length > 0) {
      // Find the lowest score submission and update it to the passing score
      let lowestSub = gradedSubmissions[0];
      gradedSubmissions.forEach(s => {
        if ((s.NILAI || 0) < (lowestSub.NILAI || 0)) {
          lowestSub = s;
        }
      });

      // Grade submission via service
      classroomService.gradeSubmission(
        lowestSub.ID,
        newScore,
        `${reEvalNotes} (Dinilai ulang secara real-time pada ${new Date().toLocaleDateString('id-ID')})`,
        account.NAMA
      );

      setReEvalModalOpen(false);
      setReEvalStudent(null);
      forceUpdate();
    } else {
      // If no assignments exist, we can register a mock remedial submission so they can pass
      // Find any assignment for the course
      const courses = classroomService.getCourses();
      const assignments = classroomService.getAssignments(selectedKelas);
      
      if (assignments.length > 0 && courses.length > 0) {
        // Create student submission and auto grade it
        const newSub = classroomService.saveSubmission({
          ASSIGNMENT_ID: assignments[0].ID,
          COURSE_ID: courses[0].ID,
          SISWA_ID: reEvalStudent.id,
          SISWA_NAMA: reEvalStudent.nama,
          ISI: 'Melengkapi tugas evaluasi portofolio remedial mandiri dengan bimbingan khusus guru kelas.',
          STATUS: 'SUBMITTED'
        });

        classroomService.gradeSubmission(
          newSub.ID,
          newScore,
          reEvalNotes,
          account.NAMA
        );

        setReEvalModalOpen(false);
        setReEvalStudent(null);
        forceUpdate();
      } else {
        alert('Tidak ada materi tugas yang tersedia untuk diubah nilainya. Silakan tambahkan tugas/kuis terlebih dahulu di kelas ini.');
      }
    }
  };

  const downloadCSVReport = () => {
    const csvRows: string[] = [];
    csvRows.push(`LAPORAN DIAGNOSTIK ANALITIK KELAS - SDN TANGERANG 6`);
    csvRows.push(`Rombongan Belajar:;${selectedKelas}`);
    csvRows.push(`Tanggal Analisis:;${new Date().toLocaleDateString('id-ID')}`);
    csvRows.push(`Rata-rata Nilai Kelas:;${stats.avgScore}`);
    csvRows.push(`Tingkat Kelulusan KKM (%):;${stats.passRate}%`);
    csvRows.push(`Siswa Remedial:;${stats.remedialCount} Siswa`);
    csvRows.push(``);
    csvRows.push(`No;Nama Siswa;Nilai Rata Tugas;Nilai Rata Kuis;Nilai Akhir;Predikat;Keterangan;Status`);

    studentReports.forEach((r, idx) => {
      const status = r.nilaiAkhir >= 75 ? 'TUNTAS' : 'BUTUH REMEDIAL';
      csvRows.push(`${idx + 1};${r.siswaNama};${r.nilaiTugas};${r.nilaiKuis};${r.nilaiAkhir};${r.predikat};"${r.keterangan}";${status}`);
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Analitis_${selectedKelas.replace(' ', '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-4 py-4" id="dashboard-analitik-guru-container">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <TrendingUp size={16} />
            </span>
            <span className="text-[10px] font-black tracking-wider uppercase text-blue-700">Real-Time Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Analitik & Remedial Guru
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi distribusi kompetensi kelas, identifikasi intervensi dini siswa di bawah KKM, dan pembuatan materi remedial adaptif.
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isSiswa && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Kelas:</span>
              <select
                value={selectedKelas}
                onChange={(e) => {
                  setSelectedKelas(e.target.value);
                  setSelectedStudentId(null);
                }}
                className="text-xs font-black text-slate-800 bg-transparent border-none focus:ring-0 cursor-pointer pr-4"
              >
                {STANDARD_CLASSES.map((kls) => (
                  <option key={kls} value={kls}>{kls}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowSubjectKkmModal(true)}
            className="relative px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 bg-white rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
            title="Kelola Target KKM Per Mata Pelajaran"
          >
            <Target size={14} className="text-amber-600" />
            <span className="hidden sm:inline">Target KKM Mapel</span>
            {subjectAlerts.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded-full animate-pulse">
                {subjectAlerts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowMonthlyExecutivePdfModal(true)}
            disabled={isGeneratingMonthlyPdf}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Unduh Laporan Ringkasan Eksekutif Bulanan Performa Kelas & Roster Intervensi Khusus (PDF)"
          >
            {isGeneratingMonthlyPdf ? (
              <RefreshCw size={14} className="animate-spin text-blue-700" />
            ) : (
              <FileDown size={14} className="text-blue-700" />
            )}
            <span className="hidden sm:inline">
              {isGeneratingMonthlyPdf ? 'Menyusun...' : 'Laporan Bulanan (PDF)'}
            </span>
          </button>

          <button
            onClick={handleDownloadExecutivePdf}
            disabled={isGeneratingExecutivePdf}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50"
            title="Unduh Ringkasan Visual Analitik P5 & Tren Nilai Format PDF Eksekutif Kepala Sekolah"
          >
            {isGeneratingExecutivePdf ? (
              <RefreshCw size={14} className="animate-spin text-emerald-700" />
            ) : (
              <FileText size={14} className="text-emerald-700" />
            )}
            <span className="hidden sm:inline">
              {isGeneratingExecutivePdf ? 'Menyusun PDF...' : 'Laporan P5 & Tren (PDF)'}
            </span>
          </button>

          <button
            onClick={downloadCSVReport}
            className="p-2 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 bg-white rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
            title="Ekspor laporan analisa kelas ke format CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>
          
          <button
            onClick={() => forceUpdate()}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-2xs"
            title="Segarkan data analisis"
          >
            <RefreshCw size={14} className="animate-spin-slow" />
          </button>
        </div>
      </div>

      {/* PDF Generation Success Feedback */}
      <AnimatePresence>
        {executivePdfFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-center justify-between gap-3 text-emerald-900 shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={16} />
              </span>
              <span className="text-xs font-bold">{executivePdfFeedback}</span>
            </div>
            <button
              onClick={() => setExecutivePdfFeedback(null)}
              className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100/60"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}

        {actionToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 flex items-center justify-between gap-3 text-blue-900 shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-1 rounded-lg bg-blue-100 text-blue-700">
                <CheckCheck size={16} />
              </span>
              <span className="text-xs font-bold">{actionToast}</span>
            </div>
            <button
              onClick={() => setActionToast(null)}
              className="p-1 rounded-md text-blue-700 hover:bg-blue-100/60"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Alert Banner: Ambang Batas KKM Per Mata Pelajaran Turun */}
      <AnimatePresence>
        {!dismissAlertBanner && subjectAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-red-200 bg-linear-to-r from-red-50/95 via-amber-50/70 to-red-50/95 p-4 shadow-xs"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-red-100 text-red-700 mt-0.5 shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900">
                      Peringatan Target KKM: Rata-Rata Kelas Turun di Bawah Ambang
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 rounded-md">
                      {subjectAlerts.length} Mata Pelajaran Perlu Intervensi
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Rata-rata capaian belajar kelas <span className="font-bold text-slate-900">{selectedKelas}</span> untuk beberapa mata pelajaran berada di bawah target KKM yang telah Anda tetapkan. Perlu bimbingan remedial atau penyesuaian target KKM.
                  </p>

                  {/* Pills of low performing subjects */}
                  <div className="flex items-center gap-2 flex-wrap pt-1.5">
                    {subjectAlerts.map((alt) => (
                      <div
                        key={alt.subject}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 border border-red-200 rounded-lg text-xs shadow-2xs"
                      >
                        <span className="font-bold text-slate-800">{alt.subject}:</span>
                        <span className="font-black text-red-600">{alt.classAvg}</span>
                        <span className="text-[10px] text-slate-400">/ Target KKM {alt.targetKkm}</span>
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded">
                          (-{alt.shortfall} poin)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => setShowSubjectKkmModal(true)}
                  className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 hover:text-amber-800 hover:bg-amber-50 border border-slate-200 rounded-xl transition-all shadow-2xs flex items-center gap-1"
                >
                  <Target size={13} className="text-amber-600" />
                  Sesuaikan Target
                </button>
                <button
                  onClick={handleDownloadExecutivePdf}
                  className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-2xs flex items-center gap-1"
                >
                  <FileText size={13} />
                  Laporan Kepsek
                </button>
                <button
                  onClick={() => setDismissAlertBanner(true)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
                  title="Tutup banner peringatan"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigasi Utama */}
      <div className="flex border-b border-slate-200 flex-wrap">
        <button
          onClick={() => setActiveMainTab('AKADEMIK')}
          className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'AKADEMIK'
              ? 'border-indigo-600 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Analitik Akademik & Remedial
        </button>
        <button
          onClick={() => setActiveMainTab('POLA_KESALAHAN')}
          className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeMainTab === 'POLA_KESALAHAN'
              ? 'border-indigo-600 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Brain size={14} className="text-indigo-600" />
          Pola Kesalahan & Modul Remedial
          {errorPatterns.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-indigo-100 text-indigo-700">
              {errorPatterns.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveMainTab('ANALISIS_PERILAKU')}
          className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeMainTab === 'ANALISIS_PERILAKU'
              ? 'border-teal-600 text-teal-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HeartHandshake size={14} className="text-teal-600" />
          Widget Analisis Perilaku & Karakter
        </button>
        <button
          onClick={() => setActiveMainTab('P5_PROGRESS')}
          className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeMainTab === 'P5_PROGRESS'
              ? 'border-indigo-600 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award size={14} className="text-indigo-500" />
          Progress Proyek Karakter P5
        </button>
        <button
          onClick={() => setActiveMainTab('PROFIL_PANCASILA')}
          className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeMainTab === 'PROFIL_PANCASILA'
              ? 'border-indigo-600 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass size={14} className="text-indigo-500" />
          Radar Profil Pelajar Pancasila
        </button>
      </div>

      {activeMainTab === 'AKADEMIK' ? (
        <>
          {/* 2. Overview Stats Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${selectedKelas}-${dataVersion}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Rata-rata Kelas */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-2xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-700 shrink-0">
              <BarChart2 size={22} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata Kelas</span>
              <span className="block text-xl sm:text-2xl font-black text-slate-800 mt-0.5">{stats.avgScore}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">KKM Target: 75</span>
            </div>
          </div>

          {/* Total Siswa */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-2xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
              <Users size={22} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Siswa</span>
              <span className="block text-xl sm:text-2xl font-black text-slate-800 mt-0.5">{stats.total}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Siswa terdaftar aktif</span>
            </div>
          </div>

          {/* Butuh Remedial */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-2xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-50 text-orange-700 shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Butuh Remedial</span>
              <span className="block text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
                {stats.remedialCount} <span className="text-xs font-medium text-slate-400">({stats.passRate}% tuntas)</span>
              </span>
              <span className={`text-[9px] font-bold block mt-0.5 ${stats.remedialCount > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                {stats.remedialCount > 0 ? 'Butuh perhatian segera' : 'Semua siswa tuntas!'}
              </span>
            </div>
          </div>

          {/* Siswa Terbaik */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-2xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
              <Award size={22} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peringkat Teratas</span>
              <span className="block text-xs sm:text-sm font-black text-slate-800 mt-1.5 truncate max-w-[150px]">{stats.topScorer}</span>
              <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Capaian luar biasa</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 3. Main Analytics Panel Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column: Interactive Recharts Graphs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <BarChart2 size={16} className="text-blue-700" />
                  Visualisasi Distribusi & Kinerja Kompetensi
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Grafik dinamis real-time berdasarkan akumulasi penilaian tugas, kuis, dan keaktifan.
                </p>
              </div>

              {/* Chart Tabs */}
              <div className="flex items-center bg-slate-50 border border-slate-200 p-0.5 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full scrollbar-none">
                <button
                  onClick={() => setActiveChartTab('OVERVIEW')}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all whitespace-nowrap ${
                    activeChartTab === 'OVERVIEW' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Performa Siswa
                </button>
                <button
                  onClick={() => setActiveChartTab('DISTRIBUTION')}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all whitespace-nowrap ${
                    activeChartTab === 'DISTRIBUTION' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Distribusi KKM
                </button>
                <button
                  onClick={() => setActiveChartTab('DIAGNOSTIC')}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all whitespace-nowrap ${
                    activeChartTab === 'DIAGNOSTIC' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Korelasi Presensi
                </button>
                <button
                  onClick={() => setActiveChartTab('RADAR')}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all whitespace-nowrap ${
                    activeChartTab === 'RADAR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Radar P5
                </button>
              </div>
            </div>

            {/* Charts Output Area */}
            <div className="h-72 w-full pt-2 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedKelas}-${activeChartTab}-${dataVersion}`}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 240,
                    damping: 22,
                  }}
                  className="w-full h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    {activeChartTab === 'OVERVIEW' ? (
                      // Composed chart showing Nilai Akhir, Tugas and Kuis compared to KKM Line
                      <ComposedChart data={compareData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '11px', fontFamily: 'sans-serif' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        
                        {/* Background threshold area for KKM */}
                        <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Batas KKM (75)', fill: '#ef4444', fontSize: 10, fontWeight: 'bold', position: 'insideBottomRight' }} />
                        
                        <Bar dataKey="Nilai Akhir" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={35}>
                          {compareData.map((entry, index) => {
                            const isRemedial = (entry['Nilai Akhir'] as number) < 75;
                            return <Cell key={`cell-${index}`} fill={isRemedial ? '#f97316' : '#3b82f6'} />;
                          })}
                        </Bar>
                        <Line type="monotone" dataKey="Rata-rata Tugas" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Rata-rata Kuis" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
                      </ComposedChart>
                    ) : activeChartTab === 'DISTRIBUTION' ? (
                      // Bar chart of score distribution ranges
                      <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                        />
                        <Bar dataKey="count" name="Jumlah Siswa" radius={[6, 6, 0, 0]} maxBarSize={45}>
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : activeChartTab === 'DIAGNOSTIC' ? (
                      // Area chart showing correlation between Attendance Rate and Academic Score
                      <AreaChart data={compareData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <YAxis domain={[50, 100]} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="Tingkat Kehadiran (%)" stroke="#10b981" fill="#e6f4ea" strokeWidth={2} />
                        <Area type="monotone" dataKey="Nilai Akhir" stroke="#3b82f6" fill="#e8f0fe" strokeWidth={2} />
                      </AreaChart>
                    ) : (
                      // Radar Chart showing 6 P5 Pancasila Student Profile competencies with dynamic spring scale animation
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#cbd5e1" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 800, fill: '#475569' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                        <Radar
                          name="Kompetensi Rata-Rata Kelas"
                          dataKey="Kompetensi"
                          stroke="#6366f1"
                          fill="#818cf8"
                          fillOpacity={0.4}
                          isAnimationActive={true}
                          animationDuration={800}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                      </RadarChart>
                    )}
                  </ResponsiveContainer>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Explanatory notice */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2">
              <HelpCircle size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                * **Informasi Analitis**: Batas Kriteria Ketuntasan Minimal (KKM) yang ditetapkan SDN Tangerang 6 adalah **75**. Siswa dengan Nilai Akhir di bawah 75 ditandai dengan diagram batang berwarna oranye / merah dan secara otomatis terdaftar ke menu program intervensi remedial di sebelah kanan.
              </p>
            </div>
          </div>

          {/* 4. Complete Student Grade Sheet Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <FileText size={16} className="text-indigo-700" />
                  Lembar Nilai & Ketuntasan Siswa ({filteredReports.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Rincian nilai tugas mandiri, rata-rata ujian, dan status predikat rapor.
                </p>
              </div>

              {/* Table search filter */}
              <div className="relative max-w-xs w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama peserta didik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-slate-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full border-collapse text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-700 font-bold">
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3 text-center">Rerata Tugas</th>
                    <th className="p-3 text-center">Rerata Kuis</th>
                    <th className="p-3 text-center">Presensi</th>
                    <th className="p-3 text-center">Nilai Akhir</th>
                    <th className="p-3 text-center">Predikat</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        Tidak ada data siswa ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((r) => {
                      const isRemedial = r.nilaiAkhir < 75;
                      return (
                        <tr
                          key={r.siswaId}
                          onClick={() => setSelectedStudentId(r.siswaId)}
                          className={`hover:bg-slate-50/60 cursor-pointer transition-colors ${
                            selectedStudentId === r.siswaId ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-slate-800">{r.siswaNama}</td>
                          <td className="p-3 text-center font-semibold">{r.nilaiTugas}</td>
                          <td className="p-3 text-center font-semibold">{r.nilaiKuis}</td>
                          <td className="p-3 text-center font-semibold">{r.presensiPct}%</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md font-bold ${
                              isRemedial ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {r.nilaiAkhir}
                            </span>
                          </td>
                          <td className="p-3 text-center font-black text-slate-700">{r.predikat}</td>
                          <td className="p-3 text-center">
                            {isRemedial ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-orange-700 px-2 py-0.5 rounded bg-orange-100">
                                Butuh Intervensi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-700 px-2 py-0.5 rounded bg-emerald-100">
                                Tuntas
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Diagnostic & AI Remedial Action Center */}
        <div className="space-y-6">
          {/* ==================== TEACHER TIPS CENTER ==================== */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h3 className="text-xs font-black tracking-wider uppercase text-amber-800">Tips & Rekomendasi Guru</h3>
                  <h4 className="text-sm font-bold text-amber-950">Bimbingan Pintas Kelas ({teacherTipsData.tips.length})</h4>
                </div>
              </div>
              
              <button
                onClick={handleGenerateAITeacherTips}
                disabled={aiTipsLoading}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black text-[10px] transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                title="Gunakan kecerdasan buatan Gemini untuk menganalisis data rapor & menggenerasi tips kontekstual baru"
              >
                {aiTipsLoading ? (
                  <RefreshCw size={11} className="animate-spin" />
                ) : (
                  <Sparkles size={11} />
                )}
                <span>AI Analisis</span>
              </button>
            </div>

            {/* AI Tips Output Area or Calculated Local Tips */}
            <div className="space-y-3">
              {aiGeneratedTips ? (
                <div className="p-3.5 bg-white/90 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black tracking-wider uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Rekomendasi Pintas AI</span>
                    <button
                      onClick={() => setAiGeneratedTips(null)}
                      className="text-amber-500 hover:text-amber-700 text-[10px] font-black cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                  <p className="whitespace-pre-line font-medium text-[11px] text-slate-800">{aiGeneratedTips}</p>
                </div>
              ) : (
                teacherTipsData.tips.map((tip) => {
                  let alertStyle = 'bg-white border-amber-200 text-amber-900';
                  let iconBg = 'bg-amber-100 text-amber-700';
                  
                  if (tip.severity === 'high') {
                    alertStyle = 'bg-red-50/70 border-red-200 text-red-950';
                    iconBg = 'bg-red-100 text-red-700';
                  } else if (tip.severity === 'info') {
                    alertStyle = 'bg-emerald-50/70 border-emerald-200 text-emerald-950';
                    iconBg = 'bg-emerald-100 text-emerald-700';
                  }

                  return (
                    <div
                      key={tip.id}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all hover:scale-[1.01] shadow-2xs ${alertStyle}`}
                    >
                      <span className={`p-1.5 rounded-xl shrink-0 ${iconBg}`}>
                        {tip.type === 'DEADLINE' ? (
                          <FileText size={14} />
                        ) : tip.type === 'PERFORMANCE' ? (
                          <AlertTriangle size={14} />
                        ) : tip.type === 'ATTENDANCE' ? (
                          <Users size={14} />
                        ) : (
                          <Award size={14} />
                        )}
                      </span>
                      
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h5 className="text-xs font-black leading-tight">{tip.title}</h5>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">{tip.desc}</p>
                        
                        {tip.actionLabel && (
                          <button
                            onClick={() => handleExecuteTipAction(tip.actionType, tip.title)}
                            className="text-[10px] font-black text-indigo-700 hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer pt-0.5"
                          >
                            <span>{tip.actionLabel}</span>
                            <ArrowRight size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="p-1.5 rounded-lg bg-orange-600/20 text-orange-400">
                <AlertTriangle size={16} />
              </span>
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-orange-400">Pusat Intervensi Remedial</h3>
                <h4 className="text-sm font-bold text-slate-200">Deteksi Dini Kelulusan KKM</h4>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Berikut adalah daftar peserta didik dengan capaian kompetensi kumulatif di bawah **75 (KKM)**. Segera berikan pendampingan mandiri atau unduh Lembar Latihan Remedial adaptif.
            </p>

            {/* List of Remedial Required Students */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {studentReports.filter(r => r.nilaiAkhir < 75).length === 0 ? (
                <div className="p-6 text-center bg-slate-800/50 rounded-2xl border border-slate-800">
                  <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-black text-slate-300">Semua Siswa Tuntas KKM!</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tidak ada intervensi yang dibutuhkan saat ini.</p>
                </div>
              ) : (
                studentReports.filter(r => r.nilaiAkhir < 75).map((r) => (
                  <div
                    key={r.siswaId}
                    className="p-3.5 bg-slate-800 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black text-white">{r.siswaNama}</h4>
                        <div className="flex gap-2 items-center text-[9px] text-slate-400 mt-0.5">
                          <span>Tugas: <strong className="text-orange-400">{r.nilaiTugas}</strong></span>
                          <span>•</span>
                          <span>Kuis: <strong className="text-orange-400">{r.nilaiKuis}</strong></span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded text-[10px] font-bold shrink-0">
                        Skor: {r.nilaiAkhir}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 italic">
                      &ldquo;{r.keterangan}&rdquo;
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/50">
                      <button
                        onClick={() => {
                          setReEvalStudent({ id: r.siswaId, nama: r.siswaNama, currentScore: r.nilaiAkhir });
                          setNewScore(80);
                          setReEvalModalOpen(true);
                        }}
                        className="py-1.5 px-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                        title="Nilai ulang atau simulasikan pencapaian tuntas"
                      >
                        <RefreshCw size={11} /> Re-Evaluasi
                      </button>
                      <button
                        onClick={() => handleGenerateWorksheet(r.siswaNama, r.nilaiAkhir)}
                        className="py-1.5 px-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-white font-black text-[10px] flex items-center justify-center gap-1 transition-all shadow-md"
                      >
                        <Sparkles size={11} /> AI Worksheet
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Diagnostic Insights Bento Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              💡 Rekomendasi Tindakan Kelas
            </h4>
            
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-2">
                <span className="text-blue-600 text-sm font-bold mt-0.5">1.</span>
                <p className="text-[11px] leading-relaxed">
                  **Scaffolding Pendampingan**: Siswa yang memiliki rerata kuis rendah namun tugas tinggi disarankan diberikan penekanan pada ketahanan fokus ujian dan pemahaman membaca mandiri di portal CBT.
                </p>
              </div>

              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex gap-2">
                <span className="text-amber-600 text-sm font-bold mt-0.5">2.</span>
                <p className="text-[11px] leading-relaxed">
                  **Intervensi Orang Tua**: Untuk siswa dengan kehadiran kurang dari 90%, gunakan modul cetak **Export Student Report** untuk melampirkan portofolio ke orang tua guna meningkatkan akuntabilitas presensi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      ) : activeMainTab === 'POLA_KESALAHAN' ? (
        /* ==================== TAB ANALISIS POLA KESALAHAN & MODUL REMEDIAL ADAPTIF ==================== */
        <div className="space-y-6" id="analisis-pola-kesalahan-section">
          {/* Top Banner Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-800/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-black uppercase tracking-wider">
                  <Brain size={14} className="text-indigo-300 animate-pulse" />
                  Analisis Pola Kesalahan Tugas & Remedial Adaptif • Kurikulum Merdeka
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Diagnostik Miskonsepsi & Rekomendasi Modul Ajar ({selectedKelas})
                </h2>
                <p className="text-xs sm:text-sm text-indigo-200/80 max-w-2xl leading-relaxed">
                  Sistem secara otomatis menganalisis riwayat pengumpulan tugas, kuis CBT, dan rubrik asesmen harian siswa. Mengelompokkan materi yang paling sering salah, membedah miskonsepsi konsep dasar, serta menyarankan modul remedial adaptif siap ditugaskan.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setShowMonthlyExecutivePdfModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FileDown size={15} />
                  <span>Unduh Laporan Bulanan (PDF)</span>
                </button>
                <button
                  onClick={() => setShowSubjectKkmModal(true)}
                  className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Target size={14} className="text-amber-400" />
                  <span>Target KKM ({Object.keys(kkmTargets).length} Mapel)</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Cards inside Banner */}
            <div className="mt-5 pt-4 border-t border-indigo-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
                <span className="text-[10px] font-black text-indigo-300 uppercase block tracking-wider">Pola Terdeteksi</span>
                <span className="text-2xl font-black text-white mt-0.5 block">{errorPatterns.length} Pola</span>
                <span className="text-[10px] text-indigo-200/70 mt-0.5 block">{errorPatterns.filter(p => p.severity === 'TINGGI').length} Tingkat Kritis Tinggi</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
                <span className="text-[10px] font-black text-indigo-300 uppercase block tracking-wider">Kategori Dominan</span>
                <span className="text-2xl font-black text-amber-300 mt-0.5 block truncate">
                  {errorPatterns[0]?.category.replace('_', ' ') || 'Numerasi'}
                </span>
                <span className="text-[10px] text-indigo-200/70 mt-0.5 block">Tingkat Kesalahan {errorPatterns[0]?.errorRatePercent || 0}%</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
                <span className="text-[10px] font-black text-indigo-300 uppercase block tracking-wider">Intervensi Khusus</span>
                <span className="text-2xl font-black text-rose-300 mt-0.5 block">{specialInterventionStudents.length} Siswa</span>
                <span className="text-[10px] text-indigo-200/70 mt-0.5 block">Di Bawah Standar KKM 75</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
                <span className="text-[10px] font-black text-indigo-300 uppercase block tracking-wider">Katalog Modul</span>
                <span className="text-2xl font-black text-emerald-300 mt-0.5 block">{remedialCatalog.length} Modul</span>
                <span className="text-[10px] text-indigo-200/70 mt-0.5 block">Kurikulum Merdeka Banten</span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Filter size={13} /> Filter Mapel:
              </span>
              {['Semua', 'Matematika', 'Bahasa Indonesia', 'IPAS', 'Pendidikan Pancasila'].map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedErrorSubjectFilter(subj)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedErrorSubjectFilter === subj
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Kategori:</span>
              <select
                value={selectedErrorCategoryFilter}
                onChange={(e) => setSelectedErrorCategoryFilter(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="NUMERASI">Numerasi</option>
                <option value="LITERASI">Literasi</option>
                <option value="IPAS_SAINS">IPAS Sains</option>
                <option value="PENDIDIKAN_PANCASILA">Pendidikan Pancasila</option>
              </select>
            </div>
          </div>

          {/* Grid of Error Patterns and Matching Remedial Learning Modules */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  Daftar Pola Kesalahan Tugas & Rekomendasi Modul Ajar Remedial
                </h3>
                <p className="text-xs text-slate-500">
                  Dianalisis dari riwayat pengumpulan tugas, kuis, dan lembar kerja formatif rombel {selectedKelas}.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Menampilkan {filteredErrorPatterns.length} Pola
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredErrorPatterns.map((pattern) => {
                const matchingMod = remedialCatalog.find((m) => m.id === pattern.recommendedModuleId);

                return (
                  <div
                    key={pattern.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Card Header: Subject, Category, Severity */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                              {pattern.subject}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                              {pattern.category.replace('_', ' ')}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 leading-snug">
                            {pattern.topic}
                          </h4>
                        </div>

                        {/* Severity Badge */}
                        <div className="text-right shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                              pattern.severity === 'TINGGI'
                                ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse'
                                : pattern.severity === 'SEDANG'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                pattern.severity === 'TINGGI'
                                  ? 'bg-red-600'
                                  : pattern.severity === 'SEDANG'
                                  ? 'bg-amber-600'
                                  : 'bg-emerald-600'
                              }`}
                            />
                            {pattern.severity === 'TINGGI' ? 'Tingkat Kritis' : pattern.severity} ({pattern.errorRatePercent}%)
                          </span>
                        </div>
                      </div>

                      {/* Misconception Analysis Details */}
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                          <Lightbulb size={14} className="text-amber-600" />
                          <span>Akar Miskonsepsi Siswa:</span>
                        </div>
                        <p className="text-xs text-amber-950/80 leading-relaxed">
                          {pattern.misconceptionDetails}
                        </p>
                      </div>

                      {/* Affected Students list */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <Users size={13} className="text-slate-500" />
                            Siswa Terdampak ({pattern.affectedStudents.length} Siswa di Bawah KKM 75):
                          </span>
                          <span className="text-[10px] text-slate-400">Skor Diagnostik</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {pattern.affectedStudents.map((aff) => (
                            <span
                              key={aff.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800"
                            >
                              <span>{aff.nama}</span>
                              <span className="px-1.5 py-0.2 rounded font-black text-[10px] bg-red-100 text-red-700">
                                {aff.score}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Matching Recommended Remedial Module Banner */}
                      {matchingMod && (
                        <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                              <BookOpen size={12} /> Modul Ajar Remedial Direkomendasikan
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                              {matchingMod.format} • {matchingMod.estimatedMinutes} Menit
                            </span>
                          </div>
                          <h5 className="text-xs font-black text-slate-900">
                            {matchingMod.title}
                          </h5>
                          <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                            {matchingMod.targetCompetency}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          if (matchingMod) setPreviewRemedialModule(matchingMod);
                        }}
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 bg-white border border-slate-200 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye size={13} /> Pratinjau Modul LKPD
                      </button>

                      <button
                        onClick={() => handleAssignPatternModule(pattern)}
                        className="px-4 py-2 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Send size={13} /> Tugaskan ke Siswa ({pattern.affectedStudents.length})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Dedicated Special Intervention Roster Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-red-100 text-red-700">
                    <ShieldAlert size={16} />
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    Daftar Siswa Memerlukan Intervensi Khusus (Special Intervention Roster)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Daftar siswa yang memerlukan pendampingan klinik remedial individual berdasarkan agregasi riwayat tugas di bawah KKM 75.
                </p>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={interventionSearchQuery}
                    onChange={(e) => setInterventionSearchQuery(e.target.value)}
                    placeholder="Cari siswa atau NISN..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60"
                  />
                </div>
                <button
                  onClick={() => setShowMonthlyExecutivePdfModal(true)}
                  className="px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Printer size={13} /> Cetak Roster
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-black uppercase text-slate-400 bg-slate-50/70">
                    <th className="p-3">No</th>
                    <th className="p-3">Siswa & NISN</th>
                    <th className="p-3 text-center">Rata-rata Nilai</th>
                    <th className="p-3">Mapel Kritis</th>
                    <th className="p-3">Pola Miskonsepsi Terdeteksi</th>
                    <th className="p-3">Rencana Strategi Pendampingan</th>
                    <th className="p-3 text-center">Status Remedial</th>
                    <th className="p-3 text-right">Aksi Tindak Lanjut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredInterventionStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        Tidak ada siswa yang memerlukan intervensi khusus. Seluruh capaian berada di atas target KKM.
                      </td>
                    </tr>
                  ) : (
                    filteredInterventionStudents.map((st, idx) => (
                      <tr key={st.siswaId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-bold text-slate-400 text-center">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-black text-slate-900">{st.siswaNama}</div>
                          <div className="text-[10px] text-slate-400">NISN: {st.nisn} • {st.kelas}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-md font-black text-red-700 bg-red-100 text-xs">
                            {st.averageScore}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">KKM: 75</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {st.criticalSubjects.map((cs) => (
                              <span key={cs} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                {cs}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="text-[11px] text-slate-700 font-medium line-clamp-2">
                            {st.frequentErrorPatterns.join(', ') || 'Pemahaman Konsep Nilai Tempat'}
                          </div>
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="text-[11px] text-slate-600 leading-relaxed">
                            {st.interventionStrategy}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              st.status === 'SEDANG_REMEDIAL'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {st.status === 'SEDANG_REMEDIAL' ? 'Sedang Remedial' : 'Perlu Pendampingan'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                handleGenerateWorksheet(st.siswaNama, st.averageScore);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all cursor-pointer"
                              title="Buat Lembar Remedial AI"
                            >
                              Buat LKPD
                            </button>
                            <button
                              onClick={() => {
                                setReEvalStudent({ id: st.siswaId, nama: st.siswaNama, currentScore: st.averageScore });
                                setNewScore(80);
                                setReEvalModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer"
                              title="Evaluasi Ulang Pasca Bimbingan"
                            >
                              Re-Evaluasi
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
        </div>
      ) : activeMainTab === 'ANALISIS_PERILAKU' ? (
        <div className="space-y-6">
          <BehaviorAnalysisWidget
            currentClass={selectedKelas}
            currentUser={account}
          />
        </div>
      ) : activeMainTab === 'P5_PROGRESS' ? (
        <div className="space-y-6">
          {/* Interactive D3.js P5 Radar Chart Widget */}
          <P5RadarChartWidget />

          {/* A. P5 Active Project Header & Milestone Tracker with Dimension Filter */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/60 pb-3">
              <div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[10px] font-black uppercase tracking-wider animate-pulse">
                  Proyek Penguatan Profil Pelajar Pancasila (P5) • Live Tracker
                </span>
                <h2 className="text-lg sm:text-xl font-black mt-2 tracking-tight text-white">
                  {displayedP5Project.JUDUL}
                </h2>
                <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                  {displayedP5Project.DESKRIPSI} ({displayedP5Project.TEMA})
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                {/* Dimension Filter Dropdown */}
                <div className="flex items-center gap-1.5 bg-slate-900/90 border border-indigo-500/30 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 shadow-sm">
                  <Filter size={14} className="text-indigo-400" />
                  <span>Filter Dimensi:</span>
                  <select
                    value={selectedP5DimensionFilter}
                    onChange={(e) => setSelectedP5DimensionFilter(e.target.value)}
                    className="bg-transparent font-bold text-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="ALL" className="bg-slate-900 text-white">Semua Dimensi</option>
                    <option value="Beriman" className="bg-slate-900 text-white">Beriman & Bertakwa</option>
                    <option value="Kebinekaan" className="bg-slate-900 text-white">Kebinekaan Global</option>
                    <option value="Gotong" className="bg-slate-900 text-white">Gotong Royong</option>
                    <option value="Mandiri" className="bg-slate-900 text-white">Kemandirian</option>
                    <option value="Bernalar" className="bg-slate-900 text-white">Bernalar Kritis</option>
                    <option value="Kreatif" className="bg-slate-900 text-white">Kreativitas</option>
                  </select>
                </div>

                <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center min-w-[110px]">
                  <span className="block text-[10px] font-extrabold text-indigo-300 uppercase">Progress Proyek</span>
                  <span className="block text-2xl font-black text-amber-300 mt-0.5">{displayedP5Project.PERCENTAGE}%</span>
                </div>
              </div>
            </div>

            {/* Project Stages Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              {displayedP5Project.STAGES.map((stg) => {
                const isSelesai = stg.STATUS === 'SELESAI';
                const isOtw = stg.STATUS === 'SEDANG_BERJALAN';
                return (
                  <div
                    key={stg.ID}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelesai
                        ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-100'
                        : isOtw
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-100 ring-1 ring-amber-500/20'
                        : 'bg-white/5 border-white/5 text-white/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold tracking-wider">{stg.NAME}</span>
                      <button
                        onClick={() => {
                          const nextStatus = isSelesai ? 'BELUM_MULAI' : isOtw ? 'SELESAI' : 'SEDANG_BERJALAN';
                          classroomService.updateP5StageStatus(displayedP5Project.ID, stg.ID, nextStatus, account.NAMA);
                          forceUpdate();
                        }}
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          isSelesai
                            ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40'
                            : isOtw
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/40'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                        title="Klik untuk mengubah status tahapan"
                      >
                        {isSelesai ? 'Selesai ✓' : isOtw ? 'Otw ➜' : 'Mulai'}
                      </button>
                    </div>
                    <p className="text-[9px] text-white/60 mt-1 leading-snug truncate">{stg.DESCRIPTION}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* B. Student P5 Matrix & Dimensions Marker */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Award size={16} className="text-indigo-700" />
                  Lembar Penilaian & Pencapaian Dimensi Karakter Siswa ({students.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ketuk nilai dimensi siswa secara berkala untuk memantau perkembangan profil pelajar pancasila.
                </p>
              </div>

              {/* Toolbar Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const confirmMark = window.confirm("Tandai semua nilai dimensi siswa di kelas ini sebagai BSH (Berkembang Sesuai Harapan)?");
                    if (confirmMark) {
                      const updated = { ...studentP5 };
                      students.forEach(s => {
                        updated[s.ID] = {
                          'Beriman & Bertakwa': 'BSH',
                          'Kebinekaan Global': 'BSH',
                          'Gotong Royong': 'BSH',
                          'Kemandirian': 'BSH',
                          'Bernalar Kritis': 'BSH',
                          'Kreativitas': 'BSH',
                        };
                      });
                      setStudentP5(updated);
                      localStorage.setItem('BB_CLASSROOM_STUDENT_P5_ACHIEVEMENTS_V1', JSON.stringify(updated));
                      forceUpdate();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  Tandai Semua BSH
                </button>

                <div className="relative max-w-xs w-full">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama peserta didik..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* P5 Legends */}
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px]">
              <span className="font-extrabold text-slate-500 uppercase mr-1">Petunjuk Kompetensi P5:</span>
              <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">BB (Belum Berkembang)</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">MB (Mulai Berkembang)</span>
              <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">BSH (Berkembang Sesuai Harapan)</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">SAB (Sangat Berkembang)</span>
            </div>

            {/* Matrix Board */}
            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full border-collapse text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-700 font-bold">
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3 text-center">Beriman & Bertakwa</th>
                    <th className="p-3 text-center">Kebinekaan Global</th>
                    <th className="p-3 text-center">Gotong Royong</th>
                    <th className="p-3 text-center">Kemandirian</th>
                    <th className="p-3 text-center">Bernalar Kritis</th>
                    <th className="p-3 text-center">Kreativitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {students.filter(s => s.NAMA.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        Tidak ada data siswa ditemukan.
                      </td>
                    </tr>
                  ) : (
                    students
                      .filter(s => s.NAMA.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((s) => {
                        const achievements = studentP5[s.ID] || {
                          'Beriman & Bertakwa': 'BSH',
                          'Kebinekaan Global': 'MB',
                          'Gotong Royong': 'BSH',
                          'Kemandirian': 'BSH',
                          'Bernalar Kritis': 'MB',
                          'Kreativitas': 'MB',
                        };

                        const dimensions = [
                          'Beriman & Bertakwa',
                          'Kebinekaan Global',
                          'Gotong Royong',
                          'Kemandirian',
                          'Bernalar Kritis',
                          'Kreativitas',
                        ];

                        return (
                          <tr key={s.ID} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3 font-bold text-slate-800">{s.NAMA}</td>
                            {dimensions.map((dim) => {
                              const rating = achievements[dim] || 'BSH';
                              
                              // cyclic toggle: BB -> MB -> BSH -> SAB -> BB
                              const handleCycle = () => {
                                const nextRating =
                                  rating === 'BB'
                                    ? 'MB'
                                    : rating === 'MB'
                                    ? 'BSH'
                                    : rating === 'BSH'
                                    ? 'SAB'
                                    : 'BB';
                                updateStudentP5Dimension(s.ID, dim, nextRating);
                              };

                              let badgeStyle = '';
                              if (rating === 'BB') badgeStyle = 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100';
                              if (rating === 'MB') badgeStyle = 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100';
                              if (rating === 'BSH') badgeStyle = 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100';
                              if (rating === 'SAB') badgeStyle = 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100';

                              return (
                                <td key={dim} className="p-3 text-center">
                                  <button
                                    onClick={handleCycle}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer shadow-2xs ${badgeStyle}`}
                                    title="Ketuk untuk mengubah predikat P5"
                                  >
                                    {rating}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== TAB PROFIL PELAJAR PANCASILA (RECHARTS RADAR CHART) ==================== */
        <div className="space-y-6">
          {/* Top Banner Card */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-800/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-black uppercase tracking-wider">
                  <Compass size={14} className="animate-spin-slow" />
                  Visualisasi Radar Dimensi P5 • Recharts Engine
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Radar Capaian Profil Pelajar Pancasila ({selectedKelas})
                </h2>
                <p className="text-xs sm:text-sm text-indigo-200/80 max-w-2xl leading-relaxed">
                  Evaluasi holistik komparatif lintas 6 Dimensi Profil Pelajar Pancasila Kurikulum Merdeka.
                  Bandingkan capaian rata-rata kelas, target standar nasional (85%), dan profil perkembangan per siswa.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowDailyLogModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <BookOpen size={16} />
                  <span>Log Jurnal Harian P5</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                    {classroomService.getP5DailyLogs(selectedKelas).length}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Dimension Pills */}
            <div className="mt-5 pt-4 border-t border-indigo-800/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {p5RadarComparisonData.map((d) => (
                <div
                  key={d.key}
                  className="bg-white/5 border border-white/10 rounded-2xl p-2.5 backdrop-blur-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-base">{d.icon}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        d.predikat === 'SAB'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : d.predikat === 'BSH'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : d.predikat === 'MB'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {d.predikat}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-[11px] font-bold text-slate-200 truncate" title={d.dimensi}>
                      {d.dimensi}
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base font-black text-white">{d['Capaian Kelas']}</span>
                      <span className="text-[10px] text-indigo-300">/ 100</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Filters & Radar Chart Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Recharts Radar Chart */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Target size={18} className="text-indigo-600" />
                    Spider Diagram Komparasi 6 Dimensi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Skala 0–100 (BB: 50, MB: 70, BSH: 85, SAB: 95)
                  </p>
                </div>

                {/* Benchmark toggles */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowTargetBenchmark(!showTargetBenchmark)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                      showTargetBenchmark
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    Target Standar (85%)
                  </button>

                  <button
                    onClick={() => setShowSchoolBenchmark(!showSchoolBenchmark)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                      showSchoolBenchmark
                        ? 'bg-sky-50 text-sky-800 border-sky-300'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                    Rata-Rata Sekolah
                  </button>
                </div>
              </div>

              {/* Individual Student Filter */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">Filter Overlay Siswa:</span>
                </div>
                <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                  <select
                    value={selectedRadarStudentId}
                    onChange={(e) => setSelectedRadarStudentId(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">Semua Siswa (Hanya Rata-rata Kelas)</option>
                    {students.map((s) => (
                      <option key={s.ID} value={s.ID}>
                        {s.NAMA} ({s.ID})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* D3 Native SVG Radar Chart Widget */}
              <div className="w-full h-[400px] flex items-center justify-center pt-2">
                <P5RadarChartWidget className="w-full h-full" studentClass={selectedKelas} />
              </div>
            </div>

            {/* Right: Comparative Insights & Pedagogical Recommendations */}
            <div className="lg:col-span-4 space-y-4">
              {/* Selected Student Profile Card if one is chosen */}
              {selectedRadarStudent ? (
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-5 border border-pink-200/80 shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-pink-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-pink-500/20">
                      {selectedRadarStudent.NAMA.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-pink-600 tracking-wider">
                        Profil Siswa Terpilih
                      </span>
                      <h4 className="text-sm font-black text-slate-900">{selectedRadarStudent.NAMA}</h4>
                      <p className="text-[11px] text-slate-500">ID Siswa: {selectedRadarStudent.ID}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-pink-200/60">
                    <div className="text-[11px] font-bold text-slate-700">Rincian Nilai Capaian:</div>
                    {p5RadarComparisonData.map((d) => (
                      <div key={d.key} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <span>{d.icon}</span>
                          <span className="truncate max-w-[130px]">{d.dimensi}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{d['Siswa Terpilih']}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                              d.studentRating === 'SAB'
                                ? 'bg-emerald-100 text-emerald-800'
                                : d.studentRating === 'BSH'
                                ? 'bg-blue-100 text-blue-800'
                                : d.studentRating === 'MB'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {d.studentRating}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Dimension Strengths & Growth Areas */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Analisis Kekuatan & Area Pertumbuhan
                </h4>

                {(() => {
                  const sorted = [...p5RadarComparisonData].sort((a, b) => b['Capaian Kelas'] - a['Capaian Kelas']);
                  const highest = sorted[0];
                  const lowest = sorted[sorted.length - 1];

                  return (
                    <div className="space-y-3">
                      {/* Top Dimension */}
                      <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                            🌟 Dimensi Paling Unggul
                          </span>
                          <span className="text-xs font-black text-emerald-800">{highest['Capaian Kelas']}%</span>
                        </div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{highest.icon}</span>
                          <span>{highest.dimensi}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Siswa {selectedKelas} menunjukkan penguasaan sangat baik dalam dimensi ini. Jadikan modal untuk proyek lintas mapel!
                        </p>
                      </div>

                      {/* Lowest Dimension */}
                      <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                            🎯 Perlu Penguatan Lebih Lanjut
                          </span>
                          <span className="text-xs font-black text-amber-800">{lowest['Capaian Kelas']}%</span>
                        </div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{lowest.icon}</span>
                          <span>{lowest.dimensi}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Tingkatkan pembiasaan sehari-hari dan integrasikan tugas proyek P5 dengan fokus penguatan dimensi {lowest.dimensi}.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Rubric Explanation Legend */}
              <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/80 space-y-2.5">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Award size={14} className="text-indigo-600" />
                  Rubrik Penilaian Karakter P5
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-black text-emerald-700">SAB</span>
                    <p className="text-[10px] text-slate-500">Sangat Berkembang (90-100)</p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-black text-blue-700">BSH</span>
                    <p className="text-[10px] text-slate-500">Berkembang Sesuai Harapan (80-89)</p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-black text-amber-700">MB</span>
                    <p className="text-[10px] text-slate-500">Mulai Berkembang (65-79)</p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-black text-rose-700">BB</span>
                    <p className="text-[10px] text-slate-500">Belum Berkembang (&lt;65)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dimension Detailed Cards Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Layers size={18} className="text-indigo-600" />
                Rincian Evaluasi 6 Dimensi Karakter Siswa
              </h3>
              <span className="text-xs text-slate-500 font-bold">
                {students.length} Siswa Terdaftar di {selectedKelas}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {p5RadarComparisonData.map((dim) => {
                const pct = dim['Capaian Kelas'];
                return (
                  <div
                    key={dim.key}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl">
                            {dim.icon}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">{dim.dimensi}</h4>
                            <p className="text-[10px] text-slate-400 leading-tight line-clamp-1">{dim.desc}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-black shrink-0 ${
                            dim.predikat === 'SAB'
                              ? 'bg-emerald-100 text-emerald-800'
                              : dim.predikat === 'BSH'
                              ? 'bg-blue-100 text-blue-800'
                              : dim.predikat === 'MB'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {dim.predikat}
                        </span>
                      </div>

                      {/* Score bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="text-slate-500 font-medium">Skor Rata-rata</span>
                          <span className="font-black text-slate-900 text-sm">{pct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct >= 85
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                : pct >= 75
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                : pct >= 65
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                : 'bg-gradient-to-r from-rose-500 to-red-500'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Student count tally */}
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-4 gap-1 text-center">
                      <div className="p-1.5 bg-emerald-50/70 rounded-xl">
                        <div className="text-[10px] text-emerald-700 font-bold">SAB</div>
                        <div className="text-xs font-black text-emerald-900">{dim.sabCount}</div>
                      </div>
                      <div className="p-1.5 bg-blue-50/70 rounded-xl">
                        <div className="text-[10px] text-blue-700 font-bold">BSH</div>
                        <div className="text-xs font-black text-blue-900">{dim.bshCount}</div>
                      </div>
                      <div className="p-1.5 bg-amber-50/70 rounded-xl">
                        <div className="text-[10px] text-amber-700 font-bold">MB</div>
                        <div className="text-xs font-black text-amber-900">{dim.mbCount}</div>
                      </div>
                      <div className="p-1.5 bg-rose-50/70 rounded-xl">
                        <div className="text-[10px] text-rose-700 font-bold">BB</div>
                        <div className="text-xs font-black text-rose-900">{dim.bbCount}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== AI WORKSHEET MODAL ==================== */}
      <AnimatePresence>
        {remedialModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-orange-500 animate-pulse" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      AI Lembar Kerja Remedial Adaptif
                    </h3>
                    <p className="text-[10px] text-slate-400">Teknologi Kurikulum Merdeka - SDN Tangerang 6</p>
                  </div>
                </div>
                <button
                  onClick={() => setRemedialModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Subject & Topic Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Mata Pelajaran</label>
                  <select
                    value={remedialSubject}
                    onChange={(e) => setRemedialSubject(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Matematika & Numerasi">Matematika & Numerasi</option>
                    <option value="Tematik (Bahasa Indonesia)">Tematik (Bahasa Indonesia)</option>
                    <option value="IPAS & Ilmu Alam">IPAS & Ilmu Alam</option>
                    <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Topik Utama</label>
                  <input
                    type="text"
                    value={remedialTopic}
                    onChange={(e) => setRemedialTopic(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    placeholder="Contoh: Operasi Penjumlahan & Nilai Tempat"
                  />
                </div>
              </div>

              {/* Action Regenerate */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleGenerateWorksheet(remedialStudent?.nama || '', remedialStudent?.score || 60)}
                  disabled={isGenerating}
                  className="px-4 py-2 text-xs font-black bg-slate-900 text-white rounded-xl flex items-center gap-1 hover:bg-slate-800 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} />
                  {isGenerating ? 'Menghasilkan...' : 'Regenerasi Lembar Kerja'}
                </button>
              </div>

              {/* Worksheet display */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-h-96 overflow-y-auto font-mono text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Sparkles size={32} className="text-orange-500 animate-spin" />
                    <p className="font-bold text-xs text-slate-600 animate-pulse">Merumuskan lembar evaluasi adaptif ramah anak...</p>
                  </div>
                ) : (
                  worksheetContent
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">
                  * Cetak langsung atau salin teks untuk lembar evaluasi fisik siswa.
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const printWin = window.open('', '_blank');
                      if (printWin) {
                        printWin.document.write(`<html><head><title>Lembar Remedial - ${remedialStudent?.nama}</title><style>body { font-family: monospace; padding: 40px; line-height: 1.6; }</style></head><body>${worksheetContent.replace(/\n/g, '<br>')}</body></html>`);
                        printWin.document.close();
                        printWin.print();
                      }
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 bg-white rounded-xl flex items-center gap-1"
                  >
                    <Printer size={13} /> Cetak Lembar Kerja
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(worksheetContent);
                      alert('Lembar kerja berhasil disalin ke clipboard!');
                    }}
                    className="px-4 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1 shadow-sm"
                  >
                    Salin Teks
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== RE-EVALUATION MODAL ==================== */}
      <AnimatePresence>
        {reEvalModalOpen && reEvalStudent && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <RefreshCw size={18} className="text-blue-600" />
                  Fast-Track Re-Evaluasi Siswa
                </h3>
                <button
                  onClick={() => setReEvalModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Masukan nilai perbaikan pasca pelaksanaan kegiatan remedial atau pendampingan adaptif untuk **{reEvalStudent.nama}**. Nilai ini akan menggantikan tugas terendah siswa dan memperbarui grafik visual analitis secara langsung.
                </p>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Skor Baru Hasil Remedial</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newScore}
                    onChange={(e) => setNewScore(Number(e.target.value))}
                    className="w-full text-base font-black px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Saran: Minimal 75 untuk memenuhi target KKM.</span>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Catatan Kelulusan / Remedial</label>
                  <textarea
                    rows={2}
                    value={reEvalNotes}
                    onChange={(e) => setReEvalNotes(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    placeholder="Contoh: Lulus pasca intervensi remedial modul matematika"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setReEvalModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveReEval}
                  className="px-5 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Save size={14} /> Simpan Perubahan Nilai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* P5 Daily Journal & Feedback Modal */}
      <P5DailyLogModal
        isOpen={showDailyLogModal}
        onClose={() => setShowDailyLogModal(false)}
        account={account}
        initialKelas={selectedKelas}
        project={displayedP5Project}
      />

      {/* ==================== SUBJECT KKM TARGET CONFIGURATION MODAL ==================== */}
      <AnimatePresence>
        {showSubjectKkmModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                    <Target size={18} />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Kelola Target KKM Per Mata Pelajaran
                    </h3>
                    <p className="text-xs text-slate-500">
                      Atur ambang batas minimum capaian KKM per mapel untuk rombel {selectedKelas}.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSubjectKkmModal(false)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">Sistem Notifikasi Pintar:</span> Jika rata-rata nilai kelas untuk mata pelajaran turun di bawah target KKM yang ditetapkan, sistem otomatis menyalakan peringatan intervensi remedial di dashboard serta mencatat notifikasi tindak lanjut.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.keys(kkmTargets).map((subject) => {
                    const currentAvg = classroomService.getSubjectClassAverage(selectedKelas, subject);
                    const targetVal = kkmTargets[subject] ?? 75;
                    const isBelow = currentAvg < targetVal;
                    const delta = currentAvg - targetVal;

                    return (
                      <div
                        key={subject}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isBelow
                            ? 'bg-red-50/60 border-red-200 shadow-2xs'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{subject}</h4>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                              <span>Rata-rata:</span>
                              <span className={`font-black ${isBelow ? 'text-red-600' : 'text-emerald-700'}`}>
                                {currentAvg}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                isBelow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {isBelow ? `(-${targetVal - currentAvg})` : `(+${delta})`}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Target KKM</span>
                            <span className="text-base font-black text-slate-900">{targetVal}</span>
                          </div>
                        </div>

                        {/* Slider / Stepper */}
                        <div className="space-y-1.5 pt-1">
                          <input
                            type="range"
                            min="60"
                            max="90"
                            step="1"
                            value={targetVal}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setKkmTargets(prev => ({ ...prev, [subject]: val }));
                            }}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                          />
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                            <span>60</span>
                            <div className="flex gap-1">
                              {[70, 75, 78, 80].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setKkmTargets(prev => ({ ...prev, [subject]: preset }))}
                                  className={`px-1.5 py-0.5 text-[9px] rounded font-bold transition-all ${
                                    targetVal === preset
                                      ? 'bg-amber-200 text-amber-900 font-extrabold'
                                      : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                            <span>90</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setKkmTargets(DEFAULT_SUBJECT_KKM)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Kembalikan ke Standar Default
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      setKkmTargets(classroomService.getSubjectKkmTargets());
                      setShowSubjectKkmModal(false);
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleSaveKkmTargets(kkmTargets)}
                    className="px-5 py-2 text-xs font-black bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} /> Simpan Target KKM
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== PREVIEW REMEDIAL LEARNING MODULE MODAL ==================== */}
      <AnimatePresence>
        {previewRemedialModule && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-start gap-3">
                  <span className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                    <BookOpen size={20} />
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700">
                        {previewRemedialModule.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {previewRemedialModule.format}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700">
                        Tingkat: {previewRemedialModule.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 flex items-center gap-1">
                        <Clock size={10} /> {previewRemedialModule.estimatedMinutes} Menit
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      {previewRemedialModule.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPreviewRemedialModule(null);
                    setShowPracticeHints({});
                    setShowPracticeAnswers({});
                  }}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
                {/* Target Competency */}
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 space-y-1">
                  <div className="text-[11px] font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <Target size={13} /> Capaian Pembelajaran & Tujuan Remedial:
                  </div>
                  <p className="text-indigo-950/80 leading-relaxed font-medium">
                    {previewRemedialModule.targetCompetency}
                  </p>
                </div>

                {/* Step-by-Step Guidance */}
                <div className="space-y-2">
                  <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <CheckCheck size={14} className="text-emerald-600" />
                    Panduan Tahapan Bimbingan Guru (Scaffolding):
                  </h4>
                  <div className="space-y-1.5">
                    {previewRemedialModule.guideSteps.map((step, sIdx) => (
                      <div key={sIdx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 flex gap-2">
                        <span className="font-black text-indigo-600 shrink-0">{sIdx + 1}.</span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content Outline */}
                <div className="space-y-2">
                  <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <Layers size={14} className="text-blue-600" />
                    Garis Besar Materi & Aktivitas Siswa:
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewRemedialModule.contentOutline.map((item, cIdx) => (
                      <li key={cIdx} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-[11px]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Adaptive Practice Questions with Interactive Hints & Answers */}
                <div className="space-y-2.5 pt-1">
                  <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    Latihan Soal Adaptif Bergradasi & Kunci Jawaban:
                  </h4>

                  <div className="space-y-3">
                    {previewRemedialModule.practiceQuestions.map((q, qIdx) => {
                      const isHintOpen = !!showPracticeHints[qIdx];
                      const isAnswerOpen = !!showPracticeAnswers[qIdx];

                      return (
                        <div key={qIdx} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="px-2 py-0.5 rounded font-black text-[10px] bg-slate-100 text-slate-700">
                              Soal #{qIdx + 1}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setShowPracticeHints(prev => ({ ...prev, [qIdx]: !prev[qIdx] }))}
                                className={`px-2 py-0.8 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                  isHintOpen
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isHintOpen ? 'Tutup Hint' : '💡 Petunjuk (Hint)'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowPracticeAnswers(prev => ({ ...prev, [qIdx]: !prev[qIdx] }))}
                                className={`px-2 py-0.8 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                  isAnswerOpen
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isAnswerOpen ? 'Sembunyikan Kunci' : '🔑 Kunci Jawaban'}
                              </button>
                            </div>
                          </div>

                          <p className="text-xs font-bold text-slate-900 leading-relaxed">
                            {q.question}
                          </p>

                          {/* Collapsible Hint */}
                          {isHintOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]"
                            >
                              <span className="font-bold">Petunjuk Belajar: </span>{q.hint}
                            </motion.div>
                          )}

                          {/* Collapsible Answer Key */}
                          {isAnswerOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]"
                            >
                              <span className="font-bold">Kunci & Pembahasan: </span>{q.answerKey}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">
                  Modul Terdaftar dalam Kurikulum Merdeka UPT SDN Tangerang 6
                </span>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      setPreviewRemedialModule(null);
                      setShowPracticeHints({});
                      setShowPracticeAnswers({});
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={() => {
                      const pattern = errorPatterns.find(p => p.recommendedModuleId === previewRemedialModule.id);
                      if (pattern) {
                        handleAssignPatternModule(pattern);
                      } else {
                        const lowStudentIds = specialInterventionStudents.map(s => s.siswaId);
                        handleAssignDirectModule(previewRemedialModule.id, lowStudentIds);
                      }
                      setPreviewRemedialModule(null);
                    }}
                    className="px-5 py-2 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send size={14} /> Tugaskan ke Siswa di Bawah KKM
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MONTHLY EXECUTIVE PDF DOWNLOAD MODAL ==================== */}
      <AnimatePresence>
        {showMonthlyExecutivePdfModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                    <FileDown size={18} />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Laporan Eksekutif Bulanan (PDF)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Format resmi Kepala Sekolah & Pengawas Wilayah Binaan
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMonthlyExecutivePdfModal(false)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Period Selector */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Pilih Periode Evaluasi Bulanan:
                  </label>
                  <select
                    value={monthlyPdfMonth}
                    onChange={(e) => setMonthlyPdfMonth(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="November 2026">November 2026 (Semester Ganjil 2026/2027)</option>
                    <option value="Oktober 2026">Oktober 2026 (Semester Ganjil 2026/2027)</option>
                    <option value="September 2026">September 2026 (Semester Ganjil 2026/2027)</option>
                    <option value="Desember 2026">Desember 2026 (Evaluasi Akhir Semester)</option>
                  </select>
                </div>

                {/* Scope Info */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-blue-600" />
                    Komponen Dokumen Resmi yang Dihasilkan:
                  </div>
                  <ul className="space-y-1 pl-4 list-disc text-slate-600">
                    <li>Kop Surat Resmi Dual-Logo UPT SDN Tangerang 6</li>
                    <li>Ringkasan Eksekutif KPI Mutu (Rata-rata, % Ketuntasan KKM, Siswa Intervensi)</li>
                    <li>Visualisasi Tren Nilai Mingguan (Pekan 1 s/d 4) & Matriks Capaian Mapel</li>
                    <li><strong>Daftar Lengkap Siswa Memerlukan Intervensi Khusus</strong> dengan Miskonsepsi & Rekomendasi Modul</li>
                    <li>Pengesahan Tanda Tangan Wali Kelas, Pengawas & Kepala Sekolah (*Liestya Kusuma Sari, S.Pd., M.Pd.*)</li>
                    <li>Validasi Digital QR Code Terotentikasi</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMonthlyExecutivePdfModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadMonthlyExecutivePdf(monthlyPdfMonth)}
                  disabled={isGeneratingMonthlyPdf}
                  className="px-5 py-2 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingMonthlyPdf ? (
                    <RefreshCw size={14} className="animate-spin text-white" />
                  ) : (
                    <FileDown size={14} />
                  )}
                  <span>{isGeneratingMonthlyPdf ? 'Membuat PDF...' : 'Unduh Laporan PDF'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
