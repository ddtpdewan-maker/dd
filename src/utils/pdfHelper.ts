import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker URL
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF Worker setup fallback:', e);
}

/**
 * Result of PDF processing containing all page images and total count
 */
export interface PdfConvertResult {
  pages: string[];
  totalPages: number;
}

/**
 * Renders pages of a PDF to base64 image data URLs (up to maxPages, default 50 for full copy)
 */
export async function convertPdfToImages(
  pdfData: ArrayBuffer | Uint8Array,
  maxPages: number = 50
): Promise<string[]> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdfDoc = await loadingTask.promise;
    const numPages = Math.min(pdfDoc.numPages, maxPages);
    const images: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 }); // High resolution for OCR and display

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await (page.render(renderContext as any) as any).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      images.push(dataUrl);
    }

    return images;
  } catch (error) {
    console.error('Error rendering PDF pages to image:', error);
    throw error;
  }
}

/**
 * Generate a realistic Arabic official letter canvas (Page 1) with authentic blue stamp and handwritten text
 */
export function generateSampleIncomingLetterCanvas(
  incomingNum: string = '1452/و',
  letterNum: string = 'وز/أ/892',
  letterDate: string = '2026/05/18',
  receiptDate: string = '2026/05/20',
  subject: string = 'بشأن تخصيص الميزانية التشغيلية وتوريد أجهزة المسح الضوئي والأرشفة',
  sender: string = 'وزارة التخطيط والمالية - الإدارة العامة للموازنة',
  recipient: string = 'وزارة الاتصالات وتقنية المعلومات - دائرة نظم المعلومات'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - high quality paper texture
  ctx.fillStyle = '#faf9f6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border frame
  ctx.strokeStyle = '#2b394a';
  ctx.lineWidth = 3;
  ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
  ctx.lineWidth = 1;
  ctx.strokeRect(56, 56, canvas.width - 112, canvas.height - 112);

  // Header Emblem / Coat of Arms Placeholder
  ctx.fillStyle = '#1e3a8a';
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px Cairo, Tahoma, sans-serif';
  ctx.fillText('جمهورية العراق / المملكة العربية السعودية', canvas.width / 2, 110);
  ctx.font = 'bold 22px Cairo, Tahoma, sans-serif';
  ctx.fillText(sender.split('-')[0] || 'وزارة التخطيط والتعاون الإنمائي', canvas.width / 2, 145);
  ctx.font = '16px Cairo, Tahoma, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('شعبة المراسلات والبريد الرسمي المركزي', canvas.width / 2, 175);

  // Divider line
  ctx.strokeStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(80, 200);
  ctx.lineTo(canvas.width - 80, 200);
  ctx.stroke();

  // Outgoing metadata on top left (or top right in Arabic layout)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px Cairo, sans-serif';
  ctx.fillText(`الرقم الصادر: ${letterNum}`, canvas.width - 90, 240);
  ctx.fillText(`التاريخ: ${letterDate}`, canvas.width - 90, 275);
  ctx.fillText(`المشفوعات: جداول الكميات (٣ صفحة)`, canvas.width - 90, 310);

  // 🟦 BLUE INCOMING STAMP (ختم الوارد الحبري الأزرق المكتوب بخط اليد)
  const stampX = 90;
  const stampY = 215;
  const stampW = 320;
  const stampH = 135;

  ctx.save();
  // Stamp outer rounded border in ink blue
  ctx.strokeStyle = '#1d4ed8'; // Rich ink blue
  ctx.lineWidth = 3.5;
  ctx.strokeRect(stampX, stampY, stampW, stampH);
  ctx.lineWidth = 1;
  ctx.strokeRect(stampX + 4, stampY + 4, stampW - 8, stampH - 8);

  // Printed stamp header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 14px Cairo, sans-serif';
  ctx.fillText('وزارة الاتصالات - وارد الديوان العام', stampX + stampW / 2, stampY + 28);
  ctx.font = 'bold 12px Cairo, sans-serif';
  ctx.fillText('شعبة التسجيل والأرشفة الإلكترونية', stampX + stampW / 2, stampY + 48);

  // Divider inside stamp
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(stampX + 15, stampY + 56);
  ctx.lineTo(stampX + stampW - 15, stampY + 56);
  ctx.stroke();

  // Printed field labels inside stamp
  ctx.textAlign = 'right';
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 13px Cairo, sans-serif';
  ctx.fillText('رقم الوارد :', stampX + stampW - 20, stampY + 82);
  ctx.fillText('تاريخ الاستلام :', stampX + stampW - 20, stampY + 112);

  // ✍️ Handwritten blue ink numbers (رقم الوارد وتاريخ الاستلام بخط اليد الأزرق الحبري)
  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 22px "Amiri", "Reem Kufi", "Segoe Script", cursive, sans-serif';
  ctx.fillText(incomingNum, stampX + stampW - 115, stampY + 84);
  ctx.font = 'bold 18px "Amiri", "Reem Kufi", "Segoe Script", cursive, sans-serif';
  ctx.fillText(receiptDate, stampX + stampW - 130, stampY + 114);

  // Handwritten initials/signature inside stamp
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(stampX + 35, stampY + 105);
  ctx.bezierCurveTo(stampX + 55, stampY + 70, stampX + 70, stampY + 120, stampX + 85, stampY + 80);
  ctx.stroke();

  ctx.restore();

  // Addressed To (إلى / السيد المحترم)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px Cairo, Tahoma, sans-serif';
  ctx.fillText(`إلى / ${recipient}`, canvas.width - 90, 390);
  ctx.font = '18px Cairo, sans-serif';
  ctx.fillText('الموضوع / ' + subject, canvas.width - 90, 440);

  // Highlighting line for subject
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width - 90, 455);
  ctx.lineTo(80, 455);
  ctx.stroke();

  // Greeting
  ctx.font = 'bold 20px Cairo, sans-serif';
  ctx.fillText('السلام عليكم ورحمة الله وبركاته،،،', canvas.width - 90, 510);
  ctx.fillText('تحية طيبة وبعد:', canvas.width - 90, 545);

  // Body Paragraphs (Clean typography)
  ctx.font = '17px Cairo, Tahoma, sans-serif';
  ctx.fillStyle = '#1e293b';

  const paragraphs = [
    'بالإشارة إلى كتابكم ذي العدد (م.ع/4502) المؤرخ في 2026/04/28 المتضمن طلب تخصيص موازنة تشغيلية لمنظومة الأرشفة،',
    'نود إعلامكم بحصول موافقة معالي الوزير على تخصيص مبلغ وقدره (480,000 ريال/دينار) ضمن بند التجهيزات والتحول الرقمي.',
    'وتشمل المرحلة توريد ماسحات ضوئية فائقة السرعة من طراز (Fujitsu ScanSnap Fi-8170) متوافقة مع نظم استخراج البيانات التلقائية،',
    'إضافة إلى تفعيل منظومة التعرف الضوئي على الحروف (OCR) لقراءة أختام الوارد الزرقاء وتوثيق أرقام الكتب إلكترونياً دون الحاجة للتدخل اليدوي.',
    'يرجى التفضل بالاطلاع وتوجيه المعنيين لديكم في دائرة تقنية المعلومات والمشتريات للشروع في إجراءات التعاقد واستلام الشحنة الأولى،',
    'وموافاتنا بتقرير الإنجاز الدوري في موعد أقصاه 2026/06/15 لاتخاذ اللازم أصولياً.',
  ];

  let currentY = 600;
  for (const para of paragraphs) {
    ctx.fillText(para, canvas.width - 90, currentY);
    currentY += 42;
  }

  // Keywords & Reference numbers highlighted box (Page 1 summary footer)
  ctx.fillStyle = '#f1f5f9';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.fillRect(80, currentY + 25, canvas.width - 160, 115);
  ctx.strokeRect(80, currentY + 25, canvas.width - 160, 115);
  
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px Cairo, sans-serif';
  ctx.fillText('بيانات الاستخراج الذكي والأرشفة (AI Document Extraction):', canvas.width - 100, currentY + 58);
  ctx.font = '15px Cairo, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('• الكلمات المفتاحية: ميزانية تشغيلية ، ماسحات ضوئية ، أرشفة ذكية ، تحول رقمي ، Fujitsu ، تقرير إنجاز', canvas.width - 100, currentY + 90);
  ctx.fillText('• المبالغ والأرقام: أمر إداري م.ع/4502 | مبلغ 480,000 | موعد تسليم 2026/06/15', canvas.width - 100, currentY + 120);

  // Official Signature Block
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px Cairo, Tahoma, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('وتفضلوا بقبول وافر التقدير والاحترام...', 120, currentY + 190);

  ctx.textAlign = 'center';
  ctx.font = 'bold 21px Cairo, Tahoma, sans-serif';
  ctx.fillText('د. عبد الرحمن المنصور', 280, currentY + 250);
  ctx.font = '17px Cairo, Tahoma, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('مدير عام دائرة الموازنة والتخطيط', 280, currentY + 285);

  // Red Official Department Stamp (Left bottom)
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(280, currentY + 375, 65, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 14px Cairo, sans-serif';
  ctx.fillText('الختم الرسمي المعتمد', 280, currentY + 370);
  ctx.fillText('وزارة التخطيط والمالية', 280, currentY + 395);

  // Page Indicator Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '14px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('صفحة 1 من 2 - النسخة الإلكترونية المعتمدة', canvas.width / 2, canvas.height - 70);

  // Barcode representation on footer
  ctx.fillStyle = '#0f172a';
  for (let i = 0; i < 40; i++) {
    const barWidth = i % 3 === 0 ? 4 : 2;
    ctx.fillRect(canvas.width - 350 + i * 6, canvas.height - 110, barWidth, 35);
  }
  ctx.font = '13px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`DOC-ARCH-${incomingNum.replace('/', '-')}-2026`, canvas.width - 110, canvas.height - 65);

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Generate a realistic Arabic official letter canvas (Page 2 - Attachments & Details)
 */
export function generateSampleLetterPage2Canvas(
  letterNum: string = 'وز/أ/892',
  letterDate: string = '2026/05/18'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#faf9f6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border frame
  ctx.strokeStyle = '#2b394a';
  ctx.lineWidth = 3;
  ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

  // Page 2 Header
  ctx.fillStyle = '#1e3a8a';
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px Cairo, sans-serif';
  ctx.fillText('ملحق رقم (١) - جدول المواصفات الفنية وجداول التوزيع والكميات', canvas.width / 2, 120);
  ctx.font = '16px Cairo, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`تابع للكتاب الرسمي رقم (${letterNum}) المؤرخ في ${letterDate}`, canvas.width / 2, 155);

  // Table header
  const startY = 220;
  const colX = [canvas.width - 100, canvas.width - 200, canvas.width - 600, canvas.width - 850, 100];
  
  ctx.fillStyle = '#1e40af';
  ctx.fillRect(100, startY, canvas.width - 200, 45);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Cairo, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ت', colX[0] - 15, startY + 28);
  ctx.fillText('المعدة / الجهاز', colX[1] - 15, startY + 28);
  ctx.fillText('المواصفات الفنية', colX[2] - 15, startY + 28);
  ctx.fillText('العدد / الكمية', colX[3] - 15, startY + 28);

  const tableRows = [
    { num: '١', name: 'ماسح ضوئي مكتبي Fujitsu', spec: 'سرعة 70 صفحة/دقيقة، دقة 600DPI، كاشف الختم الأزرق', qty: '١٢ جهاز' },
    { num: '٢', name: 'خادم معالجة الأرشفة المركزية', spec: 'معالج Xeon 32 Core، ذاكرة 128GB، سعة 24TB NVMe', qty: '٢ خادم' },
    { num: '٣', name: 'رخص برمجيات OCR والذكاء الاصطناعي', spec: 'دعم كامل للغة العربية والتعرف على الخط اليدوي والأختام', qty: '٥٠ رخصة' },
    { num: '٤', name: 'وحدات تخزين احتياطي SAN', spec: 'تشفير AES-256، نسخ تلقائي متطابق في موقعين', qty: '١ منظومة' },
  ];

  let rowY = startY + 45;
  for (let i = 0; i < tableRows.length; i++) {
    const row = tableRows[i];
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(100, rowY, canvas.width - 200, 55);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(100, rowY, canvas.width - 200, 55);

    ctx.fillStyle = '#0f172a';
    ctx.font = '15px Cairo, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(row.num, colX[0] - 15, rowY + 34);
    ctx.fillText(row.name, colX[1] - 15, rowY + 34);
    ctx.font = '14px Cairo, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(row.spec, colX[2] - 15, rowY + 34);
    ctx.font = 'bold 15px Cairo, sans-serif';
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText(row.qty, colX[3] - 15, rowY + 34);

    rowY += 55;
  }

  // Follow-up direct notes section
  rowY += 40;
  ctx.fillStyle = '#eff6ff';
  ctx.strokeStyle = '#bfdbfe';
  ctx.fillRect(100, rowY, canvas.width - 200, 180);
  ctx.strokeRect(100, rowY, canvas.width - 200, 180);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 17px Cairo, sans-serif';
  ctx.fillText('توجيهات العمل والمتابعة الفنية:', canvas.width - 130, rowY + 35);

  ctx.font = '15px Cairo, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('١. يتم تسليم الأجهزة في مخازن الوزارة مع التفتيش الفني والمطابقة.', canvas.width - 130, rowY + 70);
  ctx.fillText('٢. يلتزم المورد بتقديم تدريب ميداني لمسؤولي الأرشيف لمدة أسبوع كامل.', canvas.width - 130, rowY + 105);
  ctx.fillText('٣. يتم ربط الماسحات مباشرة بقاعدة البيانات المركزية لضمان عدم تكرار الكتب المسجلة.', canvas.width - 130, rowY + 140);

  // Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '14px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('صفحة 2 من 2 - نهاية المرفقات', canvas.width / 2, canvas.height - 70);

  return canvas.toDataURL('image/jpeg', 0.9);
}
