import React, { useState } from 'react';
import {
  Settings,
  Volume2,
  VolumeX,
  Stamp,
  Scan,
  Database,
  Download,
  Upload,
  RefreshCcw,
  CheckCircle2,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import { ArchivedLetter } from '../types/archive';
import { getInitialSeedLetters } from '../utils/sampleData';

interface SettingsViewProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  letters: ArchivedLetter[];
  onRestoreDefaultData: () => void;
  onImportData: (letters: ArchivedLetter[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  soundEnabled,
  onToggleSound,
  letters,
  onRestoreDefaultData,
  onImportData,
}) => {
  const [ocrSensitivity, setOcrSensitivity] = useState<'high' | 'standard'>('high');
  const [autoDetectStamp, setAutoDetectStamp] = useState<boolean>(true);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Backup archive to JSON
  const handleExportBackup = () => {
    const dataStr = JSON.stringify(letters, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `نسخة_احتياطية_ارشيف_البريد_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restore archive from JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          onImportData(imported);
          setImportStatus(`تم استرجاع ${imported.length} سجل بنجاح.`);
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          alert('ملف النسخة الاحتياطية غير صالح.');
        }
      } catch (err) {
        alert('فشل قراءة ملف النسخة الاحتياطية.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2.5 mb-1">
          <Settings className="w-6 h-6 text-blue-600" />
          <span>إعدادات نظام الأرشفة والـ OCR والماسح الضوئي</span>
        </h3>
        <p className="text-xs text-slate-500">
          تخصيص حساسية كشف الأختام الزرقاء، والتنبيهات الصوتية، والنسخ الاحتياطي للأرشيف
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. OCR & Blue Stamp Configuration */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Stamp className="w-4 h-4 text-blue-600" />
            <span>إعدادات التعرف الضوئي (OCR) على الختم الأزرق</span>
          </h4>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">
                  التعرف التلقائي على ختم الوارد الأزرق
                </span>
                <span className="text-slate-500">
                  البحث التلقائي وقراءة الأرقام المكتوبة بخط اليد داخل الختم في أول صفحتين
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoDetectStamp}
                onChange={(e) => setAutoDetectStamp(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                حساسية معالجة خط اليد والتباين
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOcrSensitivity('high')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    ocrSensitivity === 'high'
                      ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  دقة فائقة (موصى بها للخط اليدوي)
                </button>
                <button
                  type="button"
                  onClick={() => setOcrSensitivity('standard')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    ocrSensitivity === 'standard'
                      ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  معالجة قياسية سريعة
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Audio & Instant Notifications */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>التنبيهات الفورية والأصوات</span>
          </h4>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-bold text-slate-800 block">الأصوات التنبيهية الفورية</span>
                <span className="text-slate-500">
                  تشغيل رنين لطيف عند إضافة كتاب أو استخراج بيانات الختم
                </span>
              </div>
              <button
                onClick={onToggleSound}
                className={`p-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  soundEnabled
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span>مفعلة</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>مكتومة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 3. Database Backup & Restore */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4 md:col-span-2">
          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Database className="w-4 h-4 text-purple-600" />
            <span>إدارة قواعد بيانات الأرشيف والنسخ الاحتياطي</span>
          </h4>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-800 block">
                تصدير واسترجاع سجلات الأرشيف
              </span>
              <span className="text-slate-500">
                حفظ نسخة احتياطية كاملة بصيغة JSON متضمنة الصور والبيانات المستخرجة
              </span>
              {importStatus && (
                <div className="text-emerald-700 font-bold mt-1">{importStatus}</div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportBackup}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-purple-600" />
                <span>تحميل نسخة احتياطية</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>استرجاع من ملف JSON</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              <button
                onClick={onRestoreDefaultData}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 font-semibold cursor-pointer"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>إعادة النماذج الافتراضية</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
