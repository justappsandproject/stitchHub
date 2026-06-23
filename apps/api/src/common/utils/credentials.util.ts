import { randomBytes } from 'crypto';

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghjkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SPECIAL = '!@#$%&*';

export function generateSecurePassword(length = 10): string {
  const required = [
    UPPER[randomBytes(1)[0] % UPPER.length],
    LOWER[randomBytes(1)[0] % LOWER.length],
    DIGITS[randomBytes(1)[0] % DIGITS.length],
    SPECIAL[randomBytes(1)[0] % SPECIAL.length],
  ];
  const all = UPPER + LOWER + DIGITS + SPECIAL;
  const rest = Array.from({ length: length - required.length }, () =>
    all[randomBytes(1)[0] % all.length],
  );
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export function usernameBase(firstName: string, lastName: string): string {
  return `${firstName}.${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');
}
