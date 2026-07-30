export default function Performance() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 flex px-[7vw] py-[9vh] gap-[5vw]">
        <div className="flex flex-col w-[44vw]">
          <span className="font-body text-[1.5vw] tracking-[0.3em] uppercase text-primary">06</span>
          <h2 className="font-display font-bold text-[4.2vw] tracking-tight text-text mt-[1.5vh]">
            Performance analytics
          </h2>
          <div className="flex flex-col gap-[2.8vh] mt-[5vh]">
            <p className="font-body text-[1.9vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              Win rate, average gain/loss, rate of return, capital deployed
            </p>
            <p className="font-body text-[1.9vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              Top 5 winners and losers with timeframe filtering
            </p>
            <p className="font-body text-[1.9vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              One-tap PDF report export
            </p>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-[1.5vw] content-center">
          <div className="rounded-[1vw] bg-card border border-white/10 p-[1.8vw] flex flex-col gap-[1vh]">
            <span className="font-body text-[1.5vw] text-muted">Win rate</span>
            <span className="font-display font-bold text-[3.2vw] text-primary">%</span>
          </div>
          <div className="rounded-[1vw] bg-card border border-white/10 p-[1.8vw] flex flex-col gap-[1vh]">
            <span className="font-body text-[1.5vw] text-muted">Rate of return</span>
            <span className="font-display font-bold text-[3.2vw] text-primary">ROR</span>
          </div>
          <div className="rounded-[1vw] bg-card border border-white/10 p-[1.8vw] flex flex-col gap-[1vh]">
            <span className="font-body text-[1.5vw] text-muted">Avg gain / loss</span>
            <span className="font-display font-bold text-[3.2vw] text-text">+/−</span>
          </div>
          <div className="rounded-[1vw] bg-card border border-white/10 p-[1.8vw] flex flex-col gap-[1vh]">
            <span className="font-body text-[1.5vw] text-muted">Report</span>
            <span className="font-display font-bold text-[3.2vw] text-text">PDF</span>
          </div>
        </div>
      </div>
    </div>
  );
}
