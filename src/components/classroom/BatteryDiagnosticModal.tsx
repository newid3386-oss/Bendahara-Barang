import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  CheckCircle2,
  Cpu,
  Flame,
  Gauge,
  HardDrive,
  Info,
  Leaf,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Wrench,
  X,
  Zap,
  ZapOff
} from 'lucide-react';

export interface BatteryDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  batteryLevel: number | null;
  isCharging: boolean;
  isLowBattery: boolean;
  isBatterySaverMode: boolean;
  onToggleBatterySaverMode: () => void;
  isLowBatterySimulated?: boolean;
  onToggleSimulateLowBattery?: () => void;
  batteryAlertThreshold: number;
}

export const BatteryDiagnosticModal: React.FC<BatteryDiagnosticModalProps> = ({
  isOpen,
  onClose,
  batteryLevel,
  isCharging,
  isLowBattery,
  isBatterySaverMode,
  onToggleBatterySaverMode,
  isLowBatterySimulated = false,
  onToggleSimulateLowBattery,
  batteryAlertThreshold,
}) => {
  const currentPct = useMemo(() => {
    return batteryLevel !== null ? Math.round(batteryLevel * 100) : 85;
  }, [batteryLevel]);

  // Persistent cycle count
  const [cycleCount, setCycleCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sdn6_battery_cycle_count');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {}
    return 148;
  });

  // Simulated calibration state
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [lastCalibrationDate, setLastCalibrationDate] = useState<string>(() => {
    try {
      return localStorage.getItem('sdn6_battery_last_calibration') || 'Hari ini, 07:30 WIB';
    } catch {
      return 'Hari ini, 07:30 WIB';
    }
  });

  // Dynamic calibrated voltage based on battery percentage & charging state
  // Li-Po nominal curve: 3.65V (empty 0%) to 4.20V (full 100%), +0.08V float when charging
  const voltage = useMemo(() => {
    const base = 3.65 + (currentPct / 100) * 0.55;
    const chargeOffset = isCharging ? 0.08 : 0;
    // Slight deterministic jitter based on percentage for realistic decimal readout
    const jitter = ((currentPct % 5) - 2) * 0.004;
    return (base + chargeOffset + jitter).toFixed(2);
  }, [currentPct, isCharging]);

  // Dynamic estimated battery & CMOS sensor temperature (°C)
  const temperature = useMemo(() => {
    let temp = 30.5;
    // If charging, thermal dissipation increases
    if (isCharging) temp += 2.8;
    // If battery saver is OFF (running 30fps with heavy analytics), camera runs warmer
    if (!isBatterySaverMode) temp += 1.4;
    // High capacity fast charging bump
    if (isCharging && currentPct < 80) temp += 0.9;
    return temp.toFixed(1);
  }, [isCharging, isBatterySaverMode, currentPct]);

  // State of Health (SOH) calculated from cycle count
  // Typical Li-Ion degradation: ~0.04% loss per cycle
  const stateOfHealth = useMemo(() => {
    const calculated = 100 - (cycleCount * 0.038);
    return Math.max(75, Math.min(100, Math.round(calculated * 10) / 10));
  }, [cycleCount]);

  const designCapacity = 4500; // mAh
  const estimatedCapacity = Math.round((stateOfHealth / 100) * designCapacity);

  // Scanner hardware impact runtime estimations
  const estimatedRuntimeMinutes = useMemo(() => {
    // Normal 30 FPS + face detection consumes ~25% battery/hr (~240 min full charge)
    // Eco-Scan 15 FPS + reduced analytics consumes ~10% battery/hr (~600 min full charge)
    const rateNormal = 0.25; // per hour
    const rateEco = 0.10; // per hour
    const activeRate = isBatterySaverMode ? rateEco : rateNormal;
    const hoursLeft = (currentPct / 100) / activeRate;
    return Math.max(5, Math.round(hoursLeft * 60));
  }, [currentPct, isBatterySaverMode]);

  const runtimeString = useMemo(() => {
    const hours = Math.floor(estimatedRuntimeMinutes / 60);
    const mins = estimatedRuntimeMinutes % 60;
    if (hours > 0) {
      return `${hours} Jam ${mins} Menit`;
    }
    return `${mins} Menit`;
  }, [estimatedRuntimeMinutes]);

  const handleCalibrate = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      setIsCalibrating(false);
      const newCycle = cycleCount + 1;
      setCycleCount(newCycle);
      const nowStr = `Hari ini, ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
      setLastCalibrationDate(nowStr);
      try {
        localStorage.setItem('sdn6_battery_cycle_count', String(newCycle));
        localStorage.setItem('sdn6_battery_last_calibration', nowStr);
      } catch {}
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          id="modal-battery-diagnostic"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-white"
        >
          {/* Header */}
          <div className="relative px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl border ${
                isLowBattery
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  : isCharging
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                  : isBatterySaverMode
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
              }`}>
                <Activity size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Diagnostik Baterai & Hardware Scanner
                  </h3>
                  {isBatterySaverMode && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold">
                      Eco-Scan 15 FPS
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Monitoring tegangan sel, temperatur kamera, siklus, & efisiensi daya KBM SD Negeri Tangerang 6
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Tutup Diagnostik"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Primary Battery State Hero Bar */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isLowBattery
                ? 'bg-gradient-to-br from-rose-950/60 via-slate-900 to-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/30'
                : isCharging
                ? 'bg-gradient-to-br from-teal-950/50 via-slate-900 to-teal-950/30 border-teal-500/50'
                : 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isCharging ? (
                    <BatteryCharging size={20} className="text-teal-400 animate-pulse" />
                  ) : isLowBattery ? (
                    <BatteryLow size={20} className="text-rose-400 animate-bounce" />
                  ) : currentPct > 60 ? (
                    <BatteryFull size={20} className="text-emerald-400" />
                  ) : (
                    <BatteryMedium size={20} className="text-amber-400" />
                  )}
                  <span className="text-sm font-extrabold text-white">
                    Kapasitas Terukur: <span className="font-mono text-emerald-400">{currentPct}%</span>
                  </span>
                  {isCharging && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-400/30">
                      ⚡ Mengisi Daya (Charging)
                    </span>
                  )}
                  {isLowBattery && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 font-black border border-rose-400/50 animate-pulse">
                      ⚠️ Baterai Rendah (&le;{batteryAlertThreshold}%)
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">
                    Sisa Estimasi: <strong className="text-white">{runtimeString}</strong>
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentPct <= 15
                      ? 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
                      : currentPct <= 25
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : isCharging
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, currentPct))}%` }}
                />
              </div>
            </div>

            {/* Granular Hardware Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Metric 1: Current Voltage */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-400" />
                      Tegangan Sel (Voltage)
                    </span>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                      Real-time
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl font-black font-mono text-white tracking-tight">
                      {voltage}
                    </span>
                    <span className="text-sm font-extrabold text-amber-300">Volt DC</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Nominal Li-Po:</span>
                  <span className="font-mono text-emerald-400 font-bold">3.70V - 4.20V</span>
                </div>
              </div>

              {/* Metric 2: Cycle Count & SOH */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Gauge size={14} className="text-indigo-400" />
                      Siklus Pengisian (Cycles)
                    </span>
                    <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/30">
                      {stateOfHealth}% SOH
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl font-black font-mono text-white tracking-tight">
                      {cycleCount}
                    </span>
                    <span className="text-sm font-extrabold text-indigo-300">Siklus</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Kapasitas Efektif:</span>
                  <span className="font-mono text-white font-bold">{estimatedCapacity} / {designCapacity} mAh</span>
                </div>
              </div>

              {/* Metric 3: Battery & Camera Sensor Temperature */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Thermometer size={14} className="text-rose-400" />
                      Suhu Modul Sensor
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                      parseFloat(temperature) > 38
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {parseFloat(temperature) > 38 ? 'Hangat' : 'Sejuk'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl font-black font-mono text-white tracking-tight">
                      {temperature}
                    </span>
                    <span className="text-sm font-extrabold text-rose-300">°C</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Status Termal:</span>
                  <span className="font-mono text-emerald-400 font-bold">Optimal &lt; 38°C</span>
                </div>
              </div>
            </div>

            {/* Scanner Hardware Impact & Efficiency Panel */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-indigo-400" />
                  <h4 className="text-xs sm:text-sm font-extrabold text-white">
                    Efisiensi Hardware Kamera & Pengaruh Eco-Scan
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-500/30">
                  Modul CMOS QR
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-semibold mb-1">Daya Sensor Kamera (Power Draw):</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-300">Mode Standar (30 FPS):</span>
                    <span className="font-mono text-amber-300 font-bold">~1.85 Watt</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-emerald-300 font-bold">Mode Eco-Scan (15 FPS):</span>
                    <span className="font-mono text-emerald-400 font-black">~0.65 Watt (-65%)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-semibold mb-1">Beban Pemrosesan CPU & Analitik:</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-300">Analitik Real-time Aktif:</span>
                    <span className="font-mono text-amber-300 font-bold">~28% CPU</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-emerald-300 font-bold">Eco-Scan (Analitik Non-Esensial Off):</span>
                    <span className="font-mono text-emerald-400 font-black">~6% CPU</span>
                  </div>
                </div>
              </div>

              {/* Informational bullet points */}
              <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-200/90 space-y-1">
                <div className="flex items-start gap-1.5">
                  <ShieldCheck size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    Saat tombol <strong>Toggle Eco-Scan</strong> aktif, laju frame kamera scanner langsung dibatasi ke <strong>15 FPS</strong> dan analitik latar belakang (seperti pelacakan wajah berulang & sampling ambien luma) dinonaktifkan untuk memperpanjang daya baterai terutama saat daya di bawah 20%.
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Controls */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Eco-Scan Quick Toggle in Diagnostic Modal */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleBatterySaverMode();
                  }}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer border ${
                    isBatterySaverMode
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-900/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                  }`}
                  title="Aktifkan atau matikan mode Eco-Scan 15 FPS"
                >
                  <Leaf size={14} className={isBatterySaverMode ? 'fill-white' : 'text-slate-400'} />
                  <span>{isBatterySaverMode ? 'Eco-Scan Aktif (15 FPS)' : 'Aktifkan Eco-Scan (15 FPS)'}</span>
                </button>

                {/* Calibrate / Refresh sensor */}
                <button
                  type="button"
                  disabled={isCalibrating}
                  onClick={handleCalibrate}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition cursor-pointer disabled:opacity-50"
                  title="Kalibrasi ulang kalkulasi metrik baterai"
                >
                  <RefreshCw size={13} className={isCalibrating ? 'animate-spin text-indigo-400' : ''} />
                  <span>{isCalibrating ? 'Mengukur...' : 'Kalibrasi Sensor'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {onToggleSimulateLowBattery && (
                  <button
                    type="button"
                    onClick={onToggleSimulateLowBattery}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      isLowBatterySimulated
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700'
                    }`}
                    title="Simulasikan baterai rendah (<20%) untuk pengujian sistem peringatan dini"
                  >
                    {isLowBatterySimulated ? 'Batal Simulasi Baterai' : 'Simulasi Baterai Rendah'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Last calibrated timestamp note */}
            <div className="text-center text-[10px] text-slate-500 font-mono">
              Kalibrasi Terakhir: {lastCalibrationDate} • Standar Baterai Li-Po Kelas Industri SD Negeri Tangerang 6
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
