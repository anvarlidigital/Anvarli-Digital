/**
 * Trim & Twisted - Universal Date Formatting Utility
 * Enforces the strict rule: "the format always will be dd/mm/yyyy"
 */

export function formatDateDDMMYYYY(dateInput?: string | Date | null): string {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // Already in DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // In YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parts = trimmed.split('T')[0].split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
    }
    // DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed.replace(/-/g, '/');
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
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
 * Converts DD/MM/YYYY back to YYYY-MM-DD for standard HTML date picker input values
 */
export function datePickerFormat(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split('/');
      return `${y}-${m}-${d}`;
    }
  }
  const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
}
