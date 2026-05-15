import './_group.css';
import { TrendingUp, Eye } from 'lucide-react';

export function QuietRefined() {
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background: '#FAFAF7',
        fontFamily: '"JetBrains Mono", monospace',
        color: '#111',
      }}
    >
      {/* Top meta bar */}
      <div
        className="flex items-center justify-between px-7 pt-6 text-[10px] uppercase"
        style={{ color: '#9a9a92', letterSpacing: '0.28em' }}
      >
        <span>NYSE · 09:41</span>
        <span style={{ color: '#0ABAB5' }}>● live</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-7">
        <div className="w-full max-w-[340px] -mt-6">
          {/* Logo lockup: icon + wordmark inline */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div
              className="w-9 h-9 flex items-center justify-center"
              style={{
                border: '1px solid #111',
                borderRadius: '2px',
              }}
            >
              <TrendingUp size={16} strokeWidth={1.5} color="#111" />
            </div>
            <h1
              className="text-[26px] leading-none"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 500,
                letterSpacing: '-0.02em',
              }}
            >
              option<span style={{ color: '#0ABAB5' }}>·</span>viz
            </h1>
          </div>
          <p
            className="text-center text-[10px] uppercase mb-12"
            style={{ color: '#9a9a92', letterSpacing: '0.32em' }}
          >
            options strategy notebook
          </p>

          {/* Section header — single rule + label */}
          <div className="flex items-center gap-3 mb-7">
            <span
              className="text-[10px] uppercase"
              style={{ color: '#111', letterSpacing: '0.32em', fontWeight: 500 }}
            >
              01 — Sign in
            </span>
            <div className="h-px flex-1" style={{ background: '#111' }} />
          </div>

          <Field index="a" label="email" defaultValue="you@example.com" />
          <Field index="b" label="password" type="password" placeholder="••••••••" trailing />

          <button
            className="w-full mt-8 py-[15px] text-[12px] uppercase flex items-center justify-between px-5 transition-colors hover:bg-[#222]"
            style={{
              background: '#111',
              color: '#FAFAF7',
              letterSpacing: '0.32em',
              borderRadius: '2px',
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 500,
            }}
          >
            <span>log in</span>
            <span style={{ color: '#0ABAB5' }}>→</span>
          </button>

          {/* Secondary actions — labeled divider */}
          <div className="flex items-center gap-3 mt-10 mb-6">
            <div className="h-px flex-1" style={{ background: '#dcdcd4' }} />
            <span
              className="text-[10px] uppercase"
              style={{ color: '#9a9a92', letterSpacing: '0.32em' }}
            >
              02 — Or
            </span>
            <div className="h-px flex-1" style={{ background: '#dcdcd4' }} />
          </div>

          <button
            className="w-full py-[13px] text-[11px] uppercase mb-2 transition-colors"
            style={{
              border: '1px solid #111',
              color: '#111',
              letterSpacing: '0.32em',
              borderRadius: '2px',
              fontWeight: 500,
              background: 'transparent',
            }}
          >
            create account
          </button>
          <button
            className="w-full py-[13px] text-[11px] uppercase flex items-center justify-center gap-2"
            style={{
              color: '#0ABAB5',
              letterSpacing: '0.32em',
              fontWeight: 500,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#0ABAB5' }} />
            continue as guest
          </button>
        </div>
      </div>

      {/* Footer ticker */}
      <div
        className="flex items-center justify-between px-7 pb-6 pt-4 text-[10px] uppercase border-t"
        style={{ borderColor: '#e4e4dc', color: '#9a9a92', letterSpacing: '0.24em' }}
      >
        <span>SPY 612.40 <span style={{ color: '#0ABAB5' }}>+0.42%</span></span>
        <span>v1.0</span>
      </div>
    </div>
  );
}

function Field({
  index,
  label,
  defaultValue,
  placeholder,
  type = 'text',
  trailing,
}: {
  index: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  trailing?: boolean;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] uppercase"
          style={{ color: '#9a9a92', letterSpacing: '0.32em' }}
        >
          {label}
        </span>
        <span
          className="text-[10px] uppercase"
          style={{ color: '#cfcfc5', letterSpacing: '0.32em' }}
        >
          [{index}]
        </span>
      </div>
      <div
        className="flex items-center gap-2 pb-[6px]"
        style={{ borderBottom: '1px solid #111' }}
      >
        <input
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[15px]"
          style={{
            color: '#111',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        />
        {trailing && <Eye size={14} strokeWidth={1.4} color="#9a9a92" />}
      </div>
    </div>
  );
}
