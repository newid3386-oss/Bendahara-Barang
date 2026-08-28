import React, { useState } from 'react';
import { FileText, Download, Filter, Calendar, BookOpen, Layers, Box, Check } from 'lucide-react';
import { db } from '../services/localStorageService';
import { pdfService } from '../services/pdfService';

export const LaporanView: React.FC = () => {
  const [reportType, setReportType] = useState<
    'PERSEDIAAN' | 'PENERIMAAN' | 'PENGELUARAN' | 'ASET_KIR' | 'REKAP_TRIWULAN'
  >('PERSEDIAAN');

  const [selectedPeriod, setSelectedPeriod] = useState('Bulan Berjalan');
  const [selectedRoom, setSelectedRoom] = useState('Semua Ruangan');

  const stockSummary = db.getStockSummary();
  const masukList = db.getBarangMasuk();
  const keluarList = db.getBarangKeluar();
  const assets = db.getAssets();

  const rooms = Array.from(new Set(assets.map((a) => a.LOKASI).filter(Boolean)));

  const handleDownloadReport = () => {
    switch (reportType) {
      case 'PERSEDIAAN':
        pdfService.generateLaporanPersediaan(stockSummary, selectedPeriod);
        break;

      case 'ASET_KIR': {
        const filteredAssets =
          selectedRoom === 'Semua Ruangan'
            ? assets
            : assets.filter((a) => a.LOKASI === selectedRoom);
        pdfService.generateLaporanAset(
          filteredAssets,
          `KARTU INVENTARIS RUANGAN (KIR) - ${selectedRoom.toUpperCase()}`
        );
        break;
      }

      case 'PENERIMAAN':
        pdfService.generateBeritaAcara({
          title: 'BUKU PENERIMAAN BARANG HASIL PENGADAAN',
          docNo: `LAP-MASUK-${new Date().toISOString().slice(0, 10)}`,
          description: `Rekapitulasi penerimaan barang masuk hasil belanja pengadaan sekolah untuk periode ${selectedPeriod}:`,
          tableHeaders: ['No', 'Tanggal', 'Penyedia / Toko', 'Nama Barang', 'Qty', 'Satuan', 'Harga Satuan', 'Total'],
          tableRows: masukList.map((m, idx) => [
            idx + 1,
            m.TANGGAL,
            m.NAMA_TOKO,
            m.NAMA_BARANG,
            m.JUMLAH,
            m.JENIS_SATUAN,
            `Rp ${m.HARGA_SATUAN.toLocaleString('id-ID')}`,
            `Rp ${m.TOTAL_PENGADAAN.toLocaleString('id-ID')}`,
          ]),
          footerText: `Total Nilai Penerimaan Barang: Rp ${masukList
            .reduce((sum, m) => sum + m.TOTAL_PENGADAAN, 0)
            .toLocaleString('id-ID')}`,
          rightSigner: {
            title: 'Pengurus / Pengelola Barang,',
            name: db.getConfig().TREASURER || 'Pengurus Barang',
            nip: '',
          },
        });
        break;

      case 'PENGELUARAN':
        pdfService.generateBeritaAcara({
          title: 'BUKU PENGELUARAN DAN PENYALURAN BARANG',
          docNo: `LAP-KELUAR-${new Date().toISOString().slice(0, 10)}`,
          description: `Rekapitulasi pendistribusian dan pengeluaran barang persediaan untuk periode ${selectedPeriod}:`,
          tableHeaders: ['No', 'Tanggal', 'No. Dokumen', 'Nama Barang', 'Qty', 'Satuan', 'Penerima', 'Unit / Ruangan'],
          tableRows: keluarList.map((k, idx) => [
            idx + 1,
            k.TANGGAL,
            k.NOMOR_DOKUMEN,
            k.NAMA_BARANG,
            k.JUMLAH,
            k.JENIS_SATUAN,
            k.PENERIMA,
            k.UNIT_RUANGAN,
          ]),
          footerText: `Total Transaksi Penyaluran Barang: ${keluarList.length} transaksi.`,
          rightSigner: {
            title: 'Pengurus / Pengelola Barang,',
            name: db.getConfig().TREASURER || 'Pengurus Barang',
            nip: '',
          },
        });
        break;

      case 'REKAP_TRIWULAN':
        pdfService.generateBeritaAcara({
          title: 'LAPORAN REKAPITULASI MUTASI PERSEDIAAN TRIWULAN',
          docNo: `REKAP-TRIWULAN-${new Date().getFullYear()}`,
          description: `Laporan pertanggungjawaban mutasi persediaan barang habis pakai sekolah periode ${selectedPeriod}:`,
          tableHeaders: ['No', 'Kode Barang', 'Nama Barang', 'Satuan', 'Masuk', 'Keluar', 'Penyesuaian', 'Saldo Akhir'],
          tableRows: stockSummary.map((s, idx) => [
            idx + 1,
            s.KODE_BARANG,
            s.NAMA_BARANG,
            s.JENIS_SATUAN,
            s.TOTAL_MASUK,
            s.TOTAL_KELUAR,
            s.TOTAL_ADJUSTMENT,
            s.STOK,
          ]),
          footerText:
            'Laporan mutasi persediaan ini disusun sesuai dengan bukti fisik buku penerimaan, pengeluaran, dan stock opname.',
          leftSigner: {
            title: 'Mengetahui, Kepala Sekolah',
            name: db.getConfig().HEADMASTER || 'Kepala Sekolah',
            nip: '',
          },
          rightSigner: {
            title: 'Pengurus Barang,',
            name: db.getConfig().TREASURER || 'Pengurus Barang',
            nip: '',
          },
        });
        break;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
          <FileText size={19} className="text-emerald-800" />
          Pusat Laporan & Pertanggungjawaban Barang
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Cetak dokumen resmi pembukuan barang persediaan, mutasi triwulan, buku kas penerimaan/pengeluaran, dan Kartu Inventaris Ruangan (KIR).
        </p>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          {
            id: 'PERSEDIAAN',
            title: 'Buku Persediaan Barang',
            desc: 'Daftar stok masuk, keluar, sisa saldo, dan status batas minimum.',
            icon: Layers,
          },
          {
            id: 'PENERIMAAN',
            title: 'Buku Penerimaan Barang',
            desc: 'Rekapitulasi pengadaan dari toko, nomor kwitansi, dan BKU.',
            icon: BookOpen,
          },
          {
            id: 'PENGELUARAN',
            title: 'Buku Pengeluaran Barang',
            desc: 'Rekapitulasi penyaluran ATK ke guru & unit ruangan.',
            icon: FileText,
          },
          {
            id: 'ASET_KIR',
            title: 'Kartu Inventaris Ruangan (KIR)',
            desc: 'Daftar inventaris aset tetap per ruangan / laboratorium.',
            icon: Box,
          },
          {
            id: 'REKAP_TRIWULAN',
            title: 'Laporan Rekap Mutasi Triwulan',
            desc: 'Format resmi pertanggungjawaban BOS & audit Dinas Pendidikan.',
            icon: Calendar,
          },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = reportType === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setReportType(item.id as any)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-50/70 border-emerald-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2 rounded-xl ${
                      isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  {isSelected && <Check size={16} className="text-emerald-800" />}
                </div>
                <h3 className="font-bold text-xs text-slate-800 mt-3">{item.title}</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter & Export Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
          Parameter & Pengaturan Laporan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Periode Waktu</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium focus:outline-emerald-700"
            >
              <option value="Bulan Berjalan">Bulan Berjalan ({new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })})</option>
              <option value="Triwulan I (Jan - Mar)">Triwulan I (Jan - Mar)</option>
              <option value="Triwulan II (Apr - Jun)">Triwulan II (Apr - Jun)</option>
              <option value="Triwulan III (Jul - Sep)">Triwulan III (Jul - Sep)</option>
              <option value="Triwulan IV (Okt - Des)">Triwulan IV (Okt - Des)</option>
              <option value="Semester I">Semester I</option>
              <option value="Semester II">Semester II</option>
              <option value="Tahun Anggaran Berjalan">Tahun Anggaran Berjalan (1 Tahun)</option>
            </select>
          </div>

          {reportType === 'ASET_KIR' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Ruangan (KIR)</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium focus:outline-emerald-700"
              >
                <option value="Semua Ruangan">Semua Ruangan</option>
                {rooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDownloadReport}
            className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Download size={16} /> Unduh / Cetak Dokumen PDF Resmi
          </button>
        </div>
      </div>
    </div>
  );
};
