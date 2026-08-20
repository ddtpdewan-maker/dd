import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  Stamp,
  Calendar,
  Building2,
  Tag,
  Hash,
  AlertCircle,
  Clock,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Copy,
  Check,
  FileText,
  Inbox,
  Send,
  Sparkles,
  Users,
  Paperclip,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FileDown,
} from 'lucide-react';
import { ArchivedLetter } from '../types/archive';
import { exportLettersToExcel } from '../utils/excelExport';
import {
  downloadCompleteDocument,
  getCompleteDocumentCopy,
} from '../utils/documentStorage';

interface DocumentViewerModalProps {
  letter: ArchivedLetter | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (id: string, newStatus: string) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  letter,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [focusStamp, setFocusStamp] = useState<boolean>(false);
  const [fullPages, setFullPages] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Load complete pages from IndexedDB or letter object
  useEffect(() => {
    if (!letter) return;
    setCurrentPage(0);
    setZoomLevel(1);
    setRotation(0);
    setFocusStamp(false);

    let active = true;
    const loadFullDoc = async () => {
      if (letter.pageImages && letter.pageImages.length > 0) {
        setFullPages(letter.pageImages);
      }
      try {
        const stored = await getCompleteDocumentCopy(letter.id);
        if (stored && stored.pageImages && stored.pageImages.length > 0 && active) {
          setFullPages(stored.pageImages);
        }
      } catch (e) {
        console.warn('Error fetching full copy:', e);
      }
    };
    loadFullDoc();

    return () => {
      active = false;
    };
  }, [letter]);

  if (!isOpen || !letter) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportSingle = () => {
    exportLettersToExcel([letter], {
      fileName: `كتاب_${letter.type}_${letter.incomingNumber || letter.outgoingNumber}_${letter.letterDate}.xlsx`,
    });
  };

  // Download complete document copy (PDF or page image)
  const handleDownloadFullCopy = async () => {
    setIsDownloading(true);
    try {
      const stored = await getCompleteDocumentCopy(letter.id);
      const downloadData =
        stored?.pdfDataUrl || letter.pdfDataUrl || letter.pageImages?.[0] || '';
      
      const fileName =
        stored?.fileName ||
        letter.pdfFileName ||
        `نسخة_كاملة_كتاب_${letter.type}_${letter.incomingNumber || letter.outgoingNumber}.pdf`;

      if (downloadData) {
        downloadCompleteDocument(fileName, downloadData);
      } else {
        alert('لا تتوفر نسخة إلكترونية قابلة للتنزيل لهذا المستند');
      }
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleZoomToStamp = () => {
    setFocusStamp(true);
    setZoomLevel(1.8);
    setCurrentPage(0);
  };

  const pagesToDisplay = fullPages.length > 0 ? fullPages : letter.pageImages || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header & Actions Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {letter.type === 'وارد' ? (
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                <Inbox className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                <Send className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-800 line-clamp-1">
                  {letter.subject}
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    letter.type === 'وارد'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  كتاب {letter.type}
                </span>

                {letter.isDuplicateCopy && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-700" />
                    <span>نسخة إضافية مسجلة</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">
                رقم الوارد: {letter.incomingNumber || '-'} | رقم الصادر: {letter.outgoingNumber || '-'} | تاريخ: {letter.letterDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Complete Copy Button */}
            <button
              onClick={handleDownloadFullCopy}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              title="تحميل النسخة الكاملة لجميع صفحات الكتاب"
            >
              <FileDown className="w-4 h-4" />
              <span>تحميل النسخة الكاملة (PDF)</span>
            </button>

            <button
              onClick={handleExportSingle}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
              title="تصدير بيانات هذا الكتاب إلى إكسل"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="طباعة"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Split View */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden divide-x divide-slate-200 divide-x-reverse">
          {/* Left: Complete Document Multi-page Viewer */}
          <div className="w-full md:w-7/12 bg-slate-950 flex flex-col min-h-0">
            {/* Viewer Controls */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">
                  صفحة {currentPage + 1} من {pagesToDisplay.length || 1}
                </span>
                {pagesToDisplay.length > 1 && (
                  <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="الصفحة السابقة"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    {pagesToDisplay.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                          currentPage === i ? 'bg-blue-600 text-white' : 'text-slate-300'
                        }`}
                      >
                        ص {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(pagesToDisplay.length - 1, p + 1))
                      }
                      disabled={currentPage === pagesToDisplay.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="الصفحة التالية"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {letter.blueStamp?.detected && (
                  <button
                    onClick={handleZoomToStamp}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/30 cursor-pointer"
                  >
                    <Stamp className="w-3.5 h-3.5" />
                    <span>التركيز على الختم الأزرق والخط اليدوي</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setZoomLevel((z) => Math.min(z + 0.25, 2.5));
                    setFocusStamp(false);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="تكبير"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel((z) => Math.max(z - 0.25, 0.6));
                    setFocusStamp(false);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="تصغير"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="تدوير"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Image Container */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-0 bg-slate-950">
              {pagesToDisplay.length > 0 ? (
                <div
                  className="relative transition-transform duration-200 shadow-2xl"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transformOrigin: focusStamp ? '20% 20%' : 'center center',
                  }}
                >
                  <img
                    src={pagesToDisplay[currentPage] || pagesToDisplay[0]}
                    alt={`صورة الكتاب الرسمي - صفحة ${currentPage + 1}`}
                    className="max-h-[75vh] w-auto rounded-lg object-contain bg-white ring-1 ring-slate-700"
                  />

                  {/* Stamp Highlight Box on Page 1 */}
                  {letter.blueStamp?.detected && currentPage === 0 && (
                    <div
                      className="absolute border-3 border-blue-500 bg-blue-500/20 rounded-md shadow-lg pointer-events-none"
                      style={{
                        top: `${letter.blueStamp.boundingBox?.topPercent || 12.8}%`,
                        left: `${letter.blueStamp.boundingBox?.leftPercent || 7.5}%`,
                        width: `${letter.blueStamp.boundingBox?.widthPercent || 27}%`,
                        height: `${letter.blueStamp.boundingBox?.heightPercent || 10.5}%`,
                      }}
                    >
                      <span className="absolute -top-6 right-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap">
                        الختم الأزرق (مكتشف)
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">لا تتوفر صورة ممسوحة ضوئياً لهذا المستند</p>
                </div>
              )}
            </div>

            {/* Complete copy bar */}
            <div className="p-2.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>النسخة الكاملة المحفوظة: {pagesToDisplay.length} صفحات</span>
              <span className="font-mono text-slate-500">{letter.pdfFileName || 'document.pdf'}</span>
            </div>
          </div>

          {/* Right: Comprehensive Details Panel */}
          <div className="w-full md:w-5/12 bg-white flex flex-col min-h-0 overflow-y-auto p-6 space-y-4">
            {/* 🟦 BLUE STAMP HANDWRITTEN SECTION */}
            {letter.blueStamp?.detected ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm">
                    <Stamp className="w-5 h-5 text-blue-600" />
                    <span>الختم الأزرق والخط اليدوي (OCR)</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                    دقة {letter.blueStamp.confidence || 95}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-white/90 p-3 rounded-xl border border-blue-100">
                  <div>
                    <span className="text-[11px] text-blue-950 font-bold block mb-0.5">
                      رقم الوارد المكتوب بخط اليد:
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold font-mono text-base text-blue-700">
                        {letter.blueStamp.handwrittenIncomingNumber || letter.incomingNumber}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            letter.blueStamp.handwrittenIncomingNumber || letter.incomingNumber,
                            'stampNum'
                          )
                        }
                        className="text-blue-400 hover:text-blue-700 p-1 cursor-pointer"
                        title="نسخ"
                      >
                        {copiedField === 'stampNum' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-blue-950 font-bold block mb-0.5">
                      تاريخ الاستلام بالختم:
                    </span>
                    <span className="font-bold font-mono text-xs text-slate-800">
                      {letter.blueStamp.handwrittenReceiptDate || letter.receiptDate || '-'}
                    </span>
                  </div>
                </div>

                {letter.blueStamp.stampPrintedText && (
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <span className="font-bold">نص الختم المطبوع: </span>
                    {letter.blueStamp.stampPrintedText}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <Stamp className="w-4 h-4 text-slate-400" />
                <span>هذا الكتاب غير ممهور بختم الوارد الأزرق أو صادر مباشر.</span>
              </div>
            )}

            {/* Main Information Cards */}
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">الموضوع:</span>
                </div>
                <div className="font-bold text-slate-900 text-sm leading-snug">
                  {letter.subject}
                </div>
              </div>

              {/* Grid Data */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block mb-1">الجهة الصادرة (المرسل):</span>
                  <span className="font-bold text-slate-900">{letter.senderEntity || '-'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block mb-1">الجهة الموجه إليها:</span>
                  <span className="font-bold text-slate-900">{letter.recipientEntity || '-'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block mb-1">رقم الصادر / الإشارة:</span>
                  <span className="font-bold font-mono text-slate-900">{letter.outgoingNumber || '-'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block mb-1">تاريخ الكتاب الرسمي:</span>
                  <span className="font-bold font-mono text-slate-900">{letter.letterDate || '-'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block mb-1">درجة الأهمية والسرية:</span>
                  <span className="font-bold text-slate-900">{letter.priority}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block mb-1">التصنيف الموضوعي:</span>
                  <span className="font-bold text-slate-900">{letter.category || 'عام'}</span>
                </div>
              </div>

              {/* Keywords */}
              {letter.keywords && letter.keywords.length > 0 && (
                <div>
                  <span className="text-slate-600 font-bold block mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>الكلمات المفتاحية المستخرجة بالذكاء الاصطناعي:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {letter.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Important Numbers & Amounts */}
              {letter.importantNumbers && letter.importantNumbers.length > 0 && (
                <div>
                  <span className="text-slate-600 font-bold block mb-1.5 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-indigo-600" />
                    <span>الأرقام والمبالغ والقرارات الهامة:</span>
                  </span>
                  <div className="space-y-1.5">
                    {letter.importantNumbers.map((num, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 font-mono"
                      >
                        <span className="text-slate-600 font-sans text-xs">{num.label}:</span>
                        <span className="font-bold text-slate-900 text-xs">{num.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Executive Summary */}
              {letter.summary && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-600 font-bold block mb-1">الملخص التنفيذي لمحتوى الكتاب:</span>
                  <p className="text-slate-700 leading-relaxed text-xs">{letter.summary}</p>
                </div>
              )}

              {/* Action Required */}
              {letter.actionRequired && (
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                  <span className="text-amber-900 font-bold block mb-1">الإجراء المطلوب والتوجيه:</span>
                  <p className="text-amber-800 text-xs">{letter.actionRequired}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
