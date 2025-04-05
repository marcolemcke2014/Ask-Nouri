import { useState, useEffect, useRef, useCallback } from 'react';
import { startCamera, stopCamera, getOptimalDimensions } from '../lib/videoHelpers';

interface UseCameraFeedProps {
  autoStart?: boolean;
  facingMode?: 'environment' | 'user';
}

interface UseCameraFeedReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  error: string | null;
  startCameraFeed: () => Promise<void>;
  stopCameraFeed: () => void;
  isCameraActive: boolean;
  takePicture: () => string | null;
}

/**
 * Hook for managing camera feed in browser
 * Handles starting/stopping the stream and taking pictures
 */
export function useCameraFeed({
  autoStart = false,
  facingMode = 'environment'
}: UseCameraFeedProps = {}): UseCameraFeedReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // Start the camera feed
  const startCameraFeed = useCallback(async () => {
    if (streamRef.current) {
      console.log('Camera already active, stopping first');
      stopCameraFeed();
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access');
      }
      
      // Request camera stream
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve(true);
            };
          } else {
            resolve(false);
          }
        });
        
        // Start playing
        await videoRef.current.play();
        setIsCameraActive(true);
      } else {
        throw new Error('Video element not found');
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to access camera. Please check permissions and try again.'
      );
      setIsCameraActive(false);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode]);
  
  // Stop the camera feed
  const stopCameraFeed = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
  }, []);
  
  // Take a picture from the current video feed
  const takePicture = useCallback((): string | null => {
    if (!videoRef.current || !isCameraActive) {
      console.error('Cannot take picture: camera is not active');
      return null;
    }
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get the image as data URL
      return canvas.toDataURL('image/jpeg');
    } catch (err) {
      console.error('Error taking picture:', err);
      return null;
    }
  }, [isCameraActive]);
  
  // Start camera automatically if autoStart is true
  useEffect(() => {
    if (autoStart) {
      startCameraFeed();
    }
    
    // Clean up on unmount
    return () => {
      stopCameraFeed();
    };
  }, [autoStart, startCameraFeed, stopCameraFeed]);
  
  return {
    videoRef,
    containerRef,
    isLoading,
    error,
    startCameraFeed,
    stopCameraFeed,
    isCameraActive,
    takePicture
  };
} 