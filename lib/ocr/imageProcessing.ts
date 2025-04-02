/**
 * Image preprocessing for OCR
 */
import { ImagePreprocessingOptions } from '@/types/ocr';

/**
 * Preprocess image for better OCR results
 */
export async function preprocessImage(
  imageData: string,
  options: ImagePreprocessingOptions = {}
): Promise<string> {
  // Default options
  const {
    resize = true,
    maxWidth = 1200,
    maxHeight = 1200,
    grayscale = true,
    contrast = 1.3,
    brightness = 1.1,
    threshold = false,
    thresholdValue = 128,
    denoise = false,
    deskew = false
  } = options;
  
  // Create canvas and context for image processing
  const image = await loadImage(imageData);
  let width = image.width;
  let height = image.height;
  
  // Resize if needed for better performance
  if (resize && (width > maxWidth || height > maxHeight)) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Draw the image on the canvas
  ctx.drawImage(image, 0, 0, width, height);
  
  // Apply transformations
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;
  
  // Convert to grayscale
  if (grayscale) {
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg; // R
      data[i + 1] = avg; // G
      data[i + 2] = avg; // B
    }
  }
  
  // Adjust brightness and contrast
  if (contrast !== 1 || brightness !== 1) {
    const factor = 259 * (contrast * 100 + 255) / (255 * (259 - contrast * 100));
    
    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness
      data[i] = data[i] * brightness;
      data[i + 1] = data[i + 1] * brightness;
      data[i + 2] = data[i + 2] * brightness;
      
      // Apply contrast
      data[i] = factor * (data[i] - 128) + 128;
      data[i + 1] = factor * (data[i + 1] - 128) + 128;
      data[i + 2] = factor * (data[i + 2] - 128) + 128;
    }
  }
  
  // Apply threshold for binarization
  if (threshold) {
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const value = avg < thresholdValue ? 0 : 255;
      data[i] = value; // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
    }
  }
  
  // Put image data back
  ctx.putImageData(imageData, 0, 0);
  
  // Return as data URL
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Load an image from a URL or data URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Crop an image to focus on text-heavy regions
 */
export async function cropToTextRegion(
  imageData: string
): Promise<string> {
  // TODO: Implement smart cropping to focus on text-heavy regions
  // This would require a more complex analysis of the image content
  // For now, we'll just return the original image
  return imageData;
}

/**
 * Deskew an image to straighten text
 * Note: This is a placeholder for future implementation
 */
export async function deskewImage(
  imageData: string
): Promise<string> {
  // TODO: Implement deskew algorithm to straighten text
  // This would require analyzing the image to detect skew angle
  // For now, we'll just return the original image
  return imageData;
}

export default {
  preprocessImage,
  cropToTextRegion,
  deskewImage
}; 