import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import Hls from 'hls.js';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
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
// `.m3u8` (HLS master playlist) is included so adaptive streams are also
// recognised as video for poster/thumbnail/badge logic.
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg|ogv|m3u8)(#|$|\?)/i;
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
    <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-neutral-900/70 px-4 py-3 backdrop-blur-md">
      <p
        ref={ref}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: open ? 'unset' : lines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
        className="text-sm leading-relaxed text-neutral-100 transition-all"
      >
        {text}
      </p>
      {overflows && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-indigo-300 transition-colors hover:text-indigo-200"
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
  // Optional adaptive-HLS master playlist for the item's video. When present,
  // the video is played with hls.js (auto-switching quality on slow
  // connections) instead of the raw `video` URL's progressive MP4. Leave
  // undefined to keep direct MP4 playback (old videos without HLS).
  videoHls,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  // Fullscreen state mirrors the real document state (so Escape to exit keeps the
  // icon in sync), tracked via the fullscreenchange event.
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Video-specific playback control (syncs to the actual element events).
  const [videoPlaying, setVideoPlaying] = useState(false);
  // The video starts paused and plays WITH audio the first time the user clicks
  // or hovers it, so it begins unmuted (unlike the old muted-autoplay default).
  const [videoMuted, setVideoMuted] = useState(false);
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
  // Live hls.js instance for the active video (destroyed on unmount/switch),
  // and whether the player is stalled waiting for more data (shown as a spinner).
  const hlsRef = React.useRef(null);
  const [buffering, setBuffering] = React.useState(false);
  // Player-bar state: current playback position, total duration, and how much
  // of the video the player has buffered ahead — drives the timeline scrubber.
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [buffered, setBuffered] = React.useState(0);
  const seekBarRef = React.useRef(null);

  const imageCount = images.length;
  const currentMedia = images[index];
  const isVideo = isVideoUrl(currentMedia);
  // Use adaptive HLS when the active media is this item's video AND an HLS
  // manifest exists; otherwise fall back to the direct progressive MP4.
  const useHls = isVideo && !!videoHls;

  // Timeline percentages for the player bar, clamped to 0–100%.
  const playedPct = duration ? Math.min(100, (currentTime / duration) * 100) : 0;
  const bufferedPct = duration ? Math.min(100, (buffered / duration) * 100) : 0;

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

  // Clicking the video itself toggles play/pause, and starting it also turns the
  // sound on (this is the only "play/pause" affordance — there is no on-screen
  // button anymore). Only at normal zoom — zoomed in, clicks are drag-pan.
  const toggleVideo = () => {
    const v = mediaRef.current;
    if (!v) return;
    setShowControls(true);
    if (v.paused) {
      v.muted = false;
      setVideoMuted(false);
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  // Hovering the video starts it too (with audio): if it isn't already playing,
  // unmute and play. This is a user gesture, so the browser permits sound here.
  const playOnHover = () => {
    const v = mediaRef.current;
    if (!v || !v.paused) return;
    v.muted = false;
    setVideoMuted(false);
    setShowControls(true);
    v.play().catch(() => {});
  };

  // m:ss clock used for the player bar's time readout.
  const formatTime = (sec) => {
    if (!Number.isFinite(sec) || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Map a pointer position on the scrubber to a video time and seek there. Used
  // by click-to-seek and drag-to-seek (the bar captures the pointer while held).
  const seekFromClientX = (clientX) => {
    const v = mediaRef.current;
    const bar = seekBarRef.current;
    if (!v || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    v.currentTime = ratio * duration;
    setCurrentTime(v.currentTime);
  };
  const onSeekDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    seekBarRef.current?.setPointerCapture?.(e.pointerId);
    seekFromClientX(e.clientX);
  };
  const onSeekMove = (e) => {
    if (!seekBarRef.current?.hasPointerCapture?.(e.pointerId)) return;
    seekFromClientX(e.clientX);
  };
  const onSeekUp = (e) => {
    if (seekBarRef.current?.hasPointerCapture?.(e.pointerId)) {
      seekBarRef.current?.releasePointerCapture?.(e.pointerId);
    }
  };

  // While the video is PAUSED, keep the buffer topped up so resuming is instant:
  // hls.js halts its fragment loading when the media pauses, which otherwise
  // leaves the buffered bar stuck right at the playhead. This heartbeat runs
  // every second while paused, measures how much is buffered AHEAD of the
  // playhead, and if it's under BUFFER_AHEAD_TARGET (~30s) tells hls.js to load
  // more — so pausing at 10s keeps buffering out to ~40s. hls.js stops on its
  // own once it can't fetch further (end of stream or buffer cap).
  const BUFFER_AHEAD_TARGET = 30; // seconds of media to keep ready ahead of pause
  useEffect(() => {
    if (videoPlaying || !useHls || !hlsRef.current) return;
    const tick = () => {
      const v = mediaRef.current;
      const hls = hlsRef.current;
      if (!v || !hls || !v.paused) return;
      // How much of the video is buffered ahead of the current playhead.
      const pos = v.currentTime;
      let ahead = 0;
      for (let i = 0; i < v.buffered.length; i++) {
        if (v.buffered.start(i) <= pos && v.buffered.end(i) >= pos) {
          ahead = v.buffered.end(i) - pos;
          break;
        }
      }
      // Not enough ready ahead -> ask hls.js to keep loading more fragments.
      if (ahead < BUFFER_AHEAD_TARGET) hls.startLoad();
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [videoPlaying, useHls, currentTime]);

  // Manage the hls.js instance for adaptive playback (the "plays smoothly on a
  // slow connection" part). On the active video it attaches the manifest so the
  // player auto-switches quality tier to match live bandwidth; for a plain
  // progressive MP4 (no videoHls) we leave the element's native src untouched.
  // The instance is torn down on unmount or whenever the media/manifest changes.
  useEffect(() => {
    const v = mediaRef.current;
    const supported = Hls.isSupported();
    if (!v || !useHls || !supported || !videoHls) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setBuffering(false);
      return;
    }
    if (hlsRef.current) hlsRef.current.destroy();
    // Adaptive-bitrate tuning so quality tracks live bandwidth: the player
    // starts at the tier matching a modest initial estimate (plays instantly on
    // a slow connection instead of stalling for 1080p), then ABR ramps UP on
    // fast internet and DROPS DOWN the moment the buffer drains faster than it
    // refills — no user action needed. The visible "Buffering…" spinner is
    // driven by the video element's waiting/stalled events below.
    const hls = new Hls({
      enableWorker: true,
      // -1 = auto: begin at the level that matches the current estimate.
      startLevel: -1,
      // ~1.5 Mbps start — enough for 360p to load immediately on weak links;
      // ABR climbs from here on healthy bandwidth.
      abrEwmaDefaultEstimate: 1.5e6,
      // Fast upward response (quick voI) so a strong connection ramps to a high
      // tier quickly; slower downward response so a brief dip doesn't cause
      // needless quality yo-yoing.
      abrEwmaFastVoI: 3.0,
      abrEwmaSlowVoI: 9.0,
      // Never fetch a higher tier than the on-screen size needs — no 1080p
      // download for a small player (re-evaluated live on resize/fullscreen).
      capLevelToPlayerSize: true,
      // Hold ~30 s (up to 60 s) of buffered video so playback keeps flowing
      // across brief speed dips without hitting 'waiting'.
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      backBufferLength: 30,
      // Prefetch the next fragment's start so tier switches don't stall.
      startFragPrefetch: true,
      // Resilience: retry dropped requests/slow responses instead of erroring.
      fragLoadingMaxRetry: 6,
      fragLoadingRetryDelay: 1000,
      levelLoadingTimeOut: 10000,
      fragLoadingTimeOut: 20000,
      maxLoadingDelay: 4,
    });
    hls.loadSource(videoHls);
    hls.attachMedia(v);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setVideoPlaying(true);
      v.play().catch(() => {});
    });
    // Fatal network/media errors are recoverable: retry loading, or recover the
    // media element, rather than killing playback on a transient failure.
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data?.fatal) return;
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        hls.startLoad();
      } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
      } else {
        hls.destroy();
        hlsRef.current = null;
      }
    });
    hlsRef.current = hls;
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentMedia, useHls, videoHls]);

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
            // With HLS the manifest is attached by hls.js (no native src), so
            // it stays unset on that path; progressive MP4 keeps its src.
            src={useHls ? undefined : currentMedia}
            poster={images.find((im) => !isVideoUrl(im) || im !== currentMedia) || undefined}
            controls={false}
            playsInline
            loop
            // No autoplay: the video starts paused (showing its poster/first
            // frame) and plays WITH audio the first time the user hovers it
            // (playOnHover) or clicks it (toggleVideo).
            onMouseEnter={playOnHover}
            onClick={(e) => {
              e.stopPropagation();
              if (zoom === 1) toggleVideo();
            }}
            onPointerDown={(e) => zoom > 1 && e.stopPropagation()}
            onPlay={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            onEnded={() => setVideoPlaying(false)}
            // On a slow connection the player stalls while buffering — surface
            // it with a spinner so the "buffering" state is visible.
            onWaiting={() => setBuffering(true)}
            onStalled={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onCanPlay={() => setBuffering(false)}
            // Player-bar feed: playhead position, total length, and buffered
            // ahead amount keep the timeline scrubber in sync. Duration arrives
            // when metadata loads (and updates if it changes, e.g. HLS).
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
            onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
            onProgress={(e) => {
              const v = e.currentTarget;
              setBuffered(v.buffered?.length ? v.buffered.end(v.buffered.length - 1) : 0);
            }}
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

        {/* Video player bar — mute toggle (bottom-left) + timeline scrubber with
            buffered range and current/total time (bottom-center). The scrubber is
            click-and-drag to seek. These controls show while paused or hovering
            and auto-hide a beat into uninterrupted playback (move the mouse over
            the video to bring them back). There is no play/pause button — the
            video plays on hover (playOnHover) and toggles on click (toggleVideo). */}
        {isVideo && zoom === 1 && showControls && (
          <>
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

            {/* Timeline: played (indigo), buffered (white/25), draggable knob. */}
            <div
              ref={seekBarRef}
              onPointerDown={onSeekDown}
              onPointerMove={onSeekMove}
              onPointerUp={onSeekUp}
              onPointerCancel={onSeekUp}
              style={{ touchAction: 'none' }}
              className="absolute bottom-2.5 left-14 right-20 flex select-none items-center gap-2.5"
            >
              <div className="group relative h-4 flex-1 cursor-pointer">
                <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="absolute inset-y-0 left-0 bg-white/25"
                    style={{ width: `${bufferedPct}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-indigo-400"
                    style={{ width: `${playedPct}%` }}
                  />
                </div>
                {/* Knob rides the playhead; fades in on hover. */}
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ left: `${playedPct}%` }}
                />
              </div>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/85">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </>
        )}

        {/* Buffering indicator — shown while the player stalls for more data on
            a slow connection (HLS switching tier, or the MP4 catching up). */}
        {isVideo && buffering && (
          <div
            className="pointer-events-none absolute inset-0 grid place-items-center"
            style={{ pointerEvents: 'none' }}
          >
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/55 px-5 py-4 backdrop-blur">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/80">
                Buffering…
              </span>
            </div>
          </div>
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