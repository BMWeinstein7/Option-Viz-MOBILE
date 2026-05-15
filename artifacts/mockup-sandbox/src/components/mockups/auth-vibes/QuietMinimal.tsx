import './_group.css';
import { TrendingUp, Eye } from 'lucide-react';

export function QuietMinimal() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-8"
      style={{
        background: '#FAFAF7',
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      <div className="w-full max-w-[340px]">
        <div className="flex justify-center mb-10">
          <div
            className="w-14 h-14 flex items-center justify-center"
            style={{ border: '1px solid #1a1a1a', borderRadius: '2px' }}
          >
            <TrendingUp size={22} strokeWidth={1.25} color="#1a1a1a" />
          </div>
        </div>

        <h1
          className="text-center text-[26px] tracking-tight"
          style={{
            color: '#1a1a1a',
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 500,
            letterSpacing: '-0.02em',
          }}
        >
          option<span style={{ color: '#0ABAB5' }}>·</span>viz
        </h1>
        <p
          className="text-center mt-3 mb-12 text-[11px] uppercase"
          style={{ color: '#8a8a82', letterSpacing: '0.22em' }}
        >
          options · strategy · builder
        </p>

        <div className="space-y-8">
          <p
            className="text-center text-[11px] uppercase"
            style={{ color: '#8a8a82', letterSpacing: '0.28em' }}
          >
            — sign in —
          </p>

          <MinField label="email" defaultValue="you@example.com" />
          <MinField label="password" type="password" placeholder="••••••••" trailing />

          <button
            className="w-full py-[14px] text-[12px] uppercase transition-colors"
            style={{
              background: '#1a1a1a',
              color: '#FAFAF7',
              letterSpacing: '0.32em',
              borderRadius: '2px',
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            log in →
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: '#e2e2dc' }} />
            <span
              className="text-[10px] uppercase"
              style={{ color: '#a8a8a0', letterSpacing: '0.24em' }}
            >
              or
            </span>
            <div className="h-px flex-1" style={{ background: '#e2e2dc' }} />
          </div>

          <div className="space-y-4 text-center">
            <p
              className="text-[11px] uppercase"
              style={{ color: '#1a1a1a', letterSpacing: '0.22em' }}
            >
              create account
            </p>
            <p
              className="text-[11px] uppercase"
              style={{ color: '#0ABAB5', letterSpacing: '0.22em' }}
            >
              continue as guest
            </p>
          </div>
        </div>

        <p
          className="text-center mt-16 text-[10px] uppercase"
          style={{ color: '#a8a8a0', letterSpacing: '0.3em' }}
        >
          v1.0 · © 2026
        </p>
      </div>
    </div>
  );
}

function MinField({
  label,
  defaultValue,
  placeholder,
  type = 'text',
  trailing,
}: {
  label: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  trailing?: boolean;
}) {
  return (
    <div>
      <div
        className="text-[10px] uppercase mb-2"
        style={{ color: '#8a8a82', letterSpacing: '0.28em' }}
      >
        {label}
      </div>
      <div
        className="flex items-center gap-2 pb-2"
        style={{ borderBottom: '1px solid #1a1a1a' }}
      >
        <input
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[14px]"
          style={{
            color: '#1a1a1a',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        />
        {trailing && <Eye size={14} strokeWidth={1.25} color="#8a8a82" />}
      </div>
    </div>
  );
}
