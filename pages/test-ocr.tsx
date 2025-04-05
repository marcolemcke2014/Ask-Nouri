import React, { useState, useRef } from 'react';
import AppShell from '@/components/layout/AppShell';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { extractTextFromImage } from '@/lib/ocr';
import { parseMenu } from '@/lib/parseMenu';
import { OCRProvider } from '@/types/ocr';
import { ParsedMenuItem } from '@/types/menu';

export default function TestOCRPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [parsedMenu, setParsedMenu] = useState<ParsedMenuItem[] | null>(null);
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      setParsedMenu(null);
      setOcrText(null);
      
      // Read file as data URL for preview
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        setImage(imageData);
        
        try {
          // Process with OCR
          await processImage(imageData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read the uploaded image');
        setIsProcessing(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process uploaded image');
      setIsProcessing(false);
    }
  };
  
  // Process image with OCR and menu parsing
  const processImage = async (imageData: string) => {
    // Remove data URL prefix if it's there
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Extract text using OCR
    console.log('Sending image to OCR service...');
    const ocrResult = await extractTextFromImage(
      base64Image,
      { enhanceContrast: true },
      OCRProvider.GOOGLE_VISION
    );
    
    if (!ocrResult.text) {
      throw new Error('No text detected in the image. Please try again with a clearer image.');
    }
    
    console.log('OCR text extracted:', ocrResult.text.substring(0, 100) + '...');
    setOcrText(ocrResult.text);
    
    // Parse menu items from the OCR text
    console.log('Parsing menu items...');
    const parsedItems = parseMenu(ocrResult.text);
    
    if (parsedItems.length === 0) {
      console.warn('No menu items parsed from text');
    } else {
      console.log(`Successfully parsed ${parsedItems.length} menu items`);
    }
    
    setParsedMenu(parsedItems);
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleReset = () => {
    setImage(null);
    setOcrText(null);
    setParsedMenu(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <AppShell title="OCR Test Page">
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">OCR Pipeline Test</h1>
        
        {/* File Upload Section */}
        <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">1. Upload Menu Image</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
            
            <Button 
              onClick={handleUploadClick}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              {isProcessing ? 'Processing...' : 'Upload Menu Image'}
            </Button>
            
            {(image || ocrText || parsedMenu) && (
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                Reset
              </Button>
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>
        
        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="lg" label="Processing image..." />
          </div>
        )}
        
        {/* Results Display */}
        {!isProcessing && (
          <div className="space-y-8">
            {/* Image Preview */}
            {image && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Menu Image:</h2>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <img 
                    src={image} 
                    alt="Uploaded menu" 
                    className="max-h-[400px] mx-auto object-contain"
                  />
                </div>
              </div>
            )}
            
            {/* OCR Text Result */}
            {ocrText && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold mb-2">2. Raw OCR Text:</h2>
                <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-[300px] text-sm whitespace-pre-wrap">
                  {ocrText}
                </pre>
              </div>
            )}
            
            {/* Parsed Menu Items */}
            {parsedMenu && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold mb-2">
                  3. Parsed Menu Items ({parsedMenu.length}):
                </h2>
                
                {parsedMenu.length === 0 ? (
                  <p className="text-amber-600">No menu items could be parsed from the OCR text.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Pretty display of menu items */}
                    <div className="grid gap-4">
                      {parsedMenu.map((item, index) => (
                        <div 
                          key={index} 
                          className="bg-gray-50 p-3 rounded border border-gray-200"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">{item.title}</span>
                            {item.price && (
                              <span className="text-green-700 font-medium">{item.price}</span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* JSON representation */}
                    <details className="mt-4">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        Show as JSON
                      </summary>
                      <pre className="mt-2 bg-gray-50 p-3 rounded overflow-auto max-h-[300px] text-sm">
                        {JSON.stringify(parsedMenu, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
} 