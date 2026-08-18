/**
 * Converts ISO date string 'YYYY-MM-DD' to 'DD-MM-YYYY' for display.
 * e.g., '2026-08-18' -> '18-08-2026'
 */
export const formatDateDDMMYYYY = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 4) {
      return `${day}-${month}-${year}`;
    }
  }
  return dateStr;
};

/**
 * Converts 'DD-MM-YYYY' back to ISO 'YYYY-MM-DD' if needed.
 * e.g., '18-08-2026' -> '2026-08-18'
 */
export const parseDateYYYYMMDD = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (year.length === 4 && day.length <= 2 && month.length <= 2) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return dateStr;
};
