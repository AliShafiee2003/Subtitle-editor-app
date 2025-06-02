
export type VerticalPlacement = 'Top' | 'Middle' | 'Bottom';
export type HorizontalPlacement = 'Left' | 'Center' | 'Right';

export interface StylingOptions {
  fontFamily?: string;
  fontSize?: string; // e.g., "20px" or "1.2em"
  color?: string; // hex/RGB e.g. "#FFFFFF"
  bold?: boolean;
  italic?: boolean;
  textShadow?: string; // e.g., "1px 1px 2px black"
  verticalPlacement?: VerticalPlacement;
  horizontalPlacement?: HorizontalPlacement; // New: for 9-zone positioning
  backgroundColor?: string; // hex/RGB/RGBA e.g. "#000000", "rgba(0,0,0,0.5)"
  // opacity?: number; // Opacity is now handled by backgroundColor's alpha channel (RGBA)
  borderRadius?: string; // e.g., "4px" for background
  border?: string; // e.g., "1px solid black" for background
}

export interface Cue {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  originalText: string;
  translatedText: string;
  notes?: string;
  annotations?: string;
  // Individual styling properties for per-cue overrides
  style?: StylingOptions; // Per-cue style overrides
}

export interface Language {
  code: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  cues: Cue[];
  targetLanguage: Language | null;
  globalStyles: StylingOptions;
  uiLanguage: string; // e.g., 'en', 'fa'
  theme: 'light' | 'dark';
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  isAiTranslationEnabled?: boolean;
  aiCreativityLevel?: number; // 0 to 1
  aiCustomPrompt?: string;
  isGoogleTranslateEnabled?: boolean;
}

export type SupportedFormat = 'srt' | 'vtt' | 'ass' | 'xml';

export interface VideoPlayerRef {
  playCueSegment: (startTime: number, endTime: number) => Promise<void>;
  getVideoElement: () => HTMLVideoElement | null; // Added to get video element
}

