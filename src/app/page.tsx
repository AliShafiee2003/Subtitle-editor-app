
"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { LanguageControls } from '@/components/LanguageControls';
import { ProjectControls } from '@/components/ProjectControls';
import { SingleCueEditor } from '@/components/subtitle-editor/SingleCueEditor';
import { VideoPlayer, type VideoPlayerRef } from '@/components/VideoPlayer';
import { useAppStore } from '@/contexts/AppContext';
import { VideoUpload } from '@/components/VideoUpload';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PanelLeft, Sparkles, StopCircle, Play, RotateCcw, Languages as LanguagesIcon, Youtube, Loader2, X } from 'lucide-react';
import { CueToolbar } from '@/components/subtitle-editor/CueToolbar';
import { useToast } from '@/hooks/use-toast';
import { translateSubtitle } from '@/ai/flows/translate-subtitle';
import { fetchGoogleTranslation } from '@/lib/googleTranslateClient';
import { parseTtml } from '@/lib/parsers/ttml';
import type { Cue, SupportedFormat } from '@/types';
import { SingleCueStylingEditor } from '@/components/subtitle-editor/SingleCueStylingEditor';
import { BatchStylingEditor } from '@/components/subtitle-editor/BatchStylingEditor';
import { type Project } from '@/types';

export default function HomePage() {
  const {
    cues,
    currentProject,
    // createNewProject, // No longer directly called from here if setCurrentProject handles it
    isLoading,
    setIsLoading,
    setCurrentProject, // This now uses _loadProjectData
    videoSrc,
    // setFocusedCueId, // Managed by AppContext via _loadProjectData
    isAiTranslationEnabled,
    setIsAiTranslationEnabled,
    aiCreativityLevel,
    setAiCreativityLevel,
    aiCustomPrompt,
    setAiCustomPrompt,
    isGoogleTranslateEnabled,
    setIsGoogleTranslateEnabled,
    targetLanguage,
    isBatchTranslating,
    setIsBatchTranslating,
    batchTranslationProgress,
    setBatchTranslationProgress,
    updateCue,
    batchTranslationAbortController,
    setBatchTranslationAbortController,
  } = useAppStore();

  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const { toast } = useToast();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isFetchingYoutubeSubs, setIsFetchingYoutubeSubs] = useState(false);


  useEffect(() => {
    if (!isLoading && !currentProject) {
      // AppContext now handles setting a default project on initial load
      // or loading from localStorage. If currentProject is still null after loading,
      // it implies an empty/new state which is fine.
      // No need to call createNewProject here as setCurrentProject(null) in AppContext
      // will trigger _loadProjectData(defaultProject()).
    }
  }, [isLoading, currentProject]);

  const handleFileParsed = useCallback((parsedCues: Cue[], fileName: string, format: SupportedFormat) => {
    const projectStem = fileName.split('.')[0] || 'Untitled Project';
    const newFocusedCueId = parsedCues.length > 0 ? parsedCues[0].id : null;

    if (currentProject) {
        const updatedProject = {
            ...currentProject,
            cues: parsedCues,
            name: projectStem,
            focusedCueId: newFocusedCueId, // Ensure focusedCueId is part of the project data
            updatedAt: Date.now(),
        };
        setCurrentProject(updatedProject); // This will trigger _loadProjectData in AppContext
    } else {
        // Create a new project structure and set it
        const newProj: Project = {
            id: uuidv4(), // Assuming uuidv4 is available or use generateRandomId
            name: projectStem,
            cues: parsedCues,
            targetLanguage: DEFAULT_LANGUAGES[0], // Use constants
            globalStyles: DEFAULT_GLOBAL_STYLES, // Use constants
            uiLanguage: 'en',
            theme: 'light', // Or derive from appTheme
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isAiTranslationEnabled: false,
            aiCreativityLevel: 0.5,
            aiCustomPrompt: '',
            isGoogleTranslateEnabled: false,
            focusedCueId: newFocusedCueId,
        };
        setCurrentProject(newProj); // This will trigger _loadProjectData
    }
    // No need to call setFocusedCueId directly here; _loadProjectData handles it
  }, [currentProject, setCurrentProject, /* removed createNewProject, setFocusedCueId */]);

  const handleFetchYoutubeSubtitles = useCallback(async () => {
    if (!youtubeUrl.trim()) {
      toast({ title: "No URL Provided", description: "Please enter a YouTube video URL.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setIsFetchingYoutubeSubs(true);
    try {
      const response = await fetch(`/api/fetch-subs?url=${encodeURIComponent(youtubeUrl)}&debug=true`);
      const responseText = await response.text(); // Read body once

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText || 'Request failed'}`;
        try {
          const errorData = JSON.parse(responseText); // Try to parse the text as JSON
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          } else if (responseText) {
             errorMessage = responseText.length > 200 ? responseText.substring(0, 200) + "..." : (responseText || errorMessage);
          }
        } catch (e) {
          // Parsing as JSON failed, responseText contains the raw (likely HTML) error
          if (response.status === 404) {
            errorMessage = "Could not find the subtitle fetching service (404). Please ensure the URL is correct and the application is set up properly.";
          } else if (responseText) {
             errorMessage = responseText.length > 200 ? responseText.substring(0, 200) + "..." : responseText;
          }
           console.warn(`API error response was not JSON (Status: ${response.status}, "${response.statusText}"). Body snippet:`, errorMessage, {responseText});
        }
        throw new Error(errorMessage);
      }
      
      const parsedCues = parseTtml(responseText);

      if (parsedCues.length > 0) {
        let videoName = "YouTube Video";
        try {
            const urlObj = new URL(youtubeUrl);
            const videoId = urlObj.searchParams.get('v');
            if (videoId) videoName = `YouTube_${videoId}`;
        } catch (e) { /* ignore parsing error, use default name */ }

        handleFileParsed(parsedCues, `${videoName}.xml`, 'xml');
        toast({ title: "Subtitles Fetched", description: `${parsedCues.length} cues loaded from YouTube.` });
        setYoutubeUrl('');
      } else {
        toast({ title: "No Subtitles Found", description: "No parseable subtitle cues found in the fetched content. The video might not have subtitles or they are in an unexpected format.", variant: "default" });
      }
    } catch (error) {
      console.error("Error fetching YouTube subtitles:", error);
      toast({
        title: "Error Fetching Subtitles",
        description: (error as Error).message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsFetchingYoutubeSubs(false);
    }
  }, [youtubeUrl, toast, setIsLoading, handleFileParsed]);


  const handleTranslateCues = useCallback(async (operationMode: 'restart_all' | 'process_untranslated') => {
    const translationModeActive = isAiTranslationEnabled || isGoogleTranslateEnabled;
    if (!translationModeActive || !targetLanguage || cues.length === 0) {
      toast({
        title: "Batch Translation Prerequisites Not Met",
        description: "Please enable a translation mode (AI or Google), select a target language, and load subtitles.",
        variant: "destructive",
      });
      return;
    }

    const controller = new AbortController();
    setBatchTranslationAbortController(controller);
    setIsBatchTranslating(true);
    setBatchTranslationProgress(0); 

    let cuesForThisOperation: Cue[];
    if (operationMode === 'restart_all') {
      cuesForThisOperation = cues.filter(cue => cue.originalText && cue.originalText.trim() !== '');
    } else { 
      cuesForThisOperation = cues.filter(
        (cue) => cue.originalText && cue.originalText.trim() !== '' && (!cue.translatedText || cue.translatedText.trim() === '')
      );
    }

    if (cuesForThisOperation.length === 0) {
      let descriptionText = "No cues found to process for the selected operation.";
      if (operationMode === 'process_untranslated') descriptionText = "No untranslated cues found to continue with.";
      else descriptionText = "No cues with original text found to (re)translate.";
      toast({ title: "No Cues to Translate", description: descriptionText });
      setIsBatchTranslating(false);
      setBatchTranslationAbortController(null);
      return;
    }

    toast({
      title: `Batch Translation Started (${isAiTranslationEnabled ? 'AI' : 'Google Translate'})`,
      description: `Preparing to translate ${cuesForThisOperation.length} cues...`,
      duration: 5000
    });

    let translatedInThisRun = 0;
    let rateLimitHit = false;
    let userCancelled = false;

    try {
      for (let i = 0; i < cuesForThisOperation.length; i++) {
        const cue = cuesForThisOperation[i];
        if (controller.signal.aborted) {
          userCancelled = true;
          break;
        }

        try {
          let result: { translatedText: string };
          if (isAiTranslationEnabled) {
            result = await translateSubtitle({
              text: cue.originalText,
              targetLanguage: targetLanguage.code,
              aiCreativityLevel: aiCreativityLevel,
              aiCustomPrompt: aiCustomPrompt,
            });
          } else { 
            result = await fetchGoogleTranslation(cue.originalText, targetLanguage.code);
          }
          updateCue({ ...cue, translatedText: result.translatedText });
          translatedInThisRun++;
          setBatchTranslationProgress( (i + 1) / cuesForThisOperation.length * 100);
        } catch (error) {
          console.error(`Error translating cue ${cue.id}:`, error);
          const errorMessage = (error as Error).message || "An unknown error occurred.";

          if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests")) {
            rateLimitHit = true;
            toast({
                title: "API Rate Limit Hit",
                description: "Translation stopped. Please wait or adjust settings and try again.",
                variant: "destructive",
                duration: 10000,
            });
            break; 
          } else {
             toast({
              title: `Error Translating Cue ${i + 1}`,
              description: `${errorMessage} Skipping this cue.`,
              variant: "destructive",
            });
          }
        }
      }
    } finally {
      if (userCancelled) {
         toast({ title: "Batch Translation Cancelled", description: "Translation process was stopped by the user." });
      } else if (rateLimitHit) {
        // "API Rate Limit Hit" toast already shown
      } else { 
        if (translatedInThisRun === cuesForThisOperation.length && cuesForThisOperation.length > 0) {
          toast({ title: "Batch Translation Complete", description: `Successfully processed ${cuesForThisOperation.length} cues.` });
        } else if (translatedInThisRun < cuesForThisOperation.length && translatedInThisRun > 0 && cuesForThisOperation.length > 0) {
          toast({ title: "Batch Translation Partially Completed", description: `Processed ${translatedInThisRun} of ${cuesForThisOperation.length} cues. Some errors may have occurred.` });
        } else if (cuesForThisOperation.length > 0 && translatedInThisRun === 0 && !userCancelled && !rateLimitHit ) {
          toast({ title: "Batch Translation Attempted", description: "No cues were successfully translated. Check for errors." });
        }
      }

      setIsBatchTranslating(false);
      setBatchTranslationAbortController(null);
      if (!userCancelled && !rateLimitHit && translatedInThisRun === cuesForThisOperation.length && cuesForThisOperation.length > 0) {
        setBatchTranslationProgress(100); 
      } else if (!isBatchTranslating && translatedInThisRun < cuesForThisOperation.length && cuesForThisOperation.length > 0) {
        // Keep progress if stopped or errored
      } else if (!isBatchTranslating && cuesForThisOperation.length === 0 && translatedInThisRun === 0) {
        // Reset if no cues were processed due to filter
        setBatchTranslationProgress(0);
      }
    }
  }, [
    isAiTranslationEnabled, isGoogleTranslateEnabled, targetLanguage, cues,
    setBatchTranslationAbortController, setIsBatchTranslating,
    aiCreativityLevel, aiCustomPrompt, updateCue, toast,
    setBatchTranslationProgress 
  ]);

  const handleStopTranslation = useCallback(() => {
    if (batchTranslationAbortController) {
      batchTranslationAbortController.abort();
      // Toast is now shown in the finally block of handleTranslateCues
    }
  },[batchTranslationAbortController, toast]);


  if (isLoading && !currentProject && cues.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Skeleton className="h-24 w-1/2" />
      </div>
    );
  }

  const hasVideo = Boolean(videoSrc);

  const renderBatchTranslateButtons = () => {
    const translationModeEnabled = isAiTranslationEnabled || isGoogleTranslateEnabled;
    const baseCanTranslate = translationModeEnabled && targetLanguage && cues.length > 0;

    if (isBatchTranslating) {
      return (
        <Button onClick={handleStopTranslation} variant="destructive" className="w-full">
          <StopCircle className="mr-2 h-4 w-4" /> Stop Translation
        </Button>
      );
    }
    
    const wasStoppedOrErrored = batchTranslationProgress > 0 && batchTranslationProgress < 100 && !isBatchTranslating;
    const canContinue = baseCanTranslate && cues.some(cue => cue.originalText && cue.originalText.trim() !== '' && (!cue.translatedText || cue.translatedText.trim() === ''));
    const canStartOrRestart = baseCanTranslate && cues.some(cue => cue.originalText && cue.originalText.trim() !== '');

    if (wasStoppedOrErrored) {
      return (
        <div className="flex space-x-2">
          <Button
            onClick={() => handleTranslateCues('process_untranslated')}
            disabled={!canContinue}
            className="flex-1"
          >
            <Play className="mr-2 h-4 w-4" /> Continue
            {isAiTranslationEnabled ? ' AI' : (isGoogleTranslateEnabled ? ' Google' : '')}
          </Button>
          <Button
            onClick={() => handleTranslateCues('restart_all')}
            variant="outline"
            disabled={!canStartOrRestart}
            className="flex-1"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Restart All
            {isAiTranslationEnabled ? ' AI' : (isGoogleTranslateEnabled ? ' Google' : '')}
          </Button>
        </div>
      );
    }

    return (
      <Button
        onClick={() => handleTranslateCues('restart_all')}
        disabled={!canStartOrRestart || !translationModeEnabled}
        className="w-full"
      >
        {isAiTranslationEnabled ? <Sparkles className="mr-2 h-4 w-4" /> : <LanguagesIcon className="mr-2 h-4 w-4" />}
        Translate All Cues {isAiTranslationEnabled ? 'with AI' : (isGoogleTranslateEnabled ? 'with Google' : '')}
      </Button>
    );
  };


  return (
    <SidebarProvider defaultOpen>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar variant="sidebar" collapsible="icon" side="left" className="border-r">
          <SidebarContent asChild>
            <ScrollArea className="h-full p-0 pt-[56px]">
              <Tabs defaultValue="import-translate" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="import-translate">Import & Translate</TabsTrigger>
                  <TabsTrigger value="styling">Styling</TabsTrigger>
                  <TabsTrigger value="export">Export</TabsTrigger>
                </TabsList>

                <TabsContent value="import-translate" className="p-2 space-y-4">
                  <div className="flex items-start space-x-2">
                    <FileUpload onFileParsed={handleFileParsed} />
                    <VideoUpload />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-border">
                    <Label htmlFor="youtube-url" className="text-sm font-medium flex items-center">
                      <Youtube className="mr-2 h-4 w-4 text-red-600" /> YouTube Video URL
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="youtube-url"
                        type="url"
                        placeholder="Enter YouTube video URL..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="flex-grow h-9"
                        disabled={isFetchingYoutubeSubs || isLoading}
                      />
                      <Button
                        onClick={handleFetchYoutubeSubtitles}
                        variant="outline"
                        size="sm"
                        className="h-9 px-3"
                        disabled={isFetchingYoutubeSubs || isLoading || !youtubeUrl.trim()}
                      >
                        {isFetchingYoutubeSubs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Fetch
                      </Button>
                    </div>
                     <p className="text-xs text-muted-foreground mt-1">
                      Paste a YouTube link to fetch its subtitles. You can then translate them into any language.
                    </p>
                  </div>


                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ai-translate"
                        checked={isAiTranslationEnabled}
                        onCheckedChange={setIsAiTranslationEnabled}
                        disabled={isBatchTranslating}
                      />
                      <Label htmlFor="ai-translate">Translate with AI (Gemini)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="google-translate"
                        checked={isGoogleTranslateEnabled}
                        onCheckedChange={setIsGoogleTranslateEnabled}
                        disabled={isBatchTranslating}
                      />
                      <Label htmlFor="google-translate">Translate with Google Translate</Label>
                    </div>
                  </div>
                  
                  {(isAiTranslationEnabled || isGoogleTranslateEnabled) && (
                    <div className="space-y-3 pt-2 border-t border-border">
                       <LanguageControls />
                      {isAiTranslationEnabled && (
                        <>
                          <div className="space-y-2 pt-2 border-t border-border">
                            <Label htmlFor="ai-creativity" className="text-sm">AI Creativity Level: {aiCreativityLevel.toFixed(2)}</Label>
                            <Slider
                              id="ai-creativity"
                              min={0}
                              max={1}
                              step={0.01}
                              value={[aiCreativityLevel]}
                              onValueChange={(value) => setAiCreativityLevel(value[0])}
                              disabled={isBatchTranslating}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ai-custom-prompt" className="text-sm">Custom AI Prompt (Optional)</Label>
                            <Textarea
                              id="ai-custom-prompt"
                              placeholder="e.g., Translate in a formal tone..."
                              value={aiCustomPrompt}
                              onChange={(e) => setAiCustomPrompt(e.target.value)}
                              rows={3}
                              disabled={isBatchTranslating}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {(isAiTranslationEnabled || isGoogleTranslateEnabled) && (
                    <div className="space-y-3 pt-3 border-t border-border">
                      {renderBatchTranslateButtons()}
                      {(isBatchTranslating || batchTranslationProgress > 0) && (
                         <div className="space-y-1">
                           <Progress value={batchTranslationProgress} className="w-full h-2" />
                           <p className="text-xs text-muted-foreground text-center">
                             {isBatchTranslating ? `Translating... ${batchTranslationProgress.toFixed(0)}%` :
                              (batchTranslationProgress === 100 ? `Last batch completed.` :
                               (batchTranslationProgress > 0 ? `Last progress: ${batchTranslationProgress.toFixed(0)}%` : `Ready to translate.`))}
                           </p>
                         </div>
                      )}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="styling" className="p-0">
                  <Tabs defaultValue="single-cue-style" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 text-xs h-9">
                        <TabsTrigger value="single-cue-style" className="py-1">Single Cue</TabsTrigger>
                        <TabsTrigger value="batch-style" className="py-1">Batch</TabsTrigger>
                    </TabsList>
                    <TabsContent value="single-cue-style" className="p-2">
                        <SingleCueStylingEditor />
                    </TabsContent>
                    <TabsContent value="batch-style" className="p-2">
                        <BatchStylingEditor />
                    </TabsContent>
                  </Tabs>
                </TabsContent>
                <TabsContent value="export" className="p-2 space-y-3">
                  <ProjectControls />
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter className="p-2 border-t">
            <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden text-center">
              Subtitle Weaver v0.1.0
            </p>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <div className="p-1 md:p-4 flex-shrink-0 border-b md:hidden">
            <SidebarTrigger>
              <PanelLeft className="mr-1" /> Toggle Controls
            </SidebarTrigger>
          </div>
          
           <div className="flex-1 flex flex-col overflow-hidden"> {/* Main content area: video + editor */}
            {hasVideo && (
              <div className="p-1 md:p-4 flex-shrink-0"> {/* Video Player wrapper */}
                <VideoPlayer
                  ref={videoPlayerRef}
                  className="w-full" 
                />
              </div>
            )}
            {/* Editor Area Root: takes remaining space and manages internal scrolling */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0"> 
                {/* This inner div might be redundant if ScrollArea handles flex correctly */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    <ScrollArea className="flex-1 mt-1 md:mt-2">
                        <div className="p-1 md:p-4"> {/* Padding for SingleCueEditor content */}
                           <SingleCueEditor videoPlayerRef={videoPlayerRef} />
                        </div>
                    </ScrollArea>
                    <CueToolbar className="flex-shrink-0" />
                </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

// Helper to import uuidv4, assuming it's available or use generateRandomId
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_LANGUAGES, DEFAULT_GLOBAL_STYLES } from '@/lib/constants';
    

    