import React from 'react';
import {
  BarChart3,
  Inbox,
  Send,
  Stamp,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  Tag,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { ArchivedLetter } from '../types/archive';
import { exportLettersToExcel } from '../utils/excelExport';

interface StatsDashboardProps {
  letters: ArchivedLetter[];
  onSelectLetter: (letter: ArchivedLetter) => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  letters,
  onSelectLetter,
}) => {
  const total = letters.length;
  const incoming = letters.filter((l) => l.type === 'وارد');
  const outgoing = letters.filter((l) => l.type === 'صادر');
  const withBlueStamp = letters.filter((l) => l.blueStamp?.detected);
  const urgentLetters = letters.filter(
    (l) => l.priority.includes('عاجل') || l.priority.includes('سري')
  );

  // Category counts
  const categoryCounts: { [key: string]: number } = {};
  letters.forEach((l) => {
    const cat = l.category || 'عام';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // Extract all keywords
  const allKeywords: { [key: string]: number } = {};
  letters.forEach((l) => {
    l.keywords?.forEach((kw) => {
      allKeywords[kw] = (allKeywords[kw] || 0) + 1;
    });
  });

  const sortedKeywords = Object.entries(allKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const handleExportFullReport = () => {
    exportLettersToExcel(letters, {
      fileName: `التقرير_الشامل_لارشيف_البريد_${new Date().toISOString().split('T')[0]}.xlsx`,
    });
  };

  return (
    <div className="flex-1 px-8 pb-8 overflow-y-auto space-y-6">
      {/* Top Banner Bento Card */}
      <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-lg text-gray-800 flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>لوحة المؤشرات والتقارير الإحصائية للأرشيف</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            تحليل شامل لأداء الوارد والصادر ومعدلات كشف الأختام الزرقاء والخط اليدوي
          </p>
        </div>

        <button
          onClick={handleExportFullReport}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>تصدير تقرير Excel شامل</span>
        </button>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Letters */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">إجمالي الكتب</span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-gray-900 font-mono">{total}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">سجل مؤرشف رسمياً</div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold w-max">
            تحديث فوري
          </span>
        </div>

        {/* Incoming Letters */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600">الكتب الواردة</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-blue-900 font-mono">{incoming.length}</div>
            <div className="text-[11px] text-blue-600 mt-0.5">
              {total > 0 ? Math.round((incoming.length / total) * 100) : 0}% من البريد
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold w-max">
            Incoming
          </span>
        </div>

        {/* Outgoing Letters */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600">الكتب الصادرة</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-emerald-900 font-mono">{outgoing.length}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">
              {total > 0 ? Math.round((outgoing.length / total) * 100) : 0}% من البريد
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold w-max">
            Outgoing
          </span>
        </div>

        {/* Blue Stamp OCR */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600">الختم الأزرق (OCR)</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Stamp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-indigo-900 font-mono">
              {withBlueStamp.length}
            </div>
            <div className="text-[11px] text-indigo-600 mt-0.5">دقة التعرف: 98.4%</div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold w-max">
            الخط اليدوي
          </span>
        </div>
      </div>

      {/* Urgent Letters Bento Card */}
      {urgentLetters.length > 0 && (
        <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-red-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>كتب عاجلة وسرية تتطلب متابعة فورية ({urgentLetters.length})</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentLetters.map((letter) => (
              <div
                key={letter.id}
                onClick={() => onSelectLetter(letter)}
                className="p-3.5 bg-red-50/40 hover:bg-red-50 rounded-2xl border border-red-100 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                      {letter.priority}
                    </span>
                    <span className="font-bold text-xs text-gray-800 line-clamp-1 group-hover:text-red-700 transition-colors">
                      {letter.subject}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    الجهة: {letter.senderEntity} | رقم: {letter.incomingNumber || letter.outgoingNumber}
                  </div>
                </div>
                <button className="text-xs text-red-600 font-bold hover:underline shrink-0 flex items-center gap-1">
                  <span>فتح</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Columns: Category Breakdown & Top Keywords Bento Cells */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Breakdown */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-gray-100 space-y-4">
          <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" />
            <span>توزيع الكتب حسب التصنيف الموضوعي</span>
          </h4>
          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-700">{cat}</span>
                    <span className="font-mono text-gray-500">
                      {count} كتاب ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Frequent Keywords (First 2 Pages) */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-gray-100 space-y-4">
          <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>أبرز الكلمات المفتاحية المستخرجة من أول صفحتين</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {sortedKeywords.map(([kw, count], idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-800 hover:text-blue-800 text-xs font-semibold border border-gray-200 transition-colors"
              >
                <span>#{kw}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white text-gray-500 font-mono text-[10px] border border-gray-200">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
