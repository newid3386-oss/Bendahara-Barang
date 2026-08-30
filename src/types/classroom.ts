// Classroom & Account Management Types

export type SystemType = 'SIPERSEDA' | 'CLASSROOM' | 'ADMIN';

export type AccountRole = 'ADMIN' | 'OPERATOR' | 'KEPALA SEKOLAH' | 'GURU' | 'SISWA';

export interface Account {
  ID: string;
  NAMA: string;
  EMAIL: string;
  USERNAME: string;
  PASSWORD: string;
  ROLE: AccountRole;
  SISTEM: SystemType;
  STATUS: 'AKTIF' | 'NONAKTIF';
  NIP?: string;
  KELAS?: string; // for siswa
  TELEPON?: string;
  CREATED_AT: string;
}

// Classroom data models
export interface ClassroomCourse {
  ID: string;
  KODE_KELAS: string;
  NAMA: string;
  DESKRIPSI: string;
  GURU_ID: string;
  GURU_NAMA: string;
  SISWA_IDS: string[];
  KELAS_TINGKAT: string;
  CREATED_AT: string;
}

export interface ClassroomAssignment {
  ID: string;
  COURSE_ID: string;
  JUDUL: string;
  DESKRIPSI: string;
  DEADLINE: string;
  TYPE: 'TUGAS' | 'MATERI' | 'ULANGAN';
  CREATED_AT: string;
  GURU_ID: string;
  GURU_NAMA: string;
}

export interface ClassroomSubmission {
  ID: string;
  ASSIGNMENT_ID: string;
  COURSE_ID: string;
  SISWA_ID: string;
  SISWA_NAMA: string;
  ISI: string;
  FILE_LINK?: string;
  SUBMITTED_AT: string;
  STATUS: 'DRAFT' | 'SUBMITTED' | 'GRADED';
  NILAI?: number;
  FEEDBACK?: string;
  GRADED_BY?: string;
  GRADED_AT?: string;
}

export interface ClassroomReport {
  ID: string;
  JUDUL: string;
  KATEGORI: string;
  ISI: string;
  PERIODE: string;
  GURU_ID: string;
  GURU_NAMA: string;
  CREATED_AT: string;
  STATUS: 'DRAFT' | 'DIKIRIM' | 'DINILAI';
  NILAI?: number;
  FEEDBACK?: string;
  GRADED_BY?: string;
  GRADED_AT?: string;
}
