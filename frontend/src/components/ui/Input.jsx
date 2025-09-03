const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
    {...props}
  />
);
export default Input;
