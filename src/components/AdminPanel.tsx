import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, LogOut, Plus, Search, X, Edit2, Trash2,
  KeyRound, School, GraduationCap, Settings, BookOpen, CheckCircle2, Ban,
} from 'lucide-react';
import { accountService } from '../services/accountService';
import { Account, SystemType, AccountRole } from '../types/classroom';

interface AdminPanelProps {
  onLogout: () => void;
}

type AdminTab = 'overview' | 'siperseda' | 'classroom' | 'admin';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [admin, setAdmin] = useState<Account | null>(accountService.getActiveAdminAccount());
  const [tab, setTab] = useState<AdminTab>('overview');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  useEffect(() => {
    accountService.initAccounts();
    loadAccounts();
  }, [tab]);

  const loadAccounts = () => {
    if (tab === 'overview') {
      setAccounts(accountService.getAccounts());
    } else {
      const sistem = tab === 'siperseda' ? 'SIPERSEDA' : tab === 'classroom' ? 'CLASSROOM' : 'ADMIN';
      setAccounts(accountService.getAccounts(sistem as SystemType));
    }
  };

  if (!admin) {
    onLogout();
    return null;
  }

  const filtered = accounts.filter(
    (a) =>
      a.NAMA.toLowerCase().includes(search.toLowerCase()) ||
      a.USERNAME.toLowerCase().includes(search.toLowerCase()) ||
      a.EMAIL.toLowerCase().includes(search.toLowerCase())
  );

  const allAccounts = accountService.getAccounts();
  const stats = {
    siperseda: allAccounts.filter((a) => a.SISTEM === 'SIPERSEDA').length,
    classroom: allAccounts.filter((a) => a.SISTEM === 'CLASSROOM').length,
    admin: allAccounts.filter((a) => a.SISTEM === 'ADMIN').length,
    siswa: allAccounts.filter((a) => a.ROLE === 'SISWA').length,
    guru: allAccounts.filter((a) => a.ROLE === 'GURU').length,
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus akun ini? Tindakan tidak dapat dibatalkan.')) {
      accountService.deleteAccount(id);
      loadAccounts();
    }
  };

  const tabs: { id: AdminTab; label: string; icon: any; color: string }[] = [
    { id: 'overview', label: 'Ringkasan', icon: ShieldCheck, color: 'text-slate-700' },
    { id: 'siperseda', label: 'Akun SIPERSEDA', icon: School, color: 'text-emerald-700' },
    { id: 'classroom', label: 'Akun Classroom', icon: BookOpen, color: 'text-blue-700' },
    { id: 'admin', label: 'Akun Admin', icon: Settings, color: 'text-slate-800' },
  ];

  const currentSistem: SystemType | null = tab === 'siperseda' ? 'SIPERSEDA' : tab === 'classroom' ? 'CLASSROOM' : tab === 'admin' ? 'ADMIN' : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Bar */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white sticky top-0 z-30 shadow-lg">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700/50 border border-slate-500/40 flex items-center justify-center">
              <ShieldCheck size={22} className="text-slate-200" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight leading-none">Admin Management Panel</h1>
              <span className="text-[10px] text-slate-400 font-semibold">Manajemen Akun SIPERSEDA & Classroom</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold leading-none">{admin.NAMA}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Administrator</div>
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
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSearch(''); }}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  tab === t.id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Akun SIPERSEDA" value={stats.siperseda} icon={School} color="text-emerald-700 bg-emerald-100" onClick={() => setTab('siperseda')} />
              <StatCard label="Akun Classroom" value={stats.classroom} icon={BookOpen} color="text-blue-700 bg-blue-100" onClick={() => setTab('classroom')} />
              <StatCard label="Akun Admin" value={stats.admin} icon={Settings} color="text-slate-800 bg-slate-200" onClick={() => setTab('admin')} />
              <StatCard label="Total Akun" value={allAccounts.length} icon={Users} color="text-indigo-700 bg-indigo-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><School size={16} className="text-emerald-700" /> SIPERSEDA</h3>
                <p className="text-xs text-slate-500 mb-3">Diakses oleh Operator dan Kepala Sekolah untuk mengelola persediaan, aset, dan persetujuan.</p>
                <div className="flex gap-2">
                  <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg font-bold">Operator</span>
                  <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg font-bold">Kepala Sekolah</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><BookOpen size={16} className="text-blue-700" /> Classroom</h3>
                <p className="text-xs text-slate-500 mb-3">Pembelajaran online untuk siswa, guru membuat laporan yang dinilai kepala sekolah.</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[11px] bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg font-bold">Siswa</span>
                  <span className="text-[11px] bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg font-bold">Guru</span>
                  <span className="text-[11px] bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg font-bold">Kepala Sekolah</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab !== 'overview' && (
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
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Plus size={14} /> Tambah Akun
              </button>
            </div>

            <div className="relative max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, username, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-slate-600"
              />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {filtered.length === 0 ? (
                <div className="p-10 text-center">
                  <Users size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Tidak ada akun ditemukan.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filtered.map((a) => (
                    <div key={a.ID} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {a.NAMA.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 truncate">{a.NAMA}</span>
                            {a.STATUS === 'AKTIF' ? (
                              <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-0.5"><CheckCircle2 size={10} /> Aktif</span>
                            ) : (
                              <span className="text-[9px] font-bold text-rose-600 flex items-center gap-0.5"><Ban size={10} /> Nonaktif</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">@{a.USERNAME} • {a.EMAIL}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              a.ROLE === 'ADMIN' ? 'bg-slate-200 text-slate-800' :
                              a.ROLE === 'KEPALA SEKOLAH' ? 'bg-purple-100 text-purple-800' :
                              a.ROLE === 'GURU' ? 'bg-blue-100 text-blue-800' :
                              a.ROLE === 'SISWA' ? 'bg-amber-100 text-amber-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>{a.ROLE}</span>
                            {a.KELAS && <span className="text-[10px] text-slate-400">{a.KELAS}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
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

      {showForm && currentSistem && (
        <AccountFormModal
          sistem={currentSistem}
          account={editAccount}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadAccounts(); }}
        />
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: any; color: string; onClick?: () => void }> = ({ label, value, icon: Icon, color, onClick }) => (
  <button onClick={onClick} disabled={!onClick} className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-left ${onClick ? 'hover:shadow-md hover:border-slate-300 cursor-pointer' : ''}`}>
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
  const [kelas, setKelas] = useState(account?.KELAS || '');

  const roleOptions: AccountRole[] =
    sistem === 'SIPERSEDA' ? ['OPERATOR', 'KEPALA SEKOLAH'] :
    sistem === 'CLASSROOM' ? ['SISWA', 'GURU', 'KEPALA SEKOLAH'] :
    ['ADMIN'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !username.trim()) return;
    accountService.saveAccount({
      ...(account ? { ID: account.ID } : {}),
      NAMA: nama, EMAIL: email, USERNAME: username, PASSWORD: password,
      ROLE: role, SISTEM: sistem, STATUS: status, NIP: nip, KELAS: kelas,
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">{account ? 'Edit Akun' : 'Tambah Akun'} {sistem}</h3>
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
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as AccountRole)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600">
              {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600">
              <option value="AKTIF">AKTIF</option>
              <option value="NONAKTIF">NONAKTIF</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">NIP {role === 'SISWA' ? '(NIS)' : ''}</label>
            <input value={nip} onChange={(e) => setNip(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600" />
          </div>
          {sistem === 'CLASSROOM' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Kelas</label>
              <input value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="cth: Kelas 1" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-slate-600" />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500">Batal</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5"><KeyRound size={12} /> Simpan</button>
        </div>
      </form>
    </div>
  );
};
