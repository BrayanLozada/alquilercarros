import { useEffect, useState } from "react";
import { Download, FileDown } from "lucide-react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { formatoMoneda } from "../lib/data";
import { getRentalsDay, getCars, getTramos } from "../lib/api";

function ListaAlquileres(){
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    Promise.all([getRentalsDay(), getCars(), getTramos()]).then(([data, cs, ts]) => {
      const carMap = Object.fromEntries(cs.map(c => [c.id, c.nombre]));
      const tramoMap = Object.fromEntries(ts.map(t => [t.id, t.minutos]));
      const formatted = (data.alquileres || []).map(a => ({
        id: a.id,
        carro: carMap[a.carro_id] || `#${a.carro_id}`,
        tramo: `${tramoMap[a.tramo_id] || 0} min`,
        inicio: new Date(a.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fin: a.fin ? new Date(a.fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        metodo: a.metodo_pago,
        costo: a.costo
      }));
      setRows(formatted);
    });
  }, []);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Alquileres del día</h3>
        <div className="flex items-center gap-2">
          <Input placeholder="Buscar por carro…" value={q} onChange={e=>setQ(e.target.value)} className="w-56"/>
          <Button className="bg-slate-100 flex items-center gap-2"><Download size={16}/> Exportar CSV</Button>
          <Button className="bg-slate-100 flex items-center gap-2"><FileDown size={16}/> Exportar Excel</Button>
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
            {rows.filter(r=>r.carro.toLowerCase().includes(q.toLowerCase())).map(r=> (
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
    </Card>
  );
}

export default ListaAlquileres;
