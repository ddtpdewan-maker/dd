import React, { useState, useRef, useEffect } from 'react';
import {
  Scan,
  Camera,
  X,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowLeft,
  Stamp,
  Sliders,
  Trash2,
} from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (pages: string[]) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPages, setCapturedPages] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'color' | 'contrast' | 'bw'>('color');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera stream when open
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedPages([]);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment',
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        'تعذر الوصول إلى الكاميرا أو الماسح الضوئي المباشر. يمكنك استخدام رفع ملفات PDF أو الصور بدلاً من ذلك.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  // Capture current frame
  const handleCapturePage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1200;
    canvas.height = video.videoHeight || 1600;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply color / contrast filter if selected
    if (filterMode === 'contrast') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      const factor = (259 * (128 + 255)) / (255 * (259 - 128)); // increase contrast
      for (let i = 0; i < d.length; i += 4) {
        d[i] = factor * (d[i] - 128) + 128; // R
        d[i + 1] = factor * (d[i + 1] - 128) + 128; // G
        d[i + 2] = factor * (d[i + 2] - 128) + 128; // B
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (filterMode === 'bw') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const threshold = v > 135 ? 255 : 0;
        d[i] = threshold;
        d[i + 1] = threshold;
        d[i + 2] = threshold;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPages((prev) => [...prev.slice(0, 1), dataUrl]); // max 2 pages

    setTimeout(() => setIsCapturing(false), 300);
  };

  const handleFinishScan = () => {
    if (capturedPages.length === 0) return;
    onScanComplete(capturedPages);
    onClose();
  };

  const handleRemovePage = (index: number) => {
    setCapturedPages(capturedPages.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                محطة المسح الضوئي المباشر للوثائق
              </h3>
              <p className="text-xs text-slate-500">
                مسح ضوئي عالي الدقة متوافق مع أجهزة المسح والكاميرات الملحقة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-950 divide-x divide-slate-800 divide-x-reverse">
          {/* Left / Center Viewfinder */}
          <div className="flex-1 flex flex-col relative min-h-0 items-center justify-center p-4">
            {cameraError ? (
              <div className="text-center p-6 bg-slate-900 rounded-2xl border border-slate-800 max-w-md">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-white mb-2">تنبيه الماسح الضوئي</h4>
                <p className="text-xs text-slate-400 mb-4">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  إعادة محاولة الاتصال
                </button>
              </div>
            ) : (
              <div className="relative w-full h-full max-w-lg max-h-[65vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black border-2 border-slate-700 shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Document Alignment Frame Guides */}
                <div className="absolute inset-6 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between text-[11px] font-mono text-emerald-300 bg-black/60 px-2 py-1 rounded w-max">
                    <span>موضع الكتاب الرسمي</span>
                  </div>
                  <div className="flex items-center gap-1.5 self-center text-[11px] font-bold text-blue-300 bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-500/40">
                    <Stamp className="w-3.5 h-3.5" />
                    <span>تأكد من وضوح الختم الأزرق والخط اليدوي</span>
                  </div>
                </div>

                {isCapturing && (
                  <div className="absolute inset-0 bg-white animate-fade-out pointer-events-none" />
                )}
              </div>
            )}

            {/* Filter Mode Selector & Snap Button */}
            <div className="mt-4 flex items-center gap-4 z-10">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setFilterMode('color')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    filterMode === 'color' ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  ألوان طبيعية (لحفظ الختم الأزرق)
                </button>
                <button
                  onClick={() => setFilterMode('contrast')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    filterMode === 'contrast' ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  تباين عالي للخطوط
                </button>
              </div>

              <button
                onClick={handleCapturePage}
                disabled={!stream || capturedPages.length >= 2}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>
                  {capturedPages.length === 0
                    ? 'مسح الصفحة الأولى (ص 1)'
                    : capturedPages.length === 1
                    ? 'مسح الصفحة الثانية (ص 2)'
                    : 'اكتمل مسح أول صفحتين'}
                </span>
              </button>
            </div>
          </div>

          {/* Right: Captured Pages Gallery */}
          <div className="w-full md:w-64 bg-slate-900 p-4 flex flex-col justify-between shrink-0">
            <div>
              <h4 className="font-bold text-xs text-white mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>الصفحات الممسوحة ضوئياً ({capturedPages.length}/2)</span>
              </h4>

              {capturedPages.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                  اضغط على زر المسح لأخذ لقطة للصفحة الأولى ثم الثانية
                </div>
              ) : (
                <div className="space-y-3">
                  {capturedPages.map((page, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden border border-slate-700 bg-black group"
                    >
                      <img src={page} alt={`صفحة ${i + 1}`} className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-2">
                        <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded">
                          صفحة {i + 1}
                        </span>
                        <button
                          onClick={() => handleRemovePage(i)}
                          className="p-1 rounded-md bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Proceed Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleFinishScan}
                disabled={capturedPages.length === 0}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white font-bold text-xs shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>بدء التحليل واستخراج الأختام والـ OCR</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
