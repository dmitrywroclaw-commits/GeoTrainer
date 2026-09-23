export function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(value);
      value = '';
    } else if (character === '\n') {
      row.push(value.replace(/\r$/, ''));
      if (row.some(cell => cell.length > 0)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error('Незакрытая кавычка в CSV');
  if (value.length > 0 || row.length > 0) {
    row.push(value.replace(/\r$/, ''));
    if (row.some(cell => cell.length > 0)) rows.push(row);
  }
  if (rows.length === 0) return [];

  const headers = rows[0];
  return rows.slice(1).map((cells, rowIndex) => {
    if (cells.length !== headers.length) {
      throw new Error(`Строка CSV ${rowIndex + 2}: ожидалось ${headers.length} полей, получено ${cells.length}`);
    }
    return Object.fromEntries(headers.map((header, columnIndex) => [header, cells[columnIndex]]));
  });
}

function escapeCsv(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function stringifyCsv(headers, rows) {
  const lines = [headers.map(escapeCsv).join(',')];
  for (const row of rows) lines.push(headers.map(header => escapeCsv(row[header])).join(','));
  return `${lines.join('\n')}\n`;
}
