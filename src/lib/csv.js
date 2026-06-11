/**
 * @typedef {string | number | boolean | null | undefined} CsvValue
 */

/**
 * @param {string} value
 */
function neutralizeSpreadsheetFormula(value) {
    return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

/**
 * @param {CsvValue} value
 */
function serializeCsvValue(value) {
    if (value === null || value === undefined) {
        return '';
    }

    const serialized = typeof value === 'string'
        ? neutralizeSpreadsheetFormula(value)
        : String(value);

    return /[",\r\n]/.test(serialized)
        ? `"${serialized.replaceAll('"', '""')}"`
        : serialized;
}

/**
 * @param {CsvValue[][]} rows
 */
export function serializeCsv(rows) {
    return rows
        .map(row => row.map(serializeCsvValue).join(','))
        .join('\r\n');
}

/**
 * @param {string} csv
 * @param {string} filename
 */
export function downloadCsv(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}
