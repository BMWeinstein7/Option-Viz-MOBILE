export default function Builder() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 flex px-[7vw] py-[9vh] gap-[5vw]">
        <div className="flex flex-col w-[46vw]">
          <span className="font-body text-[1.5vw] tracking-[0.3em] uppercase text-primary">03</span>
          <h2 className="font-display font-bold text-[4.2vw] tracking-tight text-text mt-[1.5vh]">
            Strategy Builder
          </h2>
          <div className="flex flex-col gap-[2.6vh] mt-[5vh]">
            <p className="font-body text-[1.9vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              12+ templates across 6 categories: Basic, Spreads, Income, Volatility, Neutral, Hedging
            </p>
            <p className="font-body text-[1.9vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              Custom multi-leg builder with editable contract sizes
            </p>
            <p className="font-body text-[1.9vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              Live midpoint pricing per leg, refreshed every 5 seconds
            </p>
            <p className="font-body text-[1.9vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              Built-in Reg-T margin calculator with buying-power impact
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-[1.6vh]">
          <div className="rounded-[0.9vw] bg-card border border-white/10 px-[1.6vw] py-[1.8vh] flex items-center justify-between">
            <span className="font-display font-medium text-[1.6vw] text-text">Buy 1 × AAPL 230C</span>
            <span className="font-body text-[1.5vw] text-primary">mid 4.35</span>
          </div>
          <div className="rounded-[0.9vw] bg-card border border-white/10 px-[1.6vw] py-[1.8vh] flex items-center justify-between">
            <span className="font-display font-medium text-[1.6vw] text-text">Sell 1 × AAPL 240C</span>
            <span className="font-body text-[1.5vw] text-primary">mid 1.90</span>
          </div>
          <div className="rounded-[0.9vw] bg-primary/10 border border-primary/40 px-[1.6vw] py-[1.8vh] flex items-center justify-between">
            <span className="font-display font-medium text-[1.6vw] text-text">Margin requirement</span>
            <span className="font-display font-bold text-[1.7vw] text-primary">$245.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
