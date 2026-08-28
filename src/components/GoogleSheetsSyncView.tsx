import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CloudUpload,
  CloudDownload,
  FolderOpen,
  Check,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Clock,
  Zap,
  Radio,
  HardDrive,
  Activity,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { googleWorkspace } from '../services/googleWorkspace';

interface GoogleSheetsSyncViewProps {
  onOpenModal: () => void;
}

export const GoogleSheetsSyncView: React.FC<GoogleSheetsSyncViewProps> = ({ onOpenModal }) => {
  const [accessToken, setAccessToken] = useState<string | null>(db.getGoogleAccessToken());
  const [sheetId, setSheetId] = useState<string | null>(db.getConnectedGoogleSheetId());
  const [appsScriptUrl, setAppsScriptUrl] = useState<string | null>(db.getAppsScriptUrl());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const config = db.getConfig();
  const lastSync = db.getLastSyncTime();
  const autoSyncEnabled = config.AUTO_SYNC_ENABLED === 'YA';
  const autoSyncInterval = config.AUTO_SYNC_INTERVAL_MINUTES || 15;
  const realtimeEnabled = config.REALTIME_SYNC_ENABLED === 'YA';
  const [realtimeToggling, setRealtimeToggling] = useState(false);

  const handleToggleRealtime = () => {
    setRealtimeToggling(true);
    const newVal = !realtimeEnabled ? 'YA' : 'TIDAK';
    db.saveConfig({ REALTIME_SYNC_ENABLED: newVal });
    setTimeout(() => setRealtimeToggling(false), 400);
  };

  useEffect(() => {
    setAccessToken(db.getGoogleAccessToken());
    setSheetId(db.getConnectedGoogleSheetId());
    setAppsScriptUrl(db.getAppsScriptUrl());
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      if (accessToken) {
        const res = await googleWorkspace.testConnection('OAUTH', { token: accessToken, sheetId: sheetId || undefined });
        setTestResult(res);
      } else if (appsScriptUrl) {
        const res = await googleWorkspace.testConnection('APPS_SCRIPT', { appsScriptUrl });
        setTestResult(res);
      } else {
        onOpenModal();
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Koneksi gagal', latencyMs: 0 });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushData = async () => {
    if (accessToken && sheetId) {
      setIsSyncing(true);
      setStatusMsg({ type: 'info', text: 'Mengunggah (Push) seluruh data ke Google Sheets via OAuth...' });
      try {
        await googleWorkspace.pushAllDataToSheet(accessToken, sheetId);
        setStatusMsg({
          type: 'success',
          text: 'Seluruh database lokal berhasil diunggah ke Google Sheets!',
        });
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: 'Gagal melakukan Push data: ' + err.message,
        });
      } finally {
        setIsSyncing(false);
      }
    } else if (appsScriptUrl) {
      setIsSyncing(true);
      setStatusMsg({ type: 'info', text: 'Mengunggah (Push) seluruh data ke Google Sheets via Apps Script...' });
      try {
        await googleWorkspace.syncWithAppsScript(appsScriptUrl, 'PUSH');
        setStatusMsg({
          type: 'success',
          text: 'Seluruh database lokal berhasil disinkronkan ke Google Sheets via Apps Script!',
        });
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: 'Gagal melakukan Push data Apps Script: ' + err.message,
        });
      } finally {
        setIsSyncing(false);
      }
    } else {
      onOpenModal();
    }
  };

  const handlePullData = async () => {
    if (accessToken && sheetId) {
      setIsSyncing(true);
      setStatusMsg({ type: 'info', text: 'Menarik (Pull) data dari Google Sheets via OAuth...' });
      try {
        await googleWorkspace.pullDataFromSheet(accessToken, sheetId);
        setStatusMsg({
          type: 'success',
          text: 'Data dari Google Sheets berhasil ditarik dan diperbarui ke aplikasi!',
        });
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: 'Gagal melakukan Pull data: ' + err.message,
        });
      } finally {
        setIsSyncing(false);
      }
    } else if (appsScriptUrl) {
      setIsSyncing(true);
      setStatusMsg({ type: 'info', text: 'Menarik (Pull) data dari Google Sheets via Apps Script...' });
      try {
        await googleWorkspace.syncWithAppsScript(appsScriptUrl, 'PULL');
        setStatusMsg({
          type: 'success',
          text: 'Data dari Google Sheets berhasil ditarik dan diperbarui via Apps Script!',
        });
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: 'Gagal melakukan Pull data Apps Script: ' + err.message,
        });
      } finally {
        setIsSyncing(false);
      }
    } else {
      onOpenModal();
    }
  };

  const handleCreateDriveBackup = async () => {
    if (!accessToken) {
      onOpenModal();
      return;
    }
    setIsSyncing(true);
    setStatusMsg({ type: 'info', text: 'Mencadangkan snapshot database ke Google Drive...' });
    try {
      const backup = await googleWorkspace.createDriveBackup(accessToken);
      setStatusMsg({
        type: 'success',
        text: `Cadangan berhasil disimpan di Google Drive: "${backup.fileName}"!`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'Gagal mencadangkan ke Google Drive: ' + err.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const isConnected = !!accessToken || !!appsScriptUrl;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileSpreadsheet size={19} className="text-emerald-800" />
            Integrasi &amp; Otomasi Google Sheets &amp; Drive
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen pertukaran data dua arah, pencadangan otomatis (backup), dan panduan koneksi instan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Activity size={14} className={isTesting ? 'animate-spin text-emerald-800' : 'text-slate-500'} />
              Uji Koneksi
            </button>
          )}
          <button
            type="button"
            onClick={onOpenModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <FolderOpen size={16} /> Panduan &amp; Pengaturan Akun
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs leading-relaxed flex items-start gap-2.5 animate-in fade-in ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : statusMsg.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          <div className="mt-0.5">
            {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : statusMsg.type === 'error' ? <AlertCircle size={16} /> : <RefreshCw size={16} />}
          </div>
          <div className="flex-1 font-semibold">{statusMsg.text}</div>
        </div>
      )}

      {testResult && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            testResult.success
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity size={15} className={testResult.success ? 'text-emerald-700' : 'text-rose-600'} />
            <span className="font-bold">{testResult.message}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 font-bold">
            {testResult.latencyMs} ms
          </span>
        </div>
      )}

      {/* Real-Time Auto-Sync Card */}
      <div className={`bg-white p-4 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
        realtimeEnabled ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl transition-colors ${realtimeEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {realtimeEnabled ? <Radio size={18} className="animate-pulse" /> : <Zap size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800">Sinkronisasi Real-Time Otomatis (Live Sync)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                  realtimeEnabled
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {realtimeEnabled ? 'AKTIF' : 'Nonaktif'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {realtimeEnabled
                ? 'Setiap penambahan atau mutasi inventaris otomatis dikirim ke Google Sheets dalam 5 detik.'
                : 'Aktifkan untuk mengirim setiap transaksi langsung ke cloud tanpa harus menekan tombol Push manual.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={realtimeToggling}
          onClick={handleToggleRealtime}
          className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-300 ${
            realtimeEnabled ? 'bg-emerald-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
              realtimeEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Sync Status Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Connection Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Status Saluran Koneksi
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                accessToken
                  ? 'bg-emerald-100 text-emerald-800'
                  : appsScriptUrl
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {accessToken ? 'OAuth 2.0 Aktif' : appsScriptUrl ? 'Apps Script Aktif' : 'Belum Terhubung'}
            </span>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              {accessToken ? (
                <>
                  <KeyRound size={15} className="text-emerald-700" />
                  Google OAuth &amp; Drive Terhubung
                </>
              ) : appsScriptUrl ? (
                <>
                  <Sparkles size={15} className="text-emerald-700" />
                  Google Apps Script Web App Terhubung
                </>
              ) : (
                'Belum Ada Saluran Spreadsheet'
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {sheetId
                ? `Target Spreadsheet ID: ${sheetId.slice(0, 16)}...`
                : appsScriptUrl
                ? 'Terhubung via Apps Script Web App.'
                : 'Hubungkan Google Sheets Anda untuk mengaktifkan sinkronisasi otomatis ke cloud.'}
            </p>
          </div>

          {lastSync && (
            <div className="text-[11px] text-slate-500 font-medium">
              Sinkronisasi Terakhir:{' '}
              <strong className="text-slate-700">{new Date(lastSync).toLocaleString('id-ID')}</strong>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {sheetId ? (
              <a
                href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink size={14} /> Buka Spreadsheet di Tab Baru
              </a>
            ) : (
              <button
                type="button"
                onClick={onOpenModal}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Mulai Hubungkan Google Sheets
              </button>
            )}
          </div>
        </div>

        {/* Right: Two-Way Actions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Aksi Sinkronisasi &amp; Cadangan
          </span>

          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-800">Push (Unggah ke Cloud)</div>
                <div className="text-[11px] text-slate-500">
                  Kirim seluruh transaksi, aset, dan stok lokal ke Google Sheets.
                </div>
              </div>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handlePushData}
                className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
              >
                <CloudUpload size={14} /> Push
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-800">Pull (Tarik dari Cloud)</div>
                <div className="text-[11px] text-slate-500">
                  Perbarui database lokal dari data di Google Sheets.
                </div>
              </div>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handlePullData}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <CloudDownload size={14} /> Pull
              </button>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-emerald-950">Cadangkan ke Google Drive</div>
                <div className="text-[11px] text-emerald-800">
                  Simpan file snapshot JSON ke folder Google Drive Anda.
                </div>
              </div>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleCreateDriveBackup}
                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-2xs"
              >
                <HardDrive size={13} /> Cadangkan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schema Structure Documentation Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-800" />
          Struktur Lembar Kerja Database Google Sheets
        </h3>
        <p className="text-xs text-slate-500">
          Sistem secara otomatis mengelola sinkronisasi tabel relasional berikut di dalam Google Spreadsheet Anda:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <strong className="text-slate-800 block">1. CONFIG &amp; USERS</strong>
            <span className="text-slate-500 text-[11px]">Identitas sekolah &amp; hak akses pengguna</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <strong className="text-slate-800 block">2. SUPPLIERS &amp; ITEMS</strong>
            <span className="text-slate-500 text-[11px]">Master rekanan toko &amp; katalog barang</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <strong className="text-slate-800 block">3. BARANG_MASUK</strong>
            <span className="text-slate-500 text-[11px]">Log pengadaan &amp; nomor BKU/Kwitansi</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <strong className="text-slate-800 block">4. BARANG_KELUAR</strong>
            <span className="text-slate-500 text-[11px]">Log penyaluran barang, paraf &amp; no dokumen</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <strong className="text-slate-800 block">5. ASET &amp; MUTASI</strong>
            <span className="text-slate-500 text-[11px]">Buku induk inventaris &amp; perpindahan lokasi</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <strong className="text-slate-800 block">6. STOCK_LEDGER &amp; SUMMARY</strong>
            <span className="text-slate-500 text-[11px]">Kartu stok mutasi berjalan &amp; saldo akhir</span>
          </div>
        </div>
      </div>
    </div>
  );
};
