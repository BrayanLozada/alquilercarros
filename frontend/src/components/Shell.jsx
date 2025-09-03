import { useState } from "react";
import {
  TimerReset,
  Coins,
  Wrench,
  FileDown,
  LogOut,
  Settings,
  Database,
  Bell,
  ShieldCheck,
  Gauge,
  ChartPie,
  Users,
  Car,
} from "lucide-react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Pill from "./ui/Pill";
import Tablero from "../pages/Tablero";
import ListaAlquileres from "../pages/ListaAlquileres";
import Reportes from "../pages/Reportes";
import Auditoria from "../pages/Auditoria";
import Configuracion from "../pages/Configuracion";
import Backups from "../pages/Backups";

const MenuItem = ({ icon:Icon, label, active, onClick, hidden }) => hidden ? null : (
  <button onClick={onClick} className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 ${active?"bg-indigo-100 text-indigo-700":"text-slate-700"}`}>
    <Icon size={18}/> <span className="text-sm font-medium">{label}</span>
  </button>
);

function Shell({ user, onLogout }){
  const [view, setView] = useState('tablero');
  const isOperador = user?.rol === "operador";
  const isAdmin = user?.rol === "admin";
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 grid place-items-center text-white"><Car size={18}/></div>
            <div>
              <div className="font-semibold">Alquiler RC • Tablero</div>
              <div className="text-xs text-slate-500">Operación local • 1 sede</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="emerald">Rol: {user?.rol}</Pill>
            <Button className="bg-slate-100 flex items-center gap-2" onClick={onLogout}><LogOut size={16}/> Salir</Button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        <Card className="col-span-3 p-3 h-fit sticky top-20">
          <div className="text-xs text-slate-500 px-2 mb-2">Navegación</div>
          <div className="space-y-1">
            <MenuItem icon={Gauge} label="Tablero" active={view==='tablero'} onClick={()=>setView('tablero')}/>
            <MenuItem icon={TimerReset} label="Alquileres" active={view==='alquileres'} onClick={()=>setView('alquileres')}/>
            <MenuItem icon={ChartPie} label="Reportes" active={view==='reportes'} onClick={()=>setView('reportes')} hidden={isOperador}/>
            <MenuItem icon={ShieldCheck} label="Auditoría" active={view==='auditoria'} onClick={()=>setView('auditoria')} hidden={isOperador}/>
            <MenuItem icon={Settings} label="Configuración" active={view==='config'} onClick={()=>setView('config')} hidden={!isAdmin}/>
            <MenuItem icon={Database} label="Backups" active={view==='backups'} onClick={()=>setView('backups')} hidden={!isAdmin}/>
          </div>
        </Card>
        <div className="col-span-9 space-y-6">
          {view==='tablero' && <Tablero/>}
          {view==='alquileres' && <ListaAlquileres/>}
          {view==='reportes' && <Reportes/>}
          {view==='auditoria' && <Auditoria/>}
          {view==='config' && <Configuracion/>}
          {view==='backups' && <Backups/>}
        </div>
      </div>
    </div>
  );
}

export default Shell;
