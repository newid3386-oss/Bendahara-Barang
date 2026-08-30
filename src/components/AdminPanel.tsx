import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, LogOut, Plus, Search, X, Edit2, Trash2,
  KeyRound, School, GraduationCap, Settings, BookOpen, CheckCircle2, Ban,
  Lock, Unlock, AlertTriangle, ArrowRight, ArrowLeftRight, Check, UserPlus,
} from 'lucide-react';
import { accountService, STANDARD_CLASSES } from '../services/accountService';
import { Account, SystemType, AccountRole } from '../types/classroom';

interface AdminPanelProps {
  onLogout: () => void;
}

type AdminTab = 'overview' | 'grouping' | 'siperseda' | 'classroom' | 'admin';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [admin, setAdmin] = useState<Account | null>(accountService.getActiveAdminAccount());
  const [tab, setTab] = useState<AdminTab>('overview');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('Semua');
  const [notification, setNotification] = useState<string | null>(null);

  // Transfer student modal state
  const [transferSiswa, setTransferSiswa] = useState<Account | null>(null);
  const [newTargetClass, setNewTargetClass] = useState<string>('Kelas 1');

  useEffect(() => {
    accountService.initAccounts();
    loadAccounts();
  }, [tab]);

  const loadAccounts = () => {
    if (tab === 'overview' || tab === 'grouping') {
      setAccounts(accountService.getAccounts());
    } else {
      const sistem = tab === 'siperseda' ? 'SIPERSEDA' : tab === 'classroom' ? 'CLASSROOM' : 'ADMIN';
      setAccounts(accountService.getAccounts(sistem as SystemType));
    }
  };

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  if (!admin) {
    onLogout();
    return null;
  }

  const filtered = accounts.filter(
    (a) =>
      a.NAMA.toLowerCase().includes(search.toLowerCase()) ||
      a.USERNAME.toLowerCase().includes(search.toLowerCase()) ||
      a.EMAIL.toLowerCase().includes(search.toLowerCase()) ||
      (a.KELAS && a.KELAS.toLowerCase().includes(search.toLowerCase()))
  );

  const allAccounts = accountService.getAccounts();
  const classesSummary = accountService.getClassSummary();
  const stats = {
    siperseda: allAccounts.filter((a) => a.SISTEM === 'SIPERSEDA').length,
    classroom: allAccounts.filter((a) => a.SISTEM === 'CLASSROOM').length,
    admin: allAccounts.filter((a) => a.SISTEM === 'ADMIN').length,
    siswa: allAccounts.filter((a) => a.ROLE === 'SISWA').length,
    guru: allAccounts.filter((a) => a.ROLE === 'GURU').length,
    lockedGurus: allAccounts.filter((a) => a.ROLE === 'GURU' && a.KELAS_LOCKED).length,
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus akun ini? Tindakan tidak dapat dibatalkan.')) {
      accountService.deleteAccount(id);
      loadAccounts();
      showNotify('Akun berhasil dihapus.');
    }
  };

  const handleUnlockTeacher = (guru: Account) => {
    if (confirm(`Buka kunci kelas untuk Guru: ${guru.NAMA}? Setelah dibuka, guru dapat memilih kembali kelas mengajar pada saat login Classroom berikutnya.`)) {
      accountService.unlockTeacherClass(guru.ID, admin.USERNAME);
      loadAccounts();
      showNotify(`Kunci kelas ${guru.NAMA} berhasil DIBUKA. Guru dapat memilih kelas baru saat login.`);
    }
  };

  const handleLockTeacher = (guru: Account) => {
    if (!guru.KELAS) {
      alert('Tentukan kelas untuk guru ini terlebih dahulu sebelum mengunci.');
      return;
    }
    accountService.lockTeacherClass(guru.ID, guru.KELAS);
    loadAccounts();
    showNotify(`Kelas ${guru.NAMA} berhasil DIKUNCI pada ${guru.KELAS}.`);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSiswa || !newTargetClass) return;
    accountService.updateStudentClass(transferSiswa.ID, newTargetClass);
    loadAccounts();
    showNotify(`Siswa ${transferSiswa.NAMA} berhasil dipindahkan ke ${newTargetClass}.`);
    setTransferSiswa(null);
  };

  const tabs: { id: AdminTab; label: string; icon: any; color: string; badge?: string }[] = [
    { id: 'overview', label: 'Ringkasan', icon: ShieldCheck, color: 'text-slate-700' },
    { id: 'grouping', label: 'Pengelompokan Kelas & Siswa', icon: School, color: 'text-blue-700', badge: 'Fitur Utama' },
    { id: 'classroom', label: 'Akun Classroom', icon: BookOpen, color: 'text-indigo-700' },
    { id: 'siperseda', label: 'Akun SIPERSEDA', icon: School, color: 'text-emerald-700' },
    { id: 'admin', label: 'Akun Admin', icon: Settings, color: 'text-slate-800' },
  ];

  const currentSistem: SystemType | null =
    tab === 'siperseda' ? 'SIPERSEDA' : tab === 'classroom' ? 'CLASSROOM' : tab === 'admin' ? 'ADMIN' : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Bar */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white sticky top-0 z-30 shadow-lg">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700/50 border border-slate-500/40 flex items-center justify-center shadow-inner">
              <ShieldCheck size={22} className="text-slate-200" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight leading-none">Admin Control Center</h1>
              <span className="text-[10px] text-slate-400 font-semibold">Manajemen Kelas, Siswa, Guru & Akun Sistem</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold leading-none">{admin.NAMA}</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">Super Administrator</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-700/50 border border-slate-500/40 flex items-center justify-center font-bold text-sm">
              {admin.NAMA.charAt(0)}
            </div>
            <button onClick={onLogout} className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-slate-200 hover:text-white transition-colors" title="Keluar">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 sticky top-16 z-20">
        <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSearch(''); }}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
                {t.badge && (
                  <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Pengelompokan Kelas" value={STANDARD_CLASSES.length} icon={School} color="text-blue-700 bg-blue-100" onClick={() => setTab('grouping')} />
              <StatCard label="Siswa Terkelompok" value={stats.siswa} icon={Users} color="text-indigo-700 bg-indigo-100" onClick={() => setTab('grouping')} />
              <StatCard label="Guru Terkunci (1x)" value={stats.lockedGurus} icon={Lock} color="text-emerald-700 bg-emerald-100" onClick={() => setTab('grouping')} />
              <StatCard label="Total Akun Sistem" value={allAccounts.length} icon={ShieldCheck} color="text-slate-800 bg-slate-200" />
            </div>

            {/* Quick Summary of Classes */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <School size={18} className="text-blue-700" /> Ringkasan Pengelompokan Kelas & Guru
                  </h3>
                  <p className="text-xs text-slate-500">Status sinkronisasi siswa dan penguncian kelas guru SDN Tangerang 6</p>
                </div>
                <button
                  onClick={() => setTab('grouping')}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1"
                >
                  Kelola Kelas & Siswa <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classesSummary.map((c) => {
                  const teacher = c.teachers[0];
                  return (
                    <div key={c.kelas} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-400 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-sm text-slate-900">{c.kelas}</span>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {c.studentCount} Siswa
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mb-2">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Guru Pengampu:</div>
                        {teacher ? (
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <span className="font-bold text-slate-800 truncate">{teacher.NAMA}</span>
                            {teacher.KELAS_LOCKED ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                <Lock size={9} /> Terkunci
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                <Unlock size={9} /> Terbuka
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum ada guru</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* GROUPING & CLASS MANAGEMENT TAB */}
        {tab === 'grouping' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <School size={20} className="text-blue-700" />
                  Sistem Pengelompokan Kelas & Siswa
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola alokasi siswa per kelas dan kontrol status penguncian 1x untuk akun Guru Classroom
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditAccount({
                      ID: '',
                      NAMA: '',
                      EMAIL: '',
                      USERNAME: '',
                      PASSWORD: 'siswa123',
                      ROLE: 'SISWA',
                      SISTEM: 'CLASSROOM',
                      STATUS: 'AKTIF',
                      KELAS: 'Kelas 1',
                      CREATED_AT: new Date().toISOString(),
                    });
                    setShowForm(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus size={14} /> Tambah Siswa Baru
                </button>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-blue-800">
                <Lock size={14} /> Mekanisme Kerja Pengelompokan Kelas & Kunci Guru:
              </div>
              <p>
                • <strong>Guru Otomatis Tersinkron:</strong> Saat Guru login dan memilih kelas 1x, kelas langsung terkunci. Seluruh siswa pada kelas tersebut akan langsung masuk otomatis ke Classroom Guru.
              </p>
              <p>
                • <strong>Buka Kunci (Admin Only):</strong> Jika guru perlu berpindah kelas, klik tombol <span className="font-bold text-amber-800">"Buka Kunci"</span> di bawah ini. Guru akan diminta memilih kelas kembali pada login berikutnya.
              </p>
              <p>
                • <strong>Pindah Siswa:</strong> Anda dapat memindahkan siswa antar kelas kapan saja dengan tombol <span className="font-bold text-blue-800">"Pindah Kelas"</span>.
              </p>
            </div>

            {/* Classes Detail Grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Status Kelas 1 s/d Kelas 6 SDN Tangerang 6
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classesSummary.map((c) => {
                  const teacher = c.teachers[0];
                  return (
                    <div key={c.kelas} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        {/* Class Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                          <div>
                            <span className="font-black text-base text-slate-900">{c.kelas}</span>
                            <span className="text-[10px] text-slate-400 font-bold block">Tahun Ajaran 2026/2027</span>
                          </div>
                          <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 font-black text-xs">
                            {c.studentCount} Siswa
                          </span>
                        </div>

                        {/* Teacher Info & Lock Actions */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-3">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Guru Pengampu:
                          </div>
                          {teacher ? (
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-xs font-bold text-slate-900">{teacher.NAMA}</div>
                                  <div className="text-[10px] text-slate-500">NIP: {teacher.NIP || '-'} • @{teacher.USERNAME}</div>
                                </div>
                                {teacher.KELAS_LOCKED ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                                    <Lock size={10} /> Terkunci (1x)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 shrink-0">
                                    <Unlock size={10} /> Terbuka
                                  </span>
                                )}
                              </div>

                              {/* Lock / Unlock Buttons */}
                              <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5">
                                {teacher.KELAS_LOCKED ? (
                                  <button
                                    onClick={() => handleUnlockTeacher(teacher)}
                                    className="w-full py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                                  >
                                    <Unlock size={12} /> Buka Kunci Guru
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleLockTeacher(teacher)}
                                    className="w-full py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                                  >
                                    <Lock size={12} /> Kunci Kelas Guru
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 py-1 italic flex items-center justify-between">
                              <span>Belum ada guru pengampu</span>
                            </div>
                          )}
                        </div>

                        {/* Students in this class preview */}
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span>Daftar Siswa ({c.students.length})</span>
                          </div>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {c.students.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic py-2">Belum ada siswa di kelas ini.</p>
                            ) : (
                              c.students.map((s) => (
                                <div key={s.ID} className="p-2 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-2 hover:border-blue-300">
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-800 truncate">{s.NAMA}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">NIS: {s.NIP || '-'}</div>
                                  </div>
                                  <button
                                    onClick={() => { setTransferSiswa(s); setNewTargetClass(c.kelas); }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50"
                                    title="Pindahkan Siswa ke Kelas Lain"
                                  >
                                    <ArrowLeftRight size={13} />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Add Student Button */}
                      <button
                        onClick={() => {
                          setEditAccount({
                            ID: '',
                            NAMA: '',
                            EMAIL: '',
                            USERNAME: '',
                            PASSWORD: 'siswa123',
                            ROLE: 'SISWA',
                            SISTEM: 'CLASSROOM',
                            STATUS: 'AKTIF',
                            KELAS: c.kelas,
                            CREATED_AT: new Date().toISOString(),
                          });
                          setShowForm(true);
                        }}
                        className="mt-3 w-full py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                      >
                        <Plus size={13} /> Tambah Siswa ke {c.kelas}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SIPERSEDA, CLASSROOM & ADMIN ACCOUNT TABS */}
        {tab !== 'overview' && tab !== 'grouping' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-black text-slate-900">Akun {currentSistem}</h2>
                <p className="text-xs text-slate-500">
                  {currentSistem === 'SIPERSEDA' && 'Operator & Kepala Sekolah'}
                  {currentSistem === 'CLASSROOM' && 'Siswa, Guru & Kepala Sekolah'}
                  {currentSistem === 'ADMIN' && 'Administrator sistem'}
                </p>
              </div>
              <button
                onClick={() => { setEditAccount(null); setShowForm(true); }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={14} /> Tambah Akun
              </button>
            </div>

            <div className="relative max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, username, email, kelas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-slate-600"
              />
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              {filtered.length === 0 ? (
                <div className="p-10 text-center">
                  <Users size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Tidak ada akun ditemukan.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filtered.map((a) => (
                    <div key={a.ID} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {a.NAMA.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">{a.NAMA}</span>
                            {a.STATUS === 'AKTIF' ? (
                              <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-0.5"><CheckCircle2 size={10} /> Aktif</span>
                            ) : (
                              <span className="text-[9px] font-bold text-rose-600 flex items-center gap-0.5"><Ban size={10} /> Nonaktif</span>
                            )}
                            {a.ROLE === 'GURU' && (
                              a.KELAS_LOCKED ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                  <Lock size={9} /> Kelas Terkunci ({a.KELAS})
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                  <Unlock size={9} /> Kunci Terbuka
                                </span>
                              )
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            @{a.USERNAME} • {a.EMAIL} {a.NIP ? `• NIP/NIS: ${a.NIP}` : ''}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              a.ROLE === 'ADMIN' ? 'bg-slate-200 text-slate-800' :
                              a.ROLE === 'KEPALA SEKOLAH' ? 'bg-purple-100 text-purple-800' :
                              a.ROLE === 'GURU' ? 'bg-blue-100 text-blue-800' :
                              a.ROLE === 'SISWA' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>{a.ROLE}</span>
                            {a.KELAS && <span className="text-[10px] font-bold text-blue-700">{a.KELAS}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Teacher Lock / Unlock Toggle Button */}
                        {a.ROLE === 'GURU' && (
                          a.KELAS_LOCKED ? (
                            <button
                              onClick={() => handleUnlockTeacher(a)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] flex items-center gap-1"
                              title="Buka Kunci Kelas Guru"
                            >
                              <Unlock size={11} /> Buka Kunci
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLockTeacher(a)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center gap-1"
                              title="Kunci Kelas Guru"
                            >
                              <Lock size={11} /> Kunci Kelas
                            </button>
                          )
                        )}

                        <button onClick={() => { setEditAccount(a); setShowForm(true); }} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(a.ID)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: TRANSFER STUDENT CLASS */}
      {transferSiswa && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleExecuteTransfer} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <ArrowLeftRight size={16} />
                </div>
                <h3 className="text-sm font-black text-slate-900">Pindahkan Kelas Siswa</h3>
              </div>
              <button type="button" onClick={() => setTransferSiswa(null)}><X size={18} className="text-slate-400" /></button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-800">{transferSiswa.NAMA}</div>
              <div className="text-slate-500 text-[11px]">NIS: {transferSiswa.NIP || '-'} • Kelas Saat Ini: <strong className="text-blue-700">{transferSiswa.KELAS || '-'}</strong></div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Pilih Kelas Baru:</label>
              <select
                value={newTargetClass}
                onChange={(e) => setNewTargetClass(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-blue-600 font-bold"
              >
                {STANDARD_CLASSES.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setTransferSiswa(null)} className="px-4 py-2 text-xs font-bold text-slate-500">Batal</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1">
                <Check size={14} /> Pindahkan Siswa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ACCOUNT FORM (ADD/EDIT) */}
      {showForm && (
        <AccountFormModal
          sistem={currentSistem || 'CLASSROOM'}
          account={editAccount}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadAccounts(); showNotify('Data akun berhasil disimpan.'); }}
        />
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: any; color: string; onClick?: () => void }> = ({ label, value, icon: Icon, color, onClick }) => (
  <button onClick={onClick} disabled={!onClick} className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-xs text-left ${onClick ? 'hover:shadow-md hover:border-blue-300 cursor-pointer' : ''}`}>
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
      <Icon size={20} />
    </div>
    <div className="text-2xl font-black text-slate-900">{value}</div>
    <div className="text-[11px] text-slate-500 font-medium mt-0.5">{label}</div>
  </button>
);

const AccountFormModal: React.FC<{ sistem: SystemType; account: Account | null; onClose: () => void; onSaved: () => void }> = ({ sistem, account, onClose, onSaved }) => {
  const [nama, setNama] = useState(account?.NAMA || '');
  const [email, setEmail] = useState(account?.EMAIL || '');
  const [username, setUsername] = useState(account?.USERNAME || '');
  const [password, setPassword] = useState(account?.PASSWORD || '');
  const [role, setRole] = useState<AccountRole>(account?.ROLE || (sistem === 'CLASSROOM' ? 'GURU' : sistem === 'SIPERSEDA' ? 'OPERATOR' : 'ADMIN'));
  const [status, setStatus] = useState<'AKTIF' | 'NONAKTIF'>(account?.STATUS || 'AKTIF');
  const [nip, setNip] = useState(account?.NIP || '');
  const [kelas, setKelas] = useState(account?.KELAS || 'Kelas 1');
  const [kelasLocked, setKelasLocked] = useState<boolean>(account?.KELAS_LOCKED || false);

  const roleOptions: AccountRole[] =
    sistem === 'SIPERSEDA' ? ['OPERATOR', 'KEPALA SEKOLAH'] :
    sistem === 'CLASSROOM' ? ['SISWA', 'GURU', 'KEPALA SEKOLAH'] :
    ['ADMIN'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !username.trim()) return;
    accountService.saveAccount({
      ...(account ? { ID: account.ID } : {}),
      NAMA: nama,
      EMAIL: email || `${username.toLowerCase()}@sdntangerang6.sch.id`,
      USERNAME: username,
      PASSWORD: password || '123456',
      ROLE: role,
      SISTEM: sistem,
      STATUS: status,
      NIP: nip,
      KELAS: role === 'SISWA' || role === 'GURU' ? kelas : '',
      KELAS_LOCKED: role === 'GURU' ? kelasLocked : false,
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">{account && account.ID ? 'Edit Akun' : 'Tambah Akun'} {sistem}</h3>
          <button type="button" onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Lengkap</label>
          <input value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Kata Sandi</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600 font-mono" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`${username || 'user'}@sdntangerang6.sch.id`} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as AccountRole)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600">
              {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Status Akun</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600">
              <option value="AKTIF">AKTIF</option>
              <option value="NONAKTIF">NONAKTIF</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">NIP {role === 'SISWA' ? '(NIS Siswa)' : ''}</label>
            <input value={nip} onChange={(e) => setNip(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600" />
          </div>
          {(sistem === 'CLASSROOM' || role === 'SISWA' || role === 'GURU') && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Kelas Pengampu / Belajar</label>
              <select value={kelas} onChange={(e) => setKelas(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600">
                {STANDARD_CLASSES.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          )}
        </div>

        {role === 'GURU' && (
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kelasLocked}
                onChange={(e) => setKelasLocked(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-xs font-bold text-slate-700">Kunci Kelas Ini Sekarang (Guru Terkunci 1x)</span>
            </label>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500">Batal</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5"><KeyRound size={12} /> Simpan</button>
        </div>
      </form>
    </div>
  );
};
