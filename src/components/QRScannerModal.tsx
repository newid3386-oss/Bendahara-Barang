import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  QrCode,
  Camera,
  Upload,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  History,
  Trash2,
  HelpCircle,
  Check,
  SunMedium,
  ScanLine,
  BookOpen,
  Package,
  User,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/localStorageService';
import { classroomService } from '../services/classroomService';
import { accountService } from '../services/accountService';
import { Asset } from '../types';
import { ClassroomAssignment, Account } from '../types/classroom';
import { playFeedback } from '../utils/feedback';

export interface RecentScanItem {
  id: string;
  code: string;
  title: string;
  type: 'ASSIGNMENT' | 'ASSET' | 'STUDENT' | 'OTHER';
  subtitle?: string;
  timestamp: number;
  rawPayload: string;
}

const RECENT_SCANS_STORAGE_KEY = 'sdn6_qr_recent_scans_v1';

export interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset?: (asset: Asset) => void;
  onSelectAssignment?: (assignment: ClassroomAssignment) => void;
  onSelectStudent?: (student: Account) => void;
  onScanSuccess?: (item: RecentScanItem) => void;
  initialMode?: 'ALL' | 'ASSIGNMENT' | 'STUDENT' | 'ASSET';
  currentClass?: string;
  facingMode?: 'environment' | 'user';
}

type ErrorType = 'CAMERA_DENIED' | 'CAMERA_NOT_FOUND' | 'NO_QR_IN_IMAGE' | 'NOT_FOUND_IN_DB' | 'GENERAL_ERROR' | null;

interface ScanSuccessInfo {
  title: string;
  subtitle: string;
  type: 'ASSIGNMENT' | 'ASSET' | 'STUDENT' | 'OTHER';
  code: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectAsset,
  onSelectAssignment,
  onSelectStudent,
  onScanSuccess,
  initialMode = 'ALL',
  currentClass,
  facingMode = 'environment',
}) => {
  const [activeMode, setActiveMode] = useState<'ALL' | 'ASSIGNMENT' | 'STUDENT' | 'ASSET'>(initialMode);
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [successInfo, setSuccessInfo] = useState<ScanSuccessInfo | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [recentScans, setRecentScans] = useState<RecentScanItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync mode on open
  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode || 'ALL');
    }
  }, [isOpen, initialMode]);

  // Load Recent Scans from LocalStorage
  const loadRecentScans = useCallback(() => {
    try {
      const saved = localStorage.getItem(RECENT_SCANS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentScans(parsed.slice(0, 100));
        }
      }
    } catch (e) {
      console.error('Failed to load recent scans:', e);
    }
  }, []);

  // Save item to recent scans (max 5 items)
  const addRecentScan = useCallback((item: Omit<RecentScanItem, 'timestamp'>) => {
    try {
      const newItem: RecentScanItem = {
        ...item,
        timestamp: Date.now(),
      };
      setRecentScans((prev) => {
        const filtered = prev.filter((s) => s.code.toLowerCase() !== item.code.toLowerCase());
        const updated = [newItem, ...filtered].slice(0, 100);
        localStorage.setItem(RECENT_SCANS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      try {
        window.dispatchEvent(new CustomEvent('qr_scan_success', { detail: newItem }));
      } catch {}
    } catch (e) {
      console.error('Failed to save recent scan:', e);
    }
  }, []);

  const clearRecentScans = () => {
    localStorage.removeItem(RECENT_SCANS_STORAGE_KEY);
    setRecentScans([]);
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    setErrorType(null);
    setErrorMsg('');
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorType('CAMERA_NOT_FOUND');
        setErrorMsg('Peramban (browser) tidak mendukung akses kamera langsung.');
        return;
      }

      const isMobile = window.innerWidth < 768;
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: facingMode },
          ...(isMobile ? { width: { ideal: 1080 }, height: { ideal: 1920 } } : {})
        },
        audio: false,
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      const errString = err?.name || err?.message || '';
      if (errString.includes('NotAllowedError') || errString.includes('PermissionDeniedError') || errString.includes('denied')) {
        setErrorType('CAMERA_DENIED');
        setErrorMsg('Izin akses kamera diblokir atau ditolak oleh peramban.');
      } else if (errString.includes('NotFoundError') || errString.includes('DevicesNotFoundError')) {
        setErrorType('CAMERA_NOT_FOUND');
        setErrorMsg('Perangkat kamera (webcam) tidak terdeteksi pada perangkat ini.');
      } else {
        setErrorType('GENERAL_ERROR');
        setErrorMsg('Gagal menyalakan kamera: ' + (err?.message || 'Terjadi kesalahan sistem.'));
      }
    }
  }, [facingMode]);

  useEffect(() => {
    if (isOpen) {
      loadRecentScans();
      setErrorType(null);
      setErrorMsg('');
      setSuccessInfo(null);
    } else {
      stopCamera();
      setManualCode('');
      setErrorType(null);
      setErrorMsg('');
      setSuccessInfo(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera, loadRecentScans]);

  const previousFacingModeRef = useRef(facingMode);
  useEffect(() => {
    if (isCameraActive && previousFacingModeRef.current !== facingMode) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
    previousFacingModeRef.current = facingMode;
  }, [facingMode, isCameraActive, stopCamera, startCamera]);

  // Main QR resolution function for Assets, Assignments, and Students
  const resolveScannedText = useCallback(
    (rawText: string) => {
      let code = rawText.trim();
      if (!code) return;

      setIsProcessing(true);
      setErrorType(null);
      setErrorMsg('');

      // Check if it's a URL with ?scan= or ?code=
      if (code.includes('?') && (code.includes('scan=') || code.includes('code='))) {
        try {
          const url = new URL(code);
          const extracted = url.searchParams.get('scan') || url.searchParams.get('code');
          if (extracted) {
            code = extracted;
          }
        } catch {
          const match = code.match(/[?&](?:scan|code)=([^&]+)/);
          if (match) {
            code = decodeURIComponent(match[1]);
          }
        }
      }

      // Check if it's a JSON payload (Classroom assignment or student badge QR)
      let parsedJson: any = null;
      if (code.startsWith('{') && code.endsWith('}')) {
        try {
          parsedJson = JSON.parse(code);
        } catch {
          parsedJson = null;
        }
      }

      // 1. Try matching Classroom Assignment from JSON payload or direct ID
      const allAssignments = classroomService.getAssignments();
      let matchedAssignment: ClassroomAssignment | undefined;

      if (parsedJson?.assignmentId) {
        matchedAssignment = allAssignments.find((a) => a.ID === parsedJson.assignmentId);
      } else {
        matchedAssignment = allAssignments.find(
          (a) =>
            a.ID.toLowerCase() === code.toLowerCase() ||
            a.JUDUL.toLowerCase().includes(code.toLowerCase())
        );
      }

      if (matchedAssignment) {
        const info: ScanSuccessInfo = {
          title: matchedAssignment.JUDUL,
          subtitle: `Tugas Pembelajaran • ${matchedAssignment.TYPE}`,
          type: 'ASSIGNMENT',
          code: matchedAssignment.ID,
        };
        const recentItem: RecentScanItem = {
          id: matchedAssignment.ID,
          code: matchedAssignment.ID,
          title: matchedAssignment.JUDUL,
          subtitle: `Tugas • ${matchedAssignment.TYPE}`,
          type: 'ASSIGNMENT',
          rawPayload: rawText,
          timestamp: Date.now(),
        };
        playFeedback('success');
        setSuccessInfo(info);
        addRecentScan(recentItem);
        if (onScanSuccess) onScanSuccess(recentItem);

        setTimeout(() => {
          stopCamera();
          if (onSelectAssignment) {
            onSelectAssignment(matchedAssignment!);
          }
          setIsProcessing(false);
          onClose();
        }, 1100);
        return;
      }

      // 2. Try matching Student from JSON payload or NIS / ID
      const allStudents = accountService.getAccounts('CLASSROOM').filter((a) => a.ROLE === 'SISWA');
      let matchedStudent: Account | undefined;

      if (parsedJson?.studentId) {
        matchedStudent = allStudents.find((s) => s.ID === parsedJson.studentId);
      } else {
        matchedStudent = allStudents.find(
          (s) =>
            s.ID.toLowerCase() === code.toLowerCase() ||
            (s.NIP && s.NIP.toLowerCase() === code.toLowerCase()) ||
            s.NAMA.toLowerCase() === code.toLowerCase()
        );
      }

      if (matchedStudent) {
        const info: ScanSuccessInfo = {
          title: matchedStudent.NAMA,
          subtitle: `Siswa SDN Tangerang 6 • ${matchedStudent.KELAS || 'Kelas Aktif'} (NIS: ${matchedStudent.NIP || '-'})`,
          type: 'STUDENT',
          code: matchedStudent.NIP || matchedStudent.ID,
        };
        const recentItem: RecentScanItem = {
          id: matchedStudent.ID,
          code: matchedStudent.NIP || matchedStudent.ID,
          title: matchedStudent.NAMA,
          subtitle: `Siswa • ${matchedStudent.KELAS || 'Aktif'}`,
          type: 'STUDENT',
          rawPayload: rawText,
          timestamp: Date.now(),
        };
        playFeedback('success');
        setSuccessInfo(info);
        addRecentScan(recentItem);
        if (onScanSuccess) onScanSuccess(recentItem);

        setTimeout(() => {
          stopCamera();
          if (onSelectStudent) {
            onSelectStudent(matchedStudent!);
          }
          setIsProcessing(false);
          onClose();
        }, 1100);
        return;
      }

      // 3. Try matching School Asset
      const assets = db.getAssets();
      const matchedAsset = assets.find(
        (a) =>
          a.KODE_ASET.toLowerCase() === code.toLowerCase() ||
          a.KODE_BARANG.toLowerCase() === code.toLowerCase() ||
          a.ID.toLowerCase() === code.toLowerCase() ||
          a.NAMA_BARANG.toLowerCase() === code.toLowerCase()
      );

      if (matchedAsset) {
        const info: ScanSuccessInfo = {
          title: matchedAsset.NAMA_BARANG,
          subtitle: `Aset Sekolah • Kode: ${matchedAsset.KODE_ASET} (${matchedAsset.LOKASI || 'Inventaris'})`,
          type: 'ASSET',
          code: matchedAsset.KODE_ASET,
        };
        const recentItem: RecentScanItem = {
          id: matchedAsset.ID,
          code: matchedAsset.KODE_ASET,
          title: matchedAsset.NAMA_BARANG,
          subtitle: `Aset • ${matchedAsset.KODE_ASET}`,
          type: 'ASSET',
          rawPayload: rawText,
          timestamp: Date.now(),
        };
        playFeedback('success');
        setSuccessInfo(info);
        addRecentScan(recentItem);
        if (onScanSuccess) onScanSuccess(recentItem);

        setTimeout(() => {
          stopCamera();
          if (onSelectAsset) {
            onSelectAsset(matchedAsset);
          }
          setIsProcessing(false);
          onClose();
        }, 1100);
        return;
      }

      // 4. Not found
      playFeedback('error');
      setIsProcessing(false);
      setErrorType('NOT_FOUND_IN_DB');
      setErrorMsg(`Data dengan kode "${code}" tidak ditemukan dalam database aset, tugas, maupun siswa.`);
    },
    [addRecentScan, onSelectAsset, onSelectAssignment, onSelectStudent, stopCamera, onClose]
  );

  // Continuous Camera Barcode Detection Loop
  useEffect(() => {
    if (!isCameraActive || !videoRef.current || successInfo) return;

    let isScanning = true;
    let detector: any = null;

    if ('BarcodeDetector' in window) {
      try {
        detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'data_matrix'],
        });
      } catch (e) {
        console.warn('BarcodeDetector initialisation notice:', e);
      }
    }

    const scanFrame = async () => {
      if (!isScanning || !videoRef.current || videoRef.current.readyState < 2) {
        if (isScanning) {
          animationFrameRef.current = requestAnimationFrame(scanFrame);
        }
        return;
      }

      if (detector) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0 && barcodes[0]?.rawValue) {
            isScanning = false;
            resolveScannedText(barcodes[0].rawValue);
            return;
          }
        } catch {
          // ignore transient frame detection errors
        }
      }

      if (isScanning) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, successInfo, resolveScannedText]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    resolveScannedText(manualCode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorType(null);
    setErrorMsg('');
    setIsProcessing(true);

    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13'],
      });
      const img = new Image();
      img.onload = async () => {
        try {
          const barcodes = await barcodeDetector.detect(img);
          if (barcodes.length > 0 && barcodes[0]?.rawValue) {
            resolveScannedText(barcodes[0].rawValue);
          } else {
            setIsProcessing(false);
            setErrorType('NO_QR_IN_IMAGE');
            setErrorMsg('Tidak ditemukan kode QR pada gambar yang diunggah. Pastikan foto tegak lurus dan pencahayaan terang.');
          }
        } catch (err: any) {
          setIsProcessing(false);
          setErrorType('NO_QR_IN_IMAGE');
          setErrorMsg('Gagal memproses gambar QR: ' + (err?.message || 'Format gambar tidak didukung.'));
        }
      };
      img.onerror = () => {
        setIsProcessing(false);
        setErrorType('NO_QR_IN_IMAGE');
        setErrorMsg('Gagal memuat berkas foto. Silakan coba unggah berkas PNG atau JPG lain.');
      };
      img.src = URL.createObjectURL(file);
    } else {
      setIsProcessing(false);
      const nameGuess = file.name.replace(/\.[^/.]+$/, '');
      setManualCode(nameGuess);
      setErrorType('GENERAL_ERROR');
      setErrorMsg('Peramban tidak memiliki pendeteksi gambar otomatis. Kode dari nama berkas telah disalin ke kolom pencarian manual.');
    }
  };

  const handleRecentScanClick = (item: RecentScanItem) => {
    resolveScannedText(item.rawPayload || item.code);
  };

  if (!isOpen) return null;

  const assets = db.getAssets();
  const assignments = classroomService.getAssignments();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-900/40 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-800/80 text-emerald-200 ring-1 ring-emerald-500/30">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5 flex-wrap">
                Scanner QR SDN Tangerang 6
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-mono font-bold">
                  v2.4
                </span>
                {currentClass && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-800/80 text-teal-200 border border-teal-500/40 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                    Target: {currentClass}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-emerald-200/80">
                Pindai QR Tugas Siswa, Kartu Pelajar, & Label Aset
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            title="Tutup Scanner"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Category Target Mode Selector */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1">
            Fokus Scan:
          </span>
          <button
            type="button"
            onClick={() => setActiveMode('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 text-[11px] ${
              activeMode === 'ALL'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Sparkles size={12} />
            <span>Otomatis (Semua)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('ASSIGNMENT')}
            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 text-[11px] ${
              activeMode === 'ASSIGNMENT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <BookOpen size={12} />
            <span>Tugas Siswa</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('STUDENT')}
            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 text-[11px] ${
              activeMode === 'STUDENT'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <User size={12} />
            <span>Presensi Siswa</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('ASSET')}
            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 text-[11px] ${
              activeMode === 'ASSET'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Package size={12} />
            <span>Aset Sekolah</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* STEP-BY-STEP INSTRUCTIONAL GUIDE FOR STUDENTS */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 space-y-2.5 transition-all">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setShowGuide((prev) => !prev)}
            >
              <div className="flex items-center gap-2">
                <HelpCircle size={15} className="text-emerald-700 shrink-0" />
                <span className="text-xs font-black text-emerald-950">
                  Panduan Cara Scan untuk Siswa & Guru
                </span>
              </div>
              <button
                type="button"
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold flex items-center gap-0.5"
              >
                <span>{showGuide ? 'Sembunyikan' : 'Lihat Panduan'}</span>
                {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <AnimatePresence>
              {showGuide && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 overflow-hidden"
                >
                  {/* Step 1 */}
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200/60 flex items-start gap-2 text-left shadow-2xs">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-black text-[11px]">
                      <Camera size={13} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-slate-800 leading-tight">1. Buka Kamera</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Klik tombol kamera dan izinkan akses di peramban.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200/60 flex items-start gap-2 text-left shadow-2xs">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-black text-[11px]">
                      <ScanLine size={13} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-slate-800 leading-tight">2. Posisikan QR</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Arahkan kotak bidik hijau sejajar pada jarak 15–20 cm.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200/60 flex items-start gap-2 text-left shadow-2xs">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-black text-[11px]">
                      <SunMedium size={13} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-slate-800 leading-tight">3. Cahaya Terang</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Pastikan cahaya cukup tanpa silau agar terbaca otomatis.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* EXPLICIT ERROR HANDLING UI WITH TROUBLESHOOTING & RETRY BUTTONS */}
          {errorType && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-rose-900">
                    {errorType === 'CAMERA_DENIED'
                      ? 'Izin Akses Kamera Ditolak'
                      : errorType === 'CAMERA_NOT_FOUND'
                      ? 'Perangkat Kamera Tidak Ditemukan'
                      : errorType === 'NO_QR_IN_IMAGE'
                      ? 'Kode QR Tidak Ditemukan pada Foto'
                      : errorType === 'NOT_FOUND_IN_DB'
                      ? 'Data QR Tidak Dikenali'
                      : 'Terjadi Kendala Pemindaian'}
                  </h4>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">{errorMsg}</p>

                  {/* Troubleshooting Guidance */}
                  <div className="mt-2 text-[11px] text-rose-900 bg-rose-100/80 p-2.5 rounded-xl border border-rose-200/80 space-y-1">
                    <strong className="block font-bold">💡 Langkah Penyelesaian Cepat:</strong>
                    {errorType === 'CAMERA_DENIED' && (
                      <ol className="list-decimal list-inside space-y-0.5 text-rose-800 text-[10px]">
                        <li>Klik ikon gembok 🔒 atau kamera 📷 di samping URL peramban.</li>
                        <li>Ubah izin "Kamera" menjadi <strong>Izinkan (Allow)</strong>.</li>
                        <li>Klik tombol <strong>Coba Lagi</strong> di bawah.</li>
                      </ol>
                    )}
                    {errorType === 'CAMERA_NOT_FOUND' && (
                      <p className="text-[10px] text-rose-800">
                        Pastikan webcam tersambung dengan baik, atau gunakan fitur <strong>Unggah Foto QR</strong> atau <strong>Pencarian Manual</strong> di bawah.
                      </p>
                    )}
                    {errorType === 'NO_QR_IN_IMAGE' && (
                      <p className="text-[10px] text-rose-800">
                        Coba ambil foto ulang dengan posisi tegak, jarak lebih dekat, dan pastikan tidak buram atau silau lampu.
                      </p>
                    )}
                    {errorType === 'NOT_FOUND_IN_DB' && (
                      <p className="text-[10px] text-rose-800">
                        Periksa kembali kode tugas atau nama aset yang dimasukkan, atau pilih dari daftar Tugas / Aset di bawah.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actionable Retry & Alternate Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-rose-200 justify-end flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setErrorType(null);
                    setErrorMsg('');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                >
                  Tutup Peringatan
                </button>
                {errorType === 'CAMERA_DENIED' || errorType === 'CAMERA_NOT_FOUND' ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <RefreshCw size={13} /> Coba Akses Kamera Lagi
                  </button>
                ) : errorType === 'NO_QR_IN_IMAGE' ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Upload size={13} /> Unggah Ulang Foto
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorType(null);
                      setErrorMsg('');
                      setManualCode('');
                    }}
                    className="px-4 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <RotateCcw size={13} /> Coba Scan Ulang
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SCANNER VIEWFINDER / CAMERA PREVIEW WITH RETICLE & SUCCESS ANIMATION OVERLAY */}
          <div className="relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner border-2 border-slate-800">
            {isCameraActive ? (
              <div className="relative w-full h-full">
                <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />

                {/* Reticle Overlay */}
                {!successInfo && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/80 rounded-2xl relative shadow-lg shadow-emerald-500/20">
                      {/* Scanning laser line effect */}
                      <div className="absolute left-1 right-1 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-bounce" />

                      {/* Corners */}
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-300 -mt-1 -ml-1 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-300 -mt-1 -mr-1 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-300 -mb-1 -ml-1 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-300 -mb-1 -mr-1 rounded-br-lg" />

                      <div className="absolute -bottom-7 left-0 right-0 text-center">
                        <span className="text-[10px] font-bold text-emerald-300 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          Posisikan QR di dalam kotak
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400">
                  <QrCode size={36} className="opacity-70" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">Kamera Saat Ini Non-Aktif</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Klik tombol di bawah untuk menyalakan kamera atau unggah berkas foto QR
                  </p>
                </div>
              </div>
            )}

            {/* VISUAL SUCCESS ANIMATION OVERLAY (GREEN CHECKMARK PULSE) */}
            <AnimatePresence>
              {successInfo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, type: 'spring', damping: 15 }}
                  className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center z-20 space-y-3"
                >
                  {/* Glowing Animated Pulse Check Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="relative"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 animate-ping absolute inset-0" />
                    <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50 relative border-2 border-emerald-200">
                      <Check size={44} strokeWidth={3.5} />
                    </div>
                  </motion.div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-900/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40 inline-flex items-center gap-1">
                      <Sparkles size={11} /> Scan Berhasil Terbaca!
                    </span>
                    <h3 className="text-base font-black text-white leading-tight">
                      {successInfo.title}
                    </h3>
                    <p className="text-xs text-emerald-200/90">{successInfo.subtitle}</p>
                  </div>

                  <div className="text-[11px] text-emerald-300/80 flex items-center gap-1">
                    <RefreshCw size={12} className="animate-spin" /> Membuka rincian data...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processing Indicator */}
            {isProcessing && !successInfo && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10 space-y-2">
                <RefreshCw size={24} className="animate-spin text-emerald-400" />
                <span className="text-xs font-bold">Membaca data QR...</span>
              </div>
            )}
          </div>

          {/* Camera Controls & File Upload */}
          <div className="flex gap-2">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer min-h-[42px]"
              >
                <Camera size={16} className="text-emerald-300" />
                <span>Nyalakan Kamera Scanner</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer min-h-[42px]"
              >
                <span>Matikan Kamera</span>
              </button>
            )}

            <label className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition border border-slate-200 shrink-0 min-h-[42px]">
              <Upload size={15} className="text-slate-600" />
              <span>Unggah Foto</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* RECENT SCANS LIST (LAST 3-5 ITEMS WITH ONE-CLICK RE-ACCESS) */}
          {recentScans.length > 0 && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                  <History size={13} className="text-emerald-700" />
                  Riwayat Scan Terakhir ({recentScans.length})
                </span>
                <button
                  type="button"
                  onClick={clearRecentScans}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
                  title="Hapus riwayat pemindaian lokal"
                >
                  <Trash2 size={11} /> Bersihkan
                </button>
              </div>

              {/* Scrollable list of recent items */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                {recentScans.map((item) => (
                  <button
                    key={`${item.id}-${item.timestamp}`}
                    type="button"
                    onClick={() => handleRecentScanClick(item)}
                    className="w-full p-2 rounded-xl bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition flex items-center justify-between gap-2 shadow-2xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          item.type === 'ASSIGNMENT'
                            ? 'bg-blue-100 text-blue-800'
                            : item.type === 'STUDENT'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.type === 'ASSIGNMENT' ? (
                          <BookOpen size={13} />
                        ) : item.type === 'STUDENT' ? (
                          <User size={13} />
                        ) : (
                          <Package size={13} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-900">
                          {item.title}
                        </h5>
                        <p className="text-[10px] text-slate-500 truncate">{item.subtitle || item.code}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-emerald-700 font-bold opacity-80 group-hover:opacity-100">
                      <span>Buka</span>
                      <ArrowRight size={12} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Input Search Fallback */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Atau Masukkan Kode Register / ID Tugas Manual:
            </span>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Contoh: AST-2026-0001 / ASG-001 / Nama Siswa"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 font-medium focus:outline-emerald-700 bg-slate-50 min-h-[38px]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl transition shrink-0 shadow-2xs min-h-[38px] cursor-pointer"
              >
                Cari
              </button>
            </form>
          </div>

          {/* Quick Select from Registered Assignments & Assets */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sampel Tugas & Aset Siap Scan:
              </span>
            </div>

            {/* Assignments Quick Pills */}
            {assignments.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-blue-700 font-bold block">Tugas Pembelajaran:</span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {assignments.slice(0, 4).map((asg) => (
                    <button
                      key={asg.ID}
                      type="button"
                      onClick={() => resolveScannedText(asg.ID)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 text-[11px] font-bold text-blue-800 transition flex items-center gap-1 cursor-pointer truncate max-w-[200px]"
                    >
                      <BookOpen size={11} className="text-blue-600 shrink-0" />
                      <span className="truncate">{asg.JUDUL}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Assets Quick Pills */}
            {assets.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold block">Aset & Inventaris:</span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {assets.slice(0, 4).map((a) => (
                    <button
                      key={a.ID}
                      type="button"
                      onClick={() => resolveScannedText(a.KODE_ASET)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 border border-slate-200 text-[11px] font-mono font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Package size={11} className="text-emerald-700 shrink-0" />
                      <span>{a.KODE_ASET}</span>
                      <span className="text-slate-400 font-sans truncate max-w-[100px]">({a.NAMA_BARANG})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1 font-medium">
            <Sparkles size={13} className="text-emerald-600" /> Mendukung QR Tugas, Siswa, & Aset
          </span>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
