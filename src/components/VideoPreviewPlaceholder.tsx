
"use client";

import Image from 'next/image'; // Keep for potential future use or icons
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Film as FilmIcon, TvMinimalPlay } from 'lucide-react';
import { useAppStore } from '@/contexts/AppContext';
import type { Cue, StylingOptions } from '@/types';
import { useEffect, useState } from 'react';
import { secondsToTime } from '@/lib/utils';

const renderSubtitlePreview = (text: string, globalStyles: StylingOptions, cueStyle?: StylingOptions) => {
  const style = { ...globalStyles, ...cueStyle };
  
  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    width: 'max-content',
    maxWidth: '90%',
    textAlign: 'center',
    zIndex: 10, // Ensure subtitle is above video controls
    padding: '0.25em 0.5em', // Default padding, can be overridden by style.backgroundColor existence below
  };

  if (style.verticalPlacement === 'Top') {
    positionStyle.top = style.customOffset || '10%';
    positionStyle.transform = 'translateX(-50%)';
  } else if (style.verticalPlacement === 'Middle') {
    positionStyle.top = '50%';
    positionStyle.transform = 'translate(-50%, -50%)';
  } else { // Bottom
    positionStyle.bottom = style.customOffset || '10%';
    positionStyle.transform = 'translateX(-50%)';
  }

  const inlineSpanStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    color: style.color,
    fontWeight: style.bold ? 'bold' : 'normal',
    fontStyle: style.italic ? 'italic' : 'normal',
    textShadow: style.textShadow,
    backgroundColor: style.backgroundColor, // This will apply background to the span
    padding: style.backgroundColor ? '0.25em 0.5em' : '0', // Apply padding only if background exists
    borderRadius: style.borderRadius,
    border: style.border,
    // Note: text-align is on the parent div (positionStyle)
  };
  
  return (
    <div style={positionStyle}>
      <span style={inlineSpanStyle} dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br />') }} />
    </div>
  );
};


export function VideoPlayer() { // Component was renamed from VideoPreviewPlaceholder
  const { cues, currentProject, targetLanguage, videoSrc } = useAppStore();
  const [activeCue, setActiveCue] = useState<Cue | null>(null);

  useEffect(() => {
    if (cues.length > 0) {
      setActiveCue(cues[0]); 
    } else {
      setActiveCue(null);
    }
  }, [cues]);

  const textToDisplay = activeCue ? (activeCue.translatedText || activeCue.originalText) : "";
  const globalStyles = currentProject?.globalStyles;

  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-base font-semibold flex items-center">
          <FilmIcon className="mr-2 h-5 w-5 text-primary" /> Video Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center bg-muted/30 p-0 md:p-2 relative aspect-video overflow-hidden">
        {videoSrc ? (
          <video
            key={videoSrc}
            src={videoSrc}
            controls
            className="w-full h-full object-contain"
            // Example: autoPlay if needed, but usually better with user interaction
            // autoPlay 
            // muted // Often needed for autoplay to work in browsers
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
            <TvMinimalPlay className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-sm font-medium">No video loaded.</p>
            <p className="text-xs">Use the controls to select a video file.</p>
          </div>
        )}
        {globalStyles && textToDisplay && renderSubtitlePreview(textToDisplay, globalStyles, activeCue?.style)}
      </CardContent>
      {activeCue && videoSrc && ( // Only show cue info if a video is loaded and there's an active cue
        <div className="p-2 text-xs border-t text-muted-foreground text-center">
          Displaying: Cue {cues.findIndex(c => c.id === activeCue.id) + 1} ({secondsToTime(activeCue.startTime, false)} - {secondsToTime(activeCue.endTime, false)})
          {targetLanguage ? ` [${targetLanguage.name}]` : ''}
        </div>
      )}
    </Card>
  );
}

    