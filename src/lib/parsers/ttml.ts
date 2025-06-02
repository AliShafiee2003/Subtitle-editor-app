
import type { Cue } from '@/types';
import { generateRandomId, timeToSeconds } from '@/lib/utils';

// Helper to parse TTML time format (e.g., "00:00:05.250", "1.23s", "1234ms", "1h2m3s")
// This is a simplified parser for common YouTube TTML formats.
function parseTtmlTime(timeStr: string): number {
  if (!timeStr) return 0;

  // Check for HH:MM:SS.mmm format (or HH:MM:SS,mmm)
  const hmsMatch = timeStr.match(/(\d{1,2}):(\d{2}):(\d{2}(?:[.,]\d{1,3})?)/);
  if (hmsMatch) {
    const hours = parseInt(hmsMatch[1], 10);
    const minutes = parseInt(hmsMatch[2], 10);
    const seconds = parseFloat(hmsMatch[3].replace(',', '.')); // Normalize to dot
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Check for offset-time (e.g., "1.23s", "1234ms", "1.5m", "2h")
  // Ensure that the value is numeric, optionally negative, and can have a decimal point
  const offsetMatch = timeStr.match(/^(-?\d*\.?\d+)(h|m|s|ms|f|t)?$/);
  if (offsetMatch) {
    const value = parseFloat(offsetMatch[1]);
    const unit = offsetMatch[2] || 's'; // default to seconds

    switch (unit) {
      case 'h':
        return value * 3600;
      case 'm':
        return value * 60;
      case 's':
        return value;
      case 'ms':
        return value / 1000;
      case 'f': // frames (assuming 30fps for simplicity if not specified elsewhere)
        return value / 30;
      case 't': // ticks (assuming 10,000,000 ticks per second, common in TTML)
        return value / 10000000;
      default:
        console.warn(`[parseTtmlTime] Unknown offset time unit '${unit}' in: ${timeStr}`);
        return value; // fallback to treating as seconds if unit is unknown but value is numeric
    }
  }

  // Fallback for plain number, treat as seconds
  const plainSeconds = parseFloat(timeStr);
  if (!isNaN(plainSeconds)) {
    return plainSeconds;
  }

  console.warn(`[parseTtmlTime] Could not parse TTML time format: ${timeStr}`);
  return 0;
}

export function parseTtml(xmlContent: string): Cue[] {
  const cues: Cue[] = [];
  if (!xmlContent || xmlContent.trim() === "") {
    console.warn("[parseTtml] Received empty or null XML content.");
    return cues;
  }

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('Error parsing XML:', parserError.textContent);
      if (xmlContent.includes("Could not find resource") || xmlContent.includes("No caption track found")) {
          console.warn("TTML content indicates no actual subtitles found.");
      }
      return [];
    }

    // The main content could be in <body>, <tt:body>, or directly under <transcript> or <tt>
    const bodyCandidates = [
      xmlDoc.querySelector('body'),
      xmlDoc.querySelector('tt\\:body'), // For tt: prefixed elements
      xmlDoc.documentElement // Fallback to root if no body
    ];
    const body = bodyCandidates.find(candidate => candidate !== null) || xmlDoc.documentElement;

    if (!body) {
      console.warn("[parseTtml] Could not find a suitable root element (body, tt:body, or documentElement) for parsing.");
      return cues;
    }
    
    // Updated selector to include <text start="..."> tags and others
    const paragraphs = body.querySelectorAll(
      'p[begin], p[start], div[begin], div[start], span[begin], span[start], text[begin], text[start]'
    );
    
    paragraphs.forEach((p) => {
      const beginAttr = p.getAttribute('begin') || p.getAttribute('start') || p.getAttribute('t');
      let endAttr = p.getAttribute('end');
      const durAttr = p.getAttribute('dur') || p.getAttribute('d');
      
      let textContent = "";
      p.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          textContent += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName.toLowerCase() === 'br') {
          textContent += '\n';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            textContent += (node as Element).textContent; 
        }
      });
      // Replace HTML entities like &#39; with their characters and trim whitespace
      textContent = textContent.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();


      if (beginAttr && textContent) {
        const startTime = parseTtmlTime(beginAttr);
        let endTime = 0;

        if (endAttr) {
          endTime = parseTtmlTime(endAttr);
        } else if (durAttr) {
          endTime = startTime + parseTtmlTime(durAttr);
        } else {
          // If neither end nor dur is present, look for an implicit duration from next cue's start, or assign default
          // For now, skip if no duration/end is explicitly found
          console.warn("Skipping cue due to missing 'end' or 'dur' attribute:", p.outerHTML);
          return; 
        }

        if (startTime < endTime) {
          cues.push({
            id: generateRandomId(),
            startTime: parseFloat(startTime.toFixed(3)),
            endTime: parseFloat(endTime.toFixed(3)),
            originalText: textContent,
            translatedText: '',
          });
        } else if (startTime === endTime && textContent) {
            console.warn(`Skipping cue with zero or negative duration: ${textContent} (Start: ${startTime}, End: ${endTime})`);
        }
      }
    });
  } catch (error) {
    console.error('Error processing TTML content:', error);
  }
  return cues;
}

