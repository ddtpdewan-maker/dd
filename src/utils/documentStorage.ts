/**
 * IndexedDB helper for robust full-copy document storage (PDF files & high-res page images)
 * Allows storing complete copies of multi-page books and PDFs with fast local retrieval.
 */

const DB_NAME = 'ArchivedDocumentsDB';
const DB_VERSION = 1;
const STORE_NAME = 'full_documents';

interface DocumentRecord {
  id: string; // letter ID
  fileName: string;
  fileSize: number;
  fileType: string;
  pdfDataUrl: string; // complete Base64 Data URL or Blob URL
  pageImages: string[]; // all rendered pages
  pageCount: number;
  savedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save complete copy of document (PDF and all pages) to IndexedDB
 */
export async function saveCompleteDocumentCopy(
  letterId: string,
  doc: {
    fileName: string;
    fileSize: number;
    fileType?: string;
    pdfDataUrl: string;
    pageImages: string[];
    pageCount: number;
  }
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record: DocumentRecord = {
        id: letterId,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        fileType: doc.fileType || 'application/pdf',
        pdfDataUrl: doc.pdfDataUrl,
        pageImages: doc.pageImages,
        pageCount: doc.pageCount || doc.pageImages.length || 1,
        savedAt: new Date().toISOString(),
      };

      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to save to IndexedDB, fallback to memory:', err);
  }
}

/**
 * Retrieve complete document copy by letter ID
 */
export async function getCompleteDocumentCopy(
  letterId: string
): Promise<DocumentRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(letterId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to get document copy from IndexedDB:', err);
    return null;
  }
}

/**
 * Delete document copy from IndexedDB
 */
export async function deleteCompleteDocumentCopy(letterId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(letterId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to delete document copy from IndexedDB:', err);
  }
}

/**
 * Helper to download complete copy as PDF
 */
export function downloadCompleteDocument(fileName: string, dataUrlOrBlob: string) {
  const link = document.createElement('a');
  link.href = dataUrlOrBlob;
  link.download = fileName || 'نسخة_كاملة_الكتاب_الرسمي.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
