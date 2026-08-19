import * as XLSX from 'xlsx';
import { ArchivedLetter } from '../types/archive';

export interface ExportOptions {
  fileName?: string;
  title?: string;
  filterDescription?: string;
}

/**
 * Export letters list to Excel (.xlsx) file with professional formatting
 */
export function exportLettersToExcel(letters: ArchivedLetter[], options: ExportOptions = {}) {
  const dateStr = new Date().toISOString().split('T')[0];
  const defaultFileName = `سجل_ارشيف_البريد_${dateStr}.xlsx`;
  const fileName = options.fileName || defaultFileName;

  // Prepare main rows data with detailed metadata
  const rows = letters.map((item, index) => {
    return {
      'م': index + 1,
      'نوع الكتاب': item.type,
      'رقم الوارد': item.incomingNumber || '-',
      'رقم الصادر / الإشارة': item.outgoingNumber || '-',
      'تاريخ الكتاب': item.letterDate || '-',
      'تاريخ الاستلام': item.receiptDate || '-',
      'الجهة الصادرة (المرسل)': item.senderEntity || '-',
      'الجهة الموجه إليها (المرسل إليه)': item.recipientEntity || '-',
      'موضوع الكتاب': item.subject || '-',
      'درجة الأهمية / السرية': item.priority || 'عادي',
      'التصنيف الموضوعي': item.category || 'عام',
      'حالة المعاملة': item.status || 'جديد',
      'الختم الأزرق والخط اليدوي': item.blueStamp?.detected
        ? `نعم (رقم الوارد اليدوي: ${item.blueStamp.handwrittenIncomingNumber || '-'} | تاريخ: ${item.blueStamp.handwrittenReceiptDate || '-'})`
        : 'لا يوجد',
      'الكلمات المفتاحية': (item.keywords || []).join(' ، '),
      'الأرقام والمبالغ الهامة': (item.importantNumbers || [])
        .map((num) => `${num.label}: ${num.value}`)
        .join(' | '),
      'الإجراء المطلوب': item.actionRequired || '-',
      'الملخص التنفيذي': item.summary || '-',
      'تاريخ الإضافة للأرشيف': item.createdAt ? new Date(item.createdAt).toLocaleString('ar-EG') : '-',
    };
  });

  // Create main worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // م
    { wch: 12 }, // نوع الكتاب
    { wch: 15 }, // رقم الوارد
    { wch: 18 }, // رقم الصادر
    { wch: 14 }, // تاريخ الكتاب
    { wch: 14 }, // تاريخ الاستلام
    { wch: 25 }, // الجهة الصادرة
    { wch: 25 }, // الجهة الموجه إليها
    { wch: 35 }, // الموضوع
    { wch: 15 }, // الأهمية
    { wch: 15 }, // التصنيف
    { wch: 14 }, // الحالة
    { wch: 40 }, // الختم الأزرق
    { wch: 30 }, // الكلمات المفتاحية
    { wch: 35 }, // الأرقام والمبالغ
    { wch: 20 }, // الإجراء
    { wch: 45 }, // الملخص
    { wch: 22 }, // تاريخ الإضافة
  ];

  // Set Right-to-Left (RTL) mode for Arabic Excel compatibility
  if (!worksheet['!views']) {
    worksheet['!views'] = [{ rightToLeft: true }];
  }

  // Create a summary worksheet with stats
  const totalLetters = letters.length;
  const incomingCount = letters.filter((l) => l.type === 'وارد').length;
  const outgoingCount = letters.filter((l) => l.type === 'صادر').length;
  const blueStampCount = letters.filter((l) => l.blueStamp?.detected).length;
  const urgentCount = letters.filter((l) => l.priority.includes('عاجل') || l.priority.includes('سري')).length;

  const summaryRows = [
    { 'البيان': 'إجمالي السجلات والكتب', 'القيمة': totalLetters },
    { 'البيان': 'عدد الكتب الواردة', 'القيمة': incomingCount },
    { 'البيان': 'عدد الكتب الصادرة', 'القيمة': outgoingCount },
    { 'البيان': 'كتب تحتوي على ختم أزرق وخط يدوي', 'القيمة': blueStampCount },
    { 'البيان': 'كتب عاجلة / سرية', 'القيمة': urgentCount },
    { 'البيان': 'تاريخ ووقت استخراج التقرير', 'القيمة': new Date().toLocaleString('ar-EG') },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 35 }, { wch: 25 }];
  summarySheet['!views'] = [{ rightToLeft: true }];

  // Create workbook and append sheets
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل الأرشيف');
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص إحصائي');

  // Write file and trigger download
  XLSX.writeFile(workbook, fileName);
}
