import React, { useState, useEffect } from 'react';
import {
  Award, Play, CheckCircle2, XCircle, Clock, Plus, Trash2, Edit3, HelpCircle,
  BarChart2, Check, AlertTriangle, ArrowRight, ArrowLeft, RotateCcw, Sparkles
} from 'lucide-react';
import { Account, ClassroomQuiz, QuizQuestion, QuizAttempt } from '../../types/classroom';
import { classroomService } from '../../services/classroomService';

interface ClassroomQuizCBTViewProps {
  account: Account;
  onRefresh: () => void;
}

export const ClassroomQuizCBTView: React.FC<ClassroomQuizCBTViewProps> = ({ account, onRefresh }) => {
  const isGuru = account.ROLE === 'GURU';
  const isSiswa = account.ROLE === 'SISWA';
  const isKepsek = account.ROLE === 'KEPALA SEKOLAH';

  const [activeTab, setActiveTab] = useState<'available' | 'results' | 'create'>('available');
  const [activeQuizForTest, setActiveQuizForTest] = useState<ClassroomQuiz | null>(null);

  // Active Test State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: number }>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [testResult, setTestResult] = useState<QuizAttempt | null>(null);
  const [testStartTime, setTestStartTime] = useState<string>('');

  // Create Quiz State
  const [quizJudul, setQuizJudul] = useState('');
  const [quizDeskripsi, setQuizDeskripsi] = useState('');
  const [quizKelas, setQuizKelas] = useState(account.KELAS || 'Kelas 1');
  const [quizDurasi, setQuizDurasi] = useState(20);
  const [quizKKM, setQuizKKM] = useState(75);
  const [quizDeadline, setQuizDeadline] = useState('2026-09-30');
  const [questionsList, setQuestionsList] = useState<QuizQuestion[]>([
    {
      ID: 'Q1',
      SOAL: 'Contoh pertanyaan pertama...',
      PILIHAN: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
      KUNCI_JAWABAN: 0,
      PEMBAHASAN: 'Pembahasan kunci jawaban.',
    },
  ]);

  const quizzes = classroomService.getQuizzes(isSiswa || isGuru ? account.KELAS : undefined);
  const attempts = classroomService.getQuizAttempts(undefined, isSiswa ? account.ID : undefined);

  // Timer countdown hook for active test
  useEffect(() => {
    if (!activeQuizForTest || testResult) return;

    if (timeLeftSeconds <= 0) {
      handleFinishExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuizForTest, timeLeftSeconds, testResult]);

  // Start Exam
  const handleStartExam = (quiz: ClassroomQuiz) => {
    setActiveQuizForTest(quiz);
    setCurrentQuestionIdx(0);
    setUserAnswers({});
    setTimeLeftSeconds(quiz.DURASI_MENIT * 60);
    setTestResult(null);
    setTestStartTime(new Date().toISOString());
  };

  // Select Answer
  const handleSelectAnswer = (qId: string, optionIdx: number) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  // Finish Exam
  const handleFinishExam = () => {
    if (!activeQuizForTest) return;

    const attempt = classroomService.submitQuizAttempt({
      QUIZ_ID: activeQuizForTest.ID,
      SISWA_ID: account.ID,
      SISWA_NAMA: account.NAMA,
      KELAS: account.KELAS || activeQuizForTest.KELAS,
      ANSWERS: userAnswers,
      STARTED_AT: testStartTime,
    });

    setTestResult(attempt);
    onRefresh();
  };

  // Close Exam Window
  const handleCloseExam = () => {
    setActiveQuizForTest(null);
    setTestResult(null);
  };

  // Form Management for creating quiz
  const handleAddQuestion = () => {
    setQuestionsList([
      ...questionsList,
      {
        ID: `Q-${Date.now()}-${questionsList.length + 1}`,
        SOAL: '',
        PILIHAN: ['', '', '', ''],
        KUNCI_JAWABAN: 0,
        PEMBAHASAN: '',
      },
    ]);
  };

  const handleUpdateQuestion = (idx: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questionsList];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestionsList(updated);
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questionsList];
    const opts = [...updated[qIdx].PILIHAN];
    opts[optIdx] = val;
    updated[qIdx].PILIHAN = opts;
    setQuestionsList(updated);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questionsList.length <= 1) return;
    setQuestionsList(questionsList.filter((_, i) => i !== idx));
  };

  const handleSaveNewQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizJudul.trim()) return;

    classroomService.saveQuiz({
      KELAS: account.KELAS || quizKelas,
      JUDUL: quizJudul,
      DESKRIPSI: quizDeskripsi,
      DURASI_MENIT: Number(quizDurasi),
      KKM: Number(quizKKM),
      DEADLINE: quizDeadline,
      QUESTIONS: questionsList,
      GURU_ID: account.ID,
      GURU_NAMA: account.NAMA,
      IS_ACTIVE: true,
    });

    setQuizJudul('');
    setQuizDeskripsi('');
    setActiveTab('available');
    onRefresh();
  };

  const handleDeleteQuiz = (id: string) => {
    if (confirm('Hapus kuis ini beserta riwayat pengerjaannya?')) {
      classroomService.deleteQuiz(id);
      onRefresh();
    }
  };

  // Formatting seconds to mm:ss
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Award size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Kuis & Ujian Online (CBT)</h2>
            <p className="text-xs text-slate-500">
              Evaluasi interaktif, penilaian otomatis berbasis komputer, dan riwayat nilai siswa
            </p>
          </div>
        </div>

        {(isGuru || isKepsek) && (
          <button
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition active:scale-95"
          >
            <Plus size={16} /> Buat Paket Kuis CBT Baru
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'available'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Award size={14} /> Daftar Kuis Tersedia ({quizzes.length})
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'results'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart2 size={14} /> Hasil & Skor Ujian ({attempts.length})
        </button>
      </div>

      {/* 1. AVAILABLE QUIZZES VIEW */}
      {activeTab === 'available' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => {
            const studentAttempt = attempts.find((a) => a.QUIZ_ID === quiz.ID && a.SISWA_ID === account.ID);

            return (
              <div
                key={quiz.ID}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                      {quiz.KELAS}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> {quiz.DURASI_MENIT} Menit
                      </span>
                      {(isGuru || isKepsek) && (
                        <button
                          onClick={() => handleDeleteQuiz(quiz.ID)}
                          title="Hapus Kuis"
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-800 mb-1">{quiz.JUDUL}</h3>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{quiz.DESKRIPSI}</p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center mb-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Jumlah Soal</span>
                      <span className="text-xs font-black text-slate-800">{quiz.QUESTIONS?.length || 0} Butir</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Batas KKM</span>
                      <span className="text-xs font-black text-purple-700">{quiz.KKM}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Batas Waktu</span>
                      <span className="text-xs font-black text-slate-800">{quiz.DEADLINE}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Guru: {quiz.GURU_NAMA}</span>

                  {isSiswa && (
                    <div>
                      {studentAttempt ? (
                        <button
                          onClick={() => {
                            setActiveQuizForTest(quiz);
                            setTestResult(studentAttempt);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 hover:bg-emerald-100 transition"
                        >
                          <CheckCircle2 size={14} /> Nilai: {studentAttempt.SCORE} (Lihat Pembahasan)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartExam(quiz)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition active:scale-95"
                        >
                          <Play size={14} /> Mulai Kerjakan Kuis
                        </button>
                      )}
                    </div>
                  )}

                  {(isGuru || isKepsek) && (
                    <button
                      onClick={() => {
                        setActiveQuizForTest(quiz);
                        setTestResult(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    >
                      Pratinjau Soal ({quiz.QUESTIONS?.length})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. RESULTS & ATTEMPTS VIEW */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-black text-xs text-slate-700 uppercase tracking-wider">
              {isSiswa ? 'Riwayat Pengerjaan Kuis Saya' : 'Rekapitulasi Nilai Kuis Siswa'}
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{attempts.length} Catatan Selesai</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4">Kuis</th>
                  <th className="p-4 text-center">Skor / Nilai</th>
                  <th className="p-4 text-center">Benar / Total</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Waktu Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Belum ada riwayat pengerjaan kuis.
                    </td>
                  </tr>
                ) : (
                  attempts.map((att) => {
                    const quiz = quizzes.find((q) => q.ID === att.QUIZ_ID);

                    return (
                      <tr key={att.ID} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-800">{att.SISWA_NAMA}</td>
                        <td className="p-4 text-slate-600">{att.KELAS}</td>
                        <td className="p-4 text-slate-700 font-medium">{quiz?.JUDUL || att.QUIZ_ID}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`text-sm font-black px-2.5 py-0.5 rounded-full ${
                              att.PASSED ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {att.SCORE}
                          </span>
                        </td>
                        <td className="p-4 text-center font-semibold text-slate-600">
                          {att.BENAR} / {att.TOTAL_SOAL}
                        </td>
                        <td className="p-4 text-center">
                          {att.PASSED ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 size={12} /> Tuntas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                              <XCircle size={12} /> Remedial
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-[11px]">
                          {att.FINISHED_AT.replace('T', ' ')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CREATE QUIZ FORM */}
      {activeTab === 'create' && (
        <form onSubmit={handleSaveNewQuiz} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-800">Form Pembuatan Paket Kuis CBT Baru</h3>
            <button
              type="button"
              onClick={() => setActiveTab('available')}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              Batal & Kembali
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Judul Kuis / Ujian</label>
              <input
                type="text"
                required
                placeholder="Contoh: Kuis Harian 2 - Tematik Lingkungan & Numerasi"
                value={quizJudul}
                onChange={(e) => setQuizJudul(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Kelas</label>
              <select
                value={quizKelas}
                onChange={(e) => setQuizKelas(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium"
              >
                {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Petunjuk & Deskripsi</label>
              <textarea
                rows={2}
                placeholder="Tuliskan petunjuk pengerjaan untuk siswa..."
                value={quizDeskripsi}
                onChange={(e) => setQuizDeskripsi(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Durasi Ujian (Menit)</label>
              <input
                type="number"
                min={5}
                max={120}
                value={quizDurasi}
                onChange={(e) => setQuizDurasi(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nilai KKM (Passing Grade)</label>
              <input
                type="number"
                min={50}
                max={100}
                value={quizKKM}
                onChange={(e) => setQuizKKM(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Batas Akhir Pengerjaan</label>
              <input
                type="date"
                value={quizDeadline}
                onChange={(e) => setQuizDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* QUESTION BUILDER LIST */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800">Daftar Soal Pilihan Ganda ({questionsList.length})</h4>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
              >
                <Plus size={14} /> Tambah Butir Soal
              </button>
            </div>

            {questionsList.map((q, qIdx) => (
              <div key={q.ID || qIdx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-700">Soal Nomor {qIdx + 1}</span>
                  {questionsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Hapus Soal
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Teks Pertanyaan</label>
                  <textarea
                    required
                    rows={2}
                    placeholder={`Tuliskan pertanyaan nomor ${qIdx + 1}...`}
                    value={q.SOAL}
                    onChange={(e) => handleUpdateQuestion(qIdx, 'SOAL', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['A', 'B', 'C', 'D'].map((label, optIdx) => (
                    <div key={label} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                      <input
                        type="radio"
                        name={`kunci-${qIdx}`}
                        checked={q.KUNCI_JAWABAN === optIdx}
                        onChange={() => handleUpdateQuestion(qIdx, 'KUNCI_JAWABAN', optIdx)}
                        className="text-purple-600 focus:ring-purple-500"
                        title="Tandai sebagai kunci jawaban yang benar"
                      />
                      <span className="font-bold text-xs text-slate-700">{label}.</span>
                      <input
                        type="text"
                        required
                        placeholder={`Pilihan ${label}`}
                        value={q.PILIHAN[optIdx] || ''}
                        onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                        className="flex-1 text-xs border-none focus:outline-none bg-transparent"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pembahasan / Catatan Jawaban</label>
                  <input
                    type="text"
                    placeholder="Alasan mengapa kunci jawaban tersebut benar..."
                    value={q.PEMBAHASAN || ''}
                    onChange={(e) => handleUpdateQuestion(qIdx, 'PEMBAHASAN', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('available')}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20"
            >
              Simpan & Terbitkan Kuis
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 4. ACTIVE CBT TESTING MODAL (REAL-TIME ENGINE) */}
      {/* ========================================================================= */}
      {activeQuizForTest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full h-[90vh] max-h-[750px] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Header with Countdown Timer */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 px-6 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                  CBT Portal • {activeQuizForTest.KELAS}
                </span>
                <h3 className="font-black text-sm tracking-tight">{activeQuizForTest.JUDUL}</h3>
              </div>

              {!testResult && (
                <div className="flex items-center gap-2 bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-400/30">
                  <Clock size={16} className="text-amber-400 animate-pulse" />
                  <span className="font-mono font-bold text-sm text-amber-300">{formatTimer(timeLeftSeconds)}</span>
                </div>
              )}

              {testResult && (
                <button
                  onClick={handleCloseExam}
                  className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold transition"
                >
                  Tutup / Keluar
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
              {/* IF TEST RESULT READY -> SHOW SCORE CARD */}
              {testResult ? (
                <div className="space-y-6 text-center my-auto">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-100 flex items-center justify-center text-purple-700 mb-2">
                    <Award size={40} />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-slate-800">Pengerjaan Kuis Selesai!</h3>
                    <p className="text-xs text-slate-500 mt-1">Jawaban Anda telah dinilai otomatis oleh sistem.</p>
                  </div>

                  <div className="max-w-md mx-auto bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Skor Akhir</span>
                      <span
                        className={`text-3xl font-black ${
                          testResult.PASSED ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {testResult.SCORE}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Benar / Salah</span>
                      <span className="text-lg font-bold text-slate-800">
                        {testResult.BENAR} / {testResult.SALAH}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Status KKM</span>
                      <span
                        className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          testResult.PASSED ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {testResult.PASSED ? 'Tuntas' : 'Remedial'}
                      </span>
                    </div>
                  </div>

                  {/* Review Questions & Explanations */}
                  <div className="text-left space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Pembahasan Soal:</h4>
                    {activeQuizForTest.QUESTIONS.map((q, idx) => {
                      const chosen = testResult.ANSWERS[q.ID];
                      const isCorrect = chosen === q.KUNCI_JAWABAN;

                      return (
                        <div
                          key={q.ID}
                          className={`p-3.5 rounded-xl border text-xs ${
                            isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800">
                              {idx + 1}. {q.SOAL}
                            </span>
                            {isCorrect ? (
                              <span className="text-emerald-700 font-bold text-[10px]">✓ Benar</span>
                            ) : (
                              <span className="text-red-700 font-bold text-[10px]">✕ Salah</span>
                            )}
                          </div>
                          <div className="text-slate-600 text-[11px] mt-1">
                            Jawaban Anda:{' '}
                            <span className="font-bold">
                              {chosen !== undefined ? q.PILIHAN[chosen] : 'Tidak dijawab'}
                            </span>
                            {!isCorrect && (
                              <span className="text-emerald-700 font-bold ml-2">
                                (Kunci: {q.PILIHAN[q.KUNCI_JAWABAN]})
                              </span>
                            )}
                          </div>
                          {q.PEMBAHASAN && (
                            <p className="mt-1.5 text-[10px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200/60">
                              💡 {q.PEMBAHASAN}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleCloseExam}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Kembali ke Beranda Kuis
                  </button>
                </div>
              ) : (
                /* ACTIVE QUESTION STEPPER */
                <div className="flex-1 flex flex-col justify-between space-y-6">
                  {/* Question Jumper Navigation Bar */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100">
                    {activeQuizForTest.QUESTIONS.map((q, idx) => {
                      const isAnswered = userAnswers[q.ID] !== undefined;
                      const isCurrent = currentQuestionIdx === idx;

                      return (
                        <button
                          key={q.ID}
                          onClick={() => setCurrentQuestionIdx(idx)}
                          className={`w-8 h-8 rounded-xl font-bold text-xs transition shrink-0 ${
                            isCurrent
                              ? 'bg-purple-700 text-white ring-2 ring-purple-300'
                              : isAnswered
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Question Card */}
                  {activeQuizForTest.QUESTIONS[currentQuestionIdx] && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-700 uppercase">
                          Pertanyaan {currentQuestionIdx + 1} dari {activeQuizForTest.QUESTIONS.length}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 leading-relaxed">
                        {activeQuizForTest.QUESTIONS[currentQuestionIdx].SOAL}
                      </h4>

                      {/* Options Radio List */}
                      <div className="space-y-2.5 pt-2">
                        {activeQuizForTest.QUESTIONS[currentQuestionIdx].PILIHAN.map((opt, optIdx) => {
                          const qId = activeQuizForTest.QUESTIONS[currentQuestionIdx].ID;
                          const isSelected = userAnswers[qId] === optIdx;

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectAnswer(qId, optIdx)}
                              className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center gap-3 text-xs ${
                                isSelected
                                  ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-400/20 text-purple-950 font-bold'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                              }`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                  isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {['A', 'B', 'C', 'D'][optIdx]}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={currentQuestionIdx === 0}
                      onClick={() => setCurrentQuestionIdx((prev) => prev - 1)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 transition"
                    >
                      <ArrowLeft size={14} /> Soal Sebelumnya
                    </button>

                    {currentQuestionIdx < activeQuizForTest.QUESTIONS.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition"
                      >
                        Soal Berikutnya <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFinishExam}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition active:scale-95"
                      >
                        <Check size={16} /> Selesaikan & Kumpulkan Ujian
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
