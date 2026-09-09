import { Account, SystemType } from '../types/classroom';
import { classroomService } from './classroomService';

const STORAGE_KEYS = {
  ACCOUNTS: 'BB_ACCOUNTS',
  ACTIVE_CLASSROOM: 'BB_ACTIVE_CLASSROOM_ACCOUNT',
  ACTIVE_ADMIN: 'BB_ACTIVE_ADMIN_ACCOUNT',
  CLASSROOM_COURSES: 'BB_CLASSROOM_COURSES',
  CLASSROOM_ASSIGNMENTS: 'BB_CLASSROOM_ASSIGNMENTS',
  CLASSROOM_SUBMISSIONS: 'BB_CLASSROOM_SUBMISSIONS',
  CLASSROOM_REPORTS: 'BB_CLASSROOM_REPORTS',
  ACCOUNTS_SEEDED: 'BB_ACCOUNTS_SEEDED_V4',
};

const nowISO = () => new Date().toISOString();

export const STANDARD_CLASSES = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];

const DEFAULT_ACCOUNTS: Account[] = [
  // ===== ADMIN ACCOUNTS (ONLY) =====
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
    const existingRaw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    let accounts: Account[] = [];
    try {
      if (existingRaw) {
        const parsed = JSON.parse(existingRaw);
        if (Array.isArray(parsed)) {
          accounts = parsed;
        }
      }
    } catch (e) {
      accounts = [];
    }

    // Auto-clean any non-admin accounts to ensure only admin accounts persist
    const cleanupKey = 'BB_ACCOUNTS_CLEANED_ADMIN_ONLY_V2';
    if (!localStorage.getItem(cleanupKey)) {
      const adminOnly = accounts.filter(
        (a) => a.ROLE === 'ADMIN' || a.SISTEM === 'ADMIN' || a.ID.startsWith('ACC-ADM')
      );
      this.setItem(STORAGE_KEYS.ACCOUNTS, adminOnly.length > 0 ? adminOnly : DEFAULT_ACCOUNTS);
      localStorage.setItem(cleanupKey, 'true');
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS_SEEDED, 'true');

      // Reset active classroom session if it was not an admin
      const activeClass = this.getActiveClassroomAccount();
      if (activeClass && activeClass.ROLE !== 'ADMIN' && activeClass.SISTEM !== 'ADMIN') {
        this.setActiveClassroomAccount(null);
      }
      return;
    }

    if (accounts.length === 0 || !localStorage.getItem(STORAGE_KEYS.ACCOUNTS_SEEDED)) {
      this.setItem(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS_SEEDED, 'true');
    }
  }

  /**
   * Cleans all non-admin accounts from the database and storage, retaining strictly Admin accounts.
   */
  public cleanNonAdminAccounts(): { deletedCount: number; remainingAdminCount: number } {
    const all = this.getAccounts();
    const adminAccounts = all.filter(
      (a) => a.ROLE === 'ADMIN' || a.SISTEM === 'ADMIN' || a.ID.startsWith('ACC-ADM')
    );
    const deletedCount = all.length - adminAccounts.length;
    const finalAccounts = adminAccounts.length > 0 ? adminAccounts : DEFAULT_ACCOUNTS;

    this.setItem(STORAGE_KEYS.ACCOUNTS, finalAccounts);

    // If active classroom session was non-admin, clear it
    const activeClass = this.getActiveClassroomAccount();
    if (activeClass && activeClass.ROLE !== 'ADMIN' && activeClass.SISTEM !== 'ADMIN') {
      this.setActiveClassroomAccount(null);
    }

    return { deletedCount, remainingAdminCount: finalAccounts.length };
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
      const prefix =
        account.ROLE === 'SISWA'
          ? 'SISWA'
          : account.SISTEM === 'CLASSROOM'
          ? 'ACC-CLS'
          : account.SISTEM === 'ADMIN'
          ? 'ACC-ADM'
          : 'ACC-SPR';
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
        KELAS_LOCKED: account.KELAS_LOCKED || false,
        KELAS_LOCKED_AT: account.KELAS_LOCKED_AT || undefined,
        KELAS_LOCKED_BY: account.KELAS_LOCKED_BY || undefined,
        TELEPON: account.TELEPON || '',
        CREATED_AT: nowISO(),
      };
      accounts.push(saved);
    }
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);

    // If active session matches, update it
    const activeClass = this.getActiveClassroomAccount();
    if (activeClass && activeClass.ID === saved.ID) {
      this.setActiveClassroomAccount(saved);
    }
    const activeAdmin = this.getActiveAdminAccount();
    if (activeAdmin && activeAdmin.ID === saved.ID) {
      this.setActiveAdminAccount(saved);
    }

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

  // --- ONE-TIME TEACHER CLASS LOCKING & ADMIN UNLOCKING ---
  /**
   * Called when a Guru enters/selects their Class.
   * Locks the class selection permanently for this teacher.
   * Synchronizes students and courses automatically.
   */
  public lockTeacherClass(guruId: string, kelas: string): Account | null {
    const accounts = this.getAccounts();
    const idx = accounts.findIndex((a) => a.ID === guruId);
    if (idx === -1) return null;

    accounts[idx] = {
      ...accounts[idx],
      KELAS: kelas,
      KELAS_LOCKED: true,
      KELAS_LOCKED_AT: nowISO(),
      KELAS_LOCKED_BY: 'GURU_MANDIRI',
    };
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);

    const saved = accounts[idx];
    const active = this.getActiveClassroomAccount();
    if (active && active.ID === guruId) {
      this.setActiveClassroomAccount(saved);
    }

    // Auto synchronize course with this teacher & class
    try {
      classroomService.syncTeacherCourseWithClass(saved.ID, saved.NAMA, kelas);
    } catch (e) {
      console.warn('Sync course error:', e);
    }

    return saved;
  }

  /**
   * Unlock a Teacher's Class (ADMIN ONLY).
   * After unlocked, the teacher will be prompted to re-select class on next login or can be reassigned.
   */
  public unlockTeacherClass(guruId: string, adminUsername: string = 'ADMIN'): Account | null {
    const accounts = this.getAccounts();
    const idx = accounts.findIndex((a) => a.ID === guruId);
    if (idx === -1) return null;

    accounts[idx] = {
      ...accounts[idx],
      KELAS_LOCKED: false,
      KELAS_LOCKED_AT: undefined,
      KELAS_LOCKED_BY: `UNLOCKED_BY_${adminUsername}`,
    };
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);

    const saved = accounts[idx];
    const active = this.getActiveClassroomAccount();
    if (active && active.ID === guruId) {
      this.setActiveClassroomAccount(saved);
    }

    return saved;
  }

  /**
   * Admin direct update of teacher's class
   */
  public updateTeacherClass(guruId: string, kelas: string, lockImmediately: boolean = true): Account | null {
    const accounts = this.getAccounts();
    const idx = accounts.findIndex((a) => a.ID === guruId);
    if (idx === -1) return null;

    accounts[idx] = {
      ...accounts[idx],
      KELAS: kelas,
      KELAS_LOCKED: lockImmediately,
      KELAS_LOCKED_AT: lockImmediately ? nowISO() : undefined,
      KELAS_LOCKED_BY: 'ADMIN_PANEL',
    };
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);

    const saved = accounts[idx];
    const active = this.getActiveClassroomAccount();
    if (active && active.ID === guruId) {
      this.setActiveClassroomAccount(saved);
    }

    try {
      classroomService.syncTeacherCourseWithClass(saved.ID, saved.NAMA, kelas);
    } catch (e) {
      console.warn('Sync course error:', e);
    }

    return saved;
  }

  // --- STUDENT CLASS GROUPING UTILITIES ---
  public getStudents(kelas?: string): Account[] {
    const all = this.getAccounts('CLASSROOM').filter((a) => a.ROLE === 'SISWA');
    if (kelas) return all.filter((s) => s.KELAS === kelas);
    return all;
  }

  public getTeachers(): Account[] {
    return this.getAccounts('CLASSROOM').filter((a) => a.ROLE === 'GURU');
  }

  public getAvailableClasses(): string[] {
    const accounts = this.getAccounts('CLASSROOM');
    const set = new Set<string>(STANDARD_CLASSES);
    accounts.forEach((a) => {
      if (a.KELAS && a.KELAS.trim()) {
        set.add(a.KELAS.trim());
      }
    });
    return Array.from(set).sort();
  }

  public updateStudentClass(siswaId: string, newClass: string): Account | null {
    const accounts = this.getAccounts();
    const idx = accounts.findIndex((a) => a.ID === siswaId);
    if (idx === -1) return null;

    accounts[idx] = {
      ...accounts[idx],
      KELAS: newClass,
    };
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);
    return accounts[idx];
  }

  public batchUpdateStudentsClass(siswaIds: string[], newClass: string): void {
    const accounts = this.getAccounts();
    accounts.forEach((a) => {
      if (siswaIds.includes(a.ID)) {
        a.KELAS = newClass;
      }
    });
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);
  }

  public updateStudentSpecialNeeds(
    siswaId: string,
    data: {
      STATUS_KELULUSAN?: import('../types/classroom').StatusKelulusan;
      KEBUTUHAN_KHUSUS?: import('../types/classroom').KebutuhanKhusus;
      CATATAN_INKLUSI?: string;
    }
  ): Account | null {
    const accounts = this.getAccounts();
    const idx = accounts.findIndex((a) => a.ID === siswaId);
    if (idx === -1) return null;

    accounts[idx] = {
      ...accounts[idx],
      STATUS_KELULUSAN: data.STATUS_KELULUSAN ?? accounts[idx].STATUS_KELULUSAN,
      KEBUTUHAN_KHUSUS: data.KEBUTUHAN_KHUSUS ?? accounts[idx].KEBUTUHAN_KHUSUS,
      CATATAN_INKLUSI: data.CATATAN_INKLUSI !== undefined ? data.CATATAN_INKLUSI : accounts[idx].CATATAN_INKLUSI,
    };
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);
    return accounts[idx];
  }

  public getClassSummary() {
    const classes = this.getAvailableClasses();
    const students = this.getStudents();
    const teachers = this.getTeachers();

    return classes.map((cls) => {
      const classStudents = students.filter((s) => s.KELAS === cls);
      const classTeachers = teachers.filter((t) => t.KELAS === cls);
      return {
        kelas: cls,
        studentCount: classStudents.length,
        students: classStudents,
        teachers: classTeachers,
        isTeacherAssigned: classTeachers.length > 0,
        isTeacherLocked: classTeachers.some((t) => t.KELAS_LOCKED),
      };
    });
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
