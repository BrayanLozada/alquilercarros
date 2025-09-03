import { useState } from "react";
import { Download, FileDown } from "lucide-react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { tarifaGlobal, formatoMoneda } from "../lib/data";

function ListaAlquileres(){
  const [q, setQ] = useState("");
  const rows = [
    { id:1, carro: "Buggy Rojo", tramo: "15 min", inicio: "10:05", fin:"10:20", metodo:"efectivo", costo: tarifaGlobal },
    { id:2, carro: "Monster Verde", tramo: "30 min", inicio: "10:10", fin:"10:40", metodo:"transferencia", costo: tarifaGlobal },
  ];
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
