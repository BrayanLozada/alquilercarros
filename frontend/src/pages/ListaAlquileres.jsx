import { useEffect, useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import { formatoMoneda } from "../lib/data";
import { getRentalsDay, getCars, getTramos } from "../lib/api";
import { exportRentalsExcel } from "../lib/exportExcel";
import { showError } from "../lib/alerts";

function ListaAlquileres(){
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [exportAll, setExportAll] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([getRentalsDay(), getCars(), getTramos()]).then(([data, cs, ts]) => {
      const carMap = Object.fromEntries(cs.map(c => [c.id, c.nombre]));
      const tramoMap = Object.fromEntries(ts.map(t => [t.id, t.minutos]));
      const formatted = (data.alquileres || []).map(a => {
        const inicioDate = new Date(a.inicio);
        return {
          id: a.id,
          carro: carMap[a.carro_id] || `#${a.carro_id}`,
          tramo: `${tramoMap[a.tramo_id] || 0} min`,
          inicio: inicioDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          inicioDate,
          fin: a.fin ? new Date(a.fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          metodo: a.metodo_pago,
          costo: a.costo
        };
      }).sort((a,b) => b.inicioDate - a.inicioDate);
      setRows(formatted);
    });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, perPage]);

  const filtered = rows.filter(r => {
    const text = `${r.carro} ${r.tramo} ${r.inicio} ${r.fin} ${r.metodo} ${r.costo}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const start = (page - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);

  const handleExport = async () => {
    const data = exportAll ? filtered : paginated;
    if (!data.length) {
      showError('No hay datos para exportar');
      return;
    }
    try {
      setExporting(true);
      await exportRentalsExcel(data);
    } catch (e) {
      showError('No se pudo exportar, intenta de nuevo');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Alquileres del día</h3>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Mostrar</span>
          <Select value={perPage} onChange={e=>setPerPage(Number(e.target.value))} className="w-20">
            {[5,10,25,50].map(n => <option key={n} value={n}>{n}</option>)}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} className="w-56"/>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={exportAll} onChange={e=>setExportAll(e.target.checked)} />
            Todos los filtrados
          </label>
          <Button onClick={handleExport} disabled={exporting} className="bg-slate-100 flex items-center gap-2">
            {exporting ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16}/>}
            Exportar Excel
          </Button>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Carro</th>
              <th>Tramo</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Método</th>
              <th className="text-right">Costo</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(r=> (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.carro}</td>
                <td>{r.tramo}</td>
                <td>{r.inicio}</td>
                <td>{r.fin}</td>
                <td>{r.metodo}</td>
                <td className="text-right">{formatoMoneda(r.costo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end items-center gap-1 mt-3">
        <Button className="px-3 py-1" onClick={()=>setPage(1)} disabled={page===1}>&laquo;</Button>
        <Button className="px-3 py-1" onClick={()=>setPage(p=>Math.max(p-1,1))} disabled={page===1}>&lsaquo;</Button>
        {Array.from({length: totalPages}, (_,i)=>(
          <Button
            key={i+1}
            className={`px-3 py-1 ${page===i+1 ? 'bg-slate-200' : ''}`}
            onClick={()=>setPage(i+1)}
          >
            {i+1}
          </Button>
        ))}
        <Button className="px-3 py-1" onClick={()=>setPage(p=>Math.min(p+1,totalPages))} disabled={page===totalPages}>&rsaquo;</Button>
        <Button className="px-3 py-1" onClick={()=>setPage(totalPages)} disabled={page===totalPages}>&raquo;</Button>
      </div>
    </Card>
  );
}

export default ListaAlquileres;
