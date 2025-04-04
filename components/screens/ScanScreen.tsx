import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AppShell from '../layout/AppShell';
import ScannerButton from '../ui/ScannerButton';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import { useCameraFeed } from '@/hooks/useCameraFeed';
import { useOCR } from '@/hooks/useOCR';
import { captureVideoFrame } from '@/lib/videoHelpers';
import { analyzeMenu } from '@/lib/ai';

/**
 * Screen showing live camera feed for menu scanning
 */
export default function ScanScreen() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canScan, setCanScan] = useState(false);
  const initializedRef = useRef(false);
  
  // Default user goals (would normally come from user profile)
  const userGoals = ['Weight Loss', 'Low Sodium', 'High Protein'];
  
  // Get camera feed
  const {
    videoRef,
    containerRef,
    isLoading: isCameraLoading,
    error: cameraError,
    startCameraFeed,
    stopCameraFeed,
    isCameraActive
  } = useCameraFeed(true); // Auto-start camera
  
  // OCR functionality
  const {
    text: ocrText,
    isProcessing: isOcrProcessing,
    error: ocrError,
    processVideoFrame
  } = useOCR();
  
  // Check if camera is ready for scanning
  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState === 4 && !isOcrProcessing && !isAnalyzing) {
      setCanScan(true);
    } else {
      setCanScan(false);
    }
  }, [videoRef, isOcrProcessing, isAnalyzing]);
  
  // Handle OCR errors
  useEffect(() => {
    if (cameraError) {
      setError(cameraError);
    } else if (ocrError) {
      setError(ocrError);
    } else {
      setError(null);
    }
  }, [cameraError, ocrError]);
  
  // Initialize OCR (ensure we only do this once)
  useEffect(() => {
    if (initializedRef.current) return;
    
    const init = async () => {
      try {
        initializedRef.current = true;
      } catch (err) {
        console.error('Failed to initialize:', err);
      }
    };
    
    init();
    
    // Cleanup on unmount
    return () => {
      stopCameraFeed();
    };
  }, []);
  
  // Handle scanning a menu
  const handleScan = async () => {
    if (!canScan || !videoRef.current) return;
    
    try {
      // Process OCR on the current video frame
      const extractedText = await processVideoFrame(videoRef.current);
      
      if (!extractedText) {
        setError('Could not extract text from image');
        return;
      }
      
      setIsAnalyzing(true);
      
      // Analyze the menu text with AI
      const analysis = await analyzeMenu(extractedText, userGoals);
      
      // Navigate to results screen with data
      router.push({
        pathname: '/results',
        query: {
          data: JSON.stringify({
            text: extractedText,
            analysis: analysis.items,
            timestamp: new Date().toISOString()
          })
        }
      });
      
    } catch (err) {
      console.error('Scan error:', err);
      setError(err instanceof Error ? err.message : 'Failed to scan menu');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Handle error retry
  const handleRetry = () => {
    setError(null);
    stopCameraFeed();
    startCameraFeed();
  };
  
  // Go back to home screen
  const handleBack = () => {
    router.push('/');
  };
  
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
        {error && (
          <div className="text-center p-4">
            <p className="text-white mb-4">{error}</p>
            <Button onClick={handleRetry}>Retry</Button>
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
            ${isCameraActive && !isCameraLoading && !error ? 'opacity-100' : 'opacity-0'}
          `}
        />
        
        {/* Scan button - centered at bottom */}
        {isCameraActive && !error && (
          <div className="absolute bottom-12 left-0 right-0 flex justify-center">
            <ScannerButton
              onClick={handleScan}
              isProcessing={isOcrProcessing || isAnalyzing}
              size="lg"
            />
          </div>
        )}
        
        {/* Processing overlay */}
        {(isOcrProcessing || isAnalyzing) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
            <LoadingSpinner color="white" size="lg" />
            <p className="text-white mt-4 text-lg">
              {isOcrProcessing ? 'Reading menu...' : 'Analyzing dishes...'}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
} 