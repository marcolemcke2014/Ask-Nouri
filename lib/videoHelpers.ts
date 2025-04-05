/**
 * Utility functions for handling video and camera feeds
 */

/**
 * Request camera access and return a video stream
 * @param facingMode - Which camera to use, default is 'environment' (rear camera)
 * @returns MediaStream for the requested camera
 */
export const startCamera = async (facingMode = 'environment'): Promise<MediaStream> => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Camera access is not supported in this browser');
  }

  try {
    // Request highest resolution possible for better OCR results
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });
    
    return stream;
  } catch (error) {
    console.error('Camera access error:', error);
    throw new Error('Unable to access camera. Please grant camera permissions.');
  }
};

/**
 * Stop all tracks in a media stream to release the camera
 * @param stream - The MediaStream to stop
 */
export const stopCamera = (stream: MediaStream | null): void => {
  if (!stream) return;
  
  stream.getTracks().forEach(track => {
    track.stop();
  });
};

/**
 * Takes a snapshot from video element and returns a canvas element with the image
 * @param videoElement - The video element to capture from
 * @returns Canvas element containing the captured frame
 */
export const captureVideoFrame = (videoElement: HTMLVideoElement): HTMLCanvasElement => {
  if (!videoElement || videoElement.readyState !== 4) {
    throw new Error('Video is not ready for capture');
  }
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Could not get canvas context');
  }
  
  // Set canvas dimensions to match video
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  // Draw the current video frame to the canvas
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
  return canvas;
};

/**
 * Get optimal video dimensions maintaining aspect ratio
 * @param videoStream - The video stream to analyze
 * @param containerWidth - The container width
 * @param containerHeight - The container height
 */
export const getOptimalDimensions = (
  videoStream: MediaStream,
  containerWidth: number,
  containerHeight: number
): { width: number; height: number } => {
  const videoTrack = videoStream.getVideoTracks()[0];
  
  if (!videoTrack) {
    return { width: containerWidth, height: containerHeight };
  }
  
  const settings = videoTrack.getSettings();
  const aspectRatio = settings.width && settings.height 
    ? settings.width / settings.height 
    : 16 / 9;
  
  let width = containerWidth;
  let height = width / aspectRatio;
  
  // If height exceeds container, scale down
  if (height > containerHeight) {
    height = containerHeight;
    width = height * aspectRatio;
  }
  
  return { width, height };
}; 