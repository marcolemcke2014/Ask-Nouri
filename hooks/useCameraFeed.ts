import { useState, useEffect, useRef } from 'react';
import { startCamera, stopCamera, getOptimalDimensions } from '../lib/videoHelpers';

interface CameraFeedState {
  stream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  isCameraActive: boolean;
}

/**
 * Hook to manage camera stream lifecycle
 * @param autostart - Whether to automatically start the camera when component mounts
 */
export const useCameraFeed = (autostart = true): CameraFeedState & {
  startCameraFeed: () => Promise<void>;
  stopCameraFeed: () => void;
  getVideoElement: () => HTMLVideoElement | null;
} => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  
  // Refs for the video element and container
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  /**
   * Start the camera feed
   */
  const startCameraFeed = async (): Promise<void> => {
    setError(null);
    setIsLoading(true);
    
    try {
      const cameraStream = await startCamera();
      setStream(cameraStream);
      setIsCameraActive(true);
      
      // Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = cameraStream;
        
        // When video metadata is loaded, handle resizing
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current && containerRef.current) {
            const { width, height } = getOptimalDimensions(
              cameraStream,
              containerRef.current.clientWidth,
              containerRef.current.clientHeight
            );
            
            videoRef.current.style.width = `${width}px`;
            videoRef.current.style.height = `${height}px`;
          }
        };
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start camera');
      console.error('Camera start error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Stop the camera feed and clean up
   */
  const stopCameraFeed = (): void => {
    stopCamera(stream);
    setStream(null);
    setIsCameraActive(false);
    
    // Clear video element source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };
  
  /**
   * Get the video element (useful for taking snapshots)
   */
  const getVideoElement = (): HTMLVideoElement | null => {
    return videoRef.current;
  };
  
  // Auto-start camera if enabled
  useEffect(() => {
    if (autostart) {
      startCameraFeed();
    }
    
    // Clean up on unmount
    return () => {
      stopCameraFeed();
    };
  }, []);
  
  return {
    stream,
    isLoading,
    error,
    videoRef,
    containerRef,
    isCameraActive,
    startCameraFeed,
    stopCameraFeed,
    getVideoElement
  };
}; 