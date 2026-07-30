export default function Market() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute -top-[15vh] left-[30vw] w-[35vw] h-[35vw] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute inset-0 flex flex-col px-[7vw] py-[9vh]">
        <span className="font-body text-[1.5vw] tracking-[0.3em] uppercase text-primary">05</span>
        <h2 className="font-display font-bold text-[4.2vw] tracking-tight text-text mt-[1.5vh]">
          Market &amp; Portfolio
        </h2>
        <div className="grid grid-cols-3 gap-[2vw] mt-[8vh]">
          <div className="flex flex-col gap-[2vh]">
            <div className="h-[0.4vh] w-[4vw] bg-primary rounded-full" />
            <h3 className="font-display font-bold text-[2vw] text-text">Market data</h3>
            <p className="font-body text-[1.7vw] leading-[1.5] text-text/85" style={{ textWrap: 'pretty' }}>
              Streaming quotes, full options chains, and options-flow view with put/call ratio
            </p>
          </div>
          <div className="flex flex-col gap-[2vh]">
            <div className="h-[0.4vh] w-[4vw] bg-primary rounded-full" />
            <h3 className="font-display font-bold text-[2vw] text-text">Portfolio</h3>
            <p className="font-body text-[1.7vw] leading-[1.5] text-text/85" style={{ textWrap: 'pretty' }}>
              Dashboard with account balance, stock positions, and live unrealized P&amp;L
            </p>
          </div>
          <div className="flex flex-col gap-[2vh]">
            <div className="h-[0.4vh] w-[4vw] bg-primary rounded-full" />
            <h3 className="font-display font-bold text-[2vw] text-text">Trades</h3>
            <p className="font-body text-[1.7vw] leading-[1.5] text-text/85" style={{ textWrap: 'pretty' }}>
              Open at live midpoints; close at market or manually
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
