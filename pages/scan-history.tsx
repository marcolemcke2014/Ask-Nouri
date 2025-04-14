import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import logger from '@/lib/logger';

interface User {
  id: string;
  email?: string;
}

interface Scan {
  id: string;
  menu_raw_text: string;
  scanned_at: string;
  restaurant_name?: string;
  location?: string;
}

export default function ScanHistoryPage({ user }: { user: User | null }) {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      logger.log('AUTH', 'Checking user session status for Scan History page');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        logger.error('AUTH', 'Error retrieving session', sessionError);
      }
      
      if (!session?.user) {
        logger.log('AUTH', 'No authenticated user found, redirecting to login');
        router.push('/login');
      } else {
        logger.log('AUTH', `User authenticated: ${session.user.id}`);
      }
    };
    
    checkAuth();
  }, [router]);

  // Fetch user's scan history directly from Supabase
  useEffect(() => {
    const fetchScanHistory = async () => {
      if (!user) {
        logger.log('SCAN-HISTORY', 'Skipping fetch - no authenticated user');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        logger.log('SCAN-HISTORY', `Fetching scan history for user: ${user.id}`);
        
        const { data: scans, error: queryError } = await supabase
          .from('menu_scan')
          .select('id, menu_raw_text, scanned_at, restaurant_name, location')
          .eq('user_id', user.id)
          .order('scanned_at', { ascending: false });
        
        if (queryError) {
          logger.error('SCAN-HISTORY', `Query error: ${queryError.code} - ${queryError.message}`, queryError);
          throw queryError;
        }
        
        const scanCount = scans?.length || 0;
        logger.log('SCAN-HISTORY', `Retrieved ${scanCount} scans for user ${user.id}`);
        
        if (scanCount === 0) {
          logger.log('SCAN-HISTORY', 'No scans found for user');
        } else {
          // Log a preview of the first scan
          const firstScan = scans?.[0];
          if (firstScan) {
            logger.log('SCAN-HISTORY', 'Latest scan preview:', {
              id: firstScan.id,
              restaurant: firstScan.restaurant_name || 'Unnamed',
              date: firstScan.scanned_at,
              textPreview: logger.truncateText(firstScan.menu_raw_text, 50)
            });
          }
        }
        
        setScans(scans || []);
      } catch (err: any) {
        logger.error('ERROR', `Failed to fetch scan history: ${err.message}`, err);
        setError('Failed to load your scan history. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchScanHistory();
  }, [user]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Truncate text to a maximum length
  const truncateText = (text: string, maxLength: number = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  // Generate a placeholder health score (60-95)
  const getPlaceholderHealthScore = () => {
    return 60 + Math.floor(Math.random() * 36);
  };

  if (!user) {
    logger.log('SCAN-HISTORY', 'Rendering blocked: No authenticated user');
    return null; // Don't render if not authenticated
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Your Recent Scans - NutriFlow</title>
      </Head>
      
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">NutriFlow</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                logger.log('SCAN-HISTORY', 'User navigating to home');
                router.push('/');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Home
            </button>
            <button
              onClick={() => {
                logger.log('SCAN-HISTORY', 'User navigating to profile');
                router.push('/profile');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Profile
            </button>
            <button
              onClick={() => {
                logger.log('AUTH', 'User signing out');
                supabase.auth.signOut();
                router.push('/login');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Recent Scans</h2>
        
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-t-2 border-b-2 border-green-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading your scan history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">Oops! Something went wrong.</div>
            <p className="text-red-500 text-sm">{error}</p>
            <button 
              onClick={() => {
                logger.log('SCAN-HISTORY', 'User retrying scan history fetch');
                window.location.reload();
              }}
              className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : scans.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No scans yet</h3>
            <p className="text-gray-500 mb-6">Start scanning restaurant menus to get nutritional insights</p>
            <button
              onClick={() => {
                logger.log('SCAN-HISTORY', 'New user navigating to scan page');
                router.push('/');
              }}
              className="px-5 py-3 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition-colors"
            >
              Scan Your First Menu
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {scans.map((scan) => {
              const healthScore = getPlaceholderHealthScore();
              
              return (
                <div key={scan.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {scan.restaurant_name || 'Unnamed Restaurant'}
                        </h3>
                        <p className="text-gray-500 text-sm mb-3">
                          {scan.location || 'Unknown Location'} • {formatDate(scan.scanned_at)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div className={`text-lg font-bold ${
                          healthScore >= 80 ? 'text-green-500' : 
                          healthScore >= 70 ? 'text-yellow-500' : 
                          'text-orange-500'
                        }`}>
                          {healthScore}/100
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-700">
                        {truncateText(scan.menu_raw_text || 'No menu text available')}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-xs text-green-700 font-medium">NutriScore™</span>
                      </div>
                      <button
                        onClick={() => {
                          logger.log('SCAN-HISTORY', `User viewing scan details for ID: ${scan.id}`);
                          router.push(`/scan/${scan.id}`);
                        }}
                        className="text-sm font-medium text-green-600 hover:text-green-800"
                      >
                        See Details →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
} 