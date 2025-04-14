import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';

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

export default function ScansPage({ user }: { user: User | null }) {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('[SCANS] No user session found, redirecting to login');
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  // Fetch user's scan history
  useEffect(() => {
    const fetchScans = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('[SCANS] Fetching scan history');
        const response = await fetch('/api/get-user-scans');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch scan history');
        }
        
        const data = await response.json();
        
        if (data.success) {
          console.log(`[SCANS] Retrieved ${data.data.length} scans`);
          setScans(data.data);
        } else {
          throw new Error(data.error || 'Failed to retrieve scan history');
        }
      } catch (err: any) {
        console.error('[ERROR] Failed to fetch scans:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchScans();
  }, [user]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Truncate text to a maximum length
  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!user) {
    return null; // Don't render if not authenticated
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Your Scan History - NutriFlow</title>
      </Head>
      
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">NutriFlow</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Profile
            </button>
            <button
              onClick={() => {
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
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-6">
            <h2 className="text-xl font-semibold mb-6">Your Scan History</h2>
            
            {loading ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-500">Loading your scan history...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
                <p>Error: {error}</p>
              </div>
            ) : scans.length === 0 ? (
              <div className="py-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-600">You haven't scanned any menus yet</p>
                <p className="mt-1 text-gray-500">Use the camera to scan a menu and it will appear here.</p>
                <button
                  onClick={() => router.push('/')}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Scan a Menu
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {scans.map((scan) => (
                  <div key={scan.id} className="border rounded-md p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {scan.restaurant_name || 'Unnamed Restaurant'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {scan.location ? `${scan.location} • ` : ''}
                          {formatDate(scan.scanned_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/scan/${scan.id}`)}
                        className="text-blue-500 text-sm hover:text-blue-700"
                      >
                        View Details
                      </button>
                    </div>
                    
                    <div className="mt-3 bg-gray-50 p-3 rounded-md font-mono text-xs text-gray-700 whitespace-pre-wrap">
                      {truncateText(scan.menu_raw_text)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 