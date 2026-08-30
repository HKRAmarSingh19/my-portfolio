import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, Check, Sparkles, Images, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Upload, Video, Play, Star, Crop as CropIcon } from 'lucide-react';
import { galleryApi, uploadApi } from '../../api/client';
import SEO from '../../components/common/SEO';
import ImageCropModal from '../../components/common/ImageCropModal';

const emptyItem = {
  title: '',
  image: '',
  images: [],
  video: '',
  category: 'Personal',
  description: '',
  featured: false,
  order: 0,
};

export const ManageGallery = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(emptyItem);
  const [feedback, setFeedback] = useState(null);

  const [pickedFiles, setPickedFiles] = useState([]); // File[]
  const [previewUrls, setPreviewUrls] = useState([]); // object-URL thumbnails
  const [uploadError, setUploadError] = useState(null);
  // Optional video file added alongside the photos (a single uploaded video
  // displayed after them). Same pick-on-submit flow as images.
  const [videoFile, setVideoFile] = useState(null); // File | null
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(''); // object-URL preview
  const videoInputRef = useRef(null);
  // Live video-upload telemetry, set while a picked video is streaming to S3:
  // { percent, loaded, total, elapsed, speed, done }. null = idle.
  const [videoUpload, setVideoUpload] = useState(null);
  // Rolling window for the smoothed instantaneous upload speed (MB/s).
  const speedWindowRef = useRef([]); // [{ loaded, ts }]
  // Rolls up the live server→S3 leg: holder for the poll interval id while a
  // video streams up to S3, plus pre-video state we need in the UI.
  const s3PollRef = useRef(null); // setInterval id | null

  // Format bytes as a readable size (MB/GB).
  const fmtBytes = (n) => {
    if (!Number.isFinite(n) || n < 0) return '0 MB';
    const mb = n / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  // Format milliseconds as m:ss (or h:mm:ss if >= 1h).
  const fmtElapsed = (ms) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (x) => String(x).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
  };
  // Which newly-picked image is currently being zoom/cropped, or null.
  // `aspect` mirrors the crop box used: 1:1 for the main cover (matches the
  // square grid), a wider 3:4 for the rest — never asymmetric/free, since the
  // cropper only supports a fixed box. Existing saved images come as URLs and
  // keep their original framing (only new picks are croppable).
  const [cropTarget, setCropTarget] = useState(null); // { index, aspect } | null
  const fileInputRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminGallery'],
    queryFn: () => galleryApi.getAll({}),
  });

  const items = data?.data?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['adminGallery'] });
    queryClient.invalidateQueries({ queryKey: ['gallery'] });
  };

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const createMutation = useMutation({
    mutationFn: (newItem) => galleryApi.create(newItem),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      setFormState(emptyItem);
      resetPicked();
      showFeedback('Image added to gallery');
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message;
      setUploadError(msg || 'Could not save the gallery item.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedItem }) => galleryApi.update(id, updatedItem),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      setEditingId(null);
      setFormState(emptyItem);
      resetPicked();
      showFeedback('Gallery item updated');
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message;
      setUploadError(msg || 'Could not save the gallery item.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => galleryApi.delete(id),
    onSuccess: () => {
      invalidate();
      showFeedback('Gallery item deleted');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, order }) => galleryApi.update(id, { order }),
    onSuccess: () => {
      invalidate();
      showFeedback('Order updated');
    },
  });

  const resetPicked = () => {
    setPickedFiles([]);
    setPreviewUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setVideoFile(null);
    setVideoPreviewUrl('');
    setVideoUpload(null);
    speedWindowRef.current = [];
    if (s3PollRef.current) {
      clearInterval(s3PollRef.current);
      s3PollRef.current = null;
    }
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormState({ ...emptyItem, order: items.length + 1 });
    resetPicked();
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    // The ordered list of existing images. Legacy/single-image items may only
    // have `image`, so normalise it into the list (index 0 is the main cover).
    const existing = item.images?.length
      ? [...item.images]
      : item.image
      ? [item.image]
      : [];
    setFormState({
      title: item.title || '',
      image: existing[0] || item.image || '',
      images: existing,
      video: item.video || '',
      category: item.category || 'Personal',
      description: item.description || '',
      featured: !!item.featured,
      order: item.order || 0,
    });
    resetPicked();
    setModalOpen(true);
  };

  const handlePickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setUploadError(null);
    if (!files.length) return;
    // Show local previews immediately; the actual upload happens on submit so
    // abandoning the form never leaves orphaned files on the server.
    setPickedFiles((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  // Pick a single optional video (mixed with the photos). Replacing a previous
  // pick revokes the old object-URL so no preview leaks.
  const handlePickVideo = (e) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;
    setVideoFile(file);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  // The zoom/crop modal replaces the picked File at `cropTarget.index` with
  // the newly cropped file, so the preview updates and the upload on submit
  // sends the framed version.
  const applyCrop = (file) => {
    const index = cropTarget?.index;
    setCropTarget(null);
    if (!file || index == null) return;
    const url = URL.createObjectURL(file);
    setPreviewUrls((prev) => {
      const nextUrls = [...prev];
      URL.revokeObjectURL(nextUrls[index]);
      nextUrls[index] = url;
      return nextUrls;
    });
    setPickedFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  };

  // Unified preview list: existing saved images first (index 0 = main/cover),
  // then newly-picked local files. Each entry is tagged by origin so we can
  // write reorder/remove changes back to the right source.
  const mergedPreviews = [
    ...(formState.images || []).map((url) => ({ id: `ex-${url}`, url, isNew: false })),
    ...previewUrls.map((url) => ({ id: `new-${url}`, url, isNew: true })),
  ];

  // Write an ordered list of preview entries back to both state sources:
  // existing URLs → formState.images (and formState.image = cover), new object
  // URLs → previewUrls with pickedFiles aligned to the same order.
  const resyncFromMerged = (merged) => {
    const existing = merged.filter((m) => !m.isNew).map((m) => m.url);
    const newUrls = merged.filter((m) => m.isNew).map((m) => m.url);

    setFormState((p) => ({ ...p, images: existing, image: existing[0] ?? p.image }));
    // Revoke object URLs that are no longer in the list.
    previewUrls.forEach((u) => {
      if (!newUrls.includes(u)) URL.revokeObjectURL(u);
    });
    setPreviewUrls(newUrls);
    setPickedFiles((files) => newUrls.map((u) => files[previewUrls.indexOf(u)]).filter(Boolean));
  };

  const handleRemovePreview = (index) => {
    resyncFromMerged(mergedPreviews.filter((_, i) => i !== index));
  };

  const handleMovePreview = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= mergedPreviews.length) return;
    const merged = [...mergedPreviews];
    const [moved] = merged.splice(index, 1);
    merged.splice(target, 0, moved);
    resyncFromMerged(merged);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError(null);

    try {
    // Build the final ordered list from the unified preview: existing saved URLs
    // stay as-is, newly-picked files are uploaded and swapped in at their place.
    let images = mergedPreviews.map((m) => m.url);

    if (pickedFiles.length) {
      const formData = new FormData();
      pickedFiles.forEach((f) => formData.append('images', f));
      const { data: uploaded } = await uploadApi.uploadImages(formData);
      if (!uploaded?.urls?.length) {
        setUploadError('The server did not return any image URLs.');
        return;
      }
      // pickedFiles/previewUrls are aligned, so the uploaded URLs map 1:1 onto
      // the isNew entries in merged order.
      let j = 0;
      images = mergedPreviews.map((m) => (m.isNew ? uploaded.urls[j++] : m.url));
    }

    const image = images[0] || formState.image;

    // Upload the optional picked video (once) and attach its URL. Existing saved
    // videos come back as plain URLs on edit and are sent straight through.
    let video = formState.video || '';
    if (videoFile) {
      // Live upload progress: track loaded/total, elapsed, and a smoothed speed
      // so the admin sees the video streaming to S3 instead of a frozen button.
      const startTs = Date.now();
      speedWindowRef.current = [];
      setVideoUpload({
        percent: 0, loaded: 0, total: videoFile.size, elapsed: 0, speed: 0,
        s3Started: false, s3Percent: 0, s3Loaded: 0, s3Total: 0, s3Speed: 0,
        done: false,
      });

      const onUploadProgress = (e) => {
        const now = Date.now();
        const loaded = e.loaded || 0;
        const total = e.total || videoFile.size;
        const elapsed = now - startTs;

        // Instantaneous speed from consecutive deltas, smoothed over a small
        // window to avoid jitter from the progress ticks.
        const win = speedWindowRef.current;
        win.push({ loaded, ts: now });
        while (win.length > 0 && now - win[0].ts > 2000) win.shift();
        const speed =
          win.length >= 2 && win[win.length - 1].ts !== win[0].ts
            ? ((win[win.length - 1].loaded - win[0].loaded) /
                (win[win.length - 1].ts - win[0].ts)) *
              (1000 / (1024 * 1024))
            : 0;

        setVideoUpload((prev) => ({
          ...prev,
          percent: total > 0 ? Math.min(100, (loaded / total) * 100) : 0,
          loaded,
          total,
          elapsed,
          speed,
          done: false,
        }));
      };

      const videoFormData = new FormData();
      // Client-generated id for live server→S3 progress. Append BEFORE the file
      // so busboy parses it first — the server's streaming storage reads
      // req.body.uploadId while the file is still streaming in.
      const uploadId = crypto.randomUUID();
      videoFormData.append('uploadId', uploadId);
      videoFormData.append('video', videoFile);

      // Rolling window for the S3 leg's smoothed speed.
      const s3SpeedWindow = [];
      const pollS3Progress = async () => {
        try {
          const { data: res } = await uploadApi.getVideoProgress(uploadId);
          const p = res?.progress;
          if (!p) return; // nothing in flight yet — keep the S3 bar hidden
          const now = Date.now();
          const loaded = p.loaded || 0;
          s3SpeedWindow.push({ loaded, ts: now });
          while (s3SpeedWindow.length > 0 && now - s3SpeedWindow[0].ts > 2000) s3SpeedWindow.shift();
          const speed =
            s3SpeedWindow.length >= 2 && s3SpeedWindow[s3SpeedWindow.length - 1].ts !== s3SpeedWindow[0].ts
              ? ((s3SpeedWindow[s3SpeedWindow.length - 1].loaded - s3SpeedWindow[0].loaded) /
                  (s3SpeedWindow[s3SpeedWindow.length - 1].ts - s3SpeedWindow[0].ts)) *
                (1000 / (1024 * 1024))
              : 0;
          // The server streams the file and reports only loaded bytes (it
          // can't know the total up front), so pace the S3 % off the size we
          // already know from the picked file.
          const total = videoFile.size;
          setVideoUpload((prev) => ({
            ...prev,
            s3Started: true,
            s3Percent: total > 0 ? Math.min(100, (loaded / total) * 100) : 0,
            s3Loaded: loaded,
            s3Total: total,
            s3Speed: speed,
          }));
        } catch {
          // A failed progress poll shouldn't abort the upload itself.
        }
      };

      // Start polling the S3 leg ~2/sec; stopped once the POST settles below.
      s3PollRef.current = setInterval(pollS3Progress, 500);

      try {
        const { data: uploadedVideo } = await uploadApi.uploadVideo(videoFormData, onUploadProgress);
        // The upload streamed and the server returned — mark the panel complete
        // only once the request actually succeeded (onUploadProgress hitting 100%
        // alone is not enough; the server may still reject/fail after the body).
        setVideoUpload((prev) => (prev ? { ...prev, percent: 100, done: true } : prev));
        if (uploadedVideo?.url) {
          video = uploadedVideo.url;
        } else {
          setUploadError('The server did not return a video URL.');
          return;
        }
      } finally {
        if (s3PollRef.current) {
          clearInterval(s3PollRef.current);
          s3PollRef.current = null;
        }
      }
    }

    const payload = {
      ...formState,
      image,
      images,
      video,
      featured: !!formState.featured,
      order: Number(formState.order) || 0,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, updatedItem: payload });
    } else {
      createMutation.mutate(payload);
    }
    } catch (err) {
      // Convert any upload error (S3, size-limit, network) into the visible red
      // inline error instead of leaving the modal frozen on a full progress bar.
      const msg =
        err?.response?.data?.message ||
        (err?.code === 'ERR_NETWORK' ? 'Network error while uploading — check your connection and try again.' : err?.message);
      setVideoUpload(null);
      setUploadError(msg || 'Upload failed.');
    }
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const move = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    reorderMutation.mutate({ id: a._id, order: b.order });
    reorderMutation.mutate({ id: b._id, order: a.order });
  };

  return (
    <div className="space-y-6">
      <SEO title="Manage Gallery | Admin" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">Content Management</span>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white mt-1">
            Manage Gallery
          </h1>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-neutral-950 font-semibold text-xs hover:bg-neutral-200 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Image</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono">
          ✓ {feedback}
        </div>
      )}

      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-neutral-400">Loading gallery...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 space-y-2">
            <Images className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="text-sm">No images in the gallery yet. Add your first one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950/80 uppercase text-[11px] font-mono text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="p-4">Image</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Featured</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {items.map((item, index) => (
                  <tr key={item._id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="p-4">
                      {/* Video-only items have no photo — show a dark placeholder
                          with the play badge instead of a broken image. */}
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          className="h-14 w-16 rounded-lg object-cover bg-neutral-800"
                        />
                      ) : item.video ? (
                        <span className="relative grid h-14 w-16 place-items-center rounded-lg bg-neutral-800">
                          <Play className="h-5 w-5 text-neutral-400" />
                        </span>
                      ) : (
                        <span className="grid h-14 w-16 place-items-center rounded-lg bg-neutral-800 text-[9px] text-neutral-600">
                          —
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white text-sm">{item.title}</div>
                      {item.description && (
                        <div className="text-neutral-500 text-[11px] line-clamp-1 max-w-xs">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-mono text-neutral-400">
                      <span className="px-2 py-0.5 rounded bg-neutral-800">{item.category}</span>
                    </td>
                    <td className="p-4 text-center">
                      {item.featured ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                          <Sparkles className="w-3 h-3" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-neutral-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="flex flex-col mr-1">
                          <button
                            onClick={() => move(index, -1)}
                            disabled={index === 0}
                            className="p-1 text-neutral-500 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-500"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => move(index, 1)}
                            disabled={index === items.length - 1}
                            className="p-1 text-neutral-500 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-500"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id, item.title)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-sans font-bold text-white">
                {editingId ? 'Edit Image' : 'Add New Image'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Image Title *
                </label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="e.g. Alpine Sunrise"
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Images <span className="text-neutral-600">(optional — a video alone is fine)</span>
                </label>

                {/* Upload from device (computer or mobile gallery/camera). The
                    hidden input is triggered by the styled button and files are
                    uploaded on submit (never abandoned orphans). `multiple`
                    lets the admin pick several images at once. */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePickFiles}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-950/50 px-4 py-6 text-neutral-400 transition-colors hover:border-indigo-500 hover:text-indigo-400"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-medium text-neutral-200">
                    {pickedFiles.length
                      ? `${pickedFiles.length} file${pickedFiles.length > 1 ? 's' : ''} selected`
                      : 'Upload images (optional — or attach just a video below)'}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    JPEG · PNG · WebP · up to 5 MB each
                  </span>
                </button>

                {/* Unified multi-image preview: first image is the main/cover
                    (large, with a badge), the rest are a thumbnail strip. Each
                    image can be removed (X) or reordered (arrows) to change
                    which one becomes the main cover. */}
                {mergedPreviews.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {/* Main cover image */}
                    <div className="relative overflow-hidden rounded-xl border border-neutral-700 bg-neutral-800">
                      <img
                        src={mergedPreviews[0].url}
                        alt="Main image"
                        className="aspect-square w-full object-cover"
                      />
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-400">
                        <Sparkles className="h-3 w-3" /> Main
                      </span>
                      <div className="absolute right-2 top-2 flex gap-1">
                        {mergedPreviews[0].isNew && (
                          <button
                            type="button"
                            onClick={() =>
                              setCropTarget({
                                index: previewUrls.indexOf(mergedPreviews[0].url),
                                aspect: 1, // main cover → square, matches the grid
                              })
                            }
                            title="Zoom & crop this image"
                            className="grid h-7 w-7 place-items-center rounded-lg bg-black/70 text-neutral-200 transition-colors hover:bg-indigo-500 hover:text-white"
                          >
                            <CropIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {mergedPreviews.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleMovePreview(0, 1)}
                            title="Move to next position"
                            className="grid h-7 w-7 place-items-center rounded-lg bg-black/70 text-neutral-200 transition-colors hover:bg-black hover:text-white"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePreview(0)}
                          title="Remove image"
                          className="grid h-7 w-7 place-items-center rounded-lg bg-black/70 text-neutral-200 transition-colors hover:bg-red-500 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Remaining images as a thumbnail strip with reorder + remove */}
                    {mergedPreviews.length > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {mergedPreviews.slice(1).map((m, i) => {
                          const idx = i + 1;
                          return (
                            <div key={m.id} className="relative">
                              <img
                                src={m.url}
                                alt={`Preview ${idx + 1}`}
                                className="h-16 w-16 rounded-lg border border-neutral-700 bg-neutral-800 object-cover"
                              />
                              {/* Reorder: move earlier (toward main) / later */}
                              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 rounded-b-lg bg-black/60 p-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleMovePreview(idx, -1)}
                                  title="Move forward one"
                                  className="grid h-5 w-5 place-items-center rounded text-neutral-200 transition-colors hover:text-white"
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMovePreview(idx, 1)}
                                  title="Move backward one"
                                  className="grid h-5 w-5 place-items-center rounded text-neutral-200 transition-colors hover:text-white"
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              </div>
                              {/* Set this photo as the main cover (moves it to the front) */}
                              {!m.isNew && (
                                <button
                                  type="button"
                                  onClick={() => handleMovePreview(idx, -idx)}
                                  title="Make this the main image"
                                  className="absolute left-0.5 top-0.5 grid h-6 w-6 place-items-center rounded-md bg-black/60 text-neutral-300 transition-colors hover:bg-amber-500 hover:text-black"
                                >
                                  <Star className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {/* Zoom & crop a newly-picked photo at pick time */}
                              {m.isNew && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCropTarget({
                                      index: previewUrls.indexOf(m.url),
                                      aspect: 3 / 4, // non-main photo: natural-ish frame
                                    })
                                  }
                                  title="Zoom & crop this image"
                                  className="absolute left-0.5 top-0.5 grid h-6 w-6 place-items-center rounded-md bg-black/60 text-neutral-300 transition-colors hover:bg-indigo-500 hover:text-white"
                                >
                                  <CropIcon className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {/* Remove */}
                              <button
                                type="button"
                                onClick={() => handleRemovePreview(idx)}
                                title="Remove image"
                                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-neutral-800 text-neutral-300 transition-colors hover:bg-red-500 hover:text-white"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <p className="text-[11px] font-mono text-neutral-500">
                      {mergedPreviews.length} image{mergedPreviews.length > 1 ? 's' : ''} — the first is the main
                      cover. Use the arrows to reorder, star to make a photo the main cover, or X to remove. New picks are uploaded when you save.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 my-2">
                  <span className="h-px flex-1 bg-neutral-800" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">or paste a URL</span>
                  <span className="h-px flex-1 bg-neutral-800" />
                </div>

                <input
                  type="text"
                  value={pickedFiles.length ? '' : formState.image}
                  onChange={(e) => setFormState({ ...formState, image: e.target.value })}
                  placeholder="https://... or /uploads/..."
                  disabled={pickedFiles.length > 0}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                />
                {uploadError && (
                  <p className="mt-1.5 text-[11px] font-mono text-red-400">{uploadError}</p>
                )}
              </div>

              {/* Video (optional) — a single video mixed into this item's
                  collection, shown after the photos. Picked on submit like the
                  images; automatically plays when opened in the viewer. */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" /> Video <span className="text-neutral-600">(optional)</span>
                  </span>
                </label>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/mov,video/m4v,video/ogg,.mp4,.webm,.mov,.m4v,.ogg"
                  onChange={handlePickVideo}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-950/50 px-4 py-4 text-neutral-400 transition-colors hover:border-indigo-500 hover:text-indigo-400"
                >
                  <Video className="w-5 h-5" />
                  <span className="text-xs font-medium text-neutral-200">
                    {videoFile || formState.video
                      ? 'Change video'
                      : 'Attach a video (plays with the photos)'}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    MP4 · WebM · MOV · up to 500 MB
                  </span>
                </button>

                {(videoFile || formState.video) && (
                  <div className="mt-3 relative overflow-hidden rounded-xl border border-neutral-700 bg-neutral-800">
                    <video
                      src={videoFile ? videoPreviewUrl : formState.video}
                      controls
                      preload="metadata"
                      className="w-full max-h-60 object-contain bg-neutral-950"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (videoFile) URL.revokeObjectURL(videoPreviewUrl);
                        setVideoFile(null);
                        setVideoPreviewUrl('');
                        setFormState((p) => ({ ...p, video: '' }));
                      }}
                      title="Remove video"
                      className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-black/70 text-neutral-200 transition-colors hover:bg-red-500 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Live video-upload progress. The backend runs locally, so the
                    browser→server leg is near-instant; what actually takes time is
                    the server→S3 leg. Show ONLY that S3 bar (with a brief
                    "preparing" state before it kicks in). */}
                {videoUpload && (
                  <div className="mt-3 rounded-xl border border-neutral-700 bg-neutral-950/60 p-4">
                    {videoUpload.done ? (
                      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300">
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          Upload complete
                        </span>
                      </div>
                    ) : videoUpload.s3Started ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300">
                          <span className="inline-flex items-center gap-1.5">
                            <Upload className="h-3.5 w-3.5 text-emerald-400" />
                            Uploading to S3… {Math.round(videoUpload.s3Percent)}%
                          </span>
                          <span className="text-neutral-400">
                            {fmtBytes(videoUpload.s3Loaded)} / {fmtBytes(videoUpload.s3Total || videoUpload.total)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-[width] duration-150"
                            style={{ width: `${videoUpload.s3Percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                          <span>{videoUpload.s3Speed > 0 ? `${videoUpload.s3Speed.toFixed(1)} MB/s` : '…'}</span>
                          <span>elapsed {fmtElapsed(videoUpload.elapsed)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                        <Video className="h-3.5 w-3.5 text-indigo-400" />
                        Uploading video… preparing
                      </div>
                    )}
                  </div>
                )}
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    placeholder="Travel, Workspace, Personal..."
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-end justify-between gap-4">
                  <label className="flex items-center gap-2 text-xs font-mono text-neutral-300 cursor-pointer pb-2.5">
                    <input
                      type="checkbox"
                      checked={formState.featured}
                      onChange={(e) => setFormState({ ...formState, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-500 bg-neutral-950 border-neutral-800 focus:ring-0"
                    />
                    <span>Featured</span>
                  </label>
                  <div className="w-20">
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Order
                    </label>
                    <input
                      type="number"
                      value={formState.order}
                      onChange={(e) => setFormState({ ...formState, order: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Caption / Description
                </label>
                <textarea
                  rows={3}
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  placeholder="Optional short caption for this image..."
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-y"
                />
              </div>

              {!previewUrls.length && formState.image && (
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Preview
                  </label>
                  <img
                    src={formState.image}
                    alt="Preview"
                    className="h-40 w-full rounded-xl object-cover bg-neutral-800"
                    onError={(e) => { e.currentTarget.style.opacity = 0.25; }}
                  />
                </div>
              )}

              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2.5 bg-white text-neutral-950 font-semibold text-xs rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {editingId ? 'Save Changes' : 'Add Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zoom/crop a just-picked image (replaces the file in the upload list) */}
      <ImageCropModal
        open={!!cropTarget}
        image={cropTarget ? previewUrls[cropTarget.index] : undefined}
        aspect={cropTarget?.aspect}
        title={formState.title || 'image'}
        onClose={() => setCropTarget(null)}
        onApply={applyCrop}
      />
    </div>
  );
};
export default ManageGallery;
