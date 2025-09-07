import ExcelJS from 'exceljs';

function parseTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const original = String(value).trim();
  const normalized = original
    .toLowerCase()
    .replace(/a\.?\s?m\.?/i, 'AM')
    .replace(/p\.?\s?m\.?/i, 'PM')
    .replace(/\s+/g, '');
  const ampmMatch = normalized.match(/(AM|PM)$/i);
  let timePart = normalized;
  let ampm = null;
  if (ampmMatch) {
    ampm = ampmMatch[1].toUpperCase();
    timePart = normalized.slice(0, -ampmMatch[0].length);
  }
  const [hStr, mStr] = timePart.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isFinite(h) && Number.isFinite(m)) {
    let hours = h % 12;
    if (ampm === 'PM') hours += 12;
    if (!ampm && h === 24) hours = 0;
    return new Date(1970, 0, 1, hours, m);
  }
  console.warn('No se pudo parsear hora:', value);
  return original;
}

function parseCosto(value) {
  if (value === null || value === undefined) return null;
  const n = Number(String(value).replace(/[^0-9.-]/g, ''));
  if (Number.isFinite(n)) return n;
  console.warn('Costo inválido:', value);
  return value;
}

function autoFitColumns(worksheet, { min = 10, max = 40 } = {}) {
  worksheet.columns.forEach((col, idx) => {
    let maxLen = 0;
    col.eachCell({ includeEmpty: true }, cell => {
      const v = cell.value;
      if (v === null || v === undefined) return;
      let len = 0;
      if (v instanceof Date) {
        len = 'HH:mm'.length;
      } else if (typeof v === 'number' && col.numFmt && /\$/g.test(col.numFmt)) {
        const formatted = new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(v);
        len = formatted.length;
      } else {
        len = String(v).length;
      }
      if (len > maxLen) maxLen = len;
    });
    let width = Math.min(Math.max(maxLen + 2, min), max);
    if (idx === 5 && width < 12) width = 12;
    col.width = width;
  });
}

export async function exportRentalsExcel(rows = []) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Alquileres');

  const columns = ['Carro', 'Tramo', 'Inicio', 'Fin', 'Método', 'Costo'];

  worksheet.mergeCells(1, 1, 1, columns.length);
  const title = worksheet.getCell(1, 1);
  title.value = 'Alquileres del día';
  title.font = { bold: true, size: 16 };
  title.alignment = { horizontal: 'center' };

  const now = new Date();
  worksheet.mergeCells(2, 1, 2, 3);
  worksheet.mergeCells(2, 4, 2, 6);
  worksheet.getCell(2, 1).value = `Exportado: ${now.toLocaleString()}`;
  worksheet.getCell(2, 4).value = `Total registros: ${rows.length}`;

  const parseTramo = (t) => {
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? n : null;
  };

  const tableRows = rows.map(r => [
    r.carro,
    parseTramo(r.tramo),
    parseTime(r.inicio),
    parseTime(r.fin),
    r.metodo,
    parseCosto(r.costo)
  ]);

  worksheet.addTable({
    name: 'Alquileres',
    ref: 'A3',
    headerRow: true,
    style: { theme: 'TableStyleMedium9', showRowStripes: true },
    columns: columns.map(c => ({ name: c })),
    rows: tableRows
  });

  worksheet.getColumn(1).alignment = { horizontal: 'left' };
  worksheet.getColumn(5).alignment = { horizontal: 'left' };
  [2, 3, 4, 6].forEach(i => worksheet.getColumn(i).alignment = { horizontal: 'right' });

  worksheet.getColumn(2).numFmt = '0" min"';
  worksheet.getColumn(3).numFmt = 'hh:mm';
  worksheet.getColumn(4).numFmt = 'hh:mm';
  worksheet.getColumn(6).numFmt = '"$"#,##0';

  const totalRows = tableRows.length + 3;
  for (let r = 3; r <= totalRows; r++) {
    for (let c = 1; c <= columns.length; c++) {
      worksheet.getCell(r, c).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  }

  worksheet.views = [{ state: 'frozen', ySplit: 3 }];

  autoFitColumns(worksheet);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5).replace(':', '-');
  const filename = `alquileres_del_dia_${date}_${time}.xlsx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
