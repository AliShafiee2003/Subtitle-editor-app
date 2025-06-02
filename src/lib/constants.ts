
import type { Language, StylingOptions } from '@/types';

export const APP_NAME = "Subtitle Weaver";

export const DEFAULT_LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'fa', name: 'Farsi (فارسی)' },
];

export const DEFAULT_GLOBAL_STYLES: StylingOptions = {
  fontFamily: 'var(--font-geist-sans)',
  fontSize: '20px', // Corresponds to "Subtitle" size
  color: '#FFFFFF', // White text
  bold: false,
  italic: false,
  textShadow: '1px 1px 2px rgba(0,0,0,0.7)', // Default shadow for readability
  verticalPlacement: 'Bottom',
  horizontalPlacement: 'Center', // New default
  // customOffset: '10%', // Removed
  backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent black background
  opacity: 1, // Opacity is now part of rgba for background
  borderRadius: '4px',
  border: 'none',
};

export const LOCAL_STORAGE_PROJECT_KEY = 'subtitleWeaverProject';
export const LOCAL_STORAGE_SETTINGS_KEY = 'subtitleWeaverSettings';
