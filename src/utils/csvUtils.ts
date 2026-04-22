/**
 * Utility to generate and parse CSV data for the collaborative assessment workflow.
 */

export const generateCSV = (headers: string[], rows: any[][]): string => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const cellStr = String(cell ?? '');
      return cellStr.includes(',') ? `"${cellStr}"` : cellStr;
    }).join(','))
  ].join('\n');
  
  return csvContent;
};

export const downloadCSV = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (content: string): string[][] => {
  const rows = content.split(/\r?\n/).filter(row => row.trim() !== '');
  return rows.map(row => {
    const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    return matches ? matches.map(m => m.replace(/^"|"$/g, '')) : row.split(',');
  });
};
