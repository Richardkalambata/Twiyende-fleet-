export function kwachaToNgwee(kwacha: number): number {
  return Math.round(kwacha * 100);
}

export function parseMoney(input: string, maxNgwee: number): number | null {
  const cleaned = input.trim().replace(/[kK,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const ngwee = Math.round(Number(cleaned) * 100);
  if (!Number.isFinite(ngwee) || ngwee < 100 || ngwee > maxNgwee) return null;
  return ngwee;
}

export function parseFare(input: string): number | null {
  return parseMoney(input, 10_000);
}

export function formatBalance(ngwee: number): string {
  const sign = ngwee < 0 ? '-' : '';
  const abs = Math.abs(ngwee) / 100;
  return `${sign}K ${abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCompact(ngwee: number): string {
  const sign = ngwee < 0 ? '-' : '';
  const abs = Math.abs(ngwee);
  if (abs % 100 === 0) return `${sign}K${abs / 100}`;
  return `${sign}K${(abs / 100).toFixed(2)}`;
}

export function formatGrouped(ngwee: number): string {
  const sign = ngwee < 0 ? '-' : '';
  const abs = Math.abs(ngwee);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const withComma = whole.toLocaleString('en-US');
  if (frac === 0) return `${sign}K ${withComma}`;
  return `${sign}K ${withComma}.${String(frac).padStart(2, '0')}`;
}

export function formatPercent(current: number, previous: number): { text: string; up: boolean } | null {
  if (previous <= 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(pct * 10) / 10;
  return { text: `${Math.abs(rounded).toFixed(1)}%`, up: rounded >= 0 };
}

export function formatAxisKwacha(ngwee: number): string {
  const kwacha = ngwee / 100;
  if (kwacha >= 1000) {
    const compact = kwacha / 1000;
    const label = Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(1);
    return `K${label}K`;
  }
  return `K${Math.round(kwacha)}`;
}
