import React, { useMemo } from 'react';
import {
  Package,
  Box,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Building2,
  Zap,
  Coins,
  Wrench,
  Layers,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { ActivePage } from '../types';
import { Sparkline, AreaChart, DonutChart, BarChart, ProgressRing } from './charts';
import { AIInsightsPanel } from './AIInsightsPanel';

interface DashboardViewProps {
  onNavigate: (page: ActivePage) => void;
  onOpenSheetsModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenSheetsModal,
}) => {
  const items = db.getItems();
  const assets = db.getAssets();
  const masukList = db.getBarangMasuk();
  const keluarList = db.getBarangKeluar();
  const stockSummary = db.getStockSummary();
  const tasks = db.getTodayTasks();
  const connectedSheetId = db.getConnectedGoogleSheetId();
  const config = db.getConfig();

  // ─── Financial & Asset Calculations ───────────────────────
  const totalAssetValue = assets.reduce(
    (sum, a) => sum + (Number(a.TOTAL_NILAI) || Number(a.JUMLAH || 1) * Number(a.HARGA_SATUAN || 0)),
    0
  );
  const totalAssetUnits = assets.reduce((sum, a) => sum + (Number(a.JUMLAH) || 1), 0);
  const assetBaik = assets.filter((a) => a.KONDISI === 'BAIK');
  const assetRusakRingan = assets.filter((a) => a.KONDISI === 'RUSAK RINGAN');
  const assetRusakBerat = assets.filter((a) => a.KONDISI === 'RUSAK BERAT');
  const totalBarangRusak = assetRusakRingan.length + assetRusakBerat.length;
  const healthRate = assets.length > 0 ? Math.round((assetBaik.length / assets.length) * 100) : 100;

  // ─── Month-over-Month Trend ────────────────────────────────
  const now = new Date();
  const currentYM = now.toISOString().slice(0, 7);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevYM = prevMonthDate.toISOString().slice(0, 7);

  const masukBulanIniList = masukList.filter((m) => m.TANGGAL.startsWith(currentYM));
  const masukBulanIni = masukBulanIniList.reduce((sum, m) => sum + Number(m.JUMLAH || 0), 0);
  const totalNilaiMasukBulanIni = masukBulanIniList.reduce(
    (sum, m) => sum + (Number(m.TOTAL_PENGADAAN) || Number(m.JUMLAH || 0) * Number(m.HARGA_SATUAN || 0)),
    0
  );
  const masukBulanLaluList = masukList.filter((m) => m.TANGGAL.startsWith(prevYM));
  const masukBulanLalu = masukBulanLaluList.reduce((sum, m) => sum + Number(m.JUMLAH || 0), 0);
  const growthPercentage = masukBulanLalu > 0
    ? Math.round(((masukBulanIni - masukBulanLalu) / masukBulanLalu) * 100)
    : masukBulanIni > 0 ? 100 : 0;

  // ─── 6-Month Trend for Area Chart ──────────────────────────
  const monthlyTrend = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = d.toISOString().slice(0, 7);
      const monthMasuk = masukList.filter((m) => m.TANGGAL.startsWith(ym));
      const qty = monthMasuk.reduce((sum, m) => sum + Number(m.JUMLAH || 0), 0);
      months.push({
        label: d.toLocaleDateString('id-ID', { month: 'short' }),
        value: qty,
      });
    }
    return months;
  }, [masukList, now]);

  // ─── Sparkline data for KPI cards ──────────────────────────
  const incomingSparkline = monthlyTrend.map((m) => m.value);
  const outgoingMonthly = useMemo(() => {
    const months: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = d.toISOString().slice(0, 7);
      const qty = keluarList
        .filter((k) => k.TANGGAL.startsWith(ym) && k.STATUS_TRANSAKSI === 'DISETUJUI')
        .reduce((sum, k) => sum + k.JUMLAH, 0);
      months.push(qty);
    }
    return months;
  }, [keluarList, now]);

  const stockSparkline = useMemo(() => {
    return stockSummary.slice(0, 6).map((s) => s.STOK);
  }, [stockSummary]);

  const assetSparkline = useMemo(() => {
    const months: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = d.toISOString().slice(0, 7);
      const count = assets.filter((a) => a.TANGGAL_BKU && a.TANGGAL_BKU.startsWith(ym)).length;
      months.push(count || Math.max(assets.length - i * 0.5, 1));
    }
    return months;
  }, [assets, now]);

  // ─── Asset Condition Donut Data ────────────────────────────
  const donutData = [
    { label: 'Baik', value: assetBaik.length, color: '#10b981' },
    { label: 'Rusak Ringan', value: assetRusakRingan.length, color: '#f59e0b' },
    { label: 'Rusak Berat', value: assetRusakBerat.length, color: '#ef4444' },
  ];

  // ─── Budget Utilization (mock from sumber anggaran) ────────
  const budgetBySource = useMemo(() => {
    const sources: Record<string, number> = {};
    masukList.forEach((m) => {
      const src = m.SUMBER_ANGGARAN || 'Lainnya';
      sources[src] = (sources[src] || 0) + (Number(m.TOTAL_PENGADAAN) || 0);
    });
    return Object.entries(sources)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [masukList]);

  const totalBudget = budgetBySource.reduce((sum, b) => sum + b.value, 0) || 1;

  // ─── Category Distribution for Bar Chart ────────────────────
  const categoryBars = useMemo(() => {
    const cats: Record<string, number> = {};
    stockSummary.forEach((s) => {
      const item = items.find((i) => i.KODE_BARANG === s.KODE_BARANG);
      const cat = item?.KATEGORI || 'Lainnya';
      cats[cat] = (cats[cat] || 0) + s.STOK;
    });
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
    return Object.entries(cats)
      .map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [stockSummary, items]);

  // ─── Recent Activity Feed ──────────────────────────────────
  const recentActivity = useMemo(() => {
    const activities: { type: 'in' | 'out' | 'asset'; title: string; subtitle: string; date: string; amount?: string }[] = [];

    masukList.slice(-3).reverse().forEach((m) => {
      activities.push({
        type: 'in',
        title: `Barang Masuk: ${m.NAMA_BARANG}`,
        subtitle: `${m.JUMLAH} ${m.JENIS_SATUAN} dari ${m.NAMA_TOKO}`,
        date: m.TANGGAL,
        amount: `Rp ${(m.TOTAL_PENGADAAN / 1000000).toFixed(1)}jt`,
      });
    });

    keluarList.filter((k) => k.STATUS_TRANSAKSI === 'DISETUJUI').slice(-3).reverse().forEach((k) => {
      activities.push({
        type: 'out',
        title: `Barang Keluar: ${k.NAMA_BARANG}`,
        subtitle: `ke ${k.PENERIMA} (${k.UNIT_RUANGAN})`,
        date: k.TANGGAL,
      });
    });

    assets.slice(-2).reverse().forEach((a) => {
      activities.push({
        type: 'asset',
        title: `Aset Terdaftar: ${a.NAMA_BARANG}`,
        subtitle: `${a.MERK} — ${a.LOKASI}`,
        date: a.TANGGAL_BKU || a.NOMOR_BKU || '',
        amount: `Rp ${(a.TOTAL_NILAI / 1000000).toFixed(1)}jt`,
      });
    });

    return activities.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  }, [masukList, keluarList, assets]);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(val);

  const formatRupiahFull = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const keluarBulanIni = keluarList
    .filter((k) => k.TANGGAL.startsWith(currentYM) && k.STATUS_TRANSAKSI === 'DISETUJUI')
    .reduce((sum, k) => sum + k.JUMLAH, 0);

  const lowStockItems = stockSummary.filter((s) => s.STATUS === 'MINIMUM');
  const pendingApprovals = keluarList.filter((k) => k.STATUS_TRANSAKSI === 'MENUNGGU_PERSETUJUAN');
  const rusakAssets = assets.filter((a) => a.KONDISI === 'RUSAK RINGAN' || a.KONDISI === 'RUSAK BERAT');

  const activityIcon = {
    in: { icon: ArrowDownLeft, bg: 'bg-emerald-100', text: 'text-emerald-700' },
    out: { icon: ArrowUpRight, bg: 'bg-amber-100', text: 'text-amber-700' },
    asset: { icon: Box, bg: 'bg-sky-100', text: 'text-sky-700' },
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* ─── Hero Banner ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Aktif • {config.SCHOOL_NAME}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Dashboard Tata Kelola Barang & Inventaris
            </h2>
            <p className="text-xs text-emerald-100/70 max-w-2xl leading-relaxed">
              Monitoring real-time persediaan, aset, dan transaksi dengan analitik cerdas berbasis AI.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSheetsModal}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2"
            >
              <FileSpreadsheet size={16} />
              {connectedSheetId ? 'Kelola Sinkronisasi' : 'Hubungkan Sheets'}
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
          <div>
            <div className="text-[10px] font-bold text-emerald-300/70 uppercase tracking-wide">Nilai Aset</div>
            <div className="text-lg font-black mt-0.5">{formatRupiah(totalAssetValue)}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-300/70 uppercase tracking-wide">Total Unit Aset</div>
            <div className="text-lg font-black mt-0.5">{totalAssetUnits} Unit</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-300/70 uppercase tracking-wide">Pengadaan Bulan Ini</div>
            <div className="text-lg font-black mt-0.5">{formatRupiah(totalNilaiMasukBulanIni)}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-300/70 uppercase tracking-wide">Kesehatan Aset</div>
            <div className="text-lg font-black mt-0.5 flex items-center gap-1">
              {healthRate}%
              <span className={`text-[10px] ${healthRate >= 80 ? 'text-emerald-300' : 'text-amber-300'}`}>
                {healthRate >= 80 ? 'Sehat' : 'Perlu Perhatian'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── KPI Cards with Sparklines ──────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Master Barang */}
        <div
          onClick={() => onNavigate('master')}
          className="relative p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover hover:shadow-md cursor-pointer group overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Master Barang</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Package size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{items.length}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-400">Jenis terdaftar</span>
            <div className="w-16">
              <Sparkline data={stockSparkline} color="#10b981" height={20} />
            </div>
          </div>
        </div>

        {/* Aset / Inventaris */}
        <div
          onClick={() => onNavigate('aset')}
          className="relative p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover hover:shadow-md cursor-pointer group overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-blue-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Aset / Inventaris</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <Box size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{assets.length}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-400">
              {rusakAssets.length > 0 ? `${rusakAssets.length} perlu perbaikan` : 'Semua baik'}
            </span>
            <div className="w-16">
              <Sparkline data={assetSparkline} color="#3b82f6" height={20} />
            </div>
          </div>
        </div>

        {/* Barang Masuk */}
        <div
          onClick={() => onNavigate('barang_masuk')}
          className="relative p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover hover:shadow-md cursor-pointer group overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Masuk Bulan Ini</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2">+{masukBulanIni}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              {growthPercentage >= 0 ? (
                <TrendingUp size={11} className="text-emerald-600" />
              ) : (
                <TrendingDown size={11} className="text-rose-500" />
              )}
              {Math.abs(growthPercentage)}% vs bln lalu
            </span>
            <div className="w-16">
              <Sparkline data={incomingSparkline} color="#14b8a6" height={20} />
            </div>
          </div>
        </div>

        {/* Barang Keluar */}
        <div
          onClick={() => onNavigate('barang_keluar')}
          className="relative p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover hover:shadow-md cursor-pointer group overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Keluar Bulan Ini</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">-{keluarBulanIni}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-400">
              {pendingApprovals.length > 0 ? `${pendingApprovals.length} menunggu` : 'Semua disetujui'}
            </span>
            <div className="w-16">
              <Sparkline data={outgoingMonthly} color="#f59e0b" height={20} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Charts Row: Area Chart + Donut ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Stock Movement Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Activity size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Tren Pergerakan Barang Masuk</h3>
                <p className="text-[11px] text-slate-400">6 bulan terakhir</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('stock_ledger')}
              className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              Kartu Stok <ChevronRight size={12} />
            </button>
          </div>
          <AreaChart
            data={monthlyTrend}
            color="#10b981"
            height={210}
            valueFormatter={(v) => `${v}`}
          />
        </div>

        {/* Asset Condition Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Kondisi Aset</h3>
              <p className="text-[11px] text-slate-400">Distribusi status kelayakan</p>
            </div>
          </div>
          <div className="flex justify-center py-2">
            <DonutChart
              data={donutData}
              size={150}
              thickness={20}
              centerValue={String(assets.length)}
              centerLabel="Total Aset"
            />
          </div>
          {totalBarangRusak > 0 && (
            <button
              onClick={() => onNavigate('pemeliharaan')}
              className="w-full mt-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Wrench size={13} />
              {totalBarangRusak} aset perlu perbaikan
            </button>
          )}
        </div>
      </div>

      {/* ─── AI Insights + Critical Stock ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <AIInsightsPanel onNavigate={onNavigate} />
        </div>

        {/* Critical Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                <TrendingDown size={16} />
              </div>
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Stok Kritis</h3>
            </div>
            <button
              onClick={() => onNavigate('procurement_planner')}
              className="text-[11px] text-emerald-700 font-bold hover:underline"
            >
              Pengadaan
            </button>
          </div>
          <div className="space-y-2">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.KODE_BARANG}
                  onClick={() => onNavigate('procurement_planner')}
                  className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 hover:bg-rose-50 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{item.NAMA_BARANG}</div>
                    <div className="text-[10px] text-slate-500">Min: {item.BATAS_MINIMUM} {item.JENIS_SATUAN}</div>
                  </div>
                  <span className="text-xs font-black text-rose-700 px-2 py-0.5 rounded-md bg-rose-100 shrink-0">
                    {item.STOK} {item.JENIS_SATUAN}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center">
                <CheckCircle2 size={28} className="text-emerald-500 mb-1.5" />
                Semua persediaan aman.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Category Distribution + Recent Activity ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Category Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                <Layers size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Distribusi Stok per Kategori</h3>
                <p className="text-[11px] text-slate-400">Jumlah unit per kategori barang</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('persediaan')}
              className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              Detail <ChevronRight size={12} />
            </button>
          </div>
          {categoryBars.length > 0 ? (
            <BarChart
              data={categoryBars}
              height={200}
              valueFormatter={(v) => `${v} unit`}
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">
              Belum ada data stok.
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Activity size={16} />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Aktivitas Terbaru</h3>
          </div>
          <div className="space-y-3">
            {recentActivity.map((act, i) => {
              const cfg = activityIcon[act.type];
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 ${cfg.bg} ${cfg.text}`}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-700 truncate">{act.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{act.subtitle}</div>
                    <div className="text-[9px] text-slate-300 mt-0.5 flex items-center gap-2">
                      <Clock size={9} />
                      {act.date}
                      {act.amount && <span className="font-bold text-slate-500">{act.amount}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Budget Utilization + Quick Actions ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Budget by Source */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Coins size={16} />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Realisasi per Sumber Dana</h3>
          </div>
          {budgetBySource.length > 0 ? (
            <div className="space-y-3">
              {budgetBySource.map((src, i) => {
                const pct = Math.round((src.value / totalBudget) * 100);
                const colors = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-violet-500'];
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-600 truncate">{src.label}</span>
                      <span className="font-bold text-slate-700">{formatRupiah(src.value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${colors[i % colors.length]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{pct}% dari total</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">Belum ada data pengadaan.</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Aksi Cepat & Inovasi</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => onNavigate('barang_masuk')}
              className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-slate-800 border border-emerald-200 text-left transition-all group shadow-xs"
            >
              <Sparkles size={18} className="text-emerald-700 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-black text-emerald-950">OCR Kwitansi AI</div>
              <div className="text-[10px] text-slate-500">Scan & Ekstrak Faktur</div>
            </button>
            <button
              onClick={() => onNavigate('arkas_siplah')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-800 border border-slate-200 hover:border-blue-300 text-left transition-all group"
            >
              <Building2 size={18} className="text-blue-700 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold">ARKAS & SIPLah</div>
              <div className="text-[10px] text-slate-500">Realisasi BOS</div>
            </button>
            <button
              onClick={() => onNavigate('depresiasi_aset')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-800 border border-slate-200 hover:border-indigo-300 text-left transition-all group"
            >
              <TrendingDown size={18} className="text-indigo-700 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold">Depresiasi SAP</div>
              <div className="text-[10px] text-slate-500">Penyusutan Aset</div>
            </button>
            <button
              onClick={() => onNavigate('multi_school')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-800 border border-slate-200 hover:border-emerald-300 text-left transition-all group"
            >
              <ShieldCheck size={18} className="text-emerald-800 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold">Konsolidasi</div>
              <div className="text-[10px] text-slate-500">Multi-Sekolah</div>
            </button>
          </div>

          {/* Tasks & Approvals */}
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Tugas & Antrean Persetujuan</h3>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {tasks.length} Terbuka
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {tasks.length > 0 ? (
                tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.ID}
                    onClick={() => onNavigate(task.MODULE as ActivePage)}
                    className="py-2.5 flex items-start justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg shrink-0 ${task.TYPE === 'APPROVAL' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                        {task.TYPE === 'APPROVAL' ? <Clock size={14} /> : <AlertTriangle size={14} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{task.TITLE}</div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{task.DESCRIPTION}</p>
                      </div>
                    </div>
                    <button className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-emerald-800 hover:text-white text-slate-700 shrink-0 transition-colors flex items-center gap-1">
                      Buka <ArrowRight size={11} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center">
                  <CheckCircle2 size={28} className="text-emerald-500 mb-1.5" />
                  <p>Semua tugas hari ini telah selesai.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
