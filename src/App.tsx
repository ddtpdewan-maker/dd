import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { LettersTable } from './components/LettersTable';
import { DocumentModal } from './components/DocumentModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { AdvancedSearchModal } from './components/AdvancedSearchModal';
import { ScannerModal } from './components/ScannerModal';
import { StatsDashboard } from './components/StatsDashboard';
import { SettingsView } from './components/SettingsView';
import { NotificationDrawer } from './components/NotificationDrawer';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ArchivedLetter, LetterFilter, NotificationItem } from './types/archive';
import { getInitialSeedLetters } from './utils/sampleData';
import { exportLettersToExcel } from './utils/excelExport';
import { audioNotifier } from './utils/audioNotification';
import { generateSampleIncomingLetterCanvas } from './utils/pdfHelper';

export default function App() {
  // Letters database state with localStorage persistence
  const [letters, setLetters] = useState<ArchivedLetter[]>(() => {
    const saved = localStorage.getItem('archive_letters_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing stored letters:', e);
      }
    }
    return getInitialSeedLetters();
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('archive_notifications_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parsing stored notifications:', e);
      }
    }
    return [
      {
        id: 'notif-1',
        title: 'كتاب وارد جديد عاجل وسري',
        message: 'تمت أرشفة كتاب ميزانية الماسحات الضوئية رقم 1452/و واستخراج الختم الأزرق بنجاح.',
        letterId: 'doc-001',
        type: 'urgent',
        timestamp: new Date().toISOString(),
        read: false,
      },
    ];
  });

  // Toasts queue
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Navigation and Filtering State
  const [currentTab, setCurrentTab] = useState<NavTab>('all');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<LetterFilter | null>(null);

  // Modals visibility
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState<boolean>(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);
  const [selectedLetter, setSelectedLetter] = useState<ArchivedLetter | null>(null);

  // Sound preference state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() =>
    audioNotifier.isSoundEnabled()
  );

  // Save letters to localStorage
  useEffect(() => {
    localStorage.setItem('archive_letters_data', JSON.stringify(letters));
  }, [letters]);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('archive_notifications_data', JSON.stringify(notifications));
  }, [notifications]);

  // Add a toast notification
  const addToast = (title: string, message: string, type: 'success' | 'urgent' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle audio
  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    audioNotifier.setSoundEnabled(nextState);
    if (nextState) {
      audioNotifier.playNewLetterChime();
    }
  };

  // Add new letter to archive
  const handleSaveLetter = (newLetter: ArchivedLetter) => {
    setLetters((prev) => [newLetter, ...prev]);

    // Play chime sound
    if (newLetter.priority.includes('عاجل') || newLetter.priority.includes('سري')) {
      audioNotifier.playUrgentAlert();
    } else {
      audioNotifier.playNewLetterChime();
    }

    // Add Notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `كتاب ${newLetter.type} جديد: ${newLetter.incomingNumber || newLetter.outgoingNumber}`,
      message: `تم توثيق الموضوع: ${newLetter.subject} ${
        newLetter.blueStamp?.detected ? '(مع ختم أزرق مكتشف)' : ''
      }`,
      letterId: newLetter.id,
      type: newLetter.priority.includes('عاجل') ? 'urgent' : 'success',
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Show toast
    addToast(
      `تمت أرشفة كتاب ${newLetter.type} بنجاح!`,
      `رقم: ${newLetter.incomingNumber || newLetter.outgoingNumber} | الموضوع: ${newLetter.subject}`,
      newLetter.priority.includes('عاجل') ? 'urgent' : 'success'
    );
  };

  // Delete letter
  const handleDeleteLetter = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا السجل من الأرشيف نهائياً؟')) {
      setLetters((prev) => prev.filter((l) => l.id !== id));
      addToast('تم حذف السجل', 'تم إزالة الكتاب من الأرشيف بنجاح', 'info');
    }
  };

  // Export current view or full archive to Excel
  const handleExportExcel = () => {
    const lettersToExport = getDisplayedLetters();
    exportLettersToExcel(lettersToExport, {
      fileName: `سجل_ارشيف_${currentTab}_${new Date().toISOString().split('T')[0]}.xlsx`,
    });
    addToast('تم تصدير التقرير', 'تم تنزيل ملف الإكسل المنسق بنجاح', 'success');
  };

  // Export single letter to Excel
  const handleExportSingleLetter = (letter: ArchivedLetter) => {
    exportLettersToExcel([letter], {
      fileName: `كتاب_${letter.type}_${letter.incomingNumber || letter.outgoingNumber}.xlsx`,
    });
    addToast('تم تصدير الكتاب', 'تم تصدير بيانات المعاملة إلى Excel', 'success');
  };

  // Quick 1-click sample letter generator with Blue Stamp
  const handleGenerateSampleLetter = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const sampleCanvas = generateSampleIncomingLetterCanvas(
      `${randomNum}/و`,
      `وز/ص/${Math.floor(randomNum / 2)}`,
      '2026/05/20',
      '2026/05/22',
      `بشأن اعتماد محاضر اللجان الفنية وتوريد مستلزمات الأرشفة - معاملة رقم ${randomNum}`,
      'وزارة التعليم العالي والبحث العلمي - الدائرة الإدارية والمالية',
      'دائرة تكنولوجيا المعلومات والتوثيق الإلكتروني'
    );

    const newSampleLetter: ArchivedLetter = {
      id: `doc-${Date.now()}`,
      type: 'وارد',
      incomingNumber: `${randomNum}/و`,
      outgoingNumber: `وز/ص/${Math.floor(randomNum / 2)}`,
      letterDate: '2026-05-20',
      receiptDate: '2026-05-22',
      subject: `بشأن اعتماد محاضر اللجان الفنية وتوريد مستلزمات الأرشفة - معاملة رقم ${randomNum}`,
      senderEntity: 'وزارة التعليم العالي والبحث العلمي - الدائرة الإدارية والمالية',
      recipientEntity: 'دائرة تكنولوجيا المعلومات والتوثيق الإلكتروني',
      priority: 'عاجل وسري للغاية',
      category: 'مالي وإداري',
      status: 'قيد الإجراء',
      summary: `الموافقة على محضر الاجتماع رقم ${randomNum} وتخصيص الدفعة المالية الأولى لتجهيز خوادم الأرشفة وتفعيل قراءة أختام الوارد الزرقاء المكتوبة بخط اليد.`,
      actionRequired: 'اتخاذ اللازم للصرف ومطابقة المستندات',
      keywords: ['محاضر لجان', 'تجهيز خوادم', 'أرشفة إلكترونية', 'ختم الوارد الأزرق', 'اللائحة التنفيذية'],
      importantNumbers: [
        { label: 'رقم المعاملة', value: `${randomNum}` },
        { label: 'تاريخ الاستلام بالختم', value: '2026/05/22' },
        { label: 'رقم القرار', value: `ق-${randomNum}/2026` },
      ],
      blueStamp: {
        detected: true,
        handwrittenIncomingNumber: `${randomNum}/و`,
        handwrittenReceiptDate: '2026/05/22',
        stampPrintedText: 'وارد ديوان الوزارة العام - شعبة البريد والتوثيق',
        confidence: 99,
        notes: 'الختم الأزرق والخط اليدوي مقروءان بوضوح فائق.',
        boundingBox: {
          topPercent: 12.8,
          leftPercent: 7.5,
          widthPercent: 27,
          heightPercent: 10.5,
        },
      },
      pageImages: [sampleCanvas],
      pdfFileName: `كتاب_وارد_تجريبي_${randomNum}.pdf`,
      pdfFileSize: 384000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    handleSaveLetter(newSampleLetter);
  };

  // Open Document in Viewer
  const handleSelectLetter = (letter: ArchivedLetter) => {
    setSelectedLetter(letter);
    setIsViewerModalOpen(true);
  };

  // Filter letters based on current tab and searches
  const getDisplayedLetters = (): ArchivedLetter[] => {
    return letters.filter((letter) => {
      // Tab filter
      if (currentTab === 'incoming' && letter.type !== 'وارد') return false;
      if (currentTab === 'outgoing' && letter.type !== 'صادر') return false;

      // Global search filter
      if (globalSearchQuery.trim()) {
        const q = globalSearchQuery.toLowerCase();
        const mSubject = letter.subject?.toLowerCase().includes(q);
        const mInc = letter.incomingNumber?.toLowerCase().includes(q);
        const mOut = letter.outgoingNumber?.toLowerCase().includes(q);
        const mSender = letter.senderEntity?.toLowerCase().includes(q);
        const mRecip = letter.recipientEntity?.toLowerCase().includes(q);
        const mSum = letter.summary?.toLowerCase().includes(q);
        const mStamp = letter.blueStamp?.handwrittenIncomingNumber?.toLowerCase().includes(q);
        const mKw = letter.keywords?.some((k) => k.toLowerCase().includes(q));
        const mNum = letter.importantNumbers?.some(
          (n) => n.label.toLowerCase().includes(q) || n.value.toLowerCase().includes(q)
        );

        if (!mSubject && !mInc && !mOut && !mSender && !mRecip && !mSum && !mStamp && !mKw && !mNum) {
          return false;
        }
      }

      // Advanced filter
      if (activeFilter) {
        if (activeFilter.type && letter.type !== activeFilter.type) return false;
        if (activeFilter.priority && letter.priority !== activeFilter.priority) return false;
        if (activeFilter.category && letter.category !== activeFilter.category) return false;
        if (activeFilter.onlyBlueStamp && !letter.blueStamp?.detected) return false;
        if (activeFilter.dateFrom && letter.letterDate < activeFilter.dateFrom) return false;
        if (activeFilter.dateTo && letter.letterDate > activeFilter.dateTo) return false;
        if (
          activeFilter.senderEntity &&
          !letter.senderEntity?.toLowerCase().includes(activeFilter.senderEntity.toLowerCase())
        ) {
          return false;
        }
        if (
          activeFilter.recipientEntity &&
          !letter.recipientEntity?.toLowerCase().includes(activeFilter.recipientEntity.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });
  };

  const displayedLetters = getDisplayedLetters();

  // Tab Title
  const getViewTitle = () => {
    switch (currentTab) {
      case 'incoming':
        return 'سجل الكتب والبريد الوارد (Incoming)';
      case 'outgoing':
        return 'سجل الكتب الصادرة (Outgoing)';
      case 'search':
        return 'البحث المتقدم والتصفية الذكية';
      case 'stats':
        return 'لوحة المؤشرات والتقارير الإحصائية';
      case 'scanner':
        return 'محطة المسح الضوئي الذكي';
      case 'settings':
        return 'إعدادات الأرشيف والـ OCR';
      default:
        return 'سجل الأرشيف العام للبريد الرسمي';
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f2f5] text-slate-900 select-none font-sans text-right" dir="rtl">
      {/* Desktop Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'search') {
            setIsSearchModalOpen(true);
          } else if (tab === 'scanner') {
            setIsScannerModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        letters={letters}
        onOpenNewDocument={() => setIsNewDocModalOpen(true)}
        onExportExcel={handleExportExcel}
      />

      {/* Main Desktop Screen Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          searchQuery={globalSearchQuery}
          onSearchChange={setGlobalSearchQuery}
          onOpenNewModal={() => setIsNewDocModalOpen(true)}
          onOpenScanner={() => setIsScannerModalOpen(true)}
          onExportExcel={handleExportExcel}
          onGenerateSample={handleGenerateSampleLetter}
          unreadNotificationsCount={unreadNotificationsCount}
          onToggleNotifications={() => setIsNotificationDrawerOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          currentViewTitle={getViewTitle()}
          totalLettersCount={displayedLetters.length}
        />

        {/* View Router */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {currentTab === 'stats' ? (
            <StatsDashboard
              letters={letters}
              onSelectLetter={handleSelectLetter}
            />
          ) : currentTab === 'settings' ? (
            <SettingsView
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              letters={letters}
              onRestoreDefaultData={() => {
                const fresh = getInitialSeedLetters();
                setLetters(fresh);
                addToast('تمت استعادة البيانات', 'تم إرجاع النماذج الافتراضية بنجاح', 'info');
              }}
              onImportData={(imported) => {
                setLetters(imported);
                addToast('تم الاستيراد', `تم استيراد ${imported.length} سجل بنجاح`, 'success');
              }}
            />
          ) : (
            <LettersTable
              letters={displayedLetters}
              onSelectLetter={handleSelectLetter}
              onDeleteLetter={handleDeleteLetter}
              onExportSingleLetter={handleExportSingleLetter}
              onOpenNewModal={() => setIsNewDocModalOpen(true)}
              onOpenScannerModal={() => setIsScannerModalOpen(true)}
              onGenerateSample={handleGenerateSampleLetter}
            />
          )}
        </div>
      </main>

      {/* Modal Dialogs */}
      {/* 1. Add / OCR Document Modal */}
      <DocumentModal
        isOpen={isNewDocModalOpen}
        onClose={() => setIsNewDocModalOpen(false)}
        onSave={handleSaveLetter}
        existingLetters={letters}
        onViewExistingLetter={(existingLetter) => {
          setSelectedLetter(existingLetter);
          setIsViewerModalOpen(true);
        }}
        onOpenScannerTab={() => {
          setIsNewDocModalOpen(false);
          setIsScannerModalOpen(true);
        }}
      />

      {/* 2. Detailed Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={isViewerModalOpen}
        letter={selectedLetter}
        onClose={() => setIsViewerModalOpen(false)}
      />

      {/* 3. Advanced Search & Filter Modal */}
      <AdvancedSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onApplyFilter={(filter) => {
          setActiveFilter(filter);
          addToast('تم تطبيق التصفية', 'تم تحديث نتائج الجدول حسب معايير البحث', 'info');
        }}
        letters={letters}
      />

      {/* 4. Direct Document Scanner Modal */}
      <ScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScanComplete={(scannedPages) => {
          // Open new document modal with preloaded scanned pages
          setIsNewDocModalOpen(true);
        }}
      />

      {/* 5. Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        onClearNotifications={() => {
          setNotifications([]);
        }}
        onSelectNotificationLetter={(letterId) => {
          const letter = letters.find((l) => l.id === letterId);
          if (letter) {
            handleSelectLetter(letter);
          }
        }}
      />

      {/* Instant Toast Notification Popups */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
