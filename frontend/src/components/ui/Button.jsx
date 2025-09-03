const Button = ({ className = "", children, ...props }) => (
  <button
    className={`px-4 py-2 rounded-2xl shadow-sm border border-slate-200 hover:shadow transition active:scale-[0.98] ${className}`}
    {...props}
  >
    {children}
  </button>
);
export default Button;
