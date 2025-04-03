// Check if the browser supports camera access
export function isCameraAvailable(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Camera options interface
export interface CameraOptions {
  videoElement: HTMLVideoElement;
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

// Camera stream interface
export interface CameraStream {
  start: () => Promise<void>;
  stop: () => void;
  capture: () => Promise<string>;
  switchCamera: () => Promise<void>;
  getCurrentFacingMode: () => 'user' | 'environment';
}

// Create a camera stream with the given options
export function createCameraStream(options: CameraOptions): CameraStream {
  let stream: MediaStream | null = null;
  let currentFacingMode: 'user' | 'environment' = options.facingMode || 'environment';
  const videoElement = options.videoElement;
  
  // Start the camera stream
  const start = async (): Promise<void> => {
    if (!isCameraAvailable()) {
      throw new Error('Camera not available');
    }
    
    try {
      if (stream) {
        stop();
      }
      
      // Get user media with constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: options.width,
          height: options.height
        },
        audio: false
      };
      
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set the stream to the video element
      videoElement.srcObject = stream;
      
      // Wait for the video to be ready
      return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play()
            .then(() => resolve())
            .catch((error) => {
              console.error('Error playing video:', error);
              throw new Error('Failed to play video stream');
            });
        };
      });
    } catch (error) {
      console.error('Error starting camera:', error);
      throw new Error('Failed to access camera');
    }
  };
  
  // Stop the camera stream
  const stop = (): void => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
      videoElement.srcObject = null;
    }
  };
  
  // Capture a frame from the video stream
  const capture = async (): Promise<string> => {
    if (!stream) {
      throw new Error('Camera stream not started');
    }
    
    try {
      // Create a canvas element to capture the frame
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Draw the current video frame to the canvas
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert the canvas to a data URL
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Error capturing image:', error);
      throw new Error('Failed to capture image');
    }
  };
  
  // Switch between front and back cameras
  const switchCamera = async (): Promise<void> => {
    // Toggle facing mode
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    
    // Restart the stream with the new facing mode
    if (stream) {
      await start();
    }
  };
  
  // Get the current camera facing mode
  const getCurrentFacingMode = (): 'user' | 'environment' => {
    return currentFacingMode;
  };
  
  return {
    start,
    stop,
    capture,
    switchCamera,
    getCurrentFacingMode
  };
}