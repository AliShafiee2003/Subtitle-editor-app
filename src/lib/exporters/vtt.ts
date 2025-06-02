
import type { Cue, Project } from '@/types';
import { secondsToTime } from '@/lib/utils';

// Helper function to apply basic styling (bold/italic) for VTT
function applyVttStyleToText(text: string, style?: Project['globalStyles']): string {
  if (!style) return text;
  let styledText = text;
  if (style.italic) {
    styledText = `<i>${styledText}</i>`;
  }
  if (style.bold) {
    styledText = `<b>${styledText}</b>`;
  }
  // VTT also supports <u> for underline, <c.classname> for classes, <v Author> for voice, etc.
  // For now, just bold and italic.
  return styledText;
}

export function exportVtt(cues: Cue[], project?: Project): string {
  let vttContent = 'WEBVTT\n\n';

  cues.forEach((cue, index) => {
    const effectiveStyle = { ...project?.globalStyles, ...cue.style };
    const textToExport = cue.translatedText || cue.originalText;
    const styledText = applyVttStyleToText(textToExport, effectiveStyle);

    // VTT cue numbers/IDs are optional but can be useful.
    // Using index + 1 as an identifier for simplicity.
    vttContent += `${index + 1}\n`;
    // VTT timestamps use '.' for milliseconds
    vttContent += `${secondsToTime(cue.startTime).replace(',', '.')} --> ${secondsToTime(cue.endTime).replace(',', '.')}\n`;
    vttContent += `${styledText}\n\n`;
  });

  return vttContent;
}
