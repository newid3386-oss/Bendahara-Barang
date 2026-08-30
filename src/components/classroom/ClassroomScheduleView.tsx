import React, { useState } from 'react';
import {
  Calendar, Clock, School, Plus, Trash2, MapPin, User, Sparkles, BookOpen
} from 'lucide-react';
import { Account, ClassScheduleItem } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';

interface ClassroomScheduleViewProps {
  account: Account;
  onRefresh: () => void;
}

export const ClassroomScheduleView: React.FC<ClassroomScheduleViewProps> = ({ account, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';

  const [selectedKelas, setSelectedKelas] = useState<string>(account.KELAS || 'Kelas 1');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [schHari, setSchHari] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Senin');
  const [schMulai, setSchMulai] = useState('07:30');
  const [schSelesai, setSchSelesai] = useState('09:00');
  const [schMapel, setSchMapel] = useState('Tematik Terpadu');
  const [schGuru, setSchGuru] = useState(account.NAMA || 'Guru Kelas');
  const [schRuangan, setSchRuangan] = useState('Ruang Kelas 1');

  const days: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu')[] = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];

  const targetClass = account.ROLE === 'SISWA' || isGuru ? (account.KELAS || 'Kelas 1') : selectedKelas;
  const schedules = classroomService.getSchedules(targetClass);

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schMapel.trim()) return;

    classroomService.saveSchedule({
      KELAS: targetClass,
      HARI: schHari,
      JAM_MULAI: schMulai,
      JAM_SELESAI: schSelesai,
      MAPEL: schMapel,
      GURU_NAMA: schGuru,
      RUANGAN: schRuangan,
    });

    setSchMapel('');
    setShowCreateModal(false);
    onRefresh();
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Hapus mata pelajaran dari jadwal ini?')) {
      classroomService.deleteSchedule(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Calendar size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Jadwal Pelajaran & Kalender Akademik</h2>
            <p className="text-xs text-slate-500">
              Struktur alokasi jam belajar mingguan dan kegiatan sekolah {targetClass} SDN Tangerang 6
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!account.KELAS && (
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          )}

          {(isGuru || isKepsek) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition active:scale-95"
            >
              <Plus size={16} /> Tambah Jam Pelajaran
            </button>
          )}
        </div>
      </div>

      {/* Days Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedDay('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedDay === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua Hari (Senin - Jumat)
        </button>
        {days.slice(0, 5).map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedDay === d
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.slice(0, 5).map((day) => {
          if (selectedDay !== 'ALL' && selectedDay !== day) return null;

          const daySchedules = schedules
            .filter((s) => s.HARI === day)
            .sort((a, b) => a.JAM_MULAI.localeCompare(b.JAM_MULAI));

          return (
            <div
              key={day}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <h3 className="font-black text-sm text-slate-800 uppercase tracking-wide">{day}</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{daySchedules.length} Sesi Mapel</span>
                </div>

                {daySchedules.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Belum ada jadwal terdaftar untuk hari {day}.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {daySchedules.map((item) => (
                      <div
                        key={item.ID}
                        className="bg-slate-50 hover:bg-indigo-50/40 p-3 rounded-xl border border-slate-100 transition group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1.5 text-indigo-700 font-mono font-bold text-[11px]">
                            <Clock size={12} />
                            <span>
                              {item.JAM_MULAI} - {item.JAM_SELESAI}
                            </span>
                          </div>

                          {(isGuru || isKepsek) && (
                            <button
                              onClick={() => handleDeleteSchedule(item.ID)}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition"
                              title="Hapus"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>

                        <h4 className="font-bold text-xs text-slate-800 mt-1 leading-snug">{item.MAPEL}</h4>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-200/50">
                          <span className="flex items-center gap-1">
                            <User size={10} /> {item.GURU_NAMA}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin size={10} /> {item.RUANGAN}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Academic Calendar Milestones Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-amber-400" />
          <h3 className="font-black text-sm tracking-wide">Agenda Penting Kalender Akademik 2026/2027</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/10 p-3 rounded-xl border border-white/10">
            <span className="text-[10px] text-amber-300 font-bold block">15 - 20 September 2026</span>
            <span className="font-bold text-white block mt-0.5">Penilaian Tengah Semester (PTS)</span>
            <span className="text-[10px] text-slate-300">Ujian CBT serentak</span>
          </div>

          <div className="bg-white/10 p-3 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-300 font-bold block">10 - 15 Oktober 2026</span>
            <span className="font-bold text-white block mt-0.5">Pekan Literasi & Proyek P5</span>
            <span className="text-[10px] text-slate-300">Gelar karya siswa</span>
          </div>

          <div className="bg-white/10 p-3 rounded-xl border border-white/10">
            <span className="text-[10px] text-blue-300 font-bold block">01 - 10 Desember 2026</span>
            <span className="font-bold text-white block mt-0.5">Penilaian Akhir Semester (PAS)</span>
            <span className="text-[10px] text-slate-300">Evaluasi kurikulum</span>
          </div>

          <div className="bg-white/10 p-3 rounded-xl border border-white/10">
            <span className="text-[10px] text-purple-300 font-bold block">19 Desember 2026</span>
            <span className="font-bold text-white block mt-0.5">Pembagian E-Rapor Semester</span>
            <span className="text-[10px] text-slate-300">Pertemuan wali murid</span>
          </div>
        </div>
      </div>

      {/* CREATE SCHEDULE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-800">Tambah Sesi Jam Pelajaran</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hari</label>
                <select
                  value={schHari}
                  onChange={(e) => setSchHari(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={schMulai}
                    onChange={(e) => setSchMulai(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={schSelesai}
                    onChange={(e) => setSchSelesai(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tematik (Bahasa Indonesia & Literasi)"
                  value={schMapel}
                  onChange={(e) => setSchMapel(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Guru Pengampu</label>
                <input
                  type="text"
                  required
                  value={schGuru}
                  onChange={(e) => setSchGuru(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ruangan / Tempat</label>
                <input
                  type="text"
                  required
                  value={schRuangan}
                  onChange={(e) => setSchRuangan(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
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
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
