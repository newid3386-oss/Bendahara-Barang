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
  // Kepala Sekolah
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
    TELEPON: '081298765432',
    CREATED_AT: nowISO(),
  },

  // Teachers (Guru Pengampu Kelas)
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
    KELAS_LOCKED: true,
    KELAS_LOCKED_AT: nowISO(),
    KELAS_LOCKED_BY: 'SYSTEM_DEFAULT',
    TELEPON: '081234567801',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'ACC-CLS-003',
    NAMA: 'Endang Wahyuni, S.Pd.SD.',
    EMAIL: 'endang.wahyuni@sdntangerang6.sch.id',
    USERNAME: 'endang',
    PASSWORD: 'guru123',
    ROLE: 'GURU',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '197908102008012015',
    KELAS: 'Kelas 2',
    KELAS_LOCKED: true,
    KELAS_LOCKED_AT: nowISO(),
    KELAS_LOCKED_BY: 'SYSTEM_DEFAULT',
    TELEPON: '081234567802',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'ACC-CLS-004',
    NAMA: 'Ahmad Fauzi, S.Pd.',
    EMAIL: 'ahmad.fauzi@sdntangerang6.sch.id',
    USERNAME: 'fauzi',
    PASSWORD: 'guru123',
    ROLE: 'GURU',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '198406182014031002',
    KELAS: 'Kelas 3',
    KELAS_LOCKED: true,
    KELAS_LOCKED_AT: nowISO(),
    KELAS_LOCKED_BY: 'SYSTEM_DEFAULT',
    TELEPON: '081234567803',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'ACC-CLS-005',
    NAMA: 'Dewi Lestari, S.Pd.SD.',
    EMAIL: 'dewi.lestari@sdntangerang6.sch.id',
    USERNAME: 'dewi',
    PASSWORD: 'guru123',
    ROLE: 'GURU',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '199105222019022009',
    KELAS: 'Kelas 4',
    KELAS_LOCKED: true,
    KELAS_LOCKED_AT: nowISO(),
    KELAS_LOCKED_BY: 'SYSTEM_DEFAULT',
    TELEPON: '081234567804',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'ACC-CLS-006',
    NAMA: 'M. Rizky Pratama, S.Pd.',
    EMAIL: 'rizky.pratama@sdntangerang6.sch.id',
    USERNAME: 'rizky',
    PASSWORD: 'guru123',
    ROLE: 'GURU',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '199308142020121006',
    KELAS: 'Kelas 5',
    KELAS_LOCKED: true,
    KELAS_LOCKED_AT: nowISO(),
    KELAS_LOCKED_BY: 'SYSTEM_DEFAULT',
    TELEPON: '081234567805',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'ACC-CLS-007',
    NAMA: 'Drs. H. Mulyadi, M.Pd.',
    EMAIL: 'mulyadi@sdntangerang6.sch.id',
    USERNAME: 'mulyadi',
    PASSWORD: 'guru123',
    ROLE: 'GURU',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '196903251994121003',
    KELAS: 'Kelas 6',
    KELAS_LOCKED: true,
    KELAS_LOCKED_AT: nowISO(),
    KELAS_LOCKED_BY: 'SYSTEM_DEFAULT',
    TELEPON: '081234567806',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'ACC-CLS-008',
    NAMA: 'Guru Baru Pengganti, S.Pd.',
    EMAIL: 'guru.baru@sdntangerang6.sch.id',
    USERNAME: 'gurubaru',
    PASSWORD: 'guru123',
    ROLE: 'GURU',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '199801152024212001',
    KELAS: '', // Belum memilih kelas (akan memicu modal pilihan & penguncian)
    KELAS_LOCKED: false,
    TELEPON: '081234567809',
    CREATED_AT: nowISO(),
  },

  // ===== DATA SISWA TERKELOMPOK BERDASARKAN KELAS =====
  // Kelas 1
  {
    ID: 'SISWA-001',
    NAMA: 'Aisyah Putri Rahmadani',
    EMAIL: 'aisyah.putri@student.sdntangerang6.sch.id',
    USERNAME: 'aisyah',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202601001',
    KELAS: 'Kelas 1',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-002',
    NAMA: 'Bima Sakti Pratama',
    EMAIL: 'bima.sakti@student.sdntangerang6.sch.id',
    USERNAME: 'bima',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202601002',
    KELAS: 'Kelas 1',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'INKLUSI_DISLEKSIA',
    CATATAN_INKLUSI: 'Pendampingan fonik huruf dan metode membaca visual berulang',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-003',
    NAMA: 'Dimas Arya Saputra',
    EMAIL: 'dimas.arya@student.sdntangerang6.sch.id',
    USERNAME: 'dimas',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202601003',
    KELAS: 'Kelas 1',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-004',
    NAMA: 'Zahra Aulia Nabila',
    EMAIL: 'zahra.aulia@student.sdntangerang6.sch.id',
    USERNAME: 'zahra',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202601004',
    KELAS: 'Kelas 1',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'CERDAS_ISTIMEWA',
    CATATAN_INKLUSI: 'Program pengayaan mandiri literasi & numerasi cepat',
    CREATED_AT: nowISO(),
  },

  // Kelas 2
  {
    ID: 'SISWA-005',
    NAMA: 'Fadil Ramadhan Al-Farisi',
    EMAIL: 'fadil.ramadhan@student.sdntangerang6.sch.id',
    USERNAME: 'fadil',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202602001',
    KELAS: 'Kelas 2',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-006',
    NAMA: 'Nayla Khairunnisa',
    EMAIL: 'nayla.khairunnisa@student.sdntangerang6.sch.id',
    USERNAME: 'nayla',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202602002',
    KELAS: 'Kelas 2',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'INKLUSI_TUNARUNGU',
    CATATAN_INKLUSI: 'Bantuan visual teks dan gerak bibir guru yang jelas',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-007',
    NAMA: 'Rizky Maulana Ihsan',
    EMAIL: 'rizky.maulana@student.sdntangerang6.sch.id',
    USERNAME: 'rizkym',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202602003',
    KELAS: 'Kelas 2',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-008',
    NAMA: 'Tiara Salsabila Az-Zahra',
    EMAIL: 'tiara.salsabila@student.sdntangerang6.sch.id',
    USERNAME: 'tiara',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202602004',
    KELAS: 'Kelas 2',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },

  // Kelas 3
  {
    ID: 'SISWA-009',
    NAMA: 'Citra Lestari Handoko',
    EMAIL: 'citra.lestari@student.sdntangerang6.sch.id',
    USERNAME: 'citra',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202603001',
    KELAS: 'Kelas 3',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-010',
    NAMA: 'Daniel Kurniawan Wijaya',
    EMAIL: 'daniel.kurniawan@student.sdntangerang6.sch.id',
    USERNAME: 'daniel',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202603002',
    KELAS: 'Kelas 3',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'INKLUSI_TUNADAKSA',
    CATATAN_INKLUSI: 'Penyesuaian aksesibilitas meja & kursi belajar di baris depan',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-011',
    NAMA: 'Fitri Handayani Putri',
    EMAIL: 'fitri.handayani@student.sdntangerang6.sch.id',
    USERNAME: 'fitri',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202603003',
    KELAS: 'Kelas 3',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-012',
    NAMA: 'Gilang Pratama Yudha',
    EMAIL: 'gilang.pratama@student.sdntangerang6.sch.id',
    USERNAME: 'gilang',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202603004',
    KELAS: 'Kelas 3',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },

  // Kelas 4
  {
    ID: 'SISWA-013',
    NAMA: 'Haikal Akbar Firdaus',
    EMAIL: 'haikal.akbar@student.sdntangerang6.sch.id',
    USERNAME: 'haikal',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202604001',
    KELAS: 'Kelas 4',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-014',
    NAMA: 'Intan Permatasari',
    EMAIL: 'intan.permatasari@student.sdntangerang6.sch.id',
    USERNAME: 'intan',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202604002',
    KELAS: 'Kelas 4',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-015',
    NAMA: 'Joko Susilo Purnomo',
    EMAIL: 'joko.susilo@student.sdntangerang6.sch.id',
    USERNAME: 'joko',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202604003',
    KELAS: 'Kelas 4',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'INKLUSI_AUTISME',
    CATATAN_INKLUSI: 'Instruksi bertahap, suasana kelas tenang & visual timer',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-016',
    NAMA: 'Kania Dewi Anggraini',
    EMAIL: 'kania.dewi@student.sdntangerang6.sch.id',
    USERNAME: 'kania',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202604004',
    KELAS: 'Kelas 4',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },

  // Kelas 5
  {
    ID: 'SISWA-017',
    NAMA: 'Lukman Hakim Al-Habsyi',
    EMAIL: 'lukman.hakim@student.sdntangerang6.sch.id',
    USERNAME: 'lukman',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202605001',
    KELAS: 'Kelas 5',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-018',
    NAMA: 'Melati Rahayu Lestari',
    EMAIL: 'melati.rahayu@student.sdntangerang6.sch.id',
    USERNAME: 'melati',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202605002',
    KELAS: 'Kelas 5',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-019',
    NAMA: 'Naufal Zaki Nugraha',
    EMAIL: 'naufal.zaki@student.sdntangerang6.sch.id',
    USERNAME: 'naufal',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202605003',
    KELAS: 'Kelas 5',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'CERDAS_ISTIMEWA',
    CATATAN_INKLUSI: 'Juara OSN Matematika Kota - Pengayaan modul olimpiade',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-020',
    NAMA: 'Olivia Vanesha Santoso',
    EMAIL: 'olivia.vanesha@student.sdntangerang6.sch.id',
    USERNAME: 'olivia',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202605004',
    KELAS: 'Kelas 5',
    STATUS_KELULUSAN: 'AKTIF',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },

  // Kelas 6 (Alumni / Lulus)
  {
    ID: 'SISWA-021',
    NAMA: 'Pandu Winata Putra',
    EMAIL: 'pandu.winata@student.sdntangerang6.sch.id',
    USERNAME: 'pandu',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202606001',
    KELAS: 'Kelas 6',
    STATUS_KELULUSAN: 'LULUS',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-022',
    NAMA: 'Qori Amelia Putri',
    EMAIL: 'qori.amelia@student.sdntangerang6.sch.id',
    USERNAME: 'qori',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202606002',
    KELAS: 'Kelas 6',
    STATUS_KELULUSAN: 'LULUS',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-023',
    NAMA: 'Rian Hidayatullah',
    EMAIL: 'rian.hidayat@student.sdntangerang6.sch.id',
    USERNAME: 'rian',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202606003',
    KELAS: 'Kelas 6',
    STATUS_KELULUSAN: 'LULUS',
    KEBUTUHAN_KHUSUS: 'INKLUSI_DISLEKSIA',
    CATATAN_INKLUSI: 'Tuntas ujian sekolah dengan pembaca soal pendamping',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'SISWA-024',
    NAMA: 'Siti Nurhaliza Azzahra',
    EMAIL: 'siti.nurhaliza@student.sdntangerang6.sch.id',
    USERNAME: 'sitinur',
    PASSWORD: 'siswa123',
    ROLE: 'SISWA',
    SISTEM: 'CLASSROOM',
    STATUS: 'AKTIF',
    NIP: '202606004',
    KELAS: 'Kelas 6',
    STATUS_KELULUSAN: 'LULUS',
    KEBUTUHAN_KHUSUS: 'REGULER',
    CREATED_AT: nowISO(),
  },

  // ===== ADMIN ACCOUNTS =====
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
    let existingCount = 0;
    try {
      if (existingRaw) {
        const parsed = JSON.parse(existingRaw);
        if (Array.isArray(parsed)) {
          existingCount = parsed.length;
        }
      }
    } catch (e) {
      existingCount = 0;
    }

    if (existingCount === 0 || !localStorage.getItem(STORAGE_KEYS.ACCOUNTS_SEEDED)) {
      this.setItem(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS_SEEDED, 'true');
    }
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
