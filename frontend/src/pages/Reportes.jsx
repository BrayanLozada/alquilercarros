import { BadgeDollarSign, CalendarDays, Coins, Gauge, Download, FileDown, Filter } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { tarifaGlobal, formatoMoneda } from "../lib/data";

const KPI = ({ label, value, icon:Icon }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
      <div className="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center"><Icon/></div>
    </div>
  </Card>
);

function Reportes(){
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Reportes</h3>
        <div className="flex gap-2">
          <Button className="bg-slate-100 flex items-center gap-2"><Filter size={16}/> Filtros</Button>
          <Button className="bg-slate-100 flex items-center gap-2"><Download size={16}/> Exportar CSV</Button>
          <Button className="bg-slate-100 flex items-center gap-2"><FileDown size={16}/> Exportar Excel</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Alquileres (día)" value="12" icon={CalendarDays}/>
        <KPI label="Ingresos (día)" value={formatoMoneda(12*tarifaGlobal)} icon={BadgeDollarSign}/>
        <KPI label="Efectivo vs Transferencia" value="7 / 5" icon={Coins}/>
        <KPI label="Ocupación promedio" value="62%" icon={Gauge}/>
      </div>
      <Card className="p-4">
        <div className="text-sm text-slate-500">Gráficos de tendencia (placeholder)</div>
        <div className="h-40 bg-slate-100 rounded-xl grid place-items-center mt-3">Área de gráficos</div>
      </Card>
    </div>
  );
}

export default Reportes;
