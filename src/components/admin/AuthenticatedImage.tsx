import { useEffect, useState } from 'react';
import { getToken } from '../../utils/auth';

/**
 * Displays a protected image from /uploads/... that requires an admin token.
 * Uses fetch() + Blob URL instead of a plain <img src> so the Authorization
 * header can be included — browser <img> tags cannot send custom headers.
 * The Blob URL is revoked on unmount to prevent memory leaks.
 */
interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function AuthenticatedImage({ src, alt, className }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) return;

    let objectUrl: string | null = null;
    const token = getToken();

    let fetchUrl = src;
    if (fetchUrl.startsWith('/uploads/')) {
      fetchUrl = `/api${fetchUrl}`;
    }

    fetch(fetchUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => setHasError(true));

    // Cleanup: revoke the Blob URL when the component unmounts or src changes
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (hasError || !blobUrl) {
    // Render a placeholder while loading or if the fetch failed
    return (
      <div className={`bg-surface-variant/30 flex items-center justify-center ${className}`}>
        <span className="text-[9px] font-bold uppercase tracking-widest text-primary/20">
          {hasError ? 'Unavailable' : 'Loading...'}
        </span>
      </div>
    );
  }

  return <img src={blobUrl} alt={alt} className={className} />;
}
