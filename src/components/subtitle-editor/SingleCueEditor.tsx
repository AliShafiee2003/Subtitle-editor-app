
"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, PlayCircle, Sparkles, Languages as LanguagesIcon } from 'lucide-react'; // Added Sparkles, LanguagesIcon
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/contexts/AppContext';
import type { Cue, VideoPlayerRef } from '@/types';
import { secondsToTime, timeToSeconds } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
// AI and Google Translate imports are now handled in HomePage for batch, not needed here for direct buttons
// import { translateSubtitle } from '@/ai/flows/translate-subtitle';
// import { fetchGoogleTranslation } from '@/lib/googleTranslateClient';

interface SingleCueEditorProps {
  videoPlayerRef: React.RefObject<VideoPlayerRef>;
}

export function SingleCueEditor({ videoPlayerRef }: SingleCueEditorProps) {
  const {
    currentCueForEditing,
    updateCue,
    setIsLoading: setAppIsLoading, // Renamed for clarity, if used
    isLoading: isAppLoading,
    cues,
    setFocusedCueId,
    focusNextCue,
    focusPreviousCue,
    focusedCueId,
    // AI/Google Translate states are read from AppContext for disabling buttons, but calls are in HomePage
    // isAiTranslationEnabled,
    // isGoogleTranslateEnabled,
    isBatchTranslating, // To disable inputs during batch operations
    targetLanguage,
  } = useAppStore();

  const [editableCue, setEditableCue] = useState<Cue | null>(currentCueForEditing);
  const [isProcessingAI, setIsProcessingAI] = useState(false); // Still used for AI Improve
  const { toast } = useToast();

  const [startTimeInput, setStartTimeInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  const [cueNumberInput, setCueNumberInput] = useState<string>('');

  useEffect(() => {
    if (currentCueForEditing) {
      setEditableCue(currentCueForEditing);
      setStartTimeInput(secondsToTime(currentCueForEditing.startTime));
      setEndTimeInput(secondsToTime(currentCueForEditing.endTime));

      const localCurrentIndex = cues.findIndex(cue => cue.id === currentCueForEditing.id);
      if (localCurrentIndex !== -1) {
        setCueNumberInput((localCurrentIndex + 1).toString());
      } else {
        setCueNumberInput(cues.length > 0 ? "1" : "0");
      }
    } else {
      setEditableCue(null);
      setStartTimeInput('');
      setEndTimeInput('');
      setCueNumberInput(cues.length > 0 ? "1" : "0");
    }
  }, [currentCueForEditing, cues]);


  const handleCueNavigationInputChange = (value: string) => {
    const num = parseInt(value, 10);
    const totalCues = cues.length;
    const localCurrentIndex = currentCueForEditing ? cues.findIndex(c => c.id === currentCueForEditing.id) : -1;


    if (isNaN(num)) {
      if (localCurrentIndex !== -1) setCueNumberInput((localCurrentIndex + 1).toString());
      else if (totalCues > 0) setCueNumberInput("1");
      else setCueNumberInput("0");
      return;
    }

    if (totalCues > 0 && num >= 1 && num <= totalCues) {
      setFocusedCueId(cues[num - 1].id);
    } else if (totalCues === 0 && num === 0) {
      setCueNumberInput("0");
    } else {
      toast({ title: "Invalid Cue Number", description: `Please enter a number between 1 and ${totalCues > 0 ? totalCues : 1}.`, variant: "destructive"});
      if (localCurrentIndex !== -1) {
        setCueNumberInput((localCurrentIndex + 1).toString());
      } else if (totalCues > 0) {
        setCueNumberInput("1");
      } else {
        setCueNumberInput("0");
      }
    }
  };

  const handleNavInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCueNumberInput(e.target.value);
  };

  const handleNavInputBlur = () => {
    handleCueNavigationInputChange(cueNumberInput);
  };

  const handleNavInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCueNavigationInputChange(cueNumberInput);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handlePreviousOrRewind = () => {
    const videoElement = videoPlayerRef.current?.getVideoElement();
    if (videoElement && !videoElement.paused) {
      const newTime = Math.max(0, videoElement.currentTime - 5);
      videoElement.currentTime = newTime;
      const activeCueAtNewTime = cues.find(
        (cue) => newTime >= cue.startTime && newTime < cue.endTime
      );
      if (activeCueAtNewTime && activeCueAtNewTime.id !== focusedCueId) {
        setFocusedCueId(activeCueAtNewTime.id);
      }
    } else {
      focusPreviousCue();
    }
  };
  
  const handleNextOrForward = () => {
    const videoElement = videoPlayerRef.current?.getVideoElement();
    if (videoElement && !videoElement.paused) {
      const newTime = Math.min(videoElement.duration || Infinity, videoElement.currentTime + 5);
      videoElement.currentTime = newTime;
       const activeCueAtNewTime = cues.find(
        (cue) => newTime >= cue.startTime && newTime < cue.endTime
      );
      if (activeCueAtNewTime && activeCueAtNewTime.id !== focusedCueId) {
        setFocusedCueId(activeCueAtNewTime.id);
      }
    } else {
      focusNextCue();
    }
  };

  const handlePlayCurrentCueSegment = () => {
    if (videoPlayerRef.current && currentCueForEditing) {
      videoPlayerRef.current.playCueSegment(currentCueForEditing.startTime, currentCueForEditing.endTime);
    } else {
      toast({ title: "Cannot Play Cue Segment", description: "No cue selected or video player not ready.", variant: "default"});
    }
  };

  if (!currentCueForEditing && isAppLoading && cues.length === 0) {
    return (
      <Card className="shadow-md w-full">
        <CardHeader className="p-4 bg-secondary/30 rounded-t-lg flex flex-row items-center justify-between">
           <Skeleton className="h-6 w-1/3" />
           <div className="flex items-center gap-1 md:gap-2">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 ml-2" />
           </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Skeleton className="h-4 w-1/3 mb-1" /><Skeleton className="h-10 w-full" /></div>
            <div><Skeleton className="h-4 w-1/3 mb-1" /><Skeleton className="h-10 w-full" /></div>
          </div>
          <div><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-20 w-full" /></div>
          <div><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-20 w-full" /></div>
        </CardContent>
      </Card>
    );
  }

  if (!editableCue || !currentCueForEditing) {
    return (
      <Card className="shadow-md flex items-center justify-center h-96 w-full">
        <CardContent className="p-4 text-center text-muted-foreground">
          <PlayCircle className="mx-auto h-12 w-12 opacity-50 mb-4" />
          <p className="text-lg font-medium">No Cue Selected</p>
          <p className="text-sm">
            {cues.length > 0 ? "Use navigation to select a cue or add a new one." : "Add a new cue to begin."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleTextChange = (field: 'originalText' | 'translatedText', value: string) => {
    if (!currentCueForEditing) return; // Guard against null currentCueForEditing
    const updatedLocalCue = { ...currentCueForEditing, [field]: value };
    updateCue(updatedLocalCue);
  };

  const handleTimeInputChange = (field: 'startTime' | 'endTime', value: string) => {
    if (field === 'startTime') setStartTimeInput(value);
    else setEndTimeInput(value);
  };

  const handleTimeInputBlur = (field: 'startTime' | 'endTime') => {
    if (!currentCueForEditing) return;
    const valueToParse = field === 'startTime' ? startTimeInput : endTimeInput;
    const originalNumericTime = currentCueForEditing[field];

    try {
      let newSeconds = timeToSeconds(valueToParse);
      newSeconds = parseFloat(newSeconds.toFixed(3));

      let tempStartTime = currentCueForEditing.startTime;
      let tempEndTime = currentCueForEditing.endTime;

      if (field === 'startTime') {
        tempStartTime = newSeconds;
      } else {
        tempEndTime = newSeconds;
      }

      if (tempStartTime >= tempEndTime && tempStartTime !== 0 && tempEndTime !== 0) {
        toast({
          title: "Invalid Time",
          description: `${field === 'startTime' ? 'Start time' : 'End time'} must be ${field === 'startTime' ? 'before end time' : 'after start time'}. Reverting.`,
          variant: "destructive"
        });
        if (field === 'startTime') setStartTimeInput(secondsToTime(originalNumericTime));
        else setEndTimeInput(secondsToTime(originalNumericTime));
        return;
      }
      const updatedLocalCue = { ...currentCueForEditing, [field]: newSeconds };
      updateCue(updatedLocalCue);
    } catch (e) {
      toast({ title: "Invalid Time Format", description: `Please use HH:MM:SS,mmm. Reverting. Error: ${(e as Error).message}`, variant: "destructive" });
      if (field === 'startTime') setStartTimeInput(secondsToTime(originalNumericTime));
      else setEndTimeInput(secondsToTime(originalNumericTime));
    }
  };

  const handleTimeAdjust = (field: 'startTime' | 'endTime', amount: number) => {
    if (!currentCueForEditing) return;
    let newTime = parseFloat((currentCueForEditing[field] + amount).toFixed(3));
    newTime = Math.max(0, newTime);

    let tempStartTime = currentCueForEditing.startTime;
    let tempEndTime = currentCueForEditing.endTime;

    if (field === 'startTime') {
      tempStartTime = newTime;
    } else {
      tempEndTime = newTime;
    }

    if (tempStartTime >= tempEndTime && tempStartTime !== 0 && tempEndTime !== 0) {
      toast({ title: "Invalid Time Adjustment", description: "Start time cannot be after or same as end time.", variant: "destructive" });
      return;
    }
    const updatedLocalCue = { ...currentCueForEditing, [field]: newTime };
    updateCue(updatedLocalCue);
  };

  const totalCuesDisplay = cues.length; // Use cues from store for total
  const currentIndexDisplay = currentCueForEditing ? cues.findIndex(c => c.id === currentCueForEditing.id) : -1;

  const isNavigationDisabled = totalCuesDisplay === 0 || isAppLoading || isProcessingAI || isBatchTranslating;
  const isOperationDisabled = isProcessingAI || isAppLoading || isBatchTranslating;

  return (
    <Card className="shadow-md w-full">
      <CardHeader className="flex flex-row items-center justify-between p-4 bg-secondary/30 rounded-t-lg">
        <CardTitle className="text-base font-semibold whitespace-nowrap">
          Editing Cue
        </CardTitle>
        <div className="flex items-center gap-1 md:gap-2 ml-2">
          <Button onClick={handlePreviousOrRewind} variant="ghost" size="icon" aria-label="Previous Cue or Rewind" disabled={isNavigationDisabled || (currentIndexDisplay === 0 && videoPlayerRef.current?.getVideoElement()?.paused) }>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center text-sm font-medium text-muted-foreground whitespace-nowrap tabular-nums min-w-[90px] sm:min-w-[100px] text-center">
            <Input
              type="number"
              value={cueNumberInput}
              onChange={handleNavInputChange}
              onBlur={handleNavInputBlur}
              onKeyDown={handleNavInputKeyDown}
              className="h-7 w-10 sm:w-12 p-1 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min={totalCuesDisplay > 0 ? "1" : "0"}
              max={totalCuesDisplay > 0 ? totalCuesDisplay.toString() : "0"}
              disabled={isNavigationDisabled}
              aria-label="Current cue number"
            />
            <span className="mx-1">/</span>
            <span>{totalCuesDisplay}</span>
          </div>
          <Button onClick={handleNextOrForward} variant="ghost" size="icon" aria-label="Next Cue or Forward" disabled={isNavigationDisabled || (currentIndexDisplay === totalCuesDisplay - 1 && videoPlayerRef.current?.getVideoElement()?.paused) }>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button
            onClick={handlePlayCurrentCueSegment}
            variant="ghost"
            size="icon"
            aria-label="Play Current Cue Segment"
            disabled={!currentCueForEditing || !videoPlayerRef?.current || isOperationDisabled}
            className="ml-2"
          >
            <PlayCircle className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`start-time-${editableCue.id}`} className="text-xs">Start Time (HH:MM:SS,mmm)</Label>
            <div className="flex items-center space-x-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleTimeAdjust('startTime', -0.1)} disabled={isOperationDisabled}>-</Button>
              <Input
                id={`start-time-${editableCue.id}`}
                type="text"
                value={startTimeInput}
                onChange={(e) => handleTimeInputChange('startTime', e.target.value)}
                onBlur={() => handleTimeInputBlur('startTime')}
                className="text-sm tabular-nums flex-grow h-8"
                disabled={isOperationDisabled}
                placeholder="00:00:00,000"
              />
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleTimeAdjust('startTime', 0.1)} disabled={isOperationDisabled}>+</Button>
            </div>
          </div>
          <div>
            <Label htmlFor={`end-time-${editableCue.id}`} className="text-xs">End Time (HH:MM:SS,mmm)</Label>
             <div className="flex items-center space-x-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleTimeAdjust('endTime', -0.1)} disabled={isOperationDisabled}>-</Button>
              <Input
                id={`end-time-${editableCue.id}`}
                type="text"
                value={endTimeInput}
                onChange={(e) => handleTimeInputChange('endTime', e.target.value)}
                onBlur={() => handleTimeInputBlur('endTime')}
                className="text-sm tabular-nums flex-grow h-8"
                disabled={isOperationDisabled}
                placeholder="00:00:00,000"
              />
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleTimeAdjust('endTime', 0.1)} disabled={isOperationDisabled}>+</Button>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor={`original-text-${editableCue.id}`} className="text-xs">Original Text</Label>
          <Textarea
            id={`original-text-${editableCue.id}`}
            value={editableCue.originalText}
            onChange={(e) => handleTextChange('originalText', e.target.value)}
            rows={3}
            className="text-sm w-full resize-none"
            disabled={isOperationDisabled}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1"> 
            <Label htmlFor={`translated-text-${editableCue.id}`} className="text-xs"> 
              Translated Text{targetLanguage ? ` (${targetLanguage.name})` : ''} 
            </Label> 
          </div>
          <Textarea
            id={`translated-text-${editableCue.id}`}
            value={editableCue.translatedText || ''}
            onChange={(e) => handleTextChange('translatedText', e.target.value)}
            rows={3}
            className="text-sm w-full resize-none"
            placeholder="Translated text will appear here..."
            disabled={isOperationDisabled}
          />
        </div>
        
      </CardContent>
      {/* Footer for processing messages can be added if needed */}
      {/* 
      {(isProcessingAI) && (
        <CardFooter className="p-2 border-t">
            <p className="text-xs text-muted-foreground animate-pulse">Processing...</p>
        </CardFooter>
      )}
      */}
    </Card>
  );
}

    