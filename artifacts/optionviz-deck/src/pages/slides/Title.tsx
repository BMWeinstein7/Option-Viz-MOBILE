const base = import.meta.env.BASE_URL;

export default function Title() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <img
        src={`${base}hero.png`}
        crossOrigin="anonymous"
        alt="OptionViz app hero"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d12] via-[#0d0d12]/85 to-[#0d0d12]/20" />
      <div className="absolute inset-0 flex flex-col justify-center pl-[7vw] pr-[40vw]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2.6vw] h-[2.6vw] rounded-[0.6vw] bg-primary/15 border border-primary/40 flex items-center justify-center">
            <div className="w-[1.1vw] h-[1.1vw] rounded-[0.25vw] bg-primary" />
          </div>
          <span className="font-body text-[1.6vw] tracking-[0.3em] uppercase text-muted">
            Project Overview
          </span>
        </div>
        <h1
          className="font-display font-bold text-[7vw] leading-[1.02] tracking-tight text-text mt-[3.5vh]"
          style={{ textWrap: 'balance' }}
        >
          Option<span className="text-primary">Viz</span>
        </h1>
        <p
          className="font-body text-[2.2vw] leading-[1.4] text-text/85 mt-[3vh] max-w-[42vw]"
          style={{ textWrap: 'pretty' }}
        >
          Design, visualize, and track options strategies — from idea to P&amp;L.
        </p>
        <div className="flex items-center gap-[1.2vw] mt-[5vh]">
          <div className="h-[0.3vh] w-[6vw] bg-primary rounded-full" />
          <span className="font-body text-[1.5vw] text-muted">v3.4.0 · July 2026</span>
        </div>
      </div>
    </div>
  );
}
