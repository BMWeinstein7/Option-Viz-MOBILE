import './_group.css';
import { TrendingUp, Eye, ArrowRight } from 'lucide-react';

export function WarmEditorial() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{
        background:
          'radial-gradient(120% 80% at 50% 0%, #3a201a 0%, #1f120e 55%, #14090a 100%)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div className="w-full max-w-[360px]">
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-[26px] flex items-center justify-center"
            style={{
              background:
                'linear-gradient(160deg, #2a1612 0%, #1a0d0a 100%)',
              border: '1px solid rgba(217, 156, 110, 0.25)',
              boxShadow:
                'inset 0 1px 0 rgba(255,220,180,0.06), 0 12px 30px -10px rgba(0,0,0,0.6)',
            }}
          >
            <TrendingUp size={34} strokeWidth={1.6} color="#E8A874" />
          </div>
        </div>

        <h1
          className="text-center text-[40px] leading-none tracking-tight"
          style={{
            fontFamily: '"Playfair Display", serif',
            color: '#F5E6D3',
            fontWeight: 600,
          }}
        >
          OptionViz
        </h1>
        <p
          className="text-center mt-3 mb-8 text-[14px]"
          style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            color: '#C9A98A',
          }}
        >
          Options Strategy Builder &amp; Visualizer
        </p>

        <div
          className="rounded-[22px] p-6"
          style={{
            background:
              'linear-gradient(180deg, rgba(245,230,211,0.05) 0%, rgba(245,230,211,0.02) 100%)',
            border: '1px solid rgba(217, 156, 110, 0.18)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <h2
            className="text-center text-[22px] mb-6"
            style={{
              fontFamily: '"Playfair Display", serif',
              color: '#F5E6D3',
              fontWeight: 600,
            }}
          >
            Welcome Back
          </h2>

          <Field label="Email">
            <input
              type="email"
              defaultValue="you@example.com"
              className="w-full bg-transparent outline-none text-[15px]"
              style={{ color: '#F5E6D3', fontFamily: 'Inter, sans-serif' }}
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              placeholder="Enter password"
              className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-[#7a6354]"
              style={{ color: '#F5E6D3', fontFamily: 'Inter, sans-serif' }}
            />
            <Eye size={16} color="#9a8170" />
          </Field>

          <button
            className="w-full mt-6 rounded-full py-[14px] text-[15px] tracking-wide transition-transform active:scale-[0.99]"
            style={{
              background:
                'linear-gradient(180deg, #E8A874 0%, #C8824D 100%)',
              color: '#2a1612',
              fontFamily: '"Playfair Display", serif',
              fontWeight: 600,
              letterSpacing: '0.04em',
              boxShadow:
                '0 12px 24px -8px rgba(200,130,77,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            Log In
          </button>

          <p
            className="text-center mt-5 text-[13px]"
            style={{
              color: '#9a8170',
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
            }}
          >
            New here?{' '}
            <span style={{ color: '#E8A874', fontStyle: 'normal', fontWeight: 600 }}>
              Create an account
            </span>
          </p>
        </div>

        <button
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 text-[13px] uppercase"
          style={{
            color: '#9a8170',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.18em',
          }}
        >
          Continue as guest
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div
        className="text-[10px] mb-2"
        style={{
          color: '#C9A98A',
          fontFamily: '"Playfair Display", serif',
          fontStyle: 'italic',
          letterSpacing: '0.12em',
        }}
      >
        — {label}
      </div>
      <div
        className="flex items-center gap-2 px-4 py-[14px] rounded-xl"
        style={{
          background: 'rgba(245,230,211,0.04)',
          border: '1px solid rgba(217, 156, 110, 0.22)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
