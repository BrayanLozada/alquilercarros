import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import { Download } from "lucide-react";

function Backups(){
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Respaldos</h3>
        <Button className="bg-slate-100 flex items-center gap-2"><Download size={16}/> Exportar respaldo</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>Hora diaria de backup</Label>
          <Input type="time" defaultValue="03:00"/>
        </div>
        <div className="flex items-end">
          <Button className="bg-indigo-600 text-white">Guardar</Button>
        </div>
      </div>
      <div className="mt-4">
        <Label>Historial</Label>
        <div className="mt-2 space-y-2">
          {["2025-09-01_0300","2025-08-31_0300","2025-08-30_0300"].map(k=> (
            <div key={k} className="flex items-center justify-between p-3 border rounded-xl">
              <div className="text-sm">{k}.zip</div>
              <Button className="bg-slate-100">Descargar</Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default Backups;
