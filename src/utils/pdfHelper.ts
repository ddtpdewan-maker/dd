import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker URL
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF Worker setup fallback:', e);
}

/**
 * Renders the first N pages (default 2) of a PDF to base64 image data URLs
 */
export async function convertPdfToImages(pdfData: ArrayBuffer | Uint8Array, maxPages: number = 2): Promise<string[]> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdfDoc = await loadingTask.promise;
    const numPages = Math.min(pdfDoc.numPages, maxPages);
    const images: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 }); // High resolution for OCR

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
 * Generate a realistic Arabic official letter canvas with authentic blue stamp and handwritten text for demonstration
 */
export function generateSampleIncomingLetterCanvas(
  incomingNum: string = '1452/و',
  letterNum: string = 'وز/أ/892',
  letterDate: string = '2026/05/18',
  receiptDate: string = '2026/05/20',
  subject: string = 'بشأن تخصيص الميزانية التشغيلية وتوريد أجهزة المسح الضوئي',
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
  ctx.font = 'bold 18px Cairo, Tahoma, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`الـعـدد (رقم الصادر): ${letterNum}`, canvas.width - 90, 245);
  ctx.fillText(`الـتـاريـخ: ${letterDate}`, canvas.width - 90, 280);
  ctx.fillText(`المـرفـقـات: قرص مدمج + تقرير دراسة الجدوى (25 صفحة)`, canvas.width - 90, 315);
  ctx.fillText(`درجة الأهمية: عاجل وسري للغاية`, canvas.width - 90, 350);

  // =========================================================
  // 🟦 BLUE INCOMING STAMP (ختم الوارد الأزرق مع خط يدوي)
  // =========================================================
  const stampX = 90;
  const stampY = 220;
  const stampW = 320;
  const stampH = 170;

  // Stamp outer box - realistic royal blue ink color
  ctx.save();
  ctx.translate(stampX + stampW / 2, stampY + stampH / 2);
  ctx.rotate(-0.035); // Subtle authentic stamp rotation
  ctx.translate(-(stampX + stampW / 2), -(stampY + stampH / 2));

  // Stamp double border in vivid blue
  ctx.strokeStyle = '#1d4ed8';
  ctx.lineWidth = 4;
  ctx.strokeRect(stampX, stampY, stampW, stampH);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(stampX + 6, stampY + 6, stampW - 12, stampH - 12);

  // Stamp header text (printed)
  ctx.fillStyle = '#1e40af';
  ctx.textAlign = 'center';
  ctx.font = 'bold 17px Cairo, sans-serif';
  ctx.fillText('وارد ديوان الوزارة العام', stampX + stampW / 2, stampY + 32);
  ctx.font = '13px Cairo, sans-serif';
  ctx.fillText('شعبة التسجيل والتوثيق الإلكتروني', stampX + stampW / 2, stampY + 52);

  // Stamp grid lines
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(stampX + 10, stampY + 60);
  ctx.lineTo(stampX + stampW - 10, stampY + 60);
  ctx.moveTo(stampX + 10, stampY + 110);
  ctx.lineTo(stampX + stampW - 10, stampY + 110);
  ctx.moveTo(stampX + stampW / 2, stampY + 60);
  ctx.lineTo(stampX + stampW / 2, stampY + stampH - 10);
  ctx.stroke();

  // Stamp labels (printed)
  ctx.textAlign = 'right';
  ctx.font = 'bold 14px Cairo, sans-serif';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText('رقم الوارد:', stampX + stampW - 18, stampY + 85);
  ctx.fillText('تاريخ الاستلام:', stampX + stampW - 18, stampY + 135);

  // ✍️ HANDWRITTEN NUMBERS & DATE INSIDE STAMP (بخط اليد بقلم حبر أزرق داكن)
  ctx.fillStyle = '#172554';
  ctx.font = 'italic bold 24px "Segoe Script", "Comic Sans MS", "Caveat", cursive, sans-serif';
  ctx.textAlign = 'center';
  // Handwritten incoming number
  ctx.fillText(incomingNum, stampX + stampW / 4, stampY + 92);
  // Handwritten receipt date
  ctx.font = 'italic bold 19px "Segoe Script", "Comic Sans MS", cursive, sans-serif';
  ctx.fillText(receiptDate, stampX + stampW / 4, stampY + 142);

  // Signature doodle in stamp
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(stampX + 30, stampY + 155);
  ctx.bezierCurveTo(stampX + 60, stampY + 145, stampX + 80, stampY + 165, stampX + 110, stampY + 150);
  ctx.stroke();

  ctx.restore();

  // Recipient Greeting
  ctx.textAlign = 'right';
  ctx.font = 'bold 22px Cairo, Tahoma, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`إلـى / ${recipient} المحترم`, canvas.width - 90, 440);

  // Subject line with highlight bar
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(80, 480, canvas.width - 160, 50);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(80, 480, canvas.width - 160, 50);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px Cairo, Tahoma, sans-serif';
  ctx.fillText(`م / ${subject}`, canvas.width - 100, 513);

  // Body text of official letter
  ctx.font = '19px Cairo, Tahoma, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('تحية طيبة وبعد ،،', canvas.width - 90, 580);

  const paragraphs = [
    'إشارة إلى الأمر الإداري رقم (م.ع/4502) الصادر بتاريخ 2026/04/10، والخاص بالخطة الوطنية للتحول الرقمي والأرشفة الذكية،',
    'نود إعلامكم بأنه تمت الموافقة النهائية على تخصيص مبلغ وقدره (480,000) أربعمائة وثمانون ألف ريال/دينار لتنفيذ المرحلة الأولى.',
    'وتشمل المرحلة توريد ماسحات ضوئية فائقة السرعة من طراز (Fujitsu ScanSnap Fi-8170) متوافقة مع نظم استخراج البيانات التلقائية،',
    'إضافة إلى تفعيل منظومة التعرف الضوئي على الحروف (OCR) لقراءة أختام الوارد الزرقاء وتوثيق أرقام الكتب إلكترونياً دون الحاجة للتدخل اليدوي.',
    'يرجى التفضل بالاطلاع وتوجيه المعنيين لديكم في دائرة تقنية المعلومات والمشتريات للشروع في إجراءات التعاقد واستلام الشحنة الأولى،',
    'وموافاتنا بتقرير الإنجاز الدوري في موعد أقصاه 2026/06/15 لاتخاذ اللازم أصولياً.',
  ];

  let currentY = 630;
  for (const para of paragraphs) {
    ctx.fillText(para, canvas.width - 90, currentY);
    currentY += 45;
  }

  // Keywords & Reference numbers highlighted box (Page 1 summary footer)
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(80, currentY + 30, canvas.width - 160, 110);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px Cairo, sans-serif';
  ctx.fillText('بيانات المراجعة السريعة (شعبة الأرشفة):', canvas.width - 100, currentY + 65);
  ctx.font = '15px Cairo, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('• الكلمات المفتاحية: ميزانية تشغيلية ، ماسحات ضوئية ، أرشفة ذكية ، تحول رقمي ، Fujitsu ، تقرير إنجاز', canvas.width - 100, currentY + 95);
  ctx.fillText('• المبالغ والأرقام: أمر إداري م.ع/4502 | مبلغ 480,000 | موعد تسليم 2026/06/15', canvas.width - 100, currentY + 125);

  // Official Signature Block
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px Cairo, Tahoma, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('وتفضلوا بقبول وافر التقدير والاحترام...', 120, currentY + 200);

  ctx.textAlign = 'center';
  ctx.font = 'bold 21px Cairo, Tahoma, sans-serif';
  ctx.fillText('د. عبد الرحمن المنصور', 280, currentY + 260);
  ctx.font = '17px Cairo, Tahoma, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('مدير عام دائرة الموازنة والتخطيط', 280, currentY + 295);

  // Red Official Department Stamp (Left bottom)
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(280, currentY + 390, 65, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 14px Cairo, sans-serif';
  ctx.fillText('الختم الرسمي المعتمد', 280, currentY + 385);
  ctx.fillText('وزارة التخطيط والمالية', 280, currentY + 410);

  // Barcode representation on footer
  ctx.fillStyle = '#0f172a';
  for (let i = 0; i < 40; i++) {
    const barWidth = (i % 3 === 0 ? 4 : 2);
    ctx.fillRect(canvas.width - 350 + (i * 6), canvas.height - 120, barWidth, 40);
  }
  ctx.font = '13px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`DOC-ARCH-${incomingNum.replace('/', '-')}-2026`, canvas.width - 110, canvas.height - 65);

  return canvas.toDataURL('image/jpeg', 0.9);
}
