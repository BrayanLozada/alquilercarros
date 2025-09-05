import { useState } from "react";
import { Gauge, LogIn } from "lucide-react";
import { login } from "../lib/api";
import { getErrorMessage } from "../lib/alerts";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Input from "./ui/Input";
import Label from "./ui/Label";

function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <Card className="w-full max-w-md">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 grid place-items-center text-white"><Gauge size={20}/></div>
            <div>
              <h1 className="text-xl font-semibold">Sistema de Alquiler RC</h1>
              <p className="text-slate-500 text-sm">Iniciar sesión</p>
            </div>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="space-y-2">
            <Label>Usuario</Label>
            <Input value={usuario} onChange={e=>setUsuario(e.target.value)} placeholder="usuario"/>
          </div>
          <div className="space-y-2">
            <Label>Contraseña</Label>
            <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••"/>
          </div>
          <Button className="w-full bg-indigo-600 text-white flex items-center justify-center gap-2" onClick={async()=>{
            try {
              setError("");
              const user = await login(usuario, password);
              onLogin(user);
            } catch (e) {
              setError(getErrorMessage(e.message));
            }
          }}>
            <LogIn size={18}/> Entrar
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Login;
