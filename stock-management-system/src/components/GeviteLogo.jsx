export default function GeviteLogo({ size = 80, showText = true, className = '' }) {
  const r = size;
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg width={r} height={r} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer dark navy circle */}
        <circle cx="100" cy="100" r="99" fill="#08082a" stroke="#1a1a5e" strokeWidth="1.5"/>

        {/* Golden sun/circle background for palm icon */}
        <circle cx="100" cy="82" r="40" fill="#D4A017"/>

        {/* Person head (circle above palm) */}
        <circle cx="100" cy="52" r="7" fill="#08082a"/>

        {/* Palm trunk */}
        <rect x="97" y="74" width="6" height="30" rx="3" fill="#08082a"/>

        {/* Palm fronds - left spread */}
        <path d="M100 80 Q75 68 60 72 Q72 64 100 75" fill="#08082a"/>
        <path d="M100 78 Q78 60 68 58 Q80 55 100 73" fill="#08082a"/>
        <path d="M100 82 Q72 80 60 88 Q72 78 100 80" fill="#08082a"/>

        {/* Palm fronds - right spread */}
        <path d="M100 80 Q125 68 140 72 Q128 64 100 75" fill="#08082a"/>
        <path d="M100 78 Q122 60 132 58 Q120 55 100 73" fill="#08082a"/>
        <path d="M100 82 Q128 80 140 88 Q128 78 100 80" fill="#08082a"/>

        {/* Center top frond */}
        <path d="M97 76 Q92 60 95 52 Q100 65 103 76" fill="#08082a"/>
      </svg>

      {showText && (
        <div className="text-center mt-2 leading-tight">
          <div
            className="font-display font-bold tracking-wide"
            style={{
              color: '#D4A017',
              fontSize: r * 0.22,
              letterSpacing: '0.04em',
              textShadow: '0 0 20px rgba(212,160,23,0.3)',
            }}
          >
            Gevite Collective
          </div>
          <div
            className="tracking-widest uppercase font-medium"
            style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: r * 0.10,
              letterSpacing: '0.18em',
              marginTop: 2,
            }}
          >
            Lord Is Our Gracious
          </div>
        </div>
      )}
    </div>
  );
}
