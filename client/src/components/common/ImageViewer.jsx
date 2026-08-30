import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';

// Max zoom factor for a single photo (1 = fit).
const ZOOM_MAX = 3;
// Drag-pan sensitivity multiplier — well above 1:1 so panning feels fast and
// the image keeps up with the cursor when dragging sideways.
const PAN_SPEED = 3;

// Common web video extensions — used to render a video element (with its own
// audio controls) instead of a still image when the active media is a video.
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg|ogv)(#|$|\?)/i;
export const isVideoUrl = (url = '') => VIDEO_EXT.test(url);

/**
 * Renders a short caption right-aligned to the media, clamped to `lines`. When
 * the text overflows the clamped box, a "Read more" toggle reveals the full
 * caption (and becomes "Read less"). Pure presentational state lives here so the
 * viewer stays focused on media.
 */
const ClampCaption = ({ text, lines = 2 }) => {
  const ref = React.useRef(null);
  const [overflows, setOverflows] = useState(false);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      setOverflows(el.scrollHeight - el.clientHeight > 1);
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [text, lines]);

  return (
    <div className="w-full max-w-xl">
      <p
        ref={ref}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: open ? 'unset' : lines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
        className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 transition-all"
      >
        {text}
      </p>
      {overflows && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 transition-colors hover:text-indigo-500"
        >
          {open ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
};

/**
 * Google-Maps style media viewer shared by the gallery lightbox and the gallery
 * collection page. Renders one media item (photo or video) at a time from
 * `images`; the mouse does everything — scroll-wheel zooms anchored to the
 * cursor (transform-based, so a photo spills across the whole screen instead of
 * being clipped in a box), and dragging pans it. Shows the item caption (with
 * Read more) below.
 *
 * Props:
 *  - images          string[] ordered set (photos + optional video URL); the
 *                    active one is images[index]
 *  - index           currently shown media (parent keeps the state)
 *  - onIndexChange   setter for index (prev/next arrows step within the set)
 *  - itemId          stable id used as the reset key (zoom/pan reset when it
 *                    changes)
 *  - itemTitle       used for alt text + download filename
 *  - title           string | undefined — item title shown ABOVE the media
 *  - caption         string | undefined — item caption shown below the media
 *                    with clamp + Read more when it overflows
 *  - onPrevSet / onNextSet: optional — when the set has a single image and these
 *    are provided, the arrows call them instead (lets the lightbox cycle to the
 *    next gallery item for single-image cards, exactly as before).
 */
export const ImageViewer = ({
  images,
  index,
  onIndexChange,
  itemId,
  itemTitle,
  title,
  caption,
  onPrevSet,
  onNextSet,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  // Fullscreen state mirrors the real document state (so Escape to exit keeps the
  // icon in sync), tracked via the fullscreenchange event.
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Video-specific playback control (syncs to the actual element events).
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  // Whether the on-screen video controls are drawn. They show on hover and while
  // paused; while a video is playing they auto-hide after a short beat so the
  // frame stays clean — clicking the video itself toggles play/pause.
  const [showControls, setShowControls] = useState(true);
  // Live mirrors of zoom/pan let the non-passive wheel handler read the freshest
  // values without re-attaching on every state change.
  const imageWrapRef = React.useRef(null);
  const mediaRef = React.useRef(null); // the <img> or <video> — for fullscreen
  const panLastRef = React.useRef(null);
  const zoomRef = React.useRef(1);
  const panRef = React.useRef({ x: 0, y: 0 });

  const imageCount = images.length;
  const currentMedia = images[index];
  const isVideo = isVideoUrl(currentMedia);

  // Reset zoom/pan whenever a different item is shown.
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [itemId]);

  zoomRef.current = zoom;
  panRef.current = pan;

  // Track real fullscreen state so Escape (which the browser handles) keeps the
  // fullscreen icon consistent.
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Auto-hide the on-screen video controls while the video is playing: after a
  // short beat they fade out so the frame stays clean; any pointer movement over
  // the media (or a pause) brings them back. At normal zoom only — zoomed in,
  // the cursor is busy dragging, not clicking, so leave the controls off.
  useEffect(() => {
    if (!isVideo || zoom > 1) {
      setShowControls(false);
      return;
    }
    const show = () => setShowControls(true);
    let hideTimer;
    const arm = () => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!videoPlaying) return;
        setShowControls(false);
      }, 2200);
    };
    if (!videoPlaying) {
      setShowControls(true);
      return;
    }
    arm();
    const el = imageWrapRef.current;
    el?.addEventListener('pointermove', show);
    el?.addEventListener('pointerdown', show);
    return () => {
      el?.removeEventListener('pointermove', show);
      el?.removeEventListener('pointerdown', show);
      clearTimeout(hideTimer);
    };
  }, [isVideo, zoom, videoPlaying]);

  // Clicking the video itself toggles play/pause (students' "click the video and
  // it works as play/pause"): the on-screen button is a redundant affordance.
  // Only at normal zoom — zoomed in, clicks are drag-pan territory.
  const toggleVideo = () => {
    const v = mediaRef.current;
    if (!v) return;
    setShowControls(true);
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  // Toggle browser fullscreen on the image wrapper (Esc exits). The wrapper —
  // not the bare media element — is the target so the on-image controls (prev/
  // next arrows, counter, download, fullscreen) stay visible in fullscreen
  // mode instead of disappearing with the media. Title/caption stay in the page.
  const toggleFullscreen = () => {
    const el = imageWrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  };

  // Mouse-wheel over the image zooms it (Google-Maps style): the zoom is
  // anchored to the point under the cursor so that spot stays fixed as you
  // zoom in/out. Attached natively (non-passive) so preventDefault wins and the
  // page behind never scrolls.
  useEffect(() => {
    const el = imageWrapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const z0 = zoomRef.current;
      const dir = e.deltaY < 0 ? 1 : -1;
      // Tiny per-notch step + a CSS transform transition give the smooth,
      // "water-like" glide instead of a jump.
      const next = Math.min(ZOOM_MAX, Math.max(1, +(z0 + dir * 0.1).toFixed(2)));
      if (next === z0) return;

      // Keep the content point under the cursor fixed: with transform-origin at
      // the image center `C`, a screen point `p` maps to content space via
      // `(p - C - pan) / zoom`; solving for the new pan keeps `p` in place.
      const cr = el.getBoundingClientRect();
      const Cx = cr.left + cr.width / 2;
      const Cy = cr.top + cr.height / 2;
      const px = e.clientX;
      const py = e.clientY;
      const t = panRef.current;
      const f = next / z0;

      if (next === 1) {
        // Bottomed-out: snap nicely centered.
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }
      setZoom(next);
      setPan({
        x: px - Cx - f * (px - Cx - t.x),
        y: py - Cy - f * (py - Cy - t.y),
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Drag the (zoomed) image to pan it across the screen. At 1× there is nothing
  // to pan, so dragging does nothing (matches Google Maps). Uses transform
  // translate (no scroll container), so the page underneath is never touched.
  const onPanDown = (e) => {
    if (zoomRef.current <= 1) return;
    panLastRef.current = { x: e.clientX, y: e.clientY };
    setIsPanning(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPanMove = (e) => {
    if (!isPanning) return;
    const last = panLastRef.current;
    setPan((p) => ({
      x: p.x + (e.clientX - last.x) * PAN_SPEED,
      y: p.y + (e.clientY - last.y) * PAN_SPEED,
    }));
    panLastRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPanUp = (e) => {
    setIsPanning(false);
    panLastRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // Download the currently shown media. Fetches as a blob so it works for both
  // same-origin /uploads files and external hosts; falls back to opening it.
  const downloadImage = async (url, name) => {
    if (!url) return;
    const filename = `${name || 'media'}${isVideo ? '.mp4' : '.jpg'}`;
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
    } catch {
      // Cross-origin blocked us — just open it so the user can save manually.
      window.open(url, '_blank', 'noopener');
    }
  };

  // Within a set the arrows step to the next/prev photo; for a bare single
  // image they defer to the parent's item-cycling callbacks when provided.
  const goPrev = imageCount > 1 ? () => onIndexChange((index - 1 + imageCount) % imageCount) : onPrevSet;
  const goNext = imageCount > 1 ? () => onIndexChange((index + 1) % imageCount) : onNextSet;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Title above the media (top side) */}
      {title && (
        <h2 className="w-full max-w-xl truncate text-center text-sm font-medium text-neutral-200">
          {title}
        </h2>
      )}
      <div
        ref={imageWrapRef}
        onPointerDown={onPanDown}
        onPointerMove={onPanMove}
        onPointerUp={onPanUp}
        onPointerCancel={onPanUp}
        className={`relative touch-none will-change-transform ${
          isFullscreen
            // Fullscreen: the wrapper fills the screen and centers the media,
            // so the on-image arrows/buttons stay overlaid on the picture.
            ? 'flex h-screen w-screen items-center justify-center'
            : 'inline-block'
        } ${zoom > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
      >
        {isVideo ? (
          <video
            key={currentMedia}
            ref={mediaRef}
            src={currentMedia}
            poster={images.find((im) => !isVideoUrl(im) || im !== currentMedia) || undefined}
            controls={false}
            muted
            autoPlay
            playsInline
            loop
            onClick={(e) => {
              e.stopPropagation();
              if (zoom === 1) toggleVideo();
            }}
            onPointerDown={(e) => zoom > 1 && e.stopPropagation()}
            onPlay={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            onEnded={() => setVideoPlaying(false)}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            className={`w-auto rounded-xl object-contain shadow-2xl will-change-transform bg-black ${
              isFullscreen ? 'max-h-screen max-w-full' : 'max-h-[68vh] max-w-full'
            } ${isPanning ? '' : 'transition-transform duration-300 ease-out'}`}
          />
        ) : (
          <img
            ref={mediaRef}
            src={currentMedia}
            alt={itemTitle}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            className={`w-auto rounded-xl object-contain shadow-2xl will-change-transform ${
              isFullscreen ? 'max-h-screen max-w-full' : 'max-h-[68vh] max-w-full'
            } ${isPanning ? '' : 'transition-transform duration-300 ease-out'}`}
          />
        )}

        {/* Video controls — Play/Pause and Mute/Unmute, overlaid on the video.
            Autoplay is muted (browsers block unmuted autoplay); the Mute button
            flips it. Only interactive at normal zoom, and they auto-hide a beat
            after playback starts (move the mouse over the video to bring them
            back). Clicking the video itself also toggles play/pause. */}
        {isVideo && zoom === 1 && showControls && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleVideo();
              }}
              aria-label={videoPlaying ? 'Pause video' : 'Play video'}
              tabIndex={0}
              className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70"
            >
              {videoPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const v = mediaRef.current;
                if (!v) return;
                setVideoMuted((m) => {
                  v.muted = !m;
                  return !m;
                });
              }}
              aria-label={videoMuted ? 'Unmute video' : 'Mute video'}
              tabIndex={0}
              className="absolute bottom-2 left-2 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70"
            >
              {videoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </>
        )}

        {/* Prev/next controls sit directly on the media at 50% opacity. Only
            interactive at normal zoom — zoomed, clicks pass through so wheel-zoom
            and drag stay fluid. */}
        {goPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous photo"
            tabIndex={zoom > 1 ? -1 : 0}
            className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white opacity-50 transition hover:opacity-80 focus:outline-none"
            style={{ pointerEvents: zoom > 1 ? 'none' : 'auto' }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {goNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next photo"
            tabIndex={zoom > 1 ? -1 : 0}
            className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white opacity-50 transition hover:opacity-80 focus:outline-none"
            style={{ pointerEvents: zoom > 1 ? 'none' : 'auto' }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        {zoom === 1 && imageCount > 1 && (
          <span className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-black/50 px-2 py-0.5 font-mono text-[11px] text-white backdrop-blur">
            {index + 1} / {imageCount}
          </span>
        )}

        {/* Download + fullscreen controls overlaid on the media (bottom-right). */}
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadImage(currentMedia, itemTitle);
            }}
            aria-label="Download media"
            className="grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'View full screen'}
            className="grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Caption below the media (bottom side), clamped with a Read more toggle
          when it overflows the reserved lines. */}
      {caption && <ClampCaption text={caption} lines={2} />}
    </div>
  );
};

export default ImageViewer;