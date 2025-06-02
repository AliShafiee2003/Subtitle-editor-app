
"use client";

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { exportSrt } from '@/lib/exporters/srt';
import { exportVtt } from '@/lib/exporters/vtt';
import { exportAss } from '@/lib/exporters/ass';
import type { SupportedFormat } from '@/types';

export function ProjectControls() {
  const { currentProject, cues } = useAppStore();
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<SupportedFormat>('srt');

  const handleExport = () => {
    if (!currentProject || cues.length === 0) {
      toast({ title: 'No content to export.', description: 'Please add subtitles or load a project.', variant: 'destructive'});
      return;
    }
    try {
      let content = '';
      let fileExtension = selectedFormat;
      let mimeType = `text/${selectedFormat}`;

      if (selectedFormat === 'srt') {
        content = exportSrt(cues, currentProject);
      } else if (selectedFormat === 'vtt') {
        content = exportVtt(cues, currentProject);
      } else if (selectedFormat === 'ass') {
        content = exportAss(cues, currentProject);
        mimeType = 'text/plain'; // .ass often served as plain text for download
      } else {
        toast({ title: 'Unsupported Format', description: 'Selected export format is not supported.', variant: 'destructive'});
        return;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name.replace(/\s+/g, '_') || 'subtitles'}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Project Exported', description: `Exported as ${a.download}.`});
    } catch (error) {
      console.error("Export failed:", error);
      toast({ title: 'Export Failed', description: 'Could not export the project.', variant: 'destructive'});
    }
  };

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center space-x-2">
        <Label htmlFor="export-format-select" className="text-xs font-medium shrink-0">Format:</Label>
        <Select value={selectedFormat} onValueChange={(value: SupportedFormat) => setSelectedFormat(value)}>
          <SelectTrigger id="export-format-select" className="w-[150px] h-9 text-xs">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="srt">SRT (.srt)</SelectItem>
            <SelectItem value="vtt">VTT (.vtt)</SelectItem>
            <SelectItem value="ass">ASS (.ass)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleExport} size="sm" className="whitespace-nowrap">
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export
        </Button>
      </div>
      <p className="text-xs text-muted-foreground p-1">
        SRT and VTT exports include basic bold/italic styling. ASS export includes a default style based on global settings. Full styling export is format-dependent.
      </p>
    </div>
  );
}
