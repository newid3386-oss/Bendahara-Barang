import { db } from './localStorageService';

const STORAGE_KEY = 'BB_LAST_DAILY_STOCK_EXPORT';
const SHEET_NAME = 'Daily Stock Backup';
const HEADERS = [
  'EXPORT_DATE',
  'KODE_BARANG',
  'NAMA_BARANG',
  'JENIS_SATUAN',
  'STOK',
  'BATAS_MINIMUM',
  'STATUS',
];
const EXPORT_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Daily stock level export to Google Sheets.
 *
 * The app stores all data in localStorage (client-side), so the "daily"
 * export runs as a client-side check on app load: if more than 24 hours have
 * passed since the last successful export (or it has never run), and a Google
 * Sheet + OAuth token are available, the current stock snapshot is appended to
 * a "Daily Stock Backup" tab in the connected spreadsheet.
 *
 * Each row is self-describing (includes the export timestamp) so the sheet
 * accumulates a running history of daily snapshots.
 */
export const dailyStockExportService = {
  getLastExportTime(): string | null {
    return localStorage.getItem(STORAGE_KEY);
  },

  isExportDue(): boolean {
    const last = this.getLastExportTime();
    if (!last) return true;
    return Date.now() - new Date(last).getTime() >= EXPORT_INTERVAL_MS;
  },

  async runExportIfDue(): Promise<{ exported: boolean; error?: string }> {
    if (!this.isExportDue()) {
      return { exported: false };
    }

    const accessToken = db.getGoogleAccessToken();
    const sheetId = db.getConnectedGoogleSheetId();

    // No Google Sheet connected or no token — skip silently.
    if (!accessToken || !sheetId) {
      return { exported: false };
    }

    try {
      const summary = db.getStockSummary();
      const exportDate = new Date().toISOString();
      const isFirstExport = !this.getLastExportTime();

      const dataRows = summary.map((s) => [
        exportDate,
        s.KODE_BARANG,
        s.NAMA_BARANG,
        s.JENIS_SATUAN,
        s.STOK,
        s.BATAS_MINIMUM,
        s.STATUS,
      ]);

      const values = isFirstExport ? [HEADERS, ...dataRows] : dataRows;

      const url =
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}` +
        `/values/${encodeURIComponent(SHEET_NAME)}!A:G:append` +
        `?insertDataOption=INSERT_ROWS&valueInputOption=USER_ENTERED`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Gagal mengekspor stok harian ke Google Sheet.');
      }

      localStorage.setItem(STORAGE_KEY, exportDate);
      db.logAudit('EXPORT', 'DAILY_STOCK_BACKUP', sheetId, {
        itemCount: summary.length,
        exportDate,
      });

      return { exported: true };
    } catch (error: any) {
      console.error('Daily stock export failed:', error);
      return { exported: false, error: error.message };
    }
  },
};
