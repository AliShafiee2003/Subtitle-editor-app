
"use client";

import type React from 'react';
import { useState } from 'react';
import { Globe, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/contexts/AppContext';
import type { Language } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function LanguageControls() {
  const {
    targetLanguage,
    setTargetLanguage,
    availableLanguages,
    addCustomLanguage,
    // isAiTranslationEnabled, // No longer needed for this component's direct rendering logic
  } = useAppStore();

  const [isCustomLangDialogOpen, setIsCustomLangDialogOpen] = useState(false);
  const [customLangName, setCustomLangName] = useState('');
  const [customLangCode, setCustomLangCode] = useState('');
  const { toast } = useToast();

  // The decision to render this component is now handled by its parent (HomePage.tsx)
  // based on whether any translation mode (AI or Google) is active.

  const handleLanguageChange = (code: string) => {
    const selected = availableLanguages.find(lang => lang.code === code);
    if (selected) {
      setTargetLanguage(selected);
    }
  };

  const handleAddCustomLanguage = () => {
    if (customLangName.trim() && customLangCode.trim()) {
      if (availableLanguages.some(lang => lang.code.toLowerCase() === customLangCode.trim().toLowerCase())) {
        toast({ title: "Language code already exists.", variant: "destructive" });
        return;
      }
      addCustomLanguage({ name: customLangName.trim(), code: customLangCode.trim().toLowerCase() });
      setCustomLangName('');
      setCustomLangCode('');
      setIsCustomLangDialogOpen(false);
      toast({ title: "Custom language added." });
    } else {
      toast({ title: "Both name and code are required.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-2 p-1 pt-2"> {/* Added pt-2 for spacing from switch */}
      <Label className="text-sm font-medium flex items-center">
        <Globe className="mr-2 h-4 w-4" /> Target Language
      </Label>
      <div className="flex items-center space-x-2">
        <Select
          value={targetLanguage?.code || ''}
          onValueChange={handleLanguageChange}
        >
          <SelectTrigger className="flex-grow">
            <SelectValue placeholder="Select target language" />
          </SelectTrigger>
          <SelectContent>
            {availableLanguages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name} ({lang.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => setIsCustomLangDialogOpen(true)} aria-label="Add custom language">
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isCustomLangDialogOpen} onOpenChange={setIsCustomLangDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Language</DialogTitle>
            <DialogDescription>
              Enter the name and code (e.g., "en", "fr-CA") for your custom language.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="custom-lang-name">Language Name</Label>
              <Input
                id="custom-lang-name"
                value={customLangName}
                onChange={(e) => setCustomLangName(e.target.value)}
                placeholder="e.g., Klingon"
              />
            </div>
            <div>
              <Label htmlFor="custom-lang-code">Language Code</Label>
              <Input
                id="custom-lang-code"
                value={customLangCode}
                onChange={(e) => setCustomLangCode(e.target.value)}
                placeholder="e.g., tlh"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddCustomLanguage}>Add Language</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
