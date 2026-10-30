export function normalizeGhPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) {
    digits = `0${digits.slice(3)}`;
  }
  if (digits.length === 10 && digits.startsWith("0")) return digits;
  return null;
}

export function toE164(local: string) {
  return `+233${local.slice(1)}`;
}

export function formatLocalPhone(local: string) {
  if (local.length !== 10) return local;
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}
