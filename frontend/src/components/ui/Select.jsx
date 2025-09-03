const Select = ({ className = "", children, ...props }) => (
  <select
    className={`w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
    {...props}
  >
    {children}
  </select>
);
export default Select;
