import React, { useState } from 'react';
import { Lock, BookOpen, ShieldCheck, ChevronRight, LogIn, ArrowLeft, UserCheck, GraduationCap, Settings } from 'lucide-react';
import { db } from '../services/localStorageService';
import { accountService } from '../services/accountService';
import { User } from '../types';
import { SystemType } from '../types/classroom';

interface LoginSelectionModalProps {
  onClose: () => void;
  onEnterSiperseda: (user: User) => void;
  onEnterClassroom: () => void;
  onEnterAdmin: () => void;
}

export const LoginSelectionModal: React.FC<LoginSelectionModalProps> = ({
  onClose,
  onEnterSiperseda,
  onEnterClassroom,
  onEnterAdmin,
}) => {
  const [step, setStep] = useState<'select' | 'siperseda' | 'classroom' | 'admin'>('select');

  // SIPERSEDA login state
  const sipersedaUsers = db.getUsers().filter(
    (u) => u.STATUS === 'AKTIF' && (u.ROLE === 'OPERATOR' || u.ROLE === 'KEPALA SEKOLAH')
  );
  const [sipersedaQuery, setSipersedaQuery] = useState('');
  const [sipersedaPass, setSipersedaPass] = useState('');
  const [sipersedaError, setSipersedaError] = useState<string | null>(null);

  // Classroom & Admin login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSipersedaLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSipersedaError(null);
    const query = sipersedaQuery.trim().toLowerCase();
    const found = sipersedaUsers.find(
      (u) =>
        (u.NIP && u.NIP.replace(/\s+/g, '') === query.replace(/\s+/g, '')) ||
        (u.EMAIL && u.EMAIL.toLowerCase() === query) ||
        u.NAMA.toLowerCase().includes(query)
    );
    if (!found) {
      setSipersedaError('Akun Operator/Kepala Sekolah tidak ditemukan. Periksa kembali NIP, Email, atau Nama.');
      return;
    }
    setIsLoggingIn(true);
    setTimeout(() => {
      db.setActiveUser(found);
      db.logAudit('LOGIN', 'AUTH_PORTAL', found.NIP || found.NAMA, {
        method: 'SIPERSEDA_LOGIN',
        role: found.ROLE,
      });
      setIsLoggingIn(false);
      onEnterSiperseda(found);
    }, 300);
  };

  const handleCredentialLogin = (sistem: SystemType) => (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!username.trim() || !password.trim()) {
      setFormError('Username dan kata sandi wajib diisi.');
      return;
    }
    const account = accountService.authenticate(sistem, username, password);
    if (!account) {
      setFormError('Username atau kata sandi salah. Silakan coba lagi.');
      return;
    }
    setIsLoggingIn(true);
    setTimeout(() => {
      if (sistem === 'CLASSROOM') {
        accountService.setActiveClassroomAccount(account);
        onEnterClassroom();
      } else {
        accountService.setActiveAdminAccount(account);
        onEnterAdmin();
      }
      setIsLoggingIn(false);
    }, 300);
  };

  const systemCards = [
    {
      key: 'siperseda' as const,
      title: 'Login SIPERSEDA',
      subtitle: 'Sistem Persediaan & Aset',
      desc: 'Operator & Kepala Sekolah mengelola persediaan, aset, dan persetujuan.',
      icon: ShieldCheck,
      color: 'from-emerald-700 to-teal-800',
      ring: 'hover:border-emerald-500',
      iconBg: 'bg-emerald-100 text-emerald-800',
    },
    {
      key: 'classroom' as const,
      title: 'Login Classroom',
      subtitle: 'Pembelajaran Online',
      desc: 'Siswa, Guru & Kepala Sekolah untuk pembelajaran, tugas, dan laporan.',
      icon: BookOpen,
      color: 'from-blue-700 to-indigo-800',
      ring: 'hover:border-blue-500',
      iconBg: 'bg-blue-100 text-blue-800',
    },
    {
      key: 'admin' as const,
      title: 'Login Admin Website',
      subtitle: 'Manajemen Keseluruhan',
      desc: 'Administrator mengelola akun SIPERSEDA, Classroom, dan website.',
      icon: Settings,
      color: 'from-slate-800 to-slate-950',
      ring: 'hover:border-slate-600',
      iconBg: 'bg-slate-200 text-slate-800',
    },
  ];

  const renderCredentialForm = (sistem: SystemType, accent: string) => {
    const demoHints =
      sistem === 'CLASSROOM'
        ? [
            { label: 'Guru Baru (Uji Kunci Kelas 1x)', val: 'gurubaru / guru123' },
            { label: 'Guru Kls 1 (Terkunci)', val: 'nurul / guru123' },
            { label: 'Guru Kls 3 (Terkunci)', val: 'fauzi / guru123' },
            { label: 'Siswa Kls 1', val: 'aisyah / siswa123' },
            { label: 'Kepsek', val: 'kepsek / kepala123' },
          ]
        : [{ label: 'Super Admin', val: 'admin / admin123' }];
    return (
      <form onSubmit={handleCredentialLogin(sistem)} className="space-y-3">
        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {formError}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Username atau Email</label>
          <input
            type="text"
            placeholder="Masukkan username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-2 focus:outline-blue-600"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi</label>
          <input
            type="password"
            placeholder="Masukkan kata sandi..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-2 focus:outline-blue-600 font-mono"
          />
        </div>
        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setStep('select');
              setUsername('');
              setPassword('');
              setFormError(null);
            }}
            className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700"
          >
            Kembali
          </button>
          <button
            type="submit"
            disabled={isLoggingIn}
            className={`px-6 py-2.5 rounded-xl bg-gradient-to-r ${accent} hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5`}
          >
            {isLoggingIn ? 'Memverifikasi...' : (
              <>
                <LogIn size={14} />
                <span>Masuk</span>
              </>
            )}
          </button>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-semibold mb-1">Pilih Cepat Akun Demo (Klik untuk mengisi):</p>
          <div className="flex flex-wrap gap-1">
            {demoHints.map((h) => {
              const [u, p] = h.val.split(' / ');
              return (
                <button
                  type="button"
                  key={h.val}
                  onClick={() => { setUsername(u); setPassword(p); }}
                  className="text-[10px] bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 px-2 py-0.5 rounded font-mono transition-colors"
                  title="Klik untuk mengisi formulir"
                >
                  <strong className="font-sans font-bold text-slate-900">{h.label}:</strong> {h.val}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            ✕
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center">
              <Lock size={22} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                Portal Masuk Terpadu
              </div>
              <h3 className="text-lg font-black text-white">
                {step === 'select' ? 'Pilih Sistem Login' : 'Login ' + (step === 'siperseda' ? 'SIPERSEDA' : step === 'classroom' ? 'Classroom' : 'Admin')}
              </h3>
              <div className="text-[11px] text-slate-300">SD Negeri Tangerang 6</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {step === 'select' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {systemCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => {
                      setStep(card.key);
                      setFormError(null);
                      setUsername('');
                      setPassword('');
                    }}
                    className={`p-4 rounded-2xl border-2 border-slate-200 ${card.ring} bg-white text-left transition-all flex flex-col gap-3 shadow-sm`}
                  >
                    <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{card.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{card.subtitle}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{card.desc}</p>
                    <div className={`mt-auto bg-gradient-to-r ${card.color} text-white text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1`}>
                      <LogIn size={12} /> Masuk
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 'siperseda' && (
            <div className="space-y-4">
              {/* Quick select */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={15} className="text-emerald-700" />
                  Pilih Akun (Operator / Kepala Sekolah)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {sipersedaUsers.map((u) => (
                    <button
                      key={u.ID}
                      type="button"
                      onClick={() => {
                        db.setActiveUser(u);
                        db.logAudit('LOGIN', 'AUTH_PORTAL', u.NIP || u.NAMA, { method: 'QUICK_LOGIN', role: u.ROLE });
                        onEnterSiperseda(u);
                      }}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all flex items-center justify-between group shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {u.NAMA.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-slate-800 truncate">{u.NAMA}</div>
                          <div className="text-[10px] text-slate-500 truncate">{u.JABATAN || u.ROLE}</div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-700 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="shrink mx-3 text-[11px] font-bold text-slate-400 uppercase">Atau Masuk Manual</span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <form onSubmit={handleSipersedaLogin} className="space-y-3">
                {sipersedaError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                    {sipersedaError}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="NIP / Email / Nama Pengguna..."
                  value={sipersedaQuery}
                  onChange={(e) => setSipersedaQuery(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-2 focus:outline-emerald-700"
                />
                <input
                  type="password"
                  placeholder="PIN / Kata Sandi (opsional)..."
                  value={sipersedaPass}
                  onChange={(e) => setSipersedaPass(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-2 focus:outline-emerald-700 font-mono"
                />
                <div className="pt-1 flex items-center justify-between">
                  <button type="button" onClick={() => setStep('select')} className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700">
                    Kembali
                  </button>
                  <button type="submit" disabled={isLoggingIn} className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5">
                    {isLoggingIn ? 'Memverifikasi...' : <><LogIn size={14} /><span>Masuk SIPERSEDA</span></>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'classroom' && (
            <div>
              <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <GraduationCap size={18} className="text-blue-700 shrink-0" />
                <p className="text-[11px] text-blue-800 font-medium">Masuk sebagai Siswa, Guru, atau Kepala Sekolah untuk mengakses pembelajaran online.</p>
              </div>
              {renderCredentialForm('CLASSROOM', 'from-blue-700 to-indigo-800')}
            </div>
          )}

          {step === 'admin' && (
            <div>
              <div className="flex items-center gap-2 mb-4 p-3 bg-slate-100 rounded-xl border border-slate-300">
                <ShieldCheck size={18} className="text-slate-700 shrink-0" />
                <p className="text-[11px] text-slate-700 font-medium">Khusus Administrator. Mengelola seluruh akun SIPERSEDA, Classroom, dan website.</p>
              </div>
              {renderCredentialForm('ADMIN', 'from-slate-800 to-slate-950')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
