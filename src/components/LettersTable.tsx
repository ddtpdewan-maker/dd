import React, { useState } from 'react';
import {
  Inbox,
  Send,
  Eye,
  Trash2,
  FileSpreadsheet,
  Stamp,
  Tag,
  Hash,
  Clock,
  Building2,
  Calendar,
  AlertCircle,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowUpDown,
  Layers,
  LayoutGrid,
  List,
  Scan,
  Check,
  RotateCcw,
} from 'lucide-react';
import { ArchivedLetter, PriorityLevel } from '../types/archive';

interface LettersTableProps {
  letters: ArchivedLetter[];
  onSelectLetter: (letter: ArchivedLetter) => void;
  onDeleteLetter: (id: string) => void;
  onExportSingleLetter: (letter: ArchivedLetter) => void;
  onOpenNewModal: () => void;
  onOpenScannerModal?: () => void;
  onGenerateSample?: () => void;
}

export const LettersTable: React.FC<LettersTableProps> = ({
  letters,
  onSelectLetter,
  onDeleteLetter,
  onExportSingleLetter,
  onOpenNewModal,
  onOpenScannerModal,
  onGenerateSample,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState<'letterDate' | 'createdAt' | 'incomingNumber' | 'priority'>('letterDate');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const incomingCount = letters.filter((l) => l.type === 'وارد').length;
  const outgoingCount = letters.filter((l) => l.type === 'صادر').length;
  const blueStampCount = letters.filter((l) => l.blueStamp?.detected).length;

  // Extract unique categories
  const categories = Array.from(new Set(letters.map((l) => l.category).filter(Boolean)));

  // Filter & Sort
  const filteredLetters = letters
    .filter((l) => {
      if (selectedCategory !== 'all' && l.category !== selectedCategory) return false;
      if (selectedPriority !== 'all' && l.priority !== selectedPriority) return false;
      return true;
    })
    .sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (sortAsc) {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

  const getPriorityBadge = (priority: PriorityLevel) => {
    if (priority.includes('سري') || priority.includes('عاجل جداً')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="w-3 h-3 text-red-600" />
          {priority}
        </span>
      );
    }
    if (priority.includes('عاجل') || priority.includes('هام')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3 h-3 text-amber-600" />
          {priority}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
        {priority}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 px-8 pb-8 overflow-y-auto">
      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Main Bento Cell: Recent Archive Table (Col Span 2) */}
        <div className="xl:col-span-2 bg-white rounded-[2rem] p-6 shadow-xs border border-gray-100 flex flex-col min-h-[480px]">
          {/* Card Header with Bento Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-800 tracking-tight">أرشيف الكتب الأخير</h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
                  وارد: {incomingCount}
                </span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold">
                  صادر: {outgoingCount}
                </span>
              </div>
            </div>

            {/* Quick Filter & View Mode Controls */}
            <div className="flex items-center gap-2 text-xs">
              {/* Category selector */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1 text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">كافة التصنيفات</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* View Switcher */}
              <div className="flex items-center bg-gray-50 rounded-xl p-0.5 border border-gray-200">
                <button
                  onClick={() => setViewMode('table')}
                  title="عرض كجدول"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-white shadow-2xs text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-800'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title="عرض كبطاقات"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white shadow-2xs text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-800'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Table / Grid Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {filteredLetters.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <h4 className="font-bold text-sm text-gray-700">لا توجد سجلات مطابقة</h4>
                <p className="text-xs text-gray-400 mt-1 mb-4">يمكنك إضافة كتاب جديد أو مسح وثيقة ضوئياً</p>
                <button
                  onClick={onOpenNewModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  + إضافة كتاب رسمي
                </button>
              </div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto rounded-2xl border border-gray-100 flex-1">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 border-b border-gray-100 font-semibold select-none">
                      <th className="p-3.5">رقم الوارد/الصادر</th>
                      <th className="p-3.5">الموضوع والجهة</th>
                      <th className="p-3.5">التاريخ</th>
                      <th className="p-3.5">الختم الأزرق (OCR)</th>
                      <th className="p-3.5">الكلمات المفتاحية</th>
                      <th className="p-3.5 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredLetters.map((letter) => (
                      <tr
                        key={letter.id}
                        onClick={() => onSelectLetter(letter)}
                        className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      >
                        {/* Number & Type */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            {letter.type === 'وارد' ? (
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            )}
                            <div className="font-mono font-bold text-gray-900">
                              {letter.incomingNumber && letter.incomingNumber !== '-' ? (
                                <span className="text-blue-600">{letter.incomingNumber}</span>
                              ) : (
                                <span className="text-emerald-600">{letter.outgoingNumber}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            كتاب {letter.type}
                          </div>
                        </td>

                        {/* Subject & Entity */}
                        <td className="p-3.5 max-w-xs">
                          <div className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {letter.subject}
                          </div>
                          <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                            <span>{letter.senderEntity || letter.recipientEntity || 'جهة رسمية'}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="p-3.5 font-mono text-gray-600 whitespace-nowrap">
                          {letter.letterDate}
                        </td>

                        {/* Blue Stamp status */}
                        <td className="p-3.5">
                          {letter.blueStamp?.detected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200/60">
                              <Stamp className="w-3 h-3 text-blue-500" />
                              <span>{letter.blueStamp.handwrittenIncomingNumber || 'مكتشف'}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400">-</span>
                          )}
                        </td>

                        {/* Keywords */}
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {letter.keywords && letter.keywords.length > 0 ? (
                              letter.keywords.slice(0, 2).map((kw, i) => (
                                <span
                                  key={i}
                                  className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600 font-medium"
                                >
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-gray-400">عام</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onSelectLetter(letter)}
                              title="معاينة الوثيقة"
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onExportSingleLetter(letter)}
                              title="تصدير Excel"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteLetter(letter.id)}
                              title="حذف"
                              className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1">
                {filteredLetters.map((letter) => (
                  <div
                    key={letter.id}
                    onClick={() => onSelectLetter(letter)}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:border-blue-200 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            letter.type === 'وارد'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          كتاب {letter.type}
                        </span>
                        {getPriorityBadge(letter.priority)}
                      </div>
                      <h4 className="font-bold text-xs text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {letter.subject}
                      </h4>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                        {letter.summary || letter.senderEntity}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span className="font-mono">{letter.letterDate}</span>
                      <span className="font-mono font-bold text-blue-600">
                        {letter.incomingNumber || letter.outgoingNumber}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Bento Column: OCR Preview & Scanner Station Cards */}
        <div className="flex flex-col gap-6">
          {/* Bento Card 2: Live OCR & Blue Stamp Preview */}
          <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-800">معاينة OCR والختم الأزرق</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                  الخط اليدوي
                </span>
              </div>

              {/* Realistic Document Visual Representation */}
              <div className="h-44 bg-gray-50 rounded-2xl relative border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center p-2">
                <div className="w-36 h-40 bg-white shadow-md rotate-2 border border-gray-200 relative p-2.5 rounded-lg flex flex-col justify-between">
                  {/* Header mock lines */}
                  <div className="space-y-1">
                    <div className="w-12 h-1.5 bg-gray-200 rounded" />
                    <div className="w-20 h-1 bg-gray-100 rounded" />
                  </div>

                  {/* Stamp Highlight Box with Handwritten details */}
                  <div className="absolute top-2 right-2 border-2 border-blue-500 bg-blue-50/80 p-1.5 rounded-md shadow-2xs">
                    <div className="text-[8px] text-blue-900 font-extrabold leading-tight">
                      رقم الوارد: ٨٤٠ / و<br />
                      تاريخ: ٢٠ / ٠٥
                    </div>
                  </div>

                  {/* Body mock lines */}
                  <div className="space-y-1 mt-6">
                    <div className="w-full h-1 bg-gray-200 rounded" />
                    <div className="w-5/6 h-1 bg-gray-200 rounded" />
                    <div className="w-4/6 h-1 bg-gray-200 rounded" />
                  </div>
                </div>

                {/* Scan Quality Pill Bar */}
                <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-xs p-2 rounded-xl shadow-2xs border border-gray-100 text-[11px]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-500">دقة استخراج الختم الأزرق:</span>
                    <span className="text-emerald-600 font-bold font-mono">98.4%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full w-[98%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions for OCR */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={onGenerateSample}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                تجربة نموذج
              </button>
              <button
                onClick={onOpenNewModal}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                رفع كتاب (OCR)
              </button>
            </div>
          </div>

          {/* Bento Card 3: Deep Navy Scanner Station Link */}
          <div className="bg-[#1a2a40] rounded-[2rem] p-6 shadow-xl text-white flex flex-col justify-between overflow-hidden relative min-h-[220px]">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold opacity-95">حالة الماسح الضوئي</h2>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">متصل - جاهز للمسح المباشر من الكاميرا / Scanner</p>
            </div>

            <div className="flex items-center justify-center my-3 relative z-10">
              <div className="w-20 h-20 rounded-full border-4 border-blue-500/60 bg-blue-600/20 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Scan className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <button
              onClick={onOpenScannerModal}
              className="bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-blue-600/30 relative z-10 cursor-pointer flex items-center justify-center gap-2"
            >
              <Scan className="w-4 h-4" />
              <span>بدء مسح جديد (Scan)</span>
            </button>

            {/* Ambient Background Glow */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-40 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
