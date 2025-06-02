
"use client";
import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Cue, Language, Project, StylingOptions } from '@/types';
import { DEFAULT_GLOBAL_STYLES, DEFAULT_LANGUAGES, LOCAL_STORAGE_PROJECT_KEY, LOCAL_STORAGE_SETTINGS_KEY } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { generateRandomId } from '@/lib/utils';

interface AppState {
  cues: Cue[];
  setCues: React.Dispatch<React.SetStateAction<Cue[]>>;
  targetLanguage: Language | null;
  setTargetLanguage: React.Dispatch<React.SetStateAction<Language | null>>;
  availableLanguages: Language[];
  addCustomLanguage: (language: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentProject: Project | null;
  setCurrentProject: (projectOrUpdater: Project | null | ((prevState: Project | null) => Project | null)) => void;
  loadProject: (projectData: Project) => void;
  createNewProject: (name?: string) => Project;
  updateCue: (updatedCue: Cue) => void;
  updateGlobalStyles: (styles: Partial<StylingOptions>) => void;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  videoSrc: string | null;
  setVideoSrc: (src: string | null) => void;
  focusedCueId: string | null;
  setFocusedCueId: React.Dispatch<React.SetStateAction<string | null>>;
  currentCueForEditing: Cue | null;
  setCurrentCueForEditing: React.Dispatch<React.SetStateAction<Cue | null>>;
  focusNextCue: () => void;
  focusPreviousCue: () => void;
  addAndFocusNewCue: () => void;
  deleteFocusedCue: () => void;
  isAiTranslationEnabled: boolean;
  setIsAiTranslationEnabled: (enabled: boolean) => void;
  aiCreativityLevel: number;
  setAiCreativityLevel: (level: number) => void;
  aiCustomPrompt: string;
  setAiCustomPrompt: (prompt: string) => void;
  isGoogleTranslateEnabled: boolean;
  setIsGoogleTranslateEnabled: (enabled: boolean) => void;
  isBatchTranslating: boolean;
  setIsBatchTranslating: React.Dispatch<React.SetStateAction<boolean>>;
  batchTranslationProgress: number;
  setBatchTranslationProgress: React.Dispatch<React.SetStateAction<number>>;
  batchTranslationAbortController: AbortController | null;
  setBatchTranslationAbortController: React.Dispatch<React.SetStateAction<AbortController | null>>;
}

const AppContext = createContext<AppState | undefined>(undefined);

const defaultProject = (): Project => ({
  id: uuidv4(),
  name: 'Untitled Project',
  cues: [],
  targetLanguage: DEFAULT_LANGUAGES[0],
  globalStyles: { ...DEFAULT_GLOBAL_STYLES },
  uiLanguage: 'en',
  theme: 'light',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isAiTranslationEnabled: false,
  aiCreativityLevel: 0.5,
  aiCustomPrompt: '',
  isGoogleTranslateEnabled: false,
  focusedCueId: null,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cues, setCues] = useState<Cue[]>([]);
  const [targetLanguage, setTargetLanguage] = useState<Language | null>(DEFAULT_LANGUAGES[0]);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
  const [appTheme, setAppTheme] = useState<'light' | 'dark'>('light');
  const [currentProjectInternal, setCurrentProjectInternal] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [videoSrc, _setVideoSrc] = useState<string | null>(null);
  const [focusedCueId, setFocusedCueId] = useState<string | null>(null);
  const [currentCueForEditing, setCurrentCueForEditing] = useState<Cue | null>(null);

  const [isAiTranslationEnabled, _setIsAiTranslationEnabled] = useState(false);
  const [aiCreativityLevel, _setAiCreativityLevel] = useState(0.5);
  const [aiCustomPrompt, _setAiCustomPrompt] = useState('');
  const [isGoogleTranslateEnabled, _setIsGoogleTranslateEnabled] = useState(false);

  const [isBatchTranslating, setIsBatchTranslating] = useState(false);
  const [batchTranslationProgress, setBatchTranslationProgress] = useState(0);
  const [batchTranslationAbortController, setBatchTranslationAbortController] = useState<AbortController | null>(null);


  const setVideoSrc = useCallback((newSrc: string | null) => {
    _setVideoSrc(prevStoredSrc => {
      if (prevStoredSrc && prevStoredSrc.startsWith('blob:')) {
        URL.revokeObjectURL(prevStoredSrc);
      }
      return newSrc;
    });
  }, []);

  const _loadProjectData = useCallback((projectData: Project) => {
    setCurrentProjectInternal(projectData); // Keep internal project object in sync
    setCues(projectData.cues || []);
    setTargetLanguage(projectData.targetLanguage || DEFAULT_LANGUAGES[0]);
    _setIsAiTranslationEnabled(projectData.isAiTranslationEnabled || false);
    _setAiCreativityLevel(projectData.aiCreativityLevel || 0.5);
    _setAiCustomPrompt(projectData.aiCustomPrompt || '');
    _setIsGoogleTranslateEnabled(projectData.isGoogleTranslateEnabled || false);
    setAppTheme(projectData.theme || 'light');

    if (projectData.cues && projectData.cues.length > 0) {
        const fId = projectData.focusedCueId && projectData.cues.some(c => c.id === projectData.focusedCueId)
            ? projectData.focusedCueId
            : projectData.cues[0].id;
        setFocusedCueId(fId);
    } else {
        setFocusedCueId(null);
    }
  }, []); // Dependencies: stable setters

  const setCurrentProject = useCallback((projectOrUpdater: Project | null | ((prevState: Project | null) => Project | null) ) => {
    if (typeof projectOrUpdater === 'function') {
      setCurrentProjectInternal(prevInternalProject => {
        const newProject = projectOrUpdater(prevInternalProject);
        if (newProject) {
            // if the updater function itself doesn't fully populate, ensure latest states are merged
            const mergedProject = {
                ...newProject,
                cues: newProject.cues || cues, // Prefer newProject.cues if available
                targetLanguage: newProject.targetLanguage || targetLanguage,
                isAiTranslationEnabled: newProject.isAiTranslationEnabled !== undefined ? newProject.isAiTranslationEnabled : isAiTranslationEnabled,
                aiCreativityLevel: newProject.aiCreativityLevel !== undefined ? newProject.aiCreativityLevel : aiCreativityLevel,
                aiCustomPrompt: newProject.aiCustomPrompt !== undefined ? newProject.aiCustomPrompt : aiCustomPrompt,
                isGoogleTranslateEnabled: newProject.isGoogleTranslateEnabled !== undefined ? newProject.isGoogleTranslateEnabled : isGoogleTranslateEnabled,
                theme: newProject.theme || appTheme,
                focusedCueId: newProject.focusedCueId !== undefined ? newProject.focusedCueId : focusedCueId,
            };
            _loadProjectData(mergedProject);
        }
        return newProject;
      });
    } else {
      // projectOrUpdater is a Project object or null
      if (projectOrUpdater) {
        _loadProjectData(projectOrUpdater);
      } else {
        setCurrentProjectInternal(null); // Explicitly set to null if projectOrUpdater is null
        _loadProjectData(defaultProject()); // Load default project states if current project becomes null
      }
    }
  }, [_loadProjectData, cues, targetLanguage, isAiTranslationEnabled, aiCreativityLevel, aiCustomPrompt, isGoogleTranslateEnabled, appTheme, focusedCueId]);


  // Effect for initial loading from localStorage
  useEffect(() => {
    setIsLoading(true);
    const storedThemeValue = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (storedThemeValue) {
      setAppTheme(JSON.parse(storedThemeValue).theme || 'light');
    }

    const storedProject = localStorage.getItem(LOCAL_STORAGE_PROJECT_KEY);
    if (storedProject) {
      const projectData = JSON.parse(storedProject) as Project;
      _loadProjectData(projectData);
    } else {
      _loadProjectData(defaultProject());
    }
    setIsLoading(false);
  }, [_loadProjectData]); // Only _loadProjectData (which is stable)

  // Update currentCueForEditing when focusedCueId or cues change
  useEffect(() => {
    if (focusedCueId) {
      const cueToEdit = cues.find(c => c.id === focusedCueId) || null;
      setCurrentCueForEditing(cueToEdit);
    } else {
      setCurrentCueForEditing(null);
    }
  }, [focusedCueId, cues]);

  // Apply theme to document
  useEffect(() => {
    if (appTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (!isLoading) {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify({ theme: appTheme }));
    }
  }, [appTheme, isLoading]);

  // Save current project to localStorage
  useEffect(() => {
    if (currentProjectInternal && !isLoading) {
      const projectToSave: Project = {
        ...currentProjectInternal, // Start with the internal project state
        cues: cues, // Always use the latest cues from the main state
        targetLanguage: targetLanguage,
        isAiTranslationEnabled: isAiTranslationEnabled,
        aiCreativityLevel: aiCreativityLevel,
        aiCustomPrompt: aiCustomPrompt,
        isGoogleTranslateEnabled: isGoogleTranslateEnabled,
        theme: appTheme,
        globalStyles: currentProjectInternal.globalStyles || DEFAULT_GLOBAL_STYLES,
        updatedAt: Date.now(),
        focusedCueId: focusedCueId, // Save current focused cue
      };
      localStorage.setItem(LOCAL_STORAGE_PROJECT_KEY, JSON.stringify(projectToSave));
    }
  }, [cues, targetLanguage, isAiTranslationEnabled, aiCreativityLevel, aiCustomPrompt, isGoogleTranslateEnabled, appTheme, currentProjectInternal, isLoading, focusedCueId]);


  const toggleTheme = useCallback(() => {
    setAppTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const addCustomLanguage = useCallback((language: Language) => {
    setAvailableLanguages((prev) => [...prev, language]);
  }, []);

  const loadProject = useCallback((projectData: Project) => {
    _loadProjectData(projectData);
  }, [_loadProjectData]);


  const createNewProject = useCallback((name: string = 'Untitled Project'): Project => {
    const newProjectData = defaultProject();
    newProjectData.name = name;
    _loadProjectData(newProjectData);
    setVideoSrc(null);
    return newProjectData;
  }, [_loadProjectData, setVideoSrc]);

  const updateCue = useCallback((updatedCue: Cue) => {
    setCues(prevCues => prevCues.map(cue => cue.id === updatedCue.id ? updatedCue : cue));
  }, []);

  const updateGlobalStyles = useCallback((styles: Partial<StylingOptions>) => {
    setCurrentProjectInternal(prevProject => {
      if (!prevProject) return null;
      const newGlobalStyles = { ...(prevProject.globalStyles || DEFAULT_GLOBAL_STYLES), ...styles };
      // Also update via _loadProjectData to ensure all states are consistent if needed,
      // or just update currentProjectInternal and rely on the save effect.
      // For globalStyles, simply updating currentProjectInternal is often enough as it's read directly.
      const updatedProject = {
        ...prevProject,
        globalStyles: newGlobalStyles,
        updatedAt: Date.now(),
      };
      // No direct call to _loadProjectData needed here unless global styles affect other top-level states
      return updatedProject;
    });
  }, []);

  const focusNextCue = useCallback(() => {
    if (cues.length === 0) return;
    const currentIndex = cues.findIndex(c => c.id === focusedCueId);
    if (currentIndex === -1 && cues.length > 0) {
      setFocusedCueId(cues[0].id);
    } else if (currentIndex < cues.length - 1) {
      setFocusedCueId(cues[currentIndex + 1].id);
    }
  }, [cues, focusedCueId]);

  const focusPreviousCue = useCallback(() => {
    if (cues.length === 0) return;
    const currentIndex = cues.findIndex(c => c.id === focusedCueId);
    if (currentIndex === -1 && cues.length > 0) {
      setFocusedCueId(cues[0].id);
    } else if (currentIndex > 0) {
      setFocusedCueId(cues[currentIndex - 1].id);
    }
  }, [cues, focusedCueId]);

  const addAndFocusNewCue = useCallback(() => {
    let newStartTime = 0;
    let insertionIndex = cues.length;

    if (focusedCueId && currentCueForEditing) {
      newStartTime = Math.max(0, currentCueForEditing.endTime + 0.001);
      const currentIndexValue = cues.findIndex(c => c.id === focusedCueId); // Recalculate here
      if (currentIndexValue !== -1) {
        insertionIndex = currentIndexValue + 1;
      }
    } else if (cues.length > 0) {
      newStartTime = Math.max(0, cues[cues.length - 1].endTime + 0.001);
    }

    const newCue: Cue = {
      id: generateRandomId(),
      startTime: parseFloat(newStartTime.toFixed(3)),
      endTime: parseFloat((newStartTime + 2.0).toFixed(3)),
      originalText: '',
      translatedText: '',
    };

    setCues(prevCues => {
      const newCuesArray = [...prevCues];
      newCuesArray.splice(insertionIndex, 0, newCue);
      return newCuesArray;
    });
    setFocusedCueId(newCue.id);
  }, [cues, focusedCueId, currentCueForEditing]);

  const deleteFocusedCue = useCallback(() => {
    if (!focusedCueId || cues.length === 0) return;

    const currentIndexValue = cues.findIndex(c => c.id === focusedCueId); // Recalculate here
    if (currentIndexValue === -1) return;

    const newCuesArray = cues.filter(c => c.id !== focusedCueId);
    setCues(newCuesArray);

    if (newCuesArray.length === 0) {
      setFocusedCueId(null);
    } else if (currentIndexValue < newCuesArray.length) {
      setFocusedCueId(newCuesArray[currentIndexValue].id);
    } else {
      setFocusedCueId(newCuesArray[newCuesArray.length - 1].id);
    }
  }, [cues, focusedCueId]);

  const setIsAiTranslationEnabledWithProjectUpdate = useCallback((enabled: boolean) => {
    _setIsAiTranslationEnabled(enabled);
    if (enabled) _setIsGoogleTranslateEnabled(false);
    setCurrentProjectInternal(prev => prev ? { ...prev, isAiTranslationEnabled: enabled, isGoogleTranslateEnabled: enabled ? false : prev.isGoogleTranslateEnabled } : null);
  }, []);

  const setAiCreativityLevelWithProjectUpdate = useCallback((level: number) => {
    _setAiCreativityLevel(level);
    setCurrentProjectInternal(prev => prev ? { ...prev, aiCreativityLevel: level } : null);
  }, []);

  const setAiCustomPromptWithProjectUpdate = useCallback((prompt: string) => {
    _setAiCustomPrompt(prompt);
    setCurrentProjectInternal(prev => prev ? { ...prev, aiCustomPrompt: prompt } : null);
  }, []);

  const setIsGoogleTranslateEnabledWithProjectUpdate = useCallback((enabled: boolean) => {
    _setIsGoogleTranslateEnabled(enabled);
    if (enabled) _setIsAiTranslationEnabled(false);
    setCurrentProjectInternal(prev => prev ? { ...prev, isGoogleTranslateEnabled: enabled, isAiTranslationEnabled: enabled ? false : prev.isAiTranslationEnabled } : null);
  }, []);


  const value = {
    cues,
    setCues,
    targetLanguage,
    setTargetLanguage,
    availableLanguages,
    addCustomLanguage,
    theme: appTheme,
    toggleTheme,
    currentProject: currentProjectInternal, // Expose internal project
    setCurrentProject,
    loadProject,
    createNewProject,
    updateCue,
    updateGlobalStyles,
    isLoading,
    setIsLoading,
    videoSrc,
    setVideoSrc,
    focusedCueId,
    setFocusedCueId,
    currentCueForEditing,
    setCurrentCueForEditing,
    focusNextCue,
    focusPreviousCue,
    addAndFocusNewCue,
    deleteFocusedCue,
    isAiTranslationEnabled,
    setIsAiTranslationEnabled: setIsAiTranslationEnabledWithProjectUpdate,
    aiCreativityLevel,
    setAiCreativityLevel: setAiCreativityLevelWithProjectUpdate,
    aiCustomPrompt,
    setAiCustomPrompt: setAiCustomPromptWithProjectUpdate,
    isGoogleTranslateEnabled,
    setIsGoogleTranslateEnabled: setIsGoogleTranslateEnabledWithProjectUpdate,
    isBatchTranslating,
    setIsBatchTranslating,
    batchTranslationProgress,
    setBatchTranslationProgress,
    batchTranslationAbortController,
    setBatchTranslationAbortController,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppStore = (): AppState => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};

// Add focusedCueId to Project type
declare module '@/types' {
  interface Project {
    focusedCueId?: string | null;
  }
}

    