import { useEffect } from 'react';

export const SEO = ({ title, description }) => {
  useEffect(() => {
    const defaultTitle = 'Hkr Amar Singh - Full-Stack Developer';
    document.title = title ? `${title} | Hkr Amar Singh` : defaultTitle;
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', description);
    }
  }, [title, description]);
  return null;
};

export default SEO;
