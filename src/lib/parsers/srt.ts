import type { Cue } from '@/types';
import { timeToSeconds, generateRandomId } from '@/lib/utils';

export function parseSrt(srtContent: string): Cue[] {
  const cues: Cue[] = [];
  const lines = srtContent.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    // Skip empty lines and find the cue number
    while (i < lines.length && !lines[i].trim()) {
      i++;
    }
    if (i >= lines.length || !/^\d+$/.test(lines[i].trim())) {
      // If not a digit, it might be the end or malformed.
      // For robustness, one could try to find the next timecode.
      // For now, we'll break if we don't find a cue number.
      // However, some SRTs might not have cue numbers or have them out of order.
      // A more robust parser might ignore the cue number line if it's missing
      // and directly look for a timecode.
      // For now, let's assume standard format.
      if (i < lines.length && lines[i].includes('-->')) {
        // No cue number, but found timecode.
      } else {
         i++;
         continue; // Skip this line and try next
      }
    } else {
      i++; // Move past cue number
    }


    // Find the timecode line
    while (i < lines.length && !lines[i].includes('-->')) {
      // If we encounter another number, it implies a malformed SRT or end of previous cue text.
      if (/^\d+$/.test(lines[i].trim()) && i + 1 < lines.length && lines[i+1].includes('-->')) {
        break; // Start of a new cue block
      }
      i++;
    }
    if (i >= lines.length) break; // End of file

    const timeLine = lines[i].trim();
    const timeParts = timeLine.split(' --> ');
    if (timeParts.length !== 2) {
      console.warn(`Skipping malformed time line: ${timeLine}`);
      i++;
      continue;
    }

    const startTime = timeToSeconds(timeParts[0]);
    const endTime = timeToSeconds(timeParts[1]);
    i++;

    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') {
      textLines.push(lines[i].trim());
      i++;
    }
    // The loop for textLines will naturally stop when it hits an empty line or end of file.
    // After textLines, i will be on the empty line or past the end.
    // The outer while loop will then skip empty lines or break.

    if (textLines.length > 0) {
      cues.push({
        id: generateRandomId(),
        startTime,
        endTime,
        originalText: textLines.join('\n'),
        translatedText: '', // Initialize with empty translated text
      });
    }
  }
  return cues;
}
