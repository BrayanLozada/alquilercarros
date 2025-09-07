import ExcelJS from 'exceljs';

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

  const parseTime = (t) => {
    if (!t) return null;
    const date = new Date(t);
    if (!isNaN(date)) return date;
    const [h, m] = String(t).split(':').map(Number);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      return new Date(1970, 0, 1, h, m);
    }
    return null;
  };
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
    r.costo
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
  worksheet.getColumn(3).numFmt = 'HH:mm';
  worksheet.getColumn(4).numFmt = 'HH:mm';
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

  columns.forEach((col, idx) => {
    const column = worksheet.getColumn(idx + 1);
    let max = col.length;
    tableRows.forEach(row => {
      const val = row[idx];
      if (val != null) {
        max = Math.max(max, val.toString().length);
      }
    });
    column.width = max + 2;
  });

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
