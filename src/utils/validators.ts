// Validator utilities used across the app to enforce input sanity and help
// mitigate injection risks by validating and sanitizing user-provided data.

export const MAX_SEARCH_LENGTH = 100;

export function sanitizeSearchTerm(raw: string | null | undefined): string {
  if (!raw) return '';
  // Replace SQL wildcard characters that could be used to manipulate patterns
  // and trim length to a reasonable maximum.
  const cleaned = raw.replace(/[%_]/g, ' ').trim();
  return cleaned.slice(0, MAX_SEARCH_LENGTH);
}

export function isValidUUID(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
}

export function isPositiveNumber(n: any): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

export function sanitizeString(raw: string | null | undefined, maxLen = 200): string {
  if (!raw) return '';
  // Remove control characters and trim length
  const cleaned = raw
    .split('')
    .filter(c => {
      const code = c.charCodeAt(0);
      // keep printable ASCII and beyond; drop C0 control chars (0-31) and DEL (127)
      return code >= 32 && code !== 127;
    })
    .join('')
    .trim();
  return cleaned.slice(0, maxLen);
}
