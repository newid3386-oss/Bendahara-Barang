import React, { useState, useEffect } from 'react';
import {
  Building2,
  GraduationCap,
  Users,
  Box,
  QrCode,
  ShieldCheck,
  BookOpen,
  Calendar,
  Award,
  Phone,
  Mail,
  MapPin,
  LogIn,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Lock,
  UserCheck,
  Eye,
  Layers,
  FileText,
  Clock,
  ArrowRight,
  School,
  Laptop,
  Flame,
  Globe,
  HeartHandshake,
  Check,
  Info,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { User, Asset, Item } from '../types';
import { LoginSelectionModal } from './LoginSelectionModal';

interface SchoolPublicWebsiteProps {
  onEnterApp: (user?: User) => void;
  onEnterClassroom: () => void;
  onEnterAdmin: () => void;
  initialLoginOpen?: boolean;
}

export const SchoolPublicWebsite: React.FC<SchoolPublicWebsiteProps> = ({
  onEnterApp,
  onEnterClassroom,
  onEnterAdmin,
  initialLoginOpen = false,
}) => {
  const config = db.getConfig();
  const users = db.getUsers();
  const assets = db.getAssets();
  const items = db.getItems();
  const stockSummary = db.getStockSummary();

  const [activeNav, setActiveNav] = useState<'beranda' | 'profil' | 'sarpras' | 'verifikasi' | 'berita' | 'kontak'>('beranda');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(initialLoginOpen);

  // Public QR Verification Search
  const [verificationInput, setVerificationInput] = useState('');
  const [verifiedAsset, setVerifiedAsset] = useState<Asset | null>(null);
  const [verifiedItem, setVerifiedItem] = useState<Item | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Filter for public facilities
  const [roomFilter, setRoomFilter] = useState<string>('ALL');
  const [facilitySearch, setFacilitySearch] = useState<string>('');

  const rooms = Array.from(new Set(assets.map((a) => a.LOKASI).filter(Boolean)));

  // Calculate live public stats
  const totalAssetsCount = assets.length;
  const totalPersediaanCount = items.length;
  const goodAssetsCount = assets.filter((a) => a.KONDISI === 'BAIK').length;
  const totalTeachers = users.length;

  const handleVerifyCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError(null);
    setVerifiedAsset(null);
    setVerifiedItem(null);

    const query = verificationInput.trim().toUpperCase();
    if (!query) {
      setSearchError('Silakan masukkan Kode Aset (AST-xxx) atau Kode Barang (BRG-xxx).');
      return;
    }

    const matchedAsset = assets.find(
      (a) => a.KODE_ASET.toUpperCase() === query || (a.KODE_BARANG && a.KODE_BARANG.toUpperCase() === query)
    );

    if (matchedAsset) {
      setVerifiedAsset(matchedAsset);
      return;
    }

    const matchedItem = items.find(
      (i) => i.KODE_BARANG.toUpperCase() === query || i.NAMA_BARANG.toUpperCase().includes(query)
    );

    if (matchedItem) {
      setVerifiedItem(matchedItem);
      return;
    }

    setSearchError(`Kode "${verificationInput}" tidak ditemukan dalam daftar aset resmi SDN Tangerang 6.`);
  };

  const filteredAssets = assets.filter((a) => {
    const matchRoom = roomFilter === 'ALL' || a.LOKASI === roomFilter;
    const matchSearch =
      !facilitySearch ||
      a.NAMA_BARANG.toLowerCase().includes(facilitySearch.toLowerCase()) ||
      a.KODE_ASET.toLowerCase().includes(facilitySearch.toLowerCase()) ||
      a.LOKASI.toLowerCase().includes(facilitySearch.toLowerCase());
    return matchRoom && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-emerald-800 selection:text-white">
      {/* Top Bar Announcement */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-2 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] tracking-wide">
              RESMI
            </span>
            <span>UPT Satuan Pendidikan SD Negeri Tangerang 6 • NPSN: {config.SCHOOL_NPSN || '20606016'}</span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-emerald-400 font-semibold">Akreditasi A</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1 text-slate-300">
              <MapPin size={12} className="text-emerald-400" />
              <span className="truncate max-w-[260px] sm:max-w-none">Kota Tangerang, Banten</span>
            </div>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Lock size={12} />
              <span>LOGIN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & School Identity */}
          <div
            onClick={() => setActiveNav('beranda')}
            className="flex items-center gap-3.5 cursor-pointer group select-none"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white flex items-center justify-center font-black shadow-md border border-emerald-600/40 group-hover:scale-105 transition-transform">
              <School size={24} className="text-emerald-200" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-800 transition-colors">
                SD NEGERI TANGERANG 6
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-1 leading-none">
                Dinas Pendidikan Pemerintah Kota Tangerang
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-bold text-slate-600">
            <button
              onClick={() => setActiveNav('beranda')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeNav === 'beranda' ? 'bg-emerald-50 text-emerald-800 font-extrabold' : 'hover:bg-slate-100'
              }`}
            >
              Beranda
            </button>
            <button
              onClick={() => setActiveNav('profil')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeNav === 'profil' ? 'bg-emerald-50 text-emerald-800 font-extrabold' : 'hover:bg-slate-100'
              }`}
            >
              Profil & Guru
            </button>
            <button
              onClick={() => setActiveNav('sarpras')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeNav === 'sarpras' ? 'bg-emerald-50 text-emerald-800 font-extrabold' : 'hover:bg-slate-100'
              }`}
            >
              Sarpras & Fasilitas
            </button>
            <button
              onClick={() => setActiveNav('verifikasi')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeNav === 'verifikasi' ? 'bg-emerald-50 text-emerald-800 font-extrabold' : 'hover:bg-slate-100'
              }`}
            >
              Cek QR Aset
            </button>
            <button
              onClick={() => setActiveNav('berita')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeNav === 'berita' ? 'bg-emerald-50 text-emerald-800 font-extrabold' : 'hover:bg-slate-100'
              }`}
            >
              Berita & Prestasi
            </button>
            <button
              onClick={() => setActiveNav('kontak')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeNav === 'kontak' ? 'bg-emerald-50 text-emerald-800 font-extrabold' : 'hover:bg-slate-100'
              }`}
            >
              Kontak
            </button>
          </nav>

          {/* Primary Action: LOGIN portal selector */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 group"
            >
              <LogIn size={15} className="group-hover:translate-x-0.5 transition-transform" />
              <span>LOGIN</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Scroller */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-1 overflow-x-auto text-xs font-bold text-slate-600 scrollbar-none">
        <button
          onClick={() => setActiveNav('beranda')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeNav === 'beranda' ? 'bg-emerald-800 text-white' : 'bg-slate-100'
          }`}
        >
          Beranda
        </button>
        <button
          onClick={() => setActiveNav('profil')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeNav === 'profil' ? 'bg-emerald-800 text-white' : 'bg-slate-100'
          }`}
        >
          Profil & Guru
        </button>
        <button
          onClick={() => setActiveNav('sarpras')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeNav === 'sarpras' ? 'bg-emerald-800 text-white' : 'bg-slate-100'
          }`}
        >
          Sarpras
        </button>
        <button
          onClick={() => setActiveNav('verifikasi')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeNav === 'verifikasi' ? 'bg-emerald-800 text-white' : 'bg-slate-100'
          }`}
        >
          Cek QR
        </button>
        <button
          onClick={() => setActiveNav('berita')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeNav === 'berita' ? 'bg-emerald-800 text-white' : 'bg-slate-100'
          }`}
        >
          Berita
        </button>
        <button
          onClick={() => setActiveNav('kontak')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeNav === 'kontak' ? 'bg-emerald-800 text-white' : 'bg-slate-100'
          }`}
        >
          Kontak
        </button>
      </div>

      {/* PAGE CONTENTS */}
      <main className="flex-1">
        {/* BERANDA TAB */}
        {activeNav === 'beranda' && (
          <div className="space-y-16 pb-20 animate-in fade-in duration-200">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
              <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide">
                    <Sparkles size={14} className="text-emerald-400" />
                    <span>Satuan Pendidikan Unggul & Ramah Anak Kota Tangerang</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                    Unggul dalam Prestasi, Berkarakter Luhur & Berwawasan Lingkungan
                  </h1>

                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                    Selamat datang di Laman Resmi UPT Satuan Pendidikan SD Negeri Tangerang 6. Kami berkomitmen menyelenggarakan pembelajaran inovatif yang menyenangkan, berpusat pada murid, serta menjunjung akuntabilitas tata kelola sarana & prasarana sekolah secara transparan.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-2"
                    >
                      <LogIn size={16} />
                      <span>LOGIN</span>
                    </button>
                    <button
                      onClick={() => setActiveNav('sarpras')}
                      className="px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
                    >
                      <Box size={16} className="text-emerald-400" />
                      <span>Lihat Fasilitas & Aset</span>
                    </button>
                    <button
                      onClick={() => setActiveNav('verifikasi')}
                      className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-500/30 font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
                    >
                      <QrCode size={16} />
                      <span>Validasi QR Aset</span>
                    </button>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800/80">
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                      <div className="text-2xl font-black text-emerald-400">750+</div>
                      <div className="text-[11px] text-slate-400 font-medium">Peserta Didik Aktif</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                      <div className="text-2xl font-black text-teal-400">{totalTeachers}</div>
                      <div className="text-[11px] text-slate-400 font-medium">Guru & Tenaga Tendik</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                      <div className="text-2xl font-black text-amber-400">{totalAssetsCount}</div>
                      <div className="text-[11px] text-slate-400 font-medium">Aset Tetap Terdata</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                      <div className="text-2xl font-black text-sky-400">100%</div>
                      <div className="text-[11px] text-slate-400 font-medium">Digital Akuntabel</div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Kepala Sekolah Welcome Note */}
                <div className="lg:col-span-5">
                  <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative backdrop-blur-xl">
                    <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-700/50 border-2 border-emerald-400 flex items-center justify-center text-white text-2xl font-black shrink-0">
                        LK
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                          Sambutan Kepala Sekolah
                        </div>
                        <h3 className="text-base font-bold text-white mt-0.5">
                          {config.HEADMASTER || 'Liestya Kusuma Sari, S.Pd., M.Pd.'}
                        </h3>
                        <div className="text-[11px] text-slate-400">
                          NIP. {config.HEADMASTER_NIP || '198406192009022007'}
                        </div>
                      </div>
                    </div>

                    <div className="py-4 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3 font-normal">
                      <p>
                        "Pendidikan adalah lentera masa depan. Di SDN Tangerang 6, kami mendidik setiap anak dengan hati, membina karakter berlandaskan Profil Pelajar Pancasila, serta menjamin seluruh fasilitas pembelajaran terpelihara dengan baik demi kenyamanan anak-anak kita."
                      </p>
                      <p className="text-slate-400 text-xs">
                        "Melalui integrasi SIPERSEDA, kami mewujudkan tata kelola aset dan persediaan BOS yang transparan, akuntabel, dan siap diaudit."
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">NPSN: {config.SCHOOL_NPSN || '20606016'}</span>
                      <button
                        onClick={() => setActiveNav('profil')}
                        className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                      >
                        <span>Baca Profil Lengkap</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Feature Pillars */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                  Program Unggulan Sekolah
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  Mewujudkan Lingkungan Belajar Holistik & Modern
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Laptop size={24} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Digitalisasi Pembelajaran</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Penggunaan perangkat Chromebook, ruang multimedia interaktif, dan laboratorium komputer untuk menumbuhkan literasi digital sejak dini.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                    <Award size={24} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Pengembangan Karakter & Prestasi</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pembinaan ekstrakurikuler kepramukaan, seni tari tradisional, sains club, dokter kecil (UKS), dan olahraga berprestasi di tingkat Kota Tangerang.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Transparansi Sarana & Aset (SIPERSEDA)</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sistem inventaris digital terhubung Google Sheets dan QR Code untuk memastikan setiap meja, buku, dan alat peraga tercatat rapi dan terawat.
                  </p>
                </div>
              </div>
            </section>

            {/* Live Facilities & Sarpras Teaser */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                    Transparansi Sarana & Prasarana
                  </span>
                  <h2 className="text-2xl font-black">
                    Eksplorasi {rooms.length} Ruang Pembelajaran & Fasilitas Sekolah
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                    Periksa ketersediaan buku ajar, perlengkapan kelas, proyektor LCD, dan inventaris resmi yang didanai melalui Dana BOS Reguler.
                  </p>
                </div>
                <button
                  onClick={() => setActiveNav('sarpras')}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all shrink-0 flex items-center gap-2"
                >
                  <Box size={16} />
                  <span>Jelajahi Sarpras Sekolah</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* PROFIL & GURU TAB */}
        {activeNav === 'profil' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                Profil Satuan Pendidikan
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Identitas, Visi, Misi & Dewan Pendidik SDN Tangerang 6
              </h2>
            </div>

            {/* School Identity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building2 size={18} className="text-emerald-700" />
                  <span>Identitas Resmi Sekolah</span>
                </h3>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-slate-400 font-semibold">Nama Satuan</dt>
                    <dd className="font-bold text-slate-800 mt-0.5">{config.SCHOOL_NAME || 'UPT Satuan Pendidikan SD Negeri Tangerang 6'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-semibold">NPSN</dt>
                    <dd className="font-mono font-bold text-emerald-800 mt-0.5">{config.SCHOOL_NPSN || '20606016'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-semibold">Bentuk Pendidikan</dt>
                    <dd className="font-bold text-slate-800 mt-0.5">Sekolah Dasar (SD Negeri)</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-semibold">Status Akreditasi</dt>
                    <dd className="font-bold text-emerald-700 mt-0.5">Akreditasi A (Unggul)</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-400 font-semibold">Alamat Lengkap</dt>
                    <dd className="font-medium text-slate-700 mt-0.5">{config.ADDRESS || 'Jl. Nyimas Melati No. 2, Kel. Sukasari, Kec. Tangerang, Kota Tangerang, Banten 15118'}</dd>
                  </div>
                </dl>
              </div>

              {/* Visi & Misi */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Award size={18} className="text-emerald-700" />
                  <span>Visi & Misi Sekolah</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-900 block mb-1">Visi Pendidikan:</span>
                    <p className="text-emerald-800 italic font-medium">
                      "Terwujudnya Peserta Didik yang Beriman, Bertaqwa, Berprestasi, Berkarakter Pancasila, dan Berbudaya Lingkungan Hidup."
                    </p>
                  </div>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                      <span>Menyelenggarakan proses pembelajaran aktif, kreatif, dan berbasis kearifan lokal.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                      <span>Mengembangkan potensi bakat akademik dan non-akademik siswa secara optimal.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                      <span>Mewujudkan tata kelola sarana prasarana sekolah yang tertib, bersih, dan berwawasan lingkungan hijau.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guru & Tenaga Kependidikan Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Dewan Guru & Tenaga Kependidikan</h3>
                  <p className="text-xs text-slate-500">Pendidik profesional yang berdedikasi membimbing putra-putri bangsa di SDN Tangerang 6.</p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  {users.length} Tenaga Pendidik
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {users.map((u) => (
                  <div
                    key={u.ID}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center text-sm font-black shrink-0">
                        {u.NAMA.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-slate-900 truncate" title={u.NAMA}>
                          {u.NAMA}
                        </h4>
                        <div className="text-[11px] text-emerald-800 font-semibold truncate">
                          {u.JABATAN || u.ROLE}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono">{u.NIP ? `NIP: ${u.NIP}` : 'Pegawai'}</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium text-slate-600">
                        {u.ROLE}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SARPRAS & FASILITAS TAB */}
        {activeNav === 'sarpras' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                  Transparansi Sarpras Sekolah
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  Inventaris & Fasilitas Pembelajaran SDN Tangerang 6
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar sarana prasarana sekolah tercatat di sistem SIPERSEDA dan diperbarui secara berkala.
                </p>
              </div>

              {/* Quick Search & Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari fasilitas / aset..."
                    value={facilitySearch}
                    onChange={(e) => setFacilitySearch(e.target.value)}
                    className="pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-emerald-700 w-48 sm:w-60"
                  />
                </div>

                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-emerald-700"
                >
                  <option value="ALL">Semua Ruangan ({assets.length})</option>
                  {rooms.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room Summary Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setRoomFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  roomFilter === 'ALL'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Semua Ruangan ({assets.length})
              </button>
              {rooms.map((r) => {
                const count = assets.filter((a) => a.LOKASI === r).length;
                return (
                  <button
                    key={r}
                    onClick={() => setRoomFilter(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      roomFilter === r
                        ? 'bg-emerald-800 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {r} ({count})
                  </button>
                );
              })}
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.KODE_ASET}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {asset.KODE_ASET}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          asset.KONDISI === 'BAIK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : asset.KONDISI === 'RUSAK RINGAN'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {asset.KONDISI}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-800 mt-2 line-clamp-1">{asset.NAMA_BARANG}</h4>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Kategori: <span className="font-medium text-slate-700">{asset.KIB_KATEGORI || asset.KATEGORI || 'KIB B'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin size={13} className="text-emerald-700" />
                      <span className="font-medium">{asset.LOKASI || 'Gudang / Sekolah'}</span>
                    </div>
                    <button
                      onClick={() => {
                        setVerificationInput(asset.KODE_ASET);
                        setActiveNav('verifikasi');
                        setVerifiedAsset(asset);
                      }}
                      className="text-emerald-800 hover:text-emerald-900 font-bold text-[11px] flex items-center gap-1"
                    >
                      <span>Cek Detail</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VERIFIKASI QR ASET TAB */}
        {activeNav === 'verifikasi' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                <QrCode size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Validasi Keaslian Aset & Inventaris Sekolah</h2>
              <p className="text-xs text-slate-500">
                Pindai stiker QR pada meja, proyektor, atau perangkat sekolah, atau masukkan kode inventaris untuk memverifikasi legalitas barang milik daerah.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleVerifyCode} className="flex gap-2 max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Masukkan Kode Aset (cth: AST-0001, BRG-0001)..."
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                className="flex-1 px-4 py-3 text-xs rounded-xl border border-slate-300 bg-white font-mono focus:outline-emerald-700 shadow-2xs"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Search size={15} />
                <span>Periksa</span>
              </button>
            </form>

            {searchError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold text-center max-w-xl mx-auto">
                {searchError}
              </div>
            )}

            {/* Verification Result Asset */}
            {verifiedAsset && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-300 shadow-xl max-w-2xl mx-auto space-y-5 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                      <ShieldCheck size={20} />
                    </span>
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                        Terverifikasi Resmi
                      </span>
                      <h3 className="text-base font-black text-slate-900">{verifiedAsset.NAMA_BARANG}</h3>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 px-2.5 py-1 rounded-lg">
                    {verifiedAsset.KODE_ASET}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Ruang / Lokasi</span>
                    <span className="font-bold text-slate-800">{verifiedAsset.LOKASI}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Kondisi Fisik</span>
                    <span className="font-bold text-emerald-700">{verifiedAsset.KONDISI}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Kategori Inventaris</span>
                    <span className="font-bold text-slate-800">{verifiedAsset.KIB_KATEGORI || verifiedAsset.KATEGORI || 'KIB B'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Tahun Perolehan</span>
                    <span className="font-bold text-slate-800">{verifiedAsset.TAHUN_PEROLEHAN || '2024'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-semibold block">Sumber Pengadaan</span>
                    <span className="font-bold text-slate-800">Dana BOS Reguler UPT SDN Tangerang 6</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 border border-slate-100 flex items-center justify-between">
                  <span>Satuan Kerja: Dinas Pendidikan Kota Tangerang</span>
                  <span className="font-mono text-emerald-700 font-bold">QR Valid</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BERITA & PRESTASI TAB */}
        {activeNav === 'berita' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                Kabar & Agenda
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Berita Kegiatan & Prestasi Siswa SDN Tangerang 6
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all">
                <div className="h-40 bg-gradient-to-br from-emerald-800 to-teal-900 p-5 flex flex-col justify-end text-white">
                  <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded w-fit mb-1">
                    Prestasi Siswa
                  </span>
                  <h3 className="text-sm font-bold leading-snug">Juara 1 Lomba Cerdas Cermat Sains Tingkat Kecamatan</h3>
                </div>
                <div className="p-5 text-xs text-slate-600 space-y-2">
                  <p>Tim siswa-siswi SDN Tangerang 6 berhasil meraih prestasi membanggakan dalam ajang Olimpiade Sains dan Literasi.</p>
                  <div className="text-[11px] text-slate-400 font-medium pt-2">24 Agustus 2026</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all">
                <div className="h-40 bg-gradient-to-br from-teal-800 to-slate-900 p-5 flex flex-col justify-end text-white">
                  <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded w-fit mb-1">
                    Sarpras & Fasilitas
                  </span>
                  <h3 className="text-sm font-bold leading-snug">Penerimaan & Distribusi 30 Unit Chromebook Bantuan BOS</h3>
                </div>
                <div className="p-5 text-xs text-slate-600 space-y-2">
                  <p>Pengadaan perangkat komputer baru telah selesai diverifikasi dan siap digunakan untuk ANBK dan pembelajaran digital.</p>
                  <div className="text-[11px] text-slate-400 font-medium pt-2">18 Agustus 2026</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all">
                <div className="h-40 bg-gradient-to-br from-amber-700 to-emerald-900 p-5 flex flex-col justify-end text-white">
                  <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded w-fit mb-1">
                    Lingkungan Sekolah
                  </span>
                  <h3 className="text-sm font-bold leading-snug">Aksi Bersih Lingkungan & Penanaman Pohon Adiwiyata</h3>
                </div>
                <div className="p-5 text-xs text-slate-600 space-y-2">
                  <p>Seluruh warga sekolah bergotong-royong merawat taman gizi dan green house guna menciptakan sekolah asri.</p>
                  <div className="text-[11px] text-slate-400 font-medium pt-2">10 Agustus 2026</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KONTAK TAB */}
        {activeNav === 'kontak' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                Layanan & Informasi
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Kontak & Lokasi SDN Tangerang 6
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
                <h3 className="text-base font-black text-slate-900">Informasi Kontak Resmi</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <MapPin size={18} className="text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 block">Alamat Sekolah</span>
                      <span className="text-slate-600">{config.ADDRESS || 'Jl. Nyimas Melati No. 2, Kel. Sukasari, Kec. Tangerang, Kota Tangerang, Banten 15118'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Mail size={18} className="text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 block">Email Resmi</span>
                      <span className="text-slate-600">{config.SCHOOL_EMAIL || 'sdntangerang6@tangerangkota.go.id'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Clock size={18} className="text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 block">Jam Operasional</span>
                      <span className="text-slate-600">Senin – Jumat: 07.00 – 15.30 WIB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fast Login CTA */}
              <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Akses Internal Satdik
                  </span>
                  <h3 className="text-lg font-black mt-1">Portal SIPERSEDA Pengurus & Guru</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Khusus Kepala Sekolah, Bendahara BOS, Pengurus Barang, dan Dewan Guru untuk pencatatan transaksi persediaan, SPB ATK, dan Berita Acara.
                  </p>
                </div>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <LogIn size={15} />
                  <span>LOGIN</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5 text-white font-black text-sm">
              <School size={20} className="text-emerald-400" />
              <span>SD NEGERI TANGERANG 6</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed max-w-md">
              UPT Satuan Pendidikan SD Negeri Tangerang 6 di bawah naungan Dinas Pendidikan Pemerintah Kota Tangerang. Berkomitmen membentuk insan beriman, berprestasi, dan berakhlak mulia.
            </p>
            <div className="text-[11px] text-slate-500">
              NPSN: {config.SCHOOL_NPSN || '20606016'} • Akreditasi A
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs mb-3">Tautan Pintas</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => setActiveNav('beranda')} className="hover:text-emerald-400">Beranda</button></li>
              <li><button onClick={() => setActiveNav('profil')} className="hover:text-emerald-400">Profil & Guru</button></li>
              <li><button onClick={() => setActiveNav('sarpras')} className="hover:text-emerald-400">Sarpras & Aset</button></li>
              <li><button onClick={() => setActiveNav('verifikasi')} className="hover:text-emerald-400">Validasi QR</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs mb-3">Sistem Informasi</h4>
            <div className="space-y-2 text-[11px]">
              <p>Sistem Informasi Persediaan & Aset Sekolah (SIPERSEDA).</p>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
              >
                <span>Masuk Portal Internal</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-900 text-center text-[11px] text-slate-600">
          © {new Date().getFullYear()} UPT Satuan Pendidikan SDN Tangerang 6. Hak Cipta Dilindungi Undang-Undang.
        </div>
      </footer>

      {/* LOGIN SELECTION MODAL — SIPERSEDA / Classroom / Admin */}
      {isLoginModalOpen && (
        <LoginSelectionModal
          onClose={() => setIsLoginModalOpen(false)}
          onEnterSiperseda={(user) => {
            setIsLoginModalOpen(false);
            onEnterApp(user);
          }}
          onEnterClassroom={() => {
            setIsLoginModalOpen(false);
            onEnterClassroom();
          }}
          onEnterAdmin={() => {
            setIsLoginModalOpen(false);
            onEnterAdmin();
          }}
        />
      )}
    </div>
  );
};
