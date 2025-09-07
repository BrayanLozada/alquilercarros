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
import { getCars, getTramos, getTarifaActiva, startRental, endRental, updateCar, getActiveRentals } from "../lib/api";
import { showError } from "../lib/alerts";

function Countdown({ seconds }){
  const m = Math.floor(seconds/60).toString().padStart(2,'0');
  const s = Math.floor(seconds%60).toString().padStart(2,'0');
  return <div className={`font-mono text-lg ${seconds===0?"text-rose-600 font-bold animate-pulse":""}`}>{m}:{s}</div>;
}

function StartForm({ carro, tramo, setTramo, inicio, setInicio, tramos, tarifa, metodo, setMetodo }){
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
        <div>
          <Label>Método de pago</Label>
          <Select value={metodo} onChange={e=>setMetodo(e.target.value)}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia (Nequi)</option>
          </Select>
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
  const STORAGE_KEY = "alquileres-temporales";
  const [modalStart, setModalStart] = useState({ open:false, carro:null });
  const [modalEnd, setModalEnd] = useState({ open:false, alquiler:null });
  const [modalMant, setModalMant] = useState({ open:false, carro:null, motivo:"" });
  const [startTramo, setStartTramo] = useState(null);
  const [endMetodo, setEndMetodo] = useState("efectivo");
  const getLocalIso = () => new Date(Date.now() - (new Date().getTimezoneOffset()*60000)).toISOString().slice(0,16);
  const [startInicio, setStartInicio] = useState(getLocalIso());
  const [, force] = useState(0);
  const audioRef = useRef(null);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingEnd, setLoadingEnd] = useState(false);
  // Referencia para evitar doble sincronización
  const isSyncingRef = useRef(false);

  // Intervalo para actualizar el contador y alertas
  // Intervalo para actualizar el contador y alertas y cambiar estado a 'alquilerterminado'
  useEffect(()=>{
    const t = setInterval(()=>{
      force(x=>x+1);
      setAlquileres(prev=>prev.map(a=>{
        if((a.estado==='activo'||a.estado==='en_uso'||a.estado==='en uso') && tiempoRestante(a)===0){
          if(audioRef.current && !a.alertado){ audioRef.current.play().catch(()=>{}); }
          return { ...a, alertado:true, estado:'alquilerterminado' };
        }
        return a;
      }));
    },1000);
    return ()=>clearInterval(t);
  },[]);

  // Sincronización y rehidratación robusta
  // Función para sincronizar alquileres activos y contadores
  const syncAlquileres = () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    let temporales = [];
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved){
      try {
        temporales = JSON.parse(saved).map(a=> (
          { ...a, inicio:new Date(a.inicio), fin:new Date(a.fin) }
        ));
      } catch(_) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    Promise.all([
      getCars().then(cs => {
        const mapped = cs.map(c => c.estado === 'en uso' ? { ...c, estado: 'en_uso' } : c);
        setCars(mapped);
      }),
      getTramos().then(d=>{ setTramos(d); if(d.length>0) setStartTramo(d[0].id); }),
      getTarifaActiva().then(t=>setTarifa(t?.monto ?? 0)),
      getActiveRentals().then(rs=>{
        const server = rs.map(a=> (
          { id:a.id, carroId:a.carro_id, tramoId:a.tramo_id, inicio:new Date(a.inicio), fin:new Date(new Date(a.inicio).getTime()+a.minutos*60000), costo:a.costo, estado:a.estado, alertado:false }
        ));
        const activosIds = new Set(server.map(a=>a.carroId));
        const soloTemporales = temporales.filter(a=>!activosIds.has(a.carroId));
        setAlquileres([...server, ...soloTemporales]);
      }).catch(showError)
    ]).finally(()=>{ isSyncingRef.current = false; });
  };

  // Ejecutar sincronización al montar y al recuperar el foco de la pestaña
  useEffect(() => {
    syncAlquileres();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncAlquileres();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Guardar solo temporales en localStorage
  useEffect(()=>{
    const temporales = alquileres
      .filter(a=>a.id?.toString().startsWith('tmp-') && a.estado==='activo')
      .map(a=>(
        { ...a, inicio:a.inicio.toISOString(), fin:a.fin.toISOString() }
      ));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(temporales));
  },[alquileres]);

  const activos = useMemo(
    () => alquileres.filter(a => ['activo', 'en_uso', 'en uso'].includes(String(a.estado).toLowerCase())),
    [alquileres]
  );
  const terminados = useMemo(
    () => alquileres.filter(a => String(a.estado).toLowerCase() === 'alquilerterminado'),
    [alquileres]
  );

  const startAlquiler = async (carro, tramoId, metodo) => {
    const tramo = tramos.find(t=>t.id===Number(tramoId));
    const inicio = new Date();
    const fin = new Date(inicio.getTime() + tramo.minutos * 60000);
    const tempId = `tmp-${inicio.getTime()}`;
    const nuevo = { id: tempId, carroId: carro.id, tramoId: tramo.id, inicio, fin, costo: tarifa, estado: 'activo', alertado: false, metodo };
    setAlquileres(prev => [...prev, nuevo]);
    setCars(prev => prev.map(c => c.id === carro.id ? { ...c, estado: 'en_uso' } : c));
    setLoadingStart(true);

    try {
      const res = await startRental({ carro_id: carro.id, tramo_id: tramoId, operador_id: user.id, inicio: getLocalIso(), metodo_pago: metodo });
      setAlquileres(prev => prev.map(a => a.id === tempId ? { ...a, id: res.id, costo: res.costo } : a));
    } catch (e) {
      setAlquileres(prev => prev.filter(a => a.id !== tempId));
      setCars(prev => prev.map(c => c.id === carro.id ? { ...c, estado: 'disponible' } : c));
      showError(e);
    } finally {
      setLoadingStart(false);
    }
  };

  const finalizar = async (alq, metodo="efectivo") => {
    setLoadingEnd(true);
    try {
      await endRental(alq.id, { metodo_pago: metodo, destino: 'disponible' });
      setAlquileres(prev=>prev.map(a=>a.id===alq.id?{...a, estado:'cerrado', metodo}:a));
      setCars(prev=>prev.map(c=>c.id===alq.carroId?{...c, estado:'disponible'}:c));
    } catch (e) {
      showError(e);
    } finally {
      setLoadingEnd(false);
    }
  };

  const tiempoRestante = (alq)=> Math.max(0, Math.floor((new Date(alq.fin)-new Date())/1000));

  const cardFor = (carro)=>{
    const activo = activos.find(a=>String(a.carroId)===String(carro.id));
    const terminado = terminados.find(a=>String(a.carroId)===String(carro.id));
    const estado = activo ? 'en_uso' : terminado ? 'alquilerterminado' : carro.estado;
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
            {estado === 'disponible' && <Pill tone="emerald">Disponible</Pill>}
            {estado === 'en_uso' && <Pill tone="red">En uso</Pill>}
            {estado === 'alquilerterminado' && <Pill tone="amber">Alquiler terminado</Pill>}
            {estado === 'mantenimiento' && <Pill tone="amber">Mantenimiento</Pill>}
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
            {estado==='disponible' && !activo && !terminado && (
              <Button className="bg-indigo-600 text-white flex items-center gap-2 text-sm" onClick={()=>{ setStartTramo(tramos[0]?.id ?? null); setStartInicio(getLocalIso()); setEndMetodo('efectivo'); getTarifaActiva().then(t=>setTarifa(t?.monto ?? 0)); setModalStart({open:true, carro}); }} disabled={loadingStart}><Play size={16}/> Iniciar alquiler</Button>
            )}
            {activo && (
              <Button className="bg-rose-600 text-white flex items-center gap-2 text-sm" disabled><Square size={16}/> En curso</Button>
            )}
            {terminado && (
              <Button className="bg-rose-600 text-white flex items-center gap-2 text-sm" onClick={()=>finalizar(terminado, terminado.metodo)} disabled={loadingEnd}><Square size={16}/> Terminar alquiler</Button>
            )}
            {user?.rol !== 'operador' && (
              <Button className="bg-slate-100 flex items-center gap-2 text-sm" onClick={()=>{
                if(estado==='mantenimiento'){
                  updateCar(carro.id,{estado:'disponible'}).then(()=>setCars(prev=>prev.map(c=>c.id===carro.id?{...c, estado:'disponible'}:c)));
                } else {
                  updateCar(carro.id,{estado:'mantenimiento'}).then(()=>setCars(prev=>prev.map(c=>c.id===carro.id?{...c, estado:'mantenimiento'}:c)));
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
          <Button className="bg-indigo-600 text-white" id="confirmStart" onClick={()=>{ startAlquiler(modalStart.carro, startTramo, endMetodo); setModalStart({open:false, carro:null}); }} disabled={loadingStart}>Iniciar</Button>
        </>
      }>
        <StartForm carro={modalStart.carro} tramo={startTramo} setTramo={setStartTramo} inicio={startInicio} setInicio={setStartInicio} tramos={tramos} tarifa={tarifa} metodo={endMetodo} setMetodo={setEndMetodo}/>
      </Modal>

  {/* Modal de finalizar alquiler eliminado. El método de pago se toma solo al iniciar el alquiler. */}

  {/* Modal de motivo de mantenimiento eliminado para admin. */}

      <audio ref={audioRef} src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA/////w==" />
    </>
  );
}

export default Tablero;
