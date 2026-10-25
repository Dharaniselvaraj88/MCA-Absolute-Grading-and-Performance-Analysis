/**
 * Centralized Date & Timestamp Utility
 * Enforces DD/MM/YYYY standard formatting across the CIT Cognitive Assessment platform.
 */

/**
 * Returns current timestamp in "DD/MM/YYYY, HH:MM:SS AM/PM" or "DD/MM/YYYY" format.
 */
export function getCurrentTimestamp(includeTime: boolean = true): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  if (!includeTime) {
    return `${day}/${month}/${year}`;
  }

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const formattedHours = String(hours).padStart(2, '0');

  return `${day}/${month}/${year}, ${formattedHours}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Formats any date string or Date object into DD/MM/YYYY display format.
 */
export function formatDateDisplay(dateInput?: string | Date | null): string {
  if (!dateInput) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }

  if (typeof dateInput === 'string') {
    // If it's already in DD/MM/YYYY or MM/DD/YYYY
    const trimmed = dateInput.trim();
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyyMatch) {
      let n1 = parseInt(ddmmyyyyMatch[1], 10);
      let n2 = parseInt(ddmmyyyyMatch[2], 10);
      const year = ddmmyyyyMatch[3];
      // If second part > 12 and first part <= 12, it was formatted in US MM/DD/YYYY locale
      if (n2 > 12 && n1 <= 12) {
        const tmp = n1;
        n1 = n2;
        n2 = tmp;
      }
      const day = String(n1).padStart(2, '0');
      const month = String(n2).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }

    // Try standard Date parse
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, '0');
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const year = parsed.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return trimmed;
  }

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return '';
}

/**
 * Normalizes any timestamp, date string, or Date object into standard "YYYY-MM-DD" format.
 * Accurately prioritizes DD/MM/YYYY formats (e.g. "06/10/2026, ...") while also detecting
 * US locale MM/DD/YYYY when the second number exceeds 12.
 */
export function normalizeDateToYyyyMmDd(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '';

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const y = dateInput.getFullYear();
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const d = String(dateInput.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof dateInput === 'number' && !isNaN(dateInput)) {
    const dt = new Date(dateInput);
    if (!isNaN(dt.getTime())) {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(dateInput).trim();
  if (!str) return '';

  // Numeric epoch string check
  if (/^\d{11,15}$/.test(str)) {
    const dt = new Date(parseInt(str, 10));
    if (!isNaN(dt.getTime())) {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // 1. Matches DD/MM/YYYY or DD-MM-YYYY (or MM/DD/YYYY if second segment > 12)
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ddmmyyyyMatch) {
    let n1 = parseInt(ddmmyyyyMatch[1], 10);
    let n2 = parseInt(ddmmyyyyMatch[2], 10);
    const year = ddmmyyyyMatch[3];
    if (n2 > 12 && n1 <= 12) {
      const tmp = n1;
      n1 = n2;
      n2 = tmp;
    }
    const day = String(n1).padStart(2, '0');
    const month = String(n2).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 2. Matches YYYY-MM-DD or YYYY/MM/DD (e.g. "2026-10-06", "2026-10-06T...")
  const yyyymmddMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (yyyymmddMatch) {
    const year = yyyymmddMatch[1];
    const month = yyyymmddMatch[2].padStart(2, '0');
    const day = yyyymmddMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 3. Fallback for ISO or English strings like "Oct 6, 2026"
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  } catch {}

  return '';
}

