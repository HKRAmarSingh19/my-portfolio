import { useEffect } from 'react';

export const SEO = ({ title, description }) => {
  useEffect(() => {
    const defaultTitle = 'Amar Singh — Full-Stack Software Engineer';
    document.title = title ? `${title} | Amar Singh` : defaultTitle;
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', description);
    }
  }, [title, description]);
  return null;
};

export default SEO;
