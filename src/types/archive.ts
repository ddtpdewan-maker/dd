export type DocumentType = 'وارد' | 'صادر' | 'مذكرة داخلية' | 'تعميم';

export type PriorityLevel =
  | 'عادي'
  | 'عاجل'
  | 'عاجل جداً'
  | 'سري'
  | 'سري للغاية'
  | 'عاجل وسري للغاية'
  | 'هام للمتابعة';

export type DocumentStatus = 'جديد' | 'قيد الإجراء' | 'تم الرد' | 'مؤرشف';

export interface BlueStampData {
  detected: boolean;
  handwrittenIncomingNumber: string;
  handwrittenReceiptDate: string;
  stampPrintedText?: string;
  confidence?: number;
  notes?: string;
  boundingBox?: {
    topPercent: number;
    leftPercent: number;
    widthPercent: number;
    heightPercent: number;
  };
}

export interface ImportantNumber {
  label: string;
  value: string;
}

export interface FollowUpAssignee {
  entityName: string;
  assignedAction: string;
  deadline?: string;
  status?: 'قيد المتابعة' | 'مكتمل' | 'عاجل';
}

export interface ArchivedLetter {
  id: string;
  type: DocumentType;
  incomingNumber: string; // رقم الوارد
  outgoingNumber: string; // رقم الصادر أو رقم الإشارة
  letterDate: string; // تاريخ الكتاب
  receiptDate: string; // تاريخ الاستلام الفعلي أو تاريخ الختم
  subject: string; // الموضوع
  senderEntity: string; // الجهة الصادرة / المرسل
  recipientEntity: string; // الجهة الموجه إليها / المرسل إليه
  priority: PriorityLevel; // الأهمية
  category: string; // التصنيف الموضوعي
  status: DocumentStatus; // حالة الكتاب
  summary: string; // الملخص التنفيذي
  actionRequired?: string; // الإجراء المطلوب
  keywords: string[]; // الكلمات المفتاحية المستخرجة
  importantNumbers: ImportantNumber[]; // الأرقام والمبالغ الهامة
  followUpAssignees?: FollowUpAssignee[]; // قائمة المتابعين
  attachments?: string[]; // المرافقات والمرفقات
  followUpNotes?: string;
  blueStamp: BlueStampData; // تفاصيل الختم الأزرق والخط اليدوي
  pageImages: string[]; // جميع صور صفحات الكتاب للنسخة الكاملة
  pageCount?: number; // إجمالي عدد صفحات الكتاب الكامل
  pdfFileName?: string;
  pdfFileSize?: number;
  pdfDataUrl?: string; // بيانات الملف الكاملة
  isDuplicateCopy?: boolean; // هل تم حفظه كنسخة مكررة مقبولة
  duplicateOfId?: string; // معرّف الكتاب الأصلي إن وجد
  extractedSnippet?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateLetter: ArchivedLetter | null;
  matchType: 'incomingNumber' | 'outgoingNumber' | 'exactMatch' | 'subjectAndDate' | 'none';
  matchDescription: string;
}

export interface LetterFilter {
  query: string;
  type?: string;
  priority?: string;
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  onlyBlueStamp?: boolean;
  senderEntity?: string;
  recipientEntity?: string;
  hasImportantNumbers?: boolean;
  followUpAssignee?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  letterId?: string;
  type: 'success' | 'info' | 'warning' | 'urgent';
  timestamp: string;
  read: boolean;
}
