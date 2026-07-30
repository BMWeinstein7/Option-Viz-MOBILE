export default function UnderTheHood() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 flex flex-col px-[7vw] py-[9vh]">
        <span className="font-body text-[1.5vw] tracking-[0.3em] uppercase text-primary">07</span>
        <h2 className="font-display font-bold text-[4.2vw] tracking-tight text-text mt-[1.5vh]">
          Under the hood
        </h2>
        <div className="grid grid-cols-2 gap-x-[3vw] gap-y-[3vh] mt-[6.5vh]">
          <div className="flex items-start gap-[1.4vw]">
            <div className="w-[0.35vw] self-stretch rounded-full bg-primary/60 shrink-0" />
            <p className="font-body text-[1.9vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              Expo React Native mobile app + Express 5 / TypeScript API in a pnpm monorepo
            </p>
          </div>
          <div className="flex items-start gap-[1.4vw]">
            <div className="w-[0.35vw] self-stretch rounded-full bg-primary/60 shrink-0" />
            <p className="font-body text-[1.9vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              PostgreSQL + Drizzle ORM; OpenAPI 3.1 contract with generated React Query hooks
            </p>
          </div>
          <div className="flex items-start gap-[1.4vw]">
            <div className="w-[0.35vw] self-stretch rounded-full bg-primary/60 shrink-0" />
            <p className="font-body text-[1.9vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              Secure sessions (bcrypt + expo-secure-store) with full guest mode
            </p>
          </div>
          <div className="flex items-start gap-[1.4vw]">
            <div className="w-[0.35vw] self-stretch rounded-full bg-primary/60 shrink-0" />
            <p className="font-body text-[1.9vw] leading-[1.45] text-text/90" style={{ textWrap: 'pretty' }}>
              Live market data via Yahoo Finance, with a Black-Scholes simulated fallback
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
