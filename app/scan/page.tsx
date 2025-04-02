'use client';

/**
 * Scan page for menu scanning and analysis
 */
import { useState } from 'react';
import { Camera, Upload, Loader2, Check, AlertCircle, ChevronRight } from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import ScanBox from '@/components/scanner/ScanBox';
import useOCR from '@/hooks/useOCR';
import { OCRStatus } from '@/types/ocr';

export default function ScanPage() {
  // State management
  const [stage, setStage] = useState<'capture' | 'processing' | 'result' | 'error'>('capture');
  const [menuText, setMenuText] = useState<string>('');
  const [resultData, setResultData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // OCR hook
  const { processImage, isProcessing, progress } = useOCR();
  
  // Handle image capture
  const handleCapture = async () => {
    // In a real app, this would access the camera
    // For now, we'll use the file upload
    alert('Camera capture not implemented in this demo. Please use the upload button instead.');
  };
  
  // Handle image upload
  const handleImageUpload = async (file: File) => {
    try {
      setStage('processing');
      
      // Process image with OCR
      const result = await processImage(file);
      
      if (result.text) {
        setMenuText(result.text);
        
        // Call the analyze API
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            menuText: result.text,
            userPreferences: {} // Would come from user profile
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to analyze menu');
        }
        
        const data = await response.json();
        setResultData(data);
        setStage('result');
      } else {
        setErrorMessage('No text detected in the image. Please try again with a clearer image.');
        setStage('error');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      setStage('error');
    }
  };
  
  // Reset to capture stage
  const handleReset = () => {
    setStage('capture');
    setMenuText('');
    setResultData(null);
    setErrorMessage('');
  };
  
  return (
    <MainLayout title="Scan Menu">
      <div className="flex flex-col gap-6">
        <section className="mt-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            {stage === 'capture' && 'Scan a Menu'}
            {stage === 'processing' && 'Processing...'}
            {stage === 'result' && 'Analysis Complete'}
            {stage === 'error' && 'Error Occurred'}
          </h1>
          <p className="text-muted-foreground">
            {stage === 'capture' && 'Take a photo or upload an image of a restaurant menu'}
            {stage === 'processing' && 'Extracting text and analyzing menu items'}
            {stage === 'result' && 'Here are your personalized menu recommendations'}
            {stage === 'error' && 'Something went wrong while processing your menu'}
          </p>
        </section>
        
        {/* Scanner or results display */}
        <section className="mt-4">
          {stage === 'capture' && (
            <ScanBox onCapture={handleCapture} onUpload={handleImageUpload} />
          )}
          
          {stage === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-4">
                {progress.status === OCRStatus.INITIALIZING && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Initializing scanner...</span>
                  </div>
                )}
                {progress.status === OCRStatus.LOADING && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Loading OCR engine...</span>
                  </div>
                )}
                {(progress.status === OCRStatus.PROCESSING || progress.status === OCRStatus.RECOGNIZING) && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Reading menu text...</span>
                    <span className="text-muted-foreground text-sm">
                      {Math.round(progress.progress * 100)}%
                    </span>
                  </div>
                )}
                {!menuText && progress.status === OCRStatus.COMPLETE && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Analyzing menu items...</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {stage === 'result' && resultData && (
            <div className="flex flex-col gap-4">
              {/* Results summary */}
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <h3 className="font-medium">Analysis Complete</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  We found {resultData.items?.length || 0} items on the menu.
                </p>
                
                {/* Best recommendation */}
                {resultData.recommendations?.bestChoice && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-1">Best Choice for You:</h4>
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
                      <div className="font-medium">{resultData.recommendations.bestChoice.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {resultData.recommendations.bestChoice.healthRating.toUpperCase()} health rating
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Items list preview */}
              <div className="mt-2">
                <h3 className="font-medium mb-2">Menu Items:</h3>
                <div className="divide-y">
                  {resultData.items.slice(0, 3).map((item: any, index: number) => (
                    <div key={index} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm flex gap-2">
                          <span className={`capitalize ${
                            item.healthRating === 'excellent' || item.healthRating === 'good' 
                              ? 'text-green-600' 
                              : item.healthRating === 'moderate' 
                                ? 'text-amber-600' 
                                : 'text-red-600'
                          }`}>
                            {item.healthRating}
                          </span>
                          {item.dietaryTags?.slice(0, 2).map((tag: string, i: number) => (
                            <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                
                {/* View full results button */}
                <button 
                  className="w-full mt-4 py-2.5 bg-card border rounded-md flex items-center justify-center gap-2"
                  onClick={handleReset}
                >
                  Scan Another Menu
                </button>
              </div>
            </div>
          )}
          
          {stage === 'error' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-destructive/10 text-destructive rounded-lg p-6 max-w-md mx-auto text-center">
                <AlertCircle className="h-10 w-10 mx-auto mb-4" />
                <h3 className="font-medium mb-2">Error Occurred</h3>
                <p className="text-sm mb-4">{errorMessage}</p>
                <button 
                  className="py-2 px-4 bg-card border rounded-md"
                  onClick={handleReset}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
} 