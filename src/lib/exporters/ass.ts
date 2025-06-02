
import type { Cue, Project } from '@/types';
import { secondsToTime } from '@/lib/utils';

// Helper to convert seconds to H:MM:SS.cc format for ASS
function secondsToAssTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60; // This will include fractional seconds
  const centiseconds = Math.floor((seconds - Math.floor(seconds)) * 100);

  const hh = String(hours).padStart(1, '0'); // ASS uses single digit for hour if < 10
  const mm = String(minutes).padStart(2, '0');
  const ss = String(Math.floor(seconds)).padStart(2, '0');
  const cc = String(centiseconds).padStart(2, '0');

  return `${hh}:${mm}:${ss}.${cc}`;
}

export function exportAss(cues: Cue[], project?: Project): string {
  const projectName = project?.name || 'Untitled Project';
  const globalStyles = project?.globalStyles;

  let assContent = `[Script Info]
Title: ${projectName}
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1280
PlayResY: 720
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${globalStyles?.fontFamily || 'Arial'},${globalStyles?.fontSize?.replace('px', '') || '28'},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,${globalStyles?.bold ? '-1' : '0'},${globalStyles?.italic ? '-1' : '0'},0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  cues.forEach((cue) => {
    const textToExport = (cue.translatedText || cue.originalText).replace(/\n/g, '\\N'); // ASS uses \N for newlines
    const startTime = secondsToAssTime(cue.startTime);
    const endTime = secondsToAssTime(cue.endTime);
    
    // For simplicity, all events use the "Default" style.
    // More advanced export would involve creating specific styles per cue if overrides exist.
    assContent += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${textToExport}\n`;
  });

  return assContent;
}
