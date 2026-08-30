import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Save, RotateCcw, Loader2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
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

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [pickedFile, setPickedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
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
    setBio(profile.bio || '');
    setAvatar(profile.avatar || FALLBACK_AVATAR);
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

      const { data: saved } = await profileApi.update({ name, bio, avatar: nextAvatar });
      return saved;
    },
    onSuccess: (saved) => {
      if (saved?.user) {
        setAvatar(saved.user.avatar || FALLBACK_AVATAR);
        updateProfile(saved.user);
      }
      setPickedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      queryClient.invalidateQueries({ queryKey: ['publicProfile'] });
      setFeedback('Saved — the homepage hero now shows this portrait.');
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err) => {
      setError(err?.response?.data?.message || err.message || 'Could not save your profile.');
    },
  });

  const isDirty =
    Boolean(pickedFile) ||
    name !== (profile?.name || '') ||
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
