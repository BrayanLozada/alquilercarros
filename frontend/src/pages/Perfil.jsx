import { useState } from "react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import Button from "../components/ui/Button";
import { changePassword } from "../lib/api";

function Perfil({ user }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const handle = async () => {
    setError("");
    setOk("");
    if (nueva !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    try {
      await changePassword(user.id, actual, nueva);
      setOk("Contraseña actualizada");
      setActual("");
      setNueva("");
      setConfirmar("");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Card className="p-6 max-w-md">
      <div className="space-y-4">
        <h4 className="font-semibold">Cambiar contraseña</h4>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {ok && <div className="text-emerald-600 text-sm">{ok}</div>}
        <div className="space-y-2">
          <Label>Contraseña actual</Label>
          <Input type="password" value={actual} onChange={e=>setActual(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Nueva contraseña</Label>
          <Input type="password" value={nueva} onChange={e=>setNueva(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Confirmar nueva contraseña</Label>
          <Input type="password" value={confirmar} onChange={e=>setConfirmar(e.target.value)} />
        </div>
        <Button className="bg-indigo-600 text-white" onClick={handle}>Guardar</Button>
      </div>
    </Card>
  );
}

export default Perfil;
