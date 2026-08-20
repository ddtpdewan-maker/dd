import React, { useState } from 'react';
import {
  Search,
  X,
  Filter,
  Calendar,
  Building2,
  Tag,
  Hash,
  Stamp,
  RotateCcw,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { ArchivedLetter, LetterFilter } from '../types/archive';
import { exportLettersToExcel } from '../utils/excelExport';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilter: (filter: LetterFilter) => void;
  letters: ArchivedLetter[];
}

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  isOpen,
  onClose,
  onApplyFilter,
  letters,
}) => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [priority, setPriority] = useState('all');
  const [category, setCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [onlyBlueStamp, setOnlyBlueStamp] = useState(false);
  const [senderEntity, setSenderEntity] = useState('');
  const [recipientEntity, setRecipientEntity] = useState('');
  const [followUpAssignee, setFollowUpAssignee] = useState('');

  if (!isOpen) return null;

  // Compute live matched count
  const matchedLetters = letters.filter((l) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      const matchSub = l.subject?.toLowerCase().includes(q);
      const matchInc = l.incomingNumber?.toLowerCase().includes(q);
      const matchOut = l.outgoingNumber?.toLowerCase().includes(q);
      const matchSum = l.summary?.toLowerCase().includes(q);
      const matchStamp = l.blueStamp?.handwrittenIncomingNumber?.toLowerCase().includes(q);
      const matchKw = l.keywords?.some((k) => k.toLowerCase().includes(q));
      const matchNum = l.importantNumbers?.some(
        (n) => n.label.toLowerCase().includes(q) || n.value.toLowerCase().includes(q)
      );
      const matchAssignee = l.followUpAssignees?.some(
        (a) =>
          a.entityName.toLowerCase().includes(q) ||
          a.assignedAction.toLowerCase().includes(q)
      );
      if (
        !matchSub &&
        !matchInc &&
        !matchOut &&
        !matchSum &&
        !matchStamp &&
        !matchKw &&
        !matchNum &&
        !matchAssignee
      ) {
        return false;
      }
    }
    if (type !== 'all' && l.type !== type) return false;
    if (priority !== 'all' && l.priority !== priority) return false;
    if (category !== 'all' && l.category !== category) return false;
    if (onlyBlueStamp && !l.blueStamp?.detected) return false;
    if (dateFrom && l.letterDate < dateFrom) return false;
    if (dateTo && l.letterDate > dateTo) return false;
    if (senderEntity.trim() && !l.senderEntity?.toLowerCase().includes(senderEntity.toLowerCase())) {
      return false;
    }
    if (
      recipientEntity.trim() &&
      !l.recipientEntity?.toLowerCase().includes(recipientEntity.toLowerCase())
    ) {
      return false;
    }
    if (
      followUpAssignee.trim() &&
      !l.followUpAssignees?.some(
        (a) =>
          a.entityName.toLowerCase().includes(followUpAssignee.toLowerCase()) ||
          a.assignedAction.toLowerCase().includes(followUpAssignee.toLowerCase())
      )
    ) {
      return false;
    }
    return true;
  });

  const handleApply = () => {
    onApplyFilter({
      query,
      type: type === 'all' ? undefined : type,
      priority: priority === 'all' ? undefined : priority,
      category: category === 'all' ? undefined : category,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      onlyBlueStamp,
      senderEntity: senderEntity.trim() || undefined,
      recipientEntity: recipientEntity.trim() || undefined,
      followUpAssignee: followUpAssignee.trim() || undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setQuery('');
    setType('all');
    setPriority('all');
    setCategory('all');
    setDateFrom('');
    setDateTo('');
    setOnlyBlueStamp(false);
    setSenderEntity('');
    setRecipientEntity('');
    setFollowUpAssignee('');
  };

  const handleExportFiltered = () => {
    exportLettersToExcel(matchedLetters, {
      fileName: `نتائج_البحث_المتقدم_${new Date().toISOString().split('T')[0]}.xlsx`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                البحث المتقدم والتصفية الذكية
              </h3>
              <p className="text-xs text-slate-500">
                البحث المتقاطع بالأرقام والموضوع وتواريخ وأختام الوارد
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

        {/* Filters Form */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] text-xs">
          {/* Main Keyword Input */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              كلمة البحث (في الموضوع، الملخص، الكلمات المفتاحية، الأرقام)
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب أي كلمة، رقم قرار، مبلغ، أو اسم مسؤول..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">نوع الكتاب</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="all">كافة الأنواع (صادر ووارد)</option>
                <option value="وارد">كتب واردة فقط (Incoming)</option>
                <option value="صادر">كتب صادرة فقط (Outgoing)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">درجة الأهمية / السرية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="all">كافة المستويات</option>
                <option value="عادي">عادي</option>
                <option value="عاجل">عاجل</option>
                <option value="عاجل جداً">عاجل جداً</option>
                <option value="سري">سري</option>
                <option value="عاجل وسري للغاية">عاجل وسري للغاية</option>
                <option value="هام للمتابعة">هام للمتابعة</option>
              </select>
            </div>
          </div>

          {/* Entities */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">الجهة الصادرة (المرسل)</label>
              <input
                type="text"
                value={senderEntity}
                onChange={(e) => setSenderEntity(e.target.value)}
                placeholder="اسم الوزارة / المؤسسة المرسلة..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الجهة الموجه إليها</label>
              <input
                type="text"
                value={recipientEntity}
                onChange={(e) => setRecipientEntity(e.target.value)}
                placeholder="اسم الجهة أو المديرية..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Follow-up Assignee Search Field */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              اسم المتابع أو الجهة المكلفة بالإجراء (نسخة منه إلى / للتنفيذ والمتابعة)
            </label>
            <input
              type="text"
              value={followUpAssignee}
              onChange={(e) => setFollowUpAssignee(e.target.value)}
              placeholder="ابحث باسم الموظف المتابع أو الإدارة المكلفة..."
              className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/40 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">من تاريخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Blue stamp toggle */}
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Stamp className="w-4 h-4 text-blue-600" />
              <div>
                <span className="font-bold text-blue-900 block">
                  الكتب ذات الختم الأزرق والخط اليدوي فقط
                </span>
                <span className="text-[11px] text-blue-700">
                  تصفية الكتب الواردة التي تم التعرف فيها على ختم الوارد اليدوي
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={onlyBlueStamp}
              onChange={(e) => setOnlyBlueStamp(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Matches Counter Bar */}
          <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">النتائج المطابقة للتصفية:</span>
            <span className="font-extrabold text-blue-700 font-mono text-sm">
              {matchedLetters.length} سجل
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>

            <button
              onClick={handleExportFiltered}
              disabled={matchedLetters.length === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير النتائج (Excel)</span>
            </button>
          </div>

          <button
            onClick={handleApply}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>تطبيق التصفية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
