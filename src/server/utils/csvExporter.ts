export interface ExportableTransaction {
  id: string;
  transactionDate: Date | string;
  type: string;
  category: string;
  payee: string | null;
  description: string | null;
  amount: number | string | { toString(): string };
  createdAt: Date | string;
}

/**
 * Neutralizes CSV Formula Injection (CWE-1236 / DDE Injection).
 * Any cell value whose first character is '=', '+', '-', '@', '\t', or '\r'
 * is prefixed with an apostrophe (') so spreadsheet software (Excel, Calc, Google Sheets)
 * evaluates the contents strictly as literal text rather than executable formulas.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // Formula trigger characters: '=', '+', '-', '@', '\t', '\r'
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Double quotes inside fields must be escaped as two double quotes (" -> "")
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Serializes an array of transaction records into an RFC 4180-compliant CSV string
 * with formula-injection defenses applied to every data cell.
 */
export function generateTransactionsCsv(transactions: ExportableTransaction[]): string {
  const headers = [
    'Transaction ID',
    'Date',
    'Type',
    'Category',
    'Payee',
    'Description',
    'Amount (INR)',
    'Created At',
  ];

  const headerRow = headers.map((h) => `"${h}"`).join(',');

  const rows = transactions.map((tx) => {
    const dateStr =
      tx.transactionDate instanceof Date
        ? tx.transactionDate.toISOString().split('T')[0]
        : String(tx.transactionDate).split('T')[0];

    const createdStr =
      tx.createdAt instanceof Date
        ? tx.createdAt.toISOString()
        : String(tx.createdAt);

    const amountNum = typeof tx.amount === 'number' ? tx.amount : Number(tx.amount);
    const amountFormatted = isNaN(amountNum) ? '0.00' : amountNum.toFixed(2);

    return [
      sanitizeCsvCell(tx.id),
      sanitizeCsvCell(dateStr),
      sanitizeCsvCell(tx.type),
      sanitizeCsvCell(tx.category),
      sanitizeCsvCell(tx.payee || ''),
      sanitizeCsvCell(tx.description || ''),
      sanitizeCsvCell(amountFormatted),
      sanitizeCsvCell(createdStr),
    ].join(',');
  });

  // Standard CRLF line endings per RFC 4180
  return [headerRow, ...rows].join('\r\n');
}
