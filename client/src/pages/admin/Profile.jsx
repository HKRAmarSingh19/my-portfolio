import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Save, RotateCcw, Loader2, AlertTriangle, Image as ImageIcon, Star, ChevronUp, ChevronDown, X, Eye, EyeOff } from 'lucide-react';
import { profileApi, uploadApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/common/SEO';
import ProfilePortrait, { FALLBACK_AVATAR } from '../../components/common/ProfilePortrait';

// Mirrors the limits enforced by server/middleware/upload.js.
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export const Profile = () => {
  const queryClient = useQueryClient();
  const { updateProfile } = useAuth();
  const fileInputRef = useRef(null);
  const imagesInputRef = useRef(null);

  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [pickedFile, setPickedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  // Multi-image "Profile photos" set: saved S3 URLs (ordered, index 0 = primary)
  // plus new local picks (object-URL previews aligned 1:1 with pickedFiles).
  const [images, setImages] = useState([]);
  const [featuredImages, setFeaturedImages] = useState([]);
  const [pickedFiles, setPickedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['publicProfile'],
    queryFn: () => profileApi.get(),
  });

  const profile = data?.data?.data;

  // Hydrate the form once server state arrives.
  useEffect(() => {
    if (!profile) return;
    setName(profile.name || '');
    setHeadline(profile.headline || '');
    setBio(profile.bio || '');
    setAvatar(profile.avatar || FALLBACK_AVATAR);
    setImages(profile.images || []);
    setFeaturedImages(profile.featuredImages || []);
  }, [profile]);

  // Cleanup runs when previewUrl changes, releasing the URL it replaced.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handlePick = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Choose a JPEG, PNG, WebP, GIF or SVG image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('That image is over the 5 MB limit. Try a smaller file.');
      return;
    }

    // Preview locally and defer the upload to save, so abandoning the change
    // does not leave an orphaned file on the server.
    setPickedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUseDefault = () => {
    setError(null);
    setPickedFile(null);
    setPreviewUrl(null);
    setAvatar(FALLBACK_AVATAR);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Profile-photos manager ──────────────────────────────────────────────
  // Mirrors ManageGallery's unified preview list (existing saved URLs + new
  // local picks), but leaner — no crop, no video, no paste-URL.

  const handlePickFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setError(null);

    // The server's upload.array('images', 10) caps one request at 10 files; keep
    // the session-plus-new total within it by parking the new picks to fill the
    // remaining room only.
    const savedRoom = 10 - pickedFiles.length;

    const valid = [];
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('One of the selected files is not a JPEG, PNG, WebP, GIF or SVG image.');
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError('One of the selected files is over the 5 MB limit. Try a smaller file.');
        continue;
      }
      if (valid.length < savedRoom) valid.push(file);
    }
    if (!valid.length) return;

    setPickedFiles((prev) => [...prev, ...valid]);
    setPreviewUrls((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
    if (imagesInputRef.current) imagesInputRef.current.value = '';
  };

  // Unified preview list: saved URLs first (index 0 = primary), then the new
  // local picks. Each entry is tagged by origin so reorder/remove writes back
  // to the right source.
  const mergedPreviews = [
    ...images.map((url) => ({ id: `ex-${url}`, url, isNew: false })),
    ...previewUrls.map((url) => ({ id: `new-${url}`, url, isNew: true })),
  ];

  // Write an ordered preview list back to both sources: existing URLs → images,
  // new object URLs → previewUrls (with pickedFiles realigned by index). Object
  // URLs that fall out of the list are revoked so no preview leaks.
  const resyncFromMerged = (merged) => {
    const existing = merged.filter((m) => !m.isNew).map((m) => m.url);
    const newUrls = merged.filter((m) => m.isNew).map((m) => m.url);

    setImages(existing);
    previewUrls.forEach((u) => {
      if (!newUrls.includes(u)) URL.revokeObjectURL(u);
    });
    setPreviewUrls(newUrls);
    setPickedFiles((files) => newUrls.map((u) => files[previewUrls.indexOf(u)]).filter(Boolean));
    // A photo that was removed must no longer be "featured" — drop any featured
    // URL that is no longer in the merged list.
    const urls = merged.map((m) => m.url);
    setFeaturedImages((prev) => prev.filter((u) => urls.includes(u)));
  };

  // Toggle whether a photo is "featured" — featured photos rotate on the
  // homepage hero carousel.
  const handleToggleFeatured = (index) => {
    const url = mergedPreviews[index]?.url;
    if (!url) return;
    setFeaturedImages((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleRemoveImage = (index) => {
    resyncFromMerged(mergedPreviews.filter((_, i) => i !== index));
  };

  const handleMoveImage = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= mergedPreviews.length) return;
    const merged = [...mergedPreviews];
    const [moved] = merged.splice(index, 1);
    merged.splice(target, 0, moved);
    resyncFromMerged(merged);
  };

  const handleMakePrimary = (index) => {
    if (index === 0) return;
    const merged = [...mergedPreviews];
    const [moved] = merged.splice(index, 1);
    merged.unshift(moved);
    resyncFromMerged(merged);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let nextAvatar = avatar;

      if (pickedFile) {
        const formData = new FormData();
        formData.append('image', pickedFile);
        const { data: uploaded } = await uploadApi.uploadImage(formData);
        if (!uploaded?.url) throw new Error('The server did not return an image URL.');
        nextAvatar = uploaded.url;
      }

      // Profile photos: upload the new picks (all in one request), then merge
      // them back into the ordered list at their preview positions.
      let nextImages = mergedPreviews.map((m) => m.url);
      if (pickedFiles.length) {
        const fd = new FormData();
        pickedFiles.forEach((f) => fd.append('images', f));
        const { data: uploaded } = await uploadApi.uploadImages(fd);
        if (!uploaded?.urls?.length) throw new Error('The server did not return any image URLs.');
        let j = 0;
        nextImages = mergedPreviews.map((m) => (m.isNew ? uploaded.urls[j++] : m.url));
      }

      // Featured order = current merged-list order; membership tested by the
      // ORIGINAL (pre-substitution) URL, so a new pick that was marked featured
      // lands in `nextFeaturedImages` as its uploaded S3 URL.
      const featuredSet = new Set(featuredImages);
      const nextFeaturedImages = nextImages.filter((url, i) =>
        featuredSet.has(mergedPreviews[i].url)
      );

      const { data: saved } = await profileApi.update({ name, headline, bio, avatar: nextAvatar, images: nextImages, featuredImages: nextFeaturedImages });
      return saved;
    },
    onSuccess: (saved) => {
      if (saved?.user) {
        setAvatar(saved.user.avatar || FALLBACK_AVATAR);
        setImages(saved.user.images || []);
        setFeaturedImages(saved.user.featuredImages || []);
        updateProfile(saved.user);
      }
      setPickedFile(null);
      setPreviewUrl(null);
      setPickedFiles([]);
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
      setPreviewUrls([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      queryClient.invalidateQueries({ queryKey: ['publicProfile'] });
      setFeedback('Saved — your profile and photos are up to date.');
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err) => {
      setError(err?.response?.data?.message || err.message || 'Could not save your profile.');
    },
  });

  // Set-based compare of the featured subset (order-insensitive) so toggling a
// photo off then back on doesn't leave a spurious "Unsaved changes" flag.
const featuredEqual = (a, b) =>
  a.length === b.length &&
  [...a].sort().join(' ') === [...b].sort().join(' ');

const isDirty =
    Boolean(pickedFile) ||
    JSON.stringify(images) !== JSON.stringify(profile?.images || []) ||
    !featuredEqual(featuredImages, profile?.featuredImages || []) ||
    pickedFiles.length > 0 ||
    name !== (profile?.name || '') ||
    headline !== (profile?.headline || '') ||
    bio !== (profile?.bio || '') ||
    avatar !== (profile?.avatar || '');

  const displayedSrc = previewUrl || avatar;
  const saving = saveMutation.isPending;

  return (
    <div className="space-y-6">
      <SEO title="Profile & Portrait | Admin" />

      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Site Identity
        </span>
        <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white mt-1">
          Profile &amp; Portrait
        </h1>
        <p className="text-xs text-neutral-400 mt-2 max-w-xl">
          This portrait is what visitors see first on the homepage. Replace it any time — the
          change goes live as soon as you save.
        </p>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono">
          ✓ {feedback}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center text-xs font-mono text-neutral-400">
          Loading profile...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Live preview — the same component the homepage renders. */}
          <div className="lg:col-span-2 space-y-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
              Homepage preview
            </span>
            <ProfilePortrait src={displayedSrc} name={name || 'Hkr. Amar Singh'} />
            <p className="font-mono text-[10px] text-neutral-500 break-all">
              {pickedFile ? `Pending upload — ${pickedFile.name}` : displayedSrc}
            </p>
          </div>

          <div className="lg:col-span-3 space-y-5 p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
            <div className="space-y-2">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                Portrait image
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={handlePick}
                className="sr-only"
                id="portrait-upload"
              />

              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="portrait-upload"
                  className="inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-neutral-950 font-semibold text-xs hover:bg-neutral-200 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose new photo</span>
                </label>

                <button
                  type="button"
                  onClick={handleUseDefault}
                  disabled={avatar === FALLBACK_AVATAR && !pickedFile}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 font-medium text-xs hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Use default photo</span>
                </button>
              </div>

              <p className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-500">
                <ImageIcon className="w-3 h-3" />
                JPEG, PNG, WebP, GIF or SVG · up to 5 MB · square images look best
              </p>
            </div>

            {/* ── Profile photos (multi-image set, storage only) ───────────── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                  Profile photos
                </label>
                <span className="font-mono text-[10px] text-neutral-500">
                  {mergedPreviews.length} {mergedPreviews.length === 1 ? 'photo' : 'photos'}
                </span>
              </div>

              <input
                ref={imagesInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES.join(',')}
                onChange={handlePickFiles}
                className="sr-only"
                id="profile-photos-upload"
              />

              <label
                htmlFor="profile-photos-upload"
                className="inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-200 font-medium text-xs hover:bg-neutral-800 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>{pickedFiles.length ? `${pickedFiles.length} selected` : 'Add photos'}</span>
              </label>

              <p className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-500">
                <ImageIcon className="w-3 h-3" />
                Upload several at once · the eye toggles which ones rotate on the homepage hero
              </p>

              {mergedPreviews.length === 0 ? (
                <p className="rounded-xl border border-dashed border-neutral-800 px-4 py-4 text-center font-mono text-[11px] text-neutral-500">
                  No profile photos yet. The homepage keeps using the portrait above.
                </p>
              ) : (
                <ul className="space-y-2">
                  {mergedPreviews.map((entry, index) => (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2"
                    >
                      <img
                        src={entry.url}
                        alt={`Profile photo ${index + 1}`}
                        loading="lazy"
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-neutral-200">
                          {entry.isNew ? 'New (pending upload)' : `Photo ${index + 1}`}
                        </p>
                        <span className="flex items-center gap-2">
                          {index === 0 && (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-indigo-400">
                              <Star className="h-2.5 w-2.5 fill-indigo-400" />
                              Primary
                            </span>
                          )}
                          {featuredImages.includes(entry.url) && (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-400">
                              <Eye className="h-2.5 w-2.5" />
                              Featured
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(index)}
                          title={featuredImages.includes(entry.url) ? 'Unfeature' : 'Feature (home hero carousel)'}
                          aria-label={
                            featuredImages.includes(entry.url)
                              ? `Unfeature photo ${index + 1}`
                              : `Feature photo ${index + 1}`
                          }
                          className={`grid h-7 w-7 place-items-center rounded-lg transition-colors hover:bg-neutral-800 ${
                            featuredImages.includes(entry.url)
                              ? 'text-amber-400 hover:text-amber-300'
                              : 'text-neutral-500 hover:text-neutral-200'
                          }`}
                        >
                          {featuredImages.includes(entry.url) ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMakePrimary(index)}
                          disabled={index === 0}
                          title="Make primary"
                          aria-label={`Make photo ${index + 1} primary`}
                          className="grid h-7 w-7 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveImage(index, -1)}
                          disabled={index === 0}
                          title="Move up"
                          aria-label={`Move photo ${index + 1} up`}
                          className="grid h-7 w-7 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveImage(index, 1)}
                          disabled={index === mergedPreviews.length - 1}
                          title="Move down"
                          aria-label={`Move photo ${index + 1} down`}
                          className="grid h-7 w-7 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          title="Remove"
                          aria-label={`Remove photo ${index + 1}`}
                          className="grid h-7 w-7 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="font-mono text-[10px] text-neutral-600">
                The first photo is the primary portrait; featured photos auto-rotate on the
                homepage hero. Removing a featured photo also clears it from the carousel on save.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="profile-name"
                className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400"
              >
                Display name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:border-indigo-500/60 focus:outline-none transition-colors"
                placeholder="Hkr. Amar Singh"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="profile-headline"
                className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400"
              >
                Role / headline
              </label>
              <input
                id="profile-headline"
                type="text"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:border-indigo-500/60 focus:outline-none transition-colors"
                placeholder="Full-Stack Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="profile-bio"
                className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400"
              >
                Short bio
              </label>
              <textarea
                id="profile-bio"
                rows={4}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:border-indigo-500/60 focus:outline-none transition-colors resize-y"
                placeholder="One or two sentences about what you build."
              />
            </div>

            <div className="flex items-center gap-3 pt-1 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={!isDirty || saving}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-neutral-950 font-semibold text-xs hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save changes'}</span>
              </button>

              {isDirty && !saving && (
                <span className="mt-4 font-mono text-[10px] text-amber-400">
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
