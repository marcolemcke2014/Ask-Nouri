import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AppShell from '../layout/AppShell';
import Button from '../ui/Button';
import Tag from '../ui/Tag';
import LoadingSpinner from '../ui/LoadingSpinner';
import { MenuItemAnalysis } from '@/types/ai';
import { FlagLevel } from '@/types/menu';

interface ResultData {
  text: string;
  analysis: MenuItemAnalysis[];
  timestamp: string;
}

/**
 * Screen showing AI-analyzed menu results
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
        setError('No analysis data found');
      }
    } catch (err) {
      console.error('Failed to parse result data:', err);
      setError('Failed to load results');
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
          items: data.analysis,
          timestamp: data.timestamp
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save scan');
      }
      
      // Show success message or redirect
      alert('Scan saved successfully!');
      
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save results');
    }
  };
  
  // Go back to scan screen
  const handleScanAgain = () => {
    router.push('/scan');
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
  
  // Generate tag components for menu item
  const renderTags = (item: MenuItemAnalysis) => {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {/* Score tag */}
        <Tag
          label={`Score: ${item.score}/10`}
          icon="⭐"
          color={item.score >= 7 ? '#4CAF50' : item.score >= 5 ? '#FF9800' : '#F44336'}
        />
        
        {/* Feature tags */}
        {item.tags.map((tag, i) => (
          <Tag key={`tag-${i}`} label={tag} />
        ))}
        
        {/* Warning flags */}
        {item.flags.map((flag, i) => (
          <Tag 
            key={`flag-${i}`} 
            label={flag} 
            level={FlagLevel.WARNING}
            icon="⚠️"
          />
        ))}
      </div>
    );
  };
  
  return (
    <AppShell
      title="Results"
      leftElement={backButton}
      fullHeight
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner label="Loading results..." />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={handleScanAgain}>Try Again</Button>
        </div>
      ) : data && data.analysis.length > 0 ? (
        <div className="flex flex-col h-full">
          {/* Results list */}
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-xl font-bold mb-4">Recommended Dishes</h2>
            
            <div className="space-y-4">
              {data.analysis.map((item, index) => (
                <div
                  key={`result-${index}`}
                  className="bg-white rounded-lg shadow-md p-4"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <span className="text-2xl">{item.score >= 8 ? '👍' : '😐'}</span>
                  </div>
                  
                  {renderTags(item)}
                  
                  {item.improvements.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700">Suggested Improvements:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 ml-2 mt-1">
                        {item.improvements.map((improvement, i) => (
                          <li key={`imp-${i}`}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                Save Results
              </Button>
              <Button onClick={handleScanAgain} variant="outline" className="flex-1">
                Scan Another Menu
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <p className="mb-4">No dishes were found in the menu.</p>
          <Button onClick={handleScanAgain}>Scan Again</Button>
        </div>
      )}
    </AppShell>
  );
}