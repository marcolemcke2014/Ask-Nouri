import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import { useCameraFeed } from '../../hooks/useCameraFeed';
import { extractTextFromImage } from '../../lib/ocr';
import { parseMenu } from '../../lib/parseMenu';
import { OCRProvider } from '../../types/ocr';
import { ParsedMenuItem } from '../../types/menu';
import { supabase } from '../../lib/supabase';
import { Camera, RefreshCw, AlertCircle, Upload, Maximize } from 'lucide-react';

// Props interface to accept user name
interface ScanScreenProps {
  userName?: string;
}

// --- Styles from STYLE_GUIDE.MD --- (Assume these are available or defined in a central location)
const buttonPrimaryStyle = "w-16 h-16 rounded-full bg-[#34A853] text-off-white hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-lg";
const buttonSecondaryStyle = "px-4 py-2 border border-off-white/30 text-off-white/80 rounded-lg text-sm hover:bg-off-white/10 transition-colors";
const cardStyle = "bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-4 text-center"; // For greeting
const errorBoxStyle = "absolute inset-x-4 top-20 p-4 bg-red-700/50 border border-red-500/30 text-red-200 rounded-lg text-sm backdrop-blur-sm z-20";
// --- 

export default function ScanScreen({ userName }: ScanScreenProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [parsedMenu, setParsedMenu] = useState<ParsedMenuItem[] | null>(null);
  
  const { 
    videoRef, 
    containerRef, 
    isLoading: isCameraLoading, 
    error: cameraError, 
    startCameraFeed, 
    stopCameraFeed, 
    isCameraActive, 
    takePicture 
  } = useCameraFeed({ autoStart: true, facingMode: 'environment' });

  // Process Image (OCR + Parsing) - Remains largely the same
  const processImage = useCallback(async (imageData: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      setParsedMenu(null);
      setOcrText(null);
      
      const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
      
      const ocrResult = await extractTextFromImage(
        base64Image,
        { enhanceContrast: true },
        OCRProvider.GOOGLE_VISION
      );
      
      if (!ocrResult.text) {
        throw new Error('No text detected in the image. Please try again.');
      }
      
      setOcrText(ocrResult.text);
      const parsedItems = parseMenu(ocrResult.text);
      
      if (parsedItems.length === 0) {
        throw new Error('Could not identify menu items in the image. Please try again with a clearer image.');
      }
      
      setParsedMenu(parsedItems);
      
      router.push({
        pathname: '/results',
        query: {
          data: JSON.stringify({
            text: ocrResult.text,
            items: parsedItems,
            timestamp: new Date().toISOString()
          })
        }
      });
    } catch (err) {
      console.error('Scan error:', err);
      setError(err instanceof Error ? err.message : 'Failed to scan menu');
    } finally {
      setIsProcessing(false);
    }
  }, [router]);

  // Handle scanning from camera
  const handleScan = useCallback(async () => {
    if (!isCameraActive || isProcessing) return;
    const imageData = takePicture();
    if (!imageData) {
      setError('Failed to capture image from camera');
      return;
    }
    await processImage(imageData);
  }, [isCameraActive, isProcessing, takePicture, processImage]);

  // Handle image upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        await processImage(imageData);
      };
      reader.onerror = () => {
        setError('Failed to read the uploaded image');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process uploaded image');
    }
  }, [processImage]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle retry after error
  const handleRetry = useCallback(() => {
    setError(null);
    // Assuming camera feed restarts automatically or via parent component state change
  }, []);

  const displayError = error || cameraError;

  // Determine current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    // Main container for the camera feed and overlays
    <div 
      ref={containerRef} 
      className="w-full h-full absolute inset-0 bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Video element */} 
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`
          object-cover w-full h-full 
          ${isCameraActive && !isCameraLoading ? 'opacity-100' : 'opacity-0'} 
          transition-opacity duration-300
        `}
      />

      {/* Loading state overlay */} 
      {isCameraLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-30">
          <LoadingSpinner color="white" size="lg" />
          <p className="text-white mt-4 text-lg">Accessing camera...</p>
        </div>
      )}

      {/* Error state overlay */} 
      {displayError && (
        <div className={errorBoxStyle}>
          <div className="flex items-center justify-between">
            <AlertCircle size={20} className="mr-2 flex-shrink-0"/>
            <span className="flex-grow text-left">{displayError}</span>
            <Button onClick={handleRetry} variant="ghost" size="sm" className="text-red-100 hover:bg-red-900/50 ml-2">Retry</Button>
          </div>
        </div>
      )}

      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-30">
          <LoadingSpinner color="white" size="lg" />
          <p className="text-white mt-4 text-lg">
            {!ocrText ? 'Reading menu...' : 'Analyzing items...'}
          </p>
        </div>
      )}

      {/* Scan Area Guides - Overlay */} 
      {isCameraActive && !isCameraLoading && !displayError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="w-full h-3/5 border-2 border-dashed border-off-white/30 rounded-xl relative">
                {/* Optional: Add corner brackets for more emphasis */}
                {/* Top-left corner */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-300 rounded-tl-lg"></div>
                {/* Top-right corner */}
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-300 rounded-tr-lg"></div>
                {/* Bottom-left corner */}
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-300 rounded-bl-lg"></div>
                {/* Bottom-right corner */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-300 rounded-br-lg"></div>
              </div>
          </div>
      )}

      {/* Bottom Overlays: Greeting and Actions */} 
      {isCameraActive && !isCameraLoading && !displayError && !isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 space-y-4 z-20 bg-gradient-to-t from-black/60 to-transparent">
            {/* Personalized Greeting Card */} 
            <div className={`${cardStyle} max-w-md mx-auto`}>
              <h2 className="text-lg font-medium text-off-white mb-1">{getGreeting()}{userName ? `, ${userName}` : ''}!</h2>
              <p className="text-sm text-off-white/80">
                Ready to scan your menu?
              </p>
            </div>
            
            {/* Action Buttons (Centered Scan Button, optional Upload) */} 
            <div className="flex items-center justify-center space-x-4">
              {/* Main Scan Button */}
              <button 
                onClick={handleScan} 
                className={buttonPrimaryStyle} 
                aria-label="Scan Menu"
                disabled={isProcessing}
              >
                <Camera size={28} strokeWidth={1.5} />
              </button>
              
              {/* Optional Upload Button */}
              {/* 
              <Button 
                variant="ghost" 
                onClick={handleUploadClick} 
                className="text-off-white/70 p-2 rounded-full hover:bg-white/10"
                disabled={isProcessing}
                aria-label="Upload Image"
              >
                <Upload size={20} />
              </Button> 
              */} 
            </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
        disabled={isProcessing}
      />
    </div>
  );
} 