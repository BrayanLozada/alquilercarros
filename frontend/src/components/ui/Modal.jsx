import Card from "./Card";
import Button from "./Button";

const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button className="bg-slate-100" onClick={onClose}>Cerrar</Button>
        </div>
        <div className="p-4 space-y-4">{children}</div>
        {footer && <div className="p-4 border-t bg-slate-50 flex gap-2 justify-end">{footer}</div>}
      </Card>
    </div>
  );
};

export default Modal;
