import { ClassroomCourse, ClassroomAssignment, ClassroomSubmission, ClassroomReport } from '../types/classroom';

const STORAGE_KEYS = {
  COURSES: 'BB_CLASSROOM_COURSES',
  ASSIGNMENTS: 'BB_CLASSROOM_ASSIGNMENTS',
  SUBMISSIONS: 'BB_CLASSROOM_SUBMISSIONS',
  REPORTS: 'BB_CLASSROOM_REPORTS',
  SEEDED: 'BB_CLASSROOM_SEEDED',
};

const nowISO = () => new Date().toISOString();
const ts = () => nowISO().replace('T', ' ').substring(0, 19);

const DEFAULT_COURSES: ClassroomCourse[] = [
  {
    ID: 'CRS-001',
    KODE_KELAS: '1A-2026',
    NAMA: 'Kelas 1A - Tema Lingkungan Sahabat Kita',
    DESKRIPSI: 'Pembelajaran Tematik Tema 1-3 untuk siswa Kelas 1A. Mencakup Bahasa Indonesia, Matematika, dan IPAS.',
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    SISWA_IDS: ['ACC-CLS-004', 'ACC-CLS-005'],
    KELAS_TINGKAT: 'Kelas 1',
    CREATED_AT: nowISO(),
  },
  {
    ID: 'CRS-002',
    KODE_KELAS: '3B-2026',
    NAMA: 'Kelas 3B - Tema Selalu Berhemat Hemat Energi',
    DESKRIPSI: 'Pembelajaran Tematik Tema 1-2 untuk siswa Kelas 3B dengan fokus literasi dan numerasi.',
    GURU_ID: 'ACC-CLS-003',
    GURU_NAMA: 'Ahmad Fauzi, S.Pd.',
    SISWA_IDS: ['ACC-CLS-006'],
    KELAS_TINGKAT: 'Kelas 3',
    CREATED_AT: nowISO(),
  },
];

const DEFAULT_ASSIGNMENTS: ClassroomAssignment[] = [
  {
    ID: 'ASG-001',
    COURSE_ID: 'CRS-001',
    JUDUL: 'Tugas Menggambar Pohon di Sekitar Rumah',
    DESKRIPSI: 'Gambarlah 1 pohon yang ada di sekitar rumahmu, lalu ceritakan dalam 3 kalimat mengapa pohon itu penting.',
    DEADLINE: '2026-09-05',
    TYPE: 'TUGAS',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
  },
  {
    ID: 'ASG-002',
    COURSE_ID: 'CRS-001',
    JUDUL: 'Materi: Mengenal Huruf Vokal',
    DESKRIPSI: 'Bacalah materi huruf vokal A I U E O beserta contoh kata. Lengkapi latihan di buku tematik halaman 12-14.',
    DEADLINE: '2026-09-03',
    TYPE: 'MATERI',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
  },
  {
    ID: 'ASG-003',
    COURSE_ID: 'CRS-002',
    JUDUL: 'Ulangan Harian 1 - Penjumlahan',
    DESKRIPSI: 'Kerjakan soal penjumlahan 1-50. Waktu pengerjaan 30 menit.',
    DEADLINE: '2026-09-08',
    TYPE: 'ULANGAN',
    CREATED_AT: nowISO(),
    GURU_ID: 'ACC-CLS-003',
    GURU_NAMA: 'Ahmad Fauzi, S.Pd.',
  },
];

const DEFAULT_REPORTS: ClassroomReport[] = [
  {
    ID: 'RPT-001',
    JUDUL: 'Laporan Bulanan Pembelajaran Kelas 1A - Agustus 2026',
    KATEGORI: 'Laporan Bulanan',
    ISI:
      'Pembelajaran Kelas 1A pada bulan Agustus 2026 berjalan dengan baik. capaian: 85% siswa mampu mengenal huruf vokal. Kekurangan: 3 siswa masih perlu pendampingan dalam menulis.',
    PERIODE: '2026-08',
    GURU_ID: 'ACC-CLS-002',
    GURU_NAMA: 'Nurul Hidayah, S.Pd.',
    CREATED_AT: nowISO(),
    STATUS: 'DIKIRIM',
  },
];

class ClassroomService {
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

  public initClassroom(): void {
    if (localStorage.getItem(STORAGE_KEYS.SEEDED)) return;
    this.setItem(STORAGE_KEYS.COURSES, DEFAULT_COURSES);
    this.setItem(STORAGE_KEYS.ASSIGNMENTS, DEFAULT_ASSIGNMENTS);
    this.setItem(STORAGE_KEYS.SUBMISSIONS, []);
    this.setItem(STORAGE_KEYS.REPORTS, DEFAULT_REPORTS);
    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
  }

  // --- Courses ---
  public getCourses(): ClassroomCourse[] {
    this.initClassroom();
    return this.getItem<ClassroomCourse[]>(STORAGE_KEYS.COURSES, DEFAULT_COURSES);
  }

  public getCoursesForGuru(guruId: string): ClassroomCourse[] {
    return this.getCourses().filter((c) => c.GURU_ID === guruId);
  }

  public getCoursesForSiswa(siswaId: string): ClassroomCourse[] {
    return this.getCourses().filter((c) => c.SISWA_IDS.includes(siswaId));
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
      };
      list.push(saved);
    }
    this.setItem(STORAGE_KEYS.ASSIGNMENTS, list);
    return saved;
  }

  public deleteAssignment(id: string): void {
    this.setItem(STORAGE_KEYS.ASSIGNMENTS, this.getAssignments().filter((a) => a.ID !== id));
    this.setItem(STORAGE_KEYS.SUBMISSIONS, this.getSubmissions().filter((s) => s.ASSIGNMENT_ID !== id));
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
    return saved;
  }

  public gradeSubmission(id: string, nilai: number, feedback: string, gradedBy: string): void {
    const list = this.getItem<ClassroomSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    const sub = list.find((s) => s.ID === id);
    if (sub) {
      sub.NILAI = nilai;
      sub.FEEDBACK = feedback;
      sub.GRADED_BY = gradedBy;
      sub.GRADED_AT = ts();
      sub.STATUS = 'GRADED';
      this.setItem(STORAGE_KEYS.SUBMISSIONS, list);
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
}

export const classroomService = new ClassroomService();
