export default function Analysis() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 flex px-[7vw] py-[9vh] gap-[5vw]">
        <div className="flex flex-col w-[40vw]">
          <span className="font-body text-[1.5vw] tracking-[0.3em] uppercase text-primary">04</span>
          <h2 className="font-display font-bold text-[4.2vw] tracking-tight text-text mt-[1.5vh]">
            Analysis &amp; Greeks
          </h2>
          <div className="flex flex-col gap-[2.8vh] mt-[5vh]">
            <p className="font-body text-[1.9vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              Payoff-at-expiration chart with break-even points
            </p>
            <p className="font-body text-[1.9vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              Max profit / max loss cards, color-coded
            </p>
            <p className="font-body text-[1.9vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              Delta, Gamma, Theta, Vega — per leg and net
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="rounded-[1vw] bg-card border border-white/10 p-[2vw]">
            <svg viewBox="0 0 400 220" className="w-full" role="img" aria-label="Payoff chart">
              <line x1="0" y1="130" x2="400" y2="130" stroke="#8b8fa3" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M 20 190 L 150 190 L 260 60 L 380 60" fill="none" stroke="#0abab5" strokeWidth="4" strokeLinecap="round" />
              <path d="M 20 175 L 150 175 C 200 175 220 85 260 78 L 380 70" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 5" opacity="0.7" />
              <circle cx="205" cy="130" r="6" fill="#fbbf24" />
            </svg>
            <div className="flex items-center justify-between mt-[2vh]">
              <span className="font-body text-[1.5vw] text-muted">Break-even</span>
              <span className="font-body text-[1.5vw] text-muted">Time decay 50% DTE</span>
              <span className="font-display font-bold text-[1.6vw] text-primary">Max profit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
