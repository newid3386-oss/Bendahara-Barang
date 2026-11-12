import {
  ClassroomCourse,
  ClassroomAssignment,
  ClassroomSubmission,
  ClassroomReport,
  ForumPost,
  ForumComment,
  AttendanceRecord,
  AttendanceStatus,
  ClassroomQuiz,
  QuizAttempt,
  LearningMaterial,
  ClassScheduleItem,
  ClassroomMedia,
  MediaSubmission,
  MediaType,
  VirtualLiveClassSession,
  ClassroomNotification,
  GradeWeightConfig,
  StudentPortfolioItem,
  PortfolioComment,
  P5Project,
  P5ProjectStage,
  P5ProjectDailyLog,
  GradeChangeLog,
  SubjectKkmAlert,
  AssignmentErrorPattern,
  RemedialModule,
  SpecialInterventionStudent,
  ErrorCategory,
  AffectedStudentInfo,
  StudentBehaviorLog,
  BehaviorAnalysisInsight,
  BehaviorCategory,
  BehaviorType,
  ComprehensiveStudentReportData,
  ComprehensiveStudentSubjectGrade,
  RemedialGuidanceSession,
  RemedialSessionStatus,
} from '../types/classroom';
import { offlineSyncManager } from './offlineSyncManager';
import { progressSyncService } from './progressSyncService';

const STORAGE_KEYS = {
  COURSES: 'BB_CLASSROOM_COURSES',
  ASSIGNMENTS: 'BB_CLASSROOM_ASSIGNMENTS',
  SUBMISSIONS: 'BB_CLASSROOM_SUBMISSIONS',
  REPORTS: 'BB_CLASSROOM_REPORTS',
  REMEDIAL_MODULES: 'BB_CLASSROOM_REMEDIAL_MODULES_V1',
  ASSIGNED_REMEDIAL: 'BB_CLASSROOM_ASSIGNED_REMEDIAL_V1',
  FORUM_POSTS: 'BB_CLASSROOM_FORUM_POSTS_V3',
  ATTENDANCE: 'BB_CLASSROOM_ATTENDANCE_V3',
  QUIZZES: 'BB_CLASSROOM_QUIZZES_V3',
  QUIZ_ATTEMPTS: 'BB_CLASSROOM_QUIZ_ATTEMPTS_V3',
  MATERIALS: 'BB_CLASSROOM_MATERIALS_V3',
  SCHEDULES: 'BB_CLASSROOM_SCHEDULES_V3',
  MEDIA: 'BB_CLASSROOM_MEDIA_V1',
  MEDIA_SUBMISSIONS: 'BB_CLASSROOM_MEDIA_SUBMISSIONS_V1',
  LIVE_CLASSES: 'BB_CLASSROOM_LIVE_CLASSES_V1',
  NOTIFICATIONS: 'BB_CLASSROOM_NOTIFICATIONS_V1',
  GRADE_WEIGHTS: 'BB_CLASSROOM_GRADE_WEIGHTS_V1',
  PORTFOLIO: 'BB_CLASSROOM_PORTFOLIO_V1',
  P5_PROJECTS: 'BB_CLASSROOM_P5_PROJECTS_V1',
  P5_DAILY_LOGS: 'BB_CLASSROOM_P5_DAILY_LOGS_V1',
  GRADE_LOGS: 'BB_CLASSROOM_GRADE_LOGS_V1',
  SUBJECT_KKM: 'BB_CLASSROOM_SUBJECT_KKM_V1',
  BEHAVIOR_LOGS: 'BB_CLASSROOM_BEHAVIOR_LOGS_V1',
  REMEDIAL_SESSIONS: 'BB_CLASSROOM_REMEDIAL_SESSIONS_V1',
  SEEDED: 'BB_CLASSROOM_SEEDED_V4',
};

export const DEFAULT_SUBJECT_KKM: Record<string, number> = {
  'Matematika': 75,
  'Bahasa Indonesia': 78,
  'IPAS': 75,
  'Pendidikan Pancasila': 78,
  'PJOK': 80,
  'Seni Budaya': 80,
  'Bahasa Inggris': 72,
  'Pendidikan Agama': 80,
};

const nowISO = () => new Date().toISOString();

const DEFAULT_P5_PROJECTS: P5Project[] = [
  {
    ID: 'P5-PRJ-KLS1',
    KELAS: 'Kelas 1',
    JUDUL: 'Kearifan Lokal: Makanan Tradisional Sehat Nusantara',
    TEMA: 'Kearifan Lokal',
    DESKRIPSI: 'Mengenal dan membuat jajanan pasar tradisional sehat khas daerah Tangerang.',
    DIMENSI: ['Kebinekaan Global', 'Gotong Royong', 'Kreatif'],
    STAGES: [
      { ID: 'STG-1', NAME: 'Tahap 1: Pengenalan Kue Tradisional', DESCRIPTION: 'Mengenal klepon, getuk, dan kue talam', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-15' },
      { ID: 'STG-2', NAME: 'Tahap 2: Wawancara Pembuat Jajanan', DESCRIPTION: 'Bertanya kepada pembuat kue tradisional setempat', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-25' },
      { ID: 'STG-3', NAME: 'Tahap 3: Praktik Membuat Kue Bersama', DESCRIPTION: 'Praktik membuat jajanan pasar sehat di sekolah', STATUS: 'SEDANG_BERJALAN' },
      { ID: 'STG-4', NAME: 'Tahap 4: Festival Kuliner & Gelar Karya', DESCRIPTION: 'Bazar jajanan pasar dan evaluasi hasil belajar', STATUS: 'BELUM_MULAI' }
    ],
    PERCENTAGE: 62,
    DEADLINE: '2026-11-09',
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'GURU_SYS'
  },
  {
    ID: 'P5-PRJ-KLS2',
    KELAS: 'Kelas 2',
    JUDUL: 'Bhinneka Tunggal Ika: Indahnya Keragaman Budaya Sekolahku',
    TEMA: 'Bhinneka Tunggal Ika',
    DESKRIPSI: 'Menghargai perbedaan suku, pakaian adat, dan tarian tradisional teman-teman di kelas.',
    DIMENSI: ['Kebinekaan Global', 'Beriman & Bertakwa', 'Gotong Royong'],
    STAGES: [
      { ID: 'STG-1', NAME: 'Tahap 1: Pemetaan Suku & Asal-Usul', DESCRIPTION: 'Mengenal keberagaman budaya teman sekelas', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-10' },
      { ID: 'STG-2', NAME: 'Tahap 2: Pembuatan Mading Pakaian Adat', DESCRIPTION: 'Kreativitas gambar & kliping busana nusantara', STATUS: 'SEDANG_BERJALAN' },
      { ID: 'STG-3', NAME: 'Tahap 3: Pentas Seni & Lagu Daerah', DESCRIPTION: 'Penampilan lagu & tarian tradisional kelas', STATUS: 'BELUM_MULAI' },
      { ID: 'STG-4', NAME: 'Tahap 4: Refleksi Kebinekaan', DESCRIPTION: 'Jurnal pengalaman bertoleransi & kebersamaan', STATUS: 'BELUM_MULAI' }
    ],
    PERCENTAGE: 38,
    DEADLINE: '2026-11-06',
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'GURU_SYS'
  },
  {
    ID: 'P5-PRJ-KLS3',
    KELAS: 'Kelas 3',
    JUDUL: 'Kewirausahaan: Apotek Hidup & Olahan Herbal Sekolah',
    TEMA: 'Kewirausahaan',
    DESKRIPSI: 'Menanam tanaman obat keluarga (TOGA) dan mengolahnya menjadi minuman sehat bernilai jual.',
    DIMENSI: ['Mandiri', 'Kreatif', 'Bernalar Kritis'],
    STAGES: [
      { ID: 'STG-1', NAME: 'Tahap 1: Pengenalan Tanaman Obat (TOGA)', DESCRIPTION: 'Mengenal jahe, kunyit, temulawak, dan serai', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-05' },
      { ID: 'STG-2', NAME: 'Tahap 2: Menanam TOGA di Pot Daur Ulang', DESCRIPTION: 'Praktik penanaman bibit di kebun sekolah', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-18' },
      { ID: 'STG-3', NAME: 'Tahap 3: Pengolahan Minuman Kunyit Asam', DESCRIPTION: 'Pembuatan jamu & minuman herbal segar', STATUS: 'SEDANG_BERJALAN' },
      { ID: 'STG-4', NAME: 'Tahap 4: Pasar Produk Herbal Cilik', DESCRIPTION: 'Penjualan minuman herbal saat hari bebas kendaraan', STATUS: 'BELUM_MULAI' }
    ],
    PERCENTAGE: 62,
    DEADLINE: '2026-11-12',
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'GURU_SYS'
  },
  {
    ID: 'P5-PRJ-KLS4',
    KELAS: 'Kelas 4',
    JUDUL: 'Gaya Hidup Berkelanjutan: Pengolahan Sampah Organik & Bank Sampah',
    TEMA: 'Gaya Hidup Berkelanjutan',
    DESKRIPSI: 'Mengajarkan siswa pemilahan sampah, komposting pupuk organik, dan pengelolaan bank sampah sekolah.',
    DIMENSI: ['Gotong Royong', 'Bernalar Kritis', 'Kreatif'],
    STAGES: [
      { ID: 'STG-1', NAME: 'Tahap 1: Sosialisasi & Audit Sampah Sekolah', DESCRIPTION: 'Mengenal jenis sampah organik & anorganik di sekitar sekolah', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-10' },
      { ID: 'STG-2', NAME: 'Tahap 2: Merancang Komposter Takakura', DESCRIPTION: 'Pembuatan wadah kompos dan pemilahan sampah harian', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-20' },
      { ID: 'STG-3', NAME: 'Tahap 3: Monitoring Fermentasi Kompos', DESCRIPTION: 'Pengukuran suhu dan pembalikan kompos berkala', STATUS: 'SEDANG_BERJALAN' },
      { ID: 'STG-4', NAME: 'Tahap 4: Panen Karya Pupuk & Pameran P5', DESCRIPTION: 'Pemasaran pupuk organik untuk kebun sekolah dan refleksi', STATUS: 'BELUM_MULAI' }
    ],
    PERCENTAGE: 62,
    DEADLINE: '2026-11-07',
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'GURU_SYS'
  },
  {
    ID: 'P5-PRJ-KLS5',
    KELAS: 'Kelas 5',
    JUDUL: 'Rekayasa dan Teknologi: Sistem Penyiraman Otomatis Tanaman',
    TEMA: 'Rekayasa dan Teknologi',
    DESKRIPSI: 'Merancang alat penyiram tanaman berbasis sensor kelembaban tanah sederhana.',
    DIMENSI: ['Bernalar Kritis', 'Kreatif', 'Mandiri'],
    STAGES: [
      { ID: 'STG-1', NAME: 'Tahap 1: Pengenalan Komponen & Rangkaian', DESCRIPTION: 'Pemahaman prinsip kapilaritas & sakelar listrik', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-12' },
      { ID: 'STG-2', NAME: 'Tahap 2: Desain Maket & Perakitan Alat', DESCRIPTION: 'Merangkai pompa mini dan selang penyiram', STATUS: 'SEDANG_BERJALAN' },
      { ID: 'STG-3', NAME: 'Tahap 3: Uji Coba Penyiraman Otomatis', DESCRIPTION: 'Pengujian efisiensi air di taman kelas', STATUS: 'BELUM_MULAI' },
      { ID: 'STG-4', NAME: 'Tahap 4: Laporan Inovasi & Presentasi Karya', DESCRIPTION: 'Presentasi hasil karya rekayasa di depan wali murid', STATUS: 'BELUM_MULAI' }
    ],
    PERCENTAGE: 38,
    DEADLINE: '2026-11-07',
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'GURU_SYS'
  },
  {
    ID: 'P5-PRJ-KLS6',
    KELAS: 'Kelas 6',
    JUDUL: 'Suara Demokrasi: Pemilihan Ketua OSIS / Dokter Cilik Sekolah',
    TEMA: 'Suara Demokrasi',
    DESKRIPSI: 'Simulasi pemilu sekolah dengan asas Luber Jurdil, perumusan visi mosi, dan pemungutan suara digital.',
    DIMENSI: ['Bernalar Kritis', 'Gotong Royong', 'Kebinekaan Global'],
    STAGES: [
      { ID: 'STG-1', NAME: 'Tahap 1: Pendaftaran & Penyampaian Visi-Misi', DESCRIPTION: 'Pendaftaran calon ketua & kampanye dialogis', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-08' },
      { ID: 'STG-2', NAME: 'Tahap 2: Debat Terbuka Kandidat', DESCRIPTION: 'Adu gagasan program kerja pengembangan sekolah', STATUS: 'SELESAI', COMPLETED_AT: '2026-08-19' },
      { ID: 'STG-3', NAME: 'Tahap 3: Pemungutan Suara E-Voting', DESCRIPTION: 'Pelaksanaan pencoblosan/e-voting di TPS kelas', STATUS: 'SEDANG_BERJALAN' },
      { ID: 'STG-4', NAME: 'Tahap 4: Penghitungan Suara & Pelantikan', DESCRIPTION: 'Pengumuman pemenang & pidato penutupan', STATUS: 'BELUM_MULAI' }
    ],
    PERCENTAGE: 62,
    DEADLINE: '2026-11-06',
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'GURU_SYS'
  }
];

const DEFAULT_P5_DAILY_LOGS: P5ProjectDailyLog[] = [
  {
    ID: 'P5-LOG-001',
    PROJECT_ID: 'P5-PRJ-KLS4',
    PROJECT_TITLE: 'Gaya Hidup Berkelanjutan: Pengelolaan Sampah Organik Menjadi Kompos',
    KELAS: 'Kelas 4',
    SISWA_ID: 'SISWA-001',
    SISWA_NAMA: 'Ahmad Fauzan',
    TANGGAL: '2026-10-24',
    TAHAP_ID: 'STG-2',
    TAHAP_NAMA: 'Tahap 2: Pengumpulan & Pencacahan Bahan Organik',
    AKTIVITAS: 'Bersama kelompok mengumpulkan daun kering di halaman sekolah dan sisa sayur dari kantin. Kemudian kami mencacah bahan menjadi ukuran 2-3 cm agar cepat terurai.',
    REFLEKSI: 'Awalnya bau sisa sayur agak menyengat, tetapi setelah ditaburi EM4 dan dedak, aromanya berubah menjadi fermentasi manis. Saya belajar bekerja sama dan sabar.',
    DIMENSI_TERLATIH: ['Gotong Royong', 'Bernalar Kritis', 'Mandiri'],
    DOKUMENTASI_URL: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
    FEEDBACK_GURU: 'Bagus sekali Ahmad dan tim kelompok! Pencacahan daun sudah sesuai takaran. Jangan lupa cek kelembapan komposter setiap 2 hari ya.',
    GURU_NAMA: 'Siti Rahmawati, S.Pd.',
    FEEDBACK_AT: '2026-10-24T14:30:00.000Z',
    STATUS: 'REVIEWED',
    CREATED_AT: '2026-10-24T10:15:00.000Z',
    UPDATED_AT: '2026-10-24T14:30:00.000Z',
  },
  {
    ID: 'P5-LOG-002',
    PROJECT_ID: 'P5-PRJ-KLS4',
    PROJECT_TITLE: 'Gaya Hidup Berkelanjutan: Pengelolaan Sampah Organik Menjadi Kompos',
    KELAS: 'Kelas 4',
    SISWA_ID: 'SISWA-002',
    SISWA_NAMA: 'Siti Aisyah Putri',
    TANGGAL: '2026-10-25',
    TAHAP_ID: 'STG-2',
    TAHAP_NAMA: 'Tahap 2: Pengumpulan & Pencacahan Bahan Organik',
    AKTIVITAS: 'Mencatat suhu dan kelembapan wadah komposter drum putar. Suhu tercatat 42°C, menandakan bakteri aerob bekerja aktif.',
    REFLEKSI: 'Saya sangat takjub melihat mikroorganisme bisa menaikkan suhu tumpukan daun secara alami tanpa listrik.',
    DIMENSI_TERLATIH: ['Bernalar Kritis', 'Kreatif'],
    DOKUMENTASI_URL: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80',
    FEEDBACK_GURU: 'Pencatatan data sains yang sangat rapi Aisyah! Teruskan observasi kenaikan suhunya.',
    GURU_NAMA: 'Siti Rahmawati, S.Pd.',
    FEEDBACK_AT: '2026-10-25T16:00:00.000Z',
    STATUS: 'REVIEWED',
    CREATED_AT: '2026-10-25T11:20:00.000Z',
    UPDATED_AT: '2026-10-25T16:00:00.000Z',
  },
  {
    ID: 'P5-LOG-003',
    PROJECT_ID: 'P5-PRJ-KLS4',
    PROJECT_TITLE: 'Gaya Hidup Berkelanjutan: Pengelolaan Sampah Organik Menjadi Kompos',
    KELAS: 'Kelas 4',
    SISWA_ID: 'SISWA-003',
    SISWA_NAMA: 'Rian Pratama',
    TANGGAL: '2026-10-26',
    TAHAP_ID: 'STG-3',
    TAHAP_NAMA: 'Tahap 3: Pembuatan Desain Kemasan & Label Pupuk',
    AKTIVITAS: 'Mendesain stiker label botol pupuk organik cair (POC) dengan logo SDN Tangerang 6 menggunakan spidol warna dan kertas daur ulang.',
    REFLEKSI: 'Menemukan kombinasi warna hijau dan cokelat yang melambangkan kelestarian bumi.',
    DIMENSI_TERLATIH: ['Kreatif', 'Mandiri'],
    STATUS: 'SUBMITTED',
    CREATED_AT: '2026-10-26T08:30:00.000Z',
    UPDATED_AT: '2026-10-26T08:30:00.000Z',
  }
];

const ts = () => nowISO().replace('T', ' ').substring(0, 19);
const todayDate = () => new Date().toISOString().slice(0, 10);

const DEFAULT_COURSES: ClassroomCourse[] = [
  {
    ID: 'CRS-001',
    KODE_KELAS: 'KLS1-2026',
    NAMA: 'Kelas 1 - Tema Lingkungan & Diriku',
    DESKRIPSI: 'Pembelajaran Tematik Terpadu Kurikulum Merdeka untuk siswa Kelas 1. Bahasa Indonesia, Matematika, Seni & IPAS.',
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    SISWA_IDS: ['SISWA-001', 'SISWA-002', 'SISWA-003', 'SISWA-004'],
    KELAS_TINGKAT: 'Kelas 1',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'CRS-002',
    KODE_KELAS: 'KLS2-2026',
    NAMA: 'Kelas 2 - Tema Bermain di Lingkunganku',
    DESKRIPSI: 'Pembelajaran Tematik Terpadu untuk siswa Kelas 2. Penguatan literasi membaca, berhitung dan karakter.',
    GURU_ID: 'ACC-CLS-003',
    GURU_NAMA: 'Endang Wahyuni, S.Pd.SD.',
    SISWA_IDS: ['SISWA-005', 'SISWA-006', 'SISWA-007', 'SISWA-008'],
    KELAS_TINGKAT: 'Kelas 2',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'CRS-003',
    KODE_KELAS: 'KLS3-2026',
    NAMA: 'Kelas 3 - Tema Selalu Berhemat Energi',
    DESKRIPSI: 'Pembelajaran Tematik Tema 1-4 untuk siswa Kelas 3 dengan fokus literasi, numerasi dan sains lingkungan.',
    GURU_ID: 'ACC-CLS-004',
    GURU_NAMA: 'Ahmad Fauzi, S.Pd.',
    SISWA_IDS: ['SISWA-009', 'SISWA-010', 'SISWA-011', 'SISWA-012'],
    KELAS_TINGKAT: 'Kelas 3',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'CRS-004',
    KODE_KELAS: 'KLS4-2026',
    NAMA: 'Kelas 4 - Tema Indahnya Kebersamaan',
    DESKRIPSI: 'Pembelajaran Tematik IPAS, Bahasa Indonesia, dan Pendidikan Pancasila Kelas 4.',
    GURU_ID: 'ACC-CLS-005',
    GURU_NAMA: 'Dewi Lestari, S.Pd.SD.',
    SISWA_IDS: ['SISWA-013', 'SISWA-014', 'SISWA-015', 'SISWA-016'],
    KELAS_TINGKAT: 'Kelas 4',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'CRS-005',
    KODE_KELAS: 'KLS5-2026',
    NAMA: 'Kelas 5 - Tema Ekosistem & Koding Dasar',
    DESKRIPSI: 'Pembelajaran IPAS Ekosistem, Matematika Pecahan, dan Dasar Algoritma Koding SD Kelas 5.',
    GURU_ID: 'ACC-CLS-006',
    GURU_NAMA: 'M. Rizky Pratama, S.Pd.',
    SISWA_IDS: ['SISWA-017', 'SISWA-018', 'SISWA-019', 'SISWA-020'],
    KELAS_TINGKAT: 'Kelas 5',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'CRS-006',
    KODE_KELAS: 'KLS6-2026',
    NAMA: 'Kelas 6 - Tema Persatuan dalam Perbedaan & Koding Lanjut',
    DESKRIPSI: 'Persiapan Asesmen Standarisasi Pendidikan Daerah, Pembelajaran Tematik dan Modul Koding Kelas 6.',
    GURU_ID: 'ACC-CLS-007',
    GURU_NAMA: 'Drs. H. Mulyadi, M.Pd.',
    SISWA_IDS: ['SISWA-021', 'SISWA-022', 'SISWA-023', 'SISWA-024'],
    KELAS_TINGKAT: 'Kelas 6',
    CREATED_AT: nowISO(),
  },
];

const DEFAULT_ASSIGNMENTS: ClassroomAssignment[] = [
  // Kelas 1
  {
    ID: 'ASG-001',
    COURSE_ID: 'CRS-001',
    JUDUL: 'Tugas Menggambar Pohon di Sekitar Rumah',
    DESKRIPSI: 'Gambarlah 1 pohon yang ada di sekitar rumahmu, lalu ceritakan dalam 3 kalimat mengapa pohon itu penting bagi udara bersih.',
    DEADLINE: '2026-09-05',
    TYPE: 'TUGAS',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
  },
  {
    ID: 'ASG-002',
    COURSE_ID: 'CRS-001',
    JUDUL: 'Materi: Mengenal Huruf Vokal dan Konsonan',
    DESKRIPSI: 'Bacalah materi huruf vokal A I U E O beserta contoh kata benda di kelas. Lengkapi latihan di buku halaman 12-14.',
    DEADLINE: '2026-09-03',
    TYPE: 'MATERI',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
  },

  // Kelas 2
  {
    ID: 'ASG-003',
    COURSE_ID: 'CRS-002',
    JUDUL: 'Latihan Menulis Huruf Tegak Bersambung',
    DESKRIPSI: 'Salinlah teks pendek tentang gotong royong di buku halus kasar dengan rapi dan benar.',
    DEADLINE: '2026-09-06',
    TYPE: 'TUGAS',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-003',
    GURU_NAMA: 'Endang Wahyuni, S.Pd.SD.',
  },

  // Kelas 3
  {
    ID: 'ASG-004',
    COURSE_ID: 'CRS-003',
    JUDUL: 'Ulangan Harian 1 - Operasi Penjumlahan & Pengurangan',
    DESKRIPSI: 'Kerjakan 20 soal penjumlahan dan pengurangan ratusan dengan cara bersusun panjang dan pendek.',
    DEADLINE: '2026-09-08',
    TYPE: 'ULANGAN',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-004',
    GURU_NAMA: 'Ahmad Fauzi, S.Pd.',
  },

  // Kelas 4
  {
    ID: 'ASG-005',
    COURSE_ID: 'CRS-004',
    JUDUL: 'Proyek IPAS: Rantai Makanan Sawah',
    DESKRIPSI: 'Buatlah bagan rantai makanan pada ekosistem sawah dan sebutkan peran produsen, konsumen 1, 2, dan pengurai.',
    DEADLINE: '2026-09-09',
    TYPE: 'TUGAS',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-005',
    GURU_NAMA: 'Dewi Lestari, S.Pd.SD.',
  },

  // Kelas 5
  {
    ID: 'ASG-006',
    COURSE_ID: 'CRS-005',
    JUDUL: 'Materi & Praktik Koding: Logika Percabangan IF-ELSE',
    DESKRIPSI: 'Pelajari bab 2 Buku Koding Erlangga halaman 25-34 tentang kondisi Logika IF-THEN dalam menyelesaikan masalah matematika.',
    DEADLINE: '2026-09-10',
    TYPE: 'MATERI',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-006',
    GURU_NAMA: 'M. Rizky Pratama, S.Pd.',
  },

  // Kelas 6
  {
    ID: 'ASG-007',
    COURSE_ID: 'CRS-006',
    JUDUL: 'Latihan Mandiri Persiapan Asesmen - IPA & Matematika',
    DESKRIPSI: 'Kerjakan paket soal latihan 1 bab Sistem Tata Surya dan Pengolahan Data Statistik Sederhana.',
    DEADLINE: '2026-09-11',
    TYPE: 'TUGAS',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-007',
    GURU_NAMA: 'Drs. H. Mulyadi, M.Pd.',
  },
];

const DEFAULT_SUBMISSIONS: ClassroomSubmission[] = [
  {
    ID: 'SUB-001',
    ASSIGNMENT_ID: 'ASG-001',
    COURSE_ID: 'CRS-001',
    SISWA_ID: 'SISWA-001',
    SISWA_NAMA: 'Aisyah Putri Rahmadani',
    ISI: 'Saya menggambar pohon mangga di halaman depan rumah. Pohon mangga menghasilkan oksigen bersih dan keteduhan di siang hari.',
    FILE_LINK: 'https://drive.google.com/file/d/tugas-gambar-aisyah.jpg',
    SUBMITTED_AT: ts(),
    STATUS: 'SUBMITTED',
  },
  {
    ID: 'SUB-002',
    ASSIGNMENT_ID: 'ASG-001',
    COURSE_ID: 'CRS-001',
    SISWA_ID: 'SISWA-002',
    SISWA_NAMA: 'Bima Sakti Pratama',
    ISI: 'Pohon beringin rindang di dekat taman bermain. Di atas pohon ada sarang burung gereja yang berkicau riang.',
    FILE_LINK: 'https://drive.google.com/file/d/pohon-bima.pdf',
    SUBMITTED_AT: ts(),
    STATUS: 'SUBMITTED',
  },
  {
    ID: 'SUB-003',
    ASSIGNMENT_ID: 'ASG-003',
    COURSE_ID: 'CRS-002',
    SISWA_ID: 'SISWA-005',
    SISWA_NAMA: 'Fadil Ramadhan Al-Farisi',
    ISI: 'Telah menulis teks cerita gotong royong 3 paragraf di buku halus kasar dengan rapi sesuai kaidah PUEBI.',
    SUBMITTED_AT: ts(),
    STATUS: 'SUBMITTED',
  },
  {
    ID: 'SUB-004',
    ASSIGNMENT_ID: 'ASG-001',
    COURSE_ID: 'CRS-001',
    SISWA_ID: 'SISWA-004',
    SISWA_NAMA: 'Zahra Aulia Nabila',
    ISI: 'Pohon kelapa di kebun kakek sangat tinggi. Daunnya bisa untuk ketupat dan buahnya untuk minuman segar.',
    SUBMITTED_AT: ts(),
    STATUS: 'GRADED',
    NILAI: 95,
    FEEDBACK: 'Sangat bagus Zahra! Gambar rapi dan penjelasannya sangat lengkap.',
    GRADED_BY: 'Nurul Hidayah, S.Pd.',
    GRADED_AT: ts(),
  },
];

const DEFAULT_GRADE_LOGS: GradeChangeLog[] = [
  {
    ID: 'GLOG-001',
    SISWA_ID: 'SISWA-004',
    SISWA_NAMA: 'Zahra Aulia Nabila',
    SUBMISSION_ID: 'SUB-004',
    ASSIGNMENT_ID: 'ASG-001',
    ASSIGNMENT_TITLE: 'Tugas 1: Mengamati & Menggambar Benda Hidup',
    OLD_NILAI: 85,
    NEW_NILAI: 95,
    DIFF: 10,
    CHANGED_AT: '2026-10-28 10:15:00',
    CHANGED_BY: 'Nurul Hidayah, S.Pd.',
    REASON: 'Perbaikan detail gambar dan penjelasan manfaat pohon kelapa.',
  },
  {
    ID: 'GLOG-002',
    SISWA_ID: 'SISWA-001',
    SISWA_NAMA: 'Ahmad Zaki Pratama',
    ASSIGNMENT_ID: 'ASG-002',
    ASSIGNMENT_TITLE: 'Latihan 2: Pengenalan Angka & Berhitung Penjumlahan',
    OLD_NILAI: 68,
    NEW_NILAI: 82,
    DIFF: 14,
    CHANGED_AT: '2026-10-29 14:30:00',
    CHANGED_BY: 'Nurul Hidayah, S.Pd.',
    REASON: 'Selesai mengikuti sesi bimbingan remedial dan perbaikan soal hitung.',
  },
  {
    ID: 'GLOG-003',
    SISWA_ID: 'SISWA-002',
    SISWA_NAMA: 'Siti Aisyah Putri',
    ASSIGNMENT_ID: 'ASG-001',
    ASSIGNMENT_TITLE: 'Tugas 1: Mengamati & Menggambar Benda Hidup',
    OLD_NILAI: 78,
    NEW_NILAI: 88,
    DIFF: 10,
    CHANGED_AT: '2026-10-30 09:45:00',
    CHANGED_BY: 'Nurul Hidayah, S.Pd.',
    REASON: 'Penyempurnaan deskripsi pengamatan lingkungan.',
  },
  {
    ID: 'GLOG-004',
    SISWA_ID: 'SISWA-003',
    SISWA_NAMA: 'Budi Santoso',
    ASSIGNMENT_ID: 'ASG-003',
    ASSIGNMENT_TITLE: 'Tugas Literasi: Menyusun Paragraf Sederhana',
    OLD_NILAI: 65,
    NEW_NILAI: 76,
    DIFF: 11,
    CHANGED_AT: '2026-11-01 11:20:00',
    CHANGED_BY: 'Nurul Hidayah, S.Pd.',
    REASON: 'Remedial mandiri: Penulisan huruf kapital dan tanda baca sudah tuntas KKM.',
  },
];

const DEFAULT_REPORTS: ClassroomReport[] = [
  {
    ID: 'RPT-001',
    JUDUL: 'Laporan Bulanan Pembelajaran Kelas 1 - Agustus 2026',
    KATEGORI: 'Laporan Bulanan',
    ISI:
      'Pembelajaran Kelas 1 pada bulan Agustus 2026 berjalan dengan baik dan kondusif. Capaian: 92% siswa telah mengenal seluruh huruf vokal dan konsonan dasar. Sebanyak 4 siswa aktif mengumpulkan semua tugas tepat waktu.',
    PERIODE: '2026-08',
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    CREATED_AT: nowISO(),
    STATUS: 'DIKIRIM',
  },
  {
    ID: 'RPT-002',
    JUDUL: 'Laporan Progres Literasi & Numerasi Kelas 3 - Agustus 2026',
    KATEGORI: 'Laporan Bulanan',
    ISI:
      'Kegiatan belajar mengajar Kelas 3 menitikberatkan pada pemahaman soal cerita numerasi matematika dan literasi fiksi. Hasil ulangan harian menunjukkan rata-rata nilai kelas 84.5.',
    PERIODE: '2026-08',
    GURU_ID: 'ACC-CLS-004',
    GURU_NAMA: 'Ahmad Fauzi, S.Pd.',
    CREATED_AT: nowISO(),
    STATUS: 'DINILAI',
    NILAI: 90,
    FEEDBACK: 'Sangat baik. Teruskan metode scaffolding numerasi dengan alat peraga persediaan sekolah.',
    GRADED_BY: 'Liestya Kusuma Sari, S.Pd., M.Pd.',
    GRADED_AT: nowISO(),
  },
];

const DEFAULT_FORUM_POSTS: ForumPost[] = [
  {
    ID: 'POST-001',
    KELAS: 'Kelas 1',
    COURSE_ID: 'CRS-001',
    AUTHOR_ID: 'ACC-CLS-002',
    AUTHOR_NAMA: 'Nurul Hidayah, S.Pd.',
    AUTHOR_ROLE: 'GURU',
    TITLE: 'Selamat Datang di Portal Belajar Kelas 1 Tematik!',
    CONTENT: 'Assalamu’alaikum anak-anak hebat dan Bapak/Ibu wali murid. Mari kita biasakan membaca buku cerita 15 menit setiap pagi sebelum jam pelajaran dimulai ya! Jangan lupa mengisi presensi mandiri harian.',
    TAG: 'PENGUMUMAN',
    IS_PINNED: true,
    CREATED_AT: nowISO(),
    LIKES: ['SISWA-001', 'SISWA-002', 'ACC-CLS-001'],
    COMMENTS: [
      {
        ID: 'CMT-001',
        AUTHOR_ID: 'SISWA-001',
        AUTHOR_NAMA: 'Ahmad Zaki Pratama',
        AUTHOR_ROLE: 'SISWA',
        CONTENT: 'Siap Bu Guru, saya sudah membaca buku fabel si kancil pagi ini!',
        CREATED_AT: nowISO(),
      },
      {
        ID: 'CMT-002',
        AUTHOR_ID: 'ACC-CLS-002',
        AUTHOR_NAMA: 'Nurul Hidayah, S.Pd.',
        AUTHOR_ROLE: 'GURU',
        CONTENT: 'Hebat Zaki, terus pertahankan ya!',
        CREATED_AT: nowISO(),
      }
    ]
  },
  {
    ID: 'POST-002',
    KELAS: 'Kelas 3',
    COURSE_ID: 'CRS-003',
    AUTHOR_ID: 'ACC-CLS-004',
    AUTHOR_NAMA: 'Ahmad Fauzi, S.Pd.',
    AUTHOR_ROLE: 'GURU',
    TITLE: 'Persiapan Kuis Interaktif Numerasi Pecahan Sederhana',
    CONTENT: 'Halo siswa kelas 3! Hari Kamis kita akan mengadakan Kuis Online CBT 15 butir soal. Silakan pelajari kembali modul ajar bab 2 dan latihan soal di menu Modul Belajar.',
    TAG: 'INFO_SEKOLAH',
    IS_PINNED: false,
    CREATED_AT: nowISO(),
    LIKES: ['SISWA-009', 'SISWA-010'],
    COMMENTS: []
  },
  {
    ID: 'POST-003',
    KELAS: 'Kelas 5',
    COURSE_ID: 'CRS-005',
    AUTHOR_ID: 'ACC-CLS-006',
    AUTHOR_NAMA: 'M. Rizky Pratama, S.Pd.',
    AUTHOR_ROLE: 'GURU',
    TITLE: 'Tantangan Koding Mingguan: Logika Algoritma Dasar',
    CONTENT: 'Siapa yang sudah mencoba menyelesaikan teka-teki labirin koding di modul? Ceritakan di kolom komentar strategi apa yang kalian gunakan untuk memecahkan blok percabangan IF-ELSE.',
    TAG: 'DISKUSI',
    IS_PINNED: true,
    CREATED_AT: nowISO(),
    LIKES: ['SISWA-017', 'SISWA-018', 'SISWA-019'],
    COMMENTS: [
      {
        ID: 'CMT-003',
        AUTHOR_ID: 'SISWA-017',
        AUTHOR_NAMA: 'Fajar Hidayat',
        AUTHOR_ROLE: 'SISWA',
        CONTENT: 'Saya pakai cara belok kanan dulu pak kalau jalannya buntu!',
        CREATED_AT: nowISO(),
      }
    ]
  }
];

const DEFAULT_ATTENDANCE: AttendanceRecord[] = [
  {
    ID: 'ATT-001',
    KELAS: 'Kelas 1',
    TANGGAL: todayDate(),
    SESI: 'Presensi Pagi & Apel',
    SISWA_ID: 'SISWA-001',
    SISWA_NAMA: 'Ahmad Zaki Pratama',
    STATUS: 'HADIR',
    CATATAN: 'Tepat waktu pukul 07.15',
    RECORDED_AT: ts(),
    RECORDED_BY: 'Nurul Hidayah, S.Pd.',
  },
  {
    ID: 'ATT-002',
    KELAS: 'Kelas 1',
    TANGGAL: todayDate(),
    SESI: 'Presensi Pagi & Apel',
    SISWA_ID: 'SISWA-002',
    SISWA_NAMA: 'Siti Aisyah Putri',
    STATUS: 'HADIR',
    CATATAN: 'Tepat waktu',
    RECORDED_AT: ts(),
    RECORDED_BY: 'Nurul Hidayah, S.Pd.',
  },
  {
    ID: 'ATT-003',
    KELAS: 'Kelas 1',
    TANGGAL: todayDate(),
    SESI: 'Presensi Pagi & Apel',
    SISWA_ID: 'SISWA-003',
    SISWA_NAMA: 'Budi Santoso',
    STATUS: 'IZIN',
    CATATAN: 'Surat izin keluarga',
    RECORDED_AT: ts(),
    RECORDED_BY: 'Nurul Hidayah, S.Pd.',
  },
  {
    ID: 'ATT-004',
    KELAS: 'Kelas 1',
    TANGGAL: todayDate(),
    SESI: 'Presensi Pagi & Apel',
    SISWA_ID: 'SISWA-004',
    SISWA_NAMA: 'Dewi Anggraini',
    STATUS: 'HADIR',
    CATATAN: 'Hadir',
    RECORDED_AT: ts(),
    RECORDED_BY: 'Nurul Hidayah, S.Pd.',
  },
];

const DEFAULT_QUIZZES: ClassroomQuiz[] = [
  {
    ID: 'QZ-001',
    COURSE_ID: 'CRS-001',
    KELAS: 'Kelas 1',
    JUDUL: 'Kuis Harian 1: Mengenal Lingkungan & Benda Hidup',
    DESKRIPSI: 'Uji pemahaman tentang benda hidup dan tak hidup di lingkungan sekitar rumah dan sekolah.',
    DURASI_MENIT: 15,
    KKM: 70,
    DEADLINE: '2026-09-10',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    IS_ACTIVE: true,
    QUESTIONS: [
      {
        ID: 'Q1',
        SOAL: 'Manakah di bawah ini yang termasuk benda hidup?',
        PILIHAN: ['Pohon Mangga', 'Batu Kerikil', 'Sepeda Mini', 'Meja Kayu'],
        KUNCI_JAWABAN: 0,
        PEMBAHASAN: 'Pohon mangga bernapas, bertumbuh, dan membutuhkan air, sehingga merupakan makhluk/benda hidup.',
      },
      {
        ID: 'Q2',
        SOAL: 'Ciri utama dari makhluk hidup adalah...',
        PILIHAN: ['Tidak butuh makan', 'Dapat bernapas dan tumbuh', 'Tidak bisa bergerak', 'Terbuat dari plastik'],
        KUNCI_JAWABAN: 1,
        PEMBAHASAN: 'Semua makhluk hidup bernapas, bertumbuh kembang, dan membutuhkan nutrisi.',
      },
      {
        ID: 'Q3',
        SOAL: 'Huruf vokal pada kata "SEKOLAH" adalah...',
        PILIHAN: ['S, K, L, H', 'E, O, A', 'S, E, K', 'O, L, A'],
        KUNCI_JAWABAN: 1,
        PEMBAHASAN: 'Huruf vokal pada SEKOLAH adalah E, O, dan A.',
      },
      {
        ID: 'Q4',
        SOAL: 'Budi memiliki 4 apel. Ibu memberi 3 apel lagi. Berapakah jumlah apel Budi sekarang?',
        PILIHAN: ['5 apel', '6 apel', '7 apel', '8 apel'],
        KUNCI_JAWABAN: 2,
        PEMBAHASAN: '4 + 3 = 7 apel.',
      }
    ]
  },
  {
    ID: 'QZ-002',
    COURSE_ID: 'CRS-003',
    KELAS: 'Kelas 3',
    JUDUL: 'Kuis CBT Matematika: Nilai Tempat & Pecahan Sederhana',
    DESKRIPSI: 'Penilaian harian kemampuan dasar operasi matematika dan pecahan 1/2, 1/3, 1/4.',
    DURASI_MENIT: 20,
    KKM: 75,
    DEADLINE: '2026-09-12',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-004',
    GURU_NAMA: 'Ahmad Fauzi, S.Pd.',
    IS_ACTIVE: true,
    QUESTIONS: [
      {
        ID: 'Q201',
        SOAL: 'Angka 7 pada bilangan 4.752 menempati nilai tempat...',
        PILIHAN: ['Ribuan', 'Ratusan', 'Puluhan', 'Satuan'],
        KUNCI_JAWABAN: 1,
        PEMBAHASAN: '4 menempati ribuan, 7 menempati ratusan, 5 menempati puluhan, 2 menempati satuan.',
      },
      {
        ID: 'Q202',
        SOAL: 'Sebuah semangka dipotong menjadi 4 bagian sama besar. Satu bagian bernilai pecahan...',
        PILIHAN: ['1/2', '1/3', '1/4', '4/1'],
        KUNCI_JAWABAN: 2,
        PEMBAHASAN: 'Satu dari 4 bagian yang sama besar ditulis sebagai 1/4 (seperempat).',
      },
      {
        ID: 'Q203',
        SOAL: 'Hasil dari 350 + 275 - 125 adalah...',
        PILIHAN: ['500', '525', '475', '550'],
        KUNCI_JAWABAN: 0,
        PEMBAHASAN: '350 + 275 = 625. Kemudian 625 - 125 = 500.',
      }
    ]
  },
  {
    ID: 'QZ-003',
    COURSE_ID: 'CRS-005',
    KELAS: 'Kelas 5',
    JUDUL: 'Ujian Harian IPAS & Koding: Ekosistem & Algoritma',
    DESKRIPSI: 'Evaluasi kompetensi jaring-jaring makanan dan pola alur pikir komputasional.',
    DURASI_MENIT: 25,
    KKM: 75,
    DEADLINE: '2026-09-15',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-006',
    GURU_NAMA: 'M. Rizky Pratama, S.Pd.',
    IS_ACTIVE: true,
    QUESTIONS: [
      {
        ID: 'Q301',
        SOAL: 'Dalam ekosistem sawah, peran tanaman padi adalah sebagai...',
        PILIHAN: ['Konsumen Tingkat 1', 'Konsumen Puncak', 'Produsen', 'Pengurai / Dekomposer'],
        KUNCI_JAWABAN: 2,
        PEMBAHASAN: 'Tumbuhan hijau berfotosintesis menghasilkan makanan sendiri sehingga bertindak sebagai produsen.',
      },
      {
        ID: 'Q302',
        SOAL: 'Urutan langkah-langkah logis yang teratur untuk menyelesaikan suatu masalah disebut...',
        PILIHAN: ['Algoritma', 'Variabel', 'Sintaks', 'Hardware'],
        KUNCI_JAWABAN: 0,
        PEMBAHASAN: 'Algoritma adalah deretan instruksi logis dan sistematis untuk memecahkan suatu persoalan komputasi.',
      }
    ]
  }
];

const DEFAULT_MATERIALS: LearningMaterial[] = [
  {
    ID: 'MAT-001',
    KELAS: 'Kelas 1',
    MAPEL: 'Tematik & Bahasa Indonesia',
    JUDUL: 'Modul Membaca Cepat: Suku Kata Ba-Bi-Bu-Be-Bo',
    DESKRIPSI: 'Bahan ajar pengenalan konsonan bergambar untuk melatih kefasihan membaca permulaan.',
    TIPE: 'EBOOK',
    URL_LINK: 'https://buku.kemdikbud.go.id',
    FILE_SIZE: '2.4 MB',
    RINGKASAN_KONTEN: 'Latihan pengucapan vokal bergambar huruf B, C, D dan pembentukan kata sehari-hari (Buku, Bola, Baju).',
    CREATED_AT: nowISO(),
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
  },
  {
    ID: 'MAT-002',
    KELAS: 'Kelas 1',
    MAPEL: 'Seni Budaya & Prakarya',
    JUDUL: 'Video Panduan: Menggambar Hewan dari Angka Dasar',
    DESKRIPSI: 'Teknik mudah anak SD menggambar burung dari angka 2 dan ikan dari angka 3.',
    TIPE: 'VIDEO',
    URL_LINK: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    FILE_SIZE: '10 Menit',
    RINGKASAN_KONTEN: 'Panduan video interaktif melatih motorik halus dan kreativitas visual anak dengan media krayon.',
    CREATED_AT: nowISO(),
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
  },
  {
    ID: 'MAT-003',
    KELAS: 'Kelas 3',
    MAPEL: 'Matematika & IPAS',
    JUDUL: 'LKPD Siswa: Eksperimen Sederhana Energi Alternatif',
    DESKRIPSI: 'Lembar Kerja Peserta Didik mengamati kincir angin kertas dan pemanfaatan panas matahari.',
    TIPE: 'LKPD',
    URL_LINK: 'https://www.youtube.com/watch?v=kY41gXhLdQ8',
    FILE_SIZE: '1.2 MB',
    RINGKASAN_KONTEN: 'Petunjuk praktikum rumah aman dengan bahan kertas origami, sedotan, dan jarum pentul dengan pengawasan orang tua.',
    CREATED_AT: nowISO(),
    GURU_NAMA: 'Ahmad Fauzi, S.Pd.',
  },
  {
    ID: 'MAT-004',
    KELAS: 'Kelas 5',
    MAPEL: 'Informatika / Koding SD',
    JUDUL: 'Buku Saku Koding: Berpikir Komputasional & Blok Scratch',
    DESKRIPSI: 'Modul ajar koding dasar membuat animasi interaktif dan game matematika sederhana.',
    TIPE: 'EBOOK',
    URL_LINK: 'https://scratch.mit.edu',
    FILE_SIZE: '4.8 MB',
    RINGKASAN_KONTEN: 'Pengenalan sprite, backdrop, loops (pengulangan), dan sensor keyboard untuk kuis sains interaktif.',
    CREATED_AT: nowISO(),
    GURU_NAMA: 'M. Rizky Pratama, S.Pd.',
  },
  {
    ID: 'MAT-005',
    KELAS: 'Kelas 6',
    MAPEL: 'Pendidikan Pancasila & Kewarganegaraan',
    JUDUL: 'Rangkuman Materi: Nilai-Nilai Luhur Gotong Royong Bangsa',
    DESKRIPSI: 'Penerapan sila-sila Pancasila dalam kehidupan berbangsa dan bermasyarakat di lingkungan sekolah.',
    TIPE: 'RANGKUMAN',
    URL_LINK: 'https://ditpsd.kemdikbud.go.id',
    FILE_SIZE: '850 KB',
    RINGKASAN_KONTEN: 'Contoh nyata toleransi beragama, musyawarah mufakat di kelas, dan keadilan sosial bagi seluruh rakyat.',
    CREATED_AT: nowISO(),
    GURU_NAMA: 'Drs. H. Mulyadi, M.Pd.',
  }
];

const DEFAULT_SCHEDULES: ClassScheduleItem[] = [
  // Kelas 1
  { ID: 'SCH-101', KELAS: 'Kelas 1', HARI: 'Senin', JAM_MULAI: '07:00', JAM_SELESAI: '07:45', MAPEL: 'Upacara Bendera & Pendidikan Karakter', GURU_NAMA: 'Nurul Hidayah, S.Pd.', RUANGAN: 'Lapangan Sekolah' },
  { ID: 'SCH-102', KELAS: 'Kelas 1', HARI: 'Senin', JAM_MULAI: '07:45', JAM_SELESAI: '09:30', MAPEL: 'Tematik (Bahasa Indonesia & Literasi)', GURU_NAMA: 'Nurul Hidayah, S.Pd.', RUANGAN: 'Ruang Kelas 1A' },
  { ID: 'SCH-103', KELAS: 'Kelas 1', HARI: 'Selasa', JAM_MULAI: '07:30', JAM_SELESAI: '09:00', MAPEL: 'Pendidikan Agama & Budi Pekerti', GURU_NAMA: 'Ust. Abdul Karim, S.Pd.I.', RUANGAN: 'Ruang Kelas 1A' },
  { ID: 'SCH-104', KELAS: 'Kelas 1', HARI: 'Rabu', JAM_MULAI: '07:30', JAM_SELESAI: '09:00', MAPEL: 'Matematika Dasar & Numerasi', GURU_NAMA: 'Nurul Hidayah, S.Pd.', RUANGAN: 'Ruang Kelas 1A' },
  { ID: 'SCH-105', KELAS: 'Kelas 1', HARI: 'Kamis', JAM_MULAI: '07:30', JAM_SELESAI: '09:00', MAPEL: 'PJOK (Pendidikan Jasmani & Olahraga)', GURU_NAMA: 'Rian Pratama, S.Pd.', RUANGAN: 'Lapangan Olahraga' },
  { ID: 'SCH-106', KELAS: 'Kelas 1', HARI: 'Jumat', JAM_MULAI: '07:00', JAM_SELESAI: '08:30', MAPEL: 'Senam Pagi, Literasi & Seni Budaya', GURU_NAMA: 'Nurul Hidayah, S.Pd.', RUANGAN: 'Ruang Seni' },

  // Kelas 2
  { ID: 'SCH-201', KELAS: 'Kelas 2', HARI: 'Senin', JAM_MULAI: '07:45', JAM_SELESAI: '09:45', MAPEL: 'Tematik Terpadu', GURU_NAMA: 'Endang Wahyuni, S.Pd.SD.', RUANGAN: 'Ruang Kelas 2' },
  { ID: 'SCH-202', KELAS: 'Kelas 2', HARI: 'Selasa', JAM_MULAI: '07:30', JAM_SELESAI: '09:30', MAPEL: 'Matematika & Berhitung Cepat', GURU_NAMA: 'Endang Wahyuni, S.Pd.SD.', RUANGAN: 'Ruang Kelas 2' },
  
  // Kelas 3
  { ID: 'SCH-301', KELAS: 'Kelas 3', HARI: 'Senin', JAM_MULAI: '07:45', JAM_SELESAI: '10:00', MAPEL: 'Bahasa Indonesia & Literasi Fiksi', GURU_NAMA: 'Ahmad Fauzi, S.Pd.', RUANGAN: 'Ruang Kelas 3' },
  { ID: 'SCH-302', KELAS: 'Kelas 3', HARI: 'Selasa', JAM_MULAI: '07:30', JAM_SELESAI: '09:45', MAPEL: 'IPAS (Ilmu Pengetahuan Alam & Sosial)', GURU_NAMA: 'Ahmad Fauzi, S.Pd.', RUANGAN: 'Ruang Kelas 3' },

  // Kelas 4
  { ID: 'SCH-401', KELAS: 'Kelas 4', HARI: 'Senin', JAM_MULAI: '07:45', JAM_SELESAI: '10:15', MAPEL: 'IPAS Terpadu & Ekosistem', GURU_NAMA: 'Dewi Lestari, S.Pd.SD.', RUANGAN: 'Ruang Kelas 4' },

  // Kelas 5
  { ID: 'SCH-501', KELAS: 'Kelas 5', HARI: 'Senin', JAM_MULAI: '07:45', JAM_SELESAI: '09:45', MAPEL: 'Matematika & Pecahan', GURU_NAMA: 'M. Rizky Pratama, S.Pd.', RUANGAN: 'Ruang Kelas 5' },
  { ID: 'SCH-502', KELAS: 'Kelas 5', HARI: 'Rabu', JAM_MULAI: '08:00', JAM_SELESAI: '10:00', MAPEL: 'Informatika & Koding SD', GURU_NAMA: 'M. Rizky Pratama, S.Pd.', RUANGAN: 'Lab Komputer SDN 6' },
];

const DEFAULT_MEDIA: ClassroomMedia[] = [
  {
    ID: 'MED-001',
    COURSE_ID: 'CRS-001',
    JUDUL: 'Video Interaktif: Pengenalan Lingkungan & Alam Sekitar',
    DESKRIPSI: 'Video animasi interaktif mengenal tanaman, hewan, dan cara merawat kebersihan lingkungan rumah.',
    KATEGORI: 'VIDEO',
    MEDIA_URL: 'https://www.youtube.com/watch?v=sample-lingkungan',
    TUJUAN_PEMBELAJARAN: 'Siswa dapat mengidentifikasi 3 cara merawat tanaman dan menjaga kebersihan lingkungan.',
    TUGAS_INTERAKTIF: 'Sebutkan apa tanaman kesukaanmu di rumah dan bagaimana caramu menyiramnya setiap hari?',
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    CREATED_AT: nowISO(),
    TARGET_KELAS: 'Kelas 1',
  },
  {
    ID: 'MED-002',
    COURSE_ID: 'CRS-005',
    JUDUL: 'Modul Digital & Simulasi Logika Koding IF-THEN',
    DESKRIPSI: 'Modul e-book interaktif pengenalan dasar algoritma percabangan untuk siswa sekolah dasar.',
    KATEGORI: 'MODUL_EBOOK',
    MEDIA_URL: 'https://drive.google.com/file/d/sample-modul-koding',
    TUJUAN_PEMBELAJARAN: 'Siswa memahami alur logika pengambilan keputusan (IF-ELSE) dalam kehidupan sehari-hari.',
    TUGAS_INTERAKTIF: 'Buatlah 1 contoh kalimat syarat (Jika ... maka ...) yang biasa kamu lakukan sebelum berangkat ke sekolah.',
    GURU_ID: 'ACC-CLS-006',
    GURU_NAMA: 'M. Rizky Pratama, S.Pd.',
    CREATED_AT: nowISO(),
    TARGET_KELAS: 'Kelas 5',
  }
];

const DEFAULT_MEDIA_SUBMISSIONS: MediaSubmission[] = [
  {
    ID: 'MSUB-001',
    MEDIA_ID: 'MED-001',
    SISWA_ID: 'SISWA-001',
    SISWA_NAMA: 'Aisyah Putri Rahmadani',
    STATUS: 'SELESAI',
    JAWABAN_TUGAS: 'Tanaman kesukaan saya adalah bunga melati di teras rumah. Setiap sore saya siram dan bersihkan daunnya.',
    UPDATED_AT: nowISO(),
    NILAI: 90,
    FEEDBACK: 'Sangat bagus dan rajin! Pertahankan semangatnya ya Aisyah.',
  }
];

const DEFAULT_LIVE_CLASSES: VirtualLiveClassSession[] = [
  {
    ID: 'LIVE-101',
    KELAS: 'Kelas 1',
    MAPEL: 'Tematik & Bahasa Indonesia',
    JUDUL: 'Sesi Tatap Muka: Diskusi & Storytelling Tematik',
    DESKRIPSI: 'Sesi live Google Meet menyapa siswa kelas 1, membaca dongeng bersama, dan penugasan melukis.',
    TANGGAL: todayDate(),
    JAM_MULAI: '08:30',
    JAM_SELESAI: '09:30',
    MEET_URL: 'https://meet.google.com/abc-defg-hij',
    PLATFORM: 'GOOGLE_MEET',
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    STATUS: 'BERLANGSUNG',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'LIVE-102',
    KELAS: 'Kelas 5',
    MAPEL: 'Informatika / Koding SD',
    JUDUL: 'Live Coding Scratch: Membuat Game Matematika Interaktif',
    DESKRIPSI: 'Demonstrasi live streaming cara menyusun blok algoritma matematika di Scratch.',
    TANGGAL: todayDate(),
    JAM_MULAI: '10:00',
    JAM_SELESAI: '11:30',
    MEET_URL: 'https://meet.google.com/xyz-uvwx-rst',
    PLATFORM: 'GOOGLE_MEET',
    GURU_ID: 'ACC-CLS-006',
    GURU_NAMA: 'M. Rizky Pratama, S.Pd.',
    STATUS: 'JADWAL',
    CREATED_AT: nowISO(),
  }
];

const DEFAULT_NOTIFICATIONS: ClassroomNotification[] = [
  {
    ID: 'NOTIF-001',
    KELAS: 'Kelas 1',
    TITLE: '🎥 Kelas Daring Tatap Muka Hari Ini!',
    MESSAGE: 'Guru Ibu Nurul Hidayah telah mendiskusikan Sesi Live Storytelling pukul 08:30 WIB.',
    TYPE: 'LIVE_CLASS',
    LINK_PAGE: 'live_class',
    CREATED_AT: nowISO(),
    IS_READ: false,
  },
  {
    ID: 'NOTIF-002',
    KELAS: 'Kelas 1',
    TITLE: '⏰ Pengingat Tugas: Menggambar Pohon',
    MESSAGE: 'Tenggat waktu pengumpulan tugas menggambar pohon mendekati batas waktu.',
    TYPE: 'DEADLINE',
    LINK_PAGE: 'assignments',
    CREATED_AT: nowISO(),
    IS_READ: false,
  },
  {
    ID: 'NOTIF-003',
    KELAS: 'Kelas 1',
    TITLE: '🏆 Lencana Prestasi Baru Terbuka!',
    MESSAGE: 'Selamat! Kamu telah meraih lencana Pembelajar Cepat karena mengumpulkan tugas tepat waktu.',
    TYPE: 'GRADE',
    LINK_PAGE: 'dashboard',
    CREATED_AT: nowISO(),
    IS_READ: false,
  }
];

const DEFAULT_GRADE_WEIGHTS: GradeWeightConfig[] = [
  {
    KELAS: 'Kelas 1',
    MAPEL: 'Tematik & Bahasa Indonesia',
    BOBOT_TUGAS: 40,
    BOBOT_KUIS: 30,
    BOBOT_PRESENSI: 20,
    BOBOT_PORTOFOLIO: 10,
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'Guru Kelas 1',
  },
  {
    KELAS: 'Kelas 5',
    MAPEL: 'Informatika / Koding SD',
    BOBOT_TUGAS: 35,
    BOBOT_KUIS: 35,
    BOBOT_PRESENSI: 15,
    BOBOT_PORTOFOLIO: 15,
    UPDATED_AT: nowISO(),
    UPDATED_BY: 'M. Rizky Pratama, S.Pd.',
  }
];

const DEFAULT_PORTFOLIO: StudentPortfolioItem[] = [
  {
    ID: 'PORT-001',
    SISWA_ID: 'SISWA-001',
    SISWA_NAMA: 'Aisyah Putri Rahmadani',
    KELAS: 'Kelas 1',
    JUDUL: 'Lukisan Pohon Mangga & Taman Rumahku',
    DESKRIPSI: 'Hasil karya seni gambar cat air tentang kebersihan lingkungan rumah dan pentingnya menjaga keasrian taman.',
    KATEGORI: 'KARYA_SENI',
    IMAGE_URL: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    LIKES: ['SISWA-002', 'ACC-CLS-002'],
    COMMENTS: [
      {
        ID: 'PC-101',
        AUTHOR_ID: 'ACC-CLS-002',
        AUTHOR_NAMA: 'Nurul Hidayah, S.Pd.',
        AUTHOR_ROLE: 'GURU',
        CONTENT: 'Warna cat airnya sangat indah Aisyah! Pemilihan kontras warnanya menunjukkan bakat seni melukis yang kuat.',
        CREATED_AT: nowISO(),
      }
    ],
    CREATED_AT: nowISO(),
    IS_FEATURED: true,
  },
  {
    ID: 'PORT-002',
    SISWA_ID: 'SISWA-017',
    SISWA_NAMA: 'Fajar Kurniawan',
    KELAS: 'Kelas 5',
    JUDUL: 'Game Kuis Sains Scratch: Daur Air & Presipitasi',
    DESKRIPSI: 'Proyek animasi koding Scratch tempat pengguna menjawab kuis tentang tahapan daur air (Evaporasi, Kondensasi, Presipitasi).',
    KATEGORI: 'PROYEK_KODING',
    IMAGE_URL: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    ATTACHMENT_URL: 'https://scratch.mit.edu/projects/sample',
    LIKES: ['SISWA-018', 'SISWA-019', 'ACC-CLS-006'],
    COMMENTS: [
      {
        ID: 'PC-102',
        AUTHOR_ID: 'ACC-CLS-006',
        AUTHOR_NAMA: 'M. Rizky Pratama, S.Pd.',
        AUTHOR_ROLE: 'GURU',
        CONTENT: 'Luar biasa Fajar! Logika koding perulangannya sangat rapi dan ramah dimainkan adik kelas.',
        CREATED_AT: nowISO(),
      }
    ],
    CREATED_AT: nowISO(),
    IS_FEATURED: true,
  }
];

class ClassroomService {
  private memoryCache = new Map<string, any>();

  private getItem<T>(key: string, defaultValue: T): T {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }
    try {
      const data = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      if (!data) {
        this.memoryCache.set(key, defaultValue);
        return defaultValue;
      }
      const parsed = JSON.parse(data) as T;
      this.memoryCache.set(key, parsed);
      return parsed;
    } catch {
      this.memoryCache.set(key, defaultValue);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    this.memoryCache.set(key, value);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('Failed to write to localStorage for key:', key, e);
      }
    }
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('bb_storage_sync', { detail: { key } }));
      }, 0);
    }
  }

  public clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  public initClassroom(): void {
    const existing = localStorage.getItem(STORAGE_KEYS.COURSES);
    if (!existing || !localStorage.getItem(STORAGE_KEYS.SEEDED)) {
      this.setItem(STORAGE_KEYS.COURSES, DEFAULT_COURSES);
      this.setItem(STORAGE_KEYS.ASSIGNMENTS, DEFAULT_ASSIGNMENTS);
      this.setItem(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
      this.setItem(STORAGE_KEYS.REPORTS, DEFAULT_REPORTS);
      this.setItem(STORAGE_KEYS.FORUM_POSTS, DEFAULT_FORUM_POSTS);
      this.setItem(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
      this.setItem(STORAGE_KEYS.QUIZZES, DEFAULT_QUIZZES);
      this.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
      this.setItem(STORAGE_KEYS.MATERIALS, DEFAULT_MATERIALS);
      this.setItem(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES);
      this.setItem(STORAGE_KEYS.MEDIA, DEFAULT_MEDIA);
      this.setItem(STORAGE_KEYS.MEDIA_SUBMISSIONS, DEFAULT_MEDIA_SUBMISSIONS);
      this.setItem(STORAGE_KEYS.LIVE_CLASSES, DEFAULT_LIVE_CLASSES);
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      this.setItem(STORAGE_KEYS.GRADE_WEIGHTS, DEFAULT_GRADE_WEIGHTS);
      this.setItem(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
      this.setItem(STORAGE_KEYS.GRADE_LOGS, DEFAULT_GRADE_LOGS);
      this.setItem(STORAGE_KEYS.BEHAVIOR_LOGS, DEFAULT_BEHAVIOR_LOGS);
      localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
    } else if (typeof localStorage !== 'undefined') {
      if (!localStorage.getItem(STORAGE_KEYS.GRADE_LOGS)) {
        this.setItem(STORAGE_KEYS.GRADE_LOGS, DEFAULT_GRADE_LOGS);
      }
      if (!localStorage.getItem(STORAGE_KEYS.BEHAVIOR_LOGS)) {
        this.setItem(STORAGE_KEYS.BEHAVIOR_LOGS, DEFAULT_BEHAVIOR_LOGS);
      }
    }
  }

  // --- Automatic Sync Teacher Course with Class ---
  public syncTeacherCourseWithClass(guruId: string, guruNama: string, kelas: string): ClassroomCourse {
    this.initClassroom();
    const courses = this.getCourses();

    // Find student IDs with this class
    let studentIds: string[] = [];
    try {
      const accountsJson = localStorage.getItem('BB_ACCOUNTS');
      if (accountsJson) {
        const accounts: any[] = JSON.parse(accountsJson);
        studentIds = accounts
          .filter((a) => a.ROLE === 'SISWA' && a.KELAS === kelas)
          .map((a) => a.ID);
      }
    } catch (e) {
      console.warn('Failed to parse accounts for student sync:', e);
    }

    let course = courses.find((c) => c.KELAS_TINGKAT === kelas || c.GURU_ID === guruId);

    if (course) {
      course.GURU_ID = guruId;
      course.GURU_NAMA = guruNama;
      course.KELAS_TINGKAT = kelas;
      const mergedSet = new Set<string>([...course.SISWA_IDS, ...studentIds]);
      course.SISWA_IDS = Array.from(mergedSet);
      if (!course.NAMA.includes(kelas)) {
        course.NAMA = `${kelas} - Tematik & Pembelajaran Terpadu`;
      }
      this.setItem(STORAGE_KEYS.COURSES, courses);
    } else {
      const num = courses.length + 1;
      course = {
        ID: `CRS-${String(num).padStart(3, '0')}`,
        KODE_KELAS: `KLS${kelas.replace(/\D+/g, '') || num}-2026`,
        NAMA: `${kelas} - Tematik & Pembelajaran Terpadu`,
        DESKRIPSI: `Pembelajaran Terpadu Kurikulum Merdeka untuk siswa ${kelas} SDN Tangerang 6.`,
        GURU_ID: guruId,
        GURU_NAMA: guruNama,
        SISWA_IDS: studentIds,
        KELAS_TINGKAT: kelas,
        CREATED_AT: nowISO(),
      };
      courses.push(course);
      this.setItem(STORAGE_KEYS.COURSES, courses);
    }

    const assignments = this.getAssignments();
    const courseAssignments = assignments.filter((a) => a.COURSE_ID === course?.ID);
    if (courseAssignments.length === 0 && course) {
      const newAsg: ClassroomAssignment = {
        ID: `ASG-${Date.now()}`,
        COURSE_ID: course.ID,
        JUDUL: `Tugas Pengantar ${kelas} - Literasi & Ringkasan Materi`,
        DESKRIPSI: `Bacalah bahan ajar tema minggu ini lalu tuliskan 3 poin penting yang kamu pelajari di buku tugasmu.`,
        DEADLINE: '2026-09-15',
        TYPE: 'TUGAS',
        CREATED_AT: nowISO(),
        GURU_ID: guruId,
        GURU_NAMA: guruNama,
      };
      assignments.push(newAsg);
      this.setItem(STORAGE_KEYS.ASSIGNMENTS, assignments);
    }

    return course;
  }

  // --- Courses ---
  public getCourses(): ClassroomCourse[] {
    this.initClassroom();
    return this.getItem<ClassroomCourse[]>(STORAGE_KEYS.COURSES, DEFAULT_COURSES);
  }

  public getCoursesForGuru(guruId: string, guruKelas?: string): ClassroomCourse[] {
    const all = this.getCourses();
    return all.filter((c) => c.GURU_ID === guruId || (guruKelas && c.KELAS_TINGKAT === guruKelas));
  }

  public getCoursesForSiswa(siswaId: string, siswaKelas?: string): ClassroomCourse[] {
    const all = this.getCourses();
    return all.filter(
      (c) => c.SISWA_IDS.includes(siswaId) || (siswaKelas && c.KELAS_TINGKAT === siswaKelas)
    );
  }

  public saveCourse(course: Partial<ClassroomCourse>): ClassroomCourse {
    const list = this.getCourses();
    let saved: ClassroomCourse;
    if (course.ID) {
      const idx = list.findIndex((c) => c.ID === course.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...course } as ClassroomCourse;
        saved = list[idx];
      } else {
        saved = { ...course, ID: course.ID } as ClassroomCourse;
        list.push(saved);
      }
    } else {
      const num = list.length + 1;
      saved = {
        ID: `CRS-${String(num).padStart(3, '0')}`,
        KODE_KELAS: course.KODE_KELAS || `KLS-${num}-2026`,
        NAMA: course.NAMA || '',
        DESKRIPSI: course.DESKRIPSI || '',
        GURU_ID: course.GURU_ID || '',
        GURU_NAMA: course.GURU_NAMA || '',
        SISWA_IDS: course.SISWA_IDS || [],
        KELAS_TINGKAT: course.KELAS_TINGKAT || '',
        CREATED_AT: nowISO(),
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.COURSES, list);
    return saved;
  }

  public deleteCourse(id: string): void {
    this.setItem(STORAGE_KEYS.COURSES, this.getCourses().filter((c) => c.ID !== id));
    this.setItem(STORAGE_KEYS.ASSIGNMENTS, this.getAssignments().filter((a) => a.COURSE_ID !== id));
  }

  public enrollSiswa(courseId: string, siswaId: string): void {
    const list = this.getCourses();
    const c = list.find((x) => x.ID === courseId);
    if (c && !c.SISWA_IDS.includes(siswaId)) {
      c.SISWA_IDS.push(siswaId);
      this.setItem(STORAGE_KEYS.COURSES, list);
    }
  }

  public unenrollSiswa(courseId: string, siswaId: string): void {
    const list = this.getCourses();
    const c = list.find((x) => x.ID === courseId);
    if (c) {
      c.SISWA_IDS = c.SISWA_IDS.filter((s) => s !== siswaId);
      this.setItem(STORAGE_KEYS.COURSES, list);
    }
  }

  // --- Assignments ---
  public getAssignments(courseId?: string): ClassroomAssignment[] {
    this.initClassroom();
    const all = this.getItem<ClassroomAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, DEFAULT_ASSIGNMENTS);
    if (courseId) return all.filter((a) => a.COURSE_ID === courseId);
    return all;
  }

  public saveAssignment(assignment: Partial<ClassroomAssignment>): ClassroomAssignment {
    const list = this.getAssignments();
    let saved: ClassroomAssignment;
    if (assignment.ID) {
      const idx = list.findIndex((a) => a.ID === assignment.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...assignment } as ClassroomAssignment;
        saved = list[idx];
      } else {
        saved = { ...assignment, ID: assignment.ID } as ClassroomAssignment;
        list.push(saved);
      }
    } else {
      const num = list.length + 1;
      saved = {
        ID: `ASG-${String(num).padStart(3, '0')}`,
        COURSE_ID: assignment.COURSE_ID || '',
        JUDUL: assignment.JUDUL || '',
        DESKRIPSI: assignment.DESKRIPSI || '',
        DEADLINE: assignment.DEADLINE || '',
        TYPE: assignment.TYPE || 'TUGAS',
        CREATED_AT: nowISO(),
        GURU_ID: assignment.GURU_ID || '',
        GURU_NAMA: assignment.GURU_NAMA || '',
        IS_PRIORITY: assignment.IS_PRIORITY ?? false,
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.ASSIGNMENTS, list);
    return saved;
  }

  public saveAssignments(assignments: Partial<ClassroomAssignment>[]): ClassroomAssignment[] {
    if (!assignments || assignments.length === 0) return [];
    const list = this.getAssignments();
    let maxNum = list.reduce((max, a) => {
      const match = a.ID?.match(/^ASG-(\d+)$/);
      if (match) {
        const val = parseInt(match[1], 10);
        return val > max ? val : max;
      }
      return max;
    }, 0);
    if (maxNum < list.length) maxNum = list.length;

    const savedList: ClassroomAssignment[] = [];
    for (const assignment of assignments) {
      if (assignment.ID) {
        const idx = list.findIndex((a) => a.ID === assignment.ID);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...assignment } as ClassroomAssignment;
          savedList.push(list[idx]);
        } else {
          const item = { ...assignment, ID: assignment.ID } as ClassroomAssignment;
          list.push(item);
          savedList.push(item);
        }
      } else {
        maxNum++;
        const item: ClassroomAssignment = {
          ID: `ASG-${String(maxNum).padStart(3, '0')}`,
          COURSE_ID: assignment.COURSE_ID || '',
          JUDUL: assignment.JUDUL || '',
          DESKRIPSI: assignment.DESKRIPSI || '',
          DEADLINE: assignment.DEADLINE || '',
          TYPE: assignment.TYPE || 'TUGAS',
          CREATED_AT: nowISO(),
          GURU_ID: assignment.GURU_ID || '',
          GURU_NAMA: assignment.GURU_NAMA || '',
          IS_PRIORITY: assignment.IS_PRIORITY ?? false,
        };
        list.push(item);
        savedList.push(item);
      }
    }
    this.setItem(STORAGE_KEYS.ASSIGNMENTS, list);
    return savedList;
  }

  public deleteAssignment(id: string): void {
    this.setItem(STORAGE_KEYS.ASSIGNMENTS, this.getAssignments().filter((a) => a.ID !== id));
    this.setItem(STORAGE_KEYS.SUBMISSIONS, this.getSubmissions().filter((s) => s.ASSIGNMENT_ID !== id));
  }

  public deleteAssignments(ids: string[]): void {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    this.setItem(STORAGE_KEYS.ASSIGNMENTS, this.getAssignments().filter((a) => !idSet.has(a.ID)));
    this.setItem(STORAGE_KEYS.SUBMISSIONS, this.getSubmissions().filter((s) => !idSet.has(s.ASSIGNMENT_ID)));
  }

  public bulkUpdateAssignments(ids: string[], updates: Partial<ClassroomAssignment>): void {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    const list = this.getAssignments();
    let updated = false;
    const newList = list.map((a) => {
      if (idSet.has(a.ID)) {
        updated = true;
        return { ...a, ...updates };
      }
      return a;
    });
    if (updated) {
      this.setItem(STORAGE_KEYS.ASSIGNMENTS, newList);
    }
  }

  // --- Submissions ---
  public getSubmissions(assignmentId?: string, siswaId?: string): ClassroomSubmission[] {
    this.initClassroom();
    let all = this.getItem<ClassroomSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    if (assignmentId) all = all.filter((s) => s.ASSIGNMENT_ID === assignmentId);
    if (siswaId) all = all.filter((s) => s.SISWA_ID === siswaId);
    return all;
  }

  public saveSubmission(data: {
    ASSIGNMENT_ID: string;
    COURSE_ID: string;
    SISWA_ID: string;
    SISWA_NAMA: string;
    ISI: string;
    FILE_LINK?: string;
    STATUS?: 'DRAFT' | 'SUBMITTED';
  }): ClassroomSubmission {
    const list = this.getItem<ClassroomSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    const existing = list.find(
      (s) => s.ASSIGNMENT_ID === data.ASSIGNMENT_ID && s.SISWA_ID === data.SISWA_ID
    );
    let saved: ClassroomSubmission;
    if (existing) {
      existing.ISI = data.ISI;
      existing.FILE_LINK = data.FILE_LINK;
      existing.SUBMITTED_AT = ts();
      existing.STATUS = data.STATUS || 'SUBMITTED';
      saved = existing;
    } else {
      saved = {
        ID: `SUB-${Date.now()}`,
        ASSIGNMENT_ID: data.ASSIGNMENT_ID,
        COURSE_ID: data.COURSE_ID,
        SISWA_ID: data.SISWA_ID,
        SISWA_NAMA: data.SISWA_NAMA,
        ISI: data.ISI,
        FILE_LINK: data.FILE_LINK || '',
        SUBMITTED_AT: ts(),
        STATUS: data.STATUS || 'SUBMITTED',
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.SUBMISSIONS, list);
    offlineSyncManager.addPendingChange(
      'STUDENT_SUBMISSION',
      `Tugas ${saved.ASSIGNMENT_ID} siswa ${saved.SISWA_NAMA} (${saved.STATUS})`,
      saved
    );
    try {
      progressSyncService.notifySubmissionChange(saved, 'SAVE');
    } catch {}
    return saved;
  }

  public getGradeChangeLogs(siswaId?: string): GradeChangeLog[] {
    this.initClassroom();
    const all = this.getItem<GradeChangeLog[]>(STORAGE_KEYS.GRADE_LOGS, DEFAULT_GRADE_LOGS);
    if (siswaId) {
      return all.filter((l) => l.SISWA_ID === siswaId);
    }
    return all;
  }

  public recordGradeChange(log: Omit<GradeChangeLog, 'ID'>): GradeChangeLog {
    const list = this.getGradeChangeLogs();
    const entry: GradeChangeLog = {
      ...log,
      ID: `GLOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    list.unshift(entry);
    const trimmed = list.slice(0, 150);
    this.setItem(STORAGE_KEYS.GRADE_LOGS, trimmed);
    return entry;
  }

  public gradeSubmission(
    id: string,
    nilai: number,
    feedback: string,
    gradedBy: string,
    voiceNote?: string,
    reason?: string
  ): void {
    const list = this.getItem<ClassroomSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    const sub = list.find((s) => s.ID === id);
    if (sub) {
      const oldNilai = sub.NILAI;
      const assignments = this.getAssignments();
      const assignment = assignments.find((a) => a.ID === sub.ASSIGNMENT_ID);
      const assignmentTitle = assignment?.JUDUL || 'Tugas Pembelajaran';
      const hasChanged = oldNilai !== undefined && oldNilai !== nilai;

      sub.NILAI = nilai;
      sub.FEEDBACK = feedback;
      if (voiceNote !== undefined) sub.VOICE_NOTE = voiceNote;
      sub.GRADED_BY = gradedBy;
      sub.GRADED_AT = ts();
      sub.STATUS = 'GRADED';

      const changeLogEntry: GradeChangeLog = {
        ID: `GLOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        SISWA_ID: sub.SISWA_ID,
        SISWA_NAMA: sub.SISWA_NAMA,
        SUBMISSION_ID: sub.ID,
        ASSIGNMENT_ID: sub.ASSIGNMENT_ID,
        ASSIGNMENT_TITLE: assignmentTitle,
        OLD_NILAI: oldNilai,
        NEW_NILAI: nilai,
        DIFF: oldNilai !== undefined ? nilai - oldNilai : undefined,
        CHANGED_AT: ts(),
        CHANGED_BY: gradedBy,
        REASON: reason || feedback || (hasChanged ? 'Penyesuaian nilai oleh guru' : 'Penilaian tugas baru'),
      };

      const history = sub.GRADE_HISTORY || [];
      history.unshift(changeLogEntry);
      sub.GRADE_HISTORY = history.slice(0, 15);

      this.setItem(STORAGE_KEYS.SUBMISSIONS, list);
      this.recordGradeChange(changeLogEntry);

      offlineSyncManager.addPendingChange(
        'STUDENT_SUBMISSION',
        `Nilai tugas ${sub.SISWA_NAMA}: ${nilai}/100 (${oldNilai !== undefined ? `${oldNilai} ➔ ${nilai}` : 'Baru'}) oleh ${gradedBy}`,
        sub
      );
      try {
        progressSyncService.notifySubmissionChange(sub, 'GRADE');
      } catch {}
    }
  }

  public gradeSubmissionsBulk(
    updates: Array<{ id: string; nilai: number; feedback?: string; voiceNote?: string; reason?: string }>,
    gradedBy: string
  ): void {
    const list = this.getItem<ClassroomSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    const assignments = this.getAssignments();
    let lastSub: ClassroomSubmission | null = null;
    updates.forEach(({ id, nilai, feedback, voiceNote, reason }) => {
      const sub = list.find((s) => s.ID === id);
      if (sub) {
        const oldNilai = sub.NILAI;
        const assignment = assignments.find((a) => a.ID === sub.ASSIGNMENT_ID);
        const assignmentTitle = assignment?.JUDUL || 'Tugas Pembelajaran';
        const hasChanged = oldNilai !== undefined && oldNilai !== nilai;

        sub.NILAI = nilai;
        if (feedback !== undefined) sub.FEEDBACK = feedback;
        if (voiceNote !== undefined) sub.VOICE_NOTE = voiceNote;
        sub.GRADED_BY = gradedBy;
        sub.GRADED_AT = ts();
        sub.STATUS = 'GRADED';

        const changeLogEntry: GradeChangeLog = {
          ID: `GLOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          SISWA_ID: sub.SISWA_ID,
          SISWA_NAMA: sub.SISWA_NAMA,
          SUBMISSION_ID: sub.ID,
          ASSIGNMENT_ID: sub.ASSIGNMENT_ID,
          ASSIGNMENT_TITLE: assignmentTitle,
          OLD_NILAI: oldNilai,
          NEW_NILAI: nilai,
          DIFF: oldNilai !== undefined ? nilai - oldNilai : undefined,
          CHANGED_AT: ts(),
          CHANGED_BY: gradedBy,
          REASON: reason || feedback || (hasChanged ? 'Penyesuaian nilai massal' : 'Penilaian tugas baru'),
        };

        const history = sub.GRADE_HISTORY || [];
        history.unshift(changeLogEntry);
        sub.GRADE_HISTORY = history.slice(0, 15);

        this.recordGradeChange(changeLogEntry);
        lastSub = sub;
      }
    });
    this.setItem(STORAGE_KEYS.SUBMISSIONS, list);
    if (lastSub) {
      try {
        progressSyncService.notifySubmissionChange(lastSub, 'BULK_GRADE');
      } catch {}
    }
  }

  // --- Reports ---
  public getReports(): ClassroomReport[] {
    this.initClassroom();
    return this.getItem<ClassroomReport[]>(STORAGE_KEYS.REPORTS, DEFAULT_REPORTS);
  }

  public getReportsForGuru(guruId: string): ClassroomReport[] {
    return this.getReports().filter((r) => r.GURU_ID === guruId);
  }

  public saveReport(data: Partial<ClassroomReport>): ClassroomReport {
    const list = this.getReports();
    let saved: ClassroomReport;
    if (data.ID) {
      const idx = list.findIndex((r) => r.ID === data.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...data } as ClassroomReport;
        saved = list[idx];
      } else {
        saved = { ...data, ID: data.ID } as ClassroomReport;
        list.push(saved);
      }
    } else {
      const num = list.length + 1;
      saved = {
        ID: `RPT-${String(num).padStart(3, '0')}`,
        JUDUL: data.JUDUL || '',
        KATEGORI: data.KATEGORI || 'Laporan Bulanan',
        ISI: data.ISI || '',
        PERIODE: data.PERIODE || new Date().toISOString().slice(0, 7),
        GURU_ID: data.GURU_ID || '',
        GURU_NAMA: data.GURU_NAMA || '',
        CREATED_AT: nowISO(),
        STATUS: data.STATUS || 'DRAFT',
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.REPORTS, list);
    return saved;
  }

  public submitReport(id: string): void {
    const list = this.getReports();
    const r = list.find((x) => x.ID === id);
    if (r) {
      r.STATUS = 'DIKIRIM';
      this.setItem(STORAGE_KEYS.REPORTS, list);
    }
  }

  public gradeReport(id: string, nilai: number, feedback: string, gradedBy: string): void {
    const list = this.getReports();
    const r = list.find((x) => x.ID === id);
    if (r) {
      r.NILAI = nilai;
      r.FEEDBACK = feedback;
      r.GRADED_BY = gradedBy;
      r.GRADED_AT = ts();
      r.STATUS = 'DINILAI';
      this.setItem(STORAGE_KEYS.REPORTS, list);
    }
  }

  public deleteReport(id: string): void {
    this.setItem(STORAGE_KEYS.REPORTS, this.getReports().filter((r) => r.ID !== id));
  }

  // ==========================================
  // === 1. FORUM & ANNOUNCEMENT METHODS ===
  // ==========================================
  public getForumPosts(kelas?: string): ForumPost[] {
    this.initClassroom();
    let posts = this.getItem<ForumPost[]>(STORAGE_KEYS.FORUM_POSTS, DEFAULT_FORUM_POSTS);
    if (kelas) {
      posts = posts.filter((p) => p.KELAS === kelas || p.TAG === 'INFO_SEKOLAH');
    }
    // Sort: pinned first, then by date desc
    return posts.sort((a, b) => {
      if (a.IS_PINNED && !b.IS_PINNED) return -1;
      if (!a.IS_PINNED && b.IS_PINNED) return 1;
      return new Date(b.CREATED_AT).getTime() - new Date(a.CREATED_AT).getTime();
    });
  }

  public createForumPost(post: Omit<ForumPost, 'ID' | 'CREATED_AT' | 'LIKES' | 'COMMENTS'>): ForumPost {
    const list = this.getForumPosts();
    const newPost: ForumPost = {
      ...post,
      ID: `POST-${Date.now()}`,
      CREATED_AT: nowISO(),
      LIKES: [],
      COMMENTS: [],
    };
    list.unshift(newPost);
    this.setItem(STORAGE_KEYS.FORUM_POSTS, list);
    return newPost;
  }

  public addForumComment(postId: string, comment: Omit<ForumComment, 'ID' | 'CREATED_AT'>): ForumComment | null {
    const list = this.getItem<ForumPost[]>(STORAGE_KEYS.FORUM_POSTS, DEFAULT_FORUM_POSTS);
    const post = list.find((p) => p.ID === postId);
    if (!post) return null;

    const newComment: ForumComment = {
      ...comment,
      ID: `CMT-${Date.now()}`,
      CREATED_AT: nowISO(),
    };
    if (!post.COMMENTS) post.COMMENTS = [];
    post.COMMENTS.push(newComment);
    this.setItem(STORAGE_KEYS.FORUM_POSTS, list);
    return newComment;
  }

  public toggleForumLike(postId: string, userId: string): boolean {
    const list = this.getItem<ForumPost[]>(STORAGE_KEYS.FORUM_POSTS, DEFAULT_FORUM_POSTS);
    const post = list.find((p) => p.ID === postId);
    if (!post) return false;

    if (!post.LIKES) post.LIKES = [];
    const idx = post.LIKES.indexOf(userId);
    if (idx >= 0) {
      post.LIKES.splice(idx, 1);
    } else {
      post.LIKES.push(userId);
    }
    this.setItem(STORAGE_KEYS.FORUM_POSTS, list);
    return idx < 0;
  }

  public togglePinPost(postId: string): void {
    const list = this.getItem<ForumPost[]>(STORAGE_KEYS.FORUM_POSTS, DEFAULT_FORUM_POSTS);
    const post = list.find((p) => p.ID === postId);
    if (post) {
      post.IS_PINNED = !post.IS_PINNED;
      this.setItem(STORAGE_KEYS.FORUM_POSTS, list);
    }
  }

  public deleteForumPost(postId: string): void {
    const list = this.getItem<ForumPost[]>(STORAGE_KEYS.FORUM_POSTS, DEFAULT_FORUM_POSTS);
    this.setItem(STORAGE_KEYS.FORUM_POSTS, list.filter((p) => p.ID !== postId));
  }

  // ==========================================
  // === 2. PRESENSI / ATTENDANCE METHODS ===
  // ==========================================
  public getAttendanceRecords(kelas?: string, tanggal?: string): AttendanceRecord[] {
    this.initClassroom();
    let list = this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    if (kelas) list = list.filter((a) => a.KELAS === kelas);
    if (tanggal) list = list.filter((a) => a.TANGGAL === tanggal);
    return list;
  }

  public recordSingleAttendance(record: Omit<AttendanceRecord, 'ID' | 'RECORDED_AT'>): AttendanceRecord {
    const list = this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    const existingIdx = list.findIndex(
      (a) => a.KELAS === record.KELAS && a.TANGGAL === record.TANGGAL && a.SISWA_ID === record.SISWA_ID && a.SESI === record.SESI
    );

    const fullRecord: AttendanceRecord = {
      ...record,
      ID: existingIdx >= 0 ? list[existingIdx].ID : `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      RECORDED_AT: ts(),
    };

    if (existingIdx >= 0) {
      list[existingIdx] = fullRecord;
    } else {
      list.push(fullRecord);
    }

    this.setItem(STORAGE_KEYS.ATTENDANCE, list);
    return fullRecord;
  }

  public bulkSaveAttendance(records: Omit<AttendanceRecord, 'ID' | 'RECORDED_AT'>[]): void {
    const list = this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    for (const rec of records) {
      const idx = list.findIndex(
        (a) => a.KELAS === rec.KELAS && a.TANGGAL === rec.TANGGAL && a.SISWA_ID === rec.SISWA_ID && a.SESI === rec.SESI
      );
      const full: AttendanceRecord = {
        ...rec,
        ID: idx >= 0 ? list[idx].ID : `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        RECORDED_AT: ts(),
      };
      if (idx >= 0) list[idx] = full;
      else list.push(full);
    }
    this.setItem(STORAGE_KEYS.ATTENDANCE, list);
  }

  public getStudentAttendanceStats(siswaId: string, kelas?: string): { hadir: number; sakit: number; izin: number; alpa: number; total: number; percentage: number } {
    let list = this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    list = list.filter((a) => a.SISWA_ID === siswaId);
    if (kelas) list = list.filter((a) => a.KELAS === kelas);

    const stats = { hadir: 0, sakit: 0, izin: 0, alpa: 0, total: list.length, percentage: 100 };
    list.forEach((r) => {
      if (r.STATUS === 'HADIR') stats.hadir++;
      else if (r.STATUS === 'SAKIT') stats.sakit++;
      else if (r.STATUS === 'IZIN') stats.izin++;
      else if (r.STATUS === 'ALPA') stats.alpa++;
    });

    if (stats.total > 0) {
      stats.percentage = Math.round((stats.hadir / stats.total) * 100);
    }
    return stats;
  }

  // ==========================================
  // === 3. KUIS & CBT EXAM METHODS ===
  // ==========================================
  public getQuizzes(kelas?: string, courseId?: string): ClassroomQuiz[] {
    this.initClassroom();
    let list = this.getItem<ClassroomQuiz[]>(STORAGE_KEYS.QUIZZES, DEFAULT_QUIZZES);
    if (kelas) list = list.filter((q) => q.KELAS === kelas);
    if (courseId) list = list.filter((q) => q.COURSE_ID === courseId);
    return list;
  }

  public saveQuiz(quiz: Partial<ClassroomQuiz>): ClassroomQuiz {
    const list = this.getItem<ClassroomQuiz[]>(STORAGE_KEYS.QUIZZES, DEFAULT_QUIZZES);
    let saved: ClassroomQuiz;

    if (quiz.ID) {
      const idx = list.findIndex((q) => q.ID === quiz.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...quiz } as ClassroomQuiz;
        saved = list[idx];
      } else {
        saved = { ...quiz, ID: quiz.ID } as ClassroomQuiz;
        list.push(saved);
      }
    } else {
      const num = list.length + 1;
      saved = {
        ID: `QZ-${String(num).padStart(3, '0')}`,
        COURSE_ID: quiz.COURSE_ID || '',
        KELAS: quiz.KELAS || 'Kelas 1',
        JUDUL: quiz.JUDUL || 'Kuis Baru',
        DESKRIPSI: quiz.DESKRIPSI || '',
        DURASI_MENIT: quiz.DURASI_MENIT || 15,
        KKM: quiz.KKM || 75,
        DEADLINE: quiz.DEADLINE || '2026-09-30',
        QUESTIONS: quiz.QUESTIONS || [],
        CREATED_AT: nowISO(),
        GURU_ID: quiz.GURU_ID || '',
        GURU_NAMA: quiz.GURU_NAMA || '',
        IS_ACTIVE: quiz.IS_ACTIVE !== undefined ? quiz.IS_ACTIVE : true,
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.QUIZZES, list);
    return saved;
  }

  public deleteQuiz(id: string): void {
    const list = this.getItem<ClassroomQuiz[]>(STORAGE_KEYS.QUIZZES, DEFAULT_QUIZZES);
    this.setItem(STORAGE_KEYS.QUIZZES, list.filter((q) => q.ID !== id));
  }

  public submitQuizAttempt(data: {
    QUIZ_ID: string;
    SISWA_ID: string;
    SISWA_NAMA: string;
    KELAS: string;
    ANSWERS: { [questionId: string]: number };
    STARTED_AT: string;
  }): QuizAttempt {
    const quizzes = this.getQuizzes();
    const quiz = quizzes.find((q) => q.ID === data.QUIZ_ID);
    const questions = quiz ? quiz.QUESTIONS : [];

    let benar = 0;
    questions.forEach((q) => {
      if (data.ANSWERS[q.ID] !== undefined && data.ANSWERS[q.ID] === q.KUNCI_JAWABAN) {
        benar++;
      }
    });

    const totalSoal = questions.length || 1;
    const score = Math.round((benar / totalSoal) * 100);
    const kkm = quiz?.KKM || 75;

    const attempt: QuizAttempt = {
      ID: `ATT-QZ-${Date.now()}`,
      QUIZ_ID: data.QUIZ_ID,
      SISWA_ID: data.SISWA_ID,
      SISWA_NAMA: data.SISWA_NAMA,
      KELAS: data.KELAS,
      ANSWERS: data.ANSWERS,
      SCORE: score,
      TOTAL_SOAL: totalSoal,
      BENAR: benar,
      SALAH: totalSoal - benar,
      PASSED: score >= kkm,
      STARTED_AT: data.STARTED_AT,
      FINISHED_AT: ts(),
    };

    const attempts = this.getItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
    // Replace if already attempted or push
    const existingIdx = attempts.findIndex((a) => a.QUIZ_ID === data.QUIZ_ID && a.SISWA_ID === data.SISWA_ID);
    if (existingIdx >= 0) {
      attempts[existingIdx] = attempt;
    } else {
      attempts.push(attempt);
    }

    this.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, attempts);
    return attempt;
  }

  public getQuizAttempts(quizId?: string, siswaId?: string): QuizAttempt[] {
    this.initClassroom();
    let list = this.getItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
    if (quizId) list = list.filter((a) => a.QUIZ_ID === quizId);
    if (siswaId) list = list.filter((a) => a.SISWA_ID === siswaId);
    return list;
  }

  // ==========================================
  // === 4. BAHAN AJAR & E-LIBRARY METHODS ===
  // ==========================================
  public getMaterials(kelas?: string, mapel?: string): LearningMaterial[] {
    this.initClassroom();
    let list = this.getItem<LearningMaterial[]>(STORAGE_KEYS.MATERIALS, DEFAULT_MATERIALS);
    if (kelas) list = list.filter((m) => m.KELAS === kelas || m.KELAS === 'Semua Kelas');
    if (mapel) list = list.filter((m) => m.MAPEL.toLowerCase().includes(mapel.toLowerCase()));
    return list;
  }

  public saveMaterial(mat: Partial<LearningMaterial>): LearningMaterial {
    const list = this.getItem<LearningMaterial[]>(STORAGE_KEYS.MATERIALS, DEFAULT_MATERIALS);
    let saved: LearningMaterial;

    if (mat.ID) {
      const idx = list.findIndex((m) => m.ID === mat.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...mat } as LearningMaterial;
        saved = list[idx];
      } else {
        saved = { ...mat, ID: mat.ID } as LearningMaterial;
        list.push(saved);
      }
    } else {
      const num = list.length + 1;
      saved = {
        ID: `MAT-${String(num).padStart(3, '0')}`,
        KELAS: mat.KELAS || 'Kelas 1',
        MAPEL: mat.MAPEL || 'Tematik',
        JUDUL: mat.JUDUL || 'Modul Pembelajaran',
        DESKRIPSI: mat.DESKRIPSI || '',
        TIPE: mat.TIPE || 'EBOOK',
        URL_LINK: mat.URL_LINK || '',
        FILE_SIZE: mat.FILE_SIZE || '1.5 MB',
        RINGKASAN_KONTEN: mat.RINGKASAN_KONTEN || '',
        CREATED_AT: nowISO(),
        GURU_NAMA: mat.GURU_NAMA || 'Guru SDN Tangerang 6',
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.MATERIALS, list);
    return saved;
  }

  public deleteMaterial(id: string): void {
    const list = this.getItem<LearningMaterial[]>(STORAGE_KEYS.MATERIALS, DEFAULT_MATERIALS);
    this.setItem(STORAGE_KEYS.MATERIALS, list.filter((m) => m.ID !== id));
  }

  // ==========================================
  // === 5. JADWAL PELAJARAN METHODS ===
  // ==========================================
  public getSchedules(kelas?: string, hari?: string): ClassScheduleItem[] {
    this.initClassroom();
    let list = this.getItem<ClassScheduleItem[]>(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES);
    if (kelas) list = list.filter((s) => s.KELAS === kelas);
    if (hari) list = list.filter((s) => s.HARI === hari);
    return list;
  }

  public saveSchedule(item: Partial<ClassScheduleItem>): ClassScheduleItem {
    const list = this.getItem<ClassScheduleItem[]>(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES);
    let saved: ClassScheduleItem;

    if (item.ID) {
      const idx = list.findIndex((s) => s.ID === item.ID);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item } as ClassScheduleItem;
        saved = list[idx];
      } else {
        saved = { ...item, ID: item.ID } as ClassScheduleItem;
        list.push(saved);
      }
    } else {
      saved = {
        ID: `SCH-${Date.now()}`,
        KELAS: item.KELAS || 'Kelas 1',
        HARI: item.HARI || 'Senin',
        JAM_MULAI: item.JAM_MULAI || '07:30',
        JAM_SELESAI: item.JAM_SELESAI || '09:00',
        MAPEL: item.MAPEL || 'Tematik',
        GURU_NAMA: item.GURU_NAMA || 'Guru Kelas',
        RUANGAN: item.RUANGAN || 'Ruang Kelas',
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.SCHEDULES, list);
    return saved;
  }

  public deleteSchedule(id: string): void {
    const list = this.getItem<ClassScheduleItem[]>(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES);
    this.setItem(STORAGE_KEYS.SCHEDULES, list.filter((s) => s.ID !== id));
  }

  // ==========================================
  // === 5b. JADWAL BIMBINGAN REMEDIAL KHUSUS (INTEGRATED WITH CALENDAR) ===
  // ==========================================
  public getRemedialSessions(kelas?: string, siswaId?: string): RemedialGuidanceSession[] {
    this.initClassroom();
    const defaultSessions: RemedialGuidanceSession[] = [
      {
        ID: 'REM-SES-001',
        SISWA_ID: 'SIS-002',
        SISWA_NAMA: 'Dimas Aditya',
        KELAS: 'Kelas 4B',
        MAPEL: 'Matematika',
        TOPIK: 'Operasi Hitung Pecahan & Penyelesaian Soal Cerita',
        TANGGAL: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        HARI: 'Kamis',
        JAM_MULAI: '13:00',
        JAM_SELESAI: '14:00',
        RUANGAN: 'Ruang Bimbingan Konseling / Remedial',
        GURU_ID: 'GURU-001',
        GURU_NAMA: 'Nurul Hidayah, S.Pd.',
        CATATAN: 'Fokus pada penyederhanaan penyebut pecahan dan pembimbingan langkah demi langkah',
        TARGET_KOMPETENSI: 'Mencapai target KKM 75 pada asesmen remedial pecahan',
        STATUS: 'TERJADWAL',
        CREATED_AT: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        ID: 'REM-SES-002',
        SISWA_ID: 'SIS-003',
        SISWA_NAMA: 'Budi Santoso',
        KELAS: 'Kelas 4B',
        MAPEL: 'Bahasa Indonesia',
        TOPIK: 'Identifikasi Ide Pokok Paragraf & Penguatan Karakter Disiplin',
        TANGGAL: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
        HARI: 'Selasa',
        JAM_MULAI: '13:30',
        JAM_SELESAI: '14:30',
        RUANGAN: 'Pojok Literasi & Remedial Kelas 4B',
        GURU_ID: 'GURU-001',
        GURU_NAMA: 'Nurul Hidayah, S.Pd.',
        CATATAN: 'Bimbingan khusus membaca intensif dan pendampingan pengelolaan fokus belajar',
        TARGET_KOMPETENSI: 'Peningkatan konsentrasi dan pemenuhan tugas bacaan tepat waktu',
        STATUS: 'TERJADWAL',
        CREATED_AT: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    let list = this.getItem<RemedialGuidanceSession[]>(STORAGE_KEYS.REMEDIAL_SESSIONS, defaultSessions);
    if (kelas && kelas !== 'Semua') {
      list = list.filter((s) => s.KELAS.toLowerCase().includes(kelas.toLowerCase()));
    }
    if (siswaId) {
      list = list.filter((s) => s.SISWA_ID === siswaId);
    }
    return list.sort((a, b) => new Date(a.TANGGAL).getTime() - new Date(b.TANGGAL).getTime());
  }

  public saveRemedialSession(
    session: Partial<RemedialGuidanceSession> & { syncToCalendar?: boolean }
  ): RemedialGuidanceSession {
    this.initClassroom();
    const defaultSessions = this.getRemedialSessions();
    const list = this.getItem<RemedialGuidanceSession[]>(STORAGE_KEYS.REMEDIAL_SESSIONS, defaultSessions);

    const syncToCalendar = session.syncToCalendar !== false;
    let saved: RemedialGuidanceSession;
    let integratedScheduleId = session.SCHEDULE_ID;

    // Synchronize to class calendar schedule if enabled
    if (syncToCalendar) {
      const calendarMapel = `[Bimbingan Remedial] ${session.MAPEL || 'Akademik'} - ${session.SISWA_NAMA || 'Siswa'} (${session.TOPIK || 'Penguatan Kompetensi'})`;
      const scheduleItem: Partial<ClassScheduleItem> = {
        ID: integratedScheduleId || `SCH-REM-${Date.now()}`,
        KELAS: session.KELAS || 'Kelas 4B',
        HARI: session.HARI || 'Kamis',
        JAM_MULAI: session.JAM_MULAI || '13:00',
        JAM_SELESAI: session.JAM_SELESAI || '14:00',
        MAPEL: calendarMapel,
        GURU_NAMA: session.GURU_NAMA || 'Guru Kelas',
        RUANGAN: session.RUANGAN || 'Ruang Remedial / BK',
      };
      const savedSchedule = this.saveSchedule(scheduleItem);
      integratedScheduleId = savedSchedule.ID;
    }

    if (session.ID) {
      const idx = list.findIndex((s) => s.ID === session.ID);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          ...session,
          SCHEDULE_ID: integratedScheduleId || list[idx].SCHEDULE_ID,
        } as RemedialGuidanceSession;
        saved = list[idx];
      } else {
        saved = {
          ...session,
          ID: session.ID,
          SCHEDULE_ID: integratedScheduleId,
          CREATED_AT: session.CREATED_AT || nowISO(),
        } as RemedialGuidanceSession;
        list.push(saved);
      }
    } else {
      saved = {
        ID: `REM-SES-${Date.now()}`,
        SISWA_ID: session.SISWA_ID || 'SIS-UNKNOWN',
        SISWA_NAMA: session.SISWA_NAMA || 'Peserta Didik',
        KELAS: session.KELAS || 'Kelas 4B',
        MAPEL: session.MAPEL || 'Matematika',
        TOPIK: session.TOPIK || 'Penguatan Remedial',
        TANGGAL: session.TANGGAL || new Date().toISOString().slice(0, 10),
        HARI: session.HARI || 'Kamis',
        JAM_MULAI: session.JAM_MULAI || '13:00',
        JAM_SELESAI: session.JAM_SELESAI || '14:00',
        RUANGAN: session.RUANGAN || 'Ruang Remedial / BK',
        GURU_ID: session.GURU_ID || 'GURU-001',
        GURU_NAMA: session.GURU_NAMA || 'Guru Kelas',
        CATATAN: session.CATATAN || '',
        TARGET_KOMPETENSI: session.TARGET_KOMPETENSI || 'Pencapaian ketuntasan KKM',
        STATUS: session.STATUS || 'TERJADWAL',
        SCHEDULE_ID: integratedScheduleId,
        CREATED_AT: nowISO(),
      };
      list.push(saved);
    }

    this.setItem(STORAGE_KEYS.REMEDIAL_SESSIONS, list);

    // Add alert notification for class & student
    this.addNotification({
      KELAS: saved.KELAS,
      TITLE: `🗓️ Jadwal Bimbingan Remedial: ${saved.SISWA_NAMA}`,
      MESSAGE: `Sesi bimbingan remedial mapel ${saved.MAPEL} (${saved.TOPIK}) dijadwalkan hari ${saved.HARI}, ${saved.JAM_MULAI}-${saved.JAM_SELESAI} di ${saved.RUANGAN}. Terintegrasi dengan kalender kelas.`,
      TYPE: 'SYSTEM',
      LINK_PAGE: 'schedule',
    });

    return saved;
  }

  public updateRemedialSessionStatus(id: string, status: RemedialSessionStatus): void {
    const list = this.getRemedialSessions();
    const idx = list.findIndex((s) => s.ID === id);
    if (idx >= 0) {
      list[idx].STATUS = status;
      this.setItem(STORAGE_KEYS.REMEDIAL_SESSIONS, list);
    }
  }

  public deleteRemedialSession(id: string): void {
    const list = this.getRemedialSessions();
    const target = list.find((s) => s.ID === id);
    if (target?.SCHEDULE_ID) {
      this.deleteSchedule(target.SCHEDULE_ID);
    }
    this.setItem(
      STORAGE_KEYS.REMEDIAL_SESSIONS,
      list.filter((s) => s.ID !== id)
    );
  }

  // ==========================================
  // === 6. GRADEBOOK & E-RAPOR ENGINE ===
  // ==========================================
  public getStudentReportCard(siswaId: string, siswaNama: string, kelas: string): {
    siswaId: string;
    siswaNama: string;
    kelas: string;
    nilaiTugas: number;
    tugasCount: number;
    nilaiKuis: number;
    kuisCount: number;
    presensiPct: number;
    nilaiAkhir: number;
    predikat: 'A' | 'B' | 'C' | 'D';
    keterangan: string;
  } {
    // 1. Calculate Tugas Average
    const submissions = this.getSubmissions(undefined, siswaId);
    const gradedSubmissions = submissions.filter((s) => s.NILAI !== undefined);
    const sumTugas = gradedSubmissions.reduce((acc, curr) => acc + (curr.NILAI || 0), 0);
    const avgTugas = gradedSubmissions.length > 0 ? Math.round(sumTugas / gradedSubmissions.length) : 85;

    // 2. Calculate Quiz Average
    const attempts = this.getQuizAttempts(undefined, siswaId);
    const sumKuis = attempts.reduce((acc, curr) => acc + curr.SCORE, 0);
    const avgKuis = attempts.length > 0 ? Math.round(sumKuis / attempts.length) : 88;

    // 3. Attendance Percentage
    const attStats = this.getStudentAttendanceStats(siswaId, kelas);
    const presensiPct = attStats.percentage !== undefined ? attStats.percentage : 95;

    // 4. Portfolio items average (if portfolio weight configured)
    const portfolioItems = this.getPortfolioItems(kelas, siswaId);
    const avgPortofolio = portfolioItems.length > 0
      ? Math.round(portfolioItems.reduce((acc, p) => acc + ((p as any).SCORE || 85), 0) / portfolioItems.length)
      : 85;

    // 5. Dynamic Nilai Akhir Calculation using GradeWeightConfig
    const weightConfig = this.getGradeWeightConfig(kelas);
    const wTugas = (weightConfig?.BOBOT_TUGAS ?? 40) / 100;
    const wKuis = (weightConfig?.BOBOT_KUIS ?? 40) / 100;
    const wPresensi = (weightConfig?.BOBOT_PRESENSI ?? 20) / 100;
    const wPortofolio = (weightConfig?.BOBOT_PORTOFOLIO ?? 0) / 100;

    const totalWeight = (wTugas + wKuis + wPresensi + wPortofolio) || 1;
    const weightedSum = (avgTugas * wTugas) + (avgKuis * wKuis) + (presensiPct * wPresensi) + (avgPortofolio * wPortofolio);
    const nilaiAkhir = Math.round(weightedSum / totalWeight);

    let predikat: 'A' | 'B' | 'C' | 'D' = 'B';
    let keterangan = 'Menunjukkan penguasaan materi yang baik dan aktif dalam kegiatan kelas.';

    if (nilaiAkhir >= 90) {
      predikat = 'A';
      keterangan = 'Sangat Menguasai seluruh capaian pembelajaran dengan keaktifan belajar luar biasa.';
    } else if (nilaiAkhir >= 80) {
      predikat = 'B';
      keterangan = 'Menguasai capaian pembelajaran dengan baik, disiplin mengumpulkan tugas.';
    } else if (nilaiAkhir >= 70) {
      predikat = 'C';
      keterangan = 'Cukup menguasai materi, perlu penguatan pada ketelitian pengerjaan tugas & latihan numerasi.';
    } else {
      predikat = 'D';
      keterangan = 'Perlu bimbingan dan remedial berkelanjutan untuk mencapai Kriteria Ketuntasan Minimal.';
    }

    return {
      siswaId,
      siswaNama,
      kelas,
      nilaiTugas: avgTugas,
      tugasCount: gradedSubmissions.length,
      nilaiKuis: avgKuis,
      kuisCount: attempts.length,
      presensiPct,
      nilaiAkhir,
      predikat,
      keterangan,
    };
  }

  // ==========================================
  // === 7. ACADEMIC TREND ANALYTICS FOR CHARTS ===
  // ==========================================
  public getStudentAcademicTimeline(siswaId: string, siswaNama: string, kelas: string): {
    tahap: string;
    nilaiSiswa: number;
    rataRataKelas: number;
    kkm: number;
    kategori: string;
    tanggal: string;
  }[] {
    // Generate realistic chronological milestones
    // Base scores calculated from actual submissions/quizzes or seeded progression
    const seedOffset = (siswaId.charCodeAt(siswaId.length - 1) % 7) - 3;
    
    return [
      { tahap: 'Tugas 1 (Literasi)', nilaiSiswa: Math.min(100, Math.max(65, 82 + seedOffset)), rataRataKelas: 83, kkm: 75, kategori: 'Tugas', tanggal: 'Minggu 1' },
      { tahap: 'Kuis CBT 1', nilaiSiswa: Math.min(100, Math.max(65, 86 + seedOffset * 2)), rataRataKelas: 81, kkm: 75, kategori: 'Kuis', tanggal: 'Minggu 2' },
      { tahap: 'Tugas 2 (Numerasi)', nilaiSiswa: Math.min(100, Math.max(65, 84 + seedOffset)), rataRataKelas: 84, kkm: 75, kategori: 'Tugas', tanggal: 'Minggu 3' },
      { tahap: 'Ulangan Harian 1', nilaiSiswa: Math.min(100, Math.max(65, 88 + seedOffset * 2)), rataRataKelas: 85, kkm: 75, kategori: 'Ulangan', tanggal: 'Minggu 4' },
      { tahap: 'Praktik / LKPD', nilaiSiswa: Math.min(100, Math.max(65, 90 + seedOffset)), rataRataKelas: 87, kkm: 75, kategori: 'Tugas', tanggal: 'Minggu 5' },
      { tahap: 'Kuis CBT 2', nilaiSiswa: Math.min(100, Math.max(65, 92 + seedOffset * 2)), rataRataKelas: 88, kkm: 75, kategori: 'Kuis', tanggal: 'Minggu 6' },
      { tahap: 'PTS (Tengah Sem.)', nilaiSiswa: Math.min(100, Math.max(65, 89 + seedOffset)), rataRataKelas: 86, kkm: 75, kategori: 'PTS', tanggal: 'Minggu 8' },
    ];
  }

  public getClassComparisonTrends(): {
    kelas: string;
    rataRataTugas: number;
    rataRataKuis: number;
    rataRataPresensi: number;
    nilaiAkhirKelas: number;
    jumlahSiswa: number;
  }[] {
    return [
      { kelas: 'Kelas 1', rataRataTugas: 86, rataRataKuis: 88, rataRataPresensi: 96, nilaiAkhirKelas: 89, jumlahSiswa: 4 },
      { kelas: 'Kelas 2', rataRataTugas: 84, rataRataKuis: 85, rataRataPresensi: 94, nilaiAkhirKelas: 86, jumlahSiswa: 4 },
      { kelas: 'Kelas 3', rataRataTugas: 87, rataRataKuis: 89, rataRataPresensi: 95, nilaiAkhirKelas: 89, jumlahSiswa: 4 },
      { kelas: 'Kelas 4', rataRataTugas: 85, rataRataKuis: 87, rataRataPresensi: 93, nilaiAkhirKelas: 87, jumlahSiswa: 4 },
      { kelas: 'Kelas 5', rataRataTugas: 88, rataRataKuis: 91, rataRataPresensi: 97, nilaiAkhirKelas: 91, jumlahSiswa: 4 },
      { kelas: 'Kelas 6', rataRataTugas: 90, rataRataKuis: 92, rataRataPresensi: 98, nilaiAkhirKelas: 92, jumlahSiswa: 4 },
    ];
  }

  public getWeeklyClassGradeTrends(targetKelas?: string): {
    minggu: string;
    mingguKe: number;
    rataRataTugas: number;
    rataRataKuis: number;
    rataRataGabungan: number;
    kkm: number;
    jumlahTugasDikumpul: number;
    status: string;
  }[] {
    this.initClassroom();
    const classOffsetMap: Record<string, number> = {
      'Kelas 1': 2,
      'Kelas 2': -1,
      'Kelas 3': 3,
      'Kelas 4': 0,
      'Kelas 5': 4,
      'Kelas 6': 5,
    };
    const offset = targetKelas && targetKelas !== 'Semua' ? (classOffsetMap[targetKelas] || 0) : 1;

    const baseWeeks = [
      { minggu: 'Minggu 1', mingguKe: 1, tugas: 80, kuis: 78, tumpul: 12 },
      { minggu: 'Minggu 2', mingguKe: 2, tugas: 82, kuis: 81, tumpul: 15 },
      { minggu: 'Minggu 3', mingguKe: 3, tugas: 83, kuis: 80, tumpul: 18 },
      { minggu: 'Minggu 4', mingguKe: 4, tugas: 86, kuis: 84, tumpul: 20 },
      { minggu: 'Minggu 5', mingguKe: 5, tugas: 85, kuis: 87, tumpul: 22 },
      { minggu: 'Minggu 6', mingguKe: 6, tugas: 88, kuis: 89, tumpul: 25 },
      { minggu: 'Minggu 7', mingguKe: 7, tugas: 89, kuis: 88, tumpul: 24 },
      { minggu: 'Minggu 8', mingguKe: 8, tugas: 91, kuis: 92, tumpul: 28 },
    ];

    return baseWeeks.map((w) => {
      const avgTugas = Math.min(100, Math.max(60, w.tugas + offset));
      const avgKuis = Math.min(100, Math.max(60, w.kuis + offset));
      const avgGabungan = Math.round((avgTugas + avgKuis) / 2);

      return {
        minggu: w.minggu,
        mingguKe: w.mingguKe,
        rataRataTugas: avgTugas,
        rataRataKuis: avgKuis,
        rataRataGabungan: avgGabungan,
        kkm: 75,
        jumlahTugasDikumpul: w.tumpul + (offset > 0 ? offset * 2 : 0),
        status: avgGabungan >= 85 ? 'Sangat Baik' : avgGabungan >= 75 ? 'Baik' : 'Cukup',
      };
    });
  }

  // --- Media Pembelajaran Methods ---
  public getMediaItems(courseId?: string): ClassroomMedia[] {
    this.initClassroom();
    const items = this.getItem<ClassroomMedia[]>(STORAGE_KEYS.MEDIA, DEFAULT_MEDIA);
    if (courseId) {
      return items.filter(m => m.COURSE_ID === courseId);
    }
    return items;
  }

  public saveMediaItem(media: ClassroomMedia): void {
    this.initClassroom();
    const items = this.getMediaItems();
    const index = items.findIndex(m => m.ID === media.ID);
    if (index >= 0) {
      items[index] = media;
    } else {
      items.unshift(media);
    }
    this.setItem(STORAGE_KEYS.MEDIA, items);
  }

  public deleteMediaItem(id: string): void {
    this.initClassroom();
    const items = this.getMediaItems().filter(m => m.ID !== id);
    this.setItem(STORAGE_KEYS.MEDIA, items);
  }

  public getMediaSubmissions(mediaId?: string, siswaId?: string): MediaSubmission[] {
    this.initClassroom();
    const subs = this.getItem<MediaSubmission[]>(STORAGE_KEYS.MEDIA_SUBMISSIONS, DEFAULT_MEDIA_SUBMISSIONS);
    let result = subs;
    if (mediaId) result = result.filter(s => s.MEDIA_ID === mediaId);
    if (siswaId) result = result.filter(s => s.SISWA_ID === siswaId);
    return result;
  }

  public getAllMediaSubmissions(): MediaSubmission[] {
    this.initClassroom();
    return this.getItem<MediaSubmission[]>(STORAGE_KEYS.MEDIA_SUBMISSIONS, DEFAULT_MEDIA_SUBMISSIONS);
  }

  public saveMediaSubmission(sub: MediaSubmission): void {
    this.initClassroom();
    const subs = this.getAllMediaSubmissions();
    const index = subs.findIndex(s => s.ID === sub.ID || (s.MEDIA_ID === sub.MEDIA_ID && s.SISWA_ID === sub.SISWA_ID));
    if (index >= 0) {
      subs[index] = { ...subs[index], ...sub };
    } else {
      subs.push(sub);
    }
    this.setItem(STORAGE_KEYS.MEDIA_SUBMISSIONS, subs);
  }

  // --- Virtual Live Class Methods ---
  public getLiveClasses(kelas?: string): VirtualLiveClassSession[] {
    this.initClassroom();
    const items = this.getItem<VirtualLiveClassSession[]>(STORAGE_KEYS.LIVE_CLASSES, DEFAULT_LIVE_CLASSES);
    if (kelas && kelas !== 'Semua') {
      return items.filter(s => s.KELAS === kelas || s.KELAS === 'Semua');
    }
    return items;
  }

  public saveLiveClass(session: VirtualLiveClassSession): void {
    this.initClassroom();
    const items = this.getLiveClasses();
    const index = items.findIndex(s => s.ID === session.ID);
    if (index >= 0) {
      items[index] = session;
    } else {
      items.unshift(session);
    }
    this.setItem(STORAGE_KEYS.LIVE_CLASSES, items);

    // Automatically trigger notification for live class
    this.addNotification({
      KELAS: session.KELAS,
      TITLE: `🎥 Sesi Live Daring: ${session.JUDUL}`,
      MESSAGE: `Sesi tatap muka daring diajukan oleh ${session.GURU_NAMA} pada pukul ${session.JAM_MULAI} WIB.`,
      TYPE: 'LIVE_CLASS',
      LINK_PAGE: 'live_class',
    });
  }

  public deleteLiveClass(id: string): void {
    this.initClassroom();
    const items = this.getLiveClasses().filter(s => s.ID !== id);
    this.setItem(STORAGE_KEYS.LIVE_CLASSES, items);
  }

  // --- Notification System Methods ---
  public getNotifications(kelas?: string, userId?: string): ClassroomNotification[] {
    this.initClassroom();
    const notifs = this.getItem<ClassroomNotification[]>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    return notifs.filter(n => {
      const matchKelas = !kelas || kelas === 'Semua' || !n.KELAS || n.KELAS === kelas;
      const matchUser = !n.USER_ID || n.USER_ID === userId;
      return matchKelas && matchUser;
    });
  }

  public addNotification(notif: Omit<ClassroomNotification, 'ID' | 'CREATED_AT' | 'IS_READ'>): void {
    this.initClassroom();
    const notifs = this.getItem<ClassroomNotification[]>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    const newNotif: ClassroomNotification = {
      ...notif,
      ID: 'NOTIF-' + Date.now(),
      CREATED_AT: nowISO(),
      IS_READ: false,
    };
    notifs.unshift(newNotif);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs.slice(0, 50)); // Keep max 50 recent notifs
  }

  public markNotificationRead(id: string): void {
    this.initClassroom();
    const notifs = this.getItem<ClassroomNotification[]>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    const updated = notifs.map(n => n.ID === id ? { ...n, IS_READ: true } : n);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  public markAllNotificationsRead(kelas?: string): void {
    this.initClassroom();
    const notifs = this.getItem<ClassroomNotification[]>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    const updated = notifs.map(n => {
      if (!kelas || kelas === 'Semua' || !n.KELAS || n.KELAS === kelas) {
        return { ...n, IS_READ: true };
      }
      return n;
    });
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  public generateAutomaticReminders(kelas?: string, siswaId?: string): void {
    this.initClassroom();
    const assignments = this.getAssignments();
    const submissions = this.getSubmissions(siswaId);
    const todayStr = todayDate();

    // Check assignments due in the next 3 days that are not submitted
    assignments.forEach(asg => {
      if (asg.DEADLINE >= todayStr) {
        const hasSubmitted = submissions.some(s => s.ASSIGNMENT_ID === asg.ID && s.STATUS === 'SUBMITTED');
        if (!hasSubmitted) {
          const existingNotifs = this.getNotifications(kelas, siswaId);
          const alreadyNotified = existingNotifs.some(n => n.MESSAGE.includes(asg.JUDUL));
          if (!alreadyNotified) {
            this.addNotification({
              USER_ID: siswaId,
              KELAS: kelas,
              TITLE: `⏰ Pengingat Tenggat Waktu: ${asg.JUDUL}`,
              MESSAGE: `Tugas "${asg.JUDUL}" jatuh tempo pada ${asg.DEADLINE}. Segera selesaikan dan kumpulkan!`,
              TYPE: 'DEADLINE',
              LINK_PAGE: 'assignments',
            });
          }
        }
      }
    });
  }

  // --- Grade Weighting Configuration Methods ---
  public getGradeWeightConfig(kelas: string, mapel?: string): GradeWeightConfig {
    this.initClassroom();
    const configs = this.getItem<GradeWeightConfig[]>(STORAGE_KEYS.GRADE_WEIGHTS, DEFAULT_GRADE_WEIGHTS);
    const found = configs.find(c => c.KELAS === kelas && (!mapel || c.MAPEL === mapel));
    if (found) return found;

    return {
      KELAS: kelas || 'Kelas 1',
      MAPEL: mapel || 'Umum',
      BOBOT_TUGAS: 40,
      BOBOT_KUIS: 40,
      BOBOT_PRESENSI: 20,
      BOBOT_PORTOFOLIO: 0,
      UPDATED_AT: nowISO(),
      UPDATED_BY: 'Sistem Standard',
    };
  }

  public saveGradeWeightConfig(config: GradeWeightConfig): void {
    this.initClassroom();
    const configs = this.getItem<GradeWeightConfig[]>(STORAGE_KEYS.GRADE_WEIGHTS, DEFAULT_GRADE_WEIGHTS);
    const idx = configs.findIndex(c => c.KELAS === config.KELAS && c.MAPEL === config.MAPEL);
    if (idx >= 0) {
      configs[idx] = config;
    } else {
      configs.push(config);
    }
    this.setItem(STORAGE_KEYS.GRADE_WEIGHTS, configs);
  }

  // --- Digital Student Portfolio Methods ---
  public getPortfolioItems(kelas?: string, siswaId?: string): StudentPortfolioItem[] {
    this.initClassroom();
    let items = this.getItem<StudentPortfolioItem[]>(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
    if (kelas && kelas !== 'Semua') {
      items = items.filter(p => p.KELAS === kelas);
    }
    if (siswaId) {
      items = items.filter(p => p.SISWA_ID === siswaId);
    }
    return items;
  }

  public savePortfolioItem(item: StudentPortfolioItem): void {
    this.initClassroom();
    const items = this.getItem<StudentPortfolioItem[]>(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
    const index = items.findIndex(p => p.ID === item.ID);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.unshift(item);
    }
    this.setItem(STORAGE_KEYS.PORTFOLIO, items);
  }

  public togglePortfolioLike(portfolioId: string, userId: string): void {
    this.initClassroom();
    const items = this.getItem<StudentPortfolioItem[]>(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
    const index = items.findIndex(p => p.ID === portfolioId);
    if (index >= 0) {
      const likes = items[index].LIKES || [];
      if (likes.includes(userId)) {
        items[index].LIKES = likes.filter(id => id !== userId);
      } else {
        items[index].LIKES = [...likes, userId];
      }
      this.setItem(STORAGE_KEYS.PORTFOLIO, items);
    }
  }

  public addPortfolioComment(
    portfolioId: string,
    authorId: string,
    authorNama: string,
    authorRole: any,
    content: string
  ): void {
    this.initClassroom();
    const items = this.getItem<StudentPortfolioItem[]>(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
    const index = items.findIndex(p => p.ID === portfolioId);
    if (index >= 0) {
      const newComment: PortfolioComment = {
        ID: 'PC-' + Date.now(),
        AUTHOR_ID: authorId,
        AUTHOR_NAMA: authorNama,
        AUTHOR_ROLE: authorRole,
        CONTENT: content,
        CREATED_AT: nowISO(),
      };
      items[index].COMMENTS = [...(items[index].COMMENTS || []), newComment];
      this.setItem(STORAGE_KEYS.PORTFOLIO, items);
    }
  }

  public deletePortfolioItem(id: string): void {
    this.initClassroom();
    const items = this.getItem<StudentPortfolioItem[]>(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO).filter(p => p.ID !== id);
    this.setItem(STORAGE_KEYS.PORTFOLIO, items);
  }

  // --- Peer Review System ---
  public getPeerReviews(assignmentId?: string, submissionId?: string): any[] {
    this.initClassroom();
    let all = this.getItem<any[]>('BB_CLASSROOM_PEER_REVIEWS_V1', []);
    if (assignmentId) all = all.filter((r) => r.ASSIGNMENT_ID === assignmentId);
    if (submissionId) all = all.filter((r) => r.SUBMISSION_ID === submissionId);
    return all;
  }

  public savePeerReview(review: {
    ASSIGNMENT_ID: string;
    SUBMISSION_ID: string;
    REVIEWER_ID: string;
    SCORE_KREATIVITAS: number;
    FEEDBACK_KREATIVITAS: string;
    SCORE_STRUKTUR: number;
    FEEDBACK_STRUKTUR: string;
    SCORE_MATERI: number;
    FEEDBACK_MATERI: string;
    SCORE_SIKAP?: number;
    FEEDBACK_SIKAP?: string;
    GENERAL_COMMENT: string;
  }): void {
    const list = this.getItem<any[]>('BB_CLASSROOM_PEER_REVIEWS_V1', []);
    const existingIdx = list.findIndex(r => r.SUBMISSION_ID === review.SUBMISSION_ID && r.REVIEWER_ID === review.REVIEWER_ID);
    const newReview = {
      ...review,
      ID: 'PRV-' + Date.now(),
      SUBMITTED_AT: ts(),
    };
    if (existingIdx >= 0) {
      list[existingIdx] = newReview;
    } else {
      list.push(newReview);
    }
    this.setItem('BB_CLASSROOM_PEER_REVIEWS_V1', list);
  }

  public togglePeerReviewThumbsUp(reviewId: string): void {
    const list = this.getItem<any[]>('BB_CLASSROOM_PEER_REVIEWS_V1', []);
    const idx = list.findIndex(r => r.ID === reviewId);
    if (idx >= 0) {
      list[idx].THUMBS_UP = !list[idx].THUMBS_UP;
      this.setItem('BB_CLASSROOM_PEER_REVIEWS_V1', list);
    } else {
      // If the review ID is a demo review, we can persist it to let users interact with it
      const demoReviews = [
        {
          ID: 'demo-peer-1',
          SCORE_KREATIVITAS: 92,
          FEEDBACK_KREATIVITAS: 'Penyajian ide sangat kreatif, orisinal, dan visualisasi tugas sangat rapi.',
          SCORE_STRUKTUR: 85,
          FEEDBACK_STRUKTUR: 'Format penulisan sudah sistematis, alur pengerjaan cukup jelas dan berurutan.',
          SCORE_MATERI: 78,
          FEEDBACK_MATERI: 'Sebagian jawaban pada nomor 3 dan 4 perlu diperiksa kembali rumus dasarnya.',
          GENERAL_COMMENT: 'Kerja keras yang luar biasa! Pertahankan kreativitasmu dan teliti kembali perhitungan.',
          SUBMITTED_AT: '2026-03-01 09:30',
          REVIEWER_ID: 'SISWA-001', // Make it come from a valid student ID so they get the Helper Badge
          THUMBS_UP: false,
        },
        {
          ID: 'demo-peer-2',
          SCORE_KREATIVITAS: 90,
          FEEDBACK_KREATIVITAS: 'Ide solusi sangat segar dan berbeda dari teman yang lain.',
          SCORE_STRUKTUR: 88,
          FEEDBACK_STRUKTUR: 'Tabel dan diagram dibuat dengan rapi.',
          SCORE_MATERI: 80,
          FEEDBACK_MATERI: 'Sudah sesuai dengan petunjuk guru, hanya perlu sedikit elaborasi di kesimpulan.',
          GENERAL_COMMENT: 'Sangat inspiratif! Senang membaca hasil pekerjaanmu.',
          SUBMITTED_AT: '2026-03-01 11:15',
          REVIEWER_ID: 'SISWA-002', // Another student ID
          THUMBS_UP: false,
        }
      ];
      const foundDemo = demoReviews.find(r => r.ID === reviewId);
      if (foundDemo) {
        foundDemo.THUMBS_UP = true;
        list.push(foundDemo);
        this.setItem('BB_CLASSROOM_PEER_REVIEWS_V1', list);
      }
    }
  }

  // --- P5 Project Tracker System ---
  public getP5Projects(kelas?: string): P5Project[] {
    this.initClassroom();
    let projects = this.getItem<P5Project[]>(STORAGE_KEYS.P5_PROJECTS, DEFAULT_P5_PROJECTS);
    if (!projects || projects.length === 0) {
      projects = DEFAULT_P5_PROJECTS;
      this.setItem(STORAGE_KEYS.P5_PROJECTS, projects);
    }
    // Ensure all projects have DEADLINE populated
    const defaultDeadlines: Record<string, string> = {
      'kelas 1': '2026-11-09',
      'kelas 2': '2026-11-06',
      'kelas 3': '2026-11-12',
      'kelas 4': '2026-11-07',
      'kelas 5': '2026-11-07',
      'kelas 6': '2026-11-06',
    };
    projects = projects.map((p) => {
      if (!p.DEADLINE) {
        return { ...p, DEADLINE: defaultDeadlines[p.KELAS.toLowerCase()] || '2026-11-07' };
      }
      return p;
    });
    if (kelas) {
      const filtered = projects.filter(p => p.KELAS.toLowerCase() === kelas.toLowerCase());
      if (filtered.length > 0) return filtered;
    }
    return projects;
  }

  public getP5ProjectForClass(kelas: string): P5Project {
    const list = this.getP5Projects(kelas);
    if (list.length > 0) return list[0];
    
    return {
      ID: 'P5-PRJ-' + Date.now(),
      KELAS: kelas || 'Kelas 4',
      JUDUL: 'Proyek Profil Pelajar Pancasila ' + (kelas || 'Kelas 4'),
      TEMA: 'Gaya Hidup Berkelanjutan',
      DESKRIPSI: 'Proyek penguatan karakter dan kompetensi abad 21 siswa.',
      DIMENSI: ['Gotong Royong', 'Bernalar Kritis', 'Kreatif'],
      STAGES: [
        { ID: 'STG-1', NAME: 'Tahap 1: Pengenalan & Orientasi', DESCRIPTION: 'Memahami isu dan tema proyek', STATUS: 'SELESAI', COMPLETED_AT: todayDate() },
        { ID: 'STG-2', NAME: 'Tahap 2: Kontekstualisasi & Riset', DESCRIPTION: 'Merencanakan langkah aksi bersama', STATUS: 'SEDANG_BERJALAN' },
        { ID: 'STG-3', NAME: 'Tahap 3: Aksi & Pembuatan Karya', DESCRIPTION: 'Praktik dan pembuatan produk karya', STATUS: 'BELUM_MULAI' },
        { ID: 'STG-4', NAME: 'Tahap 4: Refleksi & Tindak Lanjut', DESCRIPTION: 'Evaluasi dan pameran hasil belajar', STATUS: 'BELUM_MULAI' },
      ],
      PERCENTAGE: 38,
      DEADLINE: '2026-11-07',
      UPDATED_AT: nowISO(),
      UPDATED_BY: 'GURU_SYS',
    };
  }

  public updateP5ProjectDeadline(
    projectId: string,
    newDeadline: string,
    updatedBy: string = 'GURU_SYS'
  ): P5Project {
    const projects = this.getP5Projects();
    const projIdx = projects.findIndex(p => p.ID === projectId);
    let targetProject: P5Project;

    if (projIdx >= 0) {
      targetProject = projects[projIdx];
    } else {
      targetProject = DEFAULT_P5_PROJECTS[0];
    }

    const updatedProject: P5Project = {
      ...targetProject,
      DEADLINE: newDeadline,
      UPDATED_AT: nowISO(),
      UPDATED_BY: updatedBy,
    };

    if (projIdx >= 0) {
      projects[projIdx] = updatedProject;
    } else {
      projects.push(updatedProject);
    }

    this.setItem(STORAGE_KEYS.P5_PROJECTS, projects);
    return updatedProject;
  }

  public updateP5StageStatus(
    projectId: string,
    stageId: string,
    newStatus: 'BELUM_MULAI' | 'SEDANG_BERJALAN' | 'SELESAI',
    updatedBy: string
  ): P5Project {
    const projects = this.getP5Projects();
    const projIdx = projects.findIndex(p => p.ID === projectId);
    let targetProject: P5Project;

    if (projIdx >= 0) {
      targetProject = projects[projIdx];
    } else {
      targetProject = DEFAULT_P5_PROJECTS[0];
    }

    const updatedStages = targetProject.STAGES.map(s => {
      if (s.ID === stageId) {
        return {
          ...s,
          STATUS: newStatus,
          COMPLETED_AT: newStatus === 'SELESAI' ? todayDate() : s.COMPLETED_AT,
        };
      }
      return s;
    });

    const total = updatedStages.length || 1;
    const completedCount = updatedStages.filter(s => s.STATUS === 'SELESAI').length;
    const inProgressCount = updatedStages.filter(s => s.STATUS === 'SEDANG_BERJALAN').length;
    const percentage = Math.round(((completedCount + (inProgressCount * 0.5)) / total) * 100);

    const updatedProject: P5Project = {
      ...targetProject,
      STAGES: updatedStages,
      PERCENTAGE: percentage,
      UPDATED_AT: nowISO(),
      UPDATED_BY: updatedBy,
    };

    if (projIdx >= 0) {
      projects[projIdx] = updatedProject;
    } else {
      projects.push(updatedProject);
    }

    this.setItem(STORAGE_KEYS.P5_PROJECTS, projects);
    return updatedProject;
  }

  public addP5Stage(
    projectId: string,
    stageData: {
      NAME: string;
      DESCRIPTION: string;
      STATUS?: 'BELUM_MULAI' | 'SEDANG_BERJALAN' | 'SELESAI';
      TARGET_DATE?: string;
      COMPLETED_AT?: string;
    },
    updatedBy: string = 'GURU_SYS'
  ): P5Project {
    const projects = this.getP5Projects();
    const projIdx = projects.findIndex(p => p.ID === projectId);
    let targetProject: P5Project;

    if (projIdx >= 0) {
      targetProject = projects[projIdx];
    } else {
      targetProject = DEFAULT_P5_PROJECTS[0];
    }

    const newStage: P5ProjectStage = {
      ID: 'STG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      NAME: stageData.NAME.trim(),
      DESCRIPTION: stageData.DESCRIPTION.trim(),
      STATUS: stageData.STATUS || 'BELUM_MULAI',
      TARGET_DATE: stageData.TARGET_DATE || undefined,
      COMPLETED_AT: stageData.STATUS === 'SELESAI' ? (stageData.COMPLETED_AT || todayDate()) : undefined,
    };

    const updatedStages = [...targetProject.STAGES, newStage];
    const total = updatedStages.length || 1;
    const completedCount = updatedStages.filter(s => s.STATUS === 'SELESAI').length;
    const inProgressCount = updatedStages.filter(s => s.STATUS === 'SEDANG_BERJALAN').length;
    const percentage = Math.round(((completedCount + (inProgressCount * 0.5)) / total) * 100);

    const updatedProject: P5Project = {
      ...targetProject,
      STAGES: updatedStages,
      PERCENTAGE: percentage,
      UPDATED_AT: nowISO(),
      UPDATED_BY: updatedBy,
    };

    if (projIdx >= 0) {
      projects[projIdx] = updatedProject;
    } else {
      projects.push(updatedProject);
    }

    this.setItem(STORAGE_KEYS.P5_PROJECTS, projects);
    return updatedProject;
  }

  public deleteP5Stage(
    projectId: string,
    stageId: string,
    updatedBy: string = 'GURU_SYS'
  ): P5Project {
    const projects = this.getP5Projects();
    const projIdx = projects.findIndex(p => p.ID === projectId);
    let targetProject: P5Project;

    if (projIdx >= 0) {
      targetProject = projects[projIdx];
    } else {
      targetProject = DEFAULT_P5_PROJECTS[0];
    }

    const updatedStages = targetProject.STAGES.filter(s => s.ID !== stageId);
    const total = updatedStages.length || 1;
    const completedCount = updatedStages.filter(s => s.STATUS === 'SELESAI').length;
    const inProgressCount = updatedStages.filter(s => s.STATUS === 'SEDANG_BERJALAN').length;
    const percentage = Math.round(((completedCount + (inProgressCount * 0.5)) / total) * 100);

    const updatedProject: P5Project = {
      ...targetProject,
      STAGES: updatedStages,
      PERCENTAGE: percentage,
      UPDATED_AT: nowISO(),
      UPDATED_BY: updatedBy,
    };

    if (projIdx >= 0) {
      projects[projIdx] = updatedProject;
    } else {
      projects.push(updatedProject);
    }

    this.setItem(STORAGE_KEYS.P5_PROJECTS, projects);
    return updatedProject;
  }

  // --- P5 Daily Activity Logs & Teacher Feedback ---
  public getP5DailyLogs(kelas?: string, siswaId?: string, projectId?: string): P5ProjectDailyLog[] {
    this.initClassroom();
    let logs = this.getItem<P5ProjectDailyLog[]>(STORAGE_KEYS.P5_DAILY_LOGS, DEFAULT_P5_DAILY_LOGS);
    if (!logs || logs.length === 0) {
      logs = DEFAULT_P5_DAILY_LOGS;
      this.setItem(STORAGE_KEYS.P5_DAILY_LOGS, logs);
    }

    return logs.filter((log) => {
      if (kelas && log.KELAS.toLowerCase() !== kelas.toLowerCase()) return false;
      if (siswaId && log.SISWA_ID !== siswaId) return false;
      if (projectId && log.PROJECT_ID !== projectId) return false;
      return true;
    }).sort((a, b) => new Date(b.CREATED_AT).getTime() - new Date(a.CREATED_AT).getTime());
  }

  public saveP5DailyLog(
    logData: Partial<P5ProjectDailyLog> & {
      SISWA_ID: string;
      SISWA_NAMA: string;
      KELAS: string;
      AKTIVITAS: string;
    }
  ): P5ProjectDailyLog {
    const logs = this.getItem<P5ProjectDailyLog[]>(STORAGE_KEYS.P5_DAILY_LOGS, DEFAULT_P5_DAILY_LOGS);
    const now = nowISO();

    if (logData.ID) {
      const idx = logs.findIndex((l) => l.ID === logData.ID);
      if (idx >= 0) {
        const existing = logs[idx];
        const updated: P5ProjectDailyLog = {
          ...existing,
          ...logData,
          UPDATED_AT: now,
        };
        logs[idx] = updated;
        this.setItem(STORAGE_KEYS.P5_DAILY_LOGS, logs);
        return updated;
      }
    }

    const defaultProject = this.getP5ProjectForClass(logData.KELAS);
    const newLog: P5ProjectDailyLog = {
      ID: 'P5-LOG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      PROJECT_ID: logData.PROJECT_ID || defaultProject.ID,
      PROJECT_TITLE: logData.PROJECT_TITLE || defaultProject.JUDUL,
      KELAS: logData.KELAS,
      SISWA_ID: logData.SISWA_ID,
      SISWA_NAMA: logData.SISWA_NAMA,
      TANGGAL: logData.TANGGAL || todayDate(),
      TAHAP_ID: logData.TAHAP_ID || defaultProject.STAGES[0]?.ID,
      TAHAP_NAMA: logData.TAHAP_NAMA || defaultProject.STAGES[0]?.NAME,
      AKTIVITAS: logData.AKTIVITAS,
      REFLEKSI: logData.REFLEKSI || '',
      DIMENSI_TERLATIH: logData.DIMENSI_TERLATIH || ['Gotong Royong', 'Kreatif'],
      DOKUMENTASI_URL: logData.DOKUMENTASI_URL || '',
      FEEDBACK_GURU: logData.FEEDBACK_GURU,
      GURU_NAMA: logData.GURU_NAMA,
      FEEDBACK_AT: logData.FEEDBACK_AT,
      STATUS: logData.STATUS || 'SUBMITTED',
      CREATED_AT: now,
      UPDATED_AT: now,
    };

    logs.unshift(newLog);
    this.setItem(STORAGE_KEYS.P5_DAILY_LOGS, logs);
    return newLog;
  }

  public giveP5DailyLogFeedback(
    logId: string,
    feedback: string,
    guruNama: string
  ): P5ProjectDailyLog | null {
    const logs = this.getItem<P5ProjectDailyLog[]>(STORAGE_KEYS.P5_DAILY_LOGS, DEFAULT_P5_DAILY_LOGS);
    const idx = logs.findIndex((l) => l.ID === logId);
    if (idx < 0) return null;

    const updated: P5ProjectDailyLog = {
      ...logs[idx],
      FEEDBACK_GURU: feedback,
      GURU_NAMA: guruNama,
      FEEDBACK_AT: nowISO(),
      STATUS: 'REVIEWED',
      UPDATED_AT: nowISO(),
    };

    logs[idx] = updated;
    this.setItem(STORAGE_KEYS.P5_DAILY_LOGS, logs);
    return updated;
  }

  public deleteP5DailyLog(logId: string): boolean {
    const logs = this.getItem<P5ProjectDailyLog[]>(STORAGE_KEYS.P5_DAILY_LOGS, DEFAULT_P5_DAILY_LOGS);
    const filtered = logs.filter((l) => l.ID !== logId);
    if (filtered.length !== logs.length) {
      this.setItem(STORAGE_KEYS.P5_DAILY_LOGS, filtered);
      return true;
    }
    return false;
  }

  // ==========================================
  // --- Subject KKM Targets & Alerts Methods ---
  // ==========================================
  public getSubjectKkmTargets(): Record<string, number> {
    this.initClassroom();
    const stored = this.getItem<Record<string, number>>(STORAGE_KEYS.SUBJECT_KKM, DEFAULT_SUBJECT_KKM);
    return { ...DEFAULT_SUBJECT_KKM, ...(stored || {}) };
  }

  public saveSubjectKkmTargets(targets: Record<string, number>): void {
    this.initClassroom();
    this.setItem(STORAGE_KEYS.SUBJECT_KKM, targets);
  }

  public getSubjectClassAverage(kelas: string, subject: string): number {
    let students: { id: string; nama: string; kelas: string }[] = [];
    try {
      const raw = localStorage.getItem('BB_ACCOUNTS');
      if (raw) {
        const accounts = JSON.parse(raw);
        if (Array.isArray(accounts)) {
          const filtered = accounts.filter(
            (a: any) => a.ROLE === 'SISWA' && (!kelas || kelas === 'Semua' || a.KELAS === kelas || a.KELAS?.startsWith(kelas))
          );
          if (filtered.length > 0) {
            students = filtered.map((s: any) => ({ id: s.ID, nama: s.NAMA, kelas: s.KELAS || kelas }));
          }
        }
      }
    } catch {
      // ignore
    }

    if (students.length === 0) {
      students = [
        { id: 'S-01', nama: 'Ahmad Faiz', kelas: kelas || 'Kelas 5A' },
        { id: 'S-02', nama: 'Bunga Citra', kelas: kelas || 'Kelas 5A' },
        { id: 'S-03', nama: 'Cahyo Utomo', kelas: kelas || 'Kelas 5A' },
        { id: 'S-04', nama: 'Dewi Anggraini', kelas: kelas || 'Kelas 5A' },
        { id: 'S-05', nama: 'Eko Prasetyo', kelas: kelas || 'Kelas 5A' },
        { id: 'S-06', nama: 'Fajar Nugraha', kelas: kelas || 'Kelas 5A' },
      ];
    }

    const subjectOffsets: Record<string, number> = {
      'Matematika': -4,
      'Bahasa Indonesia': 2,
      'IPAS': -2,
      'Pendidikan Pancasila': 3,
      'PJOK': 4,
      'Seni Budaya': 3,
      'Bahasa Inggris': -3,
      'Pendidikan Agama': 4,
    };
    const offset = subjectOffsets[subject] || 0;

    let sum = 0;
    students.forEach((s) => {
      let hash = 0;
      const key = `${s.nama}-${subject}-${kelas || 'Kelas 5A'}`;
      for (let i = 0; i < key.length; i++) {
        hash = (hash << 5) - hash + key.charCodeAt(i);
        hash |= 0;
      }
      const score = Math.min(98, Math.max(58, 76 + offset + (Math.abs(hash) % 21) - 10));
      sum += score;
    });

    return Math.round(sum / students.length);
  }

  public checkSubjectKkmAlerts(kelas: string, autoNotify: boolean = true): SubjectKkmAlert[] {
    const targets = this.getSubjectKkmTargets();
    const alerts: SubjectKkmAlert[] = [];
    const subjects = Object.keys(targets);

    subjects.forEach((subject) => {
      const targetKkm = targets[subject];
      const classAvg = this.getSubjectClassAverage(kelas, subject);
      if (classAvg < targetKkm) {
        const shortfall = targetKkm - classAvg;
        alerts.push({
          subject,
          kelas: kelas || 'Kelas 5A',
          classAvg,
          targetKkm,
          shortfall,
          status: shortfall >= 5 ? 'BELUM_TUNTAS' : 'PERINGATAN',
        });

        if (autoNotify) {
          const notifs = this.getNotifications(kelas);
          const alreadyNotified = notifs.some(
            (n) => n.TITLE.includes(`Target KKM ${subject}`) && (n.KELAS === kelas || !n.KELAS)
          );
          if (!alreadyNotified) {
            this.addNotification({
              KELAS: kelas,
              TITLE: `⚠️ Ambang KKM ${subject} Turun (${classAvg}/${targetKkm})`,
              MESSAGE: `Rata-rata kelas ${kelas} untuk mata pelajaran ${subject} adalah ${classAvg}, berada di bawah target KKM ${targetKkm} (selisih -${shortfall} poin). Disarankan melakukan bimbingan remedial dan asesmen ulang.`,
              TYPE: 'SYSTEM',
              LINK_PAGE: 'analytics',
            });
          }
        }
      }
    });

    return alerts;
  }

  // =========================================================================
  // === 14. ERROR PATTERN ANALYSIS & ADAPTIVE REMEDIAL MODULES ===
  // =========================================================================

  public getRemedialModuleCatalog(): RemedialModule[] {
    this.initClassroom();
    const stored = this.getItem<RemedialModule[]>(STORAGE_KEYS.REMEDIAL_MODULES, DEFAULT_REMEDIAL_MODULES);
    const assignedRecords = this.getItem<Record<string, { studentIds: string[]; assignedAt: string }>>(
      STORAGE_KEYS.ASSIGNED_REMEDIAL,
      {}
    );

    return stored.map((mod) => {
      const assigned = assignedRecords[mod.id];
      if (assigned) {
        return {
          ...mod,
          isAssignedToClass: true,
          assignedStudentIds: assigned.studentIds,
          assignedAt: assigned.assignedAt,
        };
      }
      return mod;
    });
  }

  public getAssignmentErrorPatterns(kelas: string, subjectFilter?: string): AssignmentErrorPattern[] {
    this.initClassroom();

    // 1. Get students for class
    let students: { id: string; nama: string; nisn: string; kelas: string }[] = [];
    try {
      const raw = localStorage.getItem('BB_ACCOUNTS');
      if (raw) {
        const accounts = JSON.parse(raw);
        if (Array.isArray(accounts)) {
          const filtered = accounts.filter(
            (a: any) => a.ROLE === 'SISWA' && (!kelas || kelas === 'Semua' || a.KELAS === kelas || a.KELAS?.startsWith(kelas))
          );
          if (filtered.length > 0) {
            students = filtered.map((s: any, idx: number) => ({
              id: s.ID,
              nama: s.NAMA,
              nisn: s.NISN || `00${idx + 1}84920${idx + 1}`,
              kelas: s.KELAS || kelas,
            }));
          }
        }
      }
    } catch {
      // ignore
    }

    if (students.length === 0) {
      students = [
        { id: 'SISWA-001', nama: 'Ahmad Fauzan', nisn: '0019283741', kelas: kelas || 'Kelas 4' },
        { id: 'SISWA-002', nama: 'Siti Aisyah Putri', nisn: '0019283742', kelas: kelas || 'Kelas 4' },
        { id: 'SISWA-003', nama: 'Rian Pratama', nisn: '0019283743', kelas: kelas || 'Kelas 4' },
        { id: 'SISWA-004', nama: 'Dewi Anggraini', nisn: '0019283744', kelas: kelas || 'Kelas 4' },
      ];
    }

    // Helper to determine student scores deterministically per topic
    const getStudentScoreForTopic = (student: { id: string; nama: string }, topicKey: string, base: number) => {
      let hash = 0;
      const key = `${student.nama}-${topicKey}-${kelas}`;
      for (let i = 0; i < key.length; i++) {
        hash = (hash << 5) - hash + key.charCodeAt(i);
        hash |= 0;
      }
      return Math.min(95, Math.max(50, base + ((Math.abs(hash) % 25) - 14)));
    };

    // Define standard Curricular error patterns based on SD Negeri Tangerang 6 diagnostic rubrics
    const patternsRaw: Omit<AssignmentErrorPattern, 'affectedStudents' | 'errorRatePercent' | 'frequencyCount' | 'severity'>[] = [
      {
        id: 'ERR-NUM-001',
        category: 'NUMERASI',
        subject: 'Matematika',
        topic: 'Nilai Tempat & Penjumlahan Bersusun Teknik Menyimpan',
        misconceptionDetails: 'Siswa sering lupa menambahkan angka simpanan puluhan/ratusan pada kolom berikutnya saat menjumlahkan bilangan bersusun tiga digit, menghasilkan jawaban dengan selisih 10 atau 100.',
        recommendedModuleId: 'MOD-REM-NUM-01',
        suggestedRemedialStrategy: 'Scaffolding bertahap dengan kolom nilai tempat berwarna (blok Dienes visual) dan latihan terbimbing 5 soal per sesi.',
      },
      {
        id: 'ERR-NUM-002',
        category: 'NUMERASI',
        subject: 'Matematika',
        topic: 'Pecahan Senilai & Perbandingan Pembilang-Penyebut',
        misconceptionDetails: 'Siswa menganggap bahwa bilangan penyebut yang lebih besar selalu berarti nilai pecahan lebih besar (misal menganggap 1/4 lebih besar dari 1/2), serta keliru menyederhanakan pecahan.',
        recommendedModuleId: 'MOD-REM-NUM-02',
        suggestedRemedialStrategy: 'Representasi diagram visual batang/arsiran pizza kue, diikuti dengan games kartu pasangan pecahan senilai.',
      },
      {
        id: 'ERR-LIT-001',
        category: 'LITERASI',
        subject: 'Bahasa Indonesia',
        topic: 'Menentukan Ide Pokok & Inferensi Kalimat Utama',
        misconceptionDetails: 'Siswa cenderung hanya menyalin kalimat pertama pada seluruh tipe paragraf, kesulitan membedakan antara kalimat pengembang/penjelas dengan ide pokok tersirat.',
        recommendedModuleId: 'MOD-REM-LIT-01',
        suggestedRemedialStrategy: 'Teknik membaca terpandu (Guided Reading) dengan stabilo warna khusus kata kunci, serta pertanyaan inferensial "Mengapa" dan "Bagaimana".',
      },
      {
        id: 'ERR-IPAS-001',
        category: 'IPAS_SAINS',
        subject: 'IPAS',
        topic: 'Jaring-Jaring Makanan & Peran Dekomposer Ekosistem',
        misconceptionDetails: 'Siswa tertukar antara peran dekomposer (pengurai jamur/bakteri) dengan konsumen tingkat puncak, serta kebingungan menelusuri aliran energi pada jaring-jaring bercabang.',
        recommendedModuleId: 'MOD-REM-IPAS-01',
        suggestedRemedialStrategy: 'Penyusunan peta konsep diagram interaktif aliran energi dan studi kasus mini dampak kepunahan katak di sawah Tangerang.',
      },
      {
        id: 'ERR-IPAS-002',
        category: 'IPAS_SAINS',
        subject: 'IPAS',
        topic: 'Siklus Air & Pengaruh Penebangan Pohon Terhadap Resapan',
        misconceptionDetails: 'Siswa keliru membedakan proses evaporasi (penguapan air) dan transpirasi (penguapan tumbuhan), serta belum memahami keterkaitan air tanah dengan bencana banjir lokal.',
        recommendedModuleId: 'MOD-REM-IPAS-02',
        suggestedRemedialStrategy: 'Eksperimen sederhana siklus air dalam botol transparan dan LKPD observasi biopori sekolah.',
      },
      {
        id: 'ERR-PP-001',
        category: 'PENDIDIKAN_PANCASILA',
        subject: 'Pendidikan Pancasila',
        topic: 'Hak & Kewajiban Siswa dalam Musyawarah Kelas',
        misconceptionDetails: 'Siswa memprioritaskan penuntutan hak individu tanpa mengimbangi kewajiban mematuhi keputusan mufakat kelompok dan menghormati giliran bicara rekan kelas.',
        recommendedModuleId: 'MOD-REM-PP-01',
        suggestedRemedialStrategy: 'Simulasi sosiodrama roleplay sidang musyawarah kelas dan jurnal refleksi harian perilaku gotong royong.',
      },
    ];

    // Compute metrics and affected students dynamically
    const results: AssignmentErrorPattern[] = [];

    patternsRaw.forEach((pattern) => {
      if (subjectFilter && subjectFilter !== 'Semua' && pattern.subject !== subjectFilter) {
        return;
      }

      // Base error tendency per pattern
      const baseScores: Record<string, number> = {
        'ERR-NUM-001': 67,
        'ERR-NUM-002': 64,
        'ERR-LIT-001': 70,
        'ERR-IPAS-001': 68,
        'ERR-IPAS-002': 73,
        'ERR-PP-001': 74,
      };

      const baseScore = baseScores[pattern.id] || 70;
      const affectedList: AffectedStudentInfo[] = [];

      students.forEach((s) => {
        const score = getStudentScoreForTopic(s, pattern.id, baseScore);
        if (score < 75) {
          affectedList.push({
            id: s.id,
            nama: s.nama,
            score,
            nisn: s.nisn,
            kelas: s.kelas,
          });
        }
      });

      // Sort lowest score first
      affectedList.sort((a, b) => a.score - b.score);

      const totalStudents = students.length || 1;
      const errorRatePercent = Math.round((affectedList.length / totalStudents) * 100);

      let severity: 'TINGGI' | 'SEDANG' | 'RENDAH' = 'RENDAH';
      if (errorRatePercent >= 40 || affectedList.some((s) => s.score < 65)) {
        severity = 'TINGGI';
      } else if (errorRatePercent >= 25 || affectedList.length >= 2) {
        severity = 'SEDANG';
      }

      results.push({
        ...pattern,
        affectedStudents: affectedList,
        errorRatePercent,
        frequencyCount: affectedList.length,
        severity,
      });
    });

    // Sort by severity (TINGGI > SEDANG > RENDAH) then by error rate descending
    const severityRank = { TINGGI: 3, SEDANG: 2, RENDAH: 1 };
    return results.sort((a, b) => {
      if (severityRank[b.severity] !== severityRank[a.severity]) {
        return severityRank[b.severity] - severityRank[a.severity];
      }
      return b.errorRatePercent - a.errorRatePercent;
    });
  }

  public getSpecialInterventionStudents(kelas: string): SpecialInterventionStudent[] {
    this.initClassroom();
    const errorPatterns = this.getAssignmentErrorPatterns(kelas);

    // Map all affected students across error patterns
    const studentMap = new Map<
      string,
      {
        siswaId: string;
        siswaNama: string;
        nisn: string;
        kelas: string;
        scores: number[];
        criticalSubjectsSet: Set<string>;
        frequentErrorPatterns: string[];
      }
    >();

    errorPatterns.forEach((p) => {
      p.affectedStudents.forEach((aff) => {
        if (!studentMap.has(aff.id)) {
          studentMap.set(aff.id, {
            siswaId: aff.id,
            siswaNama: aff.nama,
            nisn: aff.nisn || '0018374921',
            kelas: aff.kelas || kelas,
            scores: [],
            criticalSubjectsSet: new Set<string>(),
            frequentErrorPatterns: [],
          });
        }
        const entry = studentMap.get(aff.id)!;
        entry.scores.push(aff.score);
        entry.criticalSubjectsSet.add(p.subject);
        entry.frequentErrorPatterns.push(p.topic);
      });
    });

    // Also check if any student has general class average < 75
    let rawAccounts: any[] = [];
    try {
      const raw = localStorage.getItem('BB_ACCOUNTS');
      if (raw) rawAccounts = JSON.parse(raw);
    } catch {
      // ignore
    }

    const assignedRecords = this.getItem<Record<string, { studentIds: string[]; assignedAt: string }>>(
      STORAGE_KEYS.ASSIGNED_REMEDIAL,
      {}
    );

    const interventionList: SpecialInterventionStudent[] = [];

    studentMap.forEach((entry) => {
      const avgScore =
        entry.scores.length > 0
          ? Math.round(entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length)
          : 68;

      const criticalSubjects = Array.from(entry.criticalSubjectsSet);

      // Determine assigned modules
      const assignedModuleIds: string[] = [];
      Object.entries(assignedRecords).forEach(([modId, rec]) => {
        if (rec.studentIds.includes(entry.siswaId)) {
          assignedModuleIds.push(modId);
        }
      });

      // Individual intervention strategy formulated based on subjects
      let interventionStrategy = 'Pendampingan tutor sebaya dan latihan terbimbing 15 menit per hari.';
      if (criticalSubjects.includes('Matematika') && criticalSubjects.includes('Bahasa Indonesia')) {
        interventionStrategy = 'Bimbingan intensif klinis membaca pemahaman soal cerita dan scaffolding numerasi dengan alat peraga visual.';
      } else if (criticalSubjects.includes('Matematika')) {
        interventionStrategy = 'Penguatan konsep nilai tempat dan drill soal bertingkat mulai dari level dasar berarsir.';
      } else if (criticalSubjects.includes('IPAS')) {
        interventionStrategy = 'Visualisasi konsep aliran energi sains melalui kartu gambar interaktif dan studi kasus lingkungan nyata.';
      }

      let status: 'PERLU_PENDAMPINGAN' | 'SEDANG_REMEDIAL' | 'TUNTAS_REMEDIAL' = 'PERLU_PENDAMPINGAN';
      if (assignedModuleIds.length > 0) {
        status = 'SEDANG_REMEDIAL';
      }

      interventionList.push({
        siswaId: entry.siswaId,
        siswaNama: entry.siswaNama,
        nisn: entry.nisn,
        kelas: entry.kelas,
        averageScore: avgScore,
        criticalSubjects,
        frequentErrorPatterns: entry.frequentErrorPatterns.slice(0, 3),
        interventionStrategy,
        assignedRemedialModuleIds: assignedModuleIds,
        status,
      });
    });

    // Sort lowest average score first
    return interventionList.sort((a, b) => a.averageScore - b.averageScore);
  }

  public assignRemedialModule(
    moduleId: string,
    studentIds: string[],
    kelas: string,
    notes?: string
  ): { success: boolean; message: string; moduleTitle: string } {
    this.initClassroom();
    const catalog = this.getRemedialModuleCatalog();
    const targetMod = catalog.find((m) => m.id === moduleId);
    const modTitle = targetMod ? targetMod.title : 'Modul Remedial';

    const assignedRecords = this.getItem<Record<string, { studentIds: string[]; assignedAt: string; notes?: string }>>(
      STORAGE_KEYS.ASSIGNED_REMEDIAL,
      {}
    );

    const existingStudents = assignedRecords[moduleId]?.studentIds || [];
    const combinedStudents = Array.from(new Set([...existingStudents, ...studentIds]));

    assignedRecords[moduleId] = {
      studentIds: combinedStudents,
      assignedAt: nowISO(),
      notes: notes || 'Ditugaskan melalui Sistem Analisis Pola Kesalahan',
    };

    this.setItem(STORAGE_KEYS.ASSIGNED_REMEDIAL, assignedRecords);

    // Register notification
    this.addNotification({
      KELAS: kelas,
      TITLE: `🎯 Modul Remedial Ditugaskan: ${modTitle}`,
      MESSAGE: `Guru telah menugaskan ${modTitle} (${targetMod?.subject || 'Akademik'}) kepada ${studentIds.length} siswa untuk penguatan kompetensi remedial.`,
      TYPE: 'SYSTEM',
      LINK_PAGE: 'analytics',
    });

    return {
      success: true,
      message: `Modul '${modTitle}' berhasil ditugaskan ke ${studentIds.length} siswa terpilih.`,
      moduleTitle: modTitle,
    };
  }

  // ==========================================
  // 15. STUDENT BEHAVIOR & CHARACTER NOTES SUBSYSTEM
  // ==========================================

  public getBehaviorLogs(kelas?: string, siswaId?: string): StudentBehaviorLog[] {
    this.initClassroom();
    let logs = this.getItem<StudentBehaviorLog[]>(STORAGE_KEYS.BEHAVIOR_LOGS, DEFAULT_BEHAVIOR_LOGS);
    if (!Array.isArray(logs) || logs.length === 0) {
      logs = DEFAULT_BEHAVIOR_LOGS;
    }

    if (kelas && kelas !== 'Semua' && kelas !== 'Semua Kelas') {
      const target = kelas.toLowerCase().trim();
      logs = logs.filter((l) => l.KELAS.toLowerCase().trim() === target || l.KELAS.toLowerCase().includes(target));
    }

    if (siswaId) {
      logs = logs.filter((l) => l.SISWA_ID === siswaId);
    }

    // Sort by latest date first
    return logs.sort((a, b) => new Date(b.TANGGAL || b.CREATED_AT).getTime() - new Date(a.TANGGAL || a.CREATED_AT).getTime());
  }

  public addBehaviorLog(data: Omit<StudentBehaviorLog, 'ID' | 'CREATED_AT'>): StudentBehaviorLog {
    this.initClassroom();
    const logs = this.getItem<StudentBehaviorLog[]>(STORAGE_KEYS.BEHAVIOR_LOGS, DEFAULT_BEHAVIOR_LOGS);
    const newLog: StudentBehaviorLog = {
      ...data,
      ID: `BEH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      CREATED_AT: nowISO(),
    };

    const updated = [newLog, ...logs];
    this.setItem(STORAGE_KEYS.BEHAVIOR_LOGS, updated);

    // If needing urgent attention, dispatch notification
    if (data.TIPE === 'PERLU_PERHATIAN') {
      this.addNotification({
        KELAS: data.KELAS,
        TITLE: `⚠️ Catatan Perhatian Karakter: ${data.SISWA_NAMA}`,
        MESSAGE: `Guru ${data.GURU_NAMA} mencatat perilaku '${data.JUDUL}' kategori ${data.KATEGORI}. Tindak lanjut: ${data.TINDAK_LANJUT || 'Bimbingan Wali Kelas'}.`,
        TYPE: 'SYSTEM',
        LINK_PAGE: 'students',
      });
    }

    return newLog;
  }

  public updateBehaviorLog(id: string, updates: Partial<StudentBehaviorLog>): boolean {
    this.initClassroom();
    const logs = this.getItem<StudentBehaviorLog[]>(STORAGE_KEYS.BEHAVIOR_LOGS, DEFAULT_BEHAVIOR_LOGS);
    const idx = logs.findIndex((l) => l.ID === id);
    if (idx === -1) return false;

    logs[idx] = { ...logs[idx], ...updates };
    this.setItem(STORAGE_KEYS.BEHAVIOR_LOGS, [...logs]);
    return true;
  }

  public deleteBehaviorLog(id: string): boolean {
    this.initClassroom();
    const logs = this.getItem<StudentBehaviorLog[]>(STORAGE_KEYS.BEHAVIOR_LOGS, DEFAULT_BEHAVIOR_LOGS);
    const filtered = logs.filter((l) => l.ID !== id);
    if (filtered.length === logs.length) return false;

    this.setItem(STORAGE_KEYS.BEHAVIOR_LOGS, filtered);
    return true;
  }

  public getBehaviorAnalysisInsights(kelas?: string): BehaviorAnalysisInsight {
    const logs = this.getBehaviorLogs(kelas);

    const positiveLogs = logs.filter((l) => l.TIPE === 'POSITIF');
    const needsAttentionLogs = logs.filter((l) => l.TIPE === 'PERLU_PERHATIAN');

    const totalLogs = logs.length;
    const positiveCount = positiveLogs.length;
    const needsAttentionCount = needsAttentionLogs.length;
    const positiveRatio = totalLogs > 0 ? Math.round((positiveCount / totalLogs) * 100) : 0;

    // Grouping by student for positive highlights
    const studentPositiveMap = new Map<string, {
      siswaId: string;
      siswaNama: string;
      kelas: string;
      count: number;
      totalScore: number;
      categories: Set<BehaviorCategory>;
      recentHighlight: string;
    }>();

    positiveLogs.forEach((l) => {
      const existing = studentPositiveMap.get(l.SISWA_ID) || {
        siswaId: l.SISWA_ID,
        siswaNama: l.SISWA_NAMA,
        kelas: l.KELAS,
        count: 0,
        totalScore: 0,
        categories: new Set<BehaviorCategory>(),
        recentHighlight: l.JUDUL,
      };
      existing.count += 1;
      existing.totalScore += Math.abs(l.POIN || 10);
      existing.categories.add(l.KATEGORI);
      studentPositiveMap.set(l.SISWA_ID, existing);
    });

    const topPositiveStudents = Array.from(studentPositiveMap.values())
      .map((item) => {
        const badges: string[] = [];
        if (item.categories.has('KEDISIPLINAN')) badges.push('⭐ Bintang Disiplin');
        if (item.categories.has('GOTONG_ROYONG')) badges.push('🤝 Teladan Gotong Royong');
        if (item.categories.has('KEJUJURAN')) badges.push('🛡️ Ksatria Kejujuran');
        if (item.categories.has('TANGGUNG_JAWAB')) badges.push('🎯 Mandat Tanggung Jawab');
        if (item.categories.has('KEPEMIMPINAN')) badges.push('👑 Pemimpin Cilik');
        if (item.categories.has('KEMANDIRIAN')) badges.push('💡 Inspirasi Mandiri');
        if (badges.length === 0) badges.push('✨ Karakter Terpuji');

        return {
          siswaId: item.siswaId,
          siswaNama: item.siswaNama,
          kelas: item.kelas,
          positiveCount: item.count,
          totalScore: item.totalScore,
          badges,
          recentHighlight: item.recentHighlight,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 8);

    // Grouping by student for needs attention
    const studentAttentionMap = new Map<string, {
      siswaId: string;
      siswaNama: string;
      kelas: string;
      count: number;
      categories: Set<BehaviorCategory>;
      lastLogDate: string;
      lastNote: string;
    }>();

    needsAttentionLogs.forEach((l) => {
      const existing = studentAttentionMap.get(l.SISWA_ID) || {
        siswaId: l.SISWA_ID,
        siswaNama: l.SISWA_NAMA,
        kelas: l.KELAS,
        count: 0,
        categories: new Set<BehaviorCategory>(),
        lastLogDate: l.TANGGAL,
        lastNote: l.CATATAN || l.JUDUL,
      };
      existing.count += 1;
      existing.categories.add(l.KATEGORI);
      if (new Date(l.TANGGAL).getTime() > new Date(existing.lastLogDate).getTime()) {
        existing.lastLogDate = l.TANGGAL;
        existing.lastNote = l.CATATAN || l.JUDUL;
      }
      studentAttentionMap.set(l.SISWA_ID, existing);
    });

    const studentsNeedingAttention = Array.from(studentAttentionMap.values())
      .map((item) => {
        const criticalCategories = Array.from(item.categories);
        let urgency: 'TINGGI' | 'SEDANG' | 'RINGAN' = 'RINGAN';
        let recommendedAction = 'Pendampingan wajar saat kegiatan belajar di kelas';

        if (item.count >= 2 || criticalCategories.includes('KEDISIPLINAN')) {
          urgency = 'TINGGI';
          recommendedAction = 'Konseling individual Wali Kelas & komunikasi dengan orang tua murid';
        } else if (item.count === 1) {
          urgency = 'SEDANG';
          recommendedAction = 'Observasi berkala dan penempatan teman sebaya sebagai tutor motivasi';
        }

        return {
          siswaId: item.siswaId,
          siswaNama: item.siswaNama,
          kelas: item.kelas,
          attentionCount: item.count,
          criticalCategories,
          urgency,
          recommendedAction,
          lastLogDate: item.lastLogDate,
        };
      })
      .sort((a, b) => b.attentionCount - a.attentionCount)
      .slice(0, 8);

    // Category breakdown
    const categories: Array<{ category: BehaviorCategory; label: string }> = [
      { category: 'KEDISIPLINAN', label: 'Kedisiplinan & Waktu' },
      { category: 'GOTONG_ROYONG', label: 'Gotong Royong & Kerja Sama' },
      { category: 'KEJUJURAN', label: 'Kejujuran & Integritas' },
      { category: 'TANGGUNG_JAWAB', label: 'Tanggung Jawab Belajar' },
      { category: 'KESANTUNAN', label: 'Kesantunan & Adab' },
      { category: 'KEMANDIRIAN', label: 'Kemandirian & Inisiatif' },
      { category: 'KEPEMIMPINAN', label: 'Kepemimpinan Sebaya' },
    ];

    const categoryBreakdown = categories.map(({ category, label }) => {
      const pos = positiveLogs.filter((l) => l.KATEGORI === category).length;
      const att = needsAttentionLogs.filter((l) => l.KATEGORI === category).length;
      return {
        category,
        label,
        positive: pos,
        needsAttention: att,
        total: pos + att,
      };
    });

    // Weekly trends (last 4 weeks)
    const now = Date.now();
    const weeklyTrends = [3, 2, 1, 0].map((weekOffset) => {
      const endMs = now - weekOffset * 7 * 24 * 60 * 60 * 1000;
      const startMs = endMs - 7 * 24 * 60 * 60 * 1000;
      const label = weekOffset === 0 ? 'Minggu Ini' : `${weekOffset} Mgg Lalu`;

      const wPositive = positiveLogs.filter((l) => {
        const t = new Date(l.TANGGAL || l.CREATED_AT).getTime();
        return t >= startMs && t <= endMs;
      }).length;

      const wAttention = needsAttentionLogs.filter((l) => {
        const t = new Date(l.TANGGAL || l.CREATED_AT).getTime();
        return t >= startMs && t <= endMs;
      }).length;

      return {
        weekLabel: label,
        positive: wPositive,
        needsAttention: wAttention,
      };
    });

    return {
      totalLogs,
      positiveCount,
      needsAttentionCount,
      positiveRatio,
      topPositiveStudents,
      studentsNeedingAttention,
      categoryBreakdown,
      weeklyTrends,
    };
  }

  // ==========================================
  // 16. COMPREHENSIVE INDIVIDUAL STUDENT REPORT
  // ==========================================

  public getStudentComprehensiveReportData(
    siswaId: string,
    customTeacherNotes?: string
  ): ComprehensiveStudentReportData {
    this.initClassroom();

    // 1. Find student
    let studentName = 'Peserta Didik';
    let studentNis = siswaId;
    let studentNisn = '3150' + Math.floor(100000 + Math.random() * 900000);
    let studentClass = 'Kelas 4B';

    try {
      const accs = localStorage.getItem('BB_ACCOUNTS');
      if (accs) {
        const parsed = JSON.parse(accs);
        const match = Array.isArray(parsed) ? parsed.find((a: any) => a.ID === siswaId) : null;
        if (match) {
          studentName = match.NAMA;
          studentClass = match.KELAS || studentClass;
          studentNis = match.NIP || match.ID;
          if (match.NISN) studentNisn = match.NISN;
        }
      }
    } catch {}

    // 2. Fetch basic card & attendance
    const basicCard = this.getStudentReportCard(siswaId, studentName, studentClass);
    const attendanceStats = this.getStudentAttendanceStats(siswaId, studentClass);

    // 3. Fetch character logs for this student
    const studentLogs = this.getBehaviorLogs(undefined, siswaId);
    const positiveLogs = studentLogs.filter((l) => l.TIPE === 'POSITIF');
    const attentionLogs = studentLogs.filter((l) => l.TIPE === 'PERLU_PERHATIAN');

    const positiveNotes = positiveLogs.slice(0, 3).map((l) => `[${l.KATEGORI}] ${l.JUDUL} - ${l.CATATAN}`);
    const needsAttentionNotes = attentionLogs.slice(0, 2).map((l) => `[${l.KATEGORI}] ${l.JUDUL} (${l.TINDAK_LANJUT || 'Bimbingan kelas'})`);

    const characterBadges: string[] = [];
    if (positiveLogs.some((l) => l.KATEGORI === 'KEDISIPLINAN')) characterBadges.push('⭐ Bintang Disiplin');
    if (positiveLogs.some((l) => l.KATEGORI === 'GOTONG_ROYONG')) characterBadges.push('🤝 Gotong Royong');
    if (positiveLogs.some((l) => l.KATEGORI === 'KEJUJURAN')) characterBadges.push('🛡️ Integritas Tinggi');
    if (positiveLogs.some((l) => l.KATEGORI === 'TANGGUNG_JAWAB')) characterBadges.push('🎯 Mandat Tanggung Jawab');
    if (positiveLogs.some((l) => l.KATEGORI === 'KEMANDIRIAN')) characterBadges.push('💡 Kemandirian Belajar');
    if (characterBadges.length === 0) characterBadges.push('✨ Berakhlak Mulia');

    const overallCharacterGrade: 'SANGAT_BAIK' | 'BAIK' | 'CUKUP' =
      positiveLogs.length >= 3 && attentionLogs.length === 0
        ? 'SANGAT_BAIK'
        : attentionLogs.length >= 2
        ? 'CUKUP'
        : 'BAIK';

    // 4. Subject Grades breakdown
    const subjectGrades: ComprehensiveStudentSubjectGrade[] = [
      {
        no: 1,
        mapel: 'Pendidikan Pancasila & Kewarganegaraan',
        kkm: 78,
        tugas: basicCard.nilaiTugas,
        kuis: basicCard.nilaiKuis,
        nilaiAkhir: basicCard.nilaiAkhir,
        predikat: basicCard.predikat,
        deskripsi: 'Sangat baik dalam memahami hak, kewajiban, musyawarah mufakat, dan penerapan Profil Pelajar Pancasila.',
        status: basicCard.nilaiAkhir >= 78 ? 'TUNTAS' : 'BELUM_TUNTAS',
      },
      {
        no: 2,
        mapel: 'Bahasa Indonesia (Literasi & Komunikasi)',
        kkm: 78,
        tugas: basicCard.nilaiTugas,
        kuis: Math.min(100, basicCard.nilaiKuis + 2),
        nilaiAkhir: Math.round((basicCard.nilaiTugas + basicCard.nilaiKuis) / 2),
        predikat: basicCard.predikat,
        deskripsi: 'Mampu menemukan gagasan pokok teks narasi, menyusun ringkasan, dan berbicara secara santun di depan kelas.',
        status: (basicCard.nilaiTugas + basicCard.nilaiKuis) / 2 >= 78 ? 'TUNTAS' : 'BELUM_TUNTAS',
      },
      {
        no: 3,
        mapel: 'Matematika & Numerasi Gasing',
        kkm: 75,
        tugas: Math.max(65, basicCard.nilaiTugas - 4),
        kuis: basicCard.nilaiKuis,
        nilaiAkhir: Math.round(basicCard.nilaiTugas * 0.4 + basicCard.nilaiKuis * 0.6),
        predikat: basicCard.predikat,
        deskripsi: 'Terampil melakukan operasi hitung penjumlahan bersusun, perkalian dasar, dan pemecahan soal cerita kontekstual.',
        status: (basicCard.nilaiTugas * 0.4 + basicCard.nilaiKuis * 0.6) >= 75 ? 'TUNTAS' : 'BELUM_TUNTAS',
      },
      {
        no: 4,
        mapel: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
        kkm: 75,
        tugas: basicCard.nilaiTugas,
        kuis: Math.max(68, basicCard.nilaiKuis - 2),
        nilaiAkhir: Math.max(70, basicCard.nilaiAkhir - 1),
        predikat: basicCard.predikat === 'A' ? 'B' : basicCard.predikat,
        deskripsi: 'Memahami siklus hidup makhluk hidup, konservasi air dan keanekaragaman hayati lingkungan Kota Tangerang.',
        status: basicCard.nilaiAkhir - 1 >= 75 ? 'TUNTAS' : 'BELUM_TUNTAS',
      },
      {
        no: 5,
        mapel: 'Koding & Literasi Digital Kurikulum SD',
        kkm: 75,
        tugas: Math.min(100, basicCard.nilaiTugas + 6),
        kuis: Math.min(100, basicCard.nilaiKuis + 4),
        nilaiAkhir: Math.min(100, basicCard.nilaiAkhir + 5),
        predikat: 'A',
        deskripsi: 'Sangat antusias mengoperasikan modul koding visual Scratch, pengerjaan kuis CBT mandiri, dan literasi internet aman.',
        status: 'TUNTAS',
      },
      {
        no: 6,
        mapel: 'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)',
        kkm: 80,
        tugas: Math.min(95, basicCard.nilaiTugas + 3),
        kuis: 85,
        nilaiAkhir: 86,
        predikat: 'B',
        deskripsi: 'Menunjukkan kebugaran jasmani, sportivitas tim dalam permainan bola kecil (kasti), dan menjaga kebersihan diri.',
        status: 'TUNTAS',
      },
      {
        no: 7,
        mapel: 'Seni Budaya & Prakarya (P5)',
        kkm: 80,
        tugas: 88,
        kuis: 84,
        nilaiAkhir: 86,
        predikat: 'B',
        deskripsi: 'Kreatif dalam membuat karya kearifan lokal jajanan sehat Tangerang dan aktif bekerja sama dalam kelompok.',
        status: 'TUNTAS',
      },
    ];

    const defaultNotes =
      customTeacherNotes ||
      `Ananda ${studentName} menunjukkan perkembangan belajar yang konsisten dan aktif berpartisipasi di kelas ${studentClass}. Presensi ${attendanceStats.percentage}% dengan ketuntasan KKM tercapai. Mohon dukungan orang tua di rumah untuk terus mendampingi literasi dan karakter mandiri.`;

    return {
      siswaId,
      siswaNama: studentName,
      nisn: studentNisn,
      nip: studentNis,
      kelas: studentClass,
      semester: 'Ganjil',
      tahunPelajaran: '2026/2027',
      nilaiTugas: basicCard.nilaiTugas,
      nilaiKuis: basicCard.nilaiKuis,
      presensiPct: basicCard.presensiPct,
      nilaiAkhir: basicCard.nilaiAkhir,
      predikat: basicCard.predikat,
      kkmStatus: basicCard.nilaiAkhir >= 75 ? 'TUNTAS (>= 75)' : 'BELUM TUNTAS (< 75)',
      teacherNotes: defaultNotes,
      attendanceBreakdown: {
        hadir: attendanceStats.hadir,
        sakit: attendanceStats.sakit,
        izin: attendanceStats.izin,
        alpa: attendanceStats.alpa,
        totalHari: attendanceStats.total,
      },
      subjectGrades,
      behaviorHighlights: {
        positiveNotes: positiveNotes.length > 0 ? positiveNotes : ['Sopan santun dan disiplin mengikuti proses pembelajaran harian.'],
        needsAttentionNotes: needsAttentionNotes.length > 0 ? needsAttentionNotes : ['Tidak ada catatan pelanggaran khusus (perilaku tertib & kondusif).'],
        characterBadges,
        overallCharacterGrade,
      },
    };
  }
}

// Curated default remedial modules for SD Negeri Tangerang 6
export const DEFAULT_REMEDIAL_MODULES: RemedialModule[] = [
  {
    id: 'MOD-REM-NUM-01',
    title: 'Modul Scaffolding: Nilai Tempat & Penjumlahan Bersusun Teknik Menyimpan',
    subject: 'Matematika',
    category: 'NUMERASI',
    targetCompetency: 'Peserta didik mampu menganalisis nilai tempat ratusan, puluhan, satuan serta melakukan operasi penjumlahan bilangan tiga angka dengan teknik menyimpan tanpa kekeliruan.',
    format: 'LKPD',
    difficulty: 'DASAR',
    estimatedMinutes: 30,
    contentOutline: [
      '1. Review Konsep Nilai Tempat (Ratusan, Puluhan, Satuan) menggunakan Blok Dienes',
      '2. Simulasi Interaktif: Kapan angka 10 harus berpindah ke kolom puluhan',
      '3. Panduan Langkah Demi Langkah Penjumlahan Bersusun',
      '4. Latihan Terbimbing Bergradasi (Tingkat 1 s/d 3)',
    ],
    guideSteps: [
      'Langkah 1: Selalu tuliskan bilangan lurus vertikal sejajar sesuai nilai tempatnya (satuan lurus satuan, puluhan lurus puluhan).',
      'Langkah 2: Mulai menjumlahkan dari kolom PALING KANAN (satuan).',
      'Langkah 3: Jika hasil penjumlahan satuan >= 10, tulis digit satuan di bawah dan letakkan angka 1 kecil (simpanan) di atas kolom puluhan.',
      'Langkah 4: Jangan lupa menjumlahkan angka simpanan saat menghitung kolom puluhan.',
    ],
    practiceQuestions: [
      {
        question: 'Hitunglah penjumlahan bersusun berikut: 247 + 138 = ...',
        hint: 'Perhatikan 7 + 8 = 15. Tulis 5 di satuan, simpan 1 di atas angka 4 puluhan.',
        answerKey: '385 (7+8=15 simpan 1; 1+4+3=8; 2+1=3)',
      },
      {
        question: 'Sebuah perpustakaan memiliki 365 buku cerita dan menerima kiriman 187 buku baru. Berapakah total buku sekarang?',
        hint: 'Operasi: 365 + 187. Lakukan penjumlahan bersusun dengan teknik menyimpan di kolom satuan dan puluhan.',
        answerKey: '552 buku cerita',
      },
      {
        question: 'Manakah dari pernyataan berikut yang benar mengenai bilangan 482?',
        hint: 'Ingat urutan nilai tempat: Angka paling kiri adalah ratusan, tengah adalah puluhan, kanan adalah satuan.',
        answerKey: 'Angka 4 bernilai 400 (ratusan), 8 bernilai 80 (puluhan), 2 bernilai 2 (satuan).',
      },
    ],
  },
  {
    id: 'MOD-REM-NUM-02',
    title: 'Modul Visual Konkret: Pecahan Senilai & Perbandingan Pembilang-Penyebut',
    subject: 'Matematika',
    category: 'NUMERASI',
    targetCompetency: 'Peserta didik mampu memvisualisasikan representasi pecahan 1/2, 1/4, 2/4, 3/4 serta membandingkan nilai pecahan tanpa miskonsepsi besaran penyebut.',
    format: 'INTERAKTIF',
    difficulty: 'MENENGAH',
    estimatedMinutes: 35,
    contentOutline: [
      '1. Pemahaman Konseptual: Pembilang (bagian yang diambil) vs Penyebut (total bagian utuh)',
      '2. Miskonsepsi Umum: Mengapa 1/4 lebih kecil dari 1/2 meski angka 4 lebih besar dari 2',
      '3. Eksplorasi Diagram Pizza dan Batang Pecahan Senilai (1/2 = 2/4 = 4/8)',
      '4. Menyelesaikan Masalah Kontekstual Pembagian Makanan & Buah',
    ],
    guideSteps: [
      'Langkah 1: Bayangkan sepotong kue. Semakin banyak kue dipotong (penyebut makin besar), ukuran tiap potongan justru makin KECIL.',
      'Langkah 2: Gunakan garis bilangan pecahan untuk meletakkan titik pecahan antara 0 dan 1.',
      'Langkah 3: Untuk menyamakan pecahan senilai, kalikan pembilang dan penyebut dengan angka yang sama.',
    ],
    practiceQuestions: [
      {
        question: 'Budi memiliki 1/2 bagian cokelat, sedangkan Doni memiliki 2/4 bagian cokelat dengan ukuran yang sama. Siapakah yang memiliki cokelat lebih banyak?',
        hint: 'Coba sederhanakan 2/4 dengan membagi pembilang dan penyebut dengan 2.',
        answerKey: 'Sama banyak, karena 1/2 dan 2/4 adalah pecahan senilai (1/2 = 2/4).',
      },
      {
        question: 'Urutkan pecahan berikut dari yang nilainya PALING KECIL ke PALING BESAR: 1/2, 1/8, 1/4',
        hint: 'Jika pembilang sama-sama 1, maka pecahan dengan penyebut terbesar bernilai paling kecil.',
        answerKey: '1/8, kemudian 1/4, lalu 1/2.',
      },
    ],
  },
  {
    id: 'MOD-REM-LIT-01',
    title: 'Modul Remedial Literasi: Menentukan Kalimat Utama & Inferensi Ide Pokok Paragraf Naratif',
    subject: 'Bahasa Indonesia',
    category: 'LITERASI',
    targetCompetency: 'Peserta didik mampu menemukan gagasan pokok pada paragraf deduktif, induktif, maupun campuran, serta membuat simpulan logis dari teks narasi pendek.',
    format: 'BACAAN',
    difficulty: 'DASAR',
    estimatedMinutes: 25,
    contentOutline: [
      '1. Perbedaan Kalimat Utama (Gagasan Pokok) vs Kalimat Penjelas (Gagasan Pendukung)',
      '2. Cara Mendeteksi Posisi Kalimat Utama (Awal Paragraf, Akhir Paragraf, atau Campuran)',
      '3. Membaca Terpandu Teks Cerita Rakyat Banten',
      '4. Merumuskan Simpulan Bacaan Menggunakan Rumus 5W1H Sederhana',
    ],
    guideSteps: [
      'Langkah 1: Baca paragraf secara utuh dari awal sampai akhir tanpa tergesa-gesa.',
      'Langkah 2: Tanyakan pada diri sendiri: "Tentang apa atau siapa hal penting yang sedang dibahas paragraf ini?"',
      'Langkah 3: Cari kalimat yang sifatnya paling UMUM dan memayungi kalimat-kalimat lain.',
      'Langkah 4: Kalimat penjelas biasanya memuat contoh, ciri-ciri, rincian, atau alasan.',
    ],
    practiceQuestions: [
      {
        question: 'Tentukan gagasan pokok dari paragraf berikut: "Sungai Cisadane memiliki peranan vital bagi warga Kota Tangerang. Aliran airnya dimanfaatkan sebagai sumber air bersih PDAM, jalur irigasi pertanian, dan ruang rekreasi keluarga. Di samping itu, keasrian sungai ini terus dijaga melalui program festival tahunan."',
        hint: 'Perhatikan kalimat mana yang menjadi inti bahasan yang kemudian dijelaskan oleh rincian manfaat berikutnya.',
        answerKey: 'Gagasan Pokok: Peranan vital Sungai Cisadane bagi warga Kota Tangerang (terletak pada kalimat pertama / paragraf deduktif).',
      },
    ],
  },
  {
    id: 'MOD-REM-IPAS-01',
    title: 'Modul Diagnostik IPAS: Jaring-Jaring Makanan & Peran Dekomposer Ekosistem',
    subject: 'IPAS',
    category: 'IPAS_SAINS',
    targetCompetency: 'Peserta didik mampu menguraikan hubungan saling ketergantungan antarmakhluk hidup dalam rantai dan jaring-jaring makanan ekosistem darat serta menganalisis dampak kepunahan suatu organisme.',
    format: 'LATIHAN_BERTINGKAT',
    difficulty: 'MENENGAH',
    estimatedMinutes: 30,
    contentOutline: [
      '1. Tingkatan Trofik: Produsen (Tumbuhan Hijau), Konsumen I (Herbivora), Konsumen II/III (Karnivora)',
      '2. Peran Penting Pengurai (Dekomposer seperti Jamur & Bakteri) yang Mengembalikan Nutrisi ke Tanah',
      '3. Perbedaan Rantai Makanan Tunggal vs Jaring-Jaring Makanan Kompleks',
      '4. Analisis Sebab-Akibat: Apa yang terjadi jika populasi ular sawah diburu habis?',
    ],
    guideSteps: [
      'Langkah 1: Selalu awali rantai makanan dengan PRODUSEN (makhluk hidup yang mampu berfotosintesis).',
      'Langkah 2: Tanda panah (->) berarti "DIMAKAN OLEH", bukan "memakan". Arah panah menunjukkan arah aliran energi.',
      'Langkah 3: Pahami bahwa hilangnya satu jenis konsumen dapat menyebabkan ledakan populasi mangsanya dan penurunan populasi predatornya.',
    ],
    practiceQuestions: [
      {
        question: 'Perhatikan rantai makanan sawah: Padi -> Tikus -> Ular -> Burung Elang. Jika petani membasmi semua ular di sawah, apakah dampak langsung yang akan terjadi?',
        hint: 'Perhatikan organisme sebelum ular (tikus) dan organisme sesudah ular (elang).',
        answerKey: 'Populasi tikus akan melonjak tajam karena tidak ada pemangsa, sehingga merusak tanaman padi milik petani; sedangkan populasi elang akan kekurangan makanan.',
      },
    ],
  },
  {
    id: 'MOD-REM-IPAS-02',
    title: 'Modul Siklus Alam: Daur Air (Evaporasi, Kondensasi, Presipitasi) & Konservasi Air Bersih',
    subject: 'IPAS',
    category: 'IPAS_SAINS',
    targetCompetency: 'Peserta didik mampu mengidentifikasi urutan siklus air di bumi dan mengaitkan fungsi daerah resapan air dengan pencegahan banjir di lingkungan sekitar.',
    format: 'LKPD',
    difficulty: 'DASAR',
    estimatedMinutes: 30,
    contentOutline: [
      '1. Mengapa Air di Bumi Tidak Pernah Habis? Konsep Siklus Air Berkelanjutan',
      '2. Istilah Sains Siklus Air: Evaporasi, Transpirasi, Kondensasi, Presipitasi, dan Infiltrasi',
      '3. Fungsi Hutan dan Daerah Resapan Air (Infiltrasi Air Tanah)',
      '4. Tindakan Sederhana Siswa: Membuat Biopori dan Menghemat Air di Rumah',
    ],
    guideSteps: [
      'Langkah 1: Hubungkan istilah dengan bahasa sehari-hari: Evaporasi = Penguapan air oleh panas matahari; Kondensasi = Pembentukan awan titik air; Presipitasi = Hujan turun.',
      'Langkah 2: Ingat bahwa tumbuhan juga menguapkan air melalui daun yang disebut proses Transpirasi.',
      'Langkah 3: Air hujan yang diserap tanah disebut Infiltrasi. Jika tanah tertutup semen tanpa pori resapan, air akan meluap menjadi genangan/banjir.',
    ],
    practiceQuestions: [
      {
        question: 'Ketika udara dingin di atmosfer menyebabkan uap air berubah menjadi titik-titik air kecil yang berkumpul membentuk awan, proses ini disebut...',
        hint: 'Ingat proses pembentukan embun di pagi hari atau dinding gelas es yang basah.',
        answerKey: 'Kondensasi (Pengembunan).',
      },
    ],
  },
  {
    id: 'MOD-REM-PP-01',
    title: 'Modul Karakter Pancasila: Hak & Kewajiban Siswa dalam Musyawarah Mufakat Kelas',
    subject: 'Pendidikan Pancasila',
    category: 'PENDIDIKAN_PANCASILA',
    targetCompetency: 'Peserta didik mampu memahami dan menerapkan nilai-nilai Sila Keempat Pancasila melalui praktik musyawarah mufakat, menghargai keberagaman pendapat, serta melaksanakan hasil mufakat dengan ikhlas dan tanggung jawab.',
    format: 'SCAFFOLDING',
    difficulty: 'DASAR',
    estimatedMinutes: 20,
    contentOutline: [
      '1. Arti Musyawarah Mufakat: Kebersamaan Mengambil Keputusan Terbaik',
      '2. Hak Setiap Siswa: Menyampaikan Pendapat secara Sopan Tanpa Memotong Pembicaraan',
      '3. Kewajiban Bersama: Menerima dan Melaksanakan Keputusan dengan Rasa Tanggung Jawab',
      '4. Studi Kasus Pemilihan Ketua Regu Piket Kebersihan Kelas',
    ],
    guideSteps: [
      'Langkah 1: Angkat tangan terlebih dahulu sebelum berbicara saat musyawarah kelas.',
      'Langkah 2: Gunakan kata-kata yang santun saat menyampaikan gagasan atau ketidaksetujuan.',
      'Langkah 3: Apabila keputusan bersama sudah disepakati, semua anggota wajib melaksanakannya meskipun pendapat pribadinya tidak terpilih.',
    ],
    practiceQuestions: [
      {
        question: 'Dalam musyawarah penentuan tempat tujuan kegiatan luar kelas, usulan Andi tidak terpilih karena sebagian besar teman memilih usulan Budi. Sikap terbaik yang harus ditunjukkan Andi adalah...',
        hint: 'Pikirkan tentang nilai kebesaran hati dan tanggung jawab bersama dalam Sila Ke-4 Pancasila.',
        answerKey: 'Menerima keputusan bersama dengan lapang dada dan tetap berpartisipasi aktif serta mendukung penuh rencana yang telah disepakati.',
      },
    ],
  },
  {
    id: 'MOD-REM-PJOK-01',
    title: 'Modul Penguatan Teori: Variasi Pola Gerak Dasar Lokomotor, Non-Lokomotor & Manipulatif',
    subject: 'PJOK',
    category: 'PJOK',
    targetCompetency: 'Peserta didik mampu membedakan dan mencontohkan pola gerak dasar lokomotor (berpindah tempat), non-lokomotor (di tempat), dan manipulatif (menggunakan alat/bola) dalam aktivitas olahraga harian.',
    format: 'LKPD',
    difficulty: 'DASAR',
    estimatedMinutes: 20,
    contentOutline: [
      '1. Definisi Gerak Lokomotor vs Non-Lokomotor vs Manipulatif',
      '2. Contoh Gerak dalam Permainan Kasti dan Sepak Bola Mini',
      '3. Manfaat Pemanasan dan Pendinginan untuk Mencegah Cedera Otot',
    ],
    guideSteps: [
      'Kunci Ingat: Lokomotor = Ada perpindahan badan (berlari, melompat, meluncur); Non-lokomotor = Badan tetap di tempat (meliuk, menekuk lutut, memutar lengan); Manipulatif = Memegang benda (melempar bola, menendang bola, menangkap kasti).',
    ],
    practiceQuestions: [
      {
        question: 'Saat bermain kasti, gerakan Budi berlari dari pos satu ke pos dua termasuk gerak ..., sedangkan gerakan melempar bola ke pemukul termasuk gerak ...',
        hint: 'Perhatikan apakah ada perpindahan tempat atau menggunakan bola.',
        answerKey: 'Berlari = Gerak Lokomotor; Melempar bola = Gerak Manipulatif.',
      },
    ],
  },
];

// Curated default student behavior / character logs for SD Negeri Tangerang 6
export const DEFAULT_BEHAVIOR_LOGS: StudentBehaviorLog[] = [
  {
    ID: 'BEH-001',
    SISWA_ID: 'SISWA-0002',
    SISWA_NAMA: 'ABDUL RAZZAAQ ALFATTAAH',
    NISN: '3166012414',
    KELAS: 'Kelas 4B',
    TANGGAL: '2026-10-28',
    KATEGORI: 'GOTONG_ROYONG',
    TIPE: 'POSITIF',
    POIN: 15,
    JUDUL: 'Inisiatif Membantu Teman saat Praktik P5',
    CATATAN: 'Secara sukarela membantu membagikan bahan kerajinan jajanan pasar dan merapikan meja kerja kelompok setelah jam istirahat.',
    GURU_ID: 'GURU-001',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    TINDAK_LANJUT: 'Apresiasi di depan kelas dan pemberian Bintang Karakter Gotong Royong',
    STATUS_TINDAK_LANJUT: 'SELESAI',
    CREATED_AT: '2026-10-28T09:30:00.000Z',
  },
  {
    ID: 'BEH-002',
    SISWA_ID: 'SISWA-0002',
    SISWA_NAMA: 'ABDUL RAZZAAQ ALFATTAAH',
    NISN: '3166012414',
    KELAS: 'Kelas 4B',
    TANGGAL: '2026-11-01',
    KATEGORI: 'KEDISIPLINAN',
    TIPE: 'POSITIF',
    POIN: 10,
    JUDUL: 'Disiplin Waktu & Mengumpulkan Tugas Tepat Jadwal',
    CATATAN: 'Konsisten hadir tepat pukul 06.45 WIB dan menjadi siswa pertama yang mengumpulkan LKPD Matematika Gasing secara rapi.',
    GURU_ID: 'GURU-001',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    TINDAK_LANJUT: 'Pencatatan poin prestasi karakter disiplin',
    STATUS_TINDAK_LANJUT: 'SELESAI',
    CREATED_AT: '2026-11-01T07:15:00.000Z',
  },
  {
    ID: 'BEH-003',
    SISWA_ID: 'SISWA-0001',
    SISWA_NAMA: 'ABDILLAH PUTRA YAMA',
    NISN: '3150148820',
    KELAS: 'Kelas 5A',
    TANGGAL: '2026-10-29',
    KATEGORI: 'KEJUJURAN',
    TIPE: 'POSITIF',
    POIN: 20,
    JUDUL: 'Integritas Tinggi Mengembalikan Barang Teman',
    CATATAN: 'Menemukan kotak pensil dan uang saku milik teman di perpustakaan lalu segera menyerahkannya ke meja piket guru.',
    GURU_ID: 'GURU-002',
    GURU_NAMA: 'Siti Rahmawati, M.Pd.',
    TINDAK_LANJUT: 'Pengumuman teladan kejujuran pada upacara bendera hari Senin',
    STATUS_TINDAK_LANJUT: 'SELESAI',
    CREATED_AT: '2026-10-29T10:45:00.000Z',
  },
  {
    ID: 'BEH-004',
    SISWA_ID: 'SISWA-0003',
    SISWA_NAMA: 'DIMAS PRASETYA',
    NISN: '3160451123',
    KELAS: 'Kelas 4B',
    TANGGAL: '2026-11-02',
    KATEGORI: 'KEDISIPLINAN',
    TIPE: 'PERLU_PERHATIAN',
    POIN: -5,
    JUDUL: 'Terlambat Masuk Kelas & Lupa Membawa Buku Modul',
    CATATAN: 'Datang terlambat 20 menit saat jam pertama dimulai dan tidak membawa buku tulis catatan IPAS selama 2 hari berturut-turut.',
    GURU_ID: 'GURU-001',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    TINDAK_LANJUT: 'Bimbingan konseling wali kelas & pengingat jadwal malam melalui buku penghubung orang tua',
    STATUS_TINDAK_LANJUT: 'DALAM_PANTAUAN',
    CREATED_AT: '2026-11-02T07:35:00.000Z',
  },
  {
    ID: 'BEH-005',
    SISWA_ID: 'SISWA-0003',
    SISWA_NAMA: 'DIMAS PRASETYA',
    NISN: '3160451123',
    KELAS: 'Kelas 4B',
    TANGGAL: '2026-10-25',
    KATEGORI: 'TANGGUNG_JAWAB',
    TIPE: 'PERLU_PERHATIAN',
    POIN: -5,
    JUDUL: 'Kurang Fokus saat Diskusi Kelompok Numerasi',
    CATATAN: 'Meninggalkan meja kelompok tanpa izin untuk mengobrol dengan teman di kelompok lain saat pengerjaan soal cerita.',
    GURU_ID: 'GURU-001',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    TINDAK_LANJUT: 'Penempatan posisi duduk di barisan depan dekat meja guru untuk pendampingan fokus',
    STATUS_TINDAK_LANJUT: 'DALAM_PANTAUAN',
    CREATED_AT: '2026-10-25T11:00:00.000Z',
  },
  {
    ID: 'BEH-006',
    SISWA_ID: 'SISWA-0004',
    SISWA_NAMA: 'SITI AISYAH NURUL',
    NISN: '3160458891',
    KELAS: 'Kelas 4B',
    TANGGAL: '2026-11-01',
    KATEGORI: 'KEPEMIMPINAN',
    TIPE: 'POSITIF',
    POIN: 15,
    JUDUL: 'Tutor Sebaya Hebat dalam Literasi Membaca',
    CATATAN: 'Membimbing teman sebangku yang mengalami kesulitan mengeja kosakata sulit pada modul Bahasa Indonesia dengan sangat sabar.',
    GURU_ID: 'GURU-001',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    TINDAK_LANJUT: 'Diangkat sebagai Duta Baca Rombel Kelas 4B',
    STATUS_TINDAK_LANJUT: 'SELESAI',
    CREATED_AT: '2026-11-01T08:40:00.000Z',
  },
  {
    ID: 'BEH-007',
    SISWA_ID: 'SISWA-0004',
    SISWA_NAMA: 'SITI AISYAH NURUL',
    NISN: '3160458891',
    KELAS: 'Kelas 4B',
    TANGGAL: '2026-10-27',
    KATEGORI: 'KESANTUNAN',
    TIPE: 'POSITIF',
    POIN: 10,
    JUDUL: 'Adab Berbicara Santun dan Menghargai Guru',
    CATATAN: 'Selalu memberi salam 5S (Senyum, Sapa, Salam, Sopan, Santun) dan menyapa tenaga kebersihan serta satpam sekolah.',
    GURU_ID: 'GURU-001',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    TINDAK_LANJUT: 'Pencatatan poin karakter kesantunan',
    STATUS_TINDAK_LANJUT: 'SELESAI',
    CREATED_AT: '2026-10-27T07:10:00.000Z',
  },
  {
    ID: 'BEH-008',
    SISWA_ID: 'SISWA-0005',
    SISWA_NAMA: 'RIZKY RAMADHAN',
    NISN: '3160782390',
    KELAS: 'Kelas 4B',
    TANGGAL: '2026-10-30',
    KATEGORI: 'KESANTUNAN',
    TIPE: 'PERLU_PERHATIAN',
    POIN: -5,
    JUDUL: 'Menyela Penjelasan Guru dan Berbicara Keras',
    CATATAN: 'Berulang kali memotong saat guru sedang menerangkan konsep perkalian dan mengejek jawaban teman yang keliru.',
    GURU_ID: 'GURU-001',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    TINDAK_LANJUT: 'Pendekatan empati setelah jam pulang sekolah, diajak meminta maaf dan membuat komitmen menghargai orang lain',
    STATUS_TINDAK_LANJUT: 'DALAM_PANTAUAN',
    CREATED_AT: '2026-10-30T10:15:00.000Z',
  },
  {
    ID: 'BEH-009',
    SISWA_ID: 'SISWA-0006',
    SISWA_NAMA: 'NADIA SAFITRI',
    NISN: '3160129045',
    KELAS: 'Kelas 4B',
    TANGGAL: '2026-11-03',
    KATEGORI: 'KEMANDIRIAN',
    TIPE: 'POSITIF',
    POIN: 15,
    JUDUL: 'Kemandirian Tinggi dalam Eksplorasi Koding Scratch',
    CATATAN: 'Berhasil membuat animasi dialog interaktif secara mandiri tanpa harus selalu diarahkan langkah demi langkah.',
    GURU_ID: 'GURU-001',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    TINDAK_LANJUT: 'Diberikan kesempatan mempresentasikan karya kodingnya di depan layar proyektor',
    STATUS_TINDAK_LANJUT: 'SELESAI',
    CREATED_AT: '2026-11-03T11:20:00.000Z',
  },
  {
    ID: 'BEH-010',
    SISWA_ID: 'SISWA-0007',
    SISWA_NAMA: 'FAJAR HIDAYATULLAH',
    NISN: '3160893321',
    KELAS: 'Kelas 4B',
    TANGGAL: '2026-10-31',
    KATEGORI: 'TANGGUNG_JAWAB',
    TIPE: 'POSITIF',
    POIN: 10,
    JUDUL: 'Menjaga Kebersihan Kelas dan Merapikan Pojok Baca',
    CATATAN: 'Tanpa diminta, menyapu lantai setelah kegiatan seni rupa selesai dan menata buku-buku cerita kembali ke rak.',
    GURU_ID: 'GURU-001',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    TINDAK_LANJUT: 'Diberi predikat Petugas Kebersihan Teladan Pekan Ini',
    STATUS_TINDAK_LANJUT: 'SELESAI',
    CREATED_AT: '2026-10-31T12:00:00.000Z',
  },
  {
    ID: 'BEH-011',
    SISWA_ID: 'SISWA-0008',
    SISWA_NAMA: 'ANISA RAHMAWATI',
    NISN: '3160342211',
    KELAS: 'Kelas 4B',
    TANGGAL: '2026-10-26',
    KATEGORI: 'TANGGUNG_JAWAB',
    TIPE: 'PERLU_PERHATIAN',
    POIN: -5,
    JUDUL: 'Tugas Proyek P5 Tertinggal dan Belum Tuntas',
    CATATAN: 'Lembar observasi wawancara pedagang jajanan tradisional belum diisi saat jadwal evaluasi tahap 2 dilaksanakan.',
    GURU_ID: 'GURU-001',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    TINDAK_LANJUT: 'Diberikan waktu toleransi tambahan 2 hari dengan bimbingan khusus wali kelas saat jam istirahat',
    STATUS_TINDAK_LANJUT: 'SELESAI',
    CREATED_AT: '2026-10-26T09:00:00.000Z',
  },
];

export const classroomService = new ClassroomService();

