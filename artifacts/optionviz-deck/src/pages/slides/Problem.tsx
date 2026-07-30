export default function Problem() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute -top-[20vh] -right-[10vw] w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute inset-0 flex flex-col px-[7vw] py-[9vh]">
        <span className="font-body text-[1.5vw] tracking-[0.3em] uppercase text-primary">01</span>
        <h2 className="font-display font-bold text-[4.2vw] tracking-tight text-text mt-[1.5vh]">
          The problem
        </h2>
        <div className="flex flex-col gap-[3.2vh] mt-[7vh] max-w-[74vw]">
          <div className="flex items-start gap-[2vw]">
            <div className="w-[0.35vw] self-stretch rounded-full bg-primary/60 shrink-0" />
            <p className="font-body text-[2.3vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              Options strategies are hard to reason about — payoffs, Greeks, and margin live in spreadsheets
            </p>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div className="w-[0.35vw] self-stretch rounded-full bg-primary/60 shrink-0" />
            <p className="font-body text-[2.3vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              Most broker apps bury multi-leg analysis behind clunky order tickets
            </p>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div className="w-[0.35vw] self-stretch rounded-full bg-primary/60 shrink-0" />
            <p className="font-body text-[2.3vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              Beginners can't safely experiment without risking real money
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
