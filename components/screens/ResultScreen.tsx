import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AppShell from '../layout/AppShell';
import Button from '../ui/Button';
import Tag from '../ui/Tag';
import LoadingSpinner from '../ui/LoadingSpinner';
import { ParsedMenuItem } from '@/types/menu';
import { FlagLevel } from '@/types/menu';

interface ResultData {
  text: string;
  items: ParsedMenuItem[];
  timestamp: string;
}

/**
 * Screen showing OCR-parsed menu results
 */
export default function ResultScreen() {
  const router = useRouter();
  const [data, setData] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Parse query params when available
  useEffect(() => {
    if (!router.isReady) return;
    
    try {
      if (router.query.data) {
        const parsedData = JSON.parse(router.query.data as string) as ResultData;
        setData(parsedData);
      } else {
        setError('No menu data found');
      }
    } catch (err) {
      console.error('Failed to parse result data:', err);
      setError('Failed to load menu results');
    } finally {
      setIsLoading(false);
    }
  }, [router.isReady, router.query]);
  
  // Handle save button click
  const handleSave = async () => {
    if (!data) return;
    
    try {
      const response = await fetch('/api/save-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rawText: data.text,
          items: data.items,
          timestamp: data.timestamp
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save scan');
      }
      
      // Show success message or redirect
      alert('Menu scan saved successfully!');
      
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save results');
    }
  };
  
  // Go back to scan screen
  const handleScanAgain = () => {
    router.push('/');
  };
  
  // Go back to home
  const handleGoHome = () => {
    router.push('/');
  };
  
  // Back button for header
  const backButton = (
    <Button
      variant="ghost"
      onClick={handleGoHome}
      aria-label="Go home"
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
      title="Menu Results"
      leftElement={backButton}
      fullHeight
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner label="Loading menu results..." />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={handleScanAgain}>Try Again</Button>
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="flex flex-col h-full">
          {/* Results list */}
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-xl font-bold mb-4">Menu Items</h2>
            
            <div className="space-y-4">
              {data.items.map((item, index) => (
                <div
                  key={`menu-item-${index}`}
                  className="bg-white rounded-lg shadow-md p-4"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    {item.price && (
                      <span className="text-lg font-medium text-green-700">{item.price}</span>
                    )}
                  </div>
                  
                  {item.description && (
                    <p className="text-gray-600 mt-2 text-sm">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
            
            {/* Original OCR text (hidden by default) */}
            <div className="mt-8 border-t pt-4">
              <details className="text-sm">
                <summary className="font-medium text-gray-700 cursor-pointer">
                  Show Original OCR Text
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded whitespace-pre-wrap text-gray-700 text-xs">
                  {data.text}
                </div>
              </details>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                Save Menu
              </Button>
              <Button onClick={handleScanAgain} variant="outline" className="flex-1">
                Scan Another Menu
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <p className="mb-4">No menu items were found. Please try scanning again.</p>
          <Button onClick={handleScanAgain}>Scan Again</Button>
        </div>
      )}
    </AppShell>
  );
}