import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  QrCode,
  Camera,
  Upload,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { db } from '../services/localStorageService';
import { Asset } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (asset: Asset) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectAsset,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    setErrorMsg('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      setErrorMsg('Kamera tidak dapat diakses atau izin ditolak: ' + (err?.message || 'Error'));
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setManualCode('');
      setErrorMsg('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  const resolveScannedText = (rawText: string) => {
    let code = rawText.trim();

    // Check if it's a verification URL containing ?scan= or ?code=
    if (code.includes('?') && (code.includes('scan=') || code.includes('code='))) {
      try {
        const url = new URL(code);
        const extracted = url.searchParams.get('scan') || url.searchParams.get('code');
        if (extracted) {
          code = extracted;
        }
      } catch (e) {
        // Simple regex fallback
        const match = code.match(/[?&](?:scan|code)=([^&]+)/);
        if (match) {
          code = decodeURIComponent(match[1]);
        }
      }
    }

    const assets = db.getAssets();
    const found = assets.find(
      (a) =>
        a.KODE_ASET.toLowerCase() === code.toLowerCase() ||
        a.KODE_BARANG.toLowerCase() === code.toLowerCase() ||
        a.ID.toLowerCase() === code.toLowerCase()
    );

    if (found) {
      stopCamera();
      onSelectAsset(found);
      onClose();
    } else {
      setErrorMsg(`Aset dengan kode "${code}" tidak ditemukan dalam database.`);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    resolveScannedText(manualCode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use barcode detection API if available in browser
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['qr_code', 'code_128', 'ean_13'],
      });
      const img = new Image();
      img.onload = async () => {
        try {
          const barcodes = await barcodeDetector.detect(img);
          if (barcodes.length > 0) {
            resolveScannedText(barcodes[0].rawValue);
          } else {
            setErrorMsg('Tidak ditemukan QR code pada gambar ini. Silakan masukkan kode secara manual.');
          }
        } catch (err: any) {
          setErrorMsg('Gagal membaca gambar QR: ' + err.message);
        }
      };
      img.src = URL.createObjectURL(file);
    } else {
      // Prompt user with file name or manual code
      const nameGuess = file.name.replace(/\.[^/.]+$/, '');
      setManualCode(nameGuess);
      setErrorMsg('Silakan konfirmasi kode aset di bawah untuk mencocokkan dengan database.');
    }
  };

  if (!isOpen) return null;

  const assets = db.getAssets();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-800 text-emerald-200">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm">In-App QR & Barcode Scanner</h3>
              <p className="text-[11px] text-emerald-200/80">Scan label stiker untuk membuka data aset instan</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle size={16} className="text-rose-700 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Scanner Viewfinder / Camera preview */}
          <div className="relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner border border-slate-800">
            {isCameraActive ? (
              <div className="relative w-full h-full">
                <video ref={videoRef} playsInline autoPlay className="w-full h-full object-cover" />
                {/* Visual Viewfinder Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-emerald-400 rounded-2xl relative animate-pulse shadow-lg shadow-emerald-500/20">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-300 -mt-1 -ml-1 rounded-tl" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-300 -mt-1 -mr-1 rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-300 -mb-1 -ml-1 rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-300 -mb-1 -mr-1 rounded-br" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400 space-y-2">
                <QrCode size={48} className="mx-auto opacity-40 text-emerald-400" />
                <p className="text-xs">Arahkan kamera ke stiker label QR code aset</p>
              </div>
            )}
          </div>

          {/* Camera Trigger Buttons */}
          <div className="flex gap-2">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Camera size={16} /> Buka Kamera Scanner
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                Matikan Kamera
              </button>
            )}

            <label className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-200">
              <Upload size={15} /> Unggah Foto QR
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Manual Input Search Fallback */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Atau Cari Berdasarkan Kode Register / Nama:
            </span>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Contoh: AST-2026-0001 / Laptop Asus"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 font-medium focus:outline-emerald-700 bg-slate-50"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-2xs"
              >
                Cari Aset
              </button>
            </form>
          </div>

          {/* Quick Select from recent registered assets */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Aset Terdaftar Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {assets.slice(0, 6).map((a) => (
                <button
                  key={a.ID}
                  type="button"
                  onClick={() => resolveScannedText(a.KODE_ASET)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 border border-slate-200 text-[11px] font-mono font-semibold transition-all flex items-center gap-1"
                >
                  <span>{a.KODE_ASET}</span>
                  <span className="text-slate-400 font-sans truncate max-w-[120px]">({a.NAMA_BARANG})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
