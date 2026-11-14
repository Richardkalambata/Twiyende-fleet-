export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  let local = digits;
  if (local.startsWith('260')) local = `0${local.slice(3)}`;
  if (local.length === 9) local = `0${local}`;
  if (!/^0(9|7)\d{8}$/.test(local)) return null;
  return local;
}

export function formatPhone(local: string): string {
  const digits = local.replace(/\D/g, '');
  if (digits.length !== 10) return local;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

export function phoneToTel(local: string): string {
  const normalized = normalizePhone(local);
  if (!normalized) return local;
  return `+260${normalized.slice(1)}`;
}
