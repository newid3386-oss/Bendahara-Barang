import React, { useState } from 'react';
import {
  BookOpen, Video, FileText, Download, Plus, Search, Filter, Trash2, ExternalLink,
  Sparkles, CheckCircle2, Bookmark, Eye, X
} from 'lucide-react';
import { Account, LearningMaterial } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';

interface ClassroomMaterialsViewProps {
  account: Account;
  onRefresh: () => void;
}

export const ClassroomMaterialsView: React.FC<ClassroomMaterialsViewProps> = ({ account, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<LearningMaterial | null>(null);

  // Create Material Form State
  const [matJudul, setMatJudul] = useState('');
  const [matMapel, setMatMapel] = useState('Tematik Terpadu');
  const [matDeskripsi, setMatDeskripsi] = useState('');
  const [matTipe, setMatTipe] = useState<'VIDEO' | 'EBOOK' | 'LKPD' | 'RANGKUMAN'>('EBOOK');
  const [matKelas, setMatKelas] = useState(account.KELAS || 'Kelas 1');
  const [matLink, setMatLink] = useState('');
  const [matRingkasan, setMatRingkasan] = useState('');

  const materials = classroomService.getMaterials(account.ROLE === 'SISWA' || isGuru ? account.KELAS : undefined);

  const filteredMaterials = materials.filter((m) => {
    if (selectedType !== 'ALL' && m.TIPE !== selectedType) return false;
    if (
      searchQuery &&
      !m.JUDUL.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !m.MAPEL.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !m.DESKRIPSI.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matJudul.trim()) return;

    classroomService.saveMaterial({
      KELAS: account.KELAS || matKelas,
      MAPEL: matMapel,
      JUDUL: matJudul,
      DESKRIPSI: matDeskripsi,
      TIPE: matTipe,
      URL_LINK: matLink || 'https://buku.kemdikbud.go.id',
      FILE_SIZE: matTipe === 'VIDEO' ? '12 Menit' : '2.1 MB',
      RINGKASAN_KONTEN: matRingkasan,
      GURU_NAMA: account.NAMA,
    });

    setMatJudul('');
    setMatDeskripsi('');
    setMatLink('');
    setMatRingkasan('');
    setShowCreateModal(false);
    onRefresh();
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm('Hapus bahan ajar ini?')) {
      classroomService.deleteMaterial(id);
      onRefresh();
    }
  };

  const getTypeIcon = (tipe: string) => {
    switch (tipe) {
      case 'VIDEO':
        return <Video size={18} className="text-rose-600" />;
      case 'LKPD':
        return <FileText size={18} className="text-amber-600" />;
      case 'RANGKUMAN':
        return <Bookmark size={18} className="text-emerald-600" />;
      default:
        return <BookOpen size={18} className="text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <BookOpen size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Bahan Ajar & Modul Digital (E-Library)</h2>
            <p className="text-xs text-slate-500">
              Koleksi buku teks Kurikulum Merdeka, LKPD interaktif, video belajar, dan rangkuman materi
            </p>
          </div>
        </div>

        {(isGuru || isKepsek) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-95"
          >
            <Plus size={16} /> Unggah Bahan Ajar / Modul
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Type Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'Semua Koleksi' },
            { id: 'EBOOK', label: 'E-Book / Modul PDF' },
            { id: 'VIDEO', label: 'Video Pembelajaran' },
            { id: 'LKPD', label: 'Lembar Kerja (LKPD)' },
            { id: 'RANGKUMAN', label: 'Rangkuman Materi' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedType === t.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari materi, mapel, judul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-64"
          />
        </div>
      </div>

      {/* Materials Cards Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700">Tidak Ada Bahan Ajar Ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1">Coba ubah kata kunci pencarian atau filter kategori.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((mat) => (
            <div
              key={mat.ID}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                      {getTypeIcon(mat.TIPE)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{mat.MAPEL}</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                        {mat.KELAS}
                      </span>
                    </div>
                  </div>

                  {(isGuru || isKepsek) && (
                    <button
                      onClick={() => handleDeleteMaterial(mat.ID)}
                      title="Hapus Bahan Ajar"
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-900 mb-1 leading-snug">{mat.JUDUL}</h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{mat.DESKRIPSI}</p>

                {mat.RINGKASAN_KONTEN && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 mb-4 line-clamp-2">
                    <span className="font-bold text-slate-700">Ringkasan: </span>
                    {mat.RINGKASAN_KONTEN}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">{mat.FILE_SIZE || 'Format Digital'}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewMaterial(mat)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  >
                    <Eye size={13} /> Baca / Buka
                  </button>

                  {mat.URL_LINK && (
                    <a
                      href={mat.URL_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                      title="Buka Link Sumber Kemendikbud"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PREVIEW MATERIAL MODAL */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  {getTypeIcon(previewMaterial.TIPE)}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    {previewMaterial.MAPEL} • {previewMaterial.KELAS}
                  </span>
                  <h3 className="font-black text-base text-slate-800">{previewMaterial.JUDUL}</h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">{previewMaterial.DESKRIPSI}</p>

              {previewMaterial.RINGKASAN_KONTEN && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-xs text-slate-800 mb-2 flex items-center gap-1.5">
                    <Bookmark size={14} className="text-blue-600" /> Ringkasan Isi Pembelajaran:
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {previewMaterial.RINGKASAN_KONTEN}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-100 p-3 rounded-xl">
                <span>Pengunggah: <b>{previewMaterial.GURU_NAMA}</b></span>
                <span>Ukuran / Estimasi: <b>{previewMaterial.FILE_SIZE}</b></span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tutup
              </button>
              {previewMaterial.URL_LINK && (
                <a
                  href={previewMaterial.URL_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  <ExternalLink size={14} /> Kunjungi Sumber Materi Digital
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE MATERIAL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-800">Tambah Bahan Ajar & Modul Digital</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Bahan Ajar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modul Ajar Tematik: Siklus Air & Cuaca"
                  value={matJudul}
                  onChange={(e) => setMatJudul(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: IPAS / Matematika"
                    value={matMapel}
                    onChange={(e) => setMatMapel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Tipe</label>
                  <select
                    value={matTipe}
                    onChange={(e) => setMatTipe(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="EBOOK">📚 E-Book / Modul PDF</option>
                    <option value="VIDEO">🎥 Video Pembelajaran</option>
                    <option value="LKPD">📝 Lembar Kerja (LKPD)</option>
                    <option value="RANGKUMAN">🔖 Rangkuman Catatan</option>
                  </select>
                </div>
              </div>

              {!account.KELAS && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Kelas</label>
                  <select
                    value={matKelas}
                    onChange={(e) => setMatKelas(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Semua Kelas'].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan capaian materi yang dibahas..."
                  value={matDeskripsi}
                  onChange={(e) => setMatDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ringkasan Materi / Poin Penting</label>
                <textarea
                  rows={3}
                  placeholder="Rangkuman teks yang dapat langsung dibaca siswa..."
                  value={matRingkasan}
                  onChange={(e) => setMatRingkasan(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tautan / Link Sumber (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={matLink}
                  onChange={(e) => setMatLink(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20"
                >
                  Simpan Bahan Ajar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
