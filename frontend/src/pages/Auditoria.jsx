import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Pill from "../components/ui/Pill";
import { FileDown } from "lucide-react";

function Auditoria(){
  const items = [
    { id:1, ts:"10:05", usuario:"ana", accion:"INICIAR", detalle:"Buggy Rojo • 15 min" },
    { id:2, ts:"10:20", usuario:"ana", accion:"FINALIZAR", detalle:"Buggy Rojo • efectivo" },
    { id:3, ts:"10:22", usuario:"admin", accion:"TARIFA", detalle:"Actualizó a $8.000" },
  ];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Bitácora de actividades</h3>
        <Button className="bg-slate-100 flex items-center gap-2"><FileDown size={16}/> Exportar</Button>
      </div>
      <div className="space-y-2">
        {items.map(it=> (
          <div key={it.id} className="flex items-center justify-between p-3 rounded-xl border">
            <div className="flex items-center gap-3">
              <Pill tone="slate">{it.ts}</Pill>
              <Pill tone="indigo">{it.usuario}</Pill>
              <Pill tone={it.accion==='INICIAR'? 'emerald' : it.accion==='FINALIZAR'? 'rose' : 'amber'}>{it.accion}</Pill>
              <span className="text-sm text-slate-700">{it.detalle}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default Auditoria;
