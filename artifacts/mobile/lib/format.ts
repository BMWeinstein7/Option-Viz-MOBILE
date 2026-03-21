export function fmtMoney(n: number | null | undefined): string {
  if (n == null) return "\u2014";
  const abs = Math.abs(n);
  if (abs >= 1000) return `${n >= 0 ? "+" : "-"}$${(abs / 1000).toFixed(1)}k`;
  return `${n >= 0 ? "+" : "-"}$${abs.toFixed(0)}`;
}

export function fmtDollar(n: number): string {
  if (n >= 0) return `$${n.toFixed(0)}`;
  return `-$${Math.abs(n).toFixed(0)}`;
}

export function fmtPercent(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function fmtPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}
