import { ArchivedLetter, DuplicateCheckResult } from '../types/archive';

/**
 * Normalizes Arabic numbers, slashes, and spaces for robust comparison
 */
export function normalizeDocumentString(str?: string): string {
  if (!str) return '';
  return str
    .replace(/[٠-٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    .replace(/[\s\-\/\\]+/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Checks whether a document being added or edited duplicates an existing letter in the archive
 */
export function checkForDuplicateLetter(
  candidate: {
    incomingNumber?: string;
    outgoingNumber?: string;
    letterDate?: string;
    subject?: string;
    currentId?: string; // ID if editing existing
  },
  existingLetters: ArchivedLetter[]
): DuplicateCheckResult {
  const normIncoming = normalizeDocumentString(candidate.incomingNumber);
  const normOutgoing = normalizeDocumentString(candidate.outgoingNumber);
  const normDate = normalizeDocumentString(candidate.letterDate);
  const normSubject = normalizeDocumentString(candidate.subject);

  // Filter out the letter itself if we are editing an existing one
  const pool = existingLetters.filter((l) => l.id !== candidate.currentId);

  for (const existing of pool) {
    const exIncoming = normalizeDocumentString(existing.incomingNumber);
    const exOutgoing = normalizeDocumentString(existing.outgoingNumber);
    const exDate = normalizeDocumentString(existing.letterDate);
    const exSubject = normalizeDocumentString(existing.subject);

    // 1. Exact match on Incoming Number + Letter Date
    if (
      normIncoming &&
      normIncoming !== '-' &&
      normIncoming !== 'غيرمسجل' &&
      normIncoming === exIncoming &&
      normDate &&
      normDate === exDate
    ) {
      return {
        isDuplicate: true,
        duplicateLetter: existing,
        matchType: 'incomingNumber',
        matchDescription: `تطابق كامل في رقم الوارد (${existing.incomingNumber}) وتاريخ الكتاب (${existing.letterDate})`,
      };
    }

    // 2. Exact match on Outgoing Number + Letter Date
    if (
      normOutgoing &&
      normOutgoing !== '-' &&
      normOutgoing === exOutgoing &&
      normDate &&
      normDate === exDate
    ) {
      return {
        isDuplicate: true,
        duplicateLetter: existing,
        matchType: 'outgoingNumber',
        matchDescription: `تطابق في رقم الصادر (${existing.outgoingNumber}) وتاريخ الكتاب (${existing.letterDate})`,
      };
    }

    // 3. Match on Incoming Number alone (if not generic)
    if (
      normIncoming &&
      normIncoming.length >= 3 &&
      normIncoming !== '-' &&
      normIncoming !== 'غيرمسجل' &&
      normIncoming === exIncoming
    ) {
      return {
        isDuplicate: true,
        duplicateLetter: existing,
        matchType: 'incomingNumber',
        matchDescription: `تم العثور على وثيقة سابقة مسجلة بنفس رقم الوارد (${existing.incomingNumber})`,
      };
    }

    // 4. Exact match on Outgoing Number alone
    if (
      normOutgoing &&
      normOutgoing.length >= 4 &&
      normOutgoing !== '-' &&
      normOutgoing === exOutgoing
    ) {
      return {
        isDuplicate: true,
        duplicateLetter: existing,
        matchType: 'outgoingNumber',
        matchDescription: `تم العثور على كتاب سابق مسجل بنفس رقم الصادر (${existing.outgoingNumber})`,
      };
    }

    // 5. Match on Subject + Date
    if (
      normSubject &&
      normSubject.length >= 10 &&
      normSubject === exSubject &&
      normDate &&
      normDate === exDate
    ) {
      return {
        isDuplicate: true,
        duplicateLetter: existing,
        matchType: 'subjectAndDate',
        matchDescription: `تطابق تام في عنوان الموضوع وتاريخ الكتاب الرسمي (${existing.letterDate})`,
      };
    }
  }

  return {
    isDuplicate: false,
    duplicateLetter: null,
    matchType: 'none',
    matchDescription: '',
  };
}
