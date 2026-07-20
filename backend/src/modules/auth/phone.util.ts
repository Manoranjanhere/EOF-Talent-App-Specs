/** Normalize to E.164. Defaults to India (+91) for 10-digit local numbers. */
export function normalizeMobileE164(
  value?: string,
  defaultCountryCode = "91"
): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const raw = value.trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    return undefined;
  }

  if (raw.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+${defaultCountryCode}${digits}`;
  }

  if (digits.startsWith(defaultCountryCode) && digits.length === 12) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

export function phonesMatch(a: string, b: string): boolean {
  const left = normalizeMobileE164(a);
  const right = normalizeMobileE164(b);
  return Boolean(left && right && left === right);
}
