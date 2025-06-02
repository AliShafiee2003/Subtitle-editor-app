
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, X } from 'lucide-react';
import { useAppStore } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

interface CueToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  // videoPlayerRef might not be needed here anymore if PlayCue moved
}

export function CueToolbar({ className }: CueToolbarProps) {
  const {
    cues,
    setCues,
    focusedCueId,
    addAndFocusNewCue,
    deleteFocusedCue,
    isLoading: isAppLoading,
    currentCueForEditing,
   } = useAppStore();
  const { toast } = useToast();

  const totalCues = cues.length;
  const currentIndex = currentCueForEditing ? cues.findIndex(cue => cue.id === currentCueForEditing.id) : -1;

  const isActionDisabled = isAppLoading; 

  const handleDeleteCurrentCue = () => {
    if (focusedCueId) {
      const cueToDeleteIndex = cues.findIndex(cue => cue.id === focusedCueId);
      deleteFocusedCue(); 
      toast({ title: "Cue Deleted", description: `Cue ${cueToDeleteIndex !== -1 ? cueToDeleteIndex + 1 : ''} has been deleted.` });
    } else {
      toast({ title: "No cue selected", description: "Please select a cue to delete.", variant: "destructive" });
    }
  };

  return (
    <div className={cn("p-2 md:p-4 border-t bg-background mt-2", className)}> {/* Removed sticky, changed border-b to border-t, added mt-2 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Cue Actions (Left-aligned or takes available space) */}
        <div className="flex flex-wrap items-center gap-1 md:gap-2">
          <Button onClick={addAndFocusNewCue} size="sm" variant="outline" disabled={isActionDisabled}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Cue
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isActionDisabled || !focusedCueId}>
                <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete Cue
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Current Cue?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove cue {currentIndex !== -1 ? currentIndex + 1 : 'selected'}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCurrentCue} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Delete Cue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Batch Actions (Right-aligned) */}
        <div className="flex flex-wrap items-center gap-1 md:gap-2 ml-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isActionDisabled || totalCues === 0}>
                <X className="mr-2 h-4 w-4" /> Close All Cues
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close All Cues?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all {totalCues} cues from the project. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { setCues([]); toast({ title: "All cues closed." });}} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Close All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
