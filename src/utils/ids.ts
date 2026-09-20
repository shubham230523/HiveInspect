export function generateId(): string {
  // Simple unique ID generator that works in both Node and Browser
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
  return `sid_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}
