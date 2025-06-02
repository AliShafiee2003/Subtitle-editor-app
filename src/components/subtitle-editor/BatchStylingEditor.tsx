"use client";

import React, { useState } from 'react';
import { useAppStore } from '@/contexts/AppContext';
import { StylingControls } from '@/components/StylingControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Cue, StylingOptions } from '@/types';
import { parseCueRangeString } from '@/lib/parsers/cueRangeString'; // Create this utility

type BatchScope = 'all' | 'even' | 'odd' | 'specific';

export function BatchStylingEditor() {
  const { cues, updateCue } = useAppStore();
  const { toast } = useToast();

  const [batchScope, setBatchScope] = useState<BatchScope>('all');
  const [specificCuesInput, setSpecificCuesInput] = useState('');
  const [stylesToApply, setStylesToApply] = useState<Partial<StylingOptions>>({});

  const handleApplyBatchStyles = () => {
    if (cues.length === 0) {
      toast({ title: "No cues to style", description: "Please load some subtitles first.", variant: "default" });
      return;
    }
    if (Object.keys(stylesToApply).length === 0) {
        toast({ title: "No Styles Defined", description: "Please define some styles to apply.", variant: "default" });
        return;
    }

    let targetCueIndices: number[] = [];

    switch (batchScope) {
      case 'all':
        targetCueIndices = cues.map((_, index) => index);
        break;
      case 'even':
        targetCueIndices = cues.reduce((acc, _, index) => {
          if ((index + 1) % 2 === 0) acc.push(index); // 1-based index for even/odd
          return acc;
        }, [] as number[]);
        break;
      case 'odd':
        targetCueIndices = cues.reduce((acc, _, index) => {
          if ((index + 1) % 2 !== 0) acc.push(index); // 1-based index for even/odd
          return acc;
        }, [] as number[]);
        break;
      case 'specific':
        try {
          targetCueIndices = parseCueRangeString(specificCuesInput, cues.length);
        } catch (error) {
          toast({ title: "Invalid Cue Range", description: (error as Error).message, variant: "destructive" });
          return;
        }
        break;
      default:
        break;
    }

    if (targetCueIndices.length === 0 && batchScope === 'specific') {
        toast({ title: "No Cues Matched", description: "The specific cue range resulted in no cues.", variant: "default" });
        return;
    }


    let updatedCount = 0;
    targetCueIndices.forEach(index => {
      if (cues[index]) {
        const currentCue = cues[index];
        // Merge new styles with existing per-cue styles. New styles take precedence.
        const newMergedStyle = {
          ...currentCue.style, // Existing cue-specific styles
          ...stylesToApply,    // New styles to apply
        };
        updateCue({ ...currentCue, style: newMergedStyle });
        updatedCount++;
      }
    });

    toast({ title: "Batch Styles Applied", description: `Styles applied to ${updatedCount} cue(s).` });
    // Optionally reset stylesToApply after applying
    // setStylesToApply({}); 
  };

  const handleResetStylesToApply = () => {
    setStylesToApply({});
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="batch-scope" className="text-sm">Apply to:</Label>
        <Select value={batchScope} onValueChange={(value: BatchScope) => setBatchScope(value)}>
          <SelectTrigger id="batch-scope" className="h-9 text-xs">
            <SelectValue placeholder="Select scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cues</SelectItem>
            <SelectItem value="even">Even-Numbered Cues</SelectItem>
            <SelectItem value="odd">Odd-Numbered Cues</SelectItem>
            <SelectItem value="specific">Specific Cues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {batchScope === 'specific' && (
        <div>
          <Label htmlFor="specific-cues" className="text-sm">Specific Cue Numbers:</Label>
          <Input
            id="specific-cues"
            value={specificCuesInput}
            onChange={(e) => setSpecificCuesInput(e.target.value)}
            placeholder="e.g., 1,3,5-10"
            className="h-9 text-xs"
          />
          <p className="text-xs text-muted-foreground mt-1">Comma-separated numbers or ranges (e.g., 1,2,5-7).</p>
        </div>
      )}

      <StylingControls
        value={stylesToApply}
        onValueChange={setStylesToApply}
        onReset={handleResetStylesToApply}
        resetButtonLabel="Clear Batch Definition"
        title="Define Batch Styles"
      />

      <Button onClick={handleApplyBatchStyles} className="w-full">
        Apply Batch Styles
      </Button>
    </div>
  );
}