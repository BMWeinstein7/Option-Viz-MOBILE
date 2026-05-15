import './_group.css';
import { TrendingUp, Eye, ArrowUpRight } from 'lucide-react';

export function QuietPaper() {
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background: '#F4EFE6',
        fontFamily: '"JetBrains Mono", monospace',
        color: '#1a1714',
        backgroundImage:
          'radial-gradient(rgba(26,23,20,0.05) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
      }}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-7 py-5 border-b"
        style={{ borderColor: '#1a1714' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 flex items-center justify-center"
            style={{ background: '#1a1714', borderRadius: '2px' }}
          >
            <TrendingUp size={12} strokeWidth={2} color="#F4EFE6" />
          </div>
          <span
            className="text-[12px]"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            option<span style={{ color: '#0ABAB5' }}>·</span>viz
          </span>
        </div>
        <span
          className="text-[10px] uppercase"
          style={{ color: '#7a716a', letterSpacing: '0.28em' }}
        >
          Vol. I · No. 1
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center px-7">
        <div className="w-full max-w-[340px]">
          {/* Editorial header */}
          <p
            className="text-center text-[10px] uppercase mb-3"
            style={{ color: '#7a716a', letterSpacing: '0.32em' }}
          >
            — Account —
          </p>
          <h2
            className="text-center text-[22px] leading-tight mb-2"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 500,
              letterSpacing: '-0.02em',
            }}
          >
            Welcome back, trader.
          </h2>
          <p
            className="text-center text-[12px] mb-10"
            style={{ color: '#7a716a' }}
          >
            Continue building your strategies.
          </p>

          {/* Numbered fields */}
          <NumberedField
            num="01"
            label="email address"
            defaultValue="you@example.com"
          />
          <NumberedField
            num="02"
            label="password"
            type="password"
            placeholder="••••••••"
            trailing
          />

          <div
            className="flex items-center justify-end mt-2 mb-7 text-[10px] uppercase"
            style={{ color: '#0ABAB5', letterSpacing: '0.28em' }}
          >
            forgot? <ArrowUpRight size={11} strokeWidth={1.6} className="ml-1" />
          </div>

          <button
            className="w-full py-[15px] text-[12px] uppercase relative overflow-hidden"
            style={{
              background: '#1a1714',
              color: '#F4EFE6',
              letterSpacing: '0.32em',
              borderRadius: '2px',
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 500,
              boxShadow: '4px 4px 0 #d6cdbe',
            }}
          >
            log in →
          </button>

          {/* Secondary block */}
          <div
            className="mt-10 p-5"
            style={{
              border: '1px solid #1a1714',
              borderRadius: '2px',
              boxShadow: '4px 4px 0 #d6cdbe',
            }}
          >
            <div className="flex items-start justify-between mb-1">
              <span
                className="text-[10px] uppercase"
                style={{ color: '#7a716a', letterSpacing: '0.32em' }}
              >
                03 — New here?
              </span>
              <span
                className="text-[10px] uppercase"
                style={{ color: '#cfc4b1', letterSpacing: '0.32em' }}
              >
                free
              </span>
            </div>
            <p
              className="text-[13px] mb-4"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              Open an account or browse as a guest first.
            </p>
            <div className="flex items-center gap-3">
              <button
                className="flex-1 py-[11px] text-[10px] uppercase"
                style={{
                  border: '1px solid #1a1714',
                  color: '#1a1714',
                  letterSpacing: '0.28em',
                  borderRadius: '2px',
                  fontWeight: 500,
                  background: 'transparent',
                }}
              >
                Sign up
              </button>
              <button
                className="flex-1 py-[11px] text-[10px] uppercase flex items-center justify-center gap-2"
                style={{
                  color: '#0ABAB5',
                  letterSpacing: '0.28em',
                  fontWeight: 500,
                  background: 'transparent',
                }}
              >
                Guest →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-7 py-4 border-t text-[10px] uppercase"
        style={{ borderColor: '#1a1714', color: '#7a716a', letterSpacing: '0.24em' }}
      >
        <span>EST. 2026</span>
        <span>Printed in dark mode soon</span>
      </div>
    </div>
  );
}

function NumberedField({
  num,
  label,
  defaultValue,
  placeholder,
  type = 'text',
  trailing,
}: {
  num: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  trailing?: boolean;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-3 mb-2">
        <span
          className="text-[14px]"
          style={{
            color: '#1a1714',
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 500,
          }}
        >
          {num}
        </span>
        <span
          className="text-[10px] uppercase"
          style={{ color: '#7a716a', letterSpacing: '0.32em' }}
        >
          {label}
        </span>
      </div>
      <div
        className="flex items-center gap-2 pb-[6px] ml-7"
        style={{ borderBottom: '1px solid #1a1714' }}
      >
        <input
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[15px]"
          style={{
            color: '#1a1714',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        />
        {trailing && <Eye size={14} strokeWidth={1.4} color="#7a716a" />}
      </div>
    </div>
  );
}
