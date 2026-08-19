import React from 'react';
import {
  Inbox,
  Send,
  FolderArchive,
  Search,
  BarChart3,
  ScanLine,
  Settings,
  Stamp,
  ShieldCheck,
  FileSpreadsheet,
  PlusCircle,
  Layers,
} from 'lucide-react';
import { ArchivedLetter } from '../types/archive';

export type NavTab = 'all' | 'incoming' | 'outgoing' | 'search' | 'stats' | 'scanner' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  letters: ArchivedLetter[];
  onOpenNewDocument: () => void;
  onExportExcel: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  letters,
  onOpenNewDocument,
  onExportExcel,
}) => {
  const incomingCount = letters.filter((l) => l.type === 'وارد').length;
  const outgoingCount = letters.filter((l) => l.type === 'صادر').length;
  const blueStampCount = letters.filter((l) => l.blueStamp?.detected).length;
  const urgentCount = letters.filter((l) => l.priority.includes('عاجل') || l.priority.includes('سري')).length;

  return (
    <aside className="w-64 bg-[#1a2a40] text-white flex flex-col p-5 shadow-2xl border-l border-white/5 shrink-0 select-none">
      {/* Brand & System Logo */}
      <div className="mb-6 flex items-center gap-3 p-1">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-500/30 text-white">
          أ
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            أرشيف الذكي
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/20">
              OCR
            </span>
          </h1>
          <p className="text-[11px] text-gray-400">أرشفة الكتب الرسمية</p>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="space-y-2 mb-4">
        <button
          id="btn-sidebar-add-letter"
          onClick={onOpenNewDocument}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إضافة كتاب جديد (PDF)</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        <div className="px-3 pt-1 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          سجلات المراسلات
        </div>

        {/* All Archive */}
        <div
          id="nav-tab-all"
          onClick={() => onTabChange('all')}
          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 ${
            currentTab === 'all'
              ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <FolderArchive className="w-4 h-4" />
            <span className="text-xs">كافة السجلات</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-mono">
            {letters.length}
          </span>
        </div>

        {/* Incoming Letters */}
        <div
          id="nav-tab-incoming"
          onClick={() => onTabChange('incoming')}
          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 ${
            currentTab === 'incoming'
              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/40'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Inbox className="w-4 h-4" />
            <span className="text-xs">الكتب الواردة</span>
          </div>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
              currentTab === 'incoming' ? 'bg-blue-800 text-white' : 'bg-blue-950/80 text-blue-300'
            }`}
          >
            {incomingCount}
          </span>
        </div>

        {/* Outgoing Letters */}
        <div
          id="nav-tab-outgoing"
          onClick={() => onTabChange('outgoing')}
          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 ${
            currentTab === 'outgoing'
              ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-900/40'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Send className="w-4 h-4" />
            <span className="text-xs">الكتب الصادرة</span>
          </div>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
              currentTab === 'outgoing' ? 'bg-amber-800 text-white' : 'bg-amber-950/80 text-amber-300'
            }`}
          >
            {outgoingCount}
          </span>
        </div>

        <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          أدوات الأرشفة والتحليل
        </div>

        {/* Advanced Search */}
        <div
          id="nav-tab-search"
          onClick={() => onTabChange('search')}
          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 ${
            currentTab === 'search'
              ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4" />
            <span className="text-xs">البحث المتقدم</span>
          </div>
        </div>

        {/* Scanner Station */}
        <div
          id="nav-tab-scanner"
          onClick={() => onTabChange('scanner')}
          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 ${
            currentTab === 'scanner'
              ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <ScanLine className="w-4 h-4" />
            <span className="text-xs">محطة المسح الضوئي</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
            جاهز
          </span>
        </div>

        {/* Analytics & Stats */}
        <div
          id="nav-tab-stats"
          onClick={() => onTabChange('stats')}
          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 ${
            currentTab === 'stats'
              ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs">التقارير والإحصائيات</span>
          </div>
          {urgentCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-900/70 text-red-300 font-bold">
              {urgentCount} عاجل
            </span>
          )}
        </div>

        {/* Settings */}
        <div
          id="nav-tab-settings"
          onClick={() => onTabChange('settings')}
          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 ${
            currentTab === 'settings'
              ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4" />
            <span className="text-xs">الإعدادات وOCR</span>
          </div>
        </div>
      </nav>

      {/* Blue Stamp OCR Status Bento Badge */}
      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-3">
        <div className="flex items-center gap-2 mb-1 text-blue-400 font-bold text-xs">
          <Stamp className="w-3.5 h-3.5" />
          <span>الختم الأزرق (OCR)</span>
        </div>
        <p className="text-[10px] text-gray-400 leading-tight">
          قراءة الخط اليدوي للوارد وتاريخ الاستلام من أول صفحتين
        </p>
        <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px]">
          <span className="text-gray-400">أختام مكتشفة:</span>
          <span className="font-bold text-blue-400 font-mono">{blueStampCount} كتاب</span>
        </div>
      </div>

      {/* Bottom Export Excel Bento Action */}
      <div className="pt-3 border-t border-white/10">
        <button
          onClick={onExportExcel}
          className="w-full p-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-center font-bold text-xs text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>تصدير Excel</span>
        </button>
      </div>
    </aside>
  );
};
