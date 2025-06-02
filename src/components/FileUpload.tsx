
"use client";

import type React from 'react';
import { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { readFileAsText } from '@/lib/utils';
import { parseSrt } from '@/lib/parsers/srt';
import { parseAss } from '@/lib/parsers/ass';
import { useAppStore } from '@/contexts/AppContext';
import type { Cue, SupportedFormat } from '@/types';

interface FileUploadProps {
  onFileParsed: (cues: Cue[], fileName: string, format: SupportedFormat) => void;
}

export function FileUpload({ onFileParsed }: FileUploadProps) {
  const { toast } = useToast();
  const { isLoading, setIsLoading } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.name.endsWith('.srt') || file.name.endsWith('.vtt') || file.name.endsWith('.ass')) {
        handleProcessFile(file);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload an SRT, VTT, or ASS file.',
          variant: 'destructive',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProcessFile = async (fileToProcess: File) => {
    setIsLoading(true);
    try {
      const fileContent = await readFileAsText(fileToProcess);
      let cues: Cue[];
      let format: SupportedFormat;

      if (fileToProcess.name.endsWith('.srt')) {
        cues = parseSrt(fileContent);
        format = 'srt';
      } else if (fileToProcess.name.endsWith('.vtt')) {
        toast({ title: "VTT parsing not yet implemented.", description: "Only basic SRT and ASS parsing is available for now.", variant: "default" });
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      } else if (fileToProcess.name.endsWith('.ass')) {
        cues = parseAss(fileContent); // parseAss now takes string content
        format = 'ass';
      } else {
        toast({ title: "Unsupported file format.", variant: "destructive" });
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (typeof onFileParsed === 'function') {
        onFileParsed(cues, fileToProcess.name, format);
      } else {
        console.error("FileUpload: onFileParsed prop is not a function or is undefined.", { onFileParsedFromProps: onFileParsed });
        toast({
          title: 'Internal Error',
          description: 'File processing callback is missing. Please report this issue.',
          variant: 'destructive',
        });
      }


      if (format === 'srt' || (format === 'ass' && cues.length > 0)) {
        toast({
          title: 'File Processed',
          description: `${cues.length} cues loaded from ${fileToProcess.name}. ${format === 'ass' ? 'Basic ASS support.' : ''}`,
        });
      }

    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Error Processing File',
        description: 'Could not process the subtitle file. Please check its format.',
        variant: 'destructive',
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col items-start">
        <Input
          id="subtitle-file-upload"
          type="file"
          accept=".srt,.vtt,.ass"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
          disabled={isLoading}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          disabled={isLoading}
          className="w-full" 
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Choose Subtitle File
        </Button>
      </div>
    </div>
  );
}

    