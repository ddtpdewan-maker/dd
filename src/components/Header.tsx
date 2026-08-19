import React from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Bell,
  Volume2,
  VolumeX,
  Sparkles,
  Scan,
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewModal: () => void;
  onOpenScanner: () => void;
  onExportExcel: () => void;
  onGenerateSample: () => void;
  unreadNotificationsCount: number;
  onToggleNotifications: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentViewTitle: string;
  totalLettersCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenNewModal,
  onOpenScanner,
  onExportExcel,
  onGenerateSample,
  unreadNotificationsCount,
  onToggleNotifications,
  soundEnabled,
  onToggleSound,
  currentViewTitle,
  totalLettersCount,
}) => {
  return (
    <header className="px-8 pt-6 pb-4 flex items-center justify-between gap-4 shrink-0 select-none">
      {/* Title & View Info */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2.5">
            <span>{currentViewTitle}</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-gray-700 shadow-2xs border border-gray-100 font-mono">
              {totalLettersCount} سجل
            </span>
          </h2>
        </div>
      </div>

      {/* Center: Bento Pill Search Bar */}
      <div className="flex-1 max-w-xl mx-4">
        <div className="flex items-center bg-white rounded-2xl px-4 py-2 shadow-xs border border-gray-100 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <Search className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث متقدم برقم الوارد، التاريخ، أو الكلمات المفتاحية..."
            className="bg-transparent border-none outline-none w-full text-xs sm:text-sm py-0.5 text-gray-800 placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0 mr-1"
            >
              مسح
            </button>
          )}
        </div>
      </div>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Sample Generator Button for 1-click OCR test */}
        <button
          id="btn-header-sample-doc"
          onClick={onGenerateSample}
          title="إنشاء نموذج كتاب وارد تجريبي بختم أزرق وخط يدوي"
          className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-gray-100 rounded-2xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>نموذج بختم أزرق</span>
        </button>

        {/* Scanner quick button */}
        <button
          id="btn-header-scanner"
          onClick={onOpenScanner}
          title="فتح المسح الضوئي المباشر من الكاميرا / الماسح"
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl shadow-xs transition-all cursor-pointer"
        >
          <Scan className="w-4 h-4 text-blue-600" />
          <span>مسح ضوئي</span>
        </button>

        {/* Sound Toggle */}
        <button
          id="btn-header-sound-toggle"
          onClick={onToggleSound}
          title={soundEnabled ? 'كتم التنبيهات الصوتية' : 'تفعيل التنبيهات الصوتية'}
          className={`p-2.5 rounded-2xl bg-white shadow-xs border border-gray-100 transition-all cursor-pointer ${
            soundEnabled
              ? 'text-gray-600 hover:text-gray-900'
              : 'text-red-500 bg-red-50/60 border-red-100'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <button
          id="btn-header-notifications"
          onClick={onToggleNotifications}
          className="relative p-2.5 rounded-2xl bg-white shadow-xs border border-gray-100 text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
          title="التنبيهات الفورية"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#f0f2f5] animate-pulse" />
          )}
        </button>

        {/* Add Document Button */}
        <button
          id="btn-header-add-new"
          onClick={onOpenNewModal}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-2xl shadow-md shadow-blue-500/20 transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة كتاب</span>
        </button>
      </div>
    </header>
  );
};
