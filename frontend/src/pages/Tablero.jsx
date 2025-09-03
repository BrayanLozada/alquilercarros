import { useEffect, useMemo, useState } from "react";
import { Play, Square, Wrench, Clock, Car, Bell } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Pill from "../components/ui/Pill";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Label from "../components/ui/Label";
import Modal from "../components/ui/Modal";
import { seedCars, seedTramos, tarifaGlobal, formatoMoneda } from "../lib/data";

function Countdown({ seconds }){
  const m = Math.floor(seconds/60).toString().padStart(2,'0');
  const s = Math.floor(seconds%60).toString().padStart(2,'0');
  return <div className={`font-mono text-lg ${seconds===0?"text-rose-600 font-bold animate-pulse":""}`}>{m}:{s}</div>;
}

function StartForm({ carro, onConfirm }){
  const [tramo, setTramo] = useState(1);
  const [inicio, setInicio] = useState(new Date().toISOString().slice(0,16));
  const minutos = seedTramos.find(t=>t.id===Number(tramo))?.minutos ?? 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Carro</Label>
          <Input value={`${carro?.nombre ?? ""}`} disabled/>
        </div>
        <div>
          <Label>Tramo</Label>
          <Select value={tramo} onChange={e=>setTramo(e.target.value)}>
            {seedTramos.filter(t=>t.activo).map(t=> (
              <option key={t.id} value={t.id}>{t.minutos} min</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Inicio</Label>
          <Input type="datetime-local" value={inicio} onChange={e=>setInicio(e.target.value)} />
        </div>
        <div>
          <Label>Costo</Label>
          <Input value={formatoMoneda(tarifaGlobal)} disabled/>
        </div>
      </div>
      <div className="flex justify-end">
        <Button className="bg-indigo-600 text-white" onClick={()=>onConfirm(tramo, inicio)}><Play size={16}/> Iniciar</Button>
      </div>
    </div>
  );
}

function EndForm({ alquiler, onConfirm }){
  const [metodo, setMetodo] = useState("efectivo");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Método de pago</Label>
          <Select value={metodo} onChange={e=>setMetodo(e.target.value)}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia (Nequi)</option>
          </Select>
        </div>
        <div>
          <Label>Total</Label>
          <Input value={formatoMoneda(tarifaGlobal)} disabled/>
        </div>
      </div>
      <div className="flex justify-end">
        <Button className="bg-rose-600 text-white" onClick={()=>onConfirm(metodo)}><Square size={16}/> Finalizar</Button>
      </div>
    </div>
  );
}

function Tablero(){
  const [cars, setCars] = useState(seedCars);
  const [alquileres, setAlquileres] = useState([]);
  const [modalStart, setModalStart] = useState({ open:false, carro:null });
  const [modalEnd, setModalEnd] = useState({ open:false, alquiler:null });
  const [, force] = useState(0);
  useEffect(()=>{
    const t = setInterval(()=>force(x=>x+1), 1000);
    return ()=>clearInterval(t);
  },[]);

  const activos = useMemo(()=>alquileres.filter(a=>a.estado==='activo'), [alquileres]);

  const startAlquiler = (carro, tramoId, inicioManual) => {
    const tramo = seedTramos.find(t=>t.id===Number(tramoId));
    const now = inicioManual ? new Date(inicioManual) : new Date();
    const fin = new Date(now.getTime() + tramo.minutos*60000);
    const nuevo = { id: crypto.randomUUID(), carroId: carro.id, tramoId: tramo.id, inicio: now, fin, costo: tarifaGlobal, estado:'activo' };
    setAlquileres(prev=>[...prev, nuevo]);
    setCars(prev=>prev.map(c=>c.id===carro.id?{...c, estado:'en uso'}:c));
  };
  const finalizar = (alq, metodo="efectivo") => {
    setAlquileres(prev=>prev.map(a=>a.id===alq.id?{...a, estado:'cerrado', metodo, fin: a.fin}:a));
    setCars(prev=>prev.map(c=>c.id===alq.carroId?{...c, estado:'disponible'}:c));
  };

  const tiempoRestante = (alq)=> Math.max(0, Math.floor((new Date(alq.fin)-new Date())/1000));

  const cardFor = (carro)=>{
    const activo = activos.find(a=>a.carroId===carro.id);
    return (
      <Card key={carro.id} className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center"><Car/></div>
            <div>
              <div className="font-semibold">{carro.nombre}</div>
              <div className="text-xs text-slate-500">{carro.modelo} • {carro.color}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {carro.estado === 'disponible' && <Pill tone="emerald">Disponible</Pill>}
            {carro.estado === 'en uso' && <Pill tone="amber">En uso</Pill>}
            {carro.estado === 'mantenimiento' && <Pill tone="red">Mantenimiento</Pill>}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          {activo ? (
            <div className="flex items-center gap-2">
              <Clock size={16}/>
              <Countdown seconds={tiempoRestante(activo)}/>
            </div>
          ) : (
            <div className="text-slate-500 text-sm">Sin alquiler activo</div>
          )}
          <div className="flex gap-2">
            {carro.estado==='disponible' && (
              <Button className="bg-indigo-600 text-white flex items-center gap-2" onClick={()=>setModalStart({open:true, carro})}><Play size={16}/> Iniciar</Button>
            )}
            {activo && (
              <Button className="bg-rose-600 text-white flex items-center gap-2" onClick={()=>setModalEnd({open:true, alquiler:activo})}><Square size={16}/> Finalizar</Button>
            )}
            <Button className="bg-slate-100 flex items-center gap-2" onClick={()=>setCars(prev=>prev.map(c=>c.id===carro.id?{...c, estado:c.estado==='mantenimiento'?'disponible':'mantenimiento'}:c))}><Wrench size={16}/> Mantenimiento</Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tablero de alquileres</h2>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Bell size={16}/> Alertas visuales/sonoras al cumplirse el tiempo (demo)
        </div>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cars.map(cardFor)}
      </div>

      <Modal open={modalStart.open} onClose={()=>setModalStart({open:false, carro:null})} title={`Iniciar alquiler • ${modalStart.carro?.nombre ?? ""}`} footer={
        <>
          <Button onClick={()=>setModalStart({open:false, carro:null})}>Cancelar</Button>
          <Button className="bg-indigo-600 text-white" id="confirmStart">Confirmar</Button>
        </>
      }>
        <StartForm carro={modalStart.carro} onConfirm={(tramoId, inicio)=>{startAlquiler(modalStart.carro, tramoId, inicio); setModalStart({open:false, carro:null});}}/>
      </Modal>

      <Modal open={modalEnd.open} onClose={()=>setModalEnd({open:false, alquiler:null})} title={`Finalizar alquiler`} footer={
        <>
          <Button onClick={()=>setModalEnd({open:false, alquiler:null})}>Cancelar</Button>
          <Button className="bg-rose-600 text-white" id="confirmEnd">Finalizar</Button>
        </>
      }>
        <EndForm alquiler={modalEnd.alquiler} onConfirm={(metodo)=>{finalizar(modalEnd.alquiler, metodo); setModalEnd({open:false, alquiler:null});}}/>
      </Modal>
    </>
  );
}

export default Tablero;
