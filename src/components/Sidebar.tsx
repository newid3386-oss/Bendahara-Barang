import React from 'react';
import {
  LayoutDashboard,
  Package,
  Store,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Layers,
  BookOpen,
  QrCode,
  Box,
  RotateCw,
  Wrench,
  ShoppingCart,
  FileCheck,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Settings,
  X,
  Building2,
  TrendingDown,
  Network,
  Sparkles,
  Printer,
  School,
} from 'lucide-react';
import { ActivePage } from '../types';
import { db } from '../services/localStorageService';

interface SidebarProps {
  activePage: ActivePage | string;
  onNavigate: (page: ActivePage | string) => void;
  onOpenSchoolWebsite?: () => void;
  isOpen?: boolean;
  isMobileOpen?: boolean;
  onClose?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  onOpenSchoolWebsite,
  isOpen,
  isMobileOpen,
  onClose,
  onCloseMobile,
}) => {
  const isMenuOpen = isMobileOpen ?? isOpen ?? false;

  const handleClose = () => {
    if (typeof onCloseMobile === 'function') {
      onCloseMobile();
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };
  const pendingApprovalsCount = db
    .getBarangKeluar()
    .filter((b) => b.STATUS_TRANSAKSI === 'MENUNGGU_PERSETUJUAN').length;

  const lowStockCount = db
    .getStockSummary()
    .filter((s) => s.STATUS === 'MINIMUM').length;

  const navGroups = [
    {
      title: 'UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
        { id: 'website_sekolah', label: 'Website Sekolah SDN 6', icon: School },
      ],
    },
    {
      title: 'PERSEDIAAN & GUDANG',
      items: [
        { id: 'master', label: 'Master Barang', icon: Package },
        { id: 'supplier', label: 'Penyedia / Toko', icon: Store },
        { id: 'barang_masuk', label: 'Barang Masuk (OCR AI)', icon: ArrowDownLeft },
        {
          id: 'barang_keluar',
          label: 'Barang Keluar',
          icon: ArrowUpRight,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'persediaan',
          label: 'Persediaan / Stok',
          icon: Layers,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        { id: 'stock_ledger', label: 'Kartu Stok', icon: BookOpen },
        { id: 'pengambilan_atk', label: 'Pengambilan ATK', icon: ClipboardList },
        { id: 'stock_opname', label: 'Stock Opname & Scan', icon: QrCode },
        { id: 'procurement_planner', label: 'Prediksi Pengadaan AI', icon: Sparkles },
      ],
    },
    {
      title: 'INTEGRASI KEMDIKBUD (FASE 2)',
      items: [
        { id: 'arkas_siplah', label: 'Integrasi ARKAS & SIPLah', icon: Building2 },
      ],
    },
    {
      title: 'ASET & INVENTARIS (FASE 3)',
      items: [
        { id: 'aset', label: 'Aset / Inventaris (Thermal)', icon: Box },
        { id: 'depresiasi_aset', label: 'Penyusutan Aset (SAP)', icon: TrendingDown },
        { id: 'asset_lifecycle', label: 'Lifecycle & Riwayat', icon: RotateCw },
        { id: 'mutasi', label: 'Mutasi Aset', icon: ArrowUpRight },
        { id: 'pemeliharaan', label: 'Pemeliharaan & Hapus', icon: Wrench },
      ],
    },
    {
      title: 'DOKUMEN & LAPORAN',
      items: [
        { id: 'document_center', label: 'Berita Acara (BA)', icon: FileCheck },
        { id: 'laporan', label: 'Laporan & Rekap', icon: FileText },
      ],
    },
    {
      title: 'TATA KELOLA & DINAS (FASE 3)',
      items: [
        { id: 'pegawai', label: 'Daftar Pegawai & Guru (NIP)', icon: ShieldCheck },
        { id: 'multi_school', label: 'Konsolidasi Multi-Sekolah', icon: Network },
        { id: 'google_sheets_sync', label: 'Google Sheets & Drive', icon: FileSpreadsheet },
        { id: 'audit', label: 'Audit Trail & Kontrol', icon: ShieldCheck },
        { id: 'config', label: 'Pengaturan Sekolah', icon: Settings },
      ],
    },
  ];

  const handleItemClick = (pageId: string) => {
    onNavigate(pageId as any);
    handleClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-md">
              BB
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white tracking-tight">Bendahara Barang</h2>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wide">
                OTOMASI GOOGLE SHEETS
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[9px] font-extrabold text-emerald-400/80 tracking-wider">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-sm font-bold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon size={16} className={isActive ? 'text-emerald-300' : 'text-slate-400'} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                          item.badgeColor || 'bg-slate-700 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 text-center flex items-center justify-between">
          <span>Enterprise v8.2</span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Fase 1-3 Siap
          </span>
        </div>
      </aside>
    </>
  );
};
