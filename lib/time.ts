const TZ = 'Africa/Lusaka';
const HOUR = 60 * 60 * 1000;
export const LUSAKA_OFFSET_MS = 2 * HOUR;
export const DAY_MS = 24 * HOUR;

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

export type LusakaParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
};

export function lusakaParts(date = new Date()): LusakaParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hourCycle: 'h23',
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) bag[part.type] = part.value;
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    weekday: bag.weekday ?? 'Mon',
  };
}

export function lusakaToUtc(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): number {
  return Date.UTC(year, month - 1, day, hour, minute, second) - LUSAKA_OFFSET_MS;
}

export function startOfLusakaDay(date = new Date()): number {
  const { year, month, day } = lusakaParts(date);
  return lusakaToUtc(year, month, day, 0, 0);
}

export function startOfLusakaMonth(date = new Date()): number {
  const { year, month } = lusakaParts(date);
  return lusakaToUtc(year, month, 1, 0, 0);
}

export function addLusakaDays(date: Date, days: number): Date {
  const { year, month, day } = lusakaParts(date);
  return new Date(lusakaToUtc(year, month, day, 12, 0) + days * DAY_MS);
}

export function lusakaDateKey(date = new Date()): string {
  const { year, month, day } = lusakaParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function formatClock(epochMs: number): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(epochMs));
}

export function formatHour24(epochMs: number): string {
  const { hour, minute } = lusakaParts(new Date(epochMs));
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatShortDate(epochMs: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
  }).format(new Date(epochMs));
}

export function formatRideWhen(epochMs: number, now = new Date()): string {
  const start = startOfLusakaDay(now);
  const time = formatClock(epochMs);
  if (epochMs >= start && epochMs < start + DAY_MS) return `Today, ${time}`;
  if (epochMs >= start - DAY_MS && epochMs < start) return `Yesterday, ${time}`;
  return `${formatShortDate(epochMs)}, ${time}`;
}

export function formatPickupUntil(epochMs: number, now = new Date()): string {
  const start = startOfLusakaDay(now);
  const clock = formatHour24(epochMs);
  if (epochMs >= start && epochMs < start + DAY_MS) return `today until ${clock}`;
  if (epochMs >= start + DAY_MS && epochMs < start + 2 * DAY_MS) return `tomorrow until ${clock}`;
  return `${formatShortDate(epochMs)} until ${clock}`;
}

export function timeGreeting(date = new Date()): string {
  const { hour } = lusakaParts(date);
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function nextPickupDeadline(now = new Date()): number {
  const { year, month, day, hour } = lusakaParts(now);
  if (hour < 18) return lusakaToUtc(year, month, day, 18, 0);
  const tomorrow = lusakaParts(addLusakaDays(now, 1));
  return lusakaToUtc(tomorrow.year, tomorrow.month, tomorrow.day, 18, 0);
}

export function weekdayIndex(date = new Date()): number {
  return WEEKDAY_INDEX[lusakaParts(date).weekday] ?? 0;
}
