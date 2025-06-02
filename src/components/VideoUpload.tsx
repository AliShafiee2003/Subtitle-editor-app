
"use client";

import type React from 'react';
import { useState, useRef } from 'react';
import { Film, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Keep Input for the hidden file input
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/contexts/AppContext';

export function VideoUpload() {
  const { setVideoSrc, isLoading, setIsLoading } = useAppStore();
  // selectedVideoFile state is not strictly needed if not displaying name
  // const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith('video/')) {
        setIsProcessingVideo(true);
        // setIsLoading(true); // Use global loading state if preferred, or local for just video
        await new Promise(resolve => setTimeout(resolve, 250));

        const objectURL = URL.createObjectURL(file);
        setVideoSrc(objectURL);
        // setSelectedVideoFile(file);
        toast({
          title: 'Video Selected',
          description: `${file.name} is ready for preview.`,
        });
        setIsProcessingVideo(false);
        // setIsLoading(false);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a valid video file.',
          variant: 'destructive',
        });
        // setSelectedVideoFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else {
      // This case handles when the file input is cleared.
      // If a video was previously selected, remove it by setting videoSrc to null.
      // This check prevents calling handleRemoveVideo if no video was selected to begin with.
      // if (selectedVideoFile) { // Check if a file *was* selected
      //   setVideoSrc(null); 
      //   setSelectedVideoFile(null);
      //   toast({ title: 'Video Removed' });
      // }
      // No need for explicit remove if `selectedVideoFile` state is not used to display info
    }
  };
  
  const isBusy = isLoading || isProcessingVideo;

  return (
    <div>
      <input
        id="video-file-upload"
        type="file"
        accept="video/*,.mkv"
        onChange={handleVideoFileChange}
        ref={fileInputRef}
        className="hidden"
        disabled={isBusy}
      />
      <Label htmlFor="video-file-upload" className="cursor-pointer">
        <Button asChild className="w-full" variant="outline" disabled={isBusy}>
          <div className="flex items-center justify-center">
            {isBusy && !isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
            {isBusy && !isLoading ? 'Processing...' : 'Choose Video File'}
          </div>
        </Button>
      </Label>
      {/* Removed descriptive text and selected file name display */}
    </div>
  );
}
