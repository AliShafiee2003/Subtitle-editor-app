
import type { Cue, Project } from '@/types';
import { secondsToTime } from '@/lib/utils';

// Helper function to apply basic styling (bold/italic)
function applyStyleToText(text: string, style?: Project['globalStyles']): string {
  if (!style) return text;
  let styledText = text;
  if (style.italic) {
    styledText = `<i>${styledText}</i>`;
  }
  if (style.bold) {
    styledText = `<b>${styledText}</b>`;
  }
  return styledText;
}

export function exportSrt(cues: Cue[], project?: Project): string {
  let srtContent = '';
  cues.forEach((cue, index) => {
    const effectiveStyle = { ...project?.globalStyles, ...cue.style };
    const textToExport = cue.translatedText || cue.originalText;
    const styledText = applyStyleToText(textToExport, effectiveStyle);

    srtContent += `${index + 1}\n`;
    srtContent += `${secondsToTime(cue.startTime)} --> ${secondsToTime(cue.endTime)}\n`;
    srtContent += `${styledText}\n\n`;
  });
  return srtContent;
}
