export default function Solution() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute -bottom-[25vh] -left-[10vw] w-[45vw] h-[45vw] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute inset-0 flex flex-col px-[7vw] py-[9vh]">
        <span className="font-body text-[1.5vw] tracking-[0.3em] uppercase text-primary">02</span>
        <h2 className="font-display font-bold text-[4.2vw] tracking-tight text-text mt-[1.5vh]">
          The solution
        </h2>
        <div className="grid grid-cols-3 gap-[2vw] mt-[8vh]">
          <div className="rounded-[1vw] bg-card border border-white/10 p-[2vw] flex flex-col gap-[2vh]">
            <span className="font-display font-bold text-[2.6vw] text-primary">Build</span>
            <p className="font-body text-[1.7vw] leading-[1.5] text-text/85" style={{ textWrap: 'pretty' }}>
              A mobile-first strategy builder: pick a ticker, pick a template, tune the legs, see the payoff instantly
            </p>
          </div>
          <div className="rounded-[1vw] bg-card border border-white/10 p-[2vw] flex flex-col gap-[2vh]">
            <span className="font-display font-bold text-[2.6vw] text-primary">Visualize</span>
            <p className="font-body text-[1.7vw] leading-[1.5] text-text/85" style={{ textWrap: 'pretty' }}>
              Interactive P&amp;L charts with Black-Scholes time-decay curves (75/50/25% DTE)
            </p>
          </div>
          <div className="rounded-[1vw] bg-card border border-white/10 p-[2vw] flex flex-col gap-[2vh]">
            <span className="font-display font-bold text-[2.6vw] text-primary">Track</span>
            <p className="font-body text-[1.7vw] leading-[1.5] text-text/85" style={{ textWrap: 'pretty' }}>
              Paper-trade with live midpoint pricing and track results over time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
