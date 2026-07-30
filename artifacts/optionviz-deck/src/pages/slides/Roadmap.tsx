export default function Roadmap() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute -bottom-[20vh] right-[10vw] w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute inset-0 flex flex-col px-[7vw] py-[9vh]">
        <span className="font-body text-[1.5vw] tracking-[0.3em] uppercase text-primary">08</span>
        <h2 className="font-display font-bold text-[4.2vw] tracking-tight text-text mt-[1.5vh]">
          Roadmap
        </h2>
        <div className="flex flex-col gap-[3.4vh] mt-[7vh] max-w-[70vw]">
          <div className="flex items-center gap-[2vw]">
            <span className="font-display font-bold text-[2.2vw] text-primary w-[4vw] shrink-0">1</span>
            <p className="font-body text-[2.2vw] leading-[1.4] text-text/90" style={{ textWrap: 'pretty' }}>
              In-app live vs simulated data indicator and rate-limit resilience
            </p>
          </div>
          <div className="flex items-center gap-[2vw]">
            <span className="font-display font-bold text-[2.2vw] text-primary w-[4vw] shrink-0">2</span>
            <p className="font-body text-[2.2vw] leading-[1.4] text-text/90" style={{ textWrap: 'pretty' }}>
              Clean typecheck across all packages and remaining dependency patches
            </p>
          </div>
          <div className="flex items-center gap-[2vw]">
            <span className="font-display font-bold text-[2.2vw] text-primary w-[4vw] shrink-0">3</span>
            <p className="font-body text-[2.2vw] leading-[1.4] text-text/90" style={{ textWrap: 'pretty' }}>
              App store release readiness
            </p>
          </div>
        </div>
        <div className="flex items-center gap-[1.2vw] mt-auto">
          <div className="h-[0.3vh] w-[6vw] bg-primary rounded-full" />
          <span className="font-display font-bold text-[1.8vw] text-text">
            Option<span className="text-primary">Viz</span>
          </span>
        </div>
      </div>
    </div>
  );
}
