import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import Pill from "../components/ui/Pill";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import { getTramos, getCars, getUsuarios, getTarifaActiva, setTarifa, getRoles, createUser, updateUser, deleteUser, createTramo, updateTramo, deleteTramo, createCar, updateCar } from "../lib/api";
import { getErrorMessage, showError } from "../lib/alerts";

const Section = ({ title, children, actions }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-semibold">{title}</h4>
      <div className="flex gap-2">{actions}</div>
    </div>
    {children}
  </Card>
);

function Configuracion(){
  const [tramos, setTramos] = useState([]);
  const [cars, setCars] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [tarifaMonto, setTarifaMonto] = useState(0);
  const [tarifaFecha, setTarifaFecha] = useState(new Date().toISOString().slice(0,10));
  const [roles, setRoles] = useState([]);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [userError, setUserError] = useState('');

  const [showTramoModal, setShowTramoModal] = useState(false);
  const [editingTramo, setEditingTramo] = useState(null);
  const [minutos, setMinutos] = useState('');
  const [tramoError, setTramoError] = useState('');

  const [showCarModal, setShowCarModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [nombre, setNombre] = useState('');
  const [modelo, setModelo] = useState('');
  const [color, setColor] = useState('');
  const [estado, setEstado] = useState('disponible');
  const [carError, setCarError] = useState('');

  useEffect(()=>{
    getTramos().then(setTramos);
    getCars().then(setCars);
    getUsuarios().then(setUsuarios);
    getTarifaActiva().then(t=>{ setTarifaMonto(t?.monto ?? 0); setTarifaFecha(t?.fecha_desde ?? new Date().toISOString().slice(0,10)); });
    getRoles().then(r=>{ setRoles(r); setRoleId(r[0]?.id || ''); });
  },[]);

  // Usuarios
  const openNewUser = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRoleId(roles[0]?.id || '');
    setUserError('');
    setShowUserModal(true);
  };
  const openEditUser = (u) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword('');
    setRoleId(u.role_id);
    setUserError('');
    setShowUserModal(true);
  };
  const saveUser = async () => {
    try {
      setUserError('');
      if(editingUser){
        const data = { username, role_id: roleId };
        if(password) data.password = password;
        const updated = await updateUser(editingUser.id, data);
        const role = roles.find(r=>r.id===updated.role_id);
        setUsuarios(usuarios.map(x=>x.id===updated.id ? { ...updated, role: role?.nombre } : x));
      } else {
        const u = await createUser({ username, password, role_id: roleId, activo: 1 });
        const role = roles.find(r=>r.id===u.role_id);
        setUsuarios([...usuarios, { ...u, role: role?.nombre }]);
      }
      setShowUserModal(false);
    } catch(e){ setUserError(getErrorMessage(e.message)); }
  };
  const toggleActivo = async (u) => {
    try {
      const updated = await updateUser(u.id, { activo: u.activo ? 0 : 1 });
      setUsuarios(usuarios.map(x=>x.id===u.id ? { ...x, activo: updated.activo } : x));
    } catch(e){ showError(e); }
  };
  const handleDelete = async (u) => {
    if(!confirm('Eliminar usuario?')) return;
    try {
      await deleteUser(u.id);
      setUsuarios(usuarios.filter(x=>x.id!==u.id));
    } catch(e){ showError(e); }
  };

  // Tramos
  const openNewTramo = () => {
    setEditingTramo(null);
    setMinutos('');
    setTramoError('');
    setShowTramoModal(true);
  };
  const openEditTramo = (t) => {
    setEditingTramo(t);
    setMinutos(t.minutos);
    setTramoError('');
    setShowTramoModal(true);
  };
  const saveTramo = async () => {
    try {
      setTramoError('');
      const m = parseInt(minutos,10);
      if(!Number.isInteger(m) || m<=0) return setTramoError('Minutos inválidos');
      if(editingTramo){
        const updated = await updateTramo(editingTramo.id,{ minutos:m });
        setTramos(tramos.map(x=>x.id===updated.id ? updated : x));
      } else {
        const created = await createTramo({ minutos:m });
        setTramos([...tramos, created]);
      }
      setShowTramoModal(false);
    } catch(e){ setTramoError(getErrorMessage(e.message)); }
  };
  const removeTramo = async (t) => {
    if(!confirm('Eliminar tramo?')) return;
    try {
      await deleteTramo(t.id);
      setTramos(tramos.filter(x=>x.id!==t.id));
    } catch(e){ showError(e); }
  };

  // Carros
  const openNewCar = () => {
    setEditingCar(null);
    setNombre('');
    setModelo('');
    setColor('');
    setEstado('disponible');
    setCarError('');
    setShowCarModal(true);
  };
  const openEditCar = (c) => {
    setEditingCar(c);
    setNombre(c.nombre);
    setModelo(c.modelo || '');
    setColor(c.color || '');
    setEstado(c.estado === 'mantenimiento' ? 'mantenimiento' : 'disponible');
    setCarError('');
    setShowCarModal(true);
  };
  const saveCar = async () => {
    try {
      setCarError('');
      const data = { nombre, modelo: modelo || null, color: color || null, estado };
      if(editingCar){
        const updated = await updateCar(editingCar.id, data);
        setCars(cars.map(x=>x.id===updated.id ? updated : x));
      } else {
        const created = await createCar(data);
        setCars([...cars, created]);
      }
      setShowCarModal(false);
    } catch(e){ setCarError(getErrorMessage(e.message)); }
  };

  const saveTarifa = async () => {
    try {
      await setTarifa({ monto: tarifaMonto, fecha_desde: tarifaFecha });
    } catch(e){ showError(e); }
  };

  return (
    <div className="space-y-4">
      <Section title="Tramos de tiempo" actions={<Button className="bg-slate-100 flex items-center gap-2" onClick={openNewTramo}><Plus size={16}/> Nuevo</Button>}>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500"><th className="py-2">Minutos</th><th>Activo</th><th></th></tr>
            </thead>
            <tbody>
              {tramos.map(t=> (
                <tr key={t.id} className="border-t">
                  <td className="py-2">{t.minutos}</td>
                  <td>{t.activo? 'Sí' : 'No'}</td>
                  <td className="text-right">
                    <Button className="bg-slate-100 mr-2" onClick={()=>openEditTramo(t)}><Edit size={14}/></Button>
                    <Button className="bg-rose-50 text-rose-700" onClick={()=>removeTramo(t)}><Trash2 size={14}/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Tarifa global">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Monto vigente</Label>
            <Input type="number" value={tarifaMonto} onChange={e=>setTarifaMonto(e.target.value)} />
          </div>
          <div>
            <Label>Vigente desde</Label>
            <Input type="date" value={tarifaFecha} onChange={e=>setTarifaFecha(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="bg-indigo-600 text-white" onClick={saveTarifa}>Guardar</Button>
          </div>
        </div>
      </Section>

      <Section title="Carros RC" actions={<Button className="bg-slate-100 flex items-center gap-2" onClick={openNewCar}><Plus size={16}/> Nuevo</Button>}>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500"><th className="py-2">Nombre</th><th>Modelo</th><th>Color</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {cars.map(c=> (
                <tr key={c.id} className="border-t">
                  <td className="py-2">{c.nombre}</td>
                  <td>{c.modelo}</td>
                  <td>{c.color}</td>
                  <td>{c.estado}</td>
                  <td className="text-right">
                    <Button className="bg-slate-100 mr-2" onClick={()=>openEditCar(c)}><Edit size={14}/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Usuarios y roles" actions={<Button className="bg-slate-100 flex items-center gap-2" onClick={openNewUser}><Plus size={16}/> Nuevo</Button>}>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500"><th className="py-2">Usuario</th><th>Rol</th><th>Activo</th><th></th></tr>
            </thead>
            <tbody>
              {usuarios.map(u=> (
                <tr key={u.id} className="border-t">
                  <td className="py-2">{u.username}</td>
                  <td><Pill tone={u.role==='Admin'? 'indigo' : u.role==='Supervisor'? 'amber' : 'emerald'}>{u.role}</Pill></td>
                  <td>{u.activo ? 'Sí' : 'No'}</td>
                  <td className="text-right">
                    <Button className="bg-slate-100 mr-2" onClick={()=>openEditUser(u)}><Edit size={14}/></Button>
                    <Button className="bg-slate-100 mr-2" onClick={()=>toggleActivo(u)}>{u.activo ? 'Desactivar' : 'Activar'}</Button>
                    <Button className="bg-rose-50 text-rose-700" onClick={()=>handleDelete(u)}><Trash2 size={14}/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Modal open={showUserModal} onClose={()=>setShowUserModal(false)} title={editingUser ? 'Editar usuario':'Nuevo usuario'}
        footer={<>
          <Button className="bg-slate-100" onClick={()=>setShowUserModal(false)}>Cancelar</Button>
          <Button className="bg-indigo-600 text-white" onClick={saveUser}>Guardar</Button>
        </>}>
        {userError && <div className="text-red-600 text-sm">{userError}</div>}
        <div className="space-y-2">
          <Label>Usuario</Label>
          <Input value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        {!editingUser && (
          <div className="space-y-2">
            <Label>Contraseña</Label>
            <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
        )}
        <div className="space-y-2">
          <Label>Rol</Label>
          <Select value={roleId} onChange={e=>setRoleId(Number(e.target.value))}>
            <option value="">Seleccionar...</option>
            {roles.map(r=> <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </Select>
        </div>
      </Modal>

      <Modal open={showTramoModal} onClose={()=>setShowTramoModal(false)} title={editingTramo ? 'Editar tramo':'Nuevo tramo'}
        footer={<>
          <Button className="bg-slate-100" onClick={()=>setShowTramoModal(false)}>Cancelar</Button>
          <Button className="bg-indigo-600 text-white" onClick={saveTramo}>Guardar</Button>
        </>}>
        {tramoError && <div className="text-red-600 text-sm">{tramoError}</div>}
        <div className="space-y-2">
          <Label>Minutos</Label>
          <Input type="number" value={minutos} onChange={e=>setMinutos(e.target.value)} />
        </div>
      </Modal>

      <Modal open={showCarModal} onClose={()=>setShowCarModal(false)} title={editingCar ? 'Editar carro':'Nuevo carro'}
        footer={<>
          <Button className="bg-slate-100" onClick={()=>setShowCarModal(false)}>Cancelar</Button>
          <Button className="bg-indigo-600 text-white" onClick={saveCar}>Guardar</Button>
        </>}>
        {carError && <div className="text-red-600 text-sm">{carError}</div>}
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={e=>setNombre(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Modelo</Label>
            <Input value={modelo} onChange={e=>setModelo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <Input value={color} onChange={e=>setColor(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={estado} onChange={e=>setEstado(e.target.value)}>
              <option value="disponible">Disponible</option>
              <option value="mantenimiento">Mantenimiento</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Configuracion;
