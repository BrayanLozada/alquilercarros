const Card = ({ className = "", children }) => (
  <div className={`rounded-2xl bg-white shadow-sm border border-slate-200 ${className}`}>{children}</div>
);
export default Card;
