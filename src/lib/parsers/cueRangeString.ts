/**
 * Parses a cue range string (e.g., "1,3,5-7,10") into an array of 0-based cue indices.
 * @param input The string to parse.
 * @param totalCues The total number of cues available (used for range validation).
 * @returns An array of unique, sorted, 0-based cue indices.
 * @throws Error if input is invalid or ranges are out of bounds.
 */
export function parseCueRangeString(input: string, totalCues: number): number[] {
  if (!input.trim()) {
    return [];
  }

  const indices = new Set<number>();
  const parts = input.split(',');

  for (const part of parts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) continue;

    if (trimmedPart.includes('-')) {
      // Range
      const rangeEnds = trimmedPart.split('-');
      if (rangeEnds.length !== 2) {
        throw new Error(`Invalid range format: "${trimmedPart}". Use "start-end".`);
      }
      const start = parseInt(rangeEnds[0], 10);
      const end = parseInt(rangeEnds[1], 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid number in range: "${trimmedPart}".`);
      }
      if (start <= 0 || end <= 0) {
        throw new Error(`Cue numbers in range "${trimmedPart}" must be positive.`);
      }
      if (start > end) {
        throw new Error(`Start of range "${start}" cannot be greater than end "${end}".`);
      }
      if (end > totalCues) {
        throw new Error(`Range end "${end}" exceeds total cues (${totalCues}).`);
      }

      for (let i = start; i <= end; i++) {
        indices.add(i - 1); // Convert to 0-based index
      }
    } else {
      // Single number
      const num = parseInt(trimmedPart, 10);
      if (isNaN(num)) {
        throw new Error(`Invalid cue number: "${trimmedPart}".`);
      }
      if (num <= 0) {
        throw new Error(`Cue number "${num}" must be positive.`);
      }
      if (num > totalCues) {
        throw new Error(`Cue number "${num}" exceeds total cues (${totalCues}).`);
      }
      indices.add(num - 1); // Convert to 0-based index
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}