import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, GraduationCap, FileText, ClipboardList, LogOut, School, Plus,
  ChevronRight, ArrowLeft, CheckCircle2, Clock, Award, Users, Calendar, X,
  Send, Star, MessageSquare, LayoutDashboard, Lock, Unlock, AlertTriangle,
  UserCheck, Search, HelpCircle, Check, Sparkles, Video, Bookmark, Printer,
  AlertCircle, CheckSquare, TrendingUp, TrendingDown, BarChart2, Flame, Bell, HeartHandshake,
  ShieldCheck, Edit3, Eye, Download, Filter, Cloud, Mail, Copy, Bot, Mic, Square, Trash2, Radio, Palette, Trophy, RefreshCw, Cpu,
  QrCode, Scan, FolderArchive, Package, History, VolumeX, Volume2, SwitchCamera, Camera,
  Battery, BatteryCharging, BatteryFull, BatteryLow, BatteryMedium, Zap, Play, Pause
} from 'lucide-react';
import QRCode from 'qrcode';
import { accountService, STANDARD_CLASSES } from '../services/accountService';
import { classroomService } from '../services/classroomService';
import { pdfService } from '../services/pdfService';
import { exportAssignmentsToICS } from '../utils/icsExporter';
import { FirebaseCloudSyncModal } from './FirebaseCloudSyncModal';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';
import { ClassroomAIAssistantModal } from './classroom/ClassroomAIAssistantModal';
import { ClassroomAIChat } from './classroom/ClassroomAIChat';
import { Account, StatusKelulusan, KebutuhanKhusus } from '../types/classroom';
import { ClassroomCourse, ClassroomAssignment, ClassroomSubmission, ClassroomReport } from '../types/classroom';
import { ClassroomForumView } from './classroom/ClassroomForumView';
import { ClassroomAttendanceView } from './classroom/ClassroomAttendanceView';
import { ClassroomQuizCBTView } from './classroom/ClassroomQuizCBTView';
import { ClassroomMaterialsView } from './classroom/ClassroomMaterialsView';
import { ClassroomGradebookView } from './classroom/ClassroomGradebookView';
import { ClassroomScheduleView } from './classroom/ClassroomScheduleView';
import { ClassroomMediaView } from './classroom/ClassroomMediaView';
import { ClassroomLiveClassView } from './classroom/ClassroomLiveClassView';
import { ClassroomPortfolioView } from './classroom/ClassroomPortfolioView';
import { ClassroomNotificationCenter } from './classroom/ClassroomNotificationCenter';
import { StudentBadgesWidget } from './classroom/StudentBadgesWidget';
import { UserProfileSettingsModal } from './classroom/UserProfileSettingsModal';
import { ClassroomSummaryModal } from './classroom/ClassroomSummaryModal';
import { QuickGradeModal } from './classroom/QuickGradeModal';
import { BulkQrGeneratorModal } from './classroom/BulkQrGeneratorModal';
import { QRScannerModal, RecentScanItem } from './QRScannerModal';
import { VoiceNoteRecorder } from './classroom/VoiceNoteRecorder';
import { AIRemedialModulModal } from './classroom/AIRemedialModulModal';
import { ParentPortalModal } from './classroom/ParentPortalModal';
import { ExecutiveSupervisorReportModal } from './ExecutiveSupervisorReportModal';
import { playFeedback } from '../utils/feedback';
import { NFCGateAttendanceModal } from './classroom/NFCGateAttendanceModal';
import { BelajarIdSSOModal } from './BelajarIdSSOModal';
import { RBACAuditLogModal } from './RBACAuditLogModal';
import { IoTSmartClassroomModal } from './IoTSmartClassroomModal';
import { useTheme } from '../utils/theme';
import { LibraryKioskModal } from './LibraryKioskModal';
import { EarlyWarningP5Modal } from './classroom/EarlyWarningP5Modal';
import { P5ProjectTrackerWidget } from './classroom/P5ProjectTrackerWidget';
import { ExportStudentReportModal } from './classroom/ExportStudentReportModal';
import { ParticleCelebration } from './classroom/ParticleCelebration';
import { ClassroomPeerReviewModal } from './classroom/ClassroomPeerReviewModal';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Area,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

// ==========================================
// EXPORT STUDENTS DATA TO CSV UTILITY
// ==========================================
export const exportStudentsToCSV = (students: Account[], targetKelas?: string) => {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const csvRows: string[] = [];
  csvRows.push(`BACKUP DATA SISWA & REKAPITULASI NILAI - SDN TANGERANG 6`);
  csvRows.push(`Tahun Ajaran;2026/2027 (Semester Ganjil)`);
  csvRows.push(`Kelas / Rombel;${targetKelas || 'Semua Kelas'}`);
  csvRows.push(`Total Siswa Terdaftar;${students.length} Peserta Didik`);
  csvRows.push(`Tanggal Ekspor Offline;${dateStr}`);
  csvRows.push(``);
  csvRows.push(
    `No;NIS / NIP;Nama Lengkap Siswa;Username;Kelas;Status Kelulusan;Segmen Kebutuhan Khusus;Jumlah Tugas Dikumpul;Jumlah Tugas Dinilai;Rata-Rata Nilai Tugas;Catatan Ketuntasan KKM (75)`
  );

  students.forEach((s, idx) => {
    const studentSubmissions = classroomService.getSubmissions(undefined, s.ID);
    const graded = studentSubmissions.filter((sub) => sub.STATUS === 'GRADED');
    const avgScore =
      graded.length > 0
        ? Math.round(graded.reduce((acc, sub) => acc + (sub.NILAI || 0), 0) / graded.length)
        : '-';

    const statusKelulusan = s.STATUS_KELULUSAN || 'AKTIF';
    const kebutuhanKhusus = s.KEBUTUHAN_KHUSUS || 'REGULER';
    const ketuntasan =
      avgScore !== '-' && typeof avgScore === 'number'
        ? avgScore >= 75
          ? 'TUNTAS'
          : 'BELUM TUNTAS'
        : 'BELUM ADA PENILAIAN';

    csvRows.push(
      `${idx + 1};"${s.NIP || '-'}" ;"${s.NAMA}";"${s.USERNAME}";"${s.KELAS || '-'}" ;"${statusKelulusan}";"${kebutuhanKhusus}";${studentSubmissions.length};${graded.length};${avgScore};"${ketuntasan}"`
    );
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const fileNameKelas = targetKelas ? targetKelas.replace(/\s+/g, '_') : 'Semua_Kelas';
  link.setAttribute(
    'download',
    `Backup_Data_Siswa_SDN_Tangerang_6_${fileNameKelas}_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

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
  | 'live_class'
  | 'portfolio'
  | 'courses'
  | 'students'
  | 'assignments'
  | 'gradebook'
  | 'schedule'
  | 'reports';

export const ClassroomApp: React.FC<ClassroomAppProps> = ({ onLogout }) => {
  const { styles: activeTheme } = useTheme();
  const [account, setAccount] = useState<Account | null>(accountService.getActiveClassroomAccount());
  const [page, setPage] = useState<ClassPage>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobileNav, setIsMobileNav] = useState(false);
  const [showUnlockInfo, setShowUnlockInfo] = useState(false);
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem('classroom_high_contrast') === 'true';
    } catch {
      return false;
    }
  });
  const [showProfileSettings, setShowProfileSettings] = useState<boolean>(false);

  const handleToggleHighContrast = (enabled: boolean) => {
    setHighContrast(enabled);
    try {
      localStorage.setItem('classroom_high_contrast', enabled ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

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
  const [showAIChatModal, setShowAIChatModal] = useState(false);
  const [showGlobalQrScanner, setShowGlobalQrScanner] = useState(false);
  const [showAIRemedialModal, setShowAIRemedialModal] = useState(false);
  const [showParentPortalModal, setShowParentPortalModal] = useState(false);
  const [showExecutiveReportModal, setShowExecutiveReportModal] = useState(false);
  const [showNFCModal, setShowNFCModal] = useState(false);
  const [showSSOModal, setShowSSOModal] = useState(false);
  const [showRBACModal, setShowRBACModal] = useState(false);
  const [showIoTModal, setShowIoTModal] = useState(false);
  const [showLibraryKioskModal, setShowLibraryKioskModal] = useState(false);
  const [showEarlyWarningP5Modal, setShowEarlyWarningP5Modal] = useState(false);
  const [aiChatAssignment, setAiChatAssignment] = useState<ClassroomAssignment | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [celebratingMilestone, setCelebratingMilestone] = useState<{
    studentName: string;
    milestoneTitle: string;
    milestoneCategory?: string;
    rewardPoints?: number;
  } | null>(null);

  const handleTriggerMilestone = useCallback((
    studentName: string, 
    milestoneTitle: string,
    milestoneCategory = 'Ketepatan Waktu & Disiplin Tugas',
    rewardPoints = 500
  ) => {
    setCelebratingMilestone({
      studentName,
      milestoneTitle,
      milestoneCategory,
      rewardPoints,
    });
  }, []);

  const [defaultScannerMode, setDefaultScannerMode] = useState<'ALL' | 'ASSIGNMENT' | 'STUDENT' | 'ASSET'>(() => {
    try { return (localStorage.getItem('sdn6_qr_default_mode') as any) || 'ALL'; } catch { return 'ALL'; }
  });

  const changeDefaultScannerMode = (mode: 'ALL' | 'ASSIGNMENT' | 'STUDENT' | 'ASSET') => {
    setDefaultScannerMode(mode);
    try { localStorage.setItem('sdn6_qr_default_mode', mode); } catch {}
  };

  // Global keyboard shortcut for QR Scanner (Ctrl+Shift+S / Cmd+Shift+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setQrScannerTargetMode(defaultScannerMode);
        setShowGlobalQrScanner((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [defaultScannerMode]);

  // Quick QR Scanner FAB State & Schedule Proximity
  const [qrScannerTargetMode, setQrScannerTargetMode] = useState<'ALL' | 'ASSIGNMENT' | 'STUDENT' | 'ASSET'>('ALL');
  const [showFabContextMenu, setShowFabContextMenu] = useState(false);
  const [recentFabScans, setRecentFabScans] = useState<RecentScanItem[]>([]);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = useRef(false);
  const fabContainerRef = useRef<HTMLDivElement | null>(null);

  // Load Recent Scans for FAB Context Menu
  const loadRecentFabScans = useCallback(() => {
    try {
      const raw = localStorage.getItem('sdn6_qr_recent_scans_v1');
      if (raw) {
        const parsed: RecentScanItem[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentFabScans(parsed);
          return;
        }
      }
    } catch (err) {
      console.error('Error loading recent scans for FAB menu:', err);
    }
    setRecentFabScans([]);
  }, []);

  const clearRecentFabScans = useCallback(() => {
    try {
      localStorage.removeItem('sdn6_qr_recent_scans_v1');
      setRecentFabScans([]);
      setShowClearScansConfirm(false);
    } catch (err) {
      console.error('Error clearing recent scans:', err);
    }
  }, []);

  // Close FAB context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fabContainerRef.current && !fabContainerRef.current.contains(e.target as Node)) {
        setShowFabContextMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Refresh recent scans when context menu opens
  useEffect(() => {
    if (showFabContextMenu) {
      loadRecentFabScans();
    }
  }, [showFabContextMenu, loadRecentFabScans]);

  // Target Class Code determination
  const targetClassCode = useMemo(() => {
    if (isGuru) return account?.KELAS || 'Kelas 1';
    if (isSiswa) return account?.KELAS || 'Kelas Siswa';
    return 'Semua Kelas';
  }, [isGuru, isSiswa, account?.KELAS]);

  // Schedule Proximity calculation for visual nudge & pulse color intensity
  const scheduleNudge = useMemo(() => {
    try {
      const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const now = new Date();
      const dayName = DAY_NAMES[now.getDay()];
      const currentMins = now.getHours() * 60 + now.getMinutes();

      const targetClass = isGuru || isSiswa ? (account?.KELAS || undefined) : undefined;
      const schedules = classroomService.getSchedules(targetClass, dayName);

      if (!schedules || schedules.length === 0) {
        return {
          status: 'NORMAL' as const,
          session: null,
          minutesUntil: null,
          badgeText: null,
        };
      }

      const parseTime = (tStr: string) => {
        if (!tStr) return 0;
        const clean = tStr.replace(/[^0-9::.]/g, '').replace('.', ':');
        const parts = clean.split(':').map(Number);
        const hours = !isNaN(parts[0]) ? parts[0] : 0;
        const mins = !isNaN(parts[1]) ? parts[1] : 0;
        return hours * 60 + mins;
      };

      // 1. Check if a class session is currently active
      const active = schedules.find((s) => {
        const start = parseTime(s.JAM_MULAI);
        const end = parseTime(s.JAM_SELESAI);
        return currentMins >= start && currentMins <= end;
      });

      if (active) {
        return {
          status: 'ACTIVE' as const,
          session: active,
          minutesUntil: 0,
          badgeText: `🔴 Sesi Aktif: ${active.MAPEL}`,
        };
      }

      // 2. Check next upcoming class session today
      const upcomingList = schedules
        .map((s) => ({
          session: s,
          start: parseTime(s.JAM_MULAI),
          diff: parseTime(s.JAM_MULAI) - currentMins,
        }))
        .filter((item) => item.diff > 0)
        .sort((a, b) => a.diff - b.diff);

      const nextUpcoming = upcomingList[0];
      if (nextUpcoming) {
        if (nextUpcoming.diff <= 15) {
          return {
            status: 'IMMINENT' as const,
            session: nextUpcoming.session,
            minutesUntil: nextUpcoming.diff,
            badgeText: `⏳ ${nextUpcoming.diff}m lagi: ${nextUpcoming.session.MAPEL}`,
          };
        }
        if (nextUpcoming.diff <= 35) {
          return {
            status: 'SOON' as const,
            session: nextUpcoming.session,
            minutesUntil: nextUpcoming.diff,
            badgeText: `🕒 ${nextUpcoming.diff}m: ${nextUpcoming.session.MAPEL}`,
          };
        }
      }

      return {
        status: 'NORMAL' as const,
        session: null,
        minutesUntil: null,
        badgeText: null,
      };
    } catch {
      return {
        status: 'NORMAL' as const,
        session: null,
        minutesUntil: null,
        badgeText: null,
      };
    }
  }, [isGuru, isSiswa, account?.KELAS, refreshKey]);

  // Pulse animation duration that accelerates as time gets closer to class start time
  const pulseDuration = useMemo(() => {
    if (scheduleNudge.status === 'ACTIVE') {
      return '0.55s';
    }
    if (scheduleNudge.status === 'IMMINENT') {
      const mins = Math.max(1, scheduleNudge.minutesUntil ?? 15);
      // Accelerates smoothly from 1.35s down to 0.55s as minutesUntil decreases
      const dur = 0.55 + (mins / 15) * 0.8;
      return `${dur.toFixed(2)}s`;
    }
    if (scheduleNudge.status === 'SOON') {
      const mins = Math.max(15, scheduleNudge.minutesUntil ?? 35);
      const dur = 1.35 + ((mins - 15) / 20) * 0.85;
      return `${dur.toFixed(2)}s`;
    }
    return '2.4s';
  }, [scheduleNudge]);

  // Determine if within 10 minutes of scheduled class start or during active session
  const isWithinTenMinutesOfClass = useMemo(() => {
    if (scheduleNudge.status === 'ACTIVE') return true;
    if (scheduleNudge.minutesUntil !== null && scheduleNudge.minutesUntil <= 10) return true;
    return false;
  }, [scheduleNudge]);

  // Determine if within 5 minutes of scheduled class start or during active session (for breathing animation)
  const isWithinFiveMinutesOfClass = useMemo(() => {
    if (scheduleNudge.status === 'ACTIVE') return true;
    if (scheduleNudge.minutesUntil !== null && scheduleNudge.minutesUntil <= 5) return true;
    return false;
  }, [scheduleNudge]);

  const [showClearScansConfirm, setShowClearScansConfirm] = useState(false);
  const [smartAutoTrigger, setSmartAutoTrigger] = useState(() => {
    try { return localStorage.getItem('sdn6_qr_auto_trigger') === 'true'; } catch { return false; }
  });
  const [fabQuickGradeStudent, setFabQuickGradeStudent] = useState<Account | null>(null);

  const toggleSmartAutoTrigger = () => {
    const newState = !smartAutoTrigger;
    setSmartAutoTrigger(newState);
    try { localStorage.setItem('sdn6_qr_auto_trigger', String(newState)); } catch {}
  };

  const [muteFeedback, setMuteFeedback] = useState(() => {
    try { return localStorage.getItem('sdn6_qr_mute_feedback') === 'true'; } catch { return false; }
  });

  const toggleMuteFeedback = () => {
    const newState = !muteFeedback;
    setMuteFeedback(newState);
    try { localStorage.setItem('sdn6_qr_mute_feedback', String(newState)); } catch {}
  };

  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>(() => {
    try { return (localStorage.getItem('sdn6_qr_camera_facing') as 'environment' | 'user') || 'environment'; } catch { return 'environment'; }
  });

  const toggleCameraFacingMode = () => {
    const newMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(newMode);
    try { localStorage.setItem('sdn6_qr_camera_facing', newMode); } catch {}
  };

  const [isLowBattery, setIsLowBattery] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [isFabSuccessAnimating, setIsFabSuccessAnimating] = useState(false);

  const [showQuickNoteModal, setShowQuickNoteModal] = useState(false);
  const [quickNoteItem, setQuickNoteItem] = useState<RecentScanItem | null>(null);
  const [savedVoiceNotes, setSavedVoiceNotes] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('sdn6_qr_voice_notes_v1');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const handleSaveQuickVoiceNote = (code: string, audioBase64: string) => {
    setSavedVoiceNotes((prev) => {
      const updated = { ...prev, [code]: audioBase64 };
      try {
        localStorage.setItem('sdn6_qr_voice_notes_v1', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save voice note:', e);
      }
      return updated;
    });
  };

  const handleScanSuccessAnimation = useCallback(() => {
    setIsFabSuccessAnimating(true);
    loadRecentFabScans();
    setTimeout(() => {
      setIsFabSuccessAnimating(false);
    }, 2200);
  }, [loadRecentFabScans]);

  useEffect(() => {
    const handleQrSuccess = () => {
      handleScanSuccessAnimation();
    };
    window.addEventListener('qr_scan_success', handleQrSuccess);
    return () => {
      window.removeEventListener('qr_scan_success', handleQrSuccess);
    };
  }, [handleScanSuccessAnimation]);

  useEffect(() => {
    let batteryPromise: any;
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      batteryPromise = (navigator as any).getBattery();
      batteryPromise.then((battery: any) => {
        const updateBattery = () => {
          setBatteryLevel(battery.level);
          setIsCharging(battery.charging);
          setIsLowBattery(battery.level <= 0.15 && !battery.charging);
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      });
    }
  }, []);

  const [recentScanFilter, setRecentScanFilter] = useState<'ALL' | 'ASSIGNMENT' | 'STUDENT' | 'ASSET'>('ALL');
  const [recentScanQuery, setRecentScanQuery] = useState('');
  const [isExportingScansPdf, setIsExportingScansPdf] = useState(false);

  const lastScannedStudent = useMemo(() => {
    return recentFabScans.find(s => s.type === 'STUDENT');
  }, [recentFabScans]);

  const filteredFabScans = useMemo(() => {
    return recentFabScans.filter((s) => {
      const matchFilter = recentScanFilter === 'ALL' || s.type === recentScanFilter;
      if (!matchFilter) return false;
      if (!recentScanQuery.trim()) return true;
      const q = recentScanQuery.trim().toLowerCase();
      const titleMatch = (s.title || '').toLowerCase().includes(q);
      const codeMatch = (s.code || '').toLowerCase().includes(q);
      const rawMatch = (s.rawPayload || '').toLowerCase().includes(q);
      const typeMatch = s.type.toLowerCase().includes(q) ||
        (s.type === 'STUDENT' && ('presensi'.includes(q) || 'siswa'.includes(q))) ||
        (s.type === 'ASSIGNMENT' && ('tugas'.includes(q) || 'pekerjaan'.includes(q))) ||
        (s.type === 'ASSET' && ('aset'.includes(q) || 'barang'.includes(q)));
      return titleMatch || codeMatch || rawMatch || typeMatch;
    });
  }, [recentFabScans, recentScanFilter, recentScanQuery]);

  const handleExportScansPDF = async () => {
    if (filteredFabScans.length === 0) return;
    setIsExportingScansPdf(true);
    try {
      playFeedback('success');
      const filterLabel =
        recentScanFilter === 'ALL'
          ? 'Semua Pemindaian'
          : recentScanFilter === 'STUDENT'
          ? 'Presensi Siswa'
          : recentScanFilter === 'ASSIGNMENT'
          ? 'Tugas Siswa'
          : 'Aset & Sarpras';

      const nowStr = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await pdfService.generateBeritaAcara({
        title: 'LAPORAN REKAPITULASI PEMINDAIAN QR CODE',
        docNo: `QR-FAB/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${Date.now().toString().slice(-4)}`,
        description: `Rekapitulasi riwayat pemindaian QR Code (Filter: ${filterLabel}). Total item: ${filteredFabScans.length}. Tanggal cetak: ${nowStr}.`,
        tableHeaders: ['No', 'Waktu Pemindaian', 'Kategori', 'Kode QR', 'Nama / Judul Item', 'Catatan Audio'],
        tableRows: filteredFabScans.map((scan, idx) => [
          idx + 1,
          new Date(scan.timestamp).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
          scan.type === 'STUDENT'
            ? 'Presensi Siswa'
            : scan.type === 'ASSIGNMENT'
            ? 'Tugas Siswa'
            : 'Aset Sarpras',
          scan.code,
          scan.title || scan.code,
          savedVoiceNotes[scan.code] ? 'Ada Catatan Suara' : '-',
        ]),
        autoSave: true,
        paperSize: 'a4',
        orientation: 'portrait',
        styling: {
          themeColor: 'emerald',
          tableDensity: 'compact',
        },
        pageNumbering: {
          enabled: true,
          format: 'hal_x_per_y',
        },
        headerFooter: {
          enabled: true,
          documentCode: 'SDN6-QR-FAB-PDF',
          showTimestamp: true,
        },
      });
    } catch (err) {
      console.error('Failed to export scans PDF:', err);
      playFeedback('error');
    } finally {
      setIsExportingScansPdf(false);
    }
  };

  const handleDirectToAssignment = (studentScan?: RecentScanItem) => {
    const targetScan = studentScan || lastScannedStudent;
    if (!targetScan) return;
    setShowFabContextMenu(false);
    playFeedback('success');
    setPage('assignments');
    const studentObj = accountService.getAccountById(targetScan.id);
    if (studentObj) {
      setFabQuickGradeStudent(studentObj);
    }
  };

  // Computed trend data for the sparkline chart
  const scanTrend = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const trend = [];
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      d.setHours(0, 0, 0, 0);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const count = recentFabScans.filter(s => s.timestamp >= dayStart && s.timestamp < dayEnd).length;
      trend.push({ day: days[d.getDay()], scans: count });
    }
    return trend;
  }, [recentFabScans]);

  // Long-press and touch handlers for FAB
  const handleTouchStart = () => {
    isLongPressActiveRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      setShowFabContextMenu(true);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(50); } catch {}
      }
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleFabClick = (e: React.MouseEvent) => {
    if (isLongPressActiveRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressActiveRef.current = false;
      return;
    }
    
    if (showFabContextMenu) {
      playFeedback('click');
      setShowFabContextMenu(false);
      return;
    }
    
    // Play subtle scanner beep sound via Web Audio API when initiating scan
    playFeedback('scan');

    // Auto-defaults to 'Scan Student Attendance' if within 10 minutes of a scheduled class
    if (smartAutoTrigger && isWithinTenMinutesOfClass) {
      setQrScannerTargetMode('STUDENT');
    } else {
      setQrScannerTargetMode(defaultScannerMode);
    }
    setShowGlobalQrScanner(true);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowFabContextMenu((prev) => !prev);
  };

  const handleSelectScanMode = (mode: 'ASSIGNMENT' | 'STUDENT' | 'ASSET' | 'ALL') => {
    setQrScannerTargetMode(mode);
    setShowFabContextMenu(false);
    setShowGlobalQrScanner(true);
  };

  const handleSelectRecentScan = (item: RecentScanItem) => {
    setShowFabContextMenu(false);
    if (item.type === 'ASSIGNMENT') {
      setPage('assignments');
    } else if (item.type === 'STUDENT') {
      setPage('attendance');
    } else if (item.type === 'ASSET') {
      setQrScannerTargetMode('ASSET');
      setShowGlobalQrScanner(true);
    } else {
      setQrScannerTargetMode('ALL');
      setShowGlobalQrScanner(true);
    }
  };

  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Simulate automatic syncing when back online
      if (offlineQueueCount > 0) {
        setTimeout(() => {
          setOfflineQueueCount(0);
        }, 1500);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      // Stacking active tasks to offline queue when offline
      setOfflineQueueCount((c) => c + 1);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueueCount]);

  const handleOpenAIChat = (assignment?: ClassroomAssignment) => {
    setAiChatAssignment(assignment || null);
    setShowAIChatModal(true);
  };
  const [dismissedFeedbackIds, setDismissedFeedbackIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_feedbacks') || '[]');
    } catch {
      return [];
    }
  });

  const allCourses = useMemo(() => classroomService.getCourses(), [refreshKey]);
  const courses = useMemo(() => {
    if (isSiswa) return classroomService.getCoursesForSiswa(account.ID, account.KELAS);
    if (isGuru) return classroomService.getCoursesForGuru(account.ID, account.KELAS);
    return allCourses;
  }, [isSiswa, isGuru, account.ID, account.KELAS, allCourses, refreshKey]);

  const allAssignments = useMemo(() => {
    if (isSiswa || isGuru) return courses.flatMap((c) => classroomService.getAssignments(c.ID));
    return classroomService.getAssignments();
  }, [isSiswa, isGuru, courses, refreshKey]);

  const mySubmissions = useMemo(() => {
    return isSiswa ? classroomService.getSubmissions(undefined, account.ID) : [];
  }, [isSiswa, account.ID, refreshKey]);

  const allSubmissions = useMemo(() => classroomService.getSubmissions(), [refreshKey]);

  const reports = useMemo(() => {
    return isGuru ? classroomService.getReportsForGuru(account.ID) : classroomService.getReports();
  }, [isGuru, account.ID, refreshKey]);

  // Student Feedbacks for Toast Notification
  const studentFeedbacks = useMemo(() => {
    if (!account || account.ROLE !== 'SISWA') return [];
    const mySubs = classroomService.getSubmissions(undefined, account.ID);
    return mySubs
      .filter((s) => s.STATUS === 'GRADED' && s.FEEDBACK && s.FEEDBACK.trim().length > 0)
      .map((s) => {
        const asg = allAssignments.find((a) => a.ID === s.ASSIGNMENT_ID);
        return {
          id: s.ID,
          assignmentId: s.ASSIGNMENT_ID,
          assignmentTitle: asg?.JUDUL || 'Tugas Siswa',
          guruNama: s.GRADED_BY || 'Guru Pengampu',
          nilai: s.NILAI,
          feedback: s.FEEDBACK,
          gradedAt: s.GRADED_AT || s.SUBMITTED_AT,
        };
      });
  }, [account, allAssignments, refreshKey]);

  const activeToastFeedback = studentFeedbacks.find((f) => !dismissedFeedbackIds.includes(f.id));

  const classStudents = useMemo(() => {
    return isGuru && account.KELAS
      ? accountService.getStudents(account.KELAS)
      : accountService.getStudents();
  }, [isGuru, account.KELAS, refreshKey]);

  const navItems: { id: ClassPage; label: string; icon: any; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'forum', label: 'Forum Diskusi & Stream', icon: MessageSquare },
    { id: 'attendance', label: 'Presensi & Kehadiran', icon: UserCheck },
    { id: 'live_class', label: 'Tatap Muka Daring (Live)', icon: Radio },
    { id: 'quizzes', label: 'Kuis & Ujian CBT', icon: Award },
    { id: 'materials', label: 'Bahan Ajar & Modul', icon: BookOpen },
    { id: 'media', label: 'Media Pembelajaran', icon: Video },
    { id: 'portfolio', label: 'Portofolio & Karya', icon: Palette },
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
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${
      highContrast
        ? 'bg-[#090D16] text-white font-semibold high-contrast-mode'
        : 'bg-slate-100 text-slate-800'
    }`}>
      {/* ONE-TIME CLASS LOCK PROMPT MODAL FOR TEACHERS */}
      {needsClassLock && (
        <TeacherClassLockModal
          guruAccount={account}
          onLocked={handleClassLocked}
          onLogout={onLogout}
        />
      )}

      {/* Top Bar */}
      <header className={`bg-gradient-to-r ${activeTheme.heroGrad} text-white sticky top-0 z-30 shadow-lg border-b border-white/10`}>
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileNav(!isMobileNav)} 
              className="lg:hidden p-3 rounded-lg hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Buka Menu Pembelajaran"
            >
              <BookOpen size={20} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight leading-none">SDN Tangerang 6 Classroom</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-white/85 font-semibold">Portal Pembelajaran Terpadu</span>
                {isGuru && account.KELAS && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <Lock size={9} /> {account.KELAS} (Terkunci)
                  </span>
                )}
                {highContrast && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    ⚡ HIGH CONTRAST
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              onClick={() => setShowProfileSettings(true)}
              className="text-right hidden sm:block cursor-pointer hover:opacity-90 transition"
              title="Buka Pengaturan Profil & Aksesibilitas"
            >
              <div className="text-xs font-bold leading-none">{account.NAMA}</div>
              <div className="text-[10px] text-blue-300 mt-0.5 flex items-center justify-end gap-1.5">
                <span>{account.ROLE}</span>
                {account.KELAS && <span>• {account.KELAS}</span>}
                {isGuru && account.KELAS_LOCKED && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowUnlockInfo(true); }}
                    className="inline-flex items-center gap-0.5 text-amber-300 hover:underline cursor-pointer"
                    title="Info Kunci Kelas"
                  >
                    <Lock size={10} /> Terkunci
                  </button>
                )}
              </div>
            </div>

            {/* Realtime Offline Sync Indicator */}
            <OfflineSyncIndicator compact={true} />

            {/* Profile Settings & Badges Button */}
            <button
              onClick={() => setShowProfileSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 font-bold text-xs transition cursor-pointer"
              title="Profil, Aksesibilitas Kontras & Lencana Prestasi"
            >
              <Eye size={15} className="text-amber-300" />
              <span className="hidden md:inline">Profil & Kontras</span>
            </button>

            {/* Quick QR Scanner Button */}
            <button
              onClick={() => setShowGlobalQrScanner(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-bold text-xs transition cursor-pointer"
              title="Scan QR Code Siswa & Aset (Shortcut: Ctrl+Shift+S)"
            >
              <QrCode size={14} className="text-emerald-300" />
              <span className="hidden sm:inline">Scan QR</span>
              <span className="hidden xl:inline text-[9px] px-1 py-0.2 rounded bg-emerald-400/20 text-emerald-300 font-mono">
                Ctrl+Shift+S
              </span>
            </button>

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
              onClick={() => setShowAIRemedialModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/30 font-bold text-xs transition cursor-pointer"
              title="AI Remedial & Generator Modul Ajar Kurikulum Merdeka"
            >
              <Sparkles size={14} className="text-amber-300" />
              <span className="hidden xl:inline">AI Remedial & Modul</span>
            </button>

            <button
              onClick={() => setShowNFCModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 font-bold text-xs transition cursor-pointer"
              title="Presensi Tap NFC / Smart Card Kios Gerbang"
            >
              <Radio size={14} className="text-cyan-300" />
              <span className="hidden xl:inline font-mono">Presensi NFC</span>
            </button>

            <button
              onClick={() => setShowSSOModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 font-bold text-xs transition cursor-pointer"
              title="Single Sign-On SSO Belajar.id Kemendikbud"
            >
              <ShieldCheck size={14} className="text-blue-300" />
              <span className="hidden xl:inline">SSO Belajar.id</span>
            </button>

            <button
              onClick={() => setShowEarlyWarningP5Modal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 font-bold text-xs transition cursor-pointer"
              title="Early Warning System & Radar P5 Kurikulum Merdeka"
            >
              <AlertTriangle size={14} className="text-rose-300" />
              <span className="hidden xl:inline">EWS & P5 Radar</span>
            </button>

             <button
              onClick={() => setShowIoTModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-bold text-xs transition cursor-pointer min-h-[44px]"
              title="IoT Smart Classroom & Telemetri Fasilitas"
            >
              <Cpu size={14} className="text-emerald-300" />
              <span className="hidden xl:inline">IoT Smart Classroom</span>
            </button>

            <button
              onClick={() => setShowParentPortalModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/30 font-bold text-xs transition cursor-pointer min-h-[44px]"
              title="Portal WA Orang Tua Siswa"
            >
              <MessageSquare size={14} className="text-teal-300" />
              <span className="hidden xl:inline">Portal WA Orang Tua</span>
            </button>

            {isKepsek && (
              <button
                onClick={() => setShowExecutiveReportModal(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 font-bold text-xs transition cursor-pointer min-h-[44px]"
                title="Laporan Eksekutif Pengawas Sekolah"
              >
                <Award size={14} className="text-amber-300" />
                <span className="hidden xl:inline">Laporan Pengawas</span>
              </button>
            )}

            {(isGuru || isKepsek) && (
              <button
                onClick={() =>
                  exportStudentsToCSV(
                    accountService.getStudents(isGuru ? account.KELAS : undefined),
                    isGuru ? account.KELAS : undefined
                  )
                }
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-bold text-xs transition cursor-pointer min-h-[44px]"
                title="Ekspor Data Siswa ke CSV"
              >
                <Download size={15} />
                <span className="hidden md:inline">Ekspor CSV</span>
              </button>
            )}

            <ClassroomNotificationCenter account={account} onNavigateTab={(tabKey) => setPage(tabKey as ClassPage)} />

            <button
              onClick={() => setShowCloudModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 font-bold text-xs transition min-h-[44px]"
              title="Sinkronisasi Cloud Realtime"
            >
              <Cloud size={15} />
              <span className="hidden sm:inline">Cloud Sync</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
            <div
              onClick={() => setShowProfileSettings(true)}
              className="w-11 h-11 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center font-bold text-sm shadow-xs cursor-pointer hover:bg-blue-500/50 transition shrink-0"
              title="Buka Profil & Pengaturan"
            >
              {account.NAMA.charAt(0)}
            </div>
            <button 
              onClick={onLogout} 
              className="p-2.5 rounded-xl bg-white/10 hover:bg-rose-500/30 text-slate-200 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer shrink-0" 
              title="Keluar"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Offline-First Sync Queue Banner (Phase 2) */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 sm:px-6 py-2.5 text-xs font-black flex items-center justify-center gap-2 border-b border-amber-600 transition animate-pulse z-50">
          <AlertTriangle size={15} className="shrink-0 text-slate-950" />
          <span>
            Mode Offline Aktif — Koneksi internet terputus. Mekanisme Offline-First SIPB aktif: semua aktivitas belajar & administrasi disimpan di memori lokal aman dan akan disinkronkan otomatis saat online ({offlineQueueCount} perubahan mengantri).
          </span>
        </div>
      )}

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

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop Overlay with transition */}
        <div
          className={`fixed inset-0 top-16 z-20 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity duration-300 ease-in-out ${
            isMobileNav ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMobileNav(false)}
        />

        {/* Sidebar */}
        <aside 
          className={`fixed lg:static top-16 bottom-0 left-0 z-30 w-72 lg:w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 ${
            isMobileNav ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
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

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setPage(item.id); setSelectedCourseId(null); setIsMobileNav(false); }}
                  className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                    page === item.id ? `${activeTheme.buttonBase} font-bold shadow-sm` : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={16} className={page === item.id ? 'text-white' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
            Classroom Terpadu SDN Tangerang 6
          </div>
        </aside>

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
              onTriggerMilestone={handleTriggerMilestone}
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
          {page === 'live_class' && (
            <ClassroomLiveClassView
              account={account}
            />
          )}
          {page === 'portfolio' && (
            <ClassroomPortfolioView
              account={account}
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
              onOpenAIChat={handleOpenAIChat}
              onTriggerMilestone={handleTriggerMilestone}
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

      {/* FLOATING TOAST NOTIFICATION FOR STUDENT NEW FEEDBACK */}
      <AnimatePresence>
        {isSiswa && activeToastFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 260,
                damping: 20,
                mass: 1
              }
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.15 } }}
            className="fixed bottom-24 right-5 md:bottom-24 md:right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-indigo-500/40"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold animate-bounce">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">
                    Feedback Baru dari Guru!
                  </span>
                  <h4 className="text-xs font-bold text-white line-clamp-1">
                    {activeToastFeedback.assignmentTitle}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => {
                  const updated = [...dismissedFeedbackIds, activeToastFeedback.id];
                  setDismissedFeedbackIds(updated);
                  localStorage.setItem('dismissed_feedbacks', JSON.stringify(updated));
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mt-2.5 p-2.5 bg-slate-800/90 rounded-xl border border-slate-700/80 text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-semibold">{activeToastFeedback.guruNama}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black">
                  Nilai: {activeToastFeedback.nilai}/100
                </span>
              </div>
              <p className="text-slate-200 italic line-clamp-2 mt-1">"{activeToastFeedback.feedback}"</p>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  const updated = [...dismissedFeedbackIds, activeToastFeedback.id];
                  setDismissedFeedbackIds(updated);
                  localStorage.setItem('dismissed_feedbacks', JSON.stringify(updated));
                }}
                className="px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setPage('assignments');
                  const updated = [...dismissedFeedbackIds, activeToastFeedback.id];
                  setDismissedFeedbackIds(updated);
                  localStorage.setItem('dismissed_feedbacks', JSON.stringify(updated));
                }}
                className="px-3.5 py-1.5 text-[11px] font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
              >
                Lihat Tugas <ChevronRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION BUTTON (FAB): PERMANENT QR SCANNER TRIGGER WITH SUB-MENU & SCHEDULE PROXIMITY */}
      <div ref={fabContainerRef} className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[60] flex items-center group">
        {/* Long-Press / Right-Click Secondary Context Menu */}
        <AnimatePresence>
          {showFabContextMenu && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25, mass: 0.8 }}
              className="absolute bottom-full right-0 mb-3 w-72 sm:w-80 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 z-50 text-white"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-800/90 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  <span className="text-xs font-black text-white">Menu Cepat Scan QR</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFabContextMenu(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="text-[10px] text-slate-400 px-2.5 pb-1">
                Pilih target pemindaian cepat atau tekan tombol scanner:
              </div>

              {/* Dynamic Battery Level Status Bar */}
              <div className="mx-1 my-1.5 px-2.5 py-1.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    isCharging
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : batteryLevel !== null && batteryLevel <= 0.2
                      ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                      : batteryLevel !== null && batteryLevel <= 0.5
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {isCharging ? (
                      <BatteryCharging size={15} className="animate-pulse" />
                    ) : batteryLevel !== null && batteryLevel <= 0.2 ? (
                      <BatteryLow size={15} />
                    ) : batteryLevel !== null && batteryLevel <= 0.5 ? (
                      <BatteryMedium size={15} />
                    ) : (
                      <BatteryFull size={15} />
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 truncate">
                      <span>Baterai Perangkat</span>
                      {isCharging && <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800/50">Mengisi</span>}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {batteryLevel !== null ? `${Math.round(batteryLevel * 100)}% Tersedia` : 'Status Perangkat Normal'}
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono shrink-0 ${
                  isCharging
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : batteryLevel !== null && batteryLevel <= 0.2
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : batteryLevel !== null && batteryLevel <= 0.5
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {batteryLevel !== null ? `${Math.round(batteryLevel * 100)}%` : '100%'}
                </div>
              </div>

              {/* Action Items */}
              <div className="space-y-1">
                {/* 1. Scan Assignment */}
                <button
                  type="button"
                  onClick={() => handleSelectScanMode('ASSIGNMENT')}
                  className="w-full p-2 rounded-xl bg-slate-900/80 hover:bg-blue-950/80 hover:border-blue-500/50 border border-slate-800 text-left transition flex items-center justify-between gap-2.5 group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      <BookOpen size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 group-hover:text-blue-300 flex items-center gap-1.5">
                        <span>Scan Assignment (Tugas)</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                          Tugas
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        Pindai lembar soal, tugas, & portofolio siswa
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 group-hover:text-blue-400 shrink-0" />
                </button>

                {/* 2. Scan Student Attendance */}
                <button
                  type="button"
                  onClick={() => handleSelectScanMode('STUDENT')}
                  className="w-full p-2 rounded-xl bg-slate-900/80 hover:bg-emerald-950/80 hover:border-emerald-500/50 border border-slate-800 text-left transition flex items-center justify-between gap-2.5 group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      <UserCheck size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 flex items-center gap-1.5">
                        <span>Scan Student Attendance</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                          Presensi
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        Pindai kartu NIS / ID Badge siswa untuk absensi
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 group-hover:text-emerald-400 shrink-0" />
                </button>

                {/* 3. Scan Facility Asset */}
                <button
                  type="button"
                  onClick={() => handleSelectScanMode('ASSET')}
                  className="w-full p-2 rounded-xl bg-slate-900/80 hover:bg-amber-950/80 hover:border-amber-500/50 border border-slate-800 text-left transition flex items-center justify-between gap-2.5 group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      <Package size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300 flex items-center gap-1.5">
                        <span>Scan Facility Asset</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300 border border-amber-700/50">
                          Sarpras
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        Pindai kode stiker inventaris sarana lab & kelas
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 group-hover:text-amber-400 shrink-0" />
                </button>

                {/* 4. Global Auto-Detect */}
                <button
                  type="button"
                  onClick={() => handleSelectScanMode('ALL')}
                  className="w-full p-2 rounded-xl bg-slate-900/80 hover:bg-purple-950/80 hover:border-purple-500/50 border border-slate-800 text-left transition flex items-center justify-between gap-2.5 group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      <Scan size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 group-hover:text-purple-300 flex items-center gap-1.5">
                        <span>Deteksi Otomatis Semua QR</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                          Auto
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        Deteksi instan semua jenis barcode & QR
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 group-hover:text-purple-400 shrink-0" />
                </button>
              </div>

              {/* Direct-to-Assignment (Bypassing Attendance Dashboard) & Quick Grade (Last Student) */}
              {lastScannedStudent && (
                <div className="pt-2 border-t border-slate-800/90 mt-1.5 px-1 space-y-1">
                  <button
                    type="button"
                    id="btn-direct-to-assignment"
                    onClick={() => handleDirectToAssignment(lastScannedStudent)}
                    className="w-full px-2.5 py-2 rounded-xl bg-gradient-to-r from-indigo-950/80 to-blue-950/80 hover:from-indigo-900 hover:to-blue-900 border border-indigo-700/60 text-left transition flex items-center justify-between gap-2.5 group cursor-pointer shadow-lg shadow-indigo-950/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <BookOpen size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-indigo-100 group-hover:text-indigo-200 flex items-center gap-1.5 truncate">
                          <span>Direct-to-Assignment</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-600/50 font-semibold">
                            Bypass Presensi
                          </span>
                        </div>
                        <p className="text-[10px] text-indigo-300/80 truncate">
                          Buka tugas {lastScannedStudent.title || lastScannedStudent.code} secara langsung
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Zap size={13} className="text-amber-400 animate-pulse" />
                      <ChevronRight size={14} className="text-indigo-400 group-hover:text-indigo-200" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowFabContextMenu(false);
                      const studentObj = accountService.getAccountById(lastScannedStudent.id);
                      if (studentObj) setFabQuickGradeStudent(studentObj);
                    }}
                    className="w-full px-2 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 shrink-0">
                        <Edit3 size={14} />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-[11px] font-bold text-emerald-400 truncate">Beri Nilai Cepat</div>
                        <div className="text-[9px] text-emerald-500/70 truncate">{lastScannedStudent.title || lastScannedStudent.code}</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-emerald-500/50 group-hover:text-emerald-400 shrink-0" />
                  </button>
                </div>
              )}

              {/* Quick Voice Note Option for Last Scanned Item */}
              {recentFabScans.length > 0 && (
                <div className="pt-2 border-t border-slate-800/90 mt-1.5 px-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFabContextMenu(false);
                      setQuickNoteItem(recentFabScans[0]);
                      setShowQuickNoteModal(true);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60 transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
                        <Mic size={14} />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-[11px] font-bold text-purple-200 group-hover:text-purple-100 flex items-center gap-1.5 truncate">
                          <span>Catatan Suara (Quick Note)</span>
                          {savedVoiceNotes[recentFabScans[0].code] && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Audio note tersimpan" />
                          )}
                        </div>
                        <div className="text-[9px] text-purple-300/70 truncate">
                          {recentFabScans[0].title || recentFabScans[0].code}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {savedVoiceNotes[recentFabScans[0].code] ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          Tersimpan
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 font-semibold border border-purple-700/50">
                          Rekam
                        </span>
                      )}
                      <ChevronRight size={14} className="text-purple-400/60 group-hover:text-purple-300" />
                    </div>
                  </button>
                </div>
              )}

              {/* Smart Auto-Trigger Option & Mute */}
              <div className="pt-2 border-t border-slate-800/90 mt-1.5 px-1 space-y-1">
                <button
                  type="button"
                  onClick={toggleSmartAutoTrigger}
                  className="w-full px-2 py-1.5 rounded-lg hover:bg-slate-800 transition flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${smartAutoTrigger ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Video size={14} />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-bold text-slate-200">Smart Auto-Trigger</div>
                      <div className="text-[9px] text-slate-400">Otomatis deteksi QR tanpa klik</div>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${smartAutoTrigger ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${smartAutoTrigger ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={toggleMuteFeedback}
                  className="w-full px-2 py-1.5 rounded-lg hover:bg-slate-800 transition flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${muteFeedback ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                      {muteFeedback ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-bold text-slate-200">Mute Suara & Getaran</div>
                      <div className="text-[9px] text-slate-400">Heningkan notifikasi scan</div>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${muteFeedback ? 'bg-rose-500' : 'bg-slate-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${muteFeedback ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={toggleCameraFacingMode}
                  className="w-full px-2 py-1.5 rounded-lg hover:bg-slate-800 transition flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-slate-800 text-slate-400">
                      <SwitchCamera size={14} />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-bold text-slate-200">Kamera: {cameraFacingMode === 'environment' ? 'Belakang' : 'Depan'}</div>
                      <div className="text-[9px] text-slate-400">Ganti kamera scanner</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 shrink-0" />
                </button>
              </div>

              {/* Default Scanner Mode */}
              <div className="pt-2 border-t border-slate-800/90 mt-1.5 px-2">
                <div className="text-[11px] font-bold text-slate-300 mb-1">Mode Default Scanner</div>
                <div className="flex bg-slate-800/50 p-1 rounded-lg gap-1">
                  {(['ALL', 'STUDENT', 'ASSIGNMENT', 'ASSET'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeDefaultScannerMode(mode);
                      }}
                      className={`flex-1 text-[10px] py-1 rounded-md font-medium transition-colors ${
                        defaultScannerMode === mode
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {mode === 'ALL' ? 'Semua' : mode === 'STUDENT' ? 'Presensi' : mode === 'ASSIGNMENT' ? 'Tugas' : 'Aset'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sparkline Chart */}
              <div className="pt-2 border-t border-slate-800/90 mt-1 px-2">
                <div className="flex items-center gap-1.5 text-slate-300 mb-1">
                  <BarChart2 size={13} className="text-blue-400" />
                  <span className="text-[11px] font-bold">Tren Scan (7 Hari)</span>
                </div>
                <div className="h-[40px] w-full mt-1.5 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scanTrend}>
                      <Line type="monotone" dataKey="scans" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 5. Recent Scans Section (Last Successfully Scanned QR Codes with Search & PDF Export) */}
              <div className="pt-2 border-t border-slate-800/90 mt-1.5">
                <div className="flex items-center justify-between px-2 py-1 mb-1 gap-2">
                  <div className="flex items-center gap-1.5 text-slate-300 shrink-0">
                    <History size={13} className="text-amber-400" />
                    <span className="text-[11px] font-bold">Riwayat Scan</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Export Scans PDF Button */}
                    {filteredFabScans.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportScansPDF();
                        }}
                        disabled={isExportingScansPdf}
                        className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/30 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Export Laporan PDF Pemindaian"
                      >
                        <Download size={10} className={isExportingScansPdf ? 'animate-bounce' : ''} />
                        <span>{isExportingScansPdf ? 'Mengekspor...' : 'Export PDF'}</span>
                      </button>
                    )}

                    {recentFabScans.length > 0 && !showClearScansConfirm && (
                      <button
                        id="btn-clear-all-scan-history"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowClearScansConfirm(true);
                        }}
                        className="text-[9px] px-2 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-600/30 text-rose-300 font-bold border border-rose-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Clear All History / Hapus Semua Riwayat Pemindaian"
                      >
                        <Trash2 size={10} />
                        <span>Clear All History</span>
                      </button>
                    )}
                    {recentFabScans.length > 0 && showClearScansConfirm && (
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-rose-900/80 text-rose-200 font-extrabold border border-rose-700/80">
                        Konfirmasi Hapus
                      </span>
                    )}
                  </div>
                </div>

                {/* Search Bar for Recent Scans */}
                {recentFabScans.length > 0 && (
                  <div className="relative my-1.5 px-2">
                    <Search size={13} className="absolute left-4 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      id="input-fab-scan-search"
                      type="text"
                      value={recentScanQuery}
                      onChange={(e) => setRecentScanQuery(e.target.value)}
                      placeholder="Cari siswa, tugas, aset, kode..."
                      className="w-full pl-8 pr-16 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-[10px] text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition"
                    />
                    {recentScanQuery ? (
                      <div className="absolute right-3 top-1.5 flex items-center gap-1">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          {filteredFabScans.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setRecentScanQuery('')}
                          className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition cursor-pointer"
                          title="Reset pencarian"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="absolute right-4 top-2 text-[9px] text-slate-400 font-mono pointer-events-none">
                        {recentFabScans.length} item
                      </span>
                    )}
                  </div>
                )}

                {recentFabScans.length > 0 && !showClearScansConfirm && (
                  <div className="flex items-center gap-1 mt-1 mb-2 overflow-x-auto pb-1 no-scrollbar px-2">
                    <button onClick={(e) => { e.stopPropagation(); setRecentScanFilter('ALL'); }} className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-colors cursor-pointer ${recentScanFilter === 'ALL' ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Semua</button>
                    <button onClick={(e) => { e.stopPropagation(); setRecentScanFilter('STUDENT'); }} className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-colors cursor-pointer ${recentScanFilter === 'STUDENT' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Presensi</button>
                    <button onClick={(e) => { e.stopPropagation(); setRecentScanFilter('ASSIGNMENT'); }} className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-colors cursor-pointer ${recentScanFilter === 'ASSIGNMENT' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Tugas</button>
                    <button onClick={(e) => { e.stopPropagation(); setRecentScanFilter('ASSET'); }} className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-colors cursor-pointer ${recentScanFilter === 'ASSET' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Aset</button>
                  </div>
                )}

                {showClearScansConfirm ? (
                  <div className="mx-2 my-2 p-3 text-center bg-rose-950/80 rounded-2xl border border-rose-700/80 shadow-2xl backdrop-blur-md">
                    <div className="flex items-center justify-center gap-1.5 text-rose-200 font-extrabold text-xs mb-1">
                      <AlertTriangle size={15} className="text-rose-400 animate-bounce shrink-0" />
                      <span>Hapus Semua Riwayat Scan?</span>
                    </div>
                    <p className="text-[10px] text-rose-200/90 mb-3 leading-relaxed font-medium">
                      Apakah Anda yakin ingin menghapus semua riwayat pemindaian? Total <strong>{recentFabScans.length} entri</strong> log scan terakhir akan dihapus permanen dari perangkat ini.
                    </p>
                    <div className="flex justify-center items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowClearScansConfirm(false);
                        }}
                        className="px-3 py-1 text-[10px] font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearRecentFabScans();
                        }}
                        className="px-3 py-1 text-[10px] font-extrabold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/60 transition cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={11} />
                        <span>Ya, Hapus Semua</span>
                      </button>
                    </div>
                  </div>
                ) : filteredFabScans.length > 0 ? (
                  <div className="space-y-1">
                    {filteredFabScans.slice(0, 5).map((scan) => {
                      const timeStr = (() => {
                        const diffSec = Math.floor((Date.now() - scan.timestamp) / 1000);
                        if (diffSec < 60) return 'Baru saja';
                        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m lalu`;
                        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}j lalu`;
                        return new Date(scan.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                      })();

                      // Infer or assign type configuration for color-coded visual tags
                      const typeConfig = (() => {
                        let t = scan.type;
                        if (!t || t === 'OTHER') {
                          const combined = ((scan.code || '') + ' ' + (scan.title || '') + ' ' + (scan.rawPayload || '')).toLowerCase();
                          if (combined.includes('student') || combined.includes('siswa') || combined.includes('nis')) t = 'STUDENT';
                          else if (combined.includes('tugas') || combined.includes('assignment') || combined.includes('soal')) t = 'ASSIGNMENT';
                          else if (combined.includes('ast-') || combined.includes('brg-') || combined.includes('aset') || combined.includes('barang')) t = 'ASSET';
                        }

                        if (t === 'STUDENT') {
                          return {
                            label: 'Siswa',
                            badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs shadow-emerald-500/10',
                            iconClass: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
                            Icon: UserCheck
                          };
                        }
                        if (t === 'ASSIGNMENT') {
                          return {
                            label: 'Tugas',
                            badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-xs shadow-blue-500/10',
                            iconClass: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
                            Icon: BookOpen
                          };
                        }
                        if (t === 'ASSET') {
                          return {
                            label: 'Aset',
                            badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs shadow-amber-500/10',
                            iconClass: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
                            Icon: Package
                          };
                        }
                        return {
                          label: 'QR Umum',
                          badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-xs shadow-indigo-500/10',
                          iconClass: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400',
                          Icon: QrCode
                        };
                      })();

                      const TypeIcon = typeConfig.Icon;

                      return (
                        <button
                          key={scan.id}
                          type="button"
                          onClick={() => handleSelectRecentScan(scan)}
                          className="w-full p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 text-left transition flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs border ${typeConfig.iconClass}`}>
                              <TypeIcon size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-[11px] font-bold text-slate-200 group-hover:text-amber-300 truncate">
                                  {scan.title || scan.code}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold border shrink-0 ${typeConfig.badgeClass}`}>
                                  {typeConfig.label}
                                </span>
                              </div>
                              <div className="text-[9px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono">{scan.code}</span>
                                <span>•</span>
                                <span>{timeStr}</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={13} className="text-slate-600 group-hover:text-slate-300 shrink-0" />
                        </button>
                      );
                    })}
                    {!showClearScansConfirm && recentFabScans.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowClearScansConfirm(true);
                        }}
                        className="w-full mt-2 py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-[10px] font-bold border border-rose-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>Clear All History ({recentFabScans.length})</span>
                      </button>
                    )}
                  </div>
                ) : recentFabScans.length > 0 ? (
                  <div className="mx-2 my-1.5 p-3 text-center text-[10px] text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <Search size={16} className="mx-auto mb-1 text-slate-500 opacity-60" />
                    <p className="font-semibold text-slate-300">Tidak ada hasil cocok</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Tidak ditemukan pemindaian dengan kata kunci "{recentScanQuery}"</p>
                    <button
                      type="button"
                      onClick={() => setRecentScanQuery('')}
                      className="mt-2 text-[9px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold transition cursor-pointer"
                    >
                      Reset Pencarian
                    </button>
                  </div>
                ) : (
                  <div className="px-3 py-2 text-center text-[10px] text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800/60 my-0.5">
                    Belum ada riwayat scan tersimpan
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Small semi-transparent label tag showing Current Class code & session nudge */}
        <div className="flex items-center mr-2 sm:mr-3">
          <div
            className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md shadow-xl border flex items-center gap-2 transition-all duration-300 select-none ${
              scheduleNudge.status === 'ACTIVE'
                ? 'bg-slate-950/85 border-amber-500/50 text-amber-200 shadow-amber-500/20'
                : scheduleNudge.status === 'IMMINENT'
                ? 'bg-slate-950/85 border-rose-500/50 text-rose-200 shadow-rose-500/20'
                : 'bg-slate-950/75 border-slate-700/80 text-slate-200 shadow-slate-950/30'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span
                style={{ animationDuration: 'var(--pulse-duration)' }}
                className={`w-2 h-2 rounded-full ${
                  scheduleNudge.status === 'ACTIVE'
                    ? 'bg-amber-400 animate-ping'
                    : scheduleNudge.status === 'IMMINENT'
                    ? 'bg-rose-400 animate-ping'
                    : scheduleNudge.status === 'SOON'
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden xs:inline">
                Target:
              </span>
              <span className="text-xs font-black font-mono text-emerald-300">
                {targetClassCode}
              </span>
            </div>

            {scheduleNudge.badgeText && (
              <span className="hidden md:inline-flex items-center text-[10px] font-bold border-l border-slate-700/80 pl-2 text-amber-300">
                {scheduleNudge.badgeText}
              </span>
            )}
          </div>
        </div>

        {/* Keyboard shortcut display (hint) that renders on hover or focus for accessibility */}
        <div
          id="fab-qr-shortcut-hint"
          role="tooltip"
          className="hidden sm:flex items-center mr-2 px-3 py-1.5 rounded-xl bg-slate-900/40 backdrop-blur-xl text-white text-xs font-semibold shadow-2xl border border-white/10 opacity-0 scale-95 translate-x-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:translate-x-0 focus-within:opacity-100 focus-within:scale-100 focus-within:translate-x-0 transition-all duration-300 ease-out pointer-events-none whitespace-nowrap"
        >
          <span>
            {qrScannerTargetMode === 'STUDENT' ? 'Scan Presensi' :
             qrScannerTargetMode === 'ASSIGNMENT' ? 'Scan Tugas' :
             qrScannerTargetMode === 'ASSET' ? 'Scan Aset' :
             isWithinTenMinutesOfClass ? 'Presensi Siswa Otomatis' : 'Pindai QR Scanner'}
          </span>
          <kbd className="ml-2 px-1.5 py-0.5 rounded bg-slate-800/60 text-[10px] font-mono text-emerald-400 border border-white/10 shadow-xs">
            Ctrl+Shift+S
          </kbd>
        </div>

        {/* Floating Action Button Container */}
        <div className="relative group flex items-center">
          {/* Visual Success Indicator Popover Banner on Scan Success */}
          <AnimatePresence>
            {isFabSuccessAnimating && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.75 }}
                animate={{ opacity: 1, y: -14, scale: 1 }}
                exit={{ opacity: 0, y: -22, scale: 0.8 }}
                transition={{ duration: 0.3, ease: 'backOut' }}
                className="absolute -top-11 right-0 z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 text-white font-extrabold text-xs shadow-2xl shadow-emerald-500/60 border border-emerald-200 whitespace-nowrap pointer-events-none"
              >
                <CheckCircle2 size={16} className="text-white animate-bounce shrink-0" />
                <span>QR Berhasil Terpindai!</span>
                <span className="w-2 h-2 rounded-full bg-white animate-ping ml-0.5" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Radiating Success Pulse Ping Rings */}
          {isFabSuccessAnimating && (
            <>
              <span className="absolute -inset-3 rounded-3xl bg-emerald-400/60 animate-ping pointer-events-none z-0" />
              <span className="absolute -inset-6 rounded-3xl bg-teal-400/30 animate-pulse pointer-events-none z-0" />
            </>
          )}

          {/* Floating Action Button */}
          <motion.button
            id="btn-classroom-qr-fab"
            onClick={handleFabClick}
            onContextMenu={handleContextMenu}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            whileHover={{ scale: 1.07, boxShadow: '0px 0px 20px rgba(52, 211, 153, 0.6)' }}
            whileFocus={{ scale: 1.07, boxShadow: '0px 0px 20px rgba(52, 211, 153, 0.6)' }}
            whileTap={{ scale: 0.93 }}
            animate={
              isFabSuccessAnimating
                ? {
                    scale: [1, 1.3, 1.08, 1.18, 1],
                    backgroundColor: ['#059669', '#10b981', '#059669'],
                    boxShadow: [
                      '0px 0px 0px rgba(16, 185, 129, 0)',
                      '0px 0px 50px rgba(16, 185, 129, 1)',
                      '0px 0px 25px rgba(16, 185, 129, 0.7)',
                      '0px 0px 0px rgba(16, 185, 129, 0)'
                    ]
                  }
                : (!isLowBattery && isWithinFiveMinutesOfClass)
                ? { scale: [1, 1.04, 1] }
                : { scale: 1 }
            }
            transition={
              isFabSuccessAnimating
                ? { duration: 1.2, ease: 'easeOut' }
                : (!isLowBattery && isWithinFiveMinutesOfClass)
                ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
                : { type: 'spring', stiffness: 400, damping: 25 }
            }
            style={{ '--pulse-duration': pulseDuration } as React.CSSProperties}
            className={`relative flex items-center justify-center gap-2 p-3 sm:px-4 sm:py-3 rounded-2xl shadow-xl transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 z-10 ${
              isFabSuccessAnimating
                ? 'bg-emerald-500 text-white ring-4 ring-emerald-300 ring-offset-2 ring-offset-slate-900 font-extrabold shadow-emerald-500/70'
                : highContrast
                ? 'bg-amber-400 text-black border-2 border-black font-black'
                : scheduleNudge.status === 'ACTIVE'
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-amber-500/40 border border-amber-300/40 ring-2 ring-amber-400/80 ring-offset-2 ring-offset-slate-900'
                : scheduleNudge.status === 'IMMINENT'
                ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-500/40 border border-rose-300/40 ring-2 ring-rose-400/80 ring-offset-2 ring-offset-slate-900'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-emerald-500/30 border border-white/20'
            }`}
            title={`Pindai QR Tugas / Siswa / Aset (Target: ${targetClassCode}) • Tekan lama atau Klik Kanan untuk Menu Pilihan Mode`}
            aria-label="Pindai QR Scanner Cepat"
          >
            {/* Dynamic Glowing Beacon Background with Proximity-Aware Intensity */}
            <span
              style={{ animationDuration: 'var(--pulse-duration)' }}
              className={`absolute -inset-0.5 rounded-2xl transition-opacity duration-300 -z-10 ${
                isFabSuccessAnimating
                  ? 'bg-emerald-400 opacity-100 blur-md animate-pulse'
                  : scheduleNudge.status === 'ACTIVE'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 opacity-90 blur-md animate-pulse'
                  : scheduleNudge.status === 'IMMINENT'
                  ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 opacity-85 blur-md animate-pulse'
                  : scheduleNudge.status === 'SOON'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-60 blur-sm'
                  : 'bg-gradient-to-r from-emerald-500 to-indigo-500 opacity-40 blur-sm group-hover:opacity-80'
              }`}
            />

            {/* Schedule Proximity Active Status Pulse Ping */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span
                style={{ animationDuration: 'var(--pulse-duration)' }}
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  isFabSuccessAnimating
                    ? 'bg-emerald-200 opacity-100 scale-150'
                    : scheduleNudge.status === 'ACTIVE'
                    ? 'bg-amber-400 opacity-95 scale-125'
                    : scheduleNudge.status === 'IMMINENT'
                    ? 'bg-rose-400 opacity-90 scale-110'
                    : scheduleNudge.status === 'SOON'
                    ? 'bg-cyan-400 opacity-80'
                    : 'bg-emerald-400 opacity-75'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white shadow-xs ${
                  isFabSuccessAnimating
                    ? 'bg-emerald-300 ring-2 ring-emerald-100'
                    : scheduleNudge.status === 'ACTIVE'
                    ? 'bg-amber-500 ring-2 ring-amber-200'
                    : scheduleNudge.status === 'IMMINENT'
                    ? 'bg-rose-500 ring-2 ring-rose-200'
                    : scheduleNudge.status === 'SOON'
                    ? 'bg-cyan-500'
                    : 'bg-emerald-500'
                }`}
              />
            </span>

            {isFabSuccessAnimating ? (
              <>
                <CheckCircle2 className="w-5 h-5 sm:w-5 sm:h-5 shrink-0 stroke-[2.8] text-white animate-bounce" />
                <span className="hidden sm:inline font-black text-xs tracking-wide text-white">
                  Berhasil!
                </span>
              </>
            ) : (
              <>
                <Scan className="w-5 h-5 sm:w-5 sm:h-5 shrink-0 stroke-[2.2]" />
                <span className="hidden sm:inline font-bold text-xs tracking-wide">
                  Scan QR
                </span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* STUDENT FEEDBACK NOTIFICATIONS MODAL */}
      {showFeedbackModal && (
        <StudentFeedbackNotificationsModal
          feedbacks={studentFeedbacks}
          onClose={() => setShowFeedbackModal(false)}
          onSelectAssignment={() => setPage('assignments')}
        />
      )}

      {/* CLASSROOM AI CHAT TUTOR MODAL FOR STUDENTS */}
      <ClassroomAIChat
        account={account}
        assignment={aiChatAssignment}
        isOpen={showAIChatModal}
        onClose={() => setShowAIChatModal(false)}
      />

      {/* USER PROFILE & ACCESSIBILITY SETTINGS & BADGES MODAL */}
      <UserProfileSettingsModal
        account={account}
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        highContrast={highContrast}
        onToggleHighContrast={handleToggleHighContrast}
      />

      {/* GLOBAL QR SCANNER MODAL (Ctrl+Shift+S) */}
      <QRScannerModal
        isOpen={showGlobalQrScanner}
        onClose={() => setShowGlobalQrScanner(false)}
        initialMode={qrScannerTargetMode}
        facingMode={cameraFacingMode}
        currentClass={targetClassCode}
        onScanSuccess={handleScanSuccessAnimation}
        onSelectAsset={() => {
          setShowGlobalQrScanner(false);
        }}
        onSelectAssignment={(asg) => {
          setShowGlobalQrScanner(false);
          setPage('assignments');
        }}
        onSelectStudent={(stu) => {
          setShowGlobalQrScanner(false);
          setPage('attendance');
        }}
      />

      {/* QUICK VOICE NOTE MODAL FOR FAB SCANNED ITEM */}
      {showQuickNoteModal && quickNoteItem && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Mic size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Catatan Suara Guru</h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {quickNoteItem.title || quickNoteItem.code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickNoteModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
              <div className="font-semibold text-purple-300 mb-0.5">Item Terpindai:</div>
              <div className="font-bold text-slate-100">{quickNoteItem.title || quickNoteItem.code}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Kode: {quickNoteItem.code} • Kategori: {quickNoteItem.type}
              </div>
            </div>

            <VoiceNoteRecorder
              existingVoiceNote={savedVoiceNotes[quickNoteItem.code]}
              onSaveVoiceNote={(base64) => {
                handleSaveQuickVoiceNote(quickNoteItem.code, base64);
              }}
            />

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowQuickNoteModal(false)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Selesai & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI REMEDIAL & MODUL AJAR KURIKULUM MERDEKA MODAL */}
      <AIRemedialModulModal
        isOpen={showAIRemedialModal}
        onClose={() => setShowAIRemedialModal(false)}
        students={classStudents}
        assignments={allAssignments}
      />

      {/* PARENT PORTAL & WHATSAPP NOTIFICATION HUB MODAL */}
      <ParentPortalModal
        isOpen={showParentPortalModal}
        onClose={() => setShowParentPortalModal(false)}
        allStudents={classStudents}
      />

      {/* EXECUTIVE SUPERVISOR & PRINCIPAL REPORT MODAL */}
      <ExecutiveSupervisorReportModal
        isOpen={showExecutiveReportModal}
        onClose={() => setShowExecutiveReportModal(false)}
      />

      {/* KIOS PRESENSI NFC & SMART CARD GERBANG */}
      <NFCGateAttendanceModal
        isOpen={showNFCModal}
        onClose={() => setShowNFCModal(false)}
        allStudents={classStudents}
      />

      {/* OTENTIKASI TUNGGAL SSO BELAJAR.ID */}
      <BelajarIdSSOModal
        isOpen={showSSOModal}
        onClose={() => setShowSSOModal(false)}
      />

      {/* MATRIKS KEAMANAN RBAC & AUDIT LOG */}
      <RBACAuditLogModal
        isOpen={showRBACModal}
        onClose={() => setShowRBACModal(false)}
      />

      {/* IOT SMART CLASSROOM & TELEMETRI FASILITAS */}
      <IoTSmartClassroomModal
        isOpen={showIoTModal}
        onClose={() => setShowIoTModal(false)}
      />

      {/* KIOS MANDIRI PERPUSTAKAAN DIGITAL */}
      <LibraryKioskModal
        isOpen={showLibraryKioskModal}
        onClose={() => setShowLibraryKioskModal(false)}
        allStudents={classStudents}
      />

      {/* EARLY WARNING SYSTEM & P5 RADAR MATRIX */}
      <EarlyWarningP5Modal
        isOpen={showEarlyWarningP5Modal}
        onClose={() => setShowEarlyWarningP5Modal(false)}
        students={classStudents}
      />

      {/* PARTICLE CELEBRATION MILESTONE ANIMATION */}
      {celebratingMilestone && (
        <ParticleCelebration
          isOpen={Boolean(celebratingMilestone)}
          onClose={() => setCelebratingMilestone(null)}
          studentName={celebratingMilestone.studentName}
          milestoneTitle={celebratingMilestone.milestoneTitle}
          milestoneCategory={celebratingMilestone.milestoneCategory}
          rewardPoints={celebratingMilestone.rewardPoints}
        />
      )}

      {fabQuickGradeStudent && (
        <QuickGradeModal
          student={fabQuickGradeStudent}
          account={account}
          onClose={() => setFabQuickGradeStudent(null)}
          onSaved={() => {
            setFabQuickGradeStudent(null);
            refresh();
          }}
        />
      )}
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

// ==========================================
// WEEKLY GRADE TRENDS RECHARTS COMPONENT
// ==========================================
const WeeklyGradeTrendsChart: React.FC<{
  account: Account;
}> = ({ account }) => {
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';
  const [selectedKelas, setSelectedKelas] = useState<string>(account.KELAS || 'Kelas 1');
  const [metricView, setMetricView] = useState<'GABUNGAN' | 'TUGAS' | 'KUIS'>('GABUNGAN');
  const [showPrediction, setShowPrediction] = useState<boolean>(true);

  const targetClass = isGuru ? account.KELAS || 'Kelas 1' : selectedKelas;
  const trendData = classroomService.getWeeklyClassGradeTrends(targetClass);

  const extendedTrendData = useMemo(() => {
    const base = trendData.map((d) => ({ ...d, isPredicted: false }));
    if (base.length < 2) return base;

    const n = base.length;
    const lastWeek = base[n - 1];
    const slopeGabungan = (lastWeek.rataRataGabungan - base[0].rataRataGabungan) / (n - 1);
    const slopeTugas = (lastWeek.rataRataTugas - base[0].rataRataTugas) / (n - 1);
    const slopeKuis = (lastWeek.rataRataKuis - base[0].rataRataKuis) / (n - 1);

    const predWeek9 = {
      minggu: 'Minggu 9 (Prediksi)',
      rataRataTugas: Math.min(100, Math.max(50, Math.round(lastWeek.rataRataTugas + slopeTugas))),
      rataRataKuis: Math.min(100, Math.max(50, Math.round(lastWeek.rataRataKuis + slopeKuis))),
      rataRataGabungan: Math.min(100, Math.max(50, Math.round(lastWeek.rataRataGabungan + slopeGabungan))),
      kkm: 75,
      isPredicted: true,
    };

    const predWeek10 = {
      minggu: 'Minggu 10 (Prediksi)',
      rataRataTugas: Math.min(100, Math.max(50, Math.round(lastWeek.rataRataTugas + slopeTugas * 2))),
      rataRataKuis: Math.min(100, Math.max(50, Math.round(lastWeek.rataRataKuis + slopeKuis * 2))),
      rataRataGabungan: Math.min(100, Math.max(50, Math.round(lastWeek.rataRataGabungan + slopeGabungan * 2))),
      kkm: 75,
      isPredicted: true,
    };

    return showPrediction ? [...base, predWeek9, predWeek10] : base;
  }, [trendData, showPrediction]);

  // Identify students at risk of falling below KKM (<75) in the next 2 weeks
  const predictedAtRiskStudents = useMemo(() => {
    const students = accountService.getStudents(targetClass);
    return students
      .map((s) => {
        const subs = classroomService.getSubmissions(undefined, s.ID);
        const graded = subs.filter((sub) => sub.NILAI !== undefined);
        const recentAvg =
          graded.length > 0
            ? Math.round(graded.reduce((acc, curr) => acc + (curr.NILAI || 0), 0) / graded.length)
            : 73;
        const predicted2Wks = Math.round(recentAvg - 3.5);
        return {
          student: s,
          recentAvg,
          predicted2Wks,
          isAtRisk: predicted2Wks < 75,
        };
      })
      .filter((item) => item.isAtRisk);
  }, [targetClass]);

  const currentAvg = trendData[trendData.length - 1]?.rataRataGabungan || 88;
  const firstAvg = trendData[0]?.rataRataGabungan || 79;
  const trendDiff = (currentAvg - firstAvg).toFixed(1);
  const isPositive = parseFloat(trendDiff) >= 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 font-bold">
              <TrendingUp size={16} />
            </span>
            <h3 className="text-sm font-black text-slate-900">
              Tren Nilai Rata-Rata Kelas & Model Prediksi 2 Minggu
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 text-[10px] font-extrabold border border-indigo-200">
              {targetClass}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Grafik perkembangan nilai rata-rata tugas & kuis CBT dengan analisis regresi tren hingga Minggu 10
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPrediction(!showPrediction)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
              showPrediction
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-xs'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Sparkles size={14} />
            <span>{showPrediction ? 'Prediksi 2 Mgg Aktif' : '+Tampilkan Prediksi'}</span>
          </button>

          {isKepsek && (
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-indigo-600"
            >
              {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setMetricView('GABUNGAN')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                metricView === 'GABUNGAN'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gabungan
            </button>
            <button
              onClick={() => setMetricView('TUGAS')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                metricView === 'TUGAS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rata-rata Tugas
            </button>
            <button
              onClick={() => setMetricView('KUIS')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                metricView === 'KUIS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rata-rata Kuis
            </button>
          </div>
        </div>
      </div>

      {/* Proactive Alert Notification Banner for Teacher */}
      {predictedAtRiskStudents.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-amber-200 text-amber-800 shrink-0">
              <AlertTriangle size={20} />
            </span>
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-xs text-amber-950 flex items-center gap-2">
                <span>Notifikasi Proaktif Prediksi AI: Intervensi Diperlukan</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[9px] font-black">
                  {predictedAtRiskStudents.length} Siswa Berisiko Below KKM
                </span>
              </h4>
              <p className="text-xs text-amber-800">
                Berdasarkan tren mingguan, siswa berikut diprediksi mengalami penurunan nilai hingga di bawah KKM (75) dalam 2 minggu ke depan:
              </p>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {predictedAtRiskStudents.map((item) => (
                  <span
                    key={item.student.ID}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-[11px] font-bold text-slate-800 flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{item.student.NAMA}</span>
                    <span className="text-rose-600 font-mono font-black text-[10px]">
                      (Pred: {item.predicted2Wks})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recharts Chart Area */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={extendedTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTugas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorKuis" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="minggu" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 font-sans">
                      <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 mb-1 flex items-center justify-between gap-2">
                        <span>{data.minggu} ({targetClass})</span>
                        {data.isPredicted && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black">
                            PREDIKSI AI
                          </span>
                        )}
                      </div>
                      <div className="text-indigo-300">
                        Rata-Rata Tugas: <span className="font-extrabold text-white">{data.rataRataTugas}</span>
                      </div>
                      <div className="text-emerald-300">
                        Rata-Rata Kuis CBT: <span className="font-extrabold text-white">{data.rataRataKuis}</span>
                      </div>
                      <div className="text-amber-300">
                        Rata-Rata Gabungan: <span className="font-extrabold text-white">{data.rataRataGabungan}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between gap-3">
                        <span>KKM: {data.kkm}</span>
                        <span className={data.rataRataGabungan >= 75 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {data.rataRataGabungan >= 75 ? '✓ Di Atas KKM' : '⚠ Perlu Bimbingan'}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <ReferenceLine
              y={75}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: 'Batas KKM (75)', fill: '#ef4444', fontSize: 10, position: 'insideBottomRight' }}
            />

            {(metricView === 'GABUNGAN' || metricView === 'TUGAS') && (
              <Area
                type="monotone"
                dataKey="rataRataTugas"
                name="Rata-rata Tugas"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorTugas)"
              />
            )}
            {(metricView === 'GABUNGAN' || metricView === 'KUIS') && (
              <Area
                type="monotone"
                dataKey="rataRataKuis"
                name="Rata-rata Kuis CBT"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorKuis)"
              />
            )}
            {metricView === 'GABUNGAN' && (
              <Line
                type="monotone"
                dataKey="rataRataGabungan"
                name="Rata-rata Gabungan Kelas"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Insight Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Nilai Terakhir (Minggu 8)</span>
            <div className="text-lg font-black text-indigo-900 mt-0.5">{currentAvg} / 100</div>
          </div>
          <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
            <BarChart2 size={18} />
          </span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tren Perkembangan</span>
            <div
              className={`text-lg font-black mt-0.5 flex items-center gap-1 ${
                isPositive ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              <TrendingUp size={16} /> {isPositive ? `+${trendDiff}%` : `${trendDiff}%`}
            </div>
          </div>
          <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
            <Sparkles size={18} />
          </span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Status Prediksi KKM</span>
            <div className="text-lg font-black text-emerald-800 mt-0.5 flex items-center gap-1">
              {predictedAtRiskStudents.length === 0 ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-600" /> 100% Tuntas
                </>
              ) : (
                <>
                  <AlertTriangle size={16} className="text-amber-600" /> {predictedAtRiskStudents.length} Berisiko
                </>
              )}
            </div>
          </div>
          <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <Award size={18} />
          </span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COURSE GRADE DISTRIBUTION RECHARTS COMPONENT
// ==========================================
interface CourseGradeDistributionChartProps {
  account: Account;
  courses: ClassroomCourse[];
}

const CourseGradeDistributionChart: React.FC<CourseGradeDistributionChartProps> = ({ account, courses }) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.ID || '');
  const [compareCourseId, setCompareCourseId] = useState<string>(courses[1]?.ID || courses[0]?.ID || '');
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);

  // Keep selectedCourseId in sync if courses change
  useEffect(() => {
    if (courses.length > 0 && (!selectedCourseId || !courses.some((c) => c.ID === selectedCourseId))) {
      setSelectedCourseId(courses[0].ID);
    }
  }, [courses, selectedCourseId]);

  const activeCourse = courses.find((c) => c.ID === selectedCourseId) || courses[0];
  const compareCourse = courses.find((c) => c.ID === compareCourseId) || courses[1] || courses[0];

  const getDistributionForCourse = (course: ClassroomCourse | undefined) => {
    if (!course) {
      return {
        chartData: [],
        totalSubmissions: 0,
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0,
        kkmPassRate: 100,
        gradeCounts: { A: 0, B: 0, C: 0, D: 0 },
      };
    }

    const courseAssignments = classroomService.getAssignments(course.ID);
    const assignmentIds = courseAssignments.map((a) => a.ID);

    const allSubs = classroomService.getSubmissions();
    const courseSubs = allSubs.filter(
      (s) => assignmentIds.includes(s.ASSIGNMENT_ID) && s.NILAI !== undefined
    );

    let grades: number[] = [];
    if (courseSubs.length > 0) {
      grades = courseSubs.map((s) => s.NILAI as number);
    } else {
      const seed = course.ID.charCodeAt(course.ID.length - 1) % 5;
      grades = [88 + seed, 92 - seed, 85, 78 + seed, 95, 84, 90 - seed, 82];
    }

    let aCount = 0;
    let bCount = 0;
    let cCount = 0;
    let dCount = 0;

    grades.forEach((g) => {
      if (g >= 90) aCount++;
      else if (g >= 80) bCount++;
      else if (g >= 70) cCount++;
      else dCount++;
    });

    const total = grades.length;
    const avg = total > 0 ? Math.round(grades.reduce((acc, v) => acc + v, 0) / total) : 0;
    const max = total > 0 ? Math.max(...grades) : 0;
    const min = total > 0 ? Math.min(...grades) : 0;
    const passCount = grades.filter((g) => g >= 75).length;
    const passRate = total > 0 ? Math.round((passCount / total) * 100) : 100;

    return {
      totalSubmissions: total,
      averageGrade: avg,
      highestGrade: max,
      lowestGrade: min,
      kkmPassRate: passRate,
      gradeCounts: { A: aCount, B: bCount, C: cCount, D: dCount },
    };
  };

  const distributionStats = useMemo(() => getDistributionForCourse(activeCourse), [activeCourse]);
  const compareStats = useMemo(() => getDistributionForCourse(compareCourse), [compareCourse]);

  const combinedComparisonData = useMemo(() => {
    const ranges = [
      { key: 'A', range: '90 - 100 (A)', label: 'Sangat Baik' },
      { key: 'B', range: '80 - 89 (B)', label: 'Baik' },
      { key: 'C', range: '70 - 79 (C)', label: 'Cukup / KKM' },
      { key: 'D', range: '< 70 (D)', label: 'Perlu Remedial' },
    ];

    return ranges.map((r) => ({
      range: r.range,
      label: r.label,
      classA: distributionStats.gradeCounts[r.key as 'A' | 'B' | 'C' | 'D'] || 0,
      classB: compareStats.gradeCounts[r.key as 'A' | 'B' | 'C' | 'D'] || 0,
    }));
  }, [distributionStats, compareStats]);

  if (!activeCourse) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 font-bold">
              <BarChart2 size={16} />
            </span>
            <h3 className="text-sm font-black text-slate-900">
              Distribusi Nilai {isCompareMode ? 'Komparasi Antar-Rombel' : `Mata Pelajaran (${activeCourse.NAMA})`}
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-extrabold border border-blue-200">
              {activeCourse.KODE_KELAS}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCompareMode
              ? `Perbandingan sebaran nilai antara ${activeCourse.KODE_KELAS} (${activeCourse.NAMA}) dan ${compareCourse.KODE_KELAS} (${compareCourse.NAMA})`
              : `Visualisasi sebaran capaian rentang nilai tugas siswa untuk mata pelajaran: ${activeCourse.NAMA}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
              isCompareMode
                ? 'bg-indigo-600 text-white border-indigo-500 font-extrabold shadow-xs'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <BarChart2 size={14} />
            <span>{isCompareMode ? 'Mode Tunggal' : '📊 Komparasi Antar-Rombel'}</span>
          </button>

          <div className="flex items-center gap-2">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-blue-600 max-w-[180px] truncate"
            >
              {courses.map((c) => (
                <option key={c.ID} value={c.ID}>
                  {c.KODE_KELAS} - {c.NAMA}
                </option>
              ))}
            </select>

            {isCompareMode && (
              <>
                <span className="text-xs text-slate-400 font-black">vs</span>
                <select
                  value={compareCourseId}
                  onChange={(e) => setCompareCourseId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-900 focus:outline-indigo-600 max-w-[180px] truncate"
                >
                  {courses.map((c) => (
                    <option key={c.ID} value={c.ID}>
                      {c.KODE_KELAS} - {c.NAMA}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Rata-Rata Kelas Utama</span>
          <div className="text-lg font-black text-blue-900 mt-0.5">{distributionStats.averageGrade} / 100</div>
          <span className="text-[10px] text-slate-500 font-semibold">{distributionStats.totalSubmissions} Tugas</span>
        </div>

        {isCompareMode ? (
          <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200">
            <span className="text-[10px] font-bold text-indigo-700 uppercase">Rata-Rata Kelas Pembanding</span>
            <div className="text-lg font-black text-indigo-900 mt-0.5">{compareStats.averageGrade} / 100</div>
            <span className="text-[10px] text-indigo-700 font-semibold">{compareStats.totalSubmissions} Tugas</span>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Nilai Tertinggi</span>
            <div className="text-lg font-black text-emerald-900 mt-0.5">{distributionStats.highestGrade}</div>
            <span className="text-[10px] text-emerald-700 font-semibold">{distributionStats.gradeCounts.A} Predikat A</span>
          </div>
        )}

        <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
          <span className="text-[10px] font-bold text-amber-700 uppercase">Delta Selisih Nilai</span>
          <div className="text-lg font-black text-amber-900 mt-0.5 font-mono">
            {isCompareMode
              ? `${distributionStats.averageGrade >= compareStats.averageGrade ? '+' : ''}${
                  distributionStats.averageGrade - compareStats.averageGrade
                } Pts`
              : `${distributionStats.lowestGrade} Min`}
          </div>
          <span className="text-[10px] text-amber-700 font-semibold">
            {isCompareMode ? 'Selisih Performa Rombel' : `${distributionStats.gradeCounts.D} Perlu Remedial`}
          </span>
        </div>

        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200">
          <span className="text-[10px] font-bold text-indigo-700 uppercase">Ketuntasan KKM (≥75)</span>
          <div className="text-lg font-black text-indigo-900 mt-0.5">{distributionStats.kkmPassRate}%</div>
          <span className="text-[10px] text-indigo-700 font-semibold">Tuntas Sesuai Kriteria</span>
        </div>
      </div>

      {/* Recharts Bar Chart for Grade Distribution */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={combinedComparisonData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} domain={[0, 'auto']} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                      <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 mb-1 flex items-center justify-between gap-4">
                        <span>{item.range}</span>
                        <span className="text-[10px] font-normal text-slate-400">{item.label}</span>
                      </div>
                      <div className="text-blue-300 flex items-center justify-between gap-4">
                        <span>{activeCourse.KODE_KELAS} ({activeCourse.NAMA}):</span>
                        <strong className="text-white font-mono">{item.classA} siswa</strong>
                      </div>
                      {isCompareMode && (
                        <div className="text-indigo-300 flex items-center justify-between gap-4">
                          <span>{compareCourse.KODE_KELAS} ({compareCourse.NAMA}):</span>
                          <strong className="text-white font-mono">{item.classB} siswa</strong>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 5 }} />
            <Bar
              dataKey="classA"
              name={`${activeCourse.KODE_KELAS} (${activeCourse.NAMA})`}
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
            />
            {isCompareMode && (
              <Bar
                dataKey="classB"
                name={`${compareCourse.KODE_KELAS} (${compareCourse.NAMA})`}
                fill="#8b5cf6"
                radius={[6, 6, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ==========================================
// STUDENT FEEDBACK NOTIFICATIONS MODAL
// ==========================================
const StudentFeedbackNotificationsModal: React.FC<{
  feedbacks: Array<{
    id: string;
    assignmentId: string;
    assignmentTitle: string;
    guruNama: string;
    nilai?: number;
    feedback?: string;
    gradedAt?: string;
  }>;
  onClose: () => void;
  onSelectAssignment: () => void;
}> = ({ feedbacks, onClose, onSelectAssignment }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Notifikasi Feedback dari Guru</h3>
              <p className="text-xs text-slate-500">Daftar evaluasi dan catatan guru untuk tugas Anda</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {feedbacks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Belum ada feedback baru dari guru.</div>
          ) : (
            feedbacks.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-xs text-indigo-900 line-clamp-1">
                    {f.assignmentTitle}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs border border-emerald-300 shrink-0">
                    Nilai: {f.nilai !== undefined ? f.nilai : '-'}/100
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700 italic">
                  "{f.feedback}"
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="font-bold text-slate-700">Oleh: {f.guruNama}</span>
                  <span className="text-slate-400 font-mono">{f.gradedAt}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-bold">Total Feedback: {feedbacks.length}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onClose();
                onSelectAssignment();
              }}
              className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
            >
              Buka Halaman Tugas &rarr;
            </button>
          </div>
        </div>
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

      {/* P5 PROJECT PROGRESS TRACKER WIDGET FOR SISWA, GURU & KEPSEK */}
      <P5ProjectTrackerWidget account={account} />

      {/* STUDENT BADGES & ACHIEVEMENTS VIRTUAL MEDALS WIDGET */}
      {isSiswa && (
        <StudentBadgesWidget siswaId={account.ID} siswaNama={account.NAMA} />
      )}

      {/* WEEKLY GRADE TRENDS RECHARTS VISUALIZATION */}
      <WeeklyGradeTrendsChart account={account} />

      {/* COURSE GRADE DISTRIBUTION RECHARTS VISUALIZATION */}
      <CourseGradeDistributionChart account={account} courses={courses} />

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

// ============ COMPONENT: STUDENT GRADE PROGRESSION SPARKLINE ============
interface StudentGradeSparklineProps {
  studentId: string;
  studentName: string;
  submissions: ClassroomSubmission[];
  onQuickGradeClick?: () => void;
  canGrade?: boolean;
}

const StudentGradeSparkline: React.FC<StudentGradeSparklineProps> = React.memo(({
  studentId,
  studentName,
  submissions,
  onQuickGradeClick,
  canGrade = false,
}) => {
  const gradedList = useMemo(() => {
    return submissions
      .filter((s) => s.STATUS === 'GRADED' && typeof s.NILAI === 'number')
      .sort((a, b) => (a.SUBMITTED_AT || '').localeCompare(b.SUBMITTED_AT || ''));
  }, [submissions]);

  const dataPoints: number[] = useMemo(() => {
    if (gradedList.length >= 2) {
      return gradedList.map((s) => s.NILAI as number);
    }
    if (gradedList.length === 1) {
      const score = gradedList[0].NILAI as number;
      const base = Math.max(60, score - 6);
      return [base, score];
    }
    // Deterministic progression based on student ID char codes so each student has a meaningful trend visualization
    const charCodeSum = studentId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const baseScore = 75 + (charCodeSum % 14);
    const delta1 = ((charCodeSum * 3) % 7) - 2;
    const delta2 = ((charCodeSum * 7) % 9) - 1;
    const delta3 = ((charCodeSum * 11) % 8) + 1;
    return [
      baseScore,
      Math.min(100, Math.max(60, baseScore + delta1)),
      Math.min(100, Math.max(60, baseScore + delta1 + delta2)),
      Math.min(100, Math.max(65, baseScore + delta1 + delta2 + delta3)),
    ];
  }, [gradedList, studentId]);

  const minVal = Math.min(...dataPoints);
  const maxVal = Math.max(...dataPoints);
  const range = maxVal - minVal || 10;

  const width = 64;
  const height = 22;
  const padX = 4;
  const padY = 4;

  const points = dataPoints.map((val, idx) => {
    const x = padX + (idx / (dataPoints.length - 1)) * (width - padX * 2);
    const y = height - padY - ((val - minVal) / range) * (height - padY * 2);
    return { x, y, val };
  });

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPoints = `${points[0].x.toFixed(1)},${height} ${polylinePoints} ${points[points.length - 1].x.toFixed(1)},${height}`;

  const firstVal = dataPoints[0];
  const lastVal = dataPoints[dataPoints.length - 1];
  const diff = lastVal - firstVal;

  const trendColor = diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : '#3b82f6';
  const trendBg = diff > 0
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : diff < 0
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : 'bg-blue-50 text-blue-700 border-blue-200';

  const lastPoint = points[points.length - 1];
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      onClick={(e) => {
        if (onQuickGradeClick) {
          e.stopPropagation();
          onQuickGradeClick();
        }
      }}
      className={`relative flex items-center gap-1.5 cursor-pointer select-none transition-transform ${
        onQuickGradeClick ? 'hover:opacity-90 active:scale-95' : ''
      }`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      title={`Progres Nilai ${studentName}: ${dataPoints.join(' ➔ ')} (${diff >= 0 ? `+${diff}` : diff} poin)${
        onQuickGradeClick ? ' — Klik untuk Beri Nilai Cepat' : ''
      }`}
    >
      <div className="relative w-[64px] h-[22px] overflow-visible">
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id={`grad-${studentId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={trendColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill={`url(#grad-${studentId})`} />
          <polyline
            points={polylinePoints}
            fill="none"
            stroke={trendColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="2.5"
            fill="#ffffff"
            stroke={trendColor}
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${trendBg} flex items-center font-mono`}>
        {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : `±0`}
      </span>

      {showTooltip && (
        <div className="absolute right-0 bottom-full mb-1.5 z-50 pointer-events-none bg-slate-900 text-white text-[10px] rounded-xl p-2.5 shadow-xl border border-slate-700 whitespace-nowrap min-w-[160px]">
          <div className="font-bold text-slate-300 pb-1 border-b border-slate-700 flex justify-between items-center gap-2">
            <span>Tren Nilai Siswa</span>
            <span className={diff >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {diff >= 0 ? `▲ +${diff}` : `▼ ${diff}`}
            </span>
          </div>
          <div className="mt-1 font-mono text-slate-100 flex items-center gap-1">
            {dataPoints.map((v, i) => (
              <React.Fragment key={i}>
                <span className={i === dataPoints.length - 1 ? 'font-black text-amber-300' : 'text-slate-300'}>
                  {v}
                </span>
                {i < dataPoints.length - 1 && <span className="text-slate-500 text-[8px]">➔</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="text-[9px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{gradedList.length > 0 ? `${gradedList.length} tugas dinilai` : 'Histori progres'}</span>
            {onQuickGradeClick && (
              <span className="text-amber-300 font-bold ml-2">⚡ Nilai Cepat</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// ============ MODAL: STUDENT ASSIGNMENT QR CODES & SCANNER ============
const StudentAssignmentQrModal: React.FC<{
  student: Account;
  account: Account;
  onClose: () => void;
  onRefresh: () => void;
}> = ({ student, account, onClose, onRefresh }) => {
  const isGuruOrKepsek = account.ROLE === 'GURU' || account.ROLE === 'KEPALA SEKOLAH';
  const [activeTab, setActiveTab] = useState<'LIST' | 'SCANNER'>('LIST');
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  // Scanner Simulator States
  const [scanInput, setScanInput] = useState<string>('');
  const [scannedPayload, setScannedPayload] = useState<any | null>(null);
  const [scanToast, setScanToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [scanLogs, setScanLogs] = useState<Array<{ time: string; text: string; status: string }>>([]);

  // Grade Input for Quick Grading Modal
  const [quickGradeModal, setQuickGradeModal] = useState<{ assignment: ClassroomAssignment; submission?: ClassroomSubmission } | null>(null);
  const [quickGradeValue, setQuickGradeValue] = useState<number>(85);
  const [quickFeedbackValue, setQuickFeedbackValue] = useState<string>('Bagus, pertahankan prestasimu!');

  // Retrieve courses and assignments
  const studentCourses = useMemo(() => {
    return classroomService.getCoursesForSiswa(student.ID, student.KELAS);
  }, [student.ID, student.KELAS]);

  const studentAssignments = useMemo(() => {
    const allAssignments = classroomService.getAssignments();
    const courseIds = new Set(studentCourses.map((c) => c.ID));
    let list = allAssignments.filter((a) => courseIds.has(a.COURSE_ID));
    if (list.length === 0) {
      list = allAssignments;
    }
    return list;
  }, [studentCourses]);

  const filteredAssignments = useMemo(() => {
    if (filterType === 'ALL') return studentAssignments;
    return studentAssignments.filter((a) => a.TYPE === filterType);
  }, [studentAssignments, filterType]);

  const submissionsMap = useMemo(() => {
    const map: Record<string, ClassroomSubmission> = {};
    const subs = classroomService.getSubmissions(undefined, student.ID);
    for (const sub of subs) {
      map[sub.ASSIGNMENT_ID] = sub;
    }
    return map;
  }, [student.ID]);

  useEffect(() => {
    let isMounted = true;
    const generateAll = async () => {
      const urls: Record<string, string> = {};
      for (const asg of studentAssignments) {
        const sub = submissionsMap[asg.ID];
        const course = studentCourses.find((c) => c.ID === asg.COURSE_ID);
        const qrPayload = JSON.stringify({
          app: 'SDN_TANGERANG_6_CLASSROOM',
          type: 'STUDENT_ASSIGNMENT_QR',
          studentId: student.ID,
          studentName: student.NAMA,
          studentNis: student.NIP || '-',
          studentKelas: student.KELAS || 'Kelas 1',
          assignmentId: asg.ID,
          assignmentTitle: asg.JUDUL,
          assignmentType: asg.TYPE,
          courseId: asg.COURSE_ID,
          courseName: course?.NAMA || 'Tematik',
          status: sub?.STATUS || 'BELUM_KUMPUL',
          nilai: sub?.NILAI ?? null,
          deadline: asg.DEADLINE,
          generatedAt: new Date().toISOString().slice(0, 19),
        });

        try {
          const url = await QRCode.toDataURL(qrPayload, {
            width: 280,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: {
              dark: '#1e1b4b',
              light: '#ffffff',
            },
          });
          if (isMounted) {
            urls[asg.ID] = url;
          }
        } catch (e) {
          console.error('Failed to generate QR for assignment:', asg.ID, e);
        }
      }
      if (isMounted) {
        setQrCodeDataUrls(urls);
      }
    };
    generateAll();
    return () => {
      isMounted = false;
    };
  }, [studentAssignments, student, submissionsMap, studentCourses]);

  const handleCopyPayload = (asg: ClassroomAssignment) => {
    const sub = submissionsMap[asg.ID];
    const course = studentCourses.find((c) => c.ID === asg.COURSE_ID);
    const payload = JSON.stringify(
      {
        app: 'SDN_TANGERANG_6_CLASSROOM',
        type: 'STUDENT_ASSIGNMENT_QR',
        studentId: student.ID,
        studentName: student.NAMA,
        studentNis: student.NIP || '-',
        studentKelas: student.KELAS || 'Kelas 1',
        assignmentId: asg.ID,
        assignmentTitle: asg.JUDUL,
        assignmentType: asg.TYPE,
        courseName: course?.NAMA || 'Tematik',
        status: sub?.STATUS || 'BELUM_KUMPUL',
        nilai: sub?.NILAI ?? null,
      },
      null,
      2
    );
    navigator.clipboard.writeText(payload);
    setCopiedId(asg.ID);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadQrBadge = async (asg: ClassroomAssignment) => {
    try {
      setDownloadingId(asg.ID);
      const sub = submissionsMap[asg.ID];
      const qrDataUrl = qrCodeDataUrls[asg.ID];
      if (!qrDataUrl) return;

      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 700);

      // Header Bar
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, 0, 600, 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SD NEGERI TANGERANG 6', 300, 42);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#93c5fd';
      ctx.fillText('KARTU IDENTITAS TUGAS SISWA • PEMINDAIAN CEPAT', 300, 72);

      // Student Box
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(40, 120, 520, 110, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(student.NAMA, 60, 155);

      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(`NIS/NISN: ${student.NIP || '-'}   •   Kelas: ${student.KELAS || 'Kelas 1'}`, 60, 182);
      ctx.fillText(`Tugas: ${asg.JUDUL}`, 60, 208);

      // Draw QR Image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = qrDataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // White QR Box
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(140, 250, 320, 320, 16);
      ctx.fill();
      ctx.stroke();

      ctx.drawImage(img, 155, 265, 290, 290);

      // Status Badge
      const statusText = sub?.STATUS === 'GRADED'
        ? `TERVERIFIKASI • NILAI: ${sub.NILAI}/100`
        : sub?.STATUS === 'SUBMITTED'
        ? 'DIKUMPULKAN • MENUNGGU PENILAIAN'
        : 'STATUS: BELUM DIKUMPULKAN';

      ctx.fillStyle = sub?.STATUS === 'GRADED' ? '#065f46' : sub?.STATUS === 'SUBMITTED' ? '#1e40af' : '#9a3412';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(statusText, 300, 605);

      // Footer
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText('Pindai kode QR ini dengan aplikasi guru untuk pembaruan status tugas otomatis.', 300, 640);
      ctx.fillText(`ID Dokumen: ${asg.ID}-${student.ID} • Dibuat: ${new Date().toLocaleDateString('id-ID')}`, 300, 665);

      const link = document.createElement('a');
      link.download = `QR_Tugas_${student.NAMA.replace(/\s+/g, '_')}_${asg.ID}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Failed to download QR sticker:', e);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleUpdateStatus = (asg: ClassroomAssignment, newStatus: 'SUBMITTED' | 'BELUM_KUMPUL') => {
    const existing = submissionsMap[asg.ID];
    if (newStatus === 'SUBMITTED') {
      classroomService.saveSubmission({
        ASSIGNMENT_ID: asg.ID,
        COURSE_ID: asg.COURSE_ID,
        SISWA_ID: student.ID,
        SISWA_NAMA: student.NAMA,
        ISI: existing?.ISI || `Tugas ${asg.JUDUL} diserahkan langsung / fisik melalui pemindaian QR code.`,
        STATUS: 'SUBMITTED',
      });
    } else {
      classroomService.saveSubmission({
        ASSIGNMENT_ID: asg.ID,
        COURSE_ID: asg.COURSE_ID,
        SISWA_ID: student.ID,
        SISWA_NAMA: student.NAMA,
        ISI: '',
        STATUS: 'DRAFT',
      });
    }
    onRefresh();
  };

  const handleSaveQuickGrade = () => {
    if (!quickGradeModal) return;
    const asg = quickGradeModal.assignment;
    const sub = submissionsMap[asg.ID] || classroomService.saveSubmission({
      ASSIGNMENT_ID: asg.ID,
      COURSE_ID: asg.COURSE_ID,
      SISWA_ID: student.ID,
      SISWA_NAMA: student.NAMA,
      ISI: `Tugas diperiksa langsung melalui QR Scanner.`,
      STATUS: 'SUBMITTED',
    });

    classroomService.gradeSubmission(
      sub.ID,
      quickGradeValue,
      quickFeedbackValue,
      account.NAMA || 'Guru Pengampu'
    );

    setQuickGradeModal(null);
    onRefresh();
  };

  const handleProcessScan = (rawText: string) => {
    if (!rawText.trim()) return;
    try {
      let parsed: any = null;
      if (rawText.trim().startsWith('{')) {
        parsed = JSON.parse(rawText.trim());
      } else {
        parsed = {
          studentId: student.ID,
          studentName: student.NAMA,
          assignmentTitle: rawText.trim(),
          raw: rawText.trim(),
        };
      }

      setScannedPayload(parsed);
      const logEntry = {
        time: new Date().toLocaleTimeString('id-ID'),
        text: parsed.assignmentTitle || parsed.studentName || 'QR Code Terpindai',
        status: parsed.status || 'SUBMITTED',
      };
      setScanLogs((prev) => [logEntry, ...prev.slice(0, 7)]);
      setScanToast({ message: `QR Code Berhasil Dipindai: ${parsed.assignmentTitle || 'Tugas Siswa'}`, type: 'success' });
      setTimeout(() => setScanToast(null), 3000);
    } catch (e) {
      setScanToast({ message: 'Format data QR tidak valid.', type: 'error' });
      setTimeout(() => setScanToast(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-5 sm:p-6 border border-slate-200 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shadow-xs">
              <QrCode size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900">QR Code Tugas & Pemindai Status</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {student.KELAS || 'Kelas 1'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Siswa: <strong className="text-slate-800">{student.NAMA}</strong> (NIS: <span className="font-mono">{student.NIP || '-'}</span>)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 pb-2 shrink-0 flex-wrap">
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('LIST')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'LIST' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode size={13} />
              <span>Daftar QR Tugas ({studentAssignments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SCANNER')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SCANNER' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scan size={13} />
              <span>Pemindai & Simulator Scan Cepat</span>
            </button>
          </div>

          {activeTab === 'LIST' && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[10px] text-slate-400 font-bold mr-1">Tipe:</span>
              {['ALL', 'TUGAS', 'ULANGAN', 'MATERI'].map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setFilterType(tp)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    filterType === tp ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tp === 'ALL' ? 'Semua' : tp}
                </button>
              ))}
            </div>
          )}
        </div>

        {scanToast && (
          <div
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-2 shrink-0 ${
              scanToast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>{scanToast.message}</span>
          </div>
        )}

        {activeTab === 'LIST' ? (
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1 py-1">
            {filteredAssignments.length === 0 ? (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <QrCode size={36} className="mx-auto text-slate-300" />
                <p className="text-xs">Tidak ada tugas ditemukan pada kategori ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredAssignments.map((asg) => {
                  const sub = submissionsMap[asg.ID];
                  const qrUrl = qrCodeDataUrls[asg.ID];
                  const isGraded = sub?.STATUS === 'GRADED';
                  const isSubmitted = sub?.STATUS === 'SUBMITTED';

                  return (
                    <div
                      key={asg.ID}
                      className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-24 h-24 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                          {qrUrl ? (
                            <img src={qrUrl} alt={`QR ${asg.JUDUL}`} className="w-full h-full object-contain" />
                          ) : (
                            <RefreshCw size={16} className="animate-spin text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                                asg.TYPE === 'TUGAS'
                                  ? 'bg-amber-100 text-amber-800'
                                  : asg.TYPE === 'ULANGAN'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {asg.TYPE}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{asg.ID}</span>
                          </div>

                          <h4 className="text-xs font-black text-slate-900 line-clamp-2 leading-snug">
                            {asg.JUDUL}
                          </h4>

                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock size={10} />
                            <span>Batas: {asg.DEADLINE || 'Tanpa Batas'}</span>
                          </div>

                          <div className="pt-1">
                            {isGraded ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <Award size={11} /> Nilai: {sub.NILAI}/100
                              </span>
                            ) : isSubmitted ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                                <CheckCircle2 size={11} /> Sudah Kumpul
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                                <Clock size={11} /> Belum Kumpul
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-200/80 flex-wrap text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyPayload(asg)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Salin Data Payload QR"
                          >
                            <Copy size={11} />
                            <span>{copiedId === asg.ID ? 'Tersalin!' : 'Salin'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadQrBadge(asg)}
                            disabled={downloadingId === asg.ID}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Unduh Stiker QR Badge Siap Cetak (PNG)"
                          >
                            {downloadingId === asg.ID ? (
                              <RefreshCw size={11} className="animate-spin text-slate-500" />
                            ) : (
                              <Download size={11} />
                            )}
                            <span>Stiker</span>
                          </button>
                        </div>

                        {isGuruOrKepsek && (
                          <div className="flex items-center gap-1">
                            {!isSubmitted && !isGraded ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(asg, 'SUBMITTED')}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] shadow-2xs transition flex items-center gap-1 cursor-pointer"
                              >
                                <Check size={11} /> Kumpul
                              </button>
                            ) : isSubmitted && !isGraded ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickGradeModal({ assignment: asg, submission: sub });
                                  setQuickGradeValue(85);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] shadow-2xs transition flex items-center gap-1 cursor-pointer"
                              >
                                <Award size={11} /> Nilai
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickGradeModal({ assignment: asg, submission: sub });
                                  setQuickGradeValue(sub?.NILAI ?? 90);
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                              >
                                Edit Nilai
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1 py-1">
            <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5 uppercase">
                  <Scan size={14} className="text-indigo-600" />
                  Pemindai & Simulator Scan Cepat
                </span>
                <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                  Mode Siap Pindai
                </span>
              </div>
              <p className="text-xs text-indigo-900/80">
                Pindai kode QR fisik pada lembar tugas siswa menggunakan barcode/QR scanner atau pilih salah satu tugas siswa di bawah ini untuk mensimulasikan pemindaian instan:
              </p>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Simulasikan Pindai Tugas {student.NAMA}:</span>
                <div className="flex flex-wrap gap-1.5">
                  {studentAssignments.slice(0, 4).map((asg) => (
                    <button
                      key={asg.ID}
                      type="button"
                      onClick={() => {
                        const sub = submissionsMap[asg.ID];
                        const mockData = JSON.stringify({
                          app: 'SDN_TANGERANG_6_CLASSROOM',
                          studentId: student.ID,
                          studentName: student.NAMA,
                          assignmentId: asg.ID,
                          assignmentTitle: asg.JUDUL,
                          status: sub?.STATUS || 'BELUM_KUMPUL',
                          nilai: sub?.NILAI,
                        });
                        setScanInput(mockData);
                        handleProcessScan(mockData);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-indigo-800 border border-indigo-200 text-xs font-bold transition shadow-2xs cursor-pointer truncate max-w-xs"
                    >
                      ⚡ {asg.JUDUL}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[10px] font-bold text-slate-700 block mb-1">
                  Input / Paste Data Kode QR:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder='Tempel JSON payload QR di sini...'
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-indigo-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleProcessScan(scanInput)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Proses Scan
                  </button>
                </div>
              </div>
            </div>

            {scannedPayload && (
              <div className="p-4 bg-white rounded-2xl border-2 border-indigo-300 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Data QR Berhasil Didekode
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                    {scannedPayload.assignmentId || 'ASG-QR'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Nama Siswa:</span>
                    <strong className="text-slate-800">{scannedPayload.studentName || student.NAMA}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Judul Tugas:</span>
                    <strong className="text-slate-800">{scannedPayload.assignmentTitle || '-'}</strong>
                  </div>
                </div>

                {isGuruOrKepsek && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Tindakan Cepat Pembaruan Status:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const asgId = scannedPayload.assignmentId || studentAssignments[0]?.ID;
                          const asg = studentAssignments.find((a) => a.ID === asgId) || studentAssignments[0];
                          if (asg) {
                            handleUpdateStatus(asg, 'SUBMITTED');
                            setScanToast({ message: `Status tugas "${asg.JUDUL}" berhasil diubah menjadi SUDAH DIKUMPULKAN!`, type: 'success' });
                            setTimeout(() => setScanToast(null), 3000);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Check size={14} /> Tandai Sudah Kumpul
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const asgId = scannedPayload.assignmentId || studentAssignments[0]?.ID;
                          const asg = studentAssignments.find((a) => a.ID === asgId) || studentAssignments[0];
                          if (asg) {
                            setQuickGradeModal({ assignment: asg, submission: submissionsMap[asg.ID] });
                            setQuickGradeValue(90);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Award size={14} /> Input Nilai & Beri Feedback
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const asgId = scannedPayload.assignmentId || studentAssignments[0]?.ID;
                          const asg = studentAssignments.find((a) => a.ID === asgId) || studentAssignments[0];
                          if (asg) {
                            classroomService.saveSubmission({
                              ASSIGNMENT_ID: asg.ID,
                              COURSE_ID: asg.COURSE_ID,
                              SISWA_ID: student.ID,
                              SISWA_NAMA: student.NAMA,
                              ISI: 'Catatan Guru: Tugas perlu dilengkapi atau direvisi kembali sebelum dinilai.',
                              STATUS: 'DRAFT',
                            });
                            onRefresh();
                            setScanToast({ message: 'Tugas ditandai Perlu Revisi.', type: 'info' });
                            setTimeout(() => setScanToast(null), 3000);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <AlertCircle size={14} /> Minta Perbaikan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {scanLogs.length > 0 && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Riwayat Pemindaian Sesi Ini:
                </span>
                <div className="space-y-1.5 text-xs">
                  {scanLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">{log.time}</span>
                        <span className="font-bold text-slate-800">{log.text}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
          <span className="text-[11px] text-slate-400 font-medium">
            Format QR: Standar SDN Tangerang 6 Classroom (JSON / Encrypted)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {quickGradeModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Award size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Penilaian Cepat</h4>
                  <p className="text-[11px] text-slate-500">{quickGradeModal.assignment.JUDUL}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickGradeModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nilai Angka Siswa ({student.NAMA}):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={quickGradeValue}
                  onChange={(e) => setQuickGradeValue(Number(e.target.value))}
                  className="w-24 px-3 py-2 text-base font-black rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-600 text-center"
                />
                <div className="flex gap-1">
                  {[75, 85, 90, 100].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setQuickGradeValue(score)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        quickGradeValue === score
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Catatan Umpan Balik Guru:
              </label>
              <textarea
                value={quickFeedbackValue}
                onChange={(e) => setQuickFeedbackValue(e.target.value)}
                rows={2}
                placeholder="Tulis pujian atau catatan guru..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickGradeModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveQuickGrade}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Check size={14} /> Simpan Nilai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ MEMOIZED STUDENT ROW CARD FOR HIGH PERFORMANCE RENDERING ============
interface StudentRowCardProps {
  student: Account;
  index: number;
  submissions: ClassroomSubmission[];
  exportingStudentId: string | null;
  onOpenQrModal: (student: Account) => void;
  onExportPdf: (student: Account) => void;
  onCelebrateMilestone?: (student: Account) => void;
  onEditStudent?: (student: Account) => void;
  onQuickGradeClick?: (student: Account) => void;
  canManage: boolean;
}

const StudentRowCard: React.FC<StudentRowCardProps> = React.memo(({
  student: s,
  index: idx,
  submissions: studentSubmissions,
  exportingStudentId,
  onOpenQrModal,
  onExportPdf,
  onCelebrateMilestone,
  onEditStudent,
  onQuickGradeClick,
  canManage,
}) => {
  const graded = useMemo(
    () => studentSubmissions.filter((sub) => sub.STATUS === 'GRADED'),
    [studentSubmissions]
  );

  const avgScore = useMemo(() => {
    if (graded.length === 0) return '-';
    return Math.round(graded.reduce((acc, sub) => acc + (sub.NILAI || 0), 0) / graded.length);
  }, [graded]);

  const kelulusanStatus = s.STATUS_KELULUSAN || 'AKTIF';
  const kebutuhan = s.KEBUTUHAN_KHUSUS || 'REGULER';

  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
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

          {/* Compact Badges Preview */}
          <div className="mt-2 pt-2 border-t border-slate-100">
            <StudentBadgesWidget siswaId={s.ID} siswaNama={s.NAMA} compact={true} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end flex-wrap">
        {/* Inline Sparkline & Grade Display */}
        <div className="hidden sm:flex items-center gap-2.5 bg-slate-50/90 px-3 py-1.5 rounded-2xl border border-slate-200/80 mr-1">
          <div className="text-right">
            <div className="text-[9px] text-slate-400 font-bold uppercase">Rata-rata</div>
            <div className="text-xs font-bold text-slate-800">
              <span className="text-emerald-600 font-black">{avgScore}</span>
              <span className="text-slate-400 text-[10px] ml-1 font-normal">({studentSubmissions.length} tgs)</span>
            </div>
          </div>
          <div className="pl-2 border-l border-slate-200">
            <StudentGradeSparkline
              studentId={s.ID}
              studentName={s.NAMA}
              submissions={studentSubmissions}
              canGrade={canManage}
              onQuickGradeClick={canManage && onQuickGradeClick ? () => onQuickGradeClick(s) : undefined}
            />
          </div>
        </div>

        {/* QR Code Tugas Button */}
        <button
          onClick={() => onOpenQrModal(s)}
          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          title="Lihat & Buat Kode QR Tugas untuk Pemindaian Status Cepat"
        >
          <QrCode size={13} className="text-indigo-700" />
          <span>QR Tugas</span>
        </button>

        {onCelebrateMilestone && (
          <button
            onClick={() => onCelebrateMilestone(s)}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Selebrasi Milestone Pencapaian Siswa (Partikel & Confetti)"
          >
            <Trophy size={13} className="text-amber-600 fill-amber-500" />
            <span>Selebrasi</span>
          </button>
        )}

        <button
          onClick={() => onExportPdf(s)}
          disabled={exportingStudentId === s.ID}
          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Ekspor Rapor Perkembangan Siswa Standar A4 dengan Visual Header & Catatan Wali Kelas"
        >
          {exportingStudentId === s.ID ? (
            <RefreshCw size={12} className="animate-spin text-purple-700" />
          ) : (
            <FileText size={12} className="text-purple-700" />
          )}
          <span>{exportingStudentId === s.ID ? 'Cetak...' : 'Rapor A4 PDF'}</span>
        </button>

        {canManage && onEditStudent && (
          <button
            onClick={() => onEditStudent(s)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 size={12} />
            <span>Kelola</span>
          </button>
        )}
      </div>
    </div>
  );
});

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
  const [qrModalStudent, setQrModalStudent] = useState<Account | null>(null);
  const [exportingStudentId, setExportingStudentId] = useState<string | null>(null);
  const [isExportingAllPdf, setIsExportingAllPdf] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [quickGradeStudent, setQuickGradeStudent] = useState<Account | null>(null);
  const [showBulkQrModal, setShowBulkQrModal] = useState<boolean>(false);
  const [exportReportStudent, setExportReportStudent] = useState<Account | null>(null);
  const [celebratingMilestone, setCelebratingMilestone] = useState<{
    studentName: string;
    milestoneTitle: string;
    milestoneCategory: string;
    rewardPoints: number;
  } | null>(null);

  const allClasses = useMemo(() => ['Semua', ...STANDARD_CLASSES], []);

  const allStudents = useMemo(() => {
    if (isGuru && account.KELAS) {
      return accountService.getStudents(account.KELAS);
    }
    if (selectedClass === 'Semua') {
      return accountService.getStudents();
    }
    return accountService.getStudents(selectedClass);
  }, [isGuru, account.KELAS, selectedClass]);

  const allSubmissions = useMemo(() => classroomService.getSubmissions(), []);

  const submissionsByStudent = useMemo(() => {
    const map = new Map<string, ClassroomSubmission[]>();
    for (const sub of allSubmissions) {
      const arr = map.get(sub.SISWA_ID) || [];
      arr.push(sub);
      map.set(sub.SISWA_ID, arr);
    }
    return map;
  }, [allSubmissions]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allStudents.filter((s) => {
      const matchesSearch =
        !query ||
        s.NAMA.toLowerCase().includes(query) ||
        (s.NIP && s.NIP.includes(query)) ||
        s.USERNAME.toLowerCase().includes(query);

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
  }, [allStudents, search, filterKelulusan, filterKebutuhan]);

  // Automated PDF Report Handlers
  const handleExportStudentPdf = useCallback((student: Account) => {
    setExportReportStudent(student);
  }, []);

  const handleCelebrateMilestone = useCallback((student: Account) => {
    setCelebratingMilestone({
      studentName: student.NAMA,
      milestoneTitle: '🏆 Master 10 Tugas Tepat Waktu!',
      milestoneCategory: 'Disiplin & Ketepatan Waktu',
      rewardPoints: 500,
    });
  }, []);

  const handleExportAllStudentsPdf = useCallback(async () => {
    if (filteredStudents.length === 0) return;
    setIsExportingAllPdf(true);
    try {
      const guruNama = isGuru ? account.NAMA : 'Nurul Hidayah, S.Pd.';
      const guruNip = isGuru ? (account.NIP || '19850412 201101 2 003') : '19850412 201101 2 003';
      for (const s of filteredStudents) {
        const report = classroomService.getStudentReportCard(
          s.ID,
          s.NAMA,
          s.KELAS || (isGuru ? account.KELAS : selectedClass) || 'Kelas 1'
        );
        await pdfService.generateStudentProgressReportPdf(report, guruNama, guruNip);
      }
    } catch (err) {
      console.error('Gagal mengekspor semua Rapor PDF siswa:', err);
    } finally {
      setIsExportingAllPdf(false);
    }
  }, [filteredStudents, isGuru, account.NAMA, account.NIP, account.KELAS, selectedClass]);

  // Summary counts for current viewed cohort
  const totalCount = allStudents.length;
  const regulerCount = useMemo(() => allStudents.filter((s) => !s.KEBUTUHAN_KHUSUS || s.KEBUTUHAN_KHUSUS === 'REGULER').length, [allStudents]);
  const inklusiCount = useMemo(() => allStudents.filter((s) => s.KEBUTUHAN_KHUSUS && s.KEBUTUHAN_KHUSUS !== 'REGULER' && s.KEBUTUHAN_KHUSUS !== 'CERDAS_ISTIMEWA').length, [allStudents]);
  const cerdasCount = useMemo(() => allStudents.filter((s) => s.KEBUTUHAN_KHUSUS === 'CERDAS_ISTIMEWA').length, [allStudents]);
  const lulusCount = useMemo(() => allStudents.filter((s) => s.STATUS_KELULUSAN === 'LULUS').length, [allStudents]);

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
        <div className="flex items-center gap-2 flex-wrap">
          {isGuru && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
              <Lock size={13} /> Kelas Terkunci: {account.KELAS}
            </div>
          )}

          {/* Printable Classroom Summary View Button */}
          <button
            onClick={() => setShowSummaryModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/20 transition active:scale-95 cursor-pointer"
            title="Buka Ringkasan Kelas & Laporan Siap Cetak (Grade Distribution, Student List & Attendance)"
          >
            <Printer size={14} />
            <span>Ringkasan Kelas (Cetak)</span>
          </button>

          {/* Bulk QR Generator Button */}
          <button
            onClick={() => setShowBulkQrModal(true)}
            disabled={filteredStudents.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-700/20 transition active:scale-95 cursor-pointer disabled:opacity-60"
            title="Unduh file ZIP berisi kode QR ID Card untuk seluruh siswa kelas terpilih"
          >
            <FolderArchive size={14} />
            <span>Bulk QR (ZIP)</span>
          </button>

          <button
            onClick={handleExportAllStudentsPdf}
            disabled={isExportingAllPdf || filteredStudents.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition active:scale-95 cursor-pointer disabled:opacity-60"
            title="Ekspor laporan capaian perkembangan semua siswa terfilter ke format PDF"
          >
            {isExportingAllPdf ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <FileText size={14} />
            )}
            <span>{isExportingAllPdf ? 'Mengekspor PDF...' : 'Ekspor Semua Rapor PDF'}</span>
          </button>
          <button
            onClick={() => exportStudentsToCSV(filteredStudents, isGuru ? account.KELAS : selectedClass)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
            title="Ekspor rekap data siswa ke format CSV untuk backup offline"
          >
            <Download size={15} /> Ekspor Data Siswa (CSV)
          </button>
        </div>
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
            {filteredStudents.map((s, idx) => (
              <StudentRowCard
                key={s.ID}
                student={s}
                index={idx}
                submissions={submissionsByStudent.get(s.ID) || []}
                exportingStudentId={exportingStudentId}
                onOpenQrModal={setQrModalStudent}
                onExportPdf={handleExportStudentPdf}
                onCelebrateMilestone={handleCelebrateMilestone}
                onEditStudent={setEditingStudent}
                onQuickGradeClick={(st) => setQuickGradeStudent(st)}
                canManage={isGuru || isKepsek}
              />
            ))}
          </div>
        )}
      </div>

      {/* Printable Classroom Summary View Modal */}
      {showSummaryModal && (
        <ClassroomSummaryModal
          isOpen={showSummaryModal}
          onClose={() => setShowSummaryModal(false)}
          selectedClass={isGuru ? (account.KELAS || 'Kelas 1') : selectedClass}
          onSelectClass={isKepsek ? setSelectedClass : undefined}
          account={account}
          students={filteredStudents}
        />
      )}

      {/* Quick Grade Overlay Modal (Triggered by Sparkline click) */}
      {quickGradeStudent && (
        <QuickGradeModal
          student={quickGradeStudent}
          account={account}
          onClose={() => setQuickGradeStudent(null)}
          onSaved={() => {
            onRefresh();
          }}
        />
      )}

      {/* Bulk QR Code Generator & ZIP Downloader Modal */}
      {showBulkQrModal && (
        <BulkQrGeneratorModal
          isOpen={showBulkQrModal}
          onClose={() => setShowBulkQrModal(false)}
          students={filteredStudents}
          selectedClass={isGuru ? (account.KELAS || 'Kelas 1') : selectedClass}
        />
      )}

      {/* QR Code Assignment & Quick Status Scanner Modal */}
      {qrModalStudent && (
        <StudentAssignmentQrModal
          student={qrModalStudent}
          account={account}
          onClose={() => setQrModalStudent(null)}
          onRefresh={() => {
            onRefresh();
          }}
        />
      )}

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

      {/* Export Student Report A4 Modal */}
      {exportReportStudent && (
        <ExportStudentReportModal
          isOpen={Boolean(exportReportStudent)}
          onClose={() => setExportReportStudent(null)}
          student={exportReportStudent}
          teacherName={isGuru ? account.NAMA : 'Nurul Hidayah, S.Pd.'}
          teacherNip={isGuru ? (account.NIP || '19850412 201101 2 003') : '19850412 201101 2 003'}
        />
      )}

      {/* Particle Celebration Milestone Animation */}
      {celebratingMilestone && (
        <ParticleCelebration
          isOpen={Boolean(celebratingMilestone)}
          onClose={() => setCelebratingMilestone(null)}
          studentName={celebratingMilestone.studentName}
          milestoneTitle={celebratingMilestone.milestoneTitle}
          milestoneCategory={celebratingMilestone.milestoneCategory}
          rewardPoints={celebratingMilestone.rewardPoints}
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

// ============ BULK DELETE ASSIGNMENTS MODAL ============
const BulkDeleteAssignmentsModal: React.FC<{
  assignments: ClassroomAssignment[];
  selectedIds: string[];
  onClose: () => void;
  onConfirm: () => void;
}> = ({ assignments, selectedIds, onClose, onConfirm }) => {
  const selectedAssignments = assignments.filter((a) => selectedIds.includes(a.ID));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-5 border border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Hapus Massal Penugasan ({selectedIds.length})
              </h3>
              <p className="text-xs text-slate-500">
                Konfirmasi penghapusan beberapa tugas sekaligus
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Peringatan Penting:</strong> Anda akan menghapus <strong>{selectedIds.length} tugas</strong> secara permanen. Tindakan ini juga akan menghapus seluruh data pengumpulan siswa, berkas lampiran, dan riwayat penilaian terkait.
            </div>
          </div>
        </div>

        {/* Selected Items Preview List */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Daftar Tugas yang Akan Dihapus:
          </label>
          <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
            {selectedAssignments.map((a, idx) => (
              <div
                key={a.ID}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 truncate">{a.JUDUL}</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 ml-2">
                  {a.TYPE}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition cursor-pointer"
          >
            <Trash2 size={14} /> Ya, Hapus {selectedIds.length} Tugas
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ ASSIGNMENTS VIEW ============
const AssignmentsView: React.FC<{
  account: Account;
  courses: ClassroomCourse[];
  assignments: ClassroomAssignment[];
  onRefresh: () => void;
  onOpenAIChat?: (assignment?: ClassroomAssignment) => void;
  onTriggerMilestone?: (studentName: string, milestoneTitle: string) => void;
}> = ({ account, courses, assignments, onRefresh, onOpenAIChat, onTriggerMilestone }) => {
  const isGuru = account.ROLE === 'GURU';
  const isSiswa = account.ROLE === 'SISWA';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';
  const canManageAssignments = isGuru || isKepsek;

  const [showCreate, setShowCreate] = useState(false);
  const [submitFor, setSubmitFor] = useState<ClassroomAssignment | null>(null);
  const [reviewFor, setReviewFor] = useState<ClassroomAssignment | null>(null);
  const [peerReviewFor, setPeerReviewFor] = useState<ClassroomAssignment | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'PRIORITY' | 'URGENT' | 'PENDING' | 'DONE'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Bulk Selection & Deletion State
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredAssignments = assignments.filter((a) => {
    const mySub = isSiswa ? classroomService.getSubmissions(a.ID, account.ID)[0] : undefined;
    const isDone = mySub && mySub.STATUS !== 'DRAFT';
    const warn = getDeadlineWarning(a.DEADLINE);
    const course = courses.find((c) => c.ID === a.COURSE_ID);

    // Status Tab Filter
    if (filterType === 'PRIORITY' && !a.IS_PRIORITY) return false;
    if (filterType === 'URGENT' && !(!isDone && warn?.isUrgent)) return false;
    if (filterType === 'PENDING' && !(!isDone && a.TYPE !== 'MATERI')) return false;
    if (filterType === 'DONE' && !isDone) return false;

    // Category / Subject Filter
    if (selectedCategory !== 'ALL') {
      if (selectedCategory.startsWith('COURSE_')) {
        const courseId = selectedCategory.replace('COURSE_', '');
        if (a.COURSE_ID !== courseId) return false;
      } else if (selectedCategory.startsWith('TYPE_')) {
        const type = selectedCategory.replace('TYPE_', '');
        if (a.TYPE !== type) return false;
      }
    }

    // Keyword Search
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      const matchJudul = a.JUDUL.toLowerCase().includes(q);
      const matchDeskripsi = (a.DESKRIPSI || '').toLowerCase().includes(q);
      const matchCourse =
        (course?.NAMA || '').toLowerCase().includes(q) ||
        (course?.KODE_KELAS || '').toLowerCase().includes(q);
      const matchType = a.TYPE.toLowerCase().includes(q);
      if (!matchJudul && !matchDeskripsi && !matchCourse && !matchType) return false;
    }

    return true;
  });

  const priorityCount = assignments.filter((a) => a.IS_PRIORITY).length;
  const urgentCount = assignments.filter((a) => {
    const isDone = isSiswa && classroomService.getSubmissions(a.ID, account.ID).some((s) => s.STATUS !== 'DRAFT');
    return !isDone && getDeadlineWarning(a.DEADLINE)?.isUrgent;
  }).length;

  // Toggle selection for a single assignment
  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedAssignmentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all filtered assignments
  const handleToggleSelectAll = () => {
    const allFilteredIds = filteredAssignments.map((a) => a.ID);
    const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedAssignmentIds.includes(id));
    if (isAllSelected) {
      setSelectedAssignmentIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedAssignmentIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const isAllFilteredSelected =
    filteredAssignments.length > 0 &&
    filteredAssignments.every((a) => selectedAssignmentIds.includes(a.ID));

  // Perform bulk deletion
  const handleConfirmBulkDelete = () => {
    if (selectedAssignmentIds.length === 0) return;
    const deletedCount = selectedAssignmentIds.length;
    classroomService.deleteAssignments(selectedAssignmentIds);
    setSelectedAssignmentIds([]);
    setShowBulkDeleteModal(false);
    onRefresh();

    setToastMessage(`Berhasil menghapus ${deletedCount} tugas secara massal.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Perform bulk PDF printing of assignments
  const handlePrintBulkAssignmentsPdf = async (selectedOnly: boolean = false) => {
    const targetAssignments = selectedOnly && selectedAssignmentIds.length > 0
      ? assignments.filter((a) => selectedAssignmentIds.includes(a.ID))
      : filteredAssignments.length > 0
      ? filteredAssignments
      : assignments;

    if (targetAssignments.length === 0) {
      setToastMessage('Tidak ada tugas yang dipilih untuk dicetak.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const allSubmissions = classroomService.getSubmissions();
    await pdfService.generateBulkAssignmentsReportPdf(
      targetAssignments,
      courses,
      allSubmissions,
      account.KELAS || 'Kelas 4',
      account.NAMA || 'Guru Kelas',
      account.NIP || '19850412 201101 2 003'
    );

    setToastMessage(`Berhasil mengunduh dokumen PDF Rekapitulasi ${targetAssignments.length} Tugas.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ClipboardList className="text-blue-700 shrink-0" size={20} />
            Tugas & Materi Pembelajaran
          </h2>
          <p className="text-xs text-slate-500">
            {isGuru ? `Kelola tugas & materi untuk kelas ${account.KELAS || ''}` : 'Daftar penugasan terstruktur dari guru'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canManageAssignments && (
            <button
              onClick={() => handlePrintBulkAssignmentsPdf(false)}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition min-h-[38px] sm:min-h-[34px]"
              title="Cetak & unduh ringkasan daftar tugas siswa secara massal dalam format PDF"
            >
              <Printer size={14} className="text-emerald-200" />
              <span className="hidden sm:inline">Cetak Daftar Tugas Massal (PDF)</span>
              <span className="sm:hidden">PDF Tugas Massal</span>
            </button>
          )}

          <button
            onClick={() => exportAssignmentsToICS(assignments, `tugas_${account.KELAS || 'sd'}.ics`)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition min-h-[38px] sm:min-h-[34px]"
            title="Sinkronkan seluruh tenggat tugas ke kalender lokal perangkat (.ics)"
          >
            <Calendar size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Sinkron Kalender (.ics)</span>
          </button>

          {isGuru && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition min-h-[38px] sm:min-h-[34px]"
            >
              <Plus size={14} /> Buat Tugas Baru
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tugas berdasarkan judul, kata kunci, atau mata pelajaran..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-blue-600 transition"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 shrink-0">
            <Filter size={14} className="text-blue-600" />
            <span className="hidden md:inline">Kategori:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-blue-600"
          >
            <option value="ALL">Semua Kategori & Mapel</option>
            <optgroup label="Berdasarkan Mata Pelajaran">
              {courses.map((c) => (
                <option key={c.ID} value={`COURSE_${c.ID}`}>
                  {c.KODE_KELAS} - {c.NAMA}
                </option>
              ))}
            </optgroup>
            <optgroup label="Berdasarkan Tipe Penugasan">
              <option value="TYPE_TUGAS">Tugas Mandiri / Kelompok</option>
              <option value="TYPE_ULANGAN">Ulangan / Evaluasi</option>
              <option value="TYPE_MATERI">Materi & Bahan Ajar</option>
            </optgroup>
          </select>
          {(searchKeyword || selectedCategory !== 'ALL' || filterType !== 'ALL') && (
            <button
              onClick={() => {
                setSearchKeyword('');
                setSelectedCategory('ALL');
                setFilterType('ALL');
              }}
              className="px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition shrink-0"
              title="Reset semua filter"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Bulk Selection Toolbar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
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

          <button
            onClick={() => setFilterType('PRIORITY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterType === 'PRIORITY'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-300/80 hover:bg-amber-100'
            }`}
          >
            <Flame size={13} className="text-amber-600 fill-amber-400" />
            Prioritas ({priorityCount})
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

        {/* Teacher Select All Control */}
        {canManageAssignments && filteredAssignments.length > 0 && (
          <button
            onClick={handleToggleSelectAll}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
              isAllFilteredSelected
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
            title="Pilih atau batalkan semua tugas yang tampil"
          >
            <CheckSquare size={13} className={isAllFilteredSelected ? 'text-white' : 'text-indigo-600'} />
            <span className="hidden sm:inline">{isAllFilteredSelected ? 'Batalkan Semua' : 'Pilih Semua'}</span>
            <span className="sm:hidden">{isAllFilteredSelected ? 'Batal' : 'Pilih'} ({filteredAssignments.length})</span>
          </button>
        )}
      </div>

      {/* Floating Bulk Action Bar for Teachers */}
      <AnimatePresence>
        {canManageAssignments && selectedAssignmentIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="sticky top-2 z-30 bg-slate-900 text-white p-3 sm:p-3.5 rounded-2xl shadow-xl flex items-center justify-between flex-wrap gap-2.5 border border-slate-700"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xs">
                {selectedAssignmentIds.length}
              </div>
              <div className="text-xs font-bold">
                <span>{selectedAssignmentIds.length} Tugas Terpilih</span>
                <span className="hidden md:inline text-slate-400 font-normal ml-1.5">
                  (Siap untuk tindakan massal)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePrintBulkAssignmentsPdf(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                title="Cetak rekap PDF khusus tugas yang dipilih"
              >
                <Printer size={13} />
                <span>Cetak PDF ({selectedAssignmentIds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedAssignmentIds([])}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Batalkan Pilihan
              </button>
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Hapus {selectedAssignmentIds.length} Tugas</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignments List (Optimized for Mobile Stacking) */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <ClipboardList size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Tidak ada tugas pada filter ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAssignments.map((a, idx) => {
              const course = courses.find((c) => c.ID === a.COURSE_ID);
              const mySub = isSiswa ? classroomService.getSubmissions(a.ID, account.ID)[0] : undefined;
              const isDone = mySub && mySub.STATUS !== 'DRAFT';
              const allSubmissions = classroomService.getSubmissions(a.ID);
              const subCount = allSubmissions.length;
              const gradedCount = allSubmissions.filter((s) => s.STATUS === 'GRADED').length;
              const deadlineWarn = !isDone ? getDeadlineWarning(a.DEADLINE) : null;
              const isSelected = selectedAssignmentIds.includes(a.ID);

              return (
                <motion.div
                  key={a.ID}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -8 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className={`bg-white p-3.5 sm:p-4.5 rounded-2xl border transition-all flex flex-col gap-3 ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-400/40 bg-indigo-50/20 shadow-sm'
                      : a.IS_PRIORITY
                      ? 'border-amber-400 bg-amber-50/15 ring-1 ring-amber-400/50 shadow-xs border-l-4 border-l-amber-500'
                      : deadlineWarn?.isUrgent
                      ? 'border-red-400 bg-red-50/15 ring-1 ring-red-400 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Top Bar: Checkbox + Tags + Status Badges */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap flex-1 min-w-0">
                      {/* Teacher Bulk Checkbox */}
                      {canManageAssignments && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelect(a.ID, e)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-slate-50 border-slate-300 hover:border-indigo-400'
                          }`}
                          title={isSelected ? 'Batalkan pilihan tugas ini' : 'Pilih tugas ini untuk hapus massal'}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </button>
                      )}

                      {/* Priority Pill */}
                      {a.IS_PRIORITY && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs flex items-center gap-1">
                          <Flame size={10} className="fill-white" /> Prioritas
                        </span>
                      )}

                      {/* Type Pill */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          a.TYPE === 'TUGAS'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : a.TYPE === 'ULANGAN'
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : 'bg-purple-100 text-purple-900 border border-purple-200'
                        }`}
                      >
                        {a.TYPE}
                      </span>

                      {/* DISTINCT COLOR-CODED STATUS BADGES FOR IMMEDIATE VISUAL FEEDBACK */}
                      {isSiswa && (
                        <>
                          {a.TYPE === 'MATERI' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs inline-flex items-center gap-1">
                              <BookOpen size={11} className="text-purple-700" />
                              Materi
                            </span>
                          ) : mySub?.STATUS === 'GRADED' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs inline-flex items-center gap-1">
                              <Award size={11} className="text-emerald-700" />
                              Completed • Nilai: {mySub.NILAI}/100
                            </span>
                          ) : mySub?.STATUS === 'SUBMITTED' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-950 border border-blue-300 shadow-2xs inline-flex items-center gap-1">
                              <CheckCircle2 size={11} className="text-blue-700" />
                              In Progress • Terkumpul
                            </span>
                          ) : mySub?.STATUS === 'DRAFT' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-950 border border-sky-300 shadow-2xs inline-flex items-center gap-1">
                              <Edit3 size={11} className="text-sky-700" />
                              In Progress • Draf
                            </span>
                          ) : deadlineWarn?.isUrgent ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-950 border border-rose-400 shadow-2xs inline-flex items-center gap-1 animate-pulse">
                              <AlertCircle size={11} className="text-rose-700" />
                              Not Started • Mendesak
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-900 border border-rose-200 shadow-2xs inline-flex items-center gap-1">
                              <Clock size={11} className="text-rose-600" />
                              Not Started • Belum Dikerjakan
                            </span>
                          )}
                        </>
                      )}

                      {/* Teacher Status Badge */}
                      {!isSiswa && (
                        <>
                          {subCount === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                              <Clock size={11} className="text-slate-500" />
                              0 Pengumpulan
                            </span>
                          ) : gradedCount === subCount ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs inline-flex items-center gap-1">
                              <CheckCircle2 size={11} className="text-emerald-700" />
                              Selesai Dinilai ({subCount})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs inline-flex items-center gap-1">
                              <Clock size={11} className="text-amber-700" />
                              {subCount} Siswa ({gradedCount}/{subCount} Dinilai)
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Teacher Toggle Priority */}
                    {isGuru && (
                      <button
                        onClick={() => {
                          classroomService.saveAssignment({
                            ...a,
                            IS_PRIORITY: !a.IS_PRIORITY,
                          });
                          onRefresh();
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer flex items-center gap-1 shrink-0 ${
                          a.IS_PRIORITY
                            ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-700'
                        }`}
                        title={a.IS_PRIORITY ? 'Hapus dari Prioritas' : 'Tandai sebagai Prioritas'}
                      >
                        <Flame size={11} className={a.IS_PRIORITY ? 'text-amber-600 fill-amber-500' : 'text-slate-400'} />
                        <span className="hidden sm:inline">{a.IS_PRIORITY ? 'Prioritas' : '+ Prioritas'}</span>
                      </button>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-black text-slate-800 leading-snug">
                      {a.JUDUL}
                    </h3>
                    {a.DESKRIPSI && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {a.DESKRIPSI}
                      </p>
                    )}
                  </div>

                  {/* Stacked Mobile Metadata (Hiding less critical metadata on small screens for vertical readability) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] text-slate-500 flex-wrap">
                      {/* Subject Name (Always visible) */}
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <School size={12} className="text-blue-600 shrink-0" />
                        <span className="truncate max-w-[180px] sm:max-w-none">{course?.NAMA || 'Mata Pelajaran'}</span>
                      </span>

                      {/* Raw Course Code (Hidden on mobile for clean vertical flow) */}
                      <span className="hidden sm:inline-flex items-center text-[10px] text-slate-400 font-mono px-1.5 py-0.2 bg-slate-100 rounded">
                        {course?.KODE_KELAS || '-'}
                      </span>

                      {/* Deadline (Always visible, highlighted if urgent) */}
                      <span
                        className={`flex items-center gap-1 font-bold ${
                          deadlineWarn?.isUrgent ? 'text-red-700' : 'text-slate-600'
                        }`}
                      >
                        <Calendar size={12} className="shrink-0" />
                        <span>Tenggat: {a.DEADLINE || 'Tidak ada'}</span>
                      </span>
                    </div>

                    {/* Action Buttons (Full-width stacked or row layout with 44px min touch target on mobile) */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-end w-full sm:w-auto pt-1 sm:pt-0">
                      {/* Export Single Task to ICS Calendar */}
                      <button
                        onClick={() => exportAssignmentsToICS([a], `tugas_${a.JUDUL.slice(0, 15)}.ics`)}
                        className="p-2 sm:p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer min-h-[38px] min-w-[38px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center"
                        title="Ekspor pengingat tugas ini ke Kalender Perangkat (.ics)"
                      >
                        <Calendar size={14} />
                      </button>

                      {/* Tanya AI Tutor Button */}
                      {onOpenAIChat && (
                        <button
                          onClick={() => onOpenAIChat(a)}
                          className="px-3 py-2 sm:py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 font-bold text-xs flex items-center gap-1 transition cursor-pointer min-h-[38px] sm:min-h-[32px]"
                          title="Tanyakan ke AI Asisten penjelasan materi & panduan tugas"
                        >
                          <Bot size={14} className="text-indigo-600" />
                          <span>Tanya AI</span>
                        </button>
                      )}

                      {/* Teacher Periksa Button */}
                      {isGuru && (
                        <button
                          onClick={() => setReviewFor(a)}
                          className="px-3.5 py-2 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer min-h-[38px] sm:min-h-[32px]"
                        >
                          <Eye size={13} className="text-emerald-700" />
                          <span>Periksa ({subCount})</span>
                        </button>
                      )}

                      {/* Student Actions */}
                      {isSiswa && a.TYPE !== 'MATERI' && (
                        <div className="flex items-center gap-1.5">
                          {isDone && (
                            <button
                              onClick={() => setPeerReviewFor(a)}
                              className="px-3 py-2 sm:py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer min-h-[38px] sm:min-h-[32px]"
                              title="Berikan penilaian anonim ke hasil kerja teman sekelasmu"
                            >
                              <Users size={13} />
                              <span className="hidden sm:inline">Peer Review</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSubmitFor(a)}
                            className={`px-3.5 py-2 sm:py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition cursor-pointer min-h-[38px] sm:min-h-[32px] ${
                              deadlineWarn?.isUrgent && !isDone
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs animate-pulse'
                                : 'bg-blue-700 hover:bg-blue-800 text-white'
                            }`}
                          >
                            {mySub ? (
                              <>
                                <Eye size={13} />
                                <span>Lihat Jawaban</span>
                              </>
                            ) : (
                              <>
                                <Edit3 size={13} />
                                <span>Kerjakan</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Bulk Delete Modal Confirmation */}
      {showBulkDeleteModal && (
        <BulkDeleteAssignmentsModal
          assignments={assignments}
          selectedIds={selectedAssignmentIds}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={handleConfirmBulkDelete}
        />
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
          onTriggerMilestone={onTriggerMilestone}
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
      {peerReviewFor && (
        <ClassroomPeerReviewModal
          assignment={peerReviewFor}
          siswa={account}
          onClose={() => setPeerReviewFor(null)}
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
  const [isPriority, setIsPriority] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !courseId) return;
    classroomService.saveAssignment({
      COURSE_ID: courseId,
      JUDUL: judul,
      TYPE: type,
      DEADLINE: deadline,
      DESKRIPSI: deskripsi,
      GURU_ID: account.ID,
      GURU_NAMA: account.NAMA,
      IS_PRIORITY: isPriority,
    });
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

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200/80">
          <input
            type="checkbox"
            id="isPriorityCheck"
            checked={isPriority}
            onChange={(e) => setIsPriority(e.target.checked)}
            className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
          />
          <label htmlFor="isPriorityCheck" className="text-xs font-bold text-amber-900 cursor-pointer flex items-center gap-1.5 select-none">
            <Flame size={14} className="text-amber-600 fill-amber-400" />
            Tandai sebagai Tugas Prioritas Utama 🔥
          </label>
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

const SubmitAssignmentModal: React.FC<{
  assignment: ClassroomAssignment;
  siswa: Account;
  onClose: () => void;
  onSaved: () => void;
  onTriggerMilestone?: (studentName: string, milestoneTitle: string) => void;
}> = ({ assignment, siswa, onClose, onSaved, onTriggerMilestone }) => {
  const existing = classroomService.getSubmissions(assignment.ID, siswa.ID)[0];
  const [isi, setIsi] = useState(existing?.ISI || '');
  const [fileLink, setFileLink] = useState(existing?.FILE_LINK || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    classroomService.saveSubmission({
      ASSIGNMENT_ID: assignment.ID,
      COURSE_ID: assignment.COURSE_ID,
      SISWA_ID: siswa.ID,
      SISWA_NAMA: siswa.NAMA,
      ISI: isi,
      FILE_LINK: fileLink,
      STATUS: 'SUBMITTED',
    });

    const studentSubs = classroomService.getSubmissions(undefined, siswa.ID);
    if (studentSubs.length >= 10 || studentSubs.length % 5 === 0) {
      if (onTriggerMilestone) {
        onTriggerMilestone(
          siswa.NAMA,
          `🏆 Milestone Terlampaui: Total ${studentSubs.length} Tugas Tepat Waktu!`
        );
      }
    }

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

  // Bulk Grading State
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [bulkScore, setBulkScore] = useState<number>(85);
  const [bulkFeedback, setBulkFeedback] = useState<string>('Kerja bagus! Jawaban tepat dan rapi.');

  const course = useMemo(() => classroomService.getCourses().find((c) => c.ID === assignment.COURSE_ID), [assignment.COURSE_ID]);
  const enrolledStudents = useMemo(() => accountService.getStudents().filter((s) => course?.SISWA_IDS.includes(s.ID)), [course]);
  
  const missingStudents = useMemo(() => {
    const submittedIds = submissions.map((s) => s.SISWA_ID);
    return enrolledStudents.filter((s) => !submittedIds.includes(s.ID));
  }, [submissions, enrolledStudents]);

  const handleToggleSelectAll = () => {
    if (selectedSubIds.length === submissions.length) {
      setSelectedSubIds([]);
    } else {
      setSelectedSubIds(submissions.map((s) => s.ID));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedSubIds.includes(id)) {
      setSelectedSubIds(selectedSubIds.filter((sId) => sId !== id));
    } else {
      setSelectedSubIds([...selectedSubIds, id]);
    }
  };

  const handleApplyBulkGrade = () => {
    if (selectedSubIds.length === 0) return;
    const updates = selectedSubIds.map((id) => ({
      id,
      nilai: bulkScore,
      feedback: bulkFeedback,
    }));
    classroomService.gradeSubmissionsBulk(updates, guru.NAMA);
    setSelectedSubIds([]);
    onRefresh();
  };

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
    const body = `Halo,\n\nMengingatkan bahwa tugas "${assignment.JUDUL}" untuk kelas ${course?.NAMA || ''} belum Anda kumpulkan.\nMohon segera diselesaikan sebelum batas waktu.\n\nTerima kasih.`;
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
            <p className="text-xs text-slate-500">Daftar jawaban dan pengumpulkan tugas dari siswa</p>
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

        {/* Bulk Grading Panel Toolbar */}
        {submissions.length > 0 && (
          <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="selectAllSubmissions"
                checked={selectedSubIds.length === submissions.length && submissions.length > 0}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="selectAllSubmissions" className="text-xs font-bold text-purple-900 cursor-pointer select-none">
                Pilih Semua ({selectedSubIds.length}/{submissions.length} Terpilih)
              </label>
            </div>

            {selectedSubIds.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={bulkScore}
                  onChange={(e) => setBulkScore(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs font-bold rounded-lg border border-purple-300 bg-white"
                  placeholder="Nilai"
                />
                <input
                  type="text"
                  value={bulkFeedback}
                  onChange={(e) => setBulkFeedback(e.target.value)}
                  className="w-44 px-2.5 py-1 text-xs rounded-lg border border-purple-300 bg-white"
                  placeholder="Catatan massal..."
                />
                <button
                  onClick={handleApplyBulkGrade}
                  className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-700/20 cursor-pointer transition"
                >
                  <Award size={13} /> Nilai Massal ({selectedSubIds.length})
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Belum ada siswa yang mengumpulkan tugas ini.
            </div>
          ) : (
            submissions.map((sub, idx) => {
              const isChecked = selectedSubIds.includes(sub.ID);
              return (
                <div key={sub.ID} className={`p-4 flex items-center justify-between gap-4 transition ${isChecked ? 'bg-purple-50/40' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSelectOne(sub.ID)}
                      className="mt-1 w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer shrink-0"
                    />
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
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
                        {sub.VOICE_NOTE && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                            <Mic size={10} /> Voice Note Guru
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{sub.ISI}"
                      </p>
                      {sub.VOICE_NOTE && (
                        <div className="mt-2 p-2 bg-purple-50 rounded-xl border border-purple-200/60 max-w-sm">
                          <span className="text-[9px] font-bold text-purple-700 block mb-1">Rekaman Suara Guru:</span>
                          <audio controls src={sub.VOICE_NOTE} className="w-full h-8" />
                        </div>
                      )}
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
              );
            })
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

// ============ MODAL: ANONYMOUS STUDENT PEER REVIEW ============
interface _DeprecatedStudentPeerReviewModalProps {
  assignment: ClassroomAssignment;
  siswa: Account;
  onClose: () => void;
  onRefresh: () => void;
}

const _DeprecatedStudentPeerReviewModal: React.FC<_DeprecatedStudentPeerReviewModalProps> = ({
  assignment,
  siswa,
  onClose,
  onRefresh,
}) => {
  const [submissions, setSubmissions] = useState<ClassroomSubmission[]>([]);
  const [selectedSub, setSelectedSub] = useState<ClassroomSubmission | null>(null);
  const [peerReviews, setPeerReviews] = useState<any[]>([]);

  // Rubric scoring states
  const [scoreKreativitas, setScoreKreativitas] = useState(85);
  const [feedbackKreativitas, setFeedbackKreativitas] = useState('');
  const [scoreStruktur, setScoreStruktur] = useState(85);
  const [feedbackStruktur, setFeedbackStruktur] = useState('');
  const [scoreMateri, setScoreMateri] = useState(85);
  const [feedbackMateri, setFeedbackMateri] = useState('');
  const [generalComment, setGeneralComment] = useState('');
  
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'REVIEW' | 'MY_REVIEWS'>('SUMMARY');

  // AI Constructive Feedback Suggestion States
  const [isGeneratingAiSuggestion, setIsGeneratingAiSuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiTargetCategory, setAiTargetCategory] = useState<'GENERAL' | 'KREATIVITAS' | 'STRUKTUR' | 'MATERI' | null>(null);

  const handleGenerateAiSuggestion = async (category: 'GENERAL' | 'KREATIVITAS' | 'STRUKTUR' | 'MATERI') => {
    if (!selectedSub) return;
    setIsGeneratingAiSuggestion(true);
    setAiTargetCategory(category);
    setAiSuggestion(null);

    const draftMap = {
      GENERAL: generalComment,
      KREATIVITAS: feedbackKreativitas,
      STRUKTUR: feedbackStruktur,
      MATERI: feedbackMateri,
    };
    const currentDraft = draftMap[category];

    const categoryLabelMap = {
      GENERAL: 'Komentar & Saran Umum',
      KREATIVITAS: 'Kreativitas & Orisinalitas',
      STRUKTUR: 'Struktur & Kerapian',
      MATERI: 'Kesesuaian Materi & Kebenaran Jawaban',
    };

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Kamu adalah Asisten AI Pembimbing Ulasan Sejawat (Peer Review) di sekolah.
Berikan 1-2 kalimat saran umpan balik (feedback) yang SANGAT KONSTRUKTIF, SOPAN, EMPATIK, dan MEMBANGUN SEMANGAT untuk siswa lain.
Data Tugas: "${assignment.JUDUL}" (${assignment.DESKRIPSI || ''})
Hasil Pekerjaan Teman: "${selectedSub.ISI}"
Aspek Rubrik: ${categoryLabelMap[category]}
Draft Komentar Siswa saat ini: "${currentDraft || 'Belum ada draft'}"

ATURAN:
1. Mulai dengan apresiasi positif yang tulus atas usahanya.
2. Berikan 1 saran perbaikan yang spesifik dan disampaikan dengan kata-kata yang santun & suportif.
3. JANGAN pernah menggunakan kata-kata kasar, menghakimi, atau menjatuhkan.
4. Berikan HANYA teks masukan langsung tanpa tanda kutip berlebih atau kata pengantar.`
        }),
      });

      if (!response.ok) throw new Error('AI Server offline');
      const data = await response.json();
      if (data && data.text) {
        setAiSuggestion(data.text.trim());
      } else {
        throw new Error('No AI response text');
      }
    } catch (err) {
      console.warn('AI suggestion fallback:', err);
      const fallbacks = {
        GENERAL: [
          'Pekerjaanmu sudah sangat rapi dan sesuai instruksi tugas! Agar makin sempurna, cobalah untuk merangkum bagian kesimpulan di bagian akhir dengan poin-poin singkat.',
          'Saya sangat menikmati membaca hasil pekerjaanmu karena alurnya berurutan. Ditambahkan sedikit contoh nyata tentu akan membuat jawabanmu semakin kuat.',
          'Usaha kerasmu terlihat jelas dari detail jawaban yang disampaikan. Pertahankan semangat belajar ini dan periksa kembali penulisan tanda baca ya!'
        ],
        KREATIVITAS: [
          'Ide dan sudut pandang pengerjaan tugas ini sangat segar dan inspiratif! Penampilannya juga rapi.',
          'Penyajian tugasmu cukup kreatif. Bila ditambahkan diagram atau ilustrasi sederhana, tentu akan semakin menarik!'
        ],
        STRUKTUR: [
          'Format penulisan sudah tertata sistematis. Penomoran dan pembagian paragraf sudah sangat nyaman dibaca.',
          'Alur tugas sudah bagus, mungkin bagian awal bisa diberikan judul singkat agar pembaca lebih cepat paham.'
        ],
        MATERI: [
          'Pemahaman konsep materimu sudah sangat baik dan sesuai dengan penjelasan guru di kelas.',
          'Sebagian besar jawaban sudah tepat. Pastikan untuk memverifikasi ulang perhitungan pada nomor bagian akhir ya!'
        ]
      };
      const list = fallbacks[category] || fallbacks.GENERAL;
      setAiSuggestion(list[Math.floor(Math.random() * list.length)]);
    } finally {
      setIsGeneratingAiSuggestion(false);
    }
  };

  const applyAiSuggestion = (suggestionText: string) => {
    if (!aiTargetCategory) return;
    if (aiTargetCategory === 'GENERAL') setGeneralComment(suggestionText);
    else if (aiTargetCategory === 'KREATIVITAS') setFeedbackKreativitas(suggestionText);
    else if (aiTargetCategory === 'STRUKTUR') setFeedbackStruktur(suggestionText);
    else if (aiTargetCategory === 'MATERI') setFeedbackMateri(suggestionText);
    setAiSuggestion(null);
    setAiTargetCategory(null);
  };

  const appendAiSuggestion = (suggestionText: string) => {
    if (!aiTargetCategory) return;
    if (aiTargetCategory === 'GENERAL') setGeneralComment((prev) => (prev ? `${prev} ${suggestionText}` : suggestionText));
    else if (aiTargetCategory === 'KREATIVITAS') setFeedbackKreativitas((prev) => (prev ? `${prev} ${suggestionText}` : suggestionText));
    else if (aiTargetCategory === 'STRUKTUR') setFeedbackStruktur((prev) => (prev ? `${prev} ${suggestionText}` : suggestionText));
    else if (aiTargetCategory === 'MATERI') setFeedbackMateri((prev) => (prev ? `${prev} ${suggestionText}` : suggestionText));
    setAiSuggestion(null);
    setAiTargetCategory(null);
  };

  // Student's own submission and reviews received from peers
  const mySubmission = useMemo(
    () => classroomService.getSubmissions(assignment.ID, siswa.ID)[0],
    [assignment.ID, siswa.ID]
  );

  const receivedReviews = useMemo(
    () => (mySubmission ? classroomService.getPeerReviews(assignment.ID, mySubmission.ID) : []),
    [assignment.ID, mySubmission]
  );

  // Rubric Summary Calculation (Highest and Lowest scoring rubrics)
  const rubricsSummary = useMemo(() => {
    // If real received reviews exist, calculate from them; otherwise use realistic benchmark reviews
    const reviewsToAnalyze =
      receivedReviews.length > 0
        ? receivedReviews
        : [
            {
              ID: 'demo-peer-1',
              SCORE_KREATIVITAS: 92,
              FEEDBACK_KREATIVITAS: 'Penyajian ide sangat kreatif, orisinal, dan visualisasi tugas sangat rapi.',
              SCORE_STRUKTUR: 85,
              FEEDBACK_STRUKTUR: 'Format penulisan sudah sistematis, alur pengerjaan cukup jelas dan berurutan.',
              SCORE_MATERI: 78,
              FEEDBACK_MATERI: 'Sebagian jawaban pada nomor 3 dan 4 perlu diperiksa kembali rumus dasarnya.',
              GENERAL_COMMENT: 'Kerja keras yang luar biasa! Pertahankan kreativitasmu dan teliti kembali perhitungan.',
              SUBMITTED_AT: '2026-03-01 09:30',
            },
            {
              ID: 'demo-peer-2',
              SCORE_KREATIVITAS: 90,
              FEEDBACK_KREATIVITAS: 'Ide solusi sangat segar dan berbeda dari teman yang lain.',
              SCORE_STRUKTUR: 88,
              FEEDBACK_STRUKTUR: 'Tabel dan diagram dibuat dengan rapi.',
              SCORE_MATERI: 80,
              FEEDBACK_MATERI: 'Sudah sesuai dengan petunjuk guru, hanya perlu sedikit elaborasi di kesimpulan.',
              GENERAL_COMMENT: 'Sangat inspiratif! Senang membaca hasil pekerjaanmu.',
              SUBMITTED_AT: '2026-03-01 11:15',
            },
          ];

    const avgKreativitas = Math.round(
      reviewsToAnalyze.reduce((s, r) => s + (r.SCORE_KREATIVITAS ?? 85), 0) / reviewsToAnalyze.length
    );
    const avgStruktur = Math.round(
      reviewsToAnalyze.reduce((s, r) => s + (r.SCORE_STRUKTUR ?? 85), 0) / reviewsToAnalyze.length
    );
    const avgMateri = Math.round(
      reviewsToAnalyze.reduce((s, r) => s + (r.SCORE_MATERI ?? 85), 0) / reviewsToAnalyze.length
    );

    const rubricItems = [
      {
        id: 'KREATIVITAS',
        title: 'Kreativitas & Orisinalitas',
        score: avgKreativitas,
        badgeColor: 'emerald',
        description: 'Keunikan ide, inovasi pendekatan masalah, dan estetika penyajian hasil karya.',
        feedbacks: reviewsToAnalyze.map((r) => r.FEEDBACK_KREATIVITAS).filter(Boolean),
        recommendation: 'Pertahankan eksplorasi ide kreatifmu untuk portofolio penugasan berikutnya!',
      },
      {
        id: 'STRUKTUR',
        title: 'Struktur & Kerapian',
        score: avgStruktur,
        badgeColor: 'blue',
        description: 'Sistematika pengerjaan, format tata letak, kerapian penulisan, dan kejelasan alur.',
        feedbacks: reviewsToAnalyze.map((r) => r.FEEDBACK_STRUKTUR).filter(Boolean),
        recommendation: 'Gunakan penomoran dan poin-poin terstruktur agar jawaban semakin mudah dipahami.',
      },
      {
        id: 'MATERI',
        title: 'Kesesuaian Materi & Kebenaran Jawaban',
        score: avgMateri,
        badgeColor: 'amber',
        description: 'Ketepatan konsep materi pelajaran, kepatuhan instruksi guru, dan keakuratan jawaban.',
        feedbacks: reviewsToAnalyze.map((r) => r.FEEDBACK_MATERI).filter(Boolean),
        recommendation: 'Periksa kembali konsep materi dan lakukan verifikasi rumus sebelum mengumpulkan tugas.',
      },
    ];

    const sortedByScore = [...rubricItems].sort((a, b) => b.score - a.score);
    const highestRubric = sortedByScore[0];
    const lowestRubric = sortedByScore[sortedByScore.length - 1];
    const overallAverage = Math.round((avgKreativitas + avgStruktur + avgMateri) / 3);

    return {
      rubricItems,
      highestRubric,
      lowestRubric,
      overallAverage,
      totalReviews: reviewsToAnalyze.length,
      isLiveReceivedData: receivedReviews.length > 0,
      generalComments: reviewsToAnalyze.map((r) => r.GENERAL_COMMENT).filter(Boolean),
    };
  }, [receivedReviews]);

  useEffect(() => {
    // Load all submissions for this assignment, excluding current student
    const allSubs = classroomService.getSubmissions(assignment.ID);
    const peerSubs = allSubs.filter((s) => s.SISWA_ID !== siswa.ID);
    setSubmissions(peerSubs);

    // Load peer reviews by this student
    const allReviews = classroomService.getPeerReviews(assignment.ID);
    const myReviews = allReviews.filter((r) => r.REVIEWER_ID === siswa.ID);
    setPeerReviews(myReviews);
  }, [assignment.ID, siswa.ID]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    classroomService.savePeerReview({
      ASSIGNMENT_ID: assignment.ID,
      SUBMISSION_ID: selectedSub.ID,
      REVIEWER_ID: siswa.ID,
      SCORE_KREATIVITAS: scoreKreativitas,
      FEEDBACK_KREATIVITAS: feedbackKreativitas,
      SCORE_STRUKTUR: scoreStruktur,
      FEEDBACK_STRUKTUR: feedbackStruktur,
      SCORE_MATERI: scoreMateri,
      FEEDBACK_MATERI: feedbackMateri,
      GENERAL_COMMENT: generalComment,
    });

    // Reset fields & refresh list
    setSelectedSub(null);
    setScoreKreativitas(85);
    setFeedbackKreativitas('');
    setScoreStruktur(85);
    setFeedbackStruktur('');
    setScoreMateri(85);
    setFeedbackMateri('');
    setGeneralComment('');

    // Reload peer reviews
    const allReviews = classroomService.getPeerReviews(assignment.ID);
    const myReviews = allReviews.filter((r) => r.REVIEWER_ID === siswa.ID);
    setPeerReviews(myReviews);
    
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Users size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Penilaian Sejawat (Peer Review)</h3>
              <p className="text-xs text-slate-500">
                Tugas: <strong>{assignment.JUDUL}</strong> • Evaluasi & masukan anonim dari rekan sekelas
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 shrink-0 bg-slate-100 p-1.5 rounded-2xl w-fit flex-wrap">
          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'SUMMARY' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy size={13} className="text-amber-500" />
            <span>Ringkasan Nilai Diterima (Rubrik Tertinggi & Terendah)</span>
          </button>
          <button
            onClick={() => setActiveTab('REVIEW')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'REVIEW' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 size={13} />
            <span>Beri Penilaian Teman ({submissions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('MY_REVIEWS')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'MY_REVIEWS' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Ulasan Saya ({peerReviews.length})</span>
          </button>
        </div>

        {/* TAB 1: SUMMARY OF RECEIVED REVIEWS (HIGHEST & LOWEST RUBRICS) */}
        {activeTab === 'SUMMARY' ? (
          <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">
            {/* Top Stat Banner */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 block">
                  Analisis Umpan Balik Sejawat untuk {siswa.NAMA}
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  Rata-rata Skor Peer Review: <span className="text-indigo-800 font-mono text-base">{rubricsSummary.overallAverage} / 100</span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Dihitung dari {rubricsSummary.totalReviews} ulasan sejawat yang masuk secara anonim.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-800 text-xs font-bold shadow-xs">
                  {rubricsSummary.isLiveReceivedData ? '✓ Data Ulasan Langsung' : '📊 Baseline Evaluasi Kelas'}
                </span>
              </div>
            </div>

            {/* HIGHEST AND LOWEST RUBRIC HIGHLIGHTS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* HIGHEST SCORING RUBRIC CARD */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 shadow-xs space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold shadow-xs">
                    <Trophy size={12} /> ⭐ RUBRIK SKOR TERTINGGI (Paling Unggul)
                  </span>
                  <span className="text-xs font-bold text-emerald-800">Prestasi Puncak</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <h5 className="text-sm font-black text-emerald-950">
                      {rubricsSummary.highestRubric.title}
                    </h5>
                    <span className="text-xl font-black text-emerald-800 font-mono">
                      {rubricsSummary.highestRubric.score}
                      <span className="text-xs font-semibold text-emerald-600">/100</span>
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800/90 leading-relaxed">
                    {rubricsSummary.highestRubric.description}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-emerald-200/70 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all"
                    style={{ width: `${rubricsSummary.highestRubric.score}%` }}
                  />
                </div>

                {/* Positive Feedback Snippet */}
                {rubricsSummary.highestRubric.feedbacks.length > 0 && (
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-emerald-700 block uppercase">
                      Kutipan Apresiasi Rekan Sejawat:
                    </span>
                    <p className="text-emerald-950 italic">
                      "{rubricsSummary.highestRubric.feedbacks[0]}"
                    </p>
                  </div>
                )}
              </div>

              {/* LOWEST SCORING RUBRIC CARD */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 shadow-xs space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-extrabold shadow-xs">
                    <TrendingDown size={12} /> 🎯 RUBRIK SKOR TERENDAH (Fokus Remediasi)
                  </span>
                  <span className="text-xs font-bold text-amber-800">Area Perbaikan</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <h5 className="text-sm font-black text-amber-950">
                      {rubricsSummary.lowestRubric.title}
                    </h5>
                    <span className="text-xl font-black text-amber-800 font-mono">
                      {rubricsSummary.lowestRubric.score}
                      <span className="text-xs font-semibold text-amber-600">/100</span>
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 leading-relaxed">
                    {rubricsSummary.lowestRubric.description}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-amber-200/70 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all"
                    style={{ width: `${rubricsSummary.lowestRubric.score}%` }}
                  />
                </div>

                {/* Actionable Feedback Snippet */}
                <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 block uppercase">
                    Rekomendasi Tindak Lanjut Perbaikan:
                  </span>
                  <p className="text-amber-950 font-medium">
                    {rubricsSummary.lowestRubric.recommendation}
                  </p>
                  {rubricsSummary.lowestRubric.feedbacks.length > 0 && (
                    <p className="text-slate-600 italic text-[11px] pt-1 border-t border-amber-100 mt-1">
                      Catatan rekan: "{rubricsSummary.lowestRubric.feedbacks[0]}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* FULL RUBRICS BREAKDOWN */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList size={14} className="text-indigo-600" />
                Rincian Skor Semua Rubrik Penilaian
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {rubricsSummary.rubricItems.map((item, idx) => (
                  <div key={item.id} className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Rubrik #{idx + 1}</span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                          item.score >= 88
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.score >= 80
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.score} / 100
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-900">{item.title}</h5>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          item.score >= 88 ? 'bg-emerald-500' : item.score >= 80 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-500">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ANONYMOUS GENERAL PEER COMMENTS */}
            {rubricsSummary.generalComments.length > 0 && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-indigo-600" />
                  Komentar & Catatan Rekan Sekelas (Anonim)
                </h4>
                <div className="space-y-2">
                  {rubricsSummary.generalComments.map((cmt, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-700 italic">
                      "{cmt}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'REVIEW' ? (
          <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row gap-5 min-h-0">
            {/* Sidebar: List of peer submissions */}
            <div className="w-full lg:w-1/3 flex flex-col gap-3 min-h-0 border-r border-slate-100 pr-0 lg:pr-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Daftar Pekerjaan Teman</h4>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {submissions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada tugas teman lain yang terkumpul.</p>
                ) : (
                  submissions.map((sub, idx) => {
                    const alreadyReviewed = peerReviews.some((r) => r.SUBMISSION_ID === sub.ID);
                    return (
                      <button
                        key={sub.ID}
                        type="button"
                        onClick={() => setSelectedSub(sub)}
                        className={`w-full p-3.5 rounded-2xl text-left border transition flex items-center justify-between gap-2 cursor-pointer ${
                          selectedSub?.ID === sub.ID
                            ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/10'
                            : alreadyReviewed
                            ? 'bg-emerald-50/50 border-emerald-100 hover:bg-slate-50'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">Siswa Anonim #{idx + 1}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Tugas dikumpul: {sub.SUBMITTED_AT.split(' ')[0]}</p>
                        </div>
                        {alreadyReviewed ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-0.5">
                            <Check size={10} /> Selesai
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                            Belum Dinilai
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Main Area: Reviewing the selected submission */}
            <div className="flex-1 min-h-0 flex flex-col bg-slate-50/30 p-4 rounded-3xl border border-slate-100">
              {selectedSub ? (
                <form onSubmit={handleSubmitReview} className="flex-1 flex flex-col gap-4 min-h-0">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 overflow-y-auto max-h-40 shrink-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 block mb-1">Hasil Pekerjaan Teman:</span>
                    <p className="text-xs text-slate-700 italic whitespace-pre-wrap font-mono">
                      "{selectedSub.ISI}"
                    </p>
                    {selectedSub.FILE_LINK && (
                      <a
                        href={selectedSub.FILE_LINK}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-600 font-bold hover:underline inline-flex items-center gap-1 mt-2 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100"
                      >
                        <FileText size={12} /> Buka Tautan Pekerjaan
                      </a>
                    )}
                  </div>

                  {/* Rubric Evaluasi */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <ClipboardList size={14} className="text-indigo-600" />
                      Rubrik Penilaian Terstruktur (Teacher's Rubric)
                    </h4>

                    {/* Criteria 1 */}
                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-150 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">1. Kreativitas & Orisinalitas</h5>
                          <p className="text-[10px] text-slate-400">Bagaimana keunikan ide, penyajian, dan ekspresi pengerjaan tugas?</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={scoreKreativitas}
                            onChange={(e) => setScoreKreativitas(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-16 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 text-center bg-white text-indigo-700"
                          />
                          <span className="text-xs text-slate-500 font-semibold">/100</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={scoreKreativitas}
                        onChange={(e) => setScoreKreativitas(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex items-center justify-between gap-1">
                        <textarea
                          value={feedbackKreativitas}
                          onChange={(e) => setFeedbackKreativitas(e.target.value)}
                          placeholder="Berikan masukan atau apresiasi Anda..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-indigo-600 bg-white"
                          rows={1}
                        />
                        <button
                          type="button"
                          onClick={() => handleGenerateAiSuggestion('KREATIVITAS')}
                          disabled={isGeneratingAiSuggestion}
                          className="px-2.5 py-1.5 text-[10px] font-bold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1 shrink-0 border border-indigo-200 cursor-pointer disabled:opacity-50"
                          title="Minta Saran AI untuk Kreativitas"
                        >
                          <Sparkles size={11} className={isGeneratingAiSuggestion && aiTargetCategory === 'KREATIVITAS' ? 'animate-spin text-indigo-600' : 'text-purple-600'} />
                          <span>AI</span>
                        </button>
                      </div>
                    </div>

                    {/* Criteria 2 */}
                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-150 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">2. Struktur & Kerapian</h5>
                          <p className="text-[10px] text-slate-400">Apakah pengerjaan tertata rapi, terstruktur, dan mudah dipahami alurnya?</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={scoreStruktur}
                            onChange={(e) => setScoreStruktur(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-16 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 text-center bg-white text-indigo-700"
                          />
                          <span className="text-xs text-slate-500 font-semibold">/100</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={scoreStruktur}
                        onChange={(e) => setScoreStruktur(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex items-center justify-between gap-1">
                        <textarea
                          value={feedbackStruktur}
                          onChange={(e) => setFeedbackStruktur(e.target.value)}
                          placeholder="Berikan masukan atau apresiasi Anda..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-indigo-600 bg-white"
                          rows={1}
                        />
                        <button
                          type="button"
                          onClick={() => handleGenerateAiSuggestion('STRUKTUR')}
                          disabled={isGeneratingAiSuggestion}
                          className="px-2.5 py-1.5 text-[10px] font-bold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1 shrink-0 border border-indigo-200 cursor-pointer disabled:opacity-50"
                          title="Minta Saran AI untuk Struktur"
                        >
                          <Sparkles size={11} className={isGeneratingAiSuggestion && aiTargetCategory === 'STRUKTUR' ? 'animate-spin text-indigo-600' : 'text-purple-600'} />
                          <span>AI</span>
                        </button>
                      </div>
                    </div>

                    {/* Criteria 3 */}
                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-150 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">3. Kesesuaian Materi & Kebenaran Jawaban</h5>
                          <p className="text-[10px] text-slate-400">Seberapa akurat jawaban siswa sesuai instruksi tugas?</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={scoreMateri}
                            onChange={(e) => setScoreMateri(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-16 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 text-center bg-white text-indigo-700"
                          />
                          <span className="text-xs text-slate-500 font-semibold">/100</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={scoreMateri}
                        onChange={(e) => setScoreMateri(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex items-center justify-between gap-1">
                        <textarea
                          value={feedbackMateri}
                          onChange={(e) => setFeedbackMateri(e.target.value)}
                          placeholder="Berikan masukan atau apresiasi Anda..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-indigo-600 bg-white"
                          rows={1}
                        />
                        <button
                          type="button"
                          onClick={() => handleGenerateAiSuggestion('MATERI')}
                          disabled={isGeneratingAiSuggestion}
                          className="px-2.5 py-1.5 text-[10px] font-bold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1 shrink-0 border border-indigo-200 cursor-pointer disabled:opacity-50"
                          title="Minta Saran AI untuk Materi"
                        >
                          <Sparkles size={11} className={isGeneratingAiSuggestion && aiTargetCategory === 'MATERI' ? 'animate-spin text-indigo-600' : 'text-purple-600'} />
                          <span>AI</span>
                        </button>
                      </div>
                    </div>

                    {/* AI Suggestion Interactive Display Box */}
                    {aiSuggestion && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-blue-50/90 border-2 border-indigo-200 shadow-sm space-y-2.5 my-2 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-indigo-900 font-extrabold text-xs">
                            <Sparkles size={14} className="text-purple-600 animate-pulse" />
                            <span>Saran Feedback Konstruktif AI ({aiTargetCategory || 'Umum'}):</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setAiSuggestion(null); setAiTargetCategory(null); }}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white/90 p-3 rounded-xl border border-indigo-100 italic">
                          "{aiSuggestion}"
                        </p>
                        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => applyAiSuggestion(aiSuggestion)}
                              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Check size={12} /> Gunakan Teks Ini
                            </button>
                            <button
                              type="button"
                              onClick={() => appendAiSuggestion(aiSuggestion)}
                              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Plus size={12} /> Gabungkan ke Draft Saya
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => aiTargetCategory && handleGenerateAiSuggestion(aiTargetCategory)}
                            disabled={isGeneratingAiSuggestion}
                            className="px-2.5 py-1.5 text-xs font-bold rounded-xl text-purple-700 hover:bg-purple-100 transition flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw size={12} className={isGeneratingAiSuggestion ? 'animate-spin' : ''} />
                            Regenerasi Saran
                          </button>
                        </div>
                      </div>
                    )}

                    {/* General Comment */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <label className="text-xs font-bold text-slate-700 block">Komentar / Saran Umum (General Comment)</label>
                        <button
                          type="button"
                          onClick={() => handleGenerateAiSuggestion('GENERAL')}
                          disabled={isGeneratingAiSuggestion}
                          className="px-3 py-1 text-[11px] font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:opacity-95 transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles size={12} className={isGeneratingAiSuggestion && aiTargetCategory === 'GENERAL' ? 'animate-spin' : ''} />
                          <span>{isGeneratingAiSuggestion && aiTargetCategory === 'GENERAL' ? 'Menyusun AI...' : 'AI Suggestion (Konstruktif & Sopan)'}</span>
                        </button>
                      </div>
                      <textarea
                        value={generalComment}
                        onChange={(e) => setGeneralComment(e.target.value)}
                        placeholder="Tulis saran pengembangan menyeluruh untuk mendukung kemajuan belajar temanmu..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-indigo-600 bg-white"
                        rows={3}
                        required
                      />

                      {/* Quick Feedback Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-2">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Bot size={11} className="text-indigo-500" /> Templat Sopan:
                        </span>
                        {[
                          '✨ Penyajian sangat rapi dan berurutan',
                          '💡 Ide solusi sangat orisinal & inovatif',
                          '🎯 Jawaban sudah tepat sesuai instruksi guru',
                          '👏 Kerja bagus! Pertahankan semangat belajar ini'
                        ].map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setGeneralComment((prev) => prev ? `${prev} ${chip.replace(/^[^\s]+\s/, '')}.` : `${chip.replace(/^[^\s]+\s/, '')}.`)}
                            className="px-2.5 py-1 text-[10px] font-semibold bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-lg transition cursor-pointer"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submission Action */}
                  <div className="flex justify-end gap-2 shrink-0 border-t border-slate-150 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSub(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition"
                    >
                      <Send size={13} /> Kirim Penilaian Anonim
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                  <Users size={36} className="text-slate-300 mb-3 animate-pulse" />
                  <p className="text-xs font-medium text-slate-500">Pilih salah satu pekerjaan teman di kolom kiri untuk mulai mengevaluasi secara objektif & rahasia.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Tab: MY_REVIEWS */
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
            {peerReviews.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-10">
                Anda belum mengirim ulasan apa pun untuk tugas ini.
              </div>
            ) : (
              peerReviews.map((r, i) => {
                const subIdx = submissions.findIndex((s) => s.ID === r.SUBMISSION_ID);
                const averageScore = Math.round((r.SCORE_KREATIVITAS + r.SCORE_STRUKTUR + r.SCORE_MATERI) / 3);
                return (
                  <div key={r.ID} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-bold text-indigo-800">Ulasan #{i + 1} - Teman Anonim #{subIdx >= 0 ? subIdx + 1 : 'Spesial'}</h4>
                      <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                        <Star size={11} className="text-amber-500 fill-amber-500" /> Nilai Rata-Rata: {averageScore}/100
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="font-bold text-[10px] text-slate-400 block uppercase">1. Kreativitas</span>
                        <span className="font-black text-indigo-700 text-xs">{r.SCORE_KREATIVITAS}/100</span>
                        {r.FEEDBACK_KREATIVITAS && <p className="text-[10px] text-slate-500 mt-1 italic">"{r.FEEDBACK_KREATIVITAS}"</p>}
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="font-bold text-[10px] text-slate-400 block uppercase">2. Struktur & Rapi</span>
                        <span className="font-black text-indigo-700 text-xs">{r.SCORE_STRUKTUR}/100</span>
                        {r.FEEDBACK_STRUKTUR && <p className="text-[10px] text-slate-500 mt-1 italic">"{r.FEEDBACK_STRUKTUR}"</p>}
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="font-bold text-[10px] text-slate-400 block uppercase">3. Kesesuaian</span>
                        <span className="font-black text-indigo-700 text-xs">{r.SCORE_MATERI}/100</span>
                        {r.FEEDBACK_MATERI && <p className="text-[10px] text-slate-500 mt-1 italic">"{r.FEEDBACK_MATERI}"</p>}
                      </div>
                    </div>

                    <div className="text-xs bg-white p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-[10px] text-slate-400 block uppercase">Komentar & Saran Umum:</span>
                      <p className="text-slate-700 mt-1 italic font-sans whitespace-pre-wrap">"{r.GENERAL_COMMENT}"</p>
                    </div>

                    <div className="text-[10px] text-slate-400 text-right">
                      Diberikan pada: {r.SUBMITTED_AT}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 shrink-0 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition">
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ MODAL: GRADE STUDENT SUBMISSION WITH VOICE NOTE ============
const GradeSubmissionModal: React.FC<{
  submission: ClassroomSubmission;
  guru: Account;
  onClose: () => void;
  onGraded: () => void;
}> = ({ submission, guru, onClose, onGraded }) => {
  const [nilai, setNilai] = useState<number>(submission.NILAI || 90);
  const [feedback, setFeedback] = useState<string>(submission.FEEDBACK || '');
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string>(submission.VOICE_NOTE || '');

  const peerReviews = useMemo(() => classroomService.getPeerReviews(submission.ASSIGNMENT_ID, submission.ID), [submission.ASSIGNMENT_ID, submission.ID]);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setVoiceNoteUrl(reader.result as string);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Gagal mengakses mikrofon perangkat. Harap izinkan akses mikrofon.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    classroomService.gradeSubmission(submission.ID, nilai, feedback, guru.NAMA, voiceNoteUrl);
    onGraded();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4 backdrop-blur-xs">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
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
          {submission.FILE_LINK && (
            <div className="mt-2 text-[11px] text-blue-600 font-bold flex items-center gap-1">
              <FileText size={12} /> Lampiran: {submission.FILE_LINK}
            </div>
          )}
        </div>

        {peerReviews.length > 0 && (
          <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
            <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
              <Users size={12} /> Hasil Review Sejawat ({peerReviews.length} Ulasan)
            </span>
            <div className="space-y-2 divide-y divide-indigo-100 max-h-40 overflow-y-auto pr-1">
              {peerReviews.map((r, i) => {
                const avg = Math.round((r.SCORE_KREATIVITAS + r.SCORE_STRUKTUR + r.SCORE_MATERI) / 3);
                return (
                  <div key={r.ID} className={`pt-2 ${i === 0 ? 'pt-0' : ''} text-[11px] space-y-1`}>
                    <div className="flex items-center justify-between font-bold text-indigo-950">
                      <span>Reviewer Sejawat #{i + 1}</span>
                      <span className="bg-white border border-indigo-200 px-1.5 py-0.5 rounded text-[10px]">Rata2: {avg}/100</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500">
                      <span>Kreatif: {r.SCORE_KREATIVITAS}</span>
                      <span>Struktur: {r.SCORE_STRUKTUR}</span>
                      <span>Materi: {r.SCORE_MATERI}</span>
                    </div>
                    {r.GENERAL_COMMENT && (
                      <p className="text-slate-600 italic bg-white/60 p-1.5 rounded border border-indigo-50">
                        "{r.GENERAL_COMMENT}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
          <label className="text-xs font-bold text-slate-700 block mb-1">Catatan & Umpan Balik Tekstual</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="Tulis pujian, evaluasi, atau saran perbaikan untuk siswa..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-600"
          />
        </div>

        {/* VOICE NOTE RECORDING SECTION */}
        <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Mic size={14} className="text-purple-600" /> Sertakan Voice Note Feedback
            </label>
            {isRecording && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" /> Merekam ({recordingSeconds}s)
              </span>
            )}
          </div>

          {voiceNoteUrl ? (
            <div className="space-y-2 bg-white p-2.5 rounded-xl border border-purple-200">
              <audio controls src={voiceNoteUrl} className="w-full h-8" />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setVoiceNoteUrl('')}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                >
                  <Trash2 size={12} /> Hapus Rekaman Suara
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Mic size={14} /> Mulai Rekam Suara (Mikrofon)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition cursor-pointer"
                >
                  <Square size={14} /> Stop & Simpan Voice Note
                </button>
              )}
            </div>
          )}
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
