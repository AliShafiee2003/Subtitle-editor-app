// pages/api/fetch-subs.ts
import type { NextApiRequest, NextApiResponse } from 'next'

interface CaptionTrack {
  baseUrl: string
  name: { simpleText: string }
  languageCode: string
  kind?: string
}

interface PlayerResponse {
  captions: {
    playerCaptionsTracklistRenderer: {
      captionTracks: CaptionTrack[]
    }
  }
}

// استخراج ytInitialPlayerResponse با استفاده از همان regex که در Go کار می‌کنه
function extractPlayerResponse(html: string): PlayerResponse | null {
  // استفاده از همان regex pattern که در کد Go موفق است
  const regex = /ytInitialPlayerResponse\s*=\s*({.*?});/s;
  const matches = html.match(regex);
  
  if (!matches || matches.length < 2) {
    console.log('No ytInitialPlayerResponse found in HTML');
    return null;
  }

  try {
    const jsonStr = matches[1];
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (e) {
    console.log('Failed to parse ytInitialPlayerResponse JSON:', e);
    return null;
  }
}

// ساخت URL با فرمت مورد نظر (همانند buildURL در Go)
function buildSubtitleURL(baseUrl: string, useVTT: boolean): string {
  // اطمینان از اینکه URL معتبر است
  if (!baseUrl || !baseUrl.startsWith('http')) {
    throw new Error('Invalid base URL for subtitle');
  }
  
  if (!useVTT) {
    return baseUrl;
  }
  
  const separator = baseUrl.includes('?') ? '&' : '?';
  return baseUrl + separator + 'fmt=vtt';
}

// استخراج video ID از URL (همانند extractVideoID در Go)
function extractVideoID(videoURL: string): string | null {
  try {
    const url = new URL(videoURL);
    
    // برای youtube.com/watch?v=
    const vParam = url.searchParams.get('v');
    if (vParam) {
      return vParam;
    }
    
    // برای youtu.be/
    if (url.hostname === 'youtu.be') {
      return url.pathname.slice(1); // حذف '/' اول
    }
    
    // برای youtube.com/embed/
    if (url.pathname.startsWith('/embed/')) {
      return url.pathname.split('/')[2];
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url: videoPageURL, lang = 'en', vtt = 'false', debug = 'false' } = req.query;

  if (!videoPageURL || typeof videoPageURL !== 'string') {
    return res.status(400).json({ error: 'Missing "url" query parameter' });
  }

  // استخراج video ID و ساخت URL استاندارد
  const videoID = extractVideoID(videoPageURL);
  if (!videoID) {
    return res.status(400).json({ error: 'Could not extract video ID from URL' });
  }

  // ساخت URL استاندارد یوتیوب (همانند Go code)
  const pageURL = `https://www.youtube.com/watch?v=${videoID}`;

  try {
    // درخواست GET ساده مثل کد Go
    const pageResp = await fetch(pageURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!pageResp.ok) {
      return res.status(pageResp.status).json({ 
        error: `Unexpected status ${pageResp.status} fetching page` 
      });
    }

    const html = await pageResp.text();

    if (debug === 'true') {
      console.log('HTML length:', html.length);
      console.log('Contains ytInitialPlayerResponse:', html.includes('ytInitialPlayerResponse'));
    }

    // استخراج player response با همان روش Go
    const pr = extractPlayerResponse(html);
    
    if (!pr) {
      return res.status(500).json({ 
        error: 'Could not locate ytInitialPlayerResponse in page' 
      });
    }

    // دسترسی به caption tracks (مثل کد Go)
    const tracks = pr.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!Array.isArray(tracks) || tracks.length === 0) {
      return res.status(404).json({ 
        error: 'No subtitles available for this video' 
      });
    }

    const useAsVTT = vtt === 'true';
    
    // جستجو برای زبان مورد نظر (مثل کد Go)
    let chosenTrack: CaptionTrack | null = null;
    
    for (const track of tracks) {
      if (track.languageCode === lang) {
        chosenTrack = track;
        break;
      }
    }

    // اگر زبان مورد نظر یافت نشد، از اولین track استفاده کن
    if (!chosenTrack && tracks.length > 0) {
      chosenTrack = tracks[0];
      console.log(`Subtitle for language "${lang}" not found, using first available (${chosenTrack.languageCode})`);
    }
    
    if (!chosenTrack) {
      return res.status(404).json({ 
        error: 'No suitable subtitle track found' 
      });
    }

    // ساخت URL زیرنویس (مثل buildURL در Go)
    let subURL;
    try {
      subURL = buildSubtitleURL(chosenTrack.baseUrl, useAsVTT);
    } catch (e) {
      return res.status(400).json({ 
        error: `Invalid subtitle URL: ${(e as Error).message}`,
        baseUrl: debug === 'true' ? chosenTrack.baseUrl : undefined
      });
    }

    if (debug === 'true') {
      console.log('Chosen track:', {
        languageCode: chosenTrack.languageCode,
        name: chosenTrack.name.simpleText,
        baseUrl: chosenTrack.baseUrl.substring(0, 100) + '...',
        kind: chosenTrack.kind
      });
      console.log('Final subtitle URL:', subURL);
      console.log('Available languages:', tracks.map(t => `${t.languageCode}: ${t.name.simpleText}`));
    }

    // دانلود زیرنویس (مثل DownloadSubtitle در Go)
    const subResp = await fetch(subURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.youtube.com/',
        'Accept-Encoding': 'identity' ,
      }
    });
    
    if (debug === 'true') {
      console.log('Subtitle response status:', subResp.status);
      console.log('Subtitle response headers:', Object.fromEntries(subResp.headers.entries()));
    }
    
    if (!subResp.ok) {
      return res.status(subResp.status).json({ 
        error: `Unexpected status ${subResp.status} downloading subtitle`,
        subtitleUrl: debug === 'true' ? subURL : undefined
      });
    }

    const subtitleContent = await subResp.text();

    if (debug === 'true') {
      console.log('Raw subtitle content length:', subtitleContent.length);
      console.log('Raw subtitle content (first 500 chars):', subtitleContent.substring(0, 500));
    }

    if (!subtitleContent || subtitleContent.trim().length === 0) {
      return res.status(404).json({ 
        error: 'Empty subtitle content received',
        subtitleUrl: debug === 'true' ? subURL : undefined,
        responseStatus: subResp.status
      });
    }

    // تنظیم headers و ارسال محتوا
    res.setHeader(
      'Content-Type',
      useAsVTT ? 'text/vtt; charset=utf-8' : 'application/xml; charset=utf-8'
    );
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (debug === 'true') {
      console.log('Subtitle content length:', subtitleContent.length);
      console.log('Content preview:', subtitleContent.substring(0, 200));
    }
    
    res.status(200).send(subtitleContent);

  } catch (error) {
    console.error("[API Error]:", error);
    return res.status(500).json({ 
      error: `Failed to fetch subtitles: ${(error as Error).message}` 
    });
  }
}