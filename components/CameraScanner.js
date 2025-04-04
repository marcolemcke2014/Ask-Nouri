import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';

const CameraScanner = forwardRef(({ onCapture }, ref) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStatus, setCameraStatus] = useState('loading'); // 'loading', 'ready', 'error'

  useEffect(() => {
    const startCamera = async () => {
      try {
        setCameraStatus('loading');
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
        
        setCameraStatus('ready');
      } catch (err) {
        console.error('Failed to access camera', err);
        setCameraStatus('error');
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const captureFrame = () => {
    if (cameraStatus !== 'ready') return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (onCapture) onCapture(blob);
    }, 'image/jpeg');
  };

  useImperativeHandle(ref, () => ({
    captureFrame,
  }));

  return (
    <>
      {/* Full-screen camera background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        
        {/* Loading indicator */}
        {cameraStatus === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
            <div className="text-white">Initializing camera...</div>
          </div>
        )}
        
        {/* Error message */}
        {cameraStatus === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
            <div className="text-white text-center p-4">
              <p className="mb-2">Failed to access camera</p>
              <p className="text-sm">Please ensure you've given camera permission</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden canvas for capturing frames */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
});

CameraScanner.displayName = 'CameraScanner';

export default CameraScanner; 