import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Star, Share2, Check, Images, Play } from 'lucide-react';
import { galleryApi } from '../api/client';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';
import ImageViewer, { isVideoUrl } from '../components/common/ImageViewer';

export const GalleryItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imageIdx, setImageIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['galleryItem', id],
    queryFn: () => galleryApi.getById(id),
  });

  const item = data?.data?.data;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="pt-36 pb-20 max-w-4xl mx-auto px-4 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
        <div className="h-12 w-full bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        <div className="h-96 w-full bg-neutral-200 dark:bg-neutral-800 rounded-3xl" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="pt-36 pb-20 max-w-xl mx-auto px-4 text-center space-y-4">
        <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-white">
          Image Not Found
        </h2>
        <p className="text-neutral-500">
          The image you are looking for does not exist or has been removed.
        </p>
        <Link
          to="/gallery"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Gallery</span>
        </Link>
      </div>
    );
  }

  // Main image first, then the collection, de-duplicated. The optional video is
  // appended last so the item reads as "photos, then the video".
  const images = Array.from(new Set([item.image, ...(item.images || [])].filter(Boolean)));
  if (item.video) images.push(item.video);

  return (
    <PageTransition>
      <SEO title={item.title} description={item.description || item.category} />

      <article className="relative overflow-x-clip pt-28 sm:pt-36 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Anchors the top of the page, matching the other public routes. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] overflow-hidden"
        >
          <div className="absolute -top-32 left-0 h-[24rem] w-[24rem] rounded-full bg-indigo-500/[0.10] blur-3xl sm:left-10" />
          <div className="absolute -top-20 right-0 h-[18rem] w-[18rem] rounded-full bg-violet-500/[0.08] blur-3xl" />
        </div>

        <div className="relative flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-indigo-500 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to gallery</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors border border-neutral-200 dark:border-neutral-800"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-indigo-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied' : 'Share'}</span>
          </button>
        </div>

        <header className="relative space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-neutral-400">
            <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
              {item.category || 'Personal'}
            </span>
            {item.createdAt && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </>
            )}
            {item.featured && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-indigo-400">
                  <Star className="w-3.5 h-3.5 fill-indigo-400" /> Featured
                </span>
              </>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-bold text-neutral-900 dark:text-white tracking-tight leading-[1.15]">
            {item.title}
          </h1>
        </header>

        {/* The shared Google-Maps style viewer: wheel-zoom, drag-pan, on-image
            arrows + counter, and download. */}
        <motion.div
          key={imageIdx}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center rounded-3xl bg-neutral-950 p-2 shadow-lg"
        >
          <ImageViewer
            images={images}
            index={imageIdx}
            onIndexChange={setImageIdx}
            itemId={item._id}
            itemTitle={item.title}
            caption={item.description}
          />
        </motion.div>

        {/* Thumbnail strip for the collection — jump straight to any photo. */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {images.map((image, index) => {
              // Video thumbnails use the first photo as a poster; a video-only
              // item has no photo, so fall back to a dark placeholder.
              const thumbSrc = isVideoUrl(image)
                ? images.find((im) => !isVideoUrl(im)) || ''
                : image;
              return (
              <button
                key={image}
                onClick={() => setImageIdx(index)}
                aria-label={`View ${isVideoUrl(image) ? 'video' : 'photo'} ${index + 1}`}
                aria-current={index === imageIdx}
                className={`relative h-16 w-24 rounded-xl overflow-hidden border transition-all ${
                  index === imageIdx
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'border-neutral-200 dark:border-neutral-800 opacity-60 hover:opacity-100'
                }`}
              >
                {thumbSrc ? (
                  <img src={thumbSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="block h-full w-full bg-neutral-800" />
                )}
                {isVideoUrl(image) && (
                  <span className="absolute inset-0 grid place-items-center bg-black/45">
                    <Play className="h-5 w-5 text-white drop-shadow" />
                  </span>
                )}
              </button>
              );
            })}
          </div>
        )}

        <div className="relative pt-2 text-center">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2 font-mono text-xs text-neutral-600 dark:text-neutral-300 transition-colors hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <Images className="h-3.5 w-3.5" />
            <span>More Gallery</span>
          </Link>
        </div>
      </article>
    </PageTransition>
  );
};
export default GalleryItemDetail;