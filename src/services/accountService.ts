import { Account, SystemType } from '../types/classroom';

const STORAGE_KEYS = {
  ACCOUNTS: 'BB_ACCOUNTS',
  ACTIVE_CLASSROOM: 'BB_ACTIVE_CLASSROOM_ACCOUNT',
  ACTIVE_ADMIN: 'BB_ACTIVE_ADMIN_ACCOUNT',
  CLASSROOM_COURSES: 'BB_CLASSROOM_COURSES',
  CLASSROOM_ASSIGNMENTS: 'BB_CLASSROOM_ASSIGNMENTS',
  CLASSROOM_SUBMISSIONS: 'BB_CLASSROOM_SUBMISSIONS',
  CLASSROOM_REPORTS: 'BB_CLASSROOM_REPORTS',
  ACCOUNTS_SEEDED: 'BB_ACCOUNTS_SEEDED',
};

const nowISO = () => new Date().toISOString();

const DEFAULT_ACCOUNTS: Account[] = [
  // Classroom accounts
  {
    ID: 'ACC-CLS-001',
    NAMA: 'Liestya Kusuma Sari, S.Pd., M.Pd.',
    EMAIL: 'liestya.kusuma@sdntangerang6.sch.id',
    USERNAME: 'kepsek',
    PASSWORD: 'kepala123',
    ROLE: 'KEPALA SEKOLAH',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '198406192009022007',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'ACC-CLS-002',
    NAMA: 'Nurul Hidayah, S.Pd.',
    EMAIL: 'nurul.hidayah@sdntangerang6.sch.id',
    USERNAME: 'nurul',
    PASSWORD: 'guru123',
    ROLE: 'GURU',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '199512012022212014',
    KELAS: 'Kelas 1',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'ACC-CLS-003',
    NAMA: 'Ahmad Fauzi, S.Pd.',
    EMAIL: 'ahmad.fauzi@sdntangerang6.sch.id',
    USERNAME: 'fauzi',
    PASSWORD: 'guru123',
    ROLE: 'GURU',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '198406182014031002',
    KELAS: 'Kelas 3',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'ACC-CLS-004',
    NAMA: 'Aisyah Putri',
    EMAIL: 'aisyah.putri@student.sdntangerang6.sch.id',
    USERNAME: 'aisyah',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    KELAS: 'Kelas 1',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'ACC-CLS-005',
    NAMA: 'Bima Sakti Pratama',
    EMAIL: 'bima.sakti@student.sdntangerang6.sch.id',
    USERNAME: 'bima',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    KELAS: 'Kelas 1',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'ACC-CLS-006',
    NAMA: 'Citra Lestari',
    EMAIL: 'citra.lestari@student.sdntangerang6.sch.id',
    USERNAME: 'citra',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    KELAS: 'Kelas 3',
    CREATED_AT: nowISO(),
  },
  // Admin accounts
  {
    ID: 'ACC-ADM-001',
    NAMA: 'Administrator Sistem',
    EMAIL: 'admin@sdntangerang6.sch.id',
    USERNAME: 'admin',
    PASSWORD: 'admin123',
    ROLE: 'ADMIN',
    SISTEM: 'ADMIN',
    STATUS: 'AKTIF',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'ACC-ADM-002',
    NAMA: 'Budi Santoso, A.Md.',
    EMAIL: 'budi.santoso@sdntangerang6.sch.id',
    USERNAME: 'budi',
    PASSWORD: 'admin123',
    ROLE: 'ADMIN',
    SISTEM: 'ADMIN',
    STATUS: 'AKTIF',
    NIP: '199203112019031008',
    CREATED_AT: nowISO(),
  },
];

class AccountService {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('bb_storage_sync', { detail: { key } }));
      }, 0);
    }
  }

  public initAccounts(): void {
    if (localStorage.getItem(STORAGE_KEYS.ACCOUNTS_SEEDED)) return;
    this.setItem(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS_SEEDED, 'true');
  }

  // --- Accounts CRUD ---
  public getAccounts(sistem?: SystemType): Account[] {
    this.initAccounts();
    const all = this.getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
    if (sistem) return all.filter((a) => a.SISTEM === sistem);
    return all;
  }

  public getAccountById(id: string): Account | undefined {
    return this.getAccounts().find((a) => a.ID === id);
  }

  public saveAccount(account: Partial<Account>): Account {
    const accounts = this.getAccounts();
    let saved: Account;
    if (account.ID) {
      const idx = accounts.findIndex((a) => a.ID === account.ID);
      if (idx >= 0) {
        accounts[idx] = { ...accounts[idx], ...account } as Account;
        saved = accounts[idx];
      } else {
        saved = { ...account, ID: account.ID } as Account;
        accounts.push(saved);
      }
    } else {
      const prefix = account.SISTEM === 'CLASSROOM' ? 'ACC-CLS' : account.SISTEM === 'ADMIN' ? 'ACC-ADM' : 'ACC-SPR';
      const num = accounts.filter((a) => a.ID.startsWith(prefix)).length + 1;
      saved = {
        ID: `${prefix}-${String(num).padStart(3, '0')}`,
        NAMA: account.NAMA || '',
        EMAIL: account.EMAIL || '',
        USERNAME: account.USERNAME || '',
        PASSWORD: account.PASSWORD || '123456',
        ROLE: account.ROLE || 'GURU',
        SISTEM: account.SISTEM || 'CLASSROOM',
        STATUS: account.STATUS || 'AKTIF',
        NIP: account.NIP || '',
        KELAS: account.KELAS || '',
        TELEPON: account.TELEPON || '',
        CREATED_AT: nowISO(),
      };
      accounts.push(saved);
    }
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);
    return saved;
  }

  public deleteAccount(id: string): void {
    const accounts = this.getAccounts().filter((a) => a.ID !== id);
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);
  }

  public authenticate(sistem: SystemType, username: string, password: string): Account | null {
    const accounts = this.getAccounts(sistem);
    const found = accounts.find(
      (a) =>
        a.STATUS === 'AKTIF' &&
        (a.USERNAME.toLowerCase() === username.trim().toLowerCase() ||
          a.EMAIL.toLowerCase() === username.trim().toLowerCase()) &&
        a.PASSWORD === password
    );
    return found || null;
  }

  // --- Active sessions ---
  public getActiveClassroomAccount(): Account | null {
    return this.getItem<Account | null>(STORAGE_KEYS.ACTIVE_CLASSROOM, null);
  }

  public setActiveClassroomAccount(account: Account | null): void {
    this.setItem(STORAGE_KEYS.ACTIVE_CLASSROOM, account);
  }

  public getActiveAdminAccount(): Account | null {
    return this.getItem<Account | null>(STORAGE_KEYS.ACTIVE_ADMIN, null);
  }

  public setActiveAdminAccount(account: Account | null): void {
    this.setItem(STORAGE_KEYS.ACTIVE_ADMIN, account);
  }
}

export const accountService = new AccountService();
