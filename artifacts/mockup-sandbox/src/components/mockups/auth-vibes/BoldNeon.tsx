import './_group.css';
import { TrendingUp, Eye, ArrowRight, Zap } from 'lucide-react';

export function BoldNeon() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(80% 60% at 20% 10%, #3a0d6b 0%, transparent 60%),' +
          'radial-gradient(70% 60% at 90% 90%, #6b0d4a 0%, transparent 55%),' +
          'linear-gradient(180deg, #0a0418 0%, #0a0418 100%)',
        fontFamily: '"Space Grotesk", sans-serif',
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Glow blobs */}
      <div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: '#FF2E9A', filter: 'blur(120px)', opacity: 0.35 }}
      />
      <div
        className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: '#00F0FF', filter: 'blur(120px)', opacity: 0.25 }}
      />

      <div className="relative w-full max-w-[360px]">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-[24px] blur-xl"
              style={{ background: '#FF2E9A', opacity: 0.6 }}
            />
            <div
              className="relative w-[88px] h-[88px] rounded-[24px] flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, #FF2E9A 0%, #8B2EE0 50%, #00F0FF 100%)',
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.4), 0 0 40px rgba(255,46,154,0.5)',
              }}
            >
              <TrendingUp size={40} strokeWidth={2.5} color="#fff" />
            </div>
          </div>
        </div>

        <h1
          className="text-center text-[44px] leading-none"
          style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            background:
              'linear-gradient(90deg, #FF2E9A 0%, #00F0FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          OPTIONVIZ
        </h1>
        <div className="flex items-center justify-center gap-2 mt-3 mb-7">
          <Zap size={12} color="#00F0FF" fill="#00F0FF" />
          <p
            className="text-[11px] uppercase"
            style={{ color: '#a799d0', letterSpacing: '0.32em', fontWeight: 600 }}
          >
            Strategy · Builder · Visualizer
          </p>
          <Zap size={12} color="#00F0FF" fill="#00F0FF" />
        </div>

        <div
          className="rounded-[20px] p-6 relative"
          style={{
            background: 'rgba(20, 8, 40, 0.6)',
            border: '1px solid rgba(255, 46, 154, 0.35)',
            backdropFilter: 'blur(20px)',
            boxShadow:
              '0 0 0 1px rgba(0, 240, 255, 0.08), 0 30px 80px -20px rgba(255, 46, 154, 0.25)',
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#00F0FF', boxShadow: '0 0 8px #00F0FF' }} />
            <h2
              className="text-[15px] uppercase"
              style={{ color: '#fff', letterSpacing: '0.32em', fontWeight: 700 }}
            >
              Welcome Back
            </h2>
            <div className="w-2 h-2 rounded-full" style={{ background: '#FF2E9A', boxShadow: '0 0 8px #FF2E9A' }} />
          </div>

          <NeonField label="EMAIL">
            <input
              type="email"
              defaultValue="you@example.com"
              className="w-full bg-transparent outline-none text-[15px]"
              style={{ color: '#fff', fontFamily: '"Space Grotesk", sans-serif' }}
            />
          </NeonField>

          <NeonField label="PASSWORD">
            <input
              type="password"
              placeholder="••••••••"
              className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-[#5a4a80]"
              style={{ color: '#fff', fontFamily: '"Space Grotesk", sans-serif' }}
            />
            <Eye size={16} color="#a799d0" />
          </NeonField>

          <button
            className="w-full mt-6 rounded-xl py-4 text-[14px] uppercase relative overflow-hidden group"
            style={{
              background:
                'linear-gradient(90deg, #FF2E9A 0%, #8B2EE0 50%, #00F0FF 100%)',
              color: '#0a0418',
              fontWeight: 700,
              letterSpacing: '0.24em',
              boxShadow:
                '0 0 24px rgba(255,46,154,0.5), inset 0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            <span className="relative">⚡ LOG IN ⚡</span>
          </button>

          <p
            className="text-center mt-5 text-[12px]"
            style={{ color: '#a799d0', letterSpacing: '0.05em' }}
          >
            New trader?{' '}
            <span
              style={{
                color: '#00F0FF',
                fontWeight: 700,
                textShadow: '0 0 8px rgba(0,240,255,0.6)',
              }}
            >
              SIGN UP →
            </span>
          </p>
        </div>

        <button
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] uppercase"
          style={{
            color: '#fff',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.12)',
            letterSpacing: '0.28em',
            fontWeight: 600,
          }}
        >
          Continue as guest
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function NeonField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div
        className="text-[10px] mb-2"
        style={{ color: '#00F0FF', letterSpacing: '0.32em', fontWeight: 600 }}
      >
        ▸ {label}
      </div>
      <div
        className="flex items-center gap-2 px-4 py-[14px] rounded-xl"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          boxShadow: 'inset 0 0 12px rgba(139, 46, 224, 0.15)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
