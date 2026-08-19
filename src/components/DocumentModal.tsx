import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Scan,
  Sparkles,
  Stamp,
  CheckCircle,
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
} from 'lucide-react';
import {
  ArchivedLetter,
  BlueStampData,
  DocumentType,
  ImportantNumber,
  PriorityLevel,
} from '../types/archive';
import { convertPdfToImages, generateSampleIncomingLetterCanvas } from '../utils/pdfHelper';
import { audioNotifier } from '../utils/audioNotification';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (letter: ArchivedLetter) => void;
  onOpenScannerTab?: () => void;
}

type Step = 'upload' | 'analyzing' | 'review';

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onOpenScannerTab,
}) => {
  const [step, setStep] = useState<Step>('upload');
  const [analysisProgress, setAnalysisProgress] = useState<string>('جاري قراءة ملف الـ PDF...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Document Pages
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [pdfFileSize, setPdfFileSize] = useState<number>(0);

  // Extracted and Editable Metadata
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

  // Viewer controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [highlightBlueStamp, setHighlightBlueStamp] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setStep('upload');
    setPageImages([]);
    setCurrentPageIndex(0);
    setPdfFileName('');
    setPdfFileSize(0);
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
    setBlueStamp({
      detected: false,
      handwrittenIncomingNumber: '',
      handwrittenReceiptDate: '',
    });
    setErrorMessage(null);
    setZoomLevel(1);
    setRotation(0);
  };

  // Perform AI OCR and Blue Stamp extraction from the first 2 pages
  const processImagesForOcr = async (images: string[], originalFileName: string = 'document.pdf') => {
    try {
      setStep('analyzing');
      setErrorMessage(null);

      setAnalysisProgress('1/4 جاري معالجة أول صفحتين من المستند...');
      await new Promise((r) => setTimeout(r, 600));

      setAnalysisProgress('2/4 البحث عن الختم الأزرق والتعرف على الخط اليدوي...');
      await new Promise((r) => setTimeout(r, 600));

      // Call server OCR endpoint
      const response = await fetch('/api/ocr/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.slice(0, 2), // strictly first 2 pages
          fileName: originalFileName,
        }),
      });

      setAnalysisProgress('3/4 استخراج الكلمات المفتاحية والأرقام والمبالغ الهامة...');

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'فشل استخراج البيانات من المستند');
      }

      setAnalysisProgress('4/4 إعداد بطاقة المعاملة والمطابقة...');
      await new Promise((r) => setTimeout(r, 400));

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
        err.message || 'حدث خطأ أثناء معالجة المستند. يرجى إعادة المحاولة أو إدخال البيانات يدوياً.'
      );
      setStep('review'); // allow manual review anyway
    }
  };

  // Handle PDF file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    setPdfFileSize(file.size);

    try {
      if (file.type === 'application/pdf') {
        setStep('analyzing');
        setAnalysisProgress('جاري استخراج الصفحات من ملف الـ PDF...');
        const arrayBuffer = await file.arrayBuffer();
        const pages = await convertPdfToImages(arrayBuffer, 2);
        if (pages.length === 0) {
          throw new Error('لم نتمكن من قراءة صفحات ملف الـ PDF');
        }
        setPageImages(pages);
        await processImagesForOcr(pages, file.name);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const imgData = event.target?.result as string;
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

  // Load realistic sample letter with blue stamp for 1-click test
  const handleLoadSample = async () => {
    const sampleImg = generateSampleIncomingLetterCanvas(
      '1452/و',
      'وز/ت/892',
      '2026/05/18',
      '2026/05/20',
      'بشأن تخصيص الميزانية التشغيلية وتوريد أجهزة المسح الضوئي والأرشفة',
      'وزارة التخطيط والمالية - الإدارة العامة للموازنة',
      'وزارة الاتصالات وتقنية المعلومات - دائرة نظم المعلومات'
    );
    setPdfFileName('كتاب_وارد_ميزانية_الماسحات_1452.pdf');
    setPdfFileSize(412000);
    setPageImages([sampleImg]);
    await processImagesForOcr([sampleImg], 'كتاب_وارد_ميزانية_الماسحات_1452.pdf');
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

  // Save document to archive
  const handleFinalSave = () => {
    if (!subject.trim()) {
      alert('يرجى كتابة موضوع الكتاب الرسمي');
      return;
    }

    const newLetter: ArchivedLetter = {
      id: `doc-${Date.now()}`,
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
      pdfFileName: pdfFileName || 'document.pdf',
      pdfFileSize: pdfFileSize || 102400,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

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
                <span>إضافة وأرشفة كتاب رسمي جديد</span>
                {step === 'review' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    تم استخراج البيانات
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                التعرف الضوئي التلقائي OCR على الختم الأزرق والخط اليدوي والكلمات المفتاحية
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
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {step === 'upload' && (
            <div className="flex-1 p-8 flex flex-col items-center justify-center overflow-y-auto">
              <div className="max-w-xl w-full text-center space-y-6">
                {/* Upload Box */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-18 h-18 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                    <Upload className="w-9 h-9" />
                  </div>
                  <h4 className="font-bold text-base text-slate-800 mb-1">
                    اسحب وأفلت ملف الكتاب الرسمي (PDF) هنا
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mb-4">
                    أو انقر لاختيار ملف من جهازك. يدعم ملفات PDF متعددة الصفحات والصور الممسوحة ضوئياً.
                  </p>
                  <span className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs group-hover:bg-blue-700">
                    اختيار ملف PDF / صورة
                  </span>
                </div>

                {/* Quick 1-Click Sample Testing */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 flex items-center justify-between text-right">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-indigo-950">
                        تريد اختبار الميزة فوراً بدون رفع ملف؟
                      </h5>
                      <p className="text-[11px] text-indigo-700">
                        جرب نموذج كتاب وارد حقيقي يحتوي على ختم أزرق وخط يدوي.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLoadSample}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                  >
                    تجربة النموذج الآن
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'analyzing' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Stamp className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-lg text-slate-800">
                  الذكاء الاصطناعي يحلل الكتاب الرسمي...
                </h4>
                <p className="text-sm font-medium text-blue-700 font-mono animate-pulse">
                  {analysisProgress}
                </p>
              </div>

              <div className="max-w-md w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-right space-y-2">
                <div className="font-bold text-slate-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>التحليل يشمل أول صفحتين من الكتاب فقط</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  يقوم النظام بالبحث البصري عن الختم الأزرق وقراءة رقم الوارد وتاريخ الاستلام المكتوبين بخط اليد بالـ OCR، بالإضافة لاستخراج الكلمات المفتاحية والأرقام والمبالغ الهامة.
                </p>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden divide-x divide-slate-200 divide-x-reverse">
              {/* Left Side: Document Preview with Blue Stamp Highlight */}
              <div className="w-full md:w-1/2 bg-slate-900 flex flex-col min-h-0">
                {/* Document Viewer Controls */}
                <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">
                      صفحة {currentPageIndex + 1} من {pageImages.length || 1}
                    </span>
                    {pageImages.length > 1 && (
                      <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
                        <button
                          onClick={() => setCurrentPageIndex(0)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            currentPageIndex === 0 ? 'bg-blue-600 text-white' : 'text-slate-300'
                          }`}
                        >
                          ص 1
                        </button>
                        <button
                          onClick={() => setCurrentPageIndex(1)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            currentPageIndex === 1 ? 'bg-blue-600 text-white' : 'text-slate-300'
                          }`}
                        >
                          ص 2
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Blue stamp highlight toggle */}
                    {blueStamp.detected && (
                      <button
                        onClick={() => setHighlightBlueStamp(!highlightBlueStamp)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                          highlightBlueStamp
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        <Stamp className="w-3.5 h-3.5" />
                        <span>تمييز الختم الأزرق</span>
                      </button>
                    )}

                    <button
                      onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.5))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="تكبير"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="تصغير"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="تدوير"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Document Display Canvas */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-0 bg-slate-950/90">
                  {pageImages.length > 0 && (
                    <div
                      className="relative transition-transform duration-150 shadow-2xl"
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                      }}
                    >
                      <img
                        src={pageImages[currentPageIndex] || pageImages[0]}
                        alt="معاينة المستند"
                        className="max-h-[75vh] w-auto rounded-lg object-contain bg-white ring-1 ring-slate-700"
                      />

                      {/* Blue Stamp Bounding Box Overlay */}
                      {blueStamp.detected && highlightBlueStamp && currentPageIndex === 0 && (
                        <div
                          className="absolute border-3 border-blue-500 bg-blue-500/20 rounded-md shadow-lg pointer-events-none animate-pulse"
                          style={{
                            top: `${blueStamp.boundingBox?.topPercent || 12.8}%`,
                            left: `${blueStamp.boundingBox?.leftPercent || 7.5}%`,
                            width: `${blueStamp.boundingBox?.widthPercent || 27}%`,
                            height: `${blueStamp.boundingBox?.heightPercent || 10.5}%`,
                          }}
                        >
                          <span className="absolute -top-6 right-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md">
                            الختم الأزرق المكتشف
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Verification and Editable Data Form */}
              <div className="w-full md:w-1/2 flex flex-col min-h-0 bg-white">
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Document Type Switcher */}
                  <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDocType('وارد')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        docType === 'وارد'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>كتاب وارد (Incoming)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocType('صادر')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        docType === 'صادر'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>كتاب صادر (Outgoing)</span>
                    </button>
                  </div>

                  {/* 🟦 BLUE STAMP HANDWRITTEN CARD */}
                  <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm">
                        <Stamp className="w-5 h-5 text-blue-600" />
                        <span>بيانات الختم الأزرق والخط اليدوي (OCR)</span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                        دقة: {blueStamp.confidence || 95}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-blue-950 mb-1">
                          رقم الوارد المكتوب بخط اليد:
                        </label>
                        <input
                          type="text"
                          value={blueStamp.handwrittenIncomingNumber}
                          onChange={(e) => {
                            setBlueStamp({
                              ...blueStamp,
                              handwrittenIncomingNumber: e.target.value,
                              detected: true,
                            });
                            setIncomingNumber(e.target.value);
                          }}
                          placeholder="مثال: 1452/و"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-blue-300 font-bold font-mono text-sm text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-blue-950 mb-1">
                          تاريخ الاستلام بالختم:
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
                          placeholder="مثال: 2026/05/20"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-blue-300 font-bold font-mono text-sm text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {blueStamp.stampPrintedText && (
                      <div className="text-[11px] text-blue-800 bg-blue-100/60 p-2 rounded-lg">
                        <span className="font-bold">نص الختم المطبوع: </span>
                        {blueStamp.stampPrintedText}
                      </div>
                    )}
                  </div>

                  {/* General Metadata Inputs */}
                  <div className="space-y-3">
                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        موضوع الكتاب الرسمي *
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="الموضوع الرئيسي للكتاب..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Numbers & Dates Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          رقم الصادر / الإشارة
                        </label>
                        <input
                          type="text"
                          value={outgoingNumber}
                          onChange={(e) => setOutgoingNumber(e.target.value)}
                          placeholder="مثال: وز/ت/892"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          تاريخ الكتاب الرسمي
                        </label>
                        <input
                          type="text"
                          value={letterDate}
                          onChange={(e) => setLetterDate(e.target.value)}
                          placeholder="مثال: 2026/05/18"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Entities */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          الجهة الصادرة (المرسل)
                        </label>
                        <input
                          type="text"
                          value={senderEntity}
                          onChange={(e) => setSenderEntity(e.target.value)}
                          placeholder="الوزارة / الهيئة المرسلة..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          الجهة الموجه إليها (المرسل إليه)
                        </label>
                        <input
                          type="text"
                          value={recipientEntity}
                          onChange={(e) => setRecipientEntity(e.target.value)}
                          placeholder="الجهة الموجه إليها..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Priority & Category */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          درجة الأهمية والسرية
                        </label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
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
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          التصنيف الإداري
                        </label>
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="مثال: مالي، إداري، مناقصات..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Keywords (First 2 Pages) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الكلمات المفتاحية المستخرجة (من أول صفحتين)
                      </label>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl mb-2 min-h-[42px]">
                        {keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-medium"
                          >
                            <span>#{kw}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(kw)}
                              className="text-blue-500 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newKeywordInput}
                          onChange={(e) => setNewKeywordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddKeyword();
                            }
                          }}
                          placeholder="إضافة كلمة مفتاحية جديدة والضغط على Enter..."
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddKeyword}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700"
                        >
                          إضافة
                        </button>
                      </div>
                    </div>

                    {/* Important Numbers & Amounts */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الأرقام والمبالغ والمراجع الهامة
                      </label>
                      <div className="space-y-1.5 mb-2">
                        {importantNumbers.map((num, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs"
                          >
                            <span className="font-semibold text-slate-600">{num.label}:</span>
                            <span className="font-bold text-slate-900 font-mono">{num.value}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveImportantNumber(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newNumberLabel}
                          onChange={(e) => setNewNumberLabel(e.target.value)}
                          placeholder="البيان (مثلاً: رقم القرار)"
                          className="w-1/2 px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                        />
                        <input
                          type="text"
                          value={newNumberValue}
                          onChange={(e) => setNewNumberValue(e.target.value)}
                          placeholder="القيمة (مثلاً: 480,000)"
                          className="w-1/2 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleAddImportantNumber}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الملخص التنفيذي لمضمون الكتاب
                      </label>
                      <textarea
                        rows={3}
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="ملخص موجز لأهم ما ورد في الكتاب..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                      />
                    </div>

                    {/* Action Required */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الإجراء المطلوب
                      </label>
                      <input
                        type="text"
                        value={actionRequired}
                        onChange={(e) => setActionRequired(e.target.value)}
                        placeholder="مثال: اتخاذ اللازم، إعداد رد رسمي، حفظ في الملف..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Save Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                  <button
                    type="button"
                    onClick={() => setStep('upload')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    إعادة رفع مستند آخر
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalSave}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>حفظ وأرشفة الكتاب رسمياً</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
