import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  QrCode,
  User,
  GraduationCap,
  ClipboardCheck,
  Package,
  Clock,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Eye,
  Sparkles,
  ArrowUpDown,
  Laptop
} from 'lucide-react';
import { RecentScanItem } from '../QRScannerModal';
import { playFeedback } from '../../utils/feedback';

export interface RecentScansProps {
  className?: string;
  maxItems?: number; // Default: 10
  scans?: RecentScanItem[];
  onSelectScan?: (item: RecentScanItem) => void;
  onClearScans?: () => void;
  onOpenScanner?: () => void;
  showTitle?: boolean;
  compact?: boolean;
}

const STORAGE_KEY = 'sdn6_qr_recent_scans_v1';

// Sample fallback scans representing the last 10 Classroom app activities
const SAMPLE_CLASSROOM_SCANS: RecentScanItem[] = [
  {
    id: 'scan-sample-1',
    code: 'STD-4B-014',
    title: 'Ahmad Fauzi (Presensi Masuk)',
    subtitle: 'Kelas 4B • Presensi Kehadiran QR Pagi',
    type: 'STUDENT',
    timestamp: Date.now() - 1000 * 60 * 3, // 3 mins ago
    rawPayload: '{"type":"STUDENT","id":"acc-stu-014","name":"Ahmad Fauzi","class":"Kelas 4B","nis":"202604014"}',
  },
  {
    id: 'scan-sample-2',
    code: 'TASK-MTK-4B-03',
    title: 'Tugas Matematika: Pecahan Senilai',
    subtitle: 'Siti Nurhaliza • Dikumpulkan via QR Siswa',
    type: 'ASSIGNMENT',
    timestamp: Date.now() - 1000 * 60 * 12, // 12 mins ago
    rawPayload: '{"type":"ASSIGNMENT","code":"TASK-MTK-4B-03","title":"Tugas Matematika: Pecahan Senilai","student":"Siti Nurhaliza"}',
  },
  {
    id: 'scan-sample-3',
    code: 'AST-TIK-004',
    title: 'Chromebook Acer C733 Lab TIK #04',
    subtitle: 'Verifikasi Sarpras • Kondisi Baik',
    type: 'ASSET',
    timestamp: Date.now() - 1000 * 60 * 25, // 25 mins ago
    rawPayload: '{"type":"ASSET","id":"AST-TIK-004","name":"Chromebook Acer C733 #04","location":"Lab Komputer TIK"}',
  },
  {
    id: 'scan-sample-4',
    code: 'STD-5A-008',
    title: 'Budi Santoso (Presensi Masuk)',
    subtitle: 'Kelas 5A • Presensi Siswa Tepat Waktu',
    type: 'STUDENT',
    timestamp: Date.now() - 1000 * 60 * 42, // 42 mins ago
    rawPayload: '{"type":"STUDENT","id":"acc-stu-008","name":"Budi Santoso","class":"Kelas 5A","nis":"202605008"}',
  },
  {
    id: 'scan-sample-5',
    code: 'TASK-IPAS-5A-01',
    title: 'Portofolio IPAS: Siklus Rantai Makanan',
    subtitle: 'Kelompok 2 P5 • Gelar Karya Kelas 5A',
    type: 'ASSIGNMENT',
    timestamp: Date.now() - 1000 * 60 * 68, // ~1 hour ago
    rawPayload: '{"type":"ASSIGNMENT","code":"TASK-IPAS-5A-01","title":"Portofolio IPAS: Siklus Rantai Makanan"}',
  },
  {
    id: 'scan-sample-6',
    code: 'STD-4B-022',
    title: 'Dewi Anggraini (Presensi Masuk)',
    subtitle: 'Kelas 4B • Presensi Siswa Tepat Waktu',
    type: 'STUDENT',
    timestamp: Date.now() - 1000 * 60 * 95, // ~1.5 hours ago
    rawPayload: '{"type":"STUDENT","id":"acc-stu-022","name":"Dewi Anggraini","class":"Kelas 4B","nis":"202604022"}',
  },
  {
    id: 'scan-sample-7',
    code: 'AST-KLS-4B-PRJ',
    title: 'Proyektor Epson EB-X500 Ruang 4B',
    subtitle: 'Cek Inventaris Kelas • Terhubung HDMI',
    type: 'ASSET',
    timestamp: Date.now() - 1000 * 60 * 140, // ~2.3 hours ago
    rawPayload: '{"type":"ASSET","id":"AST-KLS-4B-PRJ","name":"Proyektor Epson EB-X500 Ruang 4B"}',
  },
  {
    id: 'scan-sample-8',
    code: 'TASK-BIND-4B-02',
    title: 'Tugas Bahasa Indonesia: Menulis Puisi',
    subtitle: 'Rian Hidayat • Lembar Kerja Portofolio',
    type: 'ASSIGNMENT',
    timestamp: Date.now() - 1000 * 60 * 180, // ~3 hours ago
    rawPayload: '{"type":"ASSIGNMENT","code":"TASK-BIND-4B-02","title":"Tugas Menulis Puisi"}',
  },
  {
    id: 'scan-sample-9',
    code: 'STD-4B-005',
    title: 'Citra Kirana (Presensi Masuk)',
    subtitle: 'Kelas 4B • Presensi Siswa Tepat Waktu',
    type: 'STUDENT',
    timestamp: Date.now() - 1000 * 60 * 220, // ~3.6 hours ago
    rawPayload: '{"type":"STUDENT","id":"acc-stu-005","name":"Citra Kirana","class":"Kelas 4B","nis":"202604005"}',
  },
  {
    id: 'scan-sample-10',
    code: 'LBR-P5-REFL-04',
    title: 'Lembar Refleksi Diri P5 Gaya Hidup',
    subtitle: 'Dokumen Refleksi Siswa • Kurikulum Merdeka',
    type: 'OTHER',
    timestamp: Date.now() - 1000 * 60 * 260, // ~4.3 hours ago
    rawPayload: '{"type":"OTHER","code":"LBR-P5-REFL-04","title":"Lembar Refleksi Diri P5"}',
  },
];

export const RecentScans: React.FC<RecentScansProps> = ({
  className = '',
  maxItems = 10,
  scans: externalScans,
  onSelectScan,
  onClearScans,
  onOpenScanner,
  showTitle = true,
  compact = false,
}) => {
  const [internalScans, setInternalScans] = useState<RecentScanItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'STUDENT' | 'ASSIGNMENT' | 'ASSET' | 'OTHER'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load scans from localStorage or fallback
  const loadScansFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInternalScans(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('RecentScans: error reading storage', e);
    }
    // Default fallback so component is never empty
    setInternalScans(SAMPLE_CLASSROOM_SCANS);
  }, []);

  useEffect(() => {
    if (externalScans && externalScans.length > 0) {
      setInternalScans(externalScans);
    } else {
      loadScansFromStorage();
    }
  }, [externalScans, loadScansFromStorage]);

  // Listen to cross-window or app-wide scan events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadScansFromStorage();
      }
    };
    const handleCustomScanEvent = () => {
      loadScansFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('qr_scan_success', handleCustomScanEvent);
    window.addEventListener('recent_scans_updated', handleCustomScanEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('qr_scan_success', handleCustomScanEvent);
      window.removeEventListener('recent_scans_updated', handleCustomScanEvent);
    };
  }, [loadScansFromStorage]);

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    playFeedback('click');
    loadScansFromStorage();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Clear scans handler
  const handleClear = () => {
    if (window.confirm('Hapus seluruh riwayat pindaian QR Classroom terbaru?')) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      setInternalScans([]);
      onClearScans?.();
      playFeedback('warning');
    }
  };

  // Copy scan code handler
  const handleCopyCode = (e: React.MouseEvent, id: string, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    playFeedback('click');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format relative timestamp
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 45) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    if (diffHour < 24) return `${diffHour} jam lalu`;
    if (diffDay === 1) return 'Kemarin';
    return `${diffDay} hari lalu`;
  };

  // Format full date time
  const formatFullDateTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';
  };

  // Limit to most recent 10 scans per user request
  const recent10Scans = useMemo(() => {
    const sourceList = externalScans && externalScans.length > 0 ? externalScans : internalScans;
    return sourceList.slice(0, maxItems);
  }, [externalScans, internalScans, maxItems]);

  // Filter based on search query and type filter
  const filteredScans = useMemo(() => {
    return recent10Scans.filter((s) => {
      const matchType = selectedTypeFilter === 'ALL' || s.type === selectedTypeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.subtitle && s.subtitle.toLowerCase().includes(q)) ||
        s.type.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [recent10Scans, selectedTypeFilter, searchQuery]);

  // Scan type metadata styling and icons
  const getTypeMeta = (type: string) => {
    switch (type) {
      case 'STUDENT':
        return {
          label: 'Siswa / Presensi',
          shortLabel: 'Siswa',
          icon: <User size={13} className="text-emerald-700 shrink-0" />,
          accentColor: 'text-emerald-700',
          dotColor: 'bg-emerald-500',
        };
      case 'ASSIGNMENT':
        return {
          label: 'Tugas / Portofolio',
          shortLabel: 'Tugas',
          icon: <ClipboardCheck size={13} className="text-indigo-700 shrink-0" />,
          accentColor: 'text-indigo-700',
          dotColor: 'bg-indigo-500',
        };
      case 'ASSET':
        return {
          label: 'Sarpras / Aset Fisik',
          shortLabel: 'Aset',
          icon: <Laptop size={13} className="text-sky-700 shrink-0" />,
          accentColor: 'text-sky-700',
          dotColor: 'bg-sky-500',
        };
      default:
        return {
          label: 'Umum / Administrasi',
          shortLabel: 'Umum',
          icon: <QrCode size={13} className="text-slate-600 shrink-0" />,
          accentColor: 'text-slate-600',
          dotColor: 'bg-slate-400',
        };
    }
  };

  return (
    <div
      id="recent-scans-container"
      className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4 ${className}`}
    >
      {/* ─── Header Section ───────────────────────────────────── */}
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 shadow-2xs">
              <QrCode size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  Riwayat 10 Pindaian QR Terkini (Recent Scans)
                </h3>
                <span className="text-[11px] font-bold text-slate-500">
                  {filteredScans.length} dari {recent10Scans.length} item
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Daftar aktivitas pemindaian presensi siswa, tugas, dan inventaris kelas terbaru secara real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            {onOpenScanner && (
              <button
                type="button"
                onClick={onOpenScanner}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Buka Kamera Scanner QR"
              >
                <QrCode size={13} />
                <span>Pindai QR</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              title="Perbarui Riwayat Pindaian"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
            </button>

            {recent10Scans.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                title="Hapus Riwayat Pindaian"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Search & Type Filter Tabs ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Interactive Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl overflow-x-auto max-w-full">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'STUDENT', label: 'Siswa' },
            { id: 'ASSIGNMENT', label: 'Tugas' },
            { id: 'ASSET', label: 'Aset' },
            { id: 'OTHER', label: 'Umum' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedTypeFilter(tab.id as any);
                playFeedback('click');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer ${
                selectedTypeFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, kode QR, atau tipe..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-indigo-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* ─── Scrollable List of 10 Recent Scans ─────────────────── */}
      <div
        id="recent-scans-scrollable-list"
        className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 pr-1 rounded-2xl border border-slate-100 bg-slate-50/30"
      >
        {filteredScans.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <QrCode size={22} />
            </div>
            <p className="text-xs font-bold text-slate-700">Tidak ada riwayat pindaian yang cocok</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              {searchQuery ? `Tidak ditemukan pindaian untuk "${searchQuery}".` : 'Lakukan pemindaian QR di kelas untuk merekam presensi atau tugas siswa.'}
            </p>
          </div>
        ) : (
          filteredScans.map((item, index) => {
            const meta = getTypeMeta(item.type);
            const isCopied = copiedId === item.id;
            const fullTimeStr = formatFullDateTime(item.timestamp);
            const relativeTimeStr = formatTimeAgo(item.timestamp);

            return (
              <div
                key={item.id || index}
                onClick={() => onSelectScan?.(item)}
                className={`p-3 sm:p-3.5 flex items-start sm:items-center justify-between gap-3 hover:bg-white transition-all group ${
                  onSelectScan ? 'cursor-pointer' : ''
                }`}
              >
                {/* Left section: Number + Type Icon + Content */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  {/* Order Index */}
                  <span className="text-[10px] font-mono font-bold text-slate-400 w-4 text-center shrink-0 mt-1 sm:mt-0">
                    {index + 1}
                  </span>

                  {/* Type Icon Container */}
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 group-hover:border-indigo-300 transition-colors">
                    {meta.icon}
                  </div>

                  {/* Main Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {item.title}
                      </span>
                    </div>

                    {/* Metadata line per zero-pill discipline */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                      {/* Scan Type indicator */}
                      <span className={`font-bold flex items-center gap-1 ${meta.accentColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`} />
                        {meta.label}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>

                      {/* Code Monospace */}
                      <code className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-semibold">
                        {item.code}
                      </code>
                      <span aria-hidden="true" className="text-slate-300">·</span>

                      {/* Timestamp */}
                      <span
                        className="flex items-center gap-1 text-slate-500 font-medium cursor-help"
                        title={fullTimeStr}
                      >
                        <Clock size={11} className="text-slate-400" />
                        {relativeTimeStr}
                      </span>

                      {item.subtitle && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="text-slate-400 truncate max-w-xs">{item.subtitle}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right section: Exact Timestamp & Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {/* Copy QR Code Button */}
                  <button
                    type="button"
                    onClick={(e) => handleCopyCode(e, item.id, item.code)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                    title={`Salin kode "${item.code}"`}
                  >
                    {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>

                  {/* View Details / Action Arrow */}
                  {onSelectScan && (
                    <button
                      type="button"
                      onClick={() => onSelectScan(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                      title="Periksa Detail Pindaian"
                    >
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Footer Stats / Info Note ──────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
        <span>Menampilkan <strong>{Math.min(10, recent10Scans.length)} pindaian terakhir</strong> di Classroom App</span>
        <span className="text-slate-400 font-mono text-[10px]">Penyimpanan Lokal Aktif (Auto-Sync)</span>
      </div>
    </div>
  );
};
