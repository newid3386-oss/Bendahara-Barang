import { firestore } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './localStorageService';

export interface FirebaseSyncStatus {
  isConfigured: boolean;
  isConnected: boolean;
  isRealtimeActive: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  lastError: string | null;
  cloudStats: {
    inventoryItems: number;
    assets: number;
    transactions: number;
    classroomCourses: number;
    assignments: number;
    submissions: number;
    students: number;
  };
}

class FirebaseService {
  private isSyncing: boolean = false;
  private isConnected: boolean = false;
  private isRealtimeActive: boolean = false;
  private lastSyncTime: string | null = null;
  private lastError: string | null = null;
  private unsubs: Array<() => void> = [];
  private listeners: Array<() => void> = [];
  private debounceTimer: any = null;
  private isApplyingRemoteUpdate: boolean = false;

  private cloudStats = {
    inventoryItems: 0,
    assets: 0,
    transactions: 0,
    classroomCourses: 0,
    assignments: 0,
    submissions: 0,
    students: 0,
  };

  constructor() {
    this.lastSyncTime = localStorage.getItem('BB_FIREBASE_LAST_SYNC') || null;
    this.init();
  }

  public init() {
    try {
      if (typeof window !== 'undefined') {
        this.setupRealtimeListeners();
        this.setupLocalMutationListener();
      }
    } catch (err: any) {
      console.warn('Firebase sync initialization notice:', err?.message);
    }
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Firebase listener error:', e);
      }
    });
  }

  public getStatus(): FirebaseSyncStatus {
    return {
      isConfigured: true,
      isConnected: this.isConnected,
      isRealtimeActive: this.isRealtimeActive,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError,
      cloudStats: { ...this.cloudStats },
    };
  }

  // =========================================================================
  // REALTIME FIRESTORE LISTENER (MULTI-DEVICE LIVE SYNC)
  // =========================================================================
  public setupRealtimeListeners() {
    // Clear any previous subscriptions
    this.unsubs.forEach((unsub) => unsub());
    this.unsubs = [];

    try {
      // 1. Inventory Bundle
      const invRef = doc(firestore, 'school_data', 'inventory_bundle');
      const unsubInv = onSnapshot(
        invRef,
        (snap) => {
          this.isConnected = true;
          this.isRealtimeActive = true;
          this.lastError = null;

          if (snap.exists()) {
            const data = snap.data();
            this.cloudStats.inventoryItems = Array.isArray(data.ITEMS) ? data.ITEMS.length : 0;
            this.cloudStats.assets = Array.isArray(data.ASSETS) ? data.ASSETS.length : 0;
            this.cloudStats.transactions =
              (Array.isArray(data.BARANG_MASUK) ? data.BARANG_MASUK.length : 0) +
              (Array.isArray(data.BARANG_KELUAR) ? data.BARANG_KELUAR.length : 0);

            // If remote timestamp is newer and we are not currently writing
            if (!this.isSyncing && data.payload && data.updatedAt) {
              const localLast = Number(localStorage.getItem('BB_LOCAL_MUTATION_TS') || '0');
              if (data.mutationTimestamp && data.mutationTimestamp > localLast) {
                this.applyRemotePayload(data.payload);
              }
            }
          }
          this.notify();
        },
        (error) => {
          console.warn('Firestore realtime inventory listener:', error.message);
          this.lastError = error.message;
          this.notify();
        }
      );
      this.unsubs.push(unsubInv);

      // 2. Classroom Bundle
      const classRef = doc(firestore, 'school_data', 'classroom_bundle');
      const unsubClass = onSnapshot(
        classRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            this.cloudStats.classroomCourses = Array.isArray(data.COURSES) ? data.COURSES.length : 0;
            this.cloudStats.assignments = Array.isArray(data.ASSIGNMENTS) ? data.ASSIGNMENTS.length : 0;
            this.cloudStats.submissions = Array.isArray(data.SUBMISSIONS) ? data.SUBMISSIONS.length : 0;

            if (!this.isSyncing && data.payload && data.mutationTimestamp) {
              const localLast = Number(localStorage.getItem('BB_LOCAL_MUTATION_TS') || '0');
              if (data.mutationTimestamp > localLast) {
                this.applyRemotePayload(data.payload);
              }
            }
          }
          this.notify();
        },
        (error) => {
          console.warn('Firestore classroom listener:', error.message);
        }
      );
      this.unsubs.push(unsubClass);

      // 3. Accounts Bundle
      const accRef = doc(firestore, 'school_data', 'accounts_bundle');
      const unsubAcc = onSnapshot(
        accRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            this.cloudStats.students = Array.isArray(data.ACCOUNTS)
              ? data.ACCOUNTS.filter((a: any) => a.ROLE === 'SISWA').length
              : 0;

            if (!this.isSyncing && data.payload && data.mutationTimestamp) {
              const localLast = Number(localStorage.getItem('BB_LOCAL_MUTATION_TS') || '0');
              if (data.mutationTimestamp > localLast) {
                this.applyRemotePayload(data.payload);
              }
            }
          }
          this.notify();
        },
        (error) => {
          console.warn('Firestore accounts listener:', error.message);
        }
      );
      this.unsubs.push(unsubAcc);
    } catch (err: any) {
      console.warn('Error configuring Firestore realtime listener:', err?.message);
    }
  }

  // =========================================================================
  // LOCAL STORAGE MUTATION LISTENER (AUTO PUSH TO CLOUD)
  // =========================================================================
  private setupLocalMutationListener() {
    if (typeof window === 'undefined') return;

    // Hook into db changes
    db.subscribe((key: string) => {
      if (this.isApplyingRemoteUpdate) return;

      const now = Date.now();
      localStorage.setItem('BB_LOCAL_MUTATION_TS', String(now));

      // Debounce push to Firestore
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        this.pushAllToCloud(false);
      }, 4000);
    });
  }

  // =========================================================================
  // SYNC ACTIONS: PUSH TO FIRESTORE
  // =========================================================================
  public async pushAllToCloud(isManual: boolean = true): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: 'Sinkronisasi sedang berlangsung...' };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    try {
      const now = new Date().toISOString();
      const mutationTimestamp = Date.now();

      // 1. Collect Inventory & Master data
      const items = db.getItems();
      const assets = db.getAssets();
      const suppliers = db.getSuppliers();
      const masuk = db.getBarangMasuk();
      const keluar = db.getBarangKeluar();
      const mutasi = db.getMutasi();
      const pemeliharaan = db.getPemeliharaan();
      const penghapusan = db.getPenghapusan();
      const pengambilan = db.getPengambilanATK();
      const stockSessions = db.getStockOpnameSessions();
      const stockScans = db.getStockOpnameScans();
      const procurementPlans = db.getProcurementPlans();
      const procurementDetails = db.getProcurementPlanDetails();
      const config = db.getConfig();

      const invPayload = {
        BB_ITEMS: JSON.stringify(items),
        BB_ASSETS: JSON.stringify(assets),
        BB_SUPPLIERS: JSON.stringify(suppliers),
        BB_BARANG_MASUK: JSON.stringify(masuk),
        BB_BARANG_KELUAR: JSON.stringify(keluar),
        BB_MUTASI: JSON.stringify(mutasi),
        BB_PEMELIHARAAN: JSON.stringify(pemeliharaan),
        BB_PENGHAPUSAN: JSON.stringify(penghapusan),
        BB_PENGAMBILAN_ATK: JSON.stringify(pengambilan),
        BB_STOCK_OPNAME_SESSIONS: JSON.stringify(stockSessions),
        BB_STOCK_OPNAME_SCANS: JSON.stringify(stockScans),
        BB_PROCUREMENT_PLANS: JSON.stringify(procurementPlans),
        BB_PROCUREMENT_PLAN_DETAILS: JSON.stringify(procurementDetails),
        BB_CONFIG: JSON.stringify(config),
      };

      await setDoc(doc(firestore, 'school_data', 'inventory_bundle'), {
        ITEMS: items,
        ASSETS: assets,
        BARANG_MASUK: masuk,
        BARANG_KELUAR: keluar,
        payload: invPayload,
        updatedAt: now,
        mutationTimestamp,
        syncedBy: isManual ? 'MANUAL_USER' : 'AUTO_SYNC',
      });

      // 2. Collect Classroom data
      const coursesRaw = localStorage.getItem('BB_CLASSROOM_COURSES') || '[]';
      const assignmentsRaw = localStorage.getItem('BB_CLASSROOM_ASSIGNMENTS') || '[]';
      const submissionsRaw = localStorage.getItem('BB_CLASSROOM_SUBMISSIONS') || '[]';
      const reportsRaw = localStorage.getItem('BB_CLASSROOM_REPORTS') || '[]';
      const forumRaw = localStorage.getItem('BB_CLASSROOM_FORUM_POSTS_V3') || '[]';
      const attendanceRaw = localStorage.getItem('BB_CLASSROOM_ATTENDANCE_V3') || '[]';
      const quizzesRaw = localStorage.getItem('BB_CLASSROOM_QUIZZES_V3') || '[]';

      const classPayload = {
        BB_CLASSROOM_COURSES: coursesRaw,
        BB_CLASSROOM_ASSIGNMENTS: assignmentsRaw,
        BB_CLASSROOM_SUBMISSIONS: submissionsRaw,
        BB_CLASSROOM_REPORTS: reportsRaw,
        BB_CLASSROOM_FORUM_POSTS_V3: forumRaw,
        BB_CLASSROOM_ATTENDANCE_V3: attendanceRaw,
        BB_CLASSROOM_QUIZZES_V3: quizzesRaw,
      };

      await setDoc(doc(firestore, 'school_data', 'classroom_bundle'), {
        COURSES: JSON.parse(coursesRaw),
        ASSIGNMENTS: JSON.parse(assignmentsRaw),
        SUBMISSIONS: JSON.parse(submissionsRaw),
        payload: classPayload,
        updatedAt: now,
        mutationTimestamp,
        syncedBy: isManual ? 'MANUAL_USER' : 'AUTO_SYNC',
      });

      // 3. Collect Accounts
      const accountsRaw = localStorage.getItem('BB_ACCOUNTS') || '[]';
      const accPayload = {
        BB_ACCOUNTS: accountsRaw,
      };

      await setDoc(doc(firestore, 'school_data', 'accounts_bundle'), {
        ACCOUNTS: JSON.parse(accountsRaw),
        payload: accPayload,
        updatedAt: now,
        mutationTimestamp,
        syncedBy: isManual ? 'MANUAL_USER' : 'AUTO_SYNC',
      });

      this.lastSyncTime = now.replace('T', ' ').substring(0, 19);
      localStorage.setItem('BB_FIREBASE_LAST_SYNC', this.lastSyncTime);
      this.isConnected = true;
      this.isSyncing = false;
      this.notify();

      return {
        success: true,
        message: 'Seluruh data inventaris & classroom berhasil disinkronkan ke Firebase Cloud!',
      };
    } catch (err: any) {
      console.error('Error syncing to Firebase Cloud:', err);
      this.lastError = err?.message || 'Gagal menyinkronkan data ke Cloud';
      this.isSyncing = false;
      this.notify();
      return {
        success: false,
        message: this.lastError || 'Gagal sinkronisasi',
      };
    }
  }

  // =========================================================================
  // SYNC ACTIONS: PULL FROM FIRESTORE
  // =========================================================================
  public async pullAllFromCloud(): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: 'Sinkronisasi sedang berlangsung...' };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    try {
      let appliedCount = 0;

      // 1. Inventory Bundle
      const invSnap = await getDoc(doc(firestore, 'school_data', 'inventory_bundle'));
      if (invSnap.exists() && invSnap.data()?.payload) {
        this.applyRemotePayload(invSnap.data().payload);
        appliedCount++;
      }

      // 2. Classroom Bundle
      const classSnap = await getDoc(doc(firestore, 'school_data', 'classroom_bundle'));
      if (classSnap.exists() && classSnap.data()?.payload) {
        this.applyRemotePayload(classSnap.data().payload);
        appliedCount++;
      }

      // 3. Accounts Bundle
      const accSnap = await getDoc(doc(firestore, 'school_data', 'accounts_bundle'));
      if (accSnap.exists() && accSnap.data()?.payload) {
        this.applyRemotePayload(accSnap.data().payload);
        appliedCount++;
      }

      const now = new Date().toISOString();
      this.lastSyncTime = now.replace('T', ' ').substring(0, 19);
      localStorage.setItem('BB_FIREBASE_LAST_SYNC', this.lastSyncTime);
      this.isConnected = true;
      this.isSyncing = false;
      this.notify();

      return {
        success: true,
        message: `Berhasil mengunduh dan memperbarui ${appliedCount} modul data dari Cloud Database!`,
      };
    } catch (err: any) {
      console.error('Error pulling from Firebase Cloud:', err);
      this.lastError = err?.message || 'Gagal mengunduh dari Cloud Database';
      this.isSyncing = false;
      this.notify();
      return {
        success: false,
        message: this.lastError || 'Gagal mengunduh data',
      };
    }
  }

  private applyRemotePayload(payload: Record<string, string>) {
    if (!payload || typeof payload !== 'object') return;

    this.isApplyingRemoteUpdate = true;
    try {
      Object.entries(payload).forEach(([key, valStr]) => {
        if (typeof valStr === 'string' && valStr.trim().length > 0) {
          localStorage.setItem(key, valStr);
        }
      });
    } finally {
      setTimeout(() => {
        this.isApplyingRemoteUpdate = false;
        this.notify();
      }, 500);
    }
  }

  // =========================================================================
  // FILE & ATTACHMENT COMPRESSION HELPER (Prevent localStorage overflow)
  // =========================================================================
  public async processFileAttachment(file: File): Promise<{
    name: string;
    size: number;
    type: string;
    dataUrl: string;
  }> {
    return new Promise((resolve, reject) => {
      // If file is image, compress using Canvas
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDimension = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
              resolve({
                name: file.name,
                size: Math.round((compressedDataUrl.length * 3) / 4),
                type: 'image/jpeg',
                dataUrl: compressedDataUrl,
              });
            } else {
              resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: e.target?.result as string,
              });
            }
          };
          img.onerror = () => reject(new Error('Gagal memuat berkas gambar'));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Gagal membaca berkas'));
        reader.readAsDataURL(file);
      } else {
        // Document / PDF file
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            dataUrl: e.target?.result as string,
          });
        };
        reader.onerror = () => reject(new Error('Gagal membaca berkas'));
        reader.readAsDataURL(file);
      }
    });
  }
}

export const firebaseService = new FirebaseService();
