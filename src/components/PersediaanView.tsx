import React, { useState, useEffect } from 'react';
import { Layers, Search, AlertTriangle, Download, RefreshCw, Filter, FileSpreadsheet } from 'lucide-react';
import { db } from '../services/localStorageService';
import { StockSummary } from '../types';
import { pdfService } from '../services/pdfService';
import { excelService } from '../services/excelService';

export const PersediaanView: React.FC = () => {
  const [stockList, setStockList] = useState<StockSummary[]>(db.getStockSummary());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AMAN' | 'MINIMUM'>('ALL');

  const refreshData = () => {
    db.rebuildStockLedger();
    setStockList(db.getStockSummary());
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, []);

  const handleExportPDF = () => {
    pdfService.generateLaporanPersediaan(stockList, 'Bulan Berjalan');
  };

  const handleExportExcel = () => {
    const items = db.getItems();
    const stockMap = db.getStockMap();
    const config = db.getConfig();
    excelService.exportPersediaan(items, stockMap, config);
  };

  const filtered = stockList.filter((s) => {
    const matchSearch =
      !search ||
      s.NAMA_BARANG.toLowerCase().includes(search.toLowerCase()) ||
      s.KODE_BARANG.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || s.STATUS === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalItemCount = stockList.length;
  const lowStockCount = stockList.filter((s) => s.STATUS === 'MINIMUM').length;
  const totalFisikStok = stockList.reduce((sum, s) => sum + s.STOK, 0);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Layers size={19} className="text-emerald-800" />
            Buku Persediaan & Monitoring Stok
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Posisi saldo stok real-time hasil kalkulasi mutasi Barang Masuk, Barang Keluar, dan Stock Opname.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshData}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            title="Rekonsiliasi & Hitung Ulang Saldo"
          >
            <RefreshCw size={15} />
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            title="Ekspor ke format Excel"
          >
            <FileSpreadsheet size={15} /> Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Download size={15} /> Cetak Buku Persediaan (PDF)
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Total Jenis Barang</span>
          <div className="text-xl font-black text-slate-800 mt-1">{totalItemCount} SKU</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Total Kuantitas Fisik</span>
          <div className="text-xl font-black text-emerald-900 mt-1">{totalFisikStok} Unit/Pcs</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Stok Kritis / Di Bawah Batas</span>
          <div className="text-xl font-black text-rose-700 mt-1">{lowStockCount} SKU</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari persediaan berdasarkan kode atau nama barang..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold focus:outline-emerald-700 shadow-2xs"
          >
            <option value="ALL">Semua Status Stok</option>
            <option value="AMAN">Stok Aman</option>
            <option value="MINIMUM">Stok Minimum / Kritis</option>
          </select>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <th className="py-3 px-4">Kode Barang</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4 text-center">Satuan</th>
                <th className="py-3 px-4 text-center text-emerald-900">Total Masuk</th>
                <th className="py-3 px-4 text-center text-amber-900">Total Keluar</th>
                <th className="py-3 px-4 text-center text-blue-900">Penyesuaian</th>
                <th className="py-3 px-4 text-center font-black">Saldo Akhir</th>
                <th className="py-3 px-4 text-center">Batas Min</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.KODE_BARANG} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.KODE_BARANG}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.NAMA_BARANG}</td>
                    <td className="py-3 px-4 text-center">{item.JENIS_SATUAN}</td>
                    <td className="py-3 px-4 text-center text-emerald-800 font-semibold">+{item.TOTAL_MASUK}</td>
                    <td className="py-3 px-4 text-center text-amber-800 font-semibold">-{item.TOTAL_KELUAR}</td>
                    <td className="py-3 px-4 text-center text-blue-800">
                      {item.TOTAL_ADJUSTMENT !== 0 ? (item.TOTAL_ADJUSTMENT > 0 ? `+${item.TOTAL_ADJUSTMENT}` : item.TOTAL_ADJUSTMENT) : '0'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full font-black text-xs ${
                          item.STATUS === 'MINIMUM'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}
                      >
                        {item.STOK} {item.JENIS_SATUAN}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {item.BATAS_MINIMUM} {item.JENIS_SATUAN}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.STATUS === 'MINIMUM' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                          <AlertTriangle size={11} /> Minimum
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          Aman
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data persediaan yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
