import ExcelJS from 'exceljs';

function toColombiaDateString(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
    if (typeof value === 'string' && value.trim() === '') return '';
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
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

function getColombiaDateTime(now = new Date()) {
  const options = { timeZone: 'America/Bogota', hour12: false };
  const datePart = new Intl.DateTimeFormat('en-CA', {
    ...options,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
  const timePart = new Intl.DateTimeFormat('en-GB', {
    ...options,
    hour: '2-digit',
    minute: '2-digit'
  }).format(now);
  const display = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(now);
  return { datePart, timePart, display };
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
  const { datePart, timePart, display } = getColombiaDateTime(now);
  worksheet.mergeCells(2, 1, 2, 3);
  worksheet.mergeCells(2, 4, 2, 6);
  worksheet.getCell(2, 1).value = `Exportado: ${display}`;
  worksheet.getCell(2, 4).value = `Total registros: ${rows.length}`;

  const parseTramo = (t) => {
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? n : null;
  };

    // Log para depuración de fechas
    console.log('Exportando filas, ejemplo de datos:');
    rows.slice(0, 5).forEach((r, i) => {
      console.log(`Fila ${i + 1}:`, {
        inicio: r.inicio,
        fin: r.fin,
        typeofInicio: typeof r.inicio,
        typeofFin: typeof r.fin
      });
    });

    const tableRows = rows.map(r => [
      r.carro,
      parseTramo(r.tramo),
      r.inicio || '',
      r.fin || '',
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
  // No aplicar formato de fecha/hora, exportar como texto
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
  const filename = `alquileres_del_dia_${datePart}_${timePart.replace(':', '-')}.xlsx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
