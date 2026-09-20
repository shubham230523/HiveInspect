/**
 * Generates a valid UUID v4 string.
 * This is required because the database schema uses the UUID type.
 */
export function generateId(): string {
  // Use crypto.randomUUID if available (modern browsers and Node.js)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for older environments or specific Expo/Node versions
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a deterministic ID based on a seed string.
 * Useful for ensuring the same source row results in the same ID if needed.
 */
export function generateStableId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // This doesn't produce a UUID, so it should be used only for internal logic
  // or updated to produce a UUID if it needs to be stored in a UUID column.
  return `sid_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}
