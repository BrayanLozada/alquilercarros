import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const Input = ({ className = "", type = "text", ...props }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={`relative w-full ${className}`}>
      <input
        className={`w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isPassword ? "pr-10" : ""}`}
        type={isPassword && show ? "text" : type}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500"
          onClick={() => setShow((s) => !s)}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
};

export default Input;
