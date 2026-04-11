/**
 * Lightweight helper to convert arrays of data into CSV strings.
 * Handles basic escaping and quoting for Excel compatibility.
 */
export function jsonToCsv(headers: string[], rows: any[][]): string {
  const escape = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escape).join(',');
  const rowLines = rows.map(row => row.map(escape).join(','));

  return [headerLine, ...rowLines].join('\n');
}
