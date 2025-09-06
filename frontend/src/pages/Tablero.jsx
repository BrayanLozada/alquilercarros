import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, Wrench, Clock, Car, Bell } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Pill from "../components/ui/Pill";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Label from "../components/ui/Label";
import Modal from "../components/ui/Modal";
import { formatoMoneda } from "../lib/data";
import { getCars, getTramos, getTarifaActiva, startRental, endRental, updateCar } from "../lib/api";

function Countdown({ seconds }){
  const m = Math.floor(seconds/60).toString().padStart(2,'0');
  const s = Math.floor(seconds%60).toString().padStart(2,'0');
  return <div className={`font-mono text-lg ${seconds===0?"text-rose-600 font-bold animate-pulse":""}`}>{m}:{s}</div>;
}

function StartForm({ carro, tramo, setTramo, inicio, setInicio, tramos, tarifa }){
  const minutos = tramos.find(t=>t.id===Number(tramo))?.minutos ?? 0;
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
            {tramos.filter(t=>t.activo).map(t=> (
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
          <Input value={formatoMoneda(tarifa)} disabled/>
        </div>
      </div>
      <div className="text-sm text-slate-500">Duración seleccionada: {minutos} min</div>
    </div>
  );
}

function EndForm({ metodo, setMetodo, tarifa }){
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
          <Input value={formatoMoneda(tarifa)} disabled/>
        </div>
      </div>
    </div>
  );
}

function Tablero({ user }){
  const [cars, setCars] = useState([]);
  const [tramos, setTramos] = useState([]);
  const [tarifa, setTarifa] = useState(0);
  const [alquileres, setAlquileres] = useState([]);
  const [modalStart, setModalStart] = useState({ open:false, carro:null });
  const [modalEnd, setModalEnd] = useState({ open:false, alquiler:null });
  const [modalMant, setModalMant] = useState({ open:false, carro:null, motivo:"" });
  const [endMetodo, setEndMetodo] = useState("efectivo");
  const [startTramo, setStartTramo] = useState(null);
  const getLocalIso = () => new Date(Date.now() - (new Date().getTimezoneOffset()*60000)).toISOString().slice(0,16);
  const [startInicio, setStartInicio] = useState(getLocalIso());
  const [, force] = useState(0);
  const audioRef = useRef(null);

  useEffect(()=>{
    const t = setInterval(()=>{
      force(x=>x+1);
      setAlquileres(prev=>prev.map(a=>{
        if(a.estado==='activo' && !a.alertado && tiempoRestante(a)===0){
          if(audioRef.current){ audioRef.current.play().catch(()=>{}); }
          return { ...a, alertado:true };
        }
        return a;
      }));
    },1000);
    return ()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    getCars().then(cs => {
      const mapped = cs.map(c => c.estado === 'en uso' ? { ...c, estado: 'en_uso' } : c);
      setCars(mapped);
    });
    getTramos().then(d=>{ setTramos(d); if(d.length>0) setStartTramo(d[0].id); });
    getTarifaActiva().then(t=>setTarifa(t?.monto ?? 0));
  },[]);

  const activos = useMemo(()=>alquileres.filter(a=>a.estado==='activo'), [alquileres]);

  const startAlquiler = async (carro, tramoId, inicioManual) => {
    try {
      const res = await startRental({ carro_id: carro.id, tramo_id: tramoId, operador_id: user.id, inicio: inicioManual });
      const tramo = tramos.find(t=>t.id===Number(tramoId));
      const inicio = new Date(res.inicio);
      const fin = new Date(inicio.getTime() + tramo.minutos*60000);
      const nuevo = { id: res.id, carroId: carro.id, tramoId: tramo.id, inicio, fin, costo: res.costo, estado:'activo', alertado:false };
      setAlquileres(prev=>[...prev, nuevo]);
      setCars(prev=>prev.map(c=>c.id===carro.id?{...c, estado:'en_uso'}:c));
    } catch (e) {
      alert(e.message);
    }
  };

  const finalizar = async (alq, metodo="efectivo") => {
    try {
      await endRental(alq.id, { metodo_pago: metodo, destino: 'disponible' });
      setAlquileres(prev=>prev.map(a=>a.id===alq.id?{...a, estado:'cerrado', metodo}:a));
      setCars(prev=>prev.map(c=>c.id===alq.carroId?{...c, estado:'disponible'}:c));
    } catch (e) {
      alert(e.message);
    }
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
            {carro.estado === 'en_uso' && <Pill tone="red">En uso</Pill>}
            {carro.estado === 'mantenimiento' && <Pill tone="amber">Mantenimiento</Pill>}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          {activo ? (
            <div className="flex items-center gap-2">
              <Clock size={16}/>
              <Countdown seconds={tiempoRestante(activo)}/>
            </div>
          ) : (
            <div />
          )}
          <div className="flex flex-wrap gap-2 justify-end">
            {carro.estado==='disponible' && (
              <Button className="bg-indigo-600 text-white flex items-center gap-2 text-sm" onClick={()=>{ setStartTramo(tramos[0]?.id ?? null); setStartInicio(getLocalIso()); getTarifaActiva().then(t=>setTarifa(t?.monto ?? 0)); setModalStart({open:true, carro}); }}><Play size={16}/> Iniciar alquiler</Button>
            )}
            {activo && (
              <Button className="bg-rose-600 text-white flex items-center gap-2 text-sm" onClick={()=>setModalEnd({open:true, alquiler:activo})}><Square size={16}/> Finalizar</Button>
            )}
            {user?.rol !== 'operador' && (
              <Button className="bg-slate-100 flex items-center gap-2 text-sm" onClick={()=>{
                if(carro.estado==='mantenimiento'){
                  updateCar(carro.id,{estado:'disponible'}).then(()=>setCars(prev=>prev.map(c=>c.id===carro.id?{...c, estado:'disponible'}:c)));
                } else {
                  setModalMant({open:true, carro, motivo:""});
                }
              }}><Wrench size={16}/> Mantenimiento</Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const visibleCars = useMemo(() => {
    if (user?.rol === 'operador') {
      return cars.filter(c => c.estado !== 'mantenimiento' && c.estado !== 'inactivo');
    }
    return cars;
  }, [cars, user]);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tablero de alquileres</h2>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Bell size={16}/> Alertas visuales/sonoras al cumplirse el tiempo
        </div>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleCars.map(cardFor)}
      </div>

      <Modal open={modalStart.open} onClose={()=>setModalStart({open:false, carro:null})} title={`Iniciar alquiler • ${modalStart.carro?.nombre ?? ""}`} footer={
        <>
          <Button onClick={()=>setModalStart({open:false, carro:null})}>Cancelar</Button>
          <Button className="bg-indigo-600 text-white" id="confirmStart" onClick={()=>{ const now = getLocalIso(); setStartInicio(now); startAlquiler(modalStart.carro, startTramo, now); setModalStart({open:false, carro:null}); }}>Iniciar</Button>
        </>
      }>
        <StartForm carro={modalStart.carro} tramo={startTramo} setTramo={setStartTramo} inicio={startInicio} setInicio={setStartInicio} tramos={tramos} tarifa={tarifa}/>
      </Modal>

      <Modal open={modalEnd.open} onClose={()=>setModalEnd({open:false, alquiler:null})} title={`Finalizar alquiler`} footer={
        <>
          <Button onClick={()=>setModalEnd({open:false, alquiler:null})}>Cancelar</Button>
          <Button className="bg-rose-600 text-white" id="confirmEnd" onClick={()=>{ finalizar(modalEnd.alquiler, endMetodo); setModalEnd({open:false, alquiler:null}); }}>Finalizar</Button>
        </>
      }>
        <EndForm metodo={endMetodo} setMetodo={setEndMetodo} tarifa={modalEnd.alquiler?.costo ?? tarifa}/>
      </Modal>

      <Modal open={modalMant.open} onClose={()=>setModalMant({open:false, carro:null, motivo:""})} title={`Mantenimiento • ${modalMant.carro?.nombre ?? ''}`} footer={
        <>
          <Button onClick={()=>setModalMant({open:false, carro:null, motivo:""})}>Cancelar</Button>
          <Button className="bg-slate-800 text-white" onClick={()=>{
            updateCar(modalMant.carro.id,{estado:'mantenimiento', motivo_mant: modalMant.motivo}).then(()=>{
              setCars(prev=>prev.map(c=>c.id===modalMant.carro.id?{...c, estado:'mantenimiento', motivo_mant: modalMant.motivo}:c));
              setModalMant({open:false, carro:null, motivo:""});
            });
          }}>Guardar</Button>
        </>
      }>
        <div className="space-y-4">
          <Label>Motivo de mantenimiento</Label>
          <Input value={modalMant.motivo} onChange={e=>setModalMant(m=>({...m, motivo:e.target.value}))} />
        </div>
      </Modal>

      <audio ref={audioRef} src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA/////w==" />
    </>
  );
}

export default Tablero;
