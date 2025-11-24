// src/renderer/src/hooks/useImagePreload.ts
import { useEffect } from 'react';
import { enhancedImageCache } from '../utils/imageCache';

// Define the Product interface locally or import it
interface Product {
  id number;
  barcode: number;
  expirationDate: string;
  price: string;
  category: string;
  quantity: number;
  name: string;
  stock: number;
  minStock: string;
  img: string;
  costPrice?: string;
}

export const useImagePreload = (imageUrls: string[]) => {
  useEffect(() => {
    if (imageUrls.length > 0) {
      // Preload images in the background
      enhancedImageCache.preloadImages(imageUrls).catch(console.warn);
    }
  }, [imageUrls]);
};

// Usage in your components:
export const useProductImagePreload = (products: Product[]) => {
  const imageUrls = products
    .map(product => product.img)
    .filter(Boolean) as string[];
  
  useImagePreload(imageUrls);
};