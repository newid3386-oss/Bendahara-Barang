import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  History,
  UserCheck,
  BookOpen,
  Package,
  QrCode,
  Clock,
  Volume2,
  Mic,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Zap,
  Edit3,
  ExternalLink,
  Scan,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  BarChart2,
  Calendar,
} from 'lucide-react';
import { RecentScanItem } from './QRScannerModal';
import { Account } from '../types/classroom';
import { accountService } from '../services/accountService';
import { playFeedback } from '../utils/feedback';

export type ScanSortOption = 'timestamp' | 'category' | 'frequency';

export interface LastScanInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastScan: RecentScanItem | null;
  scanHistory?: RecentScanItem[];
  savedVoiceNotes?: Record<string, string>;
  onOpenQuickVoiceNote?: (item: RecentScanItem) => void;
  onNavigateToAttendance?: () => void;
  onNavigateToAssignments?: (studentObj?: Account) => void;
  onQuickGrade?: (studentObj: Account) => void;
  onRescanMode?: (mode: 'STUDENT' | 'ASSIGNMENT' | 'ASSET' | 'ALL') => void;
  initialSortBy?: ScanSortOption;
  onSelectScanItem?: (item: RecentScanItem) => void;
}

export const LastScanInspectorModal: React.FC<LastScanInspectorModalProps> = ({
  isOpen,
  onClose,
  lastScan: initialLastScan,
  scanHistory = [],
  savedVoiceNotes = {},
  onOpenQuickVoiceNote,
  onNavigateToAttendance,
  onNavigateToAssignments,
  onQuickGrade,
  onRescanMode,
  initialSortBy = 'timestamp',
  onSelectScanItem,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [sortBy, setSortBy] = useState<ScanSortOption>(initialSortBy);
  const [selectedScan, setSelectedScan] = useState<RecentScanItem | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'INSPECT' | 'HISTORY'>('INSPECT');

  // Load all recent scans if scanHistory is empty
  const allScans: RecentScanItem[] = React.useMemo(() => {
    if (scanHistory && scanHistory.length > 0) return scanHistory;
    try {
      const raw = localStorage.getItem('sdn6_qr_recent_scans_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return initialLastScan ? [initialLastScan] : [];
  }, [scanHistory, initialLastScan]);

  // Frequency mapping for scan frequency sorting
  const frequencyMap = React.useMemo(() => {
    const map = new Map<string, number>();
    allScans.forEach((s) => {
      const key = s.code.toLowerCase();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [allScans]);

  // Sorted scan history based on active sortBy option
  const sortedScans = React.useMemo(() => {
    const list = [...allScans];
    if (sortBy === 'timestamp') {
      return list.sort((a, b) => b.timestamp - a.timestamp);
    }
    if (sortBy === 'category') {
      const categoryPriority: Record<string, number> = {
        STUDENT: 1,
        ASSIGNMENT: 2,
        ASSET: 3,
        OTHER: 4,
      };
      return list.sort((a, b) => {
        const pA = categoryPriority[a.type] || 5;
        const pB = categoryPriority[b.type] || 5;
        if (pA !== pB) return pA - pB;
        return b.timestamp - a.timestamp;
      });
    }
    if (sortBy === 'frequency') {
      return list.sort((a, b) => {
        const fA = frequencyMap.get(a.code.toLowerCase()) || 1;
        const fB = frequencyMap.get(b.code.toLowerCase()) || 1;
        if (fA !== fB) return fB - fA; // higher frequency first
        return b.timestamp - a.timestamp;
      });
    }
    return list;
  }, [allScans, sortBy, frequencyMap]);

  // Active scan item for inspection
  const activeScan = selectedScan || initialLastScan || sortedScans[0] || null;

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!activeScan?.code) return;
    try {
      navigator.clipboard.writeText(activeScan.code);
      setCopied(true);
      playFeedback('click');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handlePlayVoiceNote = () => {
    if (!activeScan?.code || !savedVoiceNotes[activeScan.code]) return;
    try {
      const audio = new Audio(savedVoiceNotes[activeScan.code]);
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play();
    } catch (err) {
      console.error('Error playing voice note:', err);
      setIsPlayingAudio(false);
    }
  };

  const typeConfig = (() => {
    if (!activeScan) {
      return {
        label: 'Tidak Ada Scan',
        badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
        iconBg: 'bg-slate-800 text-slate-400 border-slate-700',
        Icon: History,
      };
    }
    const t = activeScan.type;
    if (t === 'STUDENT') {
      return {
        label: 'Presensi Siswa',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        Icon: UserCheck,
      };
    }
    if (t === 'ASSIGNMENT') {
      return {
        label: 'Tugas / Soal CBT',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        Icon: BookOpen,
      };
    }
    if (t === 'ASSET') {
      return {
        label: 'Aset / Sarpras',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        Icon: Package,
      };
    }
    return {
      label: 'QR Code Umum',
      badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      Icon: QrCode,
    };
  })();

  const TypeIcon = typeConfig.Icon;

  const timeAgo = activeScan
    ? (() => {
        const diffSec = Math.floor((Date.now() - activeScan.timestamp) / 1000);
        if (diffSec < 60) return 'Baru saja';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit yang lalu`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam yang lalu`;
        return new Date(activeScan.timestamp).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      })()
    : '-';

  const studentObj = activeScan?.id ? accountService.getAccountById(activeScan.id) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col"
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <History size={17} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>Hasil Pindai & Riwayat QR</span>
                  <Sparkles size={13} className="text-amber-400" />
                </h3>
                <p className="text-[11px] text-slate-400">Inspeksi detail, urutkan riwayat, & aksi cepat</p>
              </div>
            </div>
            <button
              id="btn-close-last-scan-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Subheader Toolbar with 'Sort By' Dropdown & Tab Switcher */}
          <div className="px-5 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs">
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('INSPECT');
                  playFeedback('click');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'INSPECT'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Scan size={13} />
                <span>Inspeksi</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('HISTORY');
                  playFeedback('click');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'HISTORY'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <History size={13} />
                <span>Riwayat ({allScans.length})</span>
              </button>
            </div>

            {/* 'Sort By' Dropdown Menu */}
            <div className="relative">
              <button
                id="btn-scan-history-sort-dropdown"
                type="button"
                onClick={() => setShowSortDropdown((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Urutkan Riwayat Berdasarkan Waktu, Kategori, atau Frekuensi Pindai"
                aria-expanded={showSortDropdown}
              >
                <ArrowUpDown size={12} className="text-amber-400" />
                <span className="text-[11px] text-slate-400 hidden xs:inline">Urutkan:</span>
                <span className="text-[11px] font-extrabold text-amber-300">
                  {sortBy === 'timestamp' ? 'Terbaru (Waktu)' : sortBy === 'category' ? 'Kategori' : 'Frekuensi Scan'}
                </span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Sort Options Dropdown Menu */}
              {showSortDropdown && (
                <div
                  id="menu-scan-history-sort-options"
                  className="absolute right-0 mt-1.5 w-52 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5"
                >
                  <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center gap-1">
                    <SlidersHorizontal size={11} className="text-amber-400" />
                    <span>Pilihan Urutan Riwayat</span>
                  </div>

                  <button
                    id="sort-opt-timestamp"
                    type="button"
                    onClick={() => {
                      setSortBy('timestamp');
                      setShowSortDropdown(false);
                      playFeedback('click');
                    }}
                    className={`w-full px-2.5 py-2 rounded-lg text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      sortBy === 'timestamp'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-amber-400" />
                      <div>
                        <div>Waktu (Terbaru)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Berdasarkan timestamp pemindaian</div>
                      </div>
                    </div>
                    {sortBy === 'timestamp' && <Check size={14} className="text-amber-400" />}
                  </button>

                  <button
                    id="sort-opt-category"
                    type="button"
                    onClick={() => {
                      setSortBy('category');
                      setShowSortDropdown(false);
                      playFeedback('click');
                    }}
                    className={`w-full px-2.5 py-2 rounded-lg text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      sortBy === 'category'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers size={13} className="text-emerald-400" />
                      <div>
                        <div>Kategori (Grup Tipe)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Siswa → Tugas → Aset → Lainnya</div>
                      </div>
                    </div>
                    {sortBy === 'category' && <Check size={14} className="text-amber-400" />}
                  </button>

                  <button
                    id="sort-opt-frequency"
                    type="button"
                    onClick={() => {
                      setSortBy('frequency');
                      setShowSortDropdown(false);
                      playFeedback('click');
                    }}
                    className={`w-full px-2.5 py-2 rounded-lg text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      sortBy === 'frequency'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BarChart2 size={13} className="text-blue-400" />
                      <div>
                        <div>Frekuensi Scan (Terbanyak)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Kode yang paling sering dipindai</div>
                      </div>
                    </div>
                    {sortBy === 'frequency' && <Check size={14} className="text-amber-400" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {activeTab === 'HISTORY' ? (
              /* TAB 2: FULL SORTED SCAN HISTORY LIST */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Urutan aktif: <strong className="text-amber-300">{sortBy === 'timestamp' ? 'Timestamp' : sortBy === 'category' ? 'Kategori' : 'Frekuensi'}</strong></span>
                  <span>{sortedScans.length} item tersimpan</span>
                </div>

                {sortedScans.length > 0 ? (
                  <div className="space-y-1.5">
                    {sortedScans.map((item, index) => {
                      const isItemActive = activeScan?.id === item.id || activeScan?.code === item.code;
                      const freqCount = frequencyMap.get(item.code.toLowerCase()) || 1;
                      const formattedTime = new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div
                          key={`${item.id || item.code}-${index}`}
                          onClick={() => {
                            setSelectedScan(item);
                            setActiveTab('INSPECT');
                            onSelectScanItem?.(item);
                            playFeedback('click');
                          }}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 group ${
                            isItemActive
                              ? 'bg-amber-500/15 border-amber-400/80 shadow-md shadow-amber-500/10'
                              : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              item.type === 'STUDENT' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              item.type === 'ASSIGNMENT' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              item.type === 'ASSET' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                            }`}>
                              {item.type === 'STUDENT' ? <UserCheck size={16} /> :
                               item.type === 'ASSIGNMENT' ? <BookOpen size={16} /> :
                               item.type === 'ASSET' ? <Package size={16} /> : <QrCode size={16} />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                                  item.type === 'STUDENT' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                                  item.type === 'ASSIGNMENT' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                                  item.type === 'ASSET' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                  'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                }`}>
                                  {item.type === 'STUDENT' ? 'Siswa' : item.type === 'ASSIGNMENT' ? 'Tugas' : item.type === 'ASSET' ? 'Aset' : 'QR'}
                                </span>
                                <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                                  {item.title || item.code}
                                </h4>
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{item.code}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {sortBy === 'frequency' && (
                              <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[9px] font-mono font-bold" title={`Dipindai ${freqCount} kali`}>
                                {freqCount}x scan
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">{formattedTime}</span>
                            <ChevronRight size={13} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Belum ada item dalam riwayat pemindaian.
                  </div>
                )}
              </div>
            ) : activeScan ? (
              /* TAB 1: INSPECTION CARD */
              <>
                {/* Main Card */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${typeConfig.iconBg}`}>
                        <TypeIcon size={22} />
                      </div>
                      <div className="min-w-0">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${typeConfig.badgeClass}`}>
                          {typeConfig.label}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate mt-1">
                          {activeScan.title || activeScan.code}
                        </h4>
                        {activeScan.subtitle && (
                          <p className="text-xs text-slate-400 truncate">{activeScan.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Code, Frequency and Timestamp Info */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">Kode QR / ID</span>
                        <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400" title="Total frekuensi pemindaian kode ini">
                          Freq: {frequencyMap.get(activeScan.code.toLowerCase()) || 1}x
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5 gap-1">
                        <span className="font-mono font-bold text-emerald-400 truncate text-[11px]">
                          {activeScan.code}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer shrink-0"
                          title="Salin Kode"
                        >
                          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Waktu Pemindaian</span>
                      <div className="flex items-center gap-1 mt-0.5 text-slate-300 text-[11px] font-semibold">
                        <Clock size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{timeAgo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Voice Note Section */}
                  {savedVoiceNotes[activeScan.code] && (
                    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300">
                          <Volume2 size={14} />
                        </div>
                        <span className="text-[11px] text-purple-200 font-bold">Catatan Suara Terlampir</span>
                      </div>
                      <button
                        type="button"
                        onClick={handlePlayVoiceNote}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isPlayingAudio
                            ? 'bg-purple-500 text-white animate-pulse'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                        }`}
                      >
                        <Volume2 size={12} />
                        <span>{isPlayingAudio ? 'Memutar...' : 'Putar Audio'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Action Buttons */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Aksi Lanjutan Cepat
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeScan.type === 'STUDENT' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToAttendance?.();
                          }}
                          className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 font-bold text-xs transition flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <UserCheck size={15} className="text-emerald-400" />
                            <span>Presensi Siswa</span>
                          </div>
                          <ChevronRight size={14} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (studentObj) {
                              onQuickGrade?.(studentObj);
                            } else {
                              onNavigateToAssignments?.();
                            }
                          }}
                          className="p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 font-bold text-xs transition flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Edit3 size={15} className="text-blue-400" />
                            <span>Beri Nilai Cepat</span>
                          </div>
                          <ChevronRight size={14} className="text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </>
                    )}

                    {activeScan.type === 'ASSIGNMENT' && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToAssignments?.();
                        }}
                        className="col-span-full p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-between group cursor-pointer shadow-lg shadow-blue-900/40"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen size={15} />
                          <span>Buka Lembar Tugas & Penilaian</span>
                        </div>
                        <ExternalLink size={14} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenQuickVoiceNote?.(activeScan);
                      }}
                      className="p-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 font-bold text-xs transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Mic size={15} className="text-purple-400" />
                        <span>Catat Audio</span>
                      </div>
                      <ChevronRight size={14} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRescanMode?.(activeScan.type === 'OTHER' ? 'ALL' : activeScan.type);
                      }}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Scan size={15} className="text-amber-400" />
                        <span>Pindai Lagi</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center border border-slate-700">
                  <History size={26} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Belum Ada Riwayat Pemindaian</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Gunakan scanner QR untuk memindai kartu presensi siswa, lembar tugas, atau stiker inventaris aset.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRescanMode?.('ALL');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/50 inline-flex items-center gap-2 transition cursor-pointer"
                >
                  <Scan size={15} />
                  <span>Mulai Pindai Sekarang</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-800 flex justify-end bg-slate-950/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
