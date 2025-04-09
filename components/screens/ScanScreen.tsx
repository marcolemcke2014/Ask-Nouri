import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import AppShell from '../layout/AppShell';
import ScannerButton from '../ui/ScannerButton';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import { useCameraFeed } from '@/hooks/useCameraFeed';
import { extractTextFromImage } from '@/lib/ocr';
import { parseMenu } from '@/lib/parseMenu';
import { OCRProvider } from '@/types/ocr';
import { ParsedMenuItem } from '@/types/menu';

/**
 * Screen showing live camera feed for menu scanning
 */
export default function ScanScreen() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [parsedMenu, setParsedMenu] = useState<ParsedMenuItem[] | null>(null);
  
  // Get camera feed with environment facing camera
  const {
    videoRef,
    containerRef,
    isLoading: isCameraLoading,
    error: cameraError,
    startCameraFeed,
    stopCameraFeed,
    isCameraActive,
    takePicture
  } = useCameraFeed({
    autoStart: true,
    facingMode: 'environment'
  });
  
  // Handle OCR and menu parsing
  const processImage = useCallback(async (imageData: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      setParsedMenu(null);
      setOcrText(null);
      
      // Remove data URL prefix if it's there
      const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
      
      // Extract text using OCR
      const ocrResult = await extractTextFromImage(
        base64Image,
        { enhanceContrast: true },
        OCRProvider.GOOGLE_VISION
      );
      
      if (!ocrResult.text) {
        throw new Error('No text detected in the image. Please try again.');
      }
      
      setOcrText(ocrResult.text);
      
      // Parse menu items from the OCR text
      const parsedItems = parseMenu(ocrResult.text);
      
      if (parsedItems.length === 0) {
        throw new Error('Could not identify menu items in the image. Please try again with a clearer image.');
      }
      
      setParsedMenu(parsedItems);
      
      // Navigate to results screen
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
      // Read the file as a data URL
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
  
  // Handle upload button click
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  // Handle retry after error
  const handleRetry = useCallback(() => {
    setError(null);
    stopCameraFeed();
    startCameraFeed();
  }, [stopCameraFeed, startCameraFeed]);
  
  // Go back to home screen
  const handleBack = useCallback(() => {
    router.push('/');
  }, [router]);
  
  // Back button for header
  const backButton = (
    <Button
      variant="ghost"
      onClick={handleBack}
      className="text-white"
      aria-label="Go back"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </Button>
  );
  
  // Set error if camera failed
  const displayError = error || cameraError;
  
  return (
    <AppShell
      title="Scan Menu"
      leftElement={backButton}
      transparentHeader
      fullHeight
      className="bg-black"
    >
      {/* Full screen video container */}
      <div 
        ref={containerRef} 
        className="w-full h-full absolute inset-0 bg-black flex items-center justify-center overflow-hidden"
      >
        {/* Loading state */}
        {isCameraLoading && (
          <LoadingSpinner color="white" size="lg" label="Accessing camera..." />
        )}
        
        {/* Error state */}
        {displayError && (
          <div className="text-center p-4 bg-black bg-opacity-75 rounded-lg max-w-md">
            <p className="text-white mb-4">{displayError}</p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleRetry} variant="primary">Retry Camera</Button>
              <Button onClick={handleUploadClick} variant="secondary">Upload Image</Button>
            </div>
          </div>
        )}
        
        {/* Video element - hidden until loaded */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`
            object-cover w-full h-full 
            ${isCameraActive && !isCameraLoading && !displayError ? 'opacity-100' : 'opacity-0'}
          `}
        />
        
        {/* Hidden file input for image uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isProcessing}
        />
        
        {/* Action buttons */}
        {isCameraActive && !displayError && (
          <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4">
            {/* Upload button with icon */}
            <ScannerButton
              onClick={handleUploadClick}
              isProcessing={isProcessing}
              size="lg"
            />
            
            {/* Scan button */}
            <Button 
              variant="secondary" 
              onClick={handleScan}
              className="bg-gray-800 bg-opacity-70 text-white"
              disabled={isProcessing}
            >
              Scan Menu
            </Button>
          </div>
        )}
        
        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
            <LoadingSpinner color="white" size="lg" />
            <p className="text-white mt-4 text-lg">
              {!ocrText ? 'Reading menu...' : 'Analyzing items...'}
            </p>
          </div>
        )}
        
        {/* Debug information (uncomment during development) */}
        {/* {(ocrText || parsedMenu) && (
          <div className="absolute top-20 left-4 right-4 bg-black bg-opacity-80 p-4 rounded overflow-auto max-h-[60vh] text-xs">
            {ocrText && (
              <div className="mb-4">
                <h3 className="text-white font-bold mb-1">OCR Text:</h3>
                <p className="text-white whitespace-pre-line">{ocrText}</p>
              </div>
            )}
            {parsedMenu && parsedMenu.length > 0 && (
              <div>
                <h3 className="text-white font-bold mb-1">Parsed Menu:</h3>
                <pre className="text-white overflow-auto">
                  {JSON.stringify(parsedMenu, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )} */}
      </div>
    </AppShell>
  );
} 