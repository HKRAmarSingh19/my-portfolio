import React, { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Star, Images, Maximize2, ChevronLeft, ChevronRight, ArrowRight, Play } from 'lucide-react';
import { galleryApi } from '../api/client';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';
import PageHeader from '../components/common/PageHeader';
import ImageViewer, { isVideoUrl } from '../components/common/ImageViewer';

/**
 * Clamps children to `lines`, and only when the text genuinely overflows that
 * many lines does it render a "Read more →" link (to `to`). Overflow is
 * measured against the rendered box — clamp + 1px — so short captions stay clean
 * and long ones get an obvious way to read the full caption.
 */
const ClampWithReadMore = ({ lines = 2, children, to }) => {
  const ref = useRef(null);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      // Overflow means the full text is taller than the 2-line clamp box:
      // scrollHeight exceeds clientHeight (with an epsilon for subpixel).
      setOverflows(
        ref.current ? ref.current.scrollHeight - ref.current.clientHeight > 1 : false
      );
    };
    measure();
    // Re-measure on any size change so the link tracks column / font changes.
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [children, lines]);

  return (
    <div className="mt-1 flex min-h-0 flex-1 flex-col">
      <p
        ref={ref}
        className="text-[13px] leading-relaxed text-neutral-500"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: lines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {children}
      </p>
      {/* Spacer pushes the link (when present) to the bottom of the
          fixed-height caption, so every photo in a row starts on the same
          line regardless of caption length. */}
      <div className="flex-1" />
      {overflows && (
        <Link
          to={to}
          className="inline-flex items-center gap-1 pt-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 transition-colors hover:text-indigo-500"
        >
          Read more
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
};

/**
 * Locks the page behind the lightbox: freezes body scroll and swallows the
 * mouse wheel + touch pan on the backdrop, so the gallery below never moves
 * while the viewer overlay is open.
 */
const ScrollLock = () => {
  // Restore on unmount (i.e. when the lightbox closes) so the page scrolls
  // again. The try/finally guards against other code having changed overflow.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return null;
};

export const Gallery = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fullscreen viewer: the gallery item currently shown in the overlay, or null.
  const [lightboxIndex, setLightboxIndex] = useState(null);
  // Which photo (within the active item's set) the viewer is showing.
  const [lbImageIdx, setLbImageIdx] = useState(0);
  // Per-card preview thumbnail index for multi-image items (arrows cycle within
  // the card's own set); itemId-keyed so switching away resets to 0.
  const [previewIdx, setPreviewIdx] = useState(0);
  const [previewItemId, setPreviewItemId] = useState(null);

  // Active number of grid columns (matches the Tailwind breakpoints), used to
  // split filteredItems into rows so a dashed divider can follow each row.
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      // 2 cols by default, 3 from md (768), 4 from lg (1024) — matches the grid.
      setCols(w >= 1024 ? 4 : w >= 768 ? 3 : 2);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  // Open the fullscreen viewer for a given gallery item. A tile index (from the
  // WhatsApp collage) jumps straight to that photo in the set.
  const openLightbox = (item, tileIdx = 0) => {
    setLbImageIdx(
      Number.isFinite(tileIdx) && tileIdx >= 0 ? tileIdx : 0
    );
    setLightboxIndex(filteredItems.indexOf(item));
  };

  // Never pass the raw React state setter to ImageViewer — viewers call
  // onIndexChange(nextIndex) and a state setter receives "extra args", so an
  // event object can be coerced into the index and React 18+ throws (blank
  // screen). Wrap in a clean arrow that only ever receives a number.
  const moveToImage = (next) => {
    if (typeof next === 'number' && Number.isFinite(next)) setLbImageIdx(next);
  };

  // Cycle a multi-image card's preview to the previous/next photo in its set.
  // Stops at the ends (wrap would be disorienting in a card thumb).
  const cyclePreview = (item, dir) => {
    const set = Array.from(new Set([item.image, ...(item.images || [])].filter(Boolean)));
    if (set.length <= 1) return;
    // Starting to browse a different card's set — begin from its first photo.
    if (previewItemId !== item._id) {
      setPreviewItemId(item._id);
      setPreviewIdx(0);
      return;
    }
    setPreviewIdx((i) => {
      const next = i + dir;
      if (next < 0) return 0;
      if (next >= set.length) return set.length - 1;
      return next;
    });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => galleryApi.getAll({}),
  });

  const items = data?.data?.data || [];

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort(),
    [items]
  );

  const filteredItems = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedCategory && item.category !== selectedCategory) return false;
      if (!term) return true;
      return (
        item.title?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term)
      );
    });
  }, [items, searchQuery, selectedCategory]);

  // Derive the item currently in the fullscreen viewer, plus its image set.
  // (Must come AFTER the filteredItems declaration above — reading it earlier
  // hits the JS Temporal Dead Zone and throws a ReferenceError on open.)
  const activeItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;
  const activeImages = activeItem
    ? (() => {
        const media = Array.from(
          new Set([activeItem.image, ...(activeItem.images || [])].filter(Boolean))
        );
        if (activeItem.video) media.push(activeItem.video); // video after photos
        return media;
      })()
    : [];

  const hasActiveFilters = Boolean(searchQuery || selectedCategory);
  const countFor = (category) => items.filter((i) => i.category === category).length;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
  };

  return (
    <PageTransition>
      <SEO
        title="Gallery & Visual Archive"
        description="A mixed showcase of personal photography, travel, and product visuals."
      />

      <div className="relative overflow-x-clip pt-28 sm:pt-36 pb-20">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <PageHeader
            eyebrow="Visual Archive"
            eyebrowIcon={Images}
            title="Gallery"
            lead="A mixed showcase of personal photography, travel, and product visuals — moments worth keeping, framed in the same minimal restraint as the rest of the site."
          />

          <div className="space-y-5 border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search images by title, caption, or category..."
                aria-label="Search gallery"
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-3 pl-10 pr-10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-indigo-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`rounded-full px-3 py-1.5 font-mono text-xs transition-colors ${
                    selectedCategory === ''
                      ? 'bg-indigo-600 font-semibold text-white'
                      : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  All
                  <span className="ml-1.5 opacity-60">{items.length}</span>
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() =>
                      setSelectedCategory(selectedCategory === category ? '' : category)
                    }
                    className={`rounded-full px-3 py-1.5 font-mono text-xs transition-colors ${
                      selectedCategory === category
                        ? 'bg-indigo-600 font-semibold text-white'
                        : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    {category}
                    <span className="ml-1.5 opacity-60">{countFor(category)}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[11px] text-neutral-400">
                {hasActiveFilters
                  ? `${filteredItems.length} of ${items.length} images`
                  : `${items.length} ${items.length === 1 ? 'image' : 'images'}`}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-neutral-500 transition-colors hover:text-indigo-500"
                >
                  <X className="h-3 w-3" />
                  <span>Clear filters</span>
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="aspect-square animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-900"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="space-y-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 py-20 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-glow">
                <Images className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-neutral-900 dark:text-white">
                No images found
              </h3>
              <p className="mx-auto max-w-sm text-sm text-neutral-500">
                {items.length === 0
                  ? 'No images have been published yet. Check back shortly.'
                  : 'Try a different keyword or clear the active filters.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {/* Each row is its own grid so a dashed divider can follow it. */}
              {Array.from({ length: Math.ceil(filteredItems.length / cols) }, (_, row) => (
                <>
                  <div key={row} className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-3 lg:grid-cols-4">
                  {filteredItems.slice(row * cols, row * cols + cols).map((item, index) => {
                    const absIndex = row * cols + index;
                    // Single canonical media list for this card: photos first, then the optional
                    // video. The collage tiles, the hover-preview, and the lightbox
                    // all index the same array so a tile click opens the same item.
                    const photos = Array.from(
                      new Set([item.image, ...(item.images || [])].filter(Boolean))
                    );
                    if (item.video) photos.push(item.video);
                    const photoCount = photos.length;
                    // Any tile whose media is a video shows the first photo as a
                    // poster (an <img> can't render a video URL) with a play badge.
                    const poster = photos.find((m) => !isVideoUrl(m)) || item.image;
                    return (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.4, delay: Math.min(absIndex, 8) * 0.04 }}
                        className="group relative block text-left transition-all duration-300 hover:-translate-y-1"
                      >
                        {/* Caption at the TOP of the card, above the photo. A
                            single fixed height makes every photo in a row start
                            on the same line regardless of caption length; "Read
                            more" is pinned to the bottom of that reserved space. */}
                        <div className="mb-3 flex h-[7.5rem] flex-col px-0.5">
                          <span className="w-fit rounded bg-indigo-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {item.category || 'Personal'}
                          </span>
                          {/* Plain title text — navigation happens only via the
                              "Read more" link below; the photo opens the
                              fullscreen viewer in place. */}
                          <p className="mt-1.5 block w-full line-clamp-1 text-left text-base font-display font-bold text-neutral-900 dark:text-white">
                            {item.title}
                          </p>
                          {item.description && (
                            <ClampWithReadMore to={`/gallery/${item._id}`}>
                              {item.description}
                            </ClampWithReadMore>
                          )}
                        </div>

                        {/* Photo — below the caption. Click opens the fullscreen
                            viewer (NOT navigation). A div (role=button) rather
                            than a <button>: the overlay controls — fullscreen
                            icon, prev/next arrows — are real sibling buttons
                            inside it, so no invalid nesting and every control has
                            its own independent handler. */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => openLightbox(item)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openLightbox(item);
                            }
                          }}
                          aria-label={`View ${item.title} full screen`}
                          className="relative block aspect-square w-full cursor-pointer overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100 text-left dark:bg-neutral-900 transition-all duration-300 group-hover:border-indigo-500/40 group-hover:shadow-lift"
                        >
                          {/* WhatsApp-style collage for multi-media sets:
                              primary photo bottom-left, the rest fill in reading
                              order to its right and up the column, clamped at
                              2x2 (the 4th tile shows a +N overlay for the rest).
                              Videos appear as poster + play badge. Collapsed to a
                              single tile when only one media item exists. */}
                          {photoCount > 1 ? (
                            <div style={{ aspectRatio: '3/4' }} className="block h-full w-full">
                              <div className="grid h-full w-full grid-cols-2 grid-rows-2">
                                {photos
                                  .slice(0, 4)
                                  .map((image, tileIdx) => (
                                    <div
                                      key={`${item._id}-t${tileIdx}`}
                                      className={`relative overflow-hidden ${
                                        tileIdx === 0
                                          ? 'row-start-2'
                                          : tileIdx === 1
                                            ? 'row-start-2'
                                            : ''
                                      } ${tileIdx === 0 || tileIdx === 1 ? '' : 'border-t border-neutral-200/80 dark:border-neutral-800/80'} ${
                                        tileIdx === 1 || tileIdx === 3 ? 'border-l border-neutral-200/80 dark:border-neutral-800/80' : ''
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openLightbox(item, tileIdx);
                                      }}
                                    >
                                      <img
                                        src={
                                          isVideoUrl(image)
                                            ? poster
                                            : previewItemId === item._id && tileIdx === 0
                                              ? (item.images?.[previewIdx] || item.image)
                                              : image
                                        }
                                        alt={`${item.title} — photo ${tileIdx + 1}`}
                                        loading="lazy"
                                        className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      />
                                      {tileIdx === 3 && photoCount > 4 && (
                                        <span className="absolute inset-0 grid place-items-center bg-black/55 text-2xl font-display font-bold text-white">
                                          +{photoCount - 4}
                                        </span>
                                      )}
                                      {isVideoUrl(image) && (
                                        <span className="absolute inset-0 grid place-items-center bg-black/30">
                                          <Play className="h-6 w-6 text-white drop-shadow" />
                                        </span>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ) : isVideoUrl(photos[0]) ? (
                            // Video-only card: the poster (or the video's own
                            // first frame when there is no poster) with a play
                            // badge. Clicking opens the video.
                            <span className="relative block h-full w-full">
                              {poster ? (
                                <img
                                  src={poster}
                                  alt={item.title}
                                  loading="lazy"
                                  className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                // No poster photo — render the video element so
                                // the browser paints its actual first frame as
                                // the thumbnail instead of a blank box. Seeking
                                // to 0.1s guarantees a frame renders even where
                                // the browser wouldn't otherwise show one.
                                <video
                                  src={item.video}
                                  muted
                                  playsInline
                                  preload="metadata"
                                  onLoadedMetadata={(e) => {
                                    try {
                                      if (Number.isFinite(e.currentTarget.seekable?.length) && e.currentTarget.seekable.length) {
                                        e.currentTarget.currentTime = 0.1;
                                      }
                                    } catch {
                                      /* seek before data ready — ignore */
                                    }
                                  }}
                                  className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              )}
                              <span className="absolute inset-0 grid place-items-center bg-black/20">
                                <Play className="h-9 w-9 text-white drop-shadow-lg" />
                              </span>
                            </span>
                          ) : (
                            <img
                              src={
                                previewItemId === item._id
                                  ? (item.images?.[previewIdx] || item.image)
                                  : item.image
                              }
                              alt={item.title}
                              loading="lazy"
                              className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          )}
                          {item.featured && (
                            <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-neutral-950/80 px-2 py-0.5 font-mono text-[10px] text-indigo-300 backdrop-blur">
                              <Star className="h-2.5 w-2.5 fill-indigo-300" />
                              Featured
                            </span>
                          )}
                          {/* Fullscreen icon appears on hover (bottom-right) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLightbox(item);
                            }}
                            aria-label={`View ${item.title} full screen`}
                            className="absolute bottom-2.5 right-2.5 z-30 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-black/60 text-white opacity-0 shadow-lg backdrop-blur transition-all duration-200 group-hover:scale-110 group-hover:opacity-100"
                          >
                            <Maximize2 className="h-4.5 w-4.5" />
                          </button>

                          {/* Left/Right arrows for multi-image cards (hover) */}
                          {photoCount > 1 && (
                            <>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cyclePreview(item, -1);
                                }}
                                className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-black/80"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cyclePreview(item, 1);
                                }}
                                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-black/80"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </span>
                            </>
                          )}

                          {photoCount > 1 && (
                            <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-neutral-950/80 px-2 py-0.5 font-mono text-[11px] text-white backdrop-blur">
                              +{photoCount - 1}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {/* Dashed divider between rows (after every row except the last) */}
              {row < Math.ceil(filteredItems.length / cols) - 1 && (
                <div
                  key={`divider-${row}`}
                  className="border-t border-dashed border-neutral-300 dark:border-neutral-700"
                />
              )}
                </>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen viewer overlay — opens from clicking any card image. Uses
          the shared Google-Maps ImageViewer (wheel-zoom, drag-pan, on-image
          arrows + download). Cycles across gallery items via onPrevSet/onNextSet.
          While open: body scroll is locked and wheel/touch are swallowed on the
          backdrop, so the page behind never scrolls; the backdrop uses a light
          blur so the media pops instead of sitting on solid black. */}
      {activeItem && (
        <ScrollLock />
      )}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md sm:p-10"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              aria-label="Close fullscreen view"
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-neutral-200 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div
              className="m-auto flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <ImageViewer
                key={activeItem._id}
                images={activeImages}
                index={lbImageIdx}
                onIndexChange={moveToImage}
                itemId={activeItem._id}
                itemTitle={activeItem.title}
                title={activeItem.title}
                caption={activeItem.description}
                onPrevSet={() => {
                  setLbImageIdx(0);
                  setLightboxIndex(
                    (i) => (i - 1 + filteredItems.length) % filteredItems.length
                  );
                }}
                onNextSet={() => {
                  setLbImageIdx(0);
                  setLightboxIndex((i) => (i + 1) % filteredItems.length);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};
export default Gallery;
