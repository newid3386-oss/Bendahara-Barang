import React, { useState, useEffect } from 'react';
import {
  Search,
  FileSpreadsheet,
  Bell,
  Check,
  ChevronDown,
  UserCheck,
  Menu,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { User, ActivePage } from '../types';

interface NavbarProps {
  onOpenSearch?: () => void;
  onOpenSheetsModal?: () => void;
  onOpenGoogleSync?: () => void;
  onOpenAIAssistant?: () => void;
  onOpenQRScanner?: () => void;
  onNavigate?: (page: ActivePage) => void;
  onToggleSidebarMobile?: () => void;
  onToggleSidebar?: () => void;
  notificationCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenSheetsModal,
  onOpenGoogleSync,
  onOpenAIAssistant,
  onOpenQRScanner,
  onNavigate,
  onToggleSidebarMobile,
  onToggleSidebar,
  notificationCount,
}) => {
  const config = db.getConfig();
  const activeUser = db.getActiveUser();
  const users = db.getUsers();
  const notifications = db.getNotifications().filter((n) => n.STATUS === 'UNREAD');

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [ticker, setTicker] = useState(0);

  // Periodic ticker and event listener to recalculate relative sync time immediately
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 15000);

    const handleSyncCompleted = () => {
      setTicker((prev) => prev + 1);
    };
    window.addEventListener('bendahara-sync-completed', handleSyncCompleted);

    return () => {
      clearInterval(interval);
      window.removeEventListener('bendahara-sync-completed', handleSyncCompleted);
    };
  }, []);

  const connectedSheetId = db.getConnectedGoogleSheetId();
  const appsScriptUrl = db.getAppsScriptUrl();
  const lastSyncTime = db.getLastSyncTime();
  const isConnected = Boolean(connectedSheetId || appsScriptUrl);

  const getSyncStatusIndicator = () => {
    if (!isConnected) {
      return {
        badgeStyle: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
        dotStyle: 'bg-slate-400',
        iconStyle: 'text-slate-500',
        label: 'Hubungkan Sheets',
        shortLabel: 'Sheets Offline',
        tooltip: 'Belum terhubung ke Google Sheets atau Apps Script. Klik untuk menghubungkan.',
      };
    }

    if (!lastSyncTime) {
      return {
        badgeStyle: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs',
        dotStyle: 'bg-amber-500 animate-pulse',
        iconStyle: 'text-amber-700',
        label: 'Sheets: Siap Sinkron',
        shortLabel: 'Siap Sinkron',
        tooltip: 'Google Sheets terhubung, tetapi data lokal belum pernah disinkronkan. Klik untuk sinkronisasi.',
      };
    }

    const diffMs = Math.max(0, Date.now() - new Date(lastSyncTime).getTime());
    const exactFormatted = new Date(lastSyncTime).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Under 10 minutes: Emerald Green with pulse
    if (diffMs < 10 * 60 * 1000) {
      return {
        badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs',
        dotStyle: 'bg-emerald-500 animate-pulse',
        iconStyle: 'text-emerald-700',
        label: 'Sinkron: Baru Saja',
        shortLabel: 'Sinkron Aktif',
        tooltip: `Tersinkronisasi aktif (Pukul ${exactFormatted}). Klik untuk kelola sinkronisasi.`,
      };
    }

    // Between 10 and 60 minutes: Fresh Green
    if (diffMs < 60 * 60 * 1000) {
      const minutes = Math.floor(diffMs / 60000);
      return {
        badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs',
        dotStyle: 'bg-emerald-500',
        iconStyle: 'text-emerald-700',
        label: `Sinkron: ${minutes}m lalu`,
        shortLabel: `${minutes}m lalu`,
        tooltip: `Tersinkronisasi ${minutes} menit yang lalu (Pukul ${exactFormatted}).`,
      };
    }

    // Between 1 hour and 24 hours: Sky Blue
    if (diffMs < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diffMs / 3600000);
      return {
        badgeStyle: 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100 shadow-2xs',
        dotStyle: 'bg-sky-500',
        iconStyle: 'text-sky-700',
        label: `Sinkron: ${hours}j lalu`,
        shortLabel: `${hours}j lalu`,
        tooltip: `Tersinkronisasi hari ini (Pukul ${exactFormatted}). Klik untuk memperbarui data.`,
      };
    }

    // Older than 24 hours: Warning Amber
    const days = Math.floor(diffMs / (24 * 3600000));
    return {
      badgeStyle: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs',
      dotStyle: 'bg-amber-500',
      iconStyle: 'text-amber-700',
      label: `Sinkron: ${days}h lalu`,
      shortLabel: `${days}h lalu`,
      tooltip: `Sinkronisasi terakhir ${days} hari yang lalu (${new Date(lastSyncTime).toLocaleDateString('id-ID')}). Disarankan untuk sinkronisasi ulang.`,
    };
  };

  const syncStatus = getSyncStatusIndicator();

  const handleToggleMenu = () => {
    if (typeof onToggleSidebarMobile === 'function') {
      onToggleSidebarMobile();
    } else if (typeof onToggleSidebar === 'function') {
      onToggleSidebar();
    }
  };

  const handleOpenSheets = () => {
    if (typeof onOpenSheetsModal === 'function') {
      onOpenSheetsModal();
    } else if (typeof onOpenGoogleSync === 'function') {
      onOpenGoogleSync();
    }
  };

  const handleSwitchUser = (user: User) => {
    db.setActiveUser(user);
    setShowUserMenu(false);
    window.location.reload();
  };

  const handleMarkNotifRead = (id: string, module?: string) => {
    db.markNotificationRead(id);
    if (module && module !== 'GENERAL' && typeof onNavigate === 'function') {
      onNavigate(module as ActivePage);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      {/* Left: Mobile trigger & School Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggleMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Buka Menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Bendahara Barang V8.1.6
            </span>
            <span className="hidden sm:inline-block text-[11px] text-slate-400">•</span>
            <span className="hidden sm:inline-block text-xs font-bold text-slate-700 truncate max-w-[280px]">
              {config.SCHOOL_NAME}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate max-w-[240px] sm:max-w-md">
            {config.ADDRESS}
          </p>
        </div>
      </div>

      {/* Center/Right: Universal Search Shortcut, Google Sheet Sync Chip, Notif, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Shortcut Bar */}
        <button
          type="button"
          onClick={() => onOpenSearch && onOpenSearch()}
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 text-xs font-medium transition-all border border-slate-200 shadow-2xs group"
        >
          <Search size={14} className="text-slate-400 group-hover:text-emerald-700" />
          <span>Cari cepat...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono border border-slate-200 text-slate-500 shadow-2xs">
            /
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => onOpenSearch && onOpenSearch()}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          title="Pencarian Universal"
        >
          <Search size={18} />
        </button>

        {/* In-App QR Scanner Button */}
        <button
          type="button"
          onClick={() => onOpenQRScanner && onOpenQRScanner()}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
          title="Scan QR / Barcode Aset & Berkas"
        >
          <QrCode size={15} className="text-emerald-700" />
          <span className="hidden sm:inline">Scan QR</span>
        </button>

        {/* Gemini AI Assistant Button */}
        <button
          type="button"
          onClick={() => onOpenAIAssistant && onOpenAIAssistant()}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all bg-linear-to-r from-emerald-800 via-emerald-700 to-teal-800 hover:opacity-95 text-white shadow-xs border border-emerald-600"
          title="Buka Asisten AI Gemini Pengelola Barang"
        >
          <Sparkles size={15} className="text-emerald-300" />
          <span className="hidden sm:inline">Asisten AI</span>
        </button>

        {/* Dynamic Google Sheets Connection Status Indicator */}
        <button
          type="button"
          onClick={handleOpenSheets}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${syncStatus.badgeStyle}`}
          title={syncStatus.tooltip}
        >
          <FileSpreadsheet size={15} className={syncStatus.iconStyle} />
          <span className="hidden md:inline font-semibold">
            {syncStatus.label}
          </span>
          <span className="hidden sm:inline md:hidden font-semibold">
            {syncStatus.shortLabel}
          </span>
          <span className={`w-2 h-2 rounded-full ${syncStatus.dotStyle}`}></span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            title="Notifikasi"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Notifikasi</span>
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      db.markAllNotificationsRead();
                      setShowNotifMenu(false);
                    }}
                    className="text-[11px] text-emerald-700 font-semibold hover:underline"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-50">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.ID}
                      onClick={() => handleMarkNotifRead(notif.ID, notif.MODULE)}
                      className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="text-xs font-bold text-slate-800">{notif.TITLE}</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{notif.MESSAGE}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Tidak ada notifikasi baru.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-xs font-black">
              {activeUser.NAMA.charAt(0)}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                {activeUser.NAMA}
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-none">
                {activeUser.ROLE}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Ganti Peran / Pengguna
                </span>
              </div>
              <div className="py-1 space-y-1">
                {users.map((u) => (
                  <button
                    key={u.ID}
                    type="button"
                    onClick={() => handleSwitchUser(u)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                      u.ID === activeUser.ID
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div>{u.NAMA}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {u.ROLE} • {u.NIP || 'No NIP'}
                      </div>
                    </div>
                    {u.ID === activeUser.ID && <Check size={14} className="text-emerald-700" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
