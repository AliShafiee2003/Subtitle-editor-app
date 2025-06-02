import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeToSeconds(timeStr: string): number {
  const [timePart, msPart] = timeStr.split(',');
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds + Number(msPart) / 1000;
}

export function secondsToTime(totalSeconds: number, includeMilliseconds = true): string {
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  
  if (!includeMilliseconds) {
    return `${hh}:${mm}:${ss}`;
  }
  
  const mmm = String(milliseconds).padStart(3, '0');
  return `${hh}:${mm}:${ss},${mmm}`;
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15);
}
