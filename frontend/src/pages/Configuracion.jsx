import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import Pill from "../components/ui/Pill";
import { getTramos, getCars, getUsuarios, getTarifaActiva, getRoles, createUser, updateUser, deleteUser } from "../lib/api";

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
  const [tarifa, setTarifa] = useState(0);
  const [roles, setRoles] = useState([]);

  useEffect(()=>{
    getTramos().then(setTramos);
    getCars().then(setCars);
    getUsuarios().then(setUsuarios);
    getTarifaActiva().then(t=>setTarifa(t?.monto ?? 0));
    getRoles().then(setRoles);
  },[]);

  const findRole = (nombre) => roles.find(r => r.nombre.toLowerCase() === nombre.toLowerCase());

  const handleNuevo = async () => {
    const username = prompt('Usuario');
    if(!username) return;
    const password = prompt('Contraseña');
    if(!password) return;
    const roleName = prompt('Rol (Admin/Supervisor/Operador)');
    const role = findRole(roleName || '');
    if(!role) return alert('Rol inválido');
    try {
      const u = await createUser({ username, password, role_id: role.id, activo: 1 });
      setUsuarios([...usuarios, { ...u, role: role.nombre }]);
    } catch(e){ alert(e.message); }
  };

  const handleEdit = async (u) => {
    const roleName = prompt('Rol (Admin/Supervisor/Operador)', u.role);
    const role = findRole(roleName || '');
    if(!role) return alert('Rol inválido');
    try {
      await updateUser(u.id, { role_id: role.id });
      setUsuarios(usuarios.map(x=>x.id===u.id ? { ...x, role: role.nombre, role_id: role.id } : x));
    } catch(e){ alert(e.message); }
  };

  const toggleActivo = async (u) => {
    try {
      const updated = await updateUser(u.id, { activo: u.activo ? 0 : 1 });
      setUsuarios(usuarios.map(x=>x.id===u.id ? { ...x, activo: updated.activo } : x));
    } catch(e){ alert(e.message); }
  };

  const handleDelete = async (u) => {
    if(!confirm('Eliminar usuario?')) return;
    try {
      await deleteUser(u.id);
      setUsuarios(usuarios.filter(x=>x.id!==u.id));
    } catch(e){ alert(e.message); }
  };

  return (
    <div className="space-y-4">
      <Section title="Tramos de tiempo" actions={<Button className="bg-slate-100 flex items-center gap-2"><Plus size={16}/> Nuevo</Button>}>
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
                    <Button className="bg-slate-100 mr-2"><Edit size={14}/></Button>
                    <Button className="bg-rose-50 text-rose-700"><Trash2 size={14}/></Button>
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
            <Input defaultValue={tarifa}/>
          </div>
          <div>
            <Label>Vigente desde</Label>
            <Input type="date" defaultValue={new Date().toISOString().slice(0,10)}/>
          </div>
          <div className="flex items-end">
            <Button className="bg-indigo-600 text-white">Guardar</Button>
          </div>
        </div>
      </Section>

      <Section title="Carros RC" actions={<Button className="bg-slate-100 flex items-center gap-2"><Plus size={16}/> Nuevo</Button>}>
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
                  <td className="text-right"><Button className="bg-slate-100 mr-2"><Edit size={14}/></Button><Button className="bg-rose-50 text-rose-700"><Trash2 size={14}/></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Usuarios y roles" actions={<Button className="bg-slate-100 flex items-center gap-2" onClick={handleNuevo}><Plus size={16}/> Nuevo</Button>}>
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
                    <Button className="bg-slate-100 mr-2" onClick={()=>handleEdit(u)}><Edit size={14}/></Button>
                    <Button className="bg-slate-100 mr-2" onClick={()=>toggleActivo(u)}>{u.activo ? 'Desactivar' : 'Activar'}</Button>
                    <Button className="bg-rose-50 text-rose-700" onClick={()=>handleDelete(u)}><Trash2 size={14}/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

export default Configuracion;
