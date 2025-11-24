// src/renderer/src/components/CachedImage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { enhancedImageCache } from '../utils/imageCache';


interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

const CachedImage: React.FC<CachedImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallback,
  onLoad,
  onError 
}) => {
  const [imageUrl, setImageUrl] = useState<string>(src);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!src) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        
        // Get cached image URL
        const cachedUrl = await enhancedImageCache.cacheImage(src);
        
        if (isMounted) {
          setImageUrl(cachedUrl);
          setLoading(false);
          onLoad?.();
        }
      } catch (err) {
        console.warn('Failed to load image:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
          onError?.();
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [src, onLoad, onError]);

  if (error || !src) {
    return (
      <div className={`cached-image-fallback ${className}`}>
        {fallback || (
          <div className="image-placeholder">
            <Package size={24} />
            <span>No Image</span>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`cached-image-loading ${className}`}>
        <div className="image-spinner" />
      </div>
    );
  }

  return (
    <motion.img
      src={imageUrl}
      alt={alt}
      className={`cached-image ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      onLoad={() => {
        setLoading(false);
        onLoad?.();
      }}
      onError={() => {
        setError(true);
        setLoading(false);
        onError?.();
      }}
    />
  );
};

export default CachedImage;