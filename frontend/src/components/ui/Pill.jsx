const Pill = ({ children, tone = "slate" }) => (
  <span className={`px-2 py-1 rounded-full text-xs bg-${tone}-100 text-${tone}-700 border border-${tone}-200`}>{children}</span>
);
export default Pill;
