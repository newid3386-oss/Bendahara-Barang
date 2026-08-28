import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Package, Box, FileText, User as UserIcon, ArrowRight } from 'lucide-react';
import { db } from '../services/localStorageService';
import { ActivePage } from '../types';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: ActivePage, query?: string) => void;
}

interface SearchResult {
  id: string;
  type: 'BARANG' | 'ASET' | 'TRANSAKSI' | 'PEGAWAI' | 'DOKUMEN';
  title: string;
  subtitle: string;
  badge?: string;
  targetPage: ActivePage;
  queryParam?: string;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const performSearch = useCallback((q: string) => {
    const term = q.trim().toLowerCase();
    const list: SearchResult[] = [];

    const items = db.getItems();
    const stockMap = db.getStockMap();
    const assets = db.getAssets();
    const users = db.getUsers();
    const masuk = db.getBarangMasuk();
    const keluar = db.getBarangKeluar();
    const documents = db.getDocuments();

    // 1. Search Master Items
    items.forEach((item) => {
      if (
        !term ||
        item.NAMA_BARANG.toLowerCase().includes(term) ||
        item.KODE_BARANG.toLowerCase().includes(term) ||
        item.KATEGORI.toLowerCase().includes(term)
      ) {
        list.push({
          id: item.ID,
          type: 'BARANG',
          title: item.NAMA_BARANG,
          subtitle: `${item.KODE_BARANG} • Stok: ${stockMap[item.KODE_BARANG] || 0} ${item.JENIS_SATUAN} • ${item.LOKASI_DEFAULT}`,
          badge: item.TIPE,
          targetPage: 'persediaan',
          queryParam: item.KODE_BARANG,
        });
      }
    });

    // 2. Search Assets
    assets.forEach((ast) => {
      if (
        !term ||
        ast.NAMA_BARANG.toLowerCase().includes(term) ||
        ast.KODE_ASET.toLowerCase().includes(term) ||
        ast.LOKASI.toLowerCase().includes(term) ||
        ast.PENANGGUNG_JAWAB.toLowerCase().includes(term)
      ) {
        list.push({
          id: ast.ID,
          type: 'ASET',
          title: ast.NAMA_BARANG,
          subtitle: `${ast.KODE_ASET} • ${ast.LOKASI} • PJ: ${ast.PENANGGUNG_JAWAB}`,
          badge: ast.KONDISI,
          targetPage: 'aset',
          queryParam: ast.KODE_ASET,
        });
      }
    });

    // 3. Search Employees / Users
    users.forEach((usr) => {
      if (!term || usr.NAMA.toLowerCase().includes(term) || usr.NIP.toLowerCase().includes(term)) {
        list.push({
          id: usr.ID,
          type: 'PEGAWAI',
          title: usr.NAMA,
          subtitle: `NIP: ${usr.NIP || '-'} • ${usr.JABATAN || usr.ROLE}`,
          badge: usr.ROLE,
          targetPage: 'barang_keluar',
        });
      }
    });

    // 4. Search Transactions
    keluar.forEach((bk) => {
      if (
        term &&
        (bk.NOMOR_DOKUMEN.toLowerCase().includes(term) ||
          bk.NAMA_BARANG.toLowerCase().includes(term) ||
          bk.PENERIMA.toLowerCase().includes(term))
      ) {
        list.push({
          id: bk.ID,
          type: 'TRANSAKSI',
          title: `Pengeluaran: ${bk.NOMOR_DOKUMEN}`,
          subtitle: `${bk.NAMA_BARANG} (${bk.JUMLAH} ${bk.JENIS_SATUAN}) kepada ${bk.PENERIMA} • ${bk.TANGGAL}`,
          badge: bk.STATUS_TRANSAKSI,
          targetPage: 'barang_keluar',
        });
      }
    });

    masuk.forEach((bm) => {
      if (
        term &&
        (bm.NOMOR_BKU.toLowerCase().includes(term) ||
          bm.NOMOR_KWITANSI.toLowerCase().includes(term) ||
          bm.NAMA_BARANG.toLowerCase().includes(term) ||
          bm.NAMA_TOKO.toLowerCase().includes(term))
      ) {
        list.push({
          id: bm.ID,
          type: 'TRANSAKSI',
          title: `Penerimaan: ${bm.NOMOR_KWITANSI || bm.NOMOR_BKU || bm.ID}`,
          subtitle: `${bm.NAMA_BARANG} (${bm.JUMLAH} ${bm.JENIS_SATUAN}) dari ${bm.NAMA_TOKO} • ${bm.TANGGAL}`,
          badge: 'MASUK',
          targetPage: 'barang_masuk',
        });
      }
    });

    // 5. Search Documents
    documents.forEach((doc) => {
      if (
        term &&
        (doc.NOMOR_DOKUMEN.toLowerCase().includes(term) ||
          doc.JENIS_DOKUMEN.toLowerCase().includes(term) ||
          doc.KETERANGAN.toLowerCase().includes(term))
      ) {
        list.push({
          id: doc.ID,
          type: 'DOKUMEN',
          title: `${doc.JENIS_DOKUMEN} - ${doc.NOMOR_DOKUMEN}`,
          subtitle: `${doc.KETERANGAN} • Dibuat oleh ${doc.DIBUAT_OLEH}`,
          badge: doc.STATUS,
          targetPage: 'document_center',
        });
      }
    });

    setResults(list.slice(0, 25));
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      performSearch(query);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen, performSearch, query]);

  const handleSelect = (item: SearchResult) => {
    onNavigate(item.targetPage, item.queryParam);
    onClose();
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'BARANG':
        return <Package size={16} className="text-emerald-700" />;
      case 'ASET':
        return <Box size={16} className="text-blue-700" />;
      case 'TRANSAKSI':
        return <FileText size={16} className="text-amber-700" />;
      case 'PEGAWAI':
        return <UserIcon size={16} className="text-purple-700" />;
      default:
        return <FileText size={16} className="text-slate-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3 bg-slate-50/70">
          <Search size={20} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              performSearch(e.target.value);
            }}
            placeholder="Cari barang, kode aset, guru, kwitansi, atau transaksi... (Ketik untuk mencari)"
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-100">
          {results.length > 0 ? (
            results.map((res) => (
              <div
                key={`${res.type}-${res.id}`}
                onClick={() => handleSelect(res)}
                className="p-3 rounded-xl hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between gap-3 group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white shadow-xs transition-colors shrink-0">
                    {getIcon(res.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-950">
                        {res.title}
                      </h4>
                      {res.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                          {res.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{res.subtitle}</p>
                  </div>
                </div>

                <div className="text-slate-400 group-hover:text-emerald-700 shrink-0">
                  <ArrowRight size={15} />
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ditemukan data yang cocok dengan "{query}".
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
          <span>
            Tekan <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">Esc</kbd> untuk menutup
          </span>
          <span>{results.length} hasil pencarian</span>
        </div>
      </div>
    </div>
  );
};
