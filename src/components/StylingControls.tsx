
"use client";

import type React from 'react';
import { useEffect, useState, useRef } from 'react'; // Added useRef
import { Palette, BoldIcon, ItalicIcon, Droplet, PlusCircle } from 'lucide-react'; // Added PlusCircle
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { StylingOptions, VerticalPlacement, HorizontalPlacement } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast'; // Added useToast

// Helper function to parse a color string and extract its RGB and alpha components
// Returns null if parsing fails.
const parseColor = (colorStr?: string): { r: number; g: number; b: number; a: number } | null => {
  if (!colorStr || typeof colorStr !== 'string') return null;

  const trimmedColorStr = colorStr.trim().toLowerCase();

  if (trimmedColorStr.startsWith('#')) {
    let hex = trimmedColorStr.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return { r, g, b, a: 1 };
    }
    if (hex.length === 8) { // #RRGGBBAA
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const a = parseInt(hex.substring(6, 8), 16) / 255;
      return { r, g, b, a };
    }
    return null;
  }

  if (trimmedColorStr.startsWith('rgb')) {
    const match = trimmedColorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] !== undefined ? parseFloat(match[4]) : 1,
      };
    }
    return null;
  }
  
  if (trimmedColorStr.startsWith('hsl')) {
    const match = trimmedColorStr.match(/hsla?\((\d+),\s*([\d.]+)%?,\s*([\d.]+)%?(?:,\s*([\d.]+))?\)/);
    if (match) {
      const h = parseInt(match[1]);
      const s = parseFloat(match[2]) / 100;
      const l = parseFloat(match[3]) / 100;
      const a = match[4] !== undefined ? parseFloat(match[4]) : 1;

      let r, g, b;
      if (s === 0) {
        r = g = b = l; 
      } else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h / 360 + 1 / 3);
        g = hue2rgb(p, q, h / 360);
        b = hue2rgb(p, q, h / 360 - 1 / 3);
      }
      return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a };
    }
    return null;
  }

  const namedColorMap: Record<string, string> = {
    transparent: "rgba(0,0,0,0)", black: "#000000", white: "#FFFFFF", red: "#FF0000",
    green: "#008000", blue: "#0000FF", yellow: "#FFFF00", cyan: "#00FFFF",
    magenta: "#FF00FF", gray: "#808080", lightgray: "#D3D3D3", darkgray: "#A9A9A9",
  };
  if (namedColorMap[trimmedColorStr]) {
    return parseColor(namedColorMap[trimmedColorStr]);
  }

  return null; 
};

const toRgbaString = (r: number, g: number, b: number, a: number): string => {
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
};


const BasicColorPicker: React.FC<{ color?: string; onChange: (color: string) => void }> = ({ color, onChange }) => {
  const commonColors = [
    "#FFFFFF", "#E0E0E0", "#BEBEBE", "#A0A0A0", "#808080", "#606060", "#303030", "#000000", 
    "#FF0000", "#FF7F00", "#FFFF00", "#008000", "#00FFFF", "#0000FF", "#FF00FF", "#800080",
    "#87CEEB", "#90EE90", "#FFD700", "#FFA07A", "#ADD8E6", "#F08080",
    "rgba(0,0,0,0.75)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.25)", "transparent"
  ];
  return (
    <div className="flex flex-wrap gap-1 p-2 rounded-md shadow-md bg-background border border-border max-w-xs">
      {commonColors.map(c => (
        <button
          key={c}
          type="button"
          className={`h-6 w-6 rounded-sm border border-muted-foreground/50 ${c === color ? 'ring-2 ring-ring ring-offset-1 ring-offset-background' : ''}`}
          style={{ backgroundColor: c === 'transparent' ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAACJJREFUOE9jfPbs2X8GDownMzHBACHVgqmgFEwFAnA0GAgwAACpDB0jFqjKAAAAAElFTkSuQmCC")' : c }}
          onClick={() => onChange(c)}
          aria-label={`Select color ${c}`}
        />
      ))}
      <Input
        type="text"
        value={color || ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 mt-1 w-full text-xs"
        placeholder="e.g., #FF0000, rgba(0,0,0,0.5), transparent"
      />
    </div>
  );
};

interface StylingControlsProps {
  value: Partial<StylingOptions>;
  onValueChange: (updatedStyles: Partial<StylingOptions>) => void;
  onReset?: () => void;
  resetButtonLabel?: string;
  title?: string;
}

export function StylingControls({
  value,
  onValueChange,
  onReset,
  resetButtonLabel = "Reset Styles",
  title = "Subtitle Styles"
}: StylingControlsProps) {

  const [currentBgOpacity, setCurrentBgOpacity] = useState<number>(1);
  const fontFileInputRef = useRef<HTMLInputElement>(null); // Ref for font file input
  const { toast } = useToast(); // For showing guidance

  useEffect(() => {
    const parsedBgColor = parseColor(value.backgroundColor);
    if (parsedBgColor) {
      setCurrentBgOpacity(parsedBgColor.a);
    } else if (value.backgroundColor === 'transparent') {
      setCurrentBgOpacity(0);
    } else {
      setCurrentBgOpacity(value.backgroundColor ? 1 : 1); 
    }
  }, [value.backgroundColor]);

  const handleStyleChange = (field: keyof StylingOptions, fieldValue: any) => {
    const newStyles = { ...value };
    const actualValue = (typeof fieldValue === 'string' && fieldValue.trim() === '') ? undefined : fieldValue;

    if (actualValue === undefined) {
      delete newStyles[field];
    } else {
      newStyles[field] = actualValue;
    }
    
    if (Object.keys(newStyles).length === 0 && Object.keys(value).length > 0 && actualValue === undefined && value[field] !== undefined) {
        onValueChange({}); 
    } else {
        onValueChange(newStyles);
    }
  };
  
  const handleNumericStyleChange = (field: keyof StylingOptions, numValue: number | undefined, unit: string = 'px') => {
    if (numValue === undefined || isNaN(numValue)) {
      handleStyleChange(field, undefined);
    } else {
      handleStyleChange(field, `${numValue}${unit}`);
    }
  };

  const handleBackgroundColorChange = (newColorValue: string | undefined) => {
    if (newColorValue === undefined || newColorValue.trim() === '') {
        handleStyleChange('backgroundColor', undefined);
        setCurrentBgOpacity(1); 
        return;
    }
    const parsedColor = parseColor(newColorValue);
    if (parsedColor) {
        setCurrentBgOpacity(parsedColor.a); 
        handleStyleChange('backgroundColor', newColorValue); 
    } else {
        handleStyleChange('backgroundColor', newColorValue);
        const currentParsedValid = parseColor(value.backgroundColor); 
        setCurrentBgOpacity(currentParsedValid ? currentParsedValid.a : 1);
    }
  };

  const handleBackgroundOpacityChange = (newOpacity: number) => {
    setCurrentBgOpacity(newOpacity);
    const currentColor = value.backgroundColor;
    let baseColor = { r: 0, g: 0, b: 0 }; 
    if (currentColor && currentColor !== 'transparent') {
      const parsed = parseColor(currentColor);
      if (parsed) {
        baseColor = { r: parsed.r, g: parsed.g, b: parsed.b };
      }
    }
    handleStyleChange('backgroundColor', toRgbaString(baseColor.r, baseColor.g, baseColor.b, newOpacity));
  };
  
  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      onValueChange({}); 
    }
     setCurrentBgOpacity(1); 
  };

  const getNumericValue = (strValue: string | undefined, defaultValue: number = 0): number => {
    if (strValue === undefined) return defaultValue;
    const num = parseInt(strValue, 10);
    return isNaN(num) ? defaultValue : num;
  };

  const handleFontFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected font file:', file.name);
      toast({
        title: "Custom Font Selected: Manual Setup Required",
        description: (
          <div>
            <p>To use "{file.name}":</p>
            <ol className="list-decimal list-inside text-xs mt-1 space-y-0.5">
              <li>Copy "{file.name}" to the `public/fonts` folder in your project.</li>
              <li>Add an `@font-face` rule to `src/app/globals.css`. Example:
                <pre className="text-xs bg-muted p-1 rounded mt-0.5 overflow-x-auto">{`@font-face {\n  font-family: 'YourFontName';\n  src: url('/fonts/${file.name}');\n}`}</pre>
              </li>
              <li>Select "YourFontName" in the Font Family dropdown (or type if using text input).</li>
            </ol>
          </div>
        ),
        duration: 15000, // Keep toast longer for instructions
      });
    }
    // Reset file input so the same file can be selected again
    if (fontFileInputRef.current) {
      fontFileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 p-1">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium flex items-center">
          <Palette className="mr-2 h-4 w-4" /> {title}
        </Label>
        {onReset && (
           <Button variant="outline" size="sm" onClick={handleReset}>
            {resetButtonLabel}
          </Button>
        )}
      </div>
      
      <Accordion type="multiple" defaultValue={['text', 'background', 'positioning']} className="w-full">
        <AccordionItem value="text">
          <AccordionTrigger className="text-sm">Text Styling</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div>
              <Label htmlFor={`${title}-font-family`} className="text-xs">
                Font Family
              </Label>
              <div className="flex items-center space-x-2">
                <Select
                  value={value.fontFamily || ''}
                  onValueChange={(val: string) =>
                    handleStyleChange('fontFamily', val === '' ? undefined : val)
                  }
                >
                  <SelectTrigger
                    id={`${title}-font-family`}
                    className="h-9 text-xs flex-grow" 
                  >
                    <SelectValue placeholder="Default (System UI)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="var(--font-geist-sans)">Default (Geist Sans)</SelectItem>
                    <SelectItem value="Arial, Helvetica, sans-serif">Arial/Helvetica</SelectItem>
                    <SelectItem value="'Vazirmatn', sans-serif">Vazirmatn</SelectItem>
                    <SelectItem value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica Neue</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="'Courier New', Courier, monospace">Courier New</SelectItem>
                    <SelectItem value="'Times New Roman', Times, serif">Times New Roman</SelectItem>
                    <SelectItem value="Verdana, Geneva, sans-serif">Verdana</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  ref={fontFileInputRef}
                  onChange={handleFontFileSelect}
                  className="hidden"
                  id={`${title}-font-file-upload`}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={() => fontFileInputRef.current?.click()}
                  title="Select custom font file (guidance provided)"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                For custom fonts: click "+", select file, then follow toast instructions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-3 items-end">
              <div className="flex flex-col space-y-1">
                 <Label htmlFor={`${title}-font-size`} className="text-xs">Font Size (px)</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {
                      const currentSize = getNumericValue(value.fontSize, 19);
                      handleNumericStyleChange("fontSize", Math.max(1, currentSize - 1));
                    }}
                  > − </Button>
                  <Input
                    id={`${title}-font-size`}
                    type="number"
                    min={1}
                    value={getNumericValue(value.fontSize, 19)}
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10);
                      handleNumericStyleChange("fontSize", isNaN(num) ? undefined : num);
                    }}
                    className="h-9 w-20 text-center text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {
                      const currentSize = getNumericValue(value.fontSize, 19);
                      handleNumericStyleChange("fontSize", currentSize + 1);
                    }}
                  > + </Button>
                </div>
              </div>

            <div>
                <Label htmlFor={`${title}-font-color`} className="text-xs">Font Color</Label>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal text-xs h-9 items-center">
                      <div className="w-4 h-4 rounded-sm border mr-2 shrink-0" style={{backgroundColor: value.color === 'transparent' ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAACJJREFUOE9jfPbs2X8GDownMzHBACHVgqmgFEwFAnA0GAgwAACpDB0jFqjKAAAAAElFTkSuQmCC")' : value.color }}/>
                      <span className="truncate">{value.color || 'Select color'}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <BasicColorPicker color={value.color} onChange={(color) => handleStyleChange('color', color)} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex items-center space-x-4 pt-1">
              <div className="flex items-center space-x-2">
                <Switch id={`${title}-font-bold`} checked={!!value.bold} onCheckedChange={(checked) => handleStyleChange('bold', checked)} />
                <Label htmlFor={`${title}-font-bold`} className="text-xs flex items-center"><BoldIcon className="h-3 w-3 mr-1"/>Bold</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id={`${title}-font-italic`} checked={!!value.italic} onCheckedChange={(checked) => handleStyleChange('italic', checked)} />
                <Label htmlFor={`${title}-font-italic`} className="text-xs flex items-center"><ItalicIcon className="h-3 w-3 mr-1"/>Italic</Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="background">
          <AccordionTrigger className="text-sm">Background &amp; Border</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
             <div className="grid grid-cols-2 gap-x-2 gap-y-3 items-end">
              <div>
                <Label htmlFor={`${title}-bg-color`} className="text-xs">Background Color</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal text-xs h-9 items-center">
                      <div className="w-4 h-4 rounded-sm border mr-2 shrink-0" style={{backgroundColor: value.backgroundColor === 'transparent' ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAACJJREFUOE9jfPbs2X8GDownMzHBACHVgqmgFEwFAnA0GAgwAACpDB0jFqjKAAAAAElFTkSuQmCC")' : value.backgroundColor }}/>
                      <span className="truncate">{value.backgroundColor || 'Select color'}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <BasicColorPicker color={value.backgroundColor} onChange={handleBackgroundColorChange} />
                  </PopoverContent>
                </Popover>
              </div>
                <div className="flex flex-col space-y-1">
                  <Label htmlFor={`${title}-border-radius`} className="text-xs">Border Radius (px)</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => {
                        const currentRadius = getNumericValue(value.borderRadius, 0);
                        handleNumericStyleChange("borderRadius", Math.max(0, currentRadius - 1));
                      }}
                    > − </Button>
                    <Input
                      id={`${title}-border-radius`}
                      type="number"
                      min={0}
                      value={getNumericValue(value.borderRadius, 0)}
                      onChange={(e) => {
                        const num = parseInt(e.target.value, 10);
                        handleNumericStyleChange("borderRadius", isNaN(num) ? undefined : num);
                      }}
                      className="h-9 w-20 text-center text-sm"
                    />
                     <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => {
                        const currentRadius = getNumericValue(value.borderRadius, 0);
                        handleNumericStyleChange("borderRadius", currentRadius + 1);
                      }}
                    > + </Button>
                  </div>
                </div>
            </div>
            <div>
              <Label htmlFor={`${title}-bg-opacity`} className="text-xs flex items-center">
                <Droplet className="mr-1.5 h-3 w-3 text-muted-foreground"/> Background Opacity: {Math.round(currentBgOpacity * 100)}%
              </Label>
              <Slider
                id={`${title}-bg-opacity`}
                min={0}
                max={1}
                step={0.01}
                value={[currentBgOpacity]}
                onValueChange={(valArray) => handleBackgroundOpacityChange(valArray[0])}
                className="my-2"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="positioning">
          <AccordionTrigger className="text-sm">Positioning (9 Zones)</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={`${title}-vertical-placement`} className="text-xs">Vertical Placement</Label>
                <Select
                  value={value.verticalPlacement || ''}
                  onValueChange={(val) => { handleStyleChange('verticalPlacement', val === '' ? undefined : (val as VerticalPlacement))}}
                >
                  <SelectTrigger id={`${title}-vertical-placement`} className="h-9 text-xs">
                    <SelectValue placeholder="Default (Bottom)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Top">Top</SelectItem>
                    <SelectItem value="Middle">Middle</SelectItem>
                    <SelectItem value="Bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`${title}-horizontal-placement`} className="text-xs">Horizontal Placement</Label>
                <Select
                  value={value.horizontalPlacement || ''}
                  onValueChange={(val) => { handleStyleChange('horizontalPlacement', val === '' ? undefined : (val as HorizontalPlacement))}}
                >
                  <SelectTrigger id={`${title}-horizontal-placement`} className="h-9 text-xs">
                    <SelectValue placeholder="Default (Center)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Left">Left</SelectItem>
                    <SelectItem value="Center">Center</SelectItem>
                    <SelectItem value="Right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Subtitles will be placed in one of 9 zones based on vertical and horizontal selections.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

    