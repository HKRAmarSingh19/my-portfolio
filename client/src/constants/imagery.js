/**
 * Curated stock photography used across the public site as subtle background
 * and hero/side imagery. All images are direct Unsplash CDN links (stable
 * images.unsplash.com URLs, not the deprecated source.unsplash.com redirects).
 *
 * Every image is applied heavily veiled — grayscale, faded, and often masked —
 * so the site stays editorial and readable: the photos read as texture and
 * atmosphere, not as content competing with the text.
 *
 * To retire an image, replace the URL here and nothing downstream changes.
 */
export const IMAGERY = {
  // Site-wide ambient backdrop, faded to near-transparency in AmbientBackground.
  // A dim workspace / code scene that reads as "developer" without being loud.
  AMBIENT: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2000&q=60',

  // Hero / side accents, themed per page area.
  CODE: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=60',
  ARCH: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=60',
  TERMINAL: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=60',
  WORKSPACE: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=60',
  NETWORK: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=60',
  MINIMAL: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=60',
};
