"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Film as FilmIcon,
  TvMinimalPlay,
  Expand,
  Shrink,
  X as XIcon,
} from "lucide-react";
import { useAppStore } from "@/contexts/AppContext";
import type { Cue, StylingOptions, VideoPlayerRef } from "@/types";
import { secondsToTime } from "@/lib/utils";
import { DEFAULT_GLOBAL_STYLES } from "@/lib/constants";

const renderSingleSubtitleBlock = (
  texts: string[],
  blockEffectiveStyles: StylingOptions,
  cueSpecificStyles: (StylingOptions | undefined)[],
  cueIds: string[],   // ← حالا اول می‌آید
  isClickable: boolean,
  onClick: (clickedCueIds: string[], groupTexts: string[]) => void,
  keyPrefix: string = "block"
) => {
  const currentBlockStyles = {
    ...DEFAULT_GLOBAL_STYLES,
    ...blockEffectiveStyles,
  };

  const positionStyle: React.CSSProperties = {
    position: "absolute",
    width: "max-content",
    maxWidth: "90%",
    zIndex: 1,
    cursor: isClickable ? "pointer" : "default",
    userSelect: "none",
    pointerEvents: isClickable ? "auto" : "none",
  };

  const horizontalPlacement =
    currentBlockStyles.horizontalPlacement || "Center";
  if (horizontalPlacement === "Left") {
    positionStyle.left = "5%";
    positionStyle.transform = "translateX(0)";
    positionStyle.textAlign = "left";
  } else if (horizontalPlacement === "Right") {
    positionStyle.right = "5%";
    positionStyle.transform = "translateX(0)";
    positionStyle.textAlign = "right";
  } else {
    positionStyle.left = "50%";
    positionStyle.transform = "translateX(-50%)";
    positionStyle.textAlign = "center";
  }

  const verticalPlacement = currentBlockStyles.verticalPlacement || "Bottom";
  if (verticalPlacement === "Top") {
    positionStyle.top = "5%";
  } else if (verticalPlacement === "Middle") {
    positionStyle.top = "50%";
    if (horizontalPlacement === "Center") {
      positionStyle.transform = "translate(-50%, -50%)";
    } else {
      const existingTransformX = positionStyle.transform?.includes("translateX")
        ? positionStyle.transform
        : "";
      positionStyle.transform = `${existingTransformX} translateY(-50%)`.trim();
    }
  } else {
    positionStyle.bottom = "10%";
    // verticalPlacement is already known to be "Bottom" here,
    // so no need to compare it to "Middle"
    if (horizontalPlacement !== "Center") {
      const existingTransform = positionStyle.transform || "";
      if (!existingTransform.includes("translateY")) {
        positionStyle.transform = `${existingTransform} translateY(0)`.trim();
      }
    }
  }

  if (
    currentBlockStyles.backgroundColor &&
    currentBlockStyles.backgroundColor !== "rgba(0,0,0,0)" &&
    currentBlockStyles.backgroundColor !== "transparent"
  ) {
    positionStyle.backgroundColor = currentBlockStyles.backgroundColor;
    positionStyle.padding = "0.2em 0.4em";
    positionStyle.borderRadius = currentBlockStyles.borderRadius;
  } else {
    positionStyle.padding = "0";
    positionStyle.borderRadius = currentBlockStyles.borderRadius;
  }

  return (
    <div
      key={keyPrefix}
      style={positionStyle}
      data-testid={`subtitle-overlay-${keyPrefix}`}
    >
      {texts.map((text, index) => {
        const currentCueLineSpecificOverrides = cueSpecificStyles[index] || {};
        const lineMergedStyle = {
          ...currentBlockStyles,
          ...currentCueLineSpecificOverrides,
        };

        const individualLineStyle: React.CSSProperties = {
          display: "block",
          fontFamily: lineMergedStyle.fontFamily,
          fontSize: lineMergedStyle.fontSize,
          color: lineMergedStyle.color,
          fontWeight: lineMergedStyle.bold ? "bold" : "normal",
          fontStyle: lineMergedStyle.italic ? "italic" : "normal",
          whiteSpace: "pre-wrap",
          textAlign: positionStyle.textAlign,
        };

        if (
          (!currentBlockStyles.backgroundColor ||
            currentBlockStyles.backgroundColor === "rgba(0,0,0,0)" ||
            currentBlockStyles.backgroundColor === "transparent") &&
          lineMergedStyle.backgroundColor &&
          lineMergedStyle.backgroundColor !== "rgba(0,0,0,0)" &&
          lineMergedStyle.backgroundColor !== "transparent"
        ) {
          individualLineStyle.backgroundColor = lineMergedStyle.backgroundColor;
          individualLineStyle.padding = "0.2em 0.4em";
          individualLineStyle.borderRadius = lineMergedStyle.borderRadius;
        }

            
         return text.split('\n').map((line, lineIndex) => (
           <span
             key={`${keyPrefix}-cue-${index}-line-${lineIndex}`}
             style={{
               ...individualLineStyle,
               pointerEvents: isClickable ? 'auto' : 'none',
               cursor: isClickable ? 'pointer' : 'default',
             }}
             onClick={isClickable ? () => onClick?.([cueIds[index]], texts) : undefined}
             dangerouslySetInnerHTML={{ __html: line }}
            />
          ));
      })}
    </div>
  );
};

const VideoPlayer = React.forwardRef<VideoPlayerRef, { className?: string }>(
  (props, ref) => {
    const {
      cues,
      currentProject,
      targetLanguage,
      videoSrc,
      setVideoSrc,
      setFocusedCueId,
      currentCueForEditing,
    } = useAppStore();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentPlaybackCues, setCurrentPlaybackCues] = useState<Cue[]>([]);
    const [isVideoPaused, setIsVideoPaused] = useState<boolean>(true);

    const isPlayingCueSegmentRef = useRef<boolean>(false);
    const segmentAbortControllerRef = useRef<AbortController | null>(null);
    const segmentPlayCleanupCallbackRef = useRef<(() => void) | null>(null);

    const fullscreenContainerRef = useRef<HTMLDivElement>(null);
    const [isInCustomFullscreen, setIsInCustomFullscreen] = useState(false);
    const [fullscreenSubtitleHost, setFullscreenSubtitleHost] =
      useState<HTMLDivElement | null>(null);

    const handleTimeUpdateInternal = useCallback(
      (currentTime: number) => {
        const active = cues
          .filter((c) => currentTime >= c.startTime && currentTime < c.endTime)
          .sort((a, b) => {
            if (a.startTime !== b.startTime) return a.startTime - b.startTime;
            return (
              (a.translatedText || a.originalText).length -
                (b.translatedText || b.originalText).length ||
              a.id.localeCompare(b.id)
            );
          });

        setCurrentPlaybackCues((prev) => {
          const activeIds = active.map((c) => c.id).join(",");
          const prevIds = prev.map((c) => c.id).join(",");

          if (
            activeIds === prevIds &&
            prev.length === active.length &&
            prev.every(
              (p, i) =>
                JSON.stringify(p.style) === JSON.stringify(active[i]?.style) &&
                p.originalText === active[i]?.originalText &&
                p.translatedText === active[i]?.translatedText
            )
          ) {
            return prev;
          }
          return active;
        });
      },
      [cues]
    );

    const handleTimeUpdateRef = useRef(handleTimeUpdateInternal);
    useEffect(() => {
      handleTimeUpdateRef.current = handleTimeUpdateInternal;
    }, [handleTimeUpdateInternal]);

    useEffect(() => {
      const video = videoRef.current;
      if (video && isVideoPaused) {
        handleTimeUpdateRef.current(video.currentTime);
      }
    }, [cues, isVideoPaused]);

    useEffect(() => {
      if (!isInCustomFullscreen || !fullscreenContainerRef.current) {
        if (
          fullscreenSubtitleHost &&
          fullscreenContainerRef.current &&
          fullscreenContainerRef.current.contains(fullscreenSubtitleHost)
        ) {
          fullscreenContainerRef.current.removeChild(fullscreenSubtitleHost);
          setFullscreenSubtitleHost(null);
        }
        return;
      }

      const host = document.createElement("div");
      host.id = "dynamic-fullscreen-subtitle-overlay-host";
      Object.assign(host.style, {
        position: "absolute",
        inset: "0",
        pointerEvents: "none",
        zIndex: "99999",
      });

      fullscreenContainerRef.current.appendChild(host);
      setFullscreenSubtitleHost(host);

      return () => {
        if (
          fullscreenContainerRef.current &&
          fullscreenContainerRef.current.contains(host)
        ) {
          fullscreenContainerRef.current.removeChild(host);
        }
        if (fullscreenSubtitleHost === host) {
          setFullscreenSubtitleHost(null);
        }
      };
    }, [isInCustomFullscreen, fullscreenContainerRef, fullscreenSubtitleHost]);

    useEffect(() => {
      const handleFullscreenChange = () => {
        const isCurrentlyFullscreen =
          !!document.fullscreenElement &&
          document.fullscreenElement === fullscreenContainerRef.current;
        setIsInCustomFullscreen(isCurrentlyFullscreen);
      };
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
      };
    }, []);

    const toggleCustomFullscreen = async () => {
      if (!fullscreenContainerRef.current) return;

      if (!document.fullscreenElement) {
        try {
          await fullscreenContainerRef.current.requestFullscreen();
        } catch (err) {
          console.error(
            "[VideoPlayer] Error attempting to enable full-screen mode:",
            err
          );
          setIsInCustomFullscreen(false);
        }
      } else {
        if (document.exitFullscreen) {
          try {
            await document.exitFullscreen();
          } catch (err) {
            console.error(
              "[VideoPlayer] Error attempting to exit full-screen mode:",
              err
            );
          }
        }
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        playCueSegment: async (startTime, endTime) => {
          const video = videoRef.current;
          const cueForSegmentPlay = currentCueForEditing;

          if (!video || !videoSrc || !cueForSegmentPlay) {
            console.warn(
              "[VideoPlayer] playCueSegment: Prerequisites not met."
            );
            return;
          }
          if (startTime >= endTime) {
            console.warn(
              `[VideoPlayer] playCueSegment: Invalid time range (startTime ${startTime} >= endTime ${endTime}).`
            );
            return;
          }

          // Abort any ongoing segment play operation
          if (segmentAbortControllerRef.current) {
            segmentAbortControllerRef.current.abort();
            segmentAbortControllerRef.current = null;
          }
          if (segmentPlayCleanupCallbackRef.current) {
            segmentPlayCleanupCallbackRef.current(); // Call previous cleanup if exists
            segmentPlayCleanupCallbackRef.current = null;
          }

          isPlayingCueSegmentRef.current = true;
          const newAbortController = new AbortController();
          segmentAbortControllerRef.current = newAbortController;
          const { signal: abortSignal } = newAbortController;

          if (!video.paused) {
            video.pause();
            await new Promise((r) => setTimeout(r, 50));
            if (abortSignal.aborted) {
              isPlayingCueSegmentRef.current = false;
              return;
            }
          }

          video.currentTime = startTime;
          handleTimeUpdateRef.current(startTime); // Ensure overlapping cues are displayed immediately

          const onSegmentTimeUpdate = () => {
            if (abortSignal.aborted || !isPlayingCueSegmentRef.current) return;
            handleTimeUpdateRef.current(video.currentTime); // Continuously update for overlaps
            if (video.currentTime >= endTime) {
              if (!video.paused) {
                video.pause();
              }
            }
          };

          const onSegmentPause = () => {
            if (segmentAbortControllerRef.current === newAbortController) {
              video.removeEventListener("timeupdate", onSegmentTimeUpdate);
              video.removeEventListener("pause", onSegmentPause);
              if (
                segmentAbortControllerRef.current &&
                !segmentAbortControllerRef.current.signal.aborted
              ) {
                segmentAbortControllerRef.current.abort();
              }
              segmentAbortControllerRef.current = null;
              isPlayingCueSegmentRef.current = false;
              segmentPlayCleanupCallbackRef.current = null;
              if (videoRef.current) {
                handleTimeUpdateRef.current(videoRef.current.currentTime);
              }
            }
          };
          segmentPlayCleanupCallbackRef.current = onSegmentPause;

          video.addEventListener("timeupdate", onSegmentTimeUpdate, {
            signal: abortSignal,
          });
          video.addEventListener("pause", onSegmentPause, {
            signal: abortSignal,
          });

          try {
            await video.play();
            video.style.opacity = "0.999";
            setTimeout(() => {
              if (videoRef.current) videoRef.current.style.opacity = "1";
            }, 50);
          } catch (error) {
            console.error("[VideoPlayer] Error playing video segment:", error);
            if (video && !video.paused) video.pause();
            onSegmentPause();
          }
        },
        getVideoElement: () => videoRef.current,
      }),
      [currentCueForEditing, videoSrc, handleTimeUpdateInternal]
    );

    useEffect(() => {
      const videoElement = videoRef.current;
      if (!videoElement || !videoSrc || isPlayingCueSegmentRef.current) return;

      if (currentCueForEditing && videoElement.paused) {
        const timeDifference = Math.abs(
          videoElement.currentTime - currentCueForEditing.startTime
        );
        if (
          timeDifference > 0.2 ||
          videoElement.dataset.lastFocusedCueId !== currentCueForEditing.id
        ) {
          videoElement.currentTime = currentCueForEditing.startTime;
          videoElement.dataset.lastFocusedCueId = currentCueForEditing.id;
          handleTimeUpdateRef.current(currentCueForEditing.startTime);
        }
      }
    }, [
      currentCueForEditing?.id,
      currentCueForEditing?.startTime,
      videoSrc,
      cues,
    ]);

    useEffect(() => {
      const videoElement = videoRef.current;
      if (!videoElement || !videoSrc) return;

      const onTimeUpdateListener = () => {
        if (isPlayingCueSegmentRef.current) return;
        handleTimeUpdateRef.current(videoElement.currentTime);
      };
      const onPlayListener = () => {
        if (isPlayingCueSegmentRef.current) return;
        setIsVideoPaused(false);
        handleTimeUpdateRef.current(videoElement.currentTime);
      };
      const onPauseListener = () => {
        if (isPlayingCueSegmentRef.current) return;
        setIsVideoPaused(true);
        handleTimeUpdateRef.current(videoElement.currentTime);
      };
      const onSeekedListener = () => {
        if (isPlayingCueSegmentRef.current) return;
        if (videoElement) {
          handleTimeUpdateRef.current(videoElement.currentTime);
          setIsVideoPaused(videoElement.paused);
        }
      };
      const onEndedListener = () => {
        if (isPlayingCueSegmentRef.current) {
          if (
            segmentAbortControllerRef.current &&
            !segmentAbortControllerRef.current.signal.aborted
          ) {
            segmentAbortControllerRef.current.abort();
          }
          if (segmentPlayCleanupCallbackRef.current) {
            segmentPlayCleanupCallbackRef.current();
          }
          isPlayingCueSegmentRef.current = false;
        }
        if (videoElement) {
          handleTimeUpdateRef.current(videoElement.currentTime);
          setCurrentPlaybackCues([]);
          setIsVideoPaused(true);
        }
      };

      videoElement.addEventListener("timeupdate", onTimeUpdateListener);
      videoElement.addEventListener("play", onPlayListener);
      videoElement.addEventListener("pause", onPauseListener);
      videoElement.addEventListener("seeked", onSeekedListener);
      videoElement.addEventListener("ended", onEndedListener);

      if (videoElement.readyState >= videoElement.HAVE_METADATA) {
        if (!isPlayingCueSegmentRef.current)
          handleTimeUpdateRef.current(videoElement.currentTime);
        setIsVideoPaused(videoElement.paused);
      } else {
        videoElement.onloadedmetadata = () => {
          if (videoRef.current && !isPlayingCueSegmentRef.current) {
            handleTimeUpdateRef.current(videoRef.current.currentTime);
            setIsVideoPaused(videoRef.current.paused);
          }
        };
        setIsVideoPaused(true);
      }
      videoElement.dataset.lastFocusedCueId = "";

      return () => {
        videoElement.removeEventListener("timeupdate", onTimeUpdateListener);
        videoElement.removeEventListener("play", onPlayListener);
        videoElement.removeEventListener("pause", onPauseListener);
        videoElement.removeEventListener("seeked", onSeekedListener);
        videoElement.removeEventListener("ended", onEndedListener);
        videoElement.onloadedmetadata = null;

        if (
          segmentAbortControllerRef.current &&
          !segmentAbortControllerRef.current.signal.aborted
        ) {
          segmentAbortControllerRef.current.abort();
        }
        if (segmentPlayCleanupCallbackRef.current) {
          segmentPlayCleanupCallbackRef.current();
        }
        isPlayingCueSegmentRef.current = false;
      };
    }, [videoSrc]);

    const globalStyles = currentProject?.globalStyles || DEFAULT_GLOBAL_STYLES;

    const handleSubtitleClick = (
      clickedCueIds: string[],
      groupTexts: string[]
    ) => {
      if (
        videoRef.current &&
        videoRef.current.paused &&
        !isPlayingCueSegmentRef.current &&
        clickedCueIds.length > 0
      ) {
        const firstClickedCueId = clickedCueIds[0];
        const clickedCue = cues.find((c) => c.id === firstClickedCueId);

        console.log(
          "[VideoPlayer] Subtitle Clicked. Group Cue IDs:",
          clickedCueIds,
          "Group Texts:",
          groupTexts,
          "Focusing Cue ID:",
          firstClickedCueId,
          "Found Cue Object:",
          clickedCue
        );

        if (clickedCue) {
          setFocusedCueId(firstClickedCueId);
          if (videoRef.current) {
            videoRef.current.currentTime = clickedCue.startTime;
          }
        }
      }
    };

    const getFooterCueInfo = () => {
      if (isPlayingCueSegmentRef.current && currentCueForEditing) {
        const cueIndex = cues.findIndex(
          (c) => c.id === currentCueForEditing.id
        );
        return `Playing Segment: Cue ${
          cueIndex !== -1 ? cueIndex + 1 : "?"
        } (${secondsToTime(
          currentCueForEditing.startTime,
          false
        )} - ${secondsToTime(currentCueForEditing.endTime, false)})`;
      }
      if (currentPlaybackCues.length > 0 && !isPlayingCueSegmentRef.current) {
        if (currentPlaybackCues.length === 1) {
          const cue = currentPlaybackCues[0];
          const cueIndex = cues.findIndex((c) => c.id === cue.id);
          return `Playing Cue: ${
            cueIndex !== -1 ? cueIndex + 1 : "?"
          } (${secondsToTime(cue.startTime, false)} - ${secondsToTime(
            cue.endTime,
            false
          )})`;
        } else {
          const firstRenderedCue = currentPlaybackCues.find((pc) =>
            cues.some((c) => c.id === pc.id)
          );
          const firstCueIndex = firstRenderedCue
            ? cues.findIndex((c) => c.id === firstRenderedCue.id)
            : -1;
          return `Playing ${
            currentPlaybackCues.length
          } Overlapping Cues (starting with Cue ${
            firstCueIndex !== -1 ? firstCueIndex + 1 : "?"
          })`;
        }
      }
      if (
        currentCueForEditing &&
        videoRef.current?.paused &&
        !isPlayingCueSegmentRef.current
      ) {
        const cueIndex = cues.findIndex(
          (c) => c.id === currentCueForEditing.id
        );
        return `Focused Cue: ${
          cueIndex !== -1 ? cueIndex + 1 : "?"
        } (${secondsToTime(
          currentCueForEditing.startTime,
          false
        )} - ${secondsToTime(currentCueForEditing.endTime, false)})`;
      }
      if (cues.length > 0 && isVideoPaused && !isPlayingCueSegmentRef.current) {
        return `Video Paused. Select a cue or play.`;
      }
      return "No Cue Active";
    };

    const cuesToConsiderForRender =
      isPlayingCueSegmentRef.current && currentCueForEditing
        ? [currentCueForEditing]
        : currentPlaybackCues;

    const groupedCuesForRender: {
      blockStyles: StylingOptions;
      texts: string[];
      cueSpecificStyles: (StylingOptions | undefined)[];
      cueIds: string[];
    }[] = [];

    if (cuesToConsiderForRender.length > 0) {
      const sortedPlaybackCues = [...cuesToConsiderForRender].sort((a, b) => {
        if (a.startTime !== b.startTime) return a.startTime - b.startTime;
        return (
          (a.translatedText || a.originalText).length -
            (b.translatedText || b.originalText).length ||
          a.id.localeCompare(b.id)
        );
      });

      const cuesByEffectivePosition = new Map<string, Cue[]>();

      sortedPlaybackCues.forEach((cue) => {
        const cueOwnStyle = cue.style || {};
        const effectiveVP =
          cueOwnStyle.verticalPlacement ||
          globalStyles.verticalPlacement ||
          "Bottom";
        const effectiveHP =
          cueOwnStyle.horizontalPlacement ||
          globalStyles.horizontalPlacement ||
          "Center";

        const hasUniqueBlockDefiningStyle =
          cueOwnStyle.verticalPlacement ||
          cueOwnStyle.horizontalPlacement ||
          (cueOwnStyle.backgroundColor &&
            cueOwnStyle.backgroundColor !== globalStyles.backgroundColor &&
            cueOwnStyle.backgroundColor !== "transparent" &&
            cueOwnStyle.backgroundColor !== "rgba(0,0,0,0)");

        const positionKey = hasUniqueBlockDefiningStyle
          ? `cue-${cue.id}-${effectiveVP}-${effectiveHP}`
          : `global-${effectiveVP}-${effectiveHP}`;

        if (!cuesByEffectivePosition.has(positionKey)) {
          cuesByEffectivePosition.set(positionKey, []);
        }
        cuesByEffectivePosition.get(positionKey)!.push(cue);
      });

      cuesByEffectivePosition.forEach((posGroupCues) => {
        if (posGroupCues.length > 0) {
          const firstCueInPosGroup = posGroupCues[0];
          const firstCueStyle = firstCueInPosGroup.style || {};

          const blockStylesForThisGroup: StylingOptions = {
            ...globalStyles,
            fontFamily: firstCueStyle.fontFamily || globalStyles.fontFamily,
            fontSize: firstCueStyle.fontSize || globalStyles.fontSize,
            color: firstCueStyle.color || globalStyles.color,
            bold:
              firstCueStyle.bold !== undefined
                ? firstCueStyle.bold
                : globalStyles.bold,
            italic:
              firstCueStyle.italic !== undefined
                ? firstCueStyle.italic
                : globalStyles.italic,
            verticalPlacement:
              firstCueStyle.verticalPlacement || globalStyles.verticalPlacement,
            horizontalPlacement:
              firstCueStyle.horizontalPlacement ||
              globalStyles.horizontalPlacement,
            backgroundColor:
              firstCueStyle.backgroundColor &&
              firstCueStyle.backgroundColor !== "transparent" &&
              firstCueStyle.backgroundColor !== "rgba(0,0,0,0)"
                ? firstCueStyle.backgroundColor
                : globalStyles.backgroundColor,
            borderRadius:
              firstCueStyle.borderRadius || globalStyles.borderRadius,
          };

          groupedCuesForRender.push({
            blockStyles: blockStylesForThisGroup,
            texts: posGroupCues.map(
              (cue) => cue.translatedText || cue.originalText
            ),
            cueSpecificStyles: posGroupCues.map((cue) => cue.style),
            cueIds: posGroupCues.map((cue) => cue.id),
          });
        }
      });
    }

    return (
      <>
        <Card className={props.className}>
          <CardHeader className="py-3 px-4 border-b flex flex-row justify-between items-center">
            <CardTitle className="text-base font-semibold flex items-center">
              <FilmIcon className="mr-2 h-5 w-5 text-primary" /> Video Preview
            </CardTitle>
            <div className="flex items-center space-x-1">
              {videoSrc && (
                <button
                  onClick={toggleCustomFullscreen}
                  className="p-1.5 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={
                    isInCustomFullscreen
                      ? "Exit fullscreen"
                      : "Enter fullscreen"
                  }
                >
                  {isInCustomFullscreen ? (
                    <Shrink className="h-5 w-5" />
                  ) : (
                    <Expand className="h-5 w-5" />
                  )}
                </button>
              )}
              {videoSrc && (
                <button
                  onClick={() => setVideoSrc(null)}
                  className="p-1.5 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close video"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent
            ref={fullscreenContainerRef}
            className="flex items-center justify-center bg-muted/30 p-0 md:p-2 relative aspect-video
                     data-[fullscreen=true]:fixed data-[fullscreen=true]:inset-0 data-[fullscreen=true]:z-50
                     data-[fullscreen=true]:bg-black data-[fullscreen=true]:p-0 data-[fullscreen=true]:flex
                     data-[fullscreen=true]:flex-col data-[fullscreen=true]:items-center data-[fullscreen=true]:justify-center
                     data-[fullscreen=true]:overflow-visible data-[fullscreen=true]:aspect-auto"
            data-fullscreen={isInCustomFullscreen}
          >
            {videoSrc ? (
              <video
                ref={videoRef}
                key={videoSrc}
                src={videoSrc}
                controls
                className="w-full h-auto object-contain data-[fullscreen=true]:h-full data-[fullscreen=true]:w-full"
                style={{ position: "relative", zIndex: 0 }}
                data-fullscreen={isInCustomFullscreen}
                onLoadedMetadata={() => {
                  if (videoRef.current && !isPlayingCueSegmentRef.current) {
                    handleTimeUpdateRef.current(videoRef.current.currentTime);
                    setIsVideoPaused(videoRef.current.paused);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                <TvMinimalPlay className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-sm font-medium">No video loaded.</p>
                <p className="text-xs">
                  Use the controls to select a video file.
                </p>
              </div>
            )}

            {!isInCustomFullscreen &&
              videoSrc &&
              groupedCuesForRender.map((group, idx) =>
                renderSingleSubtitleBlock(
                  group.texts,
                  group.blockStyles,
                  group.cueSpecificStyles,
                  group.cueIds,
                  Boolean(videoRef.current?.paused && !isPlayingCueSegmentRef.current),
                  handleSubtitleClick,       
                  `normal-group-${idx}`,
                )
                )}
          </CardContent>
          {videoSrc && (cues.length > 0 || currentCueForEditing) && (
            <div className="p-2 text-xs border-t text-muted-foreground text-center">
              {getFooterCueInfo()}
              {targetLanguage ? ` [${targetLanguage.name}]` : ""}
            </div>
          )}
        </Card>

        {isInCustomFullscreen &&
          fullscreenSubtitleHost &&
          videoSrc &&
            createPortal(
              groupedCuesForRender.map((group, idx) =>
                renderSingleSubtitleBlock(
                  group.texts,
                  group.blockStyles,
                  group.cueSpecificStyles,
                  group.cueIds,
                  false,
                  handleSubtitleClick,
                  `fs-group-${idx}`
                )
              ),
              fullscreenSubtitleHost
            )}
      </>
    );
  }
);
VideoPlayer.displayName = "VideoPlayer";
export { VideoPlayer };
