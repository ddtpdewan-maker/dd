import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Upload,
  FileText,
  Scan,
  Sparkles,
  Stamp,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Tag,
  Hash,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ArchivedLetter,
  BlueStampData,
  DocumentType,
  DuplicateCheckResult,
  ImportantNumber,
  PriorityLevel,
} from '../types/archive';
import {
  convertPdfToImages,
  generateSampleIncomingLetterCanvas,
  generateSampleLetterPage2Canvas,
} from '../utils/pdfHelper';
import { checkForDuplicateLetter } from '../utils/duplicateChecker';
import { saveCompleteDocumentCopy } from '../utils/documentStorage';
import { audioNotifier } from '../utils/audioNotification';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (letter: ArchivedLetter) => void;
  onOpenScannerTab?: () => void;
  existingLetters?: ArchivedLetter[];
  onViewExistingLetter?: (letter: ArchivedLetter) => void;
}

type Step = 'upload' | 'analyzing' | 'review';

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onOpenScannerTab,
  existingLetters = [],
  onViewExistingLetter,
}) => {
  const [step, setStep] = useState<Step>('upload');
  const [analysisProgress, setAnalysisProgress] = useState<string>('جاري قراءة ملف الـ PDF...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Document Pages & Full Complete Copy Data
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [pdfFileSize, setPdfFileSize] = useState<number>(0);
  const [pdfDataUrl, setPdfDataUrl] = useState<string>('');

  // AI Extracted and Editable Metadata
  const [docType, setDocType] = useState<DocumentType>('وارد');
  const [subject, setSubject] = useState<string>('');
  const [incomingNumber, setIncomingNumber] = useState<string>('');
  const [outgoingNumber, setOutgoingNumber] = useState<string>('');
  const [letterDate, setLetterDate] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState<string>('');
  const [senderEntity, setSenderEntity] = useState<string>('');
  const [recipientEntity, setRecipientEntity] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('عادي');
  const [category, setCategory] = useState<string>('إداري');
  const [summary, setSummary] = useState<string>('');
  const [actionRequired, setActionRequired] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState<string>('');
  const [importantNumbers, setImportantNumbers] = useState<ImportantNumber[]>([]);
  const [newNumberLabel, setNewNumberLabel] = useState<string>('');
  const [newNumberValue, setNewNumberValue] = useState<string>('');

  // Blue Stamp Data
  const [blueStamp, setBlueStamp] = useState<BlueStampData>({
    detected: false,
    handwrittenIncomingNumber: '',
    handwrittenReceiptDate: '',
  });

  // Allow saving even if duplicate is detected (explicit user confirmation)
  const [allowDuplicateSave, setAllowDuplicateSave] = useState<boolean>(false);

  // Viewer controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time Duplicate Checking
  const duplicateResult: DuplicateCheckResult = useMemo(() => {
    if (step !== 'review') {
      return {
        isDuplicate: false,
        duplicateLetter: null,
        matchType: 'none',
        matchDescription: '',
      };
    }
    return checkForDuplicateLetter(
      {
        incomingNumber,
        outgoingNumber,
        letterDate,
        subject,
      },
      existingLetters
    );
  }, [step, incomingNumber, outgoingNumber, letterDate, subject, existingLetters]);

  if (!isOpen) return null;

  const resetForm = () => {
    setStep('upload');
    setPageImages([]);
    setCurrentPageIndex(0);
    setPdfFileName('');
    setPdfFileSize(0);
    setPdfDataUrl('');
    setSubject('');
    setIncomingNumber('');
    setOutgoingNumber('');
    setLetterDate('');
    setReceiptDate('');
    setSenderEntity('');
    setRecipientEntity('');
    setPriority('عادي');
    setCategory('إداري');
    setSummary('');
    setActionRequired('');
    setKeywords([]);
    setImportantNumbers([]);
    setAllowDuplicateSave(false);
    setBlueStamp({
      detected: false,
      handwrittenIncomingNumber: '',
      handwrittenReceiptDate: '',
    });
    setErrorMessage(null);
    setZoomLevel(1);
    setRotation(0);
  };

  // Perform AI OCR and full document extraction from the first 2 pages
  const processImagesForOcr = async (images: string[], originalFileName: string = 'document.pdf') => {
    try {
      setStep('analyzing');
      setErrorMessage(null);
      setAllowDuplicateSave(false);

      setAnalysisProgress('1/3 جاري معالجة صفحات المستند...');
      await new Promise((r) => setTimeout(r, 400));

      setAnalysisProgress('2/3 البحث عن الختم الأزرق واستخراج الأرقام المكتوبة بخط اليد...');
      await new Promise((r) => setTimeout(r, 400));

      // Call server OCR endpoint
      const response = await fetch('/api/ocr/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.slice(0, 2), // first 2 pages for OCR
          fileName: originalFileName,
        }),
      });

      setAnalysisProgress('3/3 استخراج بيانات الموضوع، التواريخ، والكلمات المفتاحية...');

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'فشل استخراج البيانات من المستند');
      }

      const data = result.data;

      // Populate extracted fields
      setDocType(data.documentType === 'صادر' ? 'صادر' : 'وارد');
      setSubject(data.subject || '');
      setLetterDate(data.letterDate || '');
      setOutgoingNumber(data.outgoingNumber || '');
      setIncomingNumber(
        data.blueStampDetails?.handwrittenIncomingNumber || data.incomingNumber || ''
      );
      setReceiptDate(
        data.blueStampDetails?.handwrittenReceiptDate || data.letterDate || ''
      );
      setSenderEntity(data.senderEntity || '');
      setRecipientEntity(data.recipientEntity || '');
      setPriority((data.priority as PriorityLevel) || 'عادي');
      setCategory(data.category || 'إداري');
      setSummary(data.summary || '');
      setActionRequired(data.actionRequired || '');
      setKeywords(Array.isArray(data.keywords) ? data.keywords : []);
      setImportantNumbers(
        Array.isArray(data.importantNumbers) ? data.importantNumbers : []
      );

      // Blue stamp details
      if (data.blueStampDetected && data.blueStampDetails) {
        setBlueStamp({
          detected: true,
          handwrittenIncomingNumber:
            data.blueStampDetails.handwrittenIncomingNumber || '',
          handwrittenReceiptDate:
            data.blueStampDetails.handwrittenReceiptDate || '',
          stampPrintedText: data.blueStampDetails.stampPrintedText || '',
          confidence: data.blueStampDetails.confidence || 95,
          notes: data.blueStampDetails.notes || '',
          boundingBox: data.blueStampDetails.boundingBox || {
            topPercent: 12.8,
            leftPercent: 7.5,
            widthPercent: 27,
            heightPercent: 10.5,
          },
        });
      } else {
        setBlueStamp({
          detected: false,
          handwrittenIncomingNumber: '',
          handwrittenReceiptDate: '',
        });
      }

      setStep('review');
    } catch (err: any) {
      console.error('OCR Process error:', err);
      setErrorMessage(
        err.message || 'حدث خطأ أثناء معالجة المستند. يرجى مراجعة البيانات وإدخالها يدوياً.'
      );
      setStep('review');
    }
  };

  // Handle PDF file selection - converts ALL pages so full complete copy is retained
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    setPdfFileSize(file.size);

    try {
      if (file.type === 'application/pdf') {
        setStep('analyzing');
        setAnalysisProgress('جاري استخراج وحفظ صفحات النسخة الكاملة من الـ PDF...');
        
        // Read as Data URL for complete download copy
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPdfDataUrl(ev.target?.result as string);
        };
        reader.readAsDataURL(file);

        const arrayBuffer = await file.arrayBuffer();
        const pages = await convertPdfToImages(arrayBuffer, 50); // extract full multi-page document
        if (pages.length === 0) {
          throw new Error('لم نتمكن من قراءة صفحات ملف الـ PDF');
        }
        setPageImages(pages);
        await processImagesForOcr(pages, file.name);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const imgData = event.target?.result as string;
          setPdfDataUrl(imgData);
          setPageImages([imgData]);
          await processImagesForOcr([imgData], file.name);
        };
        reader.readAsDataURL(file);
      } else {
        alert('يرجى اختيار ملف بصيغة PDF أو صورة واضحة للمستند');
      }
    } catch (error: any) {
      console.error('File handle error:', error);
      alert(error.message || 'حدث خطأ أثناء فتح الملف');
      setStep('upload');
    }
  };

  // Load realistic sample letter with full 2-page complete copy & blue stamp
  const handleLoadSample = async () => {
    const samplePage1 = generateSampleIncomingLetterCanvas(
      '1452/و',
      'وز/ت/892',
      '2026/05/18',
      '2026/05/20',
      'بشأن تخصيص الميزانية التشغيلية وتوريد أجهزة المسح الضوئي والأرشفة',
      'وزارة التخطيط والمالية - الإدارة العامة للموازنة',
      'وزارة الاتصالات وتقنية المعلومات - دائرة نظم المعلومات'
    );
    const samplePage2 = generateSampleLetterPage2Canvas('وز/ت/892', '2026/05/18');

    const samplePages = [samplePage1, samplePage2];
    setPdfFileName('كتاب_وارد_ميزانية_الماسحات_1452.pdf');
    setPdfFileSize(412000);
    setPdfDataUrl(samplePage1);
    setPageImages(samplePages);
    await processImagesForOcr(samplePages, 'كتاب_وارد_ميزانية_الماسحات_1452.pdf');
  };

  // Add keyword tag
  const handleAddKeyword = () => {
    if (!newKeywordInput.trim()) return;
    if (!keywords.includes(newKeywordInput.trim())) {
      setKeywords([...keywords, newKeywordInput.trim()]);
    }
    setNewKeywordInput('');
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setKeywords(keywords.filter((kw) => kw !== kwToRemove));
  };

  // Add important number
  const handleAddImportantNumber = () => {
    if (!newNumberLabel.trim() || !newNumberValue.trim()) return;
    setImportantNumbers([
      ...importantNumbers,
      { label: newNumberLabel.trim(), value: newNumberValue.trim() },
    ]);
    setNewNumberLabel('');
    setNewNumberValue('');
  };

  const handleRemoveImportantNumber = (index: number) => {
    setImportantNumbers(importantNumbers.filter((_, i) => i !== index));
  };

  // Save document to archive and save complete copy to IndexedDB
  const handleFinalSave = async () => {
    if (!subject.trim()) {
      alert('يرجى كتابة موضوع الكتاب الرسمي');
      return;
    }

    // Duplicate check enforcement
    if (duplicateResult.isDuplicate && !allowDuplicateSave) {
      const confirmSave = window.confirm(
        `تنبيه: تم اكتشاف وثيقة مكررة مسجلة مسبقاً (${duplicateResult.matchDescription}).\n\nهل ترغب في المتابعة وحفظ هذا الكتاب كنسخة إضافية/محدثة؟`
      );
      if (!confirmSave) {
        return;
      }
    }

    const letterId = `doc-${Date.now()}`;
    const newLetter: ArchivedLetter = {
      id: letterId,
      type: docType,
      incomingNumber: incomingNumber || (docType === 'وارد' ? 'غير مسجل' : '-'),
      outgoingNumber: outgoingNumber || '-',
      letterDate: letterDate || new Date().toISOString().split('T')[0],
      receiptDate: receiptDate || (docType === 'وارد' ? letterDate : '-'),
      subject: subject.trim(),
      senderEntity: senderEntity.trim() || 'جهة رسمية',
      recipientEntity: recipientEntity.trim() || 'دائرة الأرشيف',
      priority,
      category: category || 'إداري',
      status: 'قيد الإجراء',
      summary: summary.trim(),
      actionRequired: actionRequired.trim(),
      keywords,
      importantNumbers,
      blueStamp,
      pageImages,
      pageCount: pageImages.length || 1,
      pdfFileName: pdfFileName || 'document.pdf',
      pdfFileSize: pdfFileSize || 102400,
      pdfDataUrl: pdfDataUrl || (pageImages[0] || ''),
      isDuplicateCopy: duplicateResult.isDuplicate,
      duplicateOfId: duplicateResult.duplicateLetter?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save complete multi-page copy in IndexedDB
    try {
      await saveCompleteDocumentCopy(letterId, {
        fileName: newLetter.pdfFileName || 'document.pdf',
        fileSize: newLetter.pdfFileSize || 102400,
        pdfDataUrl: newLetter.pdfDataUrl || '',
        pageImages: newLetter.pageImages,
        pageCount: newLetter.pageImages.length || 1,
      });
    } catch (e) {
      console.warn('Could not save to IndexedDB:', e);
    }

    onSave(newLetter);
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <span>إضافة وأرشفة كتاب رسمي بالذكاء الاصطناعي</span>
                {step === 'review' && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>تم الاستخراج الذكي التلقائي</span>
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                استخراج فوري لبيانات الكتاب، الختم الأزرق بالخط اليدوي، فحص التكرار، وحفظ نسخة كاملة
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {step === 'upload' && (
          <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
            {/* Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-10 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-3xl bg-blue-50/40 hover:bg-blue-50/80 transition-all cursor-pointer flex flex-col items-center justify-center group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/25">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-lg text-slate-800 mb-1">
                اختر أو اسحب ملف الكتاب الرسمي (PDF)
              </h4>
              <p className="text-xs text-slate-500 max-w-md mb-4 leading-relaxed">
                يقوم النظام تلقائياً باستخراج الموضوع، التواريخ، الأرقام الصادرة والواردة، وقراءة الختم الأزرق والخط اليدوي بواسطة الذكاء الاصطناعي مع حفظ نسخة كاملة لجميع الصفحات.
              </p>
              <span className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md">
                تصفح الملفات من جهازك
              </span>
            </div>

            {/* Quick Actions Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                onClick={handleLoadSample}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl border border-indigo-200 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>تجربة نموذج كتاب كامل بختم أزرق متعدد الصفحات</span>
              </button>

              {onOpenScannerTab && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenScannerTab();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl border border-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Scan className="w-4 h-4" />
                  <span>المسح الضوئي المباشر من الكاميرا / Scanner</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Analyzing Animation Screen */}
        {step === 'analyzing' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                <Sparkles className="w-10 h-10 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2 max-w-md">
              <h4 className="font-bold text-lg text-slate-800">
                جاري استخراج بيانات الكتاب بالذكاء الاصطناعي
              </h4>
              <p className="text-sm font-semibold text-blue-600">{analysisProgress}</p>
              <p className="text-xs text-slate-400">
                قراءة الأختام الزرقاء، التعرف على الأرقام والتواريخ المكتوبة يدوياً، وحفظ النسخة الكاملة
              </p>
            </div>
          </div>
        )}

        {/* Review & Edit Step */}
        {step === 'review' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden divide-x divide-slate-200 divide-x-reverse">
            {/* Left: Document View Screen (Full Copy Multi-page Viewer) */}
            <div className="w-full md:w-5/12 bg-slate-950 flex flex-col min-h-0">
              {/* Viewer Toolbar */}
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">
                    صفحة {currentPageIndex + 1} من {pageImages.length || 1}
                  </span>
                  {pageImages.length > 1 && (
                    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
                      <button
                        onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
                        disabled={currentPageIndex === 0}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="الصفحة السابقة"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      {pageImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPageIndex(i)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                            currentPageIndex === i ? 'bg-blue-600 text-white' : 'text-slate-300'
                          }`}
                        >
                          ص {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setCurrentPageIndex((p) => Math.min(pageImages.length - 1, p + 1))
                        }
                        disabled={currentPageIndex === pageImages.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="الصفحة التالية"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.2))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="تكبير"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}
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

              {/* Document Render Canvas */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-0 bg-slate-950">
                {pageImages.length > 0 ? (
                  <div
                    className="relative transition-transform duration-150 shadow-2xl"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    }}
                  >
                    <img
                      src={pageImages[currentPageIndex] || pageImages[0]}
                      alt={`معاينة الصفحة ${currentPageIndex + 1}`}
                      className="max-h-[68vh] w-auto rounded-lg object-contain bg-white ring-1 ring-slate-800"
                    />

                    {/* Stamp Bounding Box Highlight on Page 1 */}
                    {blueStamp.detected && currentPageIndex === 0 && (
                      <div
                        className="absolute border-3 border-blue-500 bg-blue-500/20 rounded-md shadow-lg pointer-events-none"
                        style={{
                          top: `${blueStamp.boundingBox?.topPercent || 12.8}%`,
                          left: `${blueStamp.boundingBox?.leftPercent || 7.5}%`,
                          width: `${blueStamp.boundingBox?.widthPercent || 27}%`,
                          height: `${blueStamp.boundingBox?.heightPercent || 10.5}%`,
                        }}
                      >
                        <span className="absolute -top-6 right-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap">
                          الختم الأزرق: {blueStamp.handwrittenIncomingNumber}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs">لا تتوفر صورة للمستند</div>
                )}
              </div>

              {/* Full copy info footer */}
              <div className="p-2.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>النسخة الكاملة: {pageImages.length} صفحات محفوظة</span>
                <span className="font-mono text-slate-500">{pdfFileName}</span>
              </div>
            </div>

            {/* Right: Extracted Metadata Form */}
            <div className="w-full md:w-7/12 bg-white flex flex-col min-h-0 overflow-y-auto p-6 space-y-4 text-xs">
              {/* ⚠️ AUTOMATIC DUPLICATE DETECTION WARNING BANNER */}
              {duplicateResult.isDuplicate && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-900 shadow-md animate-in fade-in zoom-in-95 duration-150 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-xl bg-amber-200 text-amber-900 shrink-0 mt-0.5">
                        <ShieldAlert className="w-5 h-5 text-amber-800" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-amber-900">
                          تنبيه: تم العثور على وثيقة مكررة مسجلة مسبقاً!
                        </h4>
                        <p className="text-xs text-amber-800 mt-0.5">
                          {duplicateResult.matchDescription}
                        </p>
                      </div>
                    </div>

                    {duplicateResult.duplicateLetter && onViewExistingLetter && (
                      <button
                        onClick={() => {
                          if (duplicateResult.duplicateLetter) {
                            onViewExistingLetter(duplicateResult.duplicateLetter);
                          }
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-700" />
                        <span>معاينة الوثيقة السابقة</span>
                      </button>
                    )}
                  </div>

                  {duplicateResult.duplicateLetter && (
                    <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200 text-[11px] space-y-1">
                      <div className="font-bold text-slate-800">
                        الكتاب المسجل سابقاً: {duplicateResult.duplicateLetter.subject}
                      </div>
                      <div className="text-slate-600 font-mono flex flex-wrap gap-3">
                        <span>رقم الوارد: {duplicateResult.duplicateLetter.incomingNumber}</span>
                        <span>تاريخ الكتاب: {duplicateResult.duplicateLetter.letterDate}</span>
                        <span>الجهة: {duplicateResult.duplicateLetter.senderEntity}</span>
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2 pt-1 cursor-pointer font-bold text-xs text-amber-900">
                    <input
                      type="checkbox"
                      checked={allowDuplicateSave}
                      onChange={(e) => setAllowDuplicateSave(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span>الموافقة على الحفظ كنسخة إضافية / تحديث للكتاب في الأرشيف</span>
                  </label>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 🟦 BLUE STAMP RECOGNITION HIGHLIGHT */}
              <div
                className={`p-4 rounded-2xl border-2 transition-all ${
                  blueStamp.detected
                    ? 'bg-blue-50/70 border-blue-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm">
                    <Stamp className="w-5 h-5 text-blue-600" />
                    <span>الختم الأزرق والتعرف على الخط اليدوي (OCR)</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={blueStamp.detected}
                      onChange={(e) =>
                        setBlueStamp({ ...blueStamp, detected: e.target.checked })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>تم كشف الختم الأزرق</span>
                  </label>
                </div>

                {blueStamp.detected ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-blue-950 block mb-1">
                        رقم الوارد المكتوب بخط اليد:
                      </label>
                      <input
                        type="text"
                        value={blueStamp.handwrittenIncomingNumber}
                        onChange={(e) => {
                          setBlueStamp({
                            ...blueStamp,
                            handwrittenIncomingNumber: e.target.value,
                          });
                          setIncomingNumber(e.target.value);
                        }}
                        placeholder="مثال: 1452/و"
                        className="w-full px-3 py-1.5 rounded-xl border border-blue-300 bg-white font-mono font-bold text-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-blue-950 block mb-1">
                        تاريخ الاستلام بالختم (خط يدوي):
                      </label>
                      <input
                        type="text"
                        value={blueStamp.handwrittenReceiptDate}
                        onChange={(e) => {
                          setBlueStamp({
                            ...blueStamp,
                            handwrittenReceiptDate: e.target.value,
                          });
                          setReceiptDate(e.target.value);
                        }}
                        placeholder="YYYY/MM/DD"
                        className="w-full px-3 py-1.5 rounded-xl border border-blue-300 bg-white font-mono text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">
                    لم يتم العثور على ختم أزرق تلقائياً، يمكنك تفعيله وإدخال رقم الوارد يدوياً.
                  </p>
                )}
              </div>

              {/* Standard Form Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نوع المعاملة:</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="وارد">كتاب وارد (Incoming)</option>
                    <option value="صادر">كتاب صادر (Outgoing)</option>
                    <option value="مذكرة داخلية">مذكرة داخلية</option>
                    <option value="تعميم">تعميم / قرار</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الوارد:</label>
                  <input
                    type="text"
                    value={incomingNumber}
                    onChange={(e) => setIncomingNumber(e.target.value)}
                    placeholder="رقم الوارد"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الصادر / الإشارة:</label>
                  <input
                    type="text"
                    value={outgoingNumber}
                    onChange={(e) => setOutgoingNumber(e.target.value)}
                    placeholder="رقم الصادر"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">موضوع الكتاب الرسمي:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="موضوع الكتاب..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sender & Recipient Entities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الجهة الصادرة (المرسل):</label>
                  <input
                    type="text"
                    value={senderEntity}
                    onChange={(e) => setSenderEntity(e.target.value)}
                    placeholder="اسم الوزارة / الإدارة..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">الجهة الموجه إليها:</label>
                  <input
                    type="text"
                    value={recipientEntity}
                    onChange={(e) => setRecipientEntity(e.target.value)}
                    placeholder="الجهة الموجه إليها..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Dates & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">تاريخ الكتاب:</label>
                  <input
                    type="text"
                    value={letterDate}
                    onChange={(e) => setLetterDate(e.target.value)}
                    placeholder="YYYY/MM/DD"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">درجة الأهمية والسرية:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="عادي">عادي</option>
                    <option value="عاجل">عاجل</option>
                    <option value="عاجل جداً">عاجل جداً</option>
                    <option value="سري">سري</option>
                    <option value="سري للغاية">سري للغاية</option>
                    <option value="عاجل وسري للغاية">عاجل وسري للغاية</option>
                    <option value="هام للمتابعة">هام للمتابعة</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">التصنيف الموضوعي:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="إداري">إداري</option>
                    <option value="مالي">مالي</option>
                    <option value="قانوني">قانوني</option>
                    <option value="تعاميم وقرارات">تعاميم وقرارات</option>
                    <option value="مناقصات وتوريدات">مناقصات وتوريدات</option>
                    <option value="شؤون فنية وتكنولوجيا">شؤون فنية وتكنولوجيا</option>
                    <option value="موارد بشرية">موارد بشرية</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              {/* Keywords Tagging */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>الكلمات المفتاحية المستخرجة (AI Keywords):</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {keywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-semibold text-xs border border-blue-200 flex items-center gap-1"
                    >
                      <span>#{kw}</span>
                      <button
                        onClick={() => handleRemoveKeyword(kw)}
                        className="hover:text-red-600 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    placeholder="إضافة كلمة مفتاحية جديدة..."
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <button
                    onClick={handleAddKeyword}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    + إضافة
                  </button>
                </div>
              </div>

              {/* Important Numbers */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-indigo-600" />
                  <span>الأرقام والمبالغ والقرارات الهامة المستخرجة:</span>
                </label>
                <div className="space-y-1.5 mb-2">
                  {importantNumbers.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs"
                    >
                      <span className="font-sans text-slate-600">{item.label}:</span>
                      <span className="font-bold text-slate-900">{item.value}</span>
                      <button
                        onClick={() => handleRemoveImportantNumber(idx)}
                        className="text-red-400 hover:text-red-600 font-sans cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNumberLabel}
                    onChange={(e) => setNewNumberLabel(e.target.value)}
                    placeholder="بيان الرقم (مثل: مبلغ الميزانية)"
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <input
                    type="text"
                    value={newNumberValue}
                    onChange={(e) => setNewNumberValue(e.target.value)}
                    placeholder="القيمة (مثال: 480,000 ريال)"
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                  <button
                    onClick={handleAddImportantNumber}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    + إضافة
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  الملخص التنفيذي لمحتوى الكتاب (AI Summary):
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="ملخص محتوى الكتاب الرسمي..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                />
              </div>

              {/* Action Required */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  الإجراء المطلوب والتوجيه:
                </label>
                <input
                  type="text"
                  value={actionRequired}
                  onChange={(e) => setActionRequired(e.target.value)}
                  placeholder="الإجراء المقترح..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            إلغاء
          </button>

          {step === 'review' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('upload')}
                className="flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة المسح والرفع</span>
              </button>

              <button
                onClick={handleFinalSave}
                className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  duplicateResult.isDuplicate && !allowDuplicateSave
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/25'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {duplicateResult.isDuplicate && !allowDuplicateSave
                    ? 'تأكيد الحفظ رغم التكرار'
                    : 'حفظ وأرشفة النسخة الكاملة'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
