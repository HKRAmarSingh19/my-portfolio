import React, { useEffect, useState, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Check, Crop } from 'lucide-react';

/**
 * Modal that lets the admin zoom + pan + drag to frame an image, then exports
 * the visible framed area as a new file — a zoom-crop-at-pick-time tool for
 * gallery items.
 *
 * The crop box is a fixed frame; the admin zooms/pans the image behind it and
 * the visible area (at `aspect`) is exported. react-easy-crop only supports a
 * *fixed* crop box (no asymmetric/free box resizing), so "free framing" here
 * means picking the ratio per use: 1:1 for the main cover (matches the square
 * gallery grid), anything else (e.g. 3:4) for the remaining photos.
 *
 * Props:
 *  - open: boolean
 *  - image: the image URL/objectURL to crop
 *  - title: label shown in the header / used for the exported filename
 *  - aspect: number crop box ratio (width/height). Default 3:4.
 *  - onClose(): cancel — no change
 *  - onApply(file): called with the cropped File when the admin clicks "Apply"
 */
const DEFAULT_ASPECT = 3 / 4;

export const ImageCropModal = ({ open, image, title = 'Image', aspect = DEFAULT_ASPECT, onClose, onApply }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  // When opening / switching image, reset everything.
  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
    }
  }, [open, image]);

  // Free-aspect crop: export whatever rectangle the admin leaves framed.
  const onCropComplete = (_area, pixels) => setCroppedAreaPixels(pixels);

  // Draw the framed area onto a canvas and export it as a JPEG blob.
  const exportCrop = async () => {
    if (!croppedAreaPixels) return false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = image;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });
    const { x, y, width, height } = croppedAreaPixels;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (rotation) {
      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-width / 2, -height / 2);
    }
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
    return new Promise((res) => canvas.toBlob((b) => res(b), 'image/jpeg', 0.92));
  };

  const handleApply = async () => {
    setProcessing(true);
    try {
      const blob = await exportCrop();
      if (!blob) return onApply(null);
      const clean = (title || 'image').replace(/[^\w\- ]+/g, '').trim() || 'image';
      const file = new File([blob], `${clean}-framed.jpg`, { type: 'image/jpeg' });
      onApply(file);
    } catch {
      // Fall back to the original pick so a canvas failure never blocks saving.
      onApply(null);
    } finally {
      setProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-3xl flex-col rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3">
          <div className="flex items-center gap-2">
            <Crop className="h-4 w-4 text-indigo-400" />
            <span className="font-mono text-xs uppercase tracking-wider text-neutral-300">
              Zoom &amp; Crop — {title}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close crop"
            className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cropper: full-bleed free crop. Zoom/pan the image behind the box. */}
        <div className="relative h-[50vh] overflow-hidden bg-neutral-950">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            minZoom={1}
            maxZoom={5}
            objectFit="contain"
            cropShape="rect"
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            restrictPosition
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 border-t border-neutral-800 px-5 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
              className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-800 text-neutral-200 transition-colors hover:bg-neutral-700"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="w-20 text-center font-mono text-[11px] text-neutral-400">
              {zoom.toFixed(1)}×
            </div>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(5, +(z + 0.1).toFixed(2)))}
              className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-800 text-neutral-200 transition-colors hover:bg-neutral-700"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-neutral-800 px-4 py-2 text-xs font-mono text-neutral-300 transition-colors hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={processing || !croppedAreaPixels}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
            {processing ? 'Applying…' : 'Apply crop'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;