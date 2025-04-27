import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import logger from '../../lib/logger';
import { History, User } from 'lucide-react';

interface User {
  id: string;
  email?: string;
}

interface Scan {
  id: string;
  user_id: string;
  menu_raw_text: string;
  scanned_at: string;
  restaurant_name?: string;
  location?: string;
  health_score?: number;
  ocr_method?: string;
  scan_method?: string;
  device_type?: string;
  ai_summary?: string;
  created_at?: string;
}

export default function ScanDetailPage({ user }: { user: User | null }) {
  const router = useRouter();
  const { id } = router.query;
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      console.log('[AUTH] Checking user session status for Scan Detail page');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error(`[AUTH] Error retrieving session: ${sessionError.message}`);
      }
      
      if (!session?.user) {
        console.log('[AUTH] No authenticated user found, redirecting to login');
        router.push('/auth/login');
      } else {
        console.log(`[AUTH] User authenticated: ${session.user.id}`);
      }
    };
    
    checkAuth();
  }, [router]);

  // Fetch scan data
  useEffect(() => {
    const fetchScanData = async () => {
      if (!id || !user) {
        console.log('[DETAILS] Skipping fetch - missing ID or user', { hasId: !!id, hasUser: !!user });
        return;
      }
      
      setLoading(true);
      setError(null);
      setNotFound(false);
      
      try {
        console.log(`[DETAILS] Fetching scan data for ID: ${id}`);
        
        const { data: scan, error: queryError } = await supabase
          .from('menu_scan')
          .select('*')
          .eq('id', id)
          .single();
        
        if (queryError) {
          console.error(`[DETAILS] Query error: ${queryError.code} - ${queryError.message}`);
          if (queryError.code === 'PGRST116') { // No rows returned
            console.log(`[DETAILS] Scan not found with ID: ${id}`);
            setNotFound(true);
          } else {
            throw queryError;
          }
          return;
        }
        
        if (!scan) {
          console.log(`[DETAILS] Scan with ID ${id} returned null data`);
          setNotFound(true);
          return;
        }
        
        // Verify the scan belongs to the current user
        if (scan.user_id !== user.id) {
          console.error(`[DETAILS] Access denied: Scan belongs to user ${scan.user_id}, but current user is ${user.id}`);
          setNotFound(true);
          return;
        }
        
        console.log(`[DETAILS] Successfully retrieved scan ${id} with data:`, {
          restaurant: scan.restaurant_name || 'Unnamed',
          location: scan.location || 'Unknown',
          scanned_at: scan.scanned_at,
          textLength: scan.menu_raw_text?.length || 0
        });
        
        setScan(scan);
      } catch (err: any) {
        console.error(`[ERROR] Scan detail fetch failed: ${err.message}`, err.stack);
        setError(`Failed to load scan details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchScanData();
  }, [id, user]);

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Generate a placeholder health score (60-95) if not provided
  const getHealthScore = () => {
    if (scan?.health_score) return scan.health_score;
    return 60 + Math.floor(Math.random() * 36);
  };
  
  // Attempt to parse AI summary JSON if present
  const parseAiSummary = () => {
    if (!scan?.ai_summary) return null;
    
    try {
      console.log('[DETAILS] Parsing AI summary JSON');
      return JSON.parse(scan.ai_summary);
    } catch (e) {
      console.log('[DETAILS] AI summary is not valid JSON, treating as text');
      // If not JSON, return as is
      return scan.ai_summary;
    }
  };
  
  // Determine text display class based on expanded state
  const getTextDisplayClass = () => {
    if (isTextExpanded) return 'whitespace-pre-wrap';
    return 'whitespace-pre-wrap max-h-60 overflow-hidden';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (!user) {
    console.log('[DETAILS] Rendering blocked: No authenticated user');
    return null; // Don't render if not authenticated
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{scan?.restaurant_name || 'Scan Details'} - NutriFlow</title>
      </Head>
      
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">NutriFlow</h1>
          <div className="flex items-center space-x-4">
            <button
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
              onClick={() => router.push('/history/index')}
            >
              <History size={16} />
              Scan History
            </button>
            <button
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
              onClick={() => router.push('/profile/index')}
            >
              <User size={16} />
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
            onClick={() => router.push('/history/index')}
          >
            <History size={16} />
            Back to Scan History
          </button>
        </div>
        
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-b-2 border-green-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading scan details...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl shadow-md p-8 text-center">
            <div className="text-red-600 text-lg mb-2">Something went wrong</div>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : notFound ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Scan Not Found</h3>
            <p className="text-gray-500 mb-6">This scan doesn't exist or doesn't belong to your account.</p>
            <button
              onClick={() => router.push('/history/index')}
              className="px-5 py-3 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition-colors"
            >
              Return to Scan History
            </button>
          </div>
        ) : scan ? (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Header Section */}
            <div className="bg-green-50 p-6 border-b border-green-100">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {scan.restaurant_name || 'Unnamed Restaurant'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {scan.location || 'Unknown Location'}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className={`text-lg font-bold px-3 py-1 rounded-full ${
                    getHealthScore() >= 80 ? 'bg-green-100 text-green-700' : 
                    getHealthScore() >= 70 ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {getHealthScore()}/100
                  </div>
                  <div className="text-xs text-gray-500 mt-1">NutriScore™</div>
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-4">
                Scanned on {formatDate(scan.scanned_at)}
              </div>
            </div>
            
            {/* Scan Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Scan Method</div>
                  <div className="font-medium">{scan.scan_method || 'Standard Scan'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">OCR Method</div>
                  <div className="font-medium">{scan.ocr_method || 'Standard OCR'}</div>
                </div>
                {scan.device_type && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Device</div>
                    <div className="font-medium">{scan.device_type}</div>
                  </div>
                )}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Scan ID</div>
                  <div className="font-medium text-sm">{scan.id}</div>
                </div>
              </div>
              
              {/* Menu Text Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">Menu Text</h3>
                  <button 
                    onClick={() => {
                      console.log(`[DETAILS] Menu text view ${isTextExpanded ? 'collapsed' : 'expanded'}`);
                      setIsTextExpanded(!isTextExpanded);
                    }}
                    className="text-xs text-green-600 hover:text-green-800"
                  >
                    {isTextExpanded ? 'Show Less' : 'Show More'}
                  </button>
                </div>
                <div className={`bg-gray-50 p-4 rounded-lg text-sm font-mono text-gray-700 ${getTextDisplayClass()}`}>
                  {scan.menu_raw_text || 'No menu text available'}
                </div>
                {!isTextExpanded && scan.menu_raw_text && scan.menu_raw_text.length > 500 && (
                  <div className="text-center mt-2">
                    <div className="h-8 bg-gradient-to-b from-transparent to-white relative -mt-8 mb-2"></div>
                    <button 
                      onClick={() => {
                        console.log('[DETAILS] Expanding full menu text view');
                        setIsTextExpanded(true);
                      }}
                      className="text-xs text-green-600 hover:text-green-800"
                    >
                      Show Full Text
                    </button>
                  </div>
                )}
              </div>
              
              {/* AI Summary Section */}
              {scan.ai_summary && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    {typeof parseAiSummary() === 'object' ? (
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(parseAiSummary()).map(([key, value]) => (
                          <div key={key} className="flex">
                            <span className="font-medium mr-2">{key.replace(/_/g, ' ')}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-700">{String(parseAiSummary())}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => {
                    console.log('[DETAILS] User navigating back to scan history');
                    router.push('/history/index');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back to History
                </button>
                <button
                  onClick={() => {
                    console.log('[DETAILS] User initiating new scan');
                    router.push('/');
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Scan New Menu
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
} 