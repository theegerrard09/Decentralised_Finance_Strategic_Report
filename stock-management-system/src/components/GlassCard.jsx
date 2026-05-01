export default function GlassCard({ children, className = '', gold = false, onClick, style }) {
  const base = gold ? 'glass-card-gold' : 'glass-card';
  return (
    <div
      className={`${base} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}
