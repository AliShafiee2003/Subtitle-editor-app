
"use client";

import React from 'react';
import { useAppStore } from '@/contexts/AppContext';
import { StylingControls } from '@/components/StylingControls';
import { DEFAULT_GLOBAL_STYLES } from '@/lib/constants';
import type { StylingOptions } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { MessageSquare } from 'lucide-react';

export function SingleCueStylingEditor() {
  const { currentCueForEditing, updateCue, isLoading } = useAppStore();

  if (isLoading && !currentCueForEditing) { // Show skeleton only if app is loading AND no cue is selected yet
    return (
      <div className="space-y-4 p-1">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!currentCueForEditing) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <MessageSquare className="mx-auto h-8 w-8 opacity-50 mb-2" />
        <p className="text-sm">No cue selected.</p>
        <p className="text-xs">Select a cue to edit its individual style.</p>
      </div>
    );
  }

  const handleStyleChange = (newCueStylesFromControls: Partial<StylingOptions>) => {
    if (currentCueForEditing) {
      // If newCueStylesFromControls is an empty object {}, it means all overrides should be cleared for this cue.
      // In this case, currentCueForEditing.style should become undefined.
      // Otherwise, currentCueForEditing.style should be newCueStylesFromControls.
      const finalStyleObject = (newCueStylesFromControls && Object.keys(newCueStylesFromControls).length > 0)
        ? newCueStylesFromControls
        : undefined;

      updateCue({ ...currentCueForEditing, style: finalStyleObject as StylingOptions | undefined });
    }
  };

  const handleResetToGlobal = () => {
    if (currentCueForEditing) {
      // This directly sets the cue's style to undefined, making it use global styles.
      updateCue({ ...currentCueForEditing, style: undefined });
    }
  };

  // cueSpecificStyles is the object of overrides. If style is undefined, it's an empty object.
  const cueSpecificStyles = currentCueForEditing.style || {};

  return (
    <StylingControls
      key={currentCueForEditing.id} // Force re-mount if the cue itself changes
      value={cueSpecificStyles}
      onValueChange={handleStyleChange}
      onReset={handleResetToGlobal}
      resetButtonLabel="Use Global Styles"
      title="Selected Cue Styles"
    />
  );
}
