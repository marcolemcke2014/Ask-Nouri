'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import logger from '../../lib/logger';
import { ScanLine, User, LogOut, PlusCircle, AlertTriangle, Info } from 'lucide-react';

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

// --- Styles from STYLE_GUIDE.md ---
const cardStyle = "bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-5 mb-4";
const buttonPrimaryStyle = "w-16 h-16 rounded-full bg-[#34A853] text-off-white hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-lg fixed bottom-6 right-1/2 transform translate-x-1/2 z-20";
const linkStyle = "text-sm font-medium text-[#84F7AC] hover:underline";
const emptyStateCardStyle = "bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl p-8 text-center";
const errorBoxStyle = "mt-4 p-4 bg-red-700/20 border border-red-500/30 text-red-200 rounded-lg text-sm";
// ---

export default function ScanHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
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
        router.push('/auth/login');
      } else {
        logger.log('AUTH', `User authenticated: ${session.user.id}`);
        setUser(session.user as User);
      }
    };
    
    checkAuth();
  }, [router]);

  // Fetch user's scan history directly from Supabase
  useEffect(() => {
    const fetchScanHistory = async () => {
      if (!user) {
        logger.log('SCAN-HISTORY', 'Skipping fetch - no authenticated user');
        setLoading(false);
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

  const handleLogout = async () => {
    logger.log('AUTH', 'User signing out from history page');
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (!user) {
    logger.log('SCAN-HISTORY', 'Rendering blocked: No authenticated user');
    return null; // Don't render if not authenticated
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] text-off-white">
      <Head>
        <title>Your Scan History - NutriFlow</title>
      </Head>
      
      <header className="sticky top-0 z-10 bg-[#14532D]/80 backdrop-blur-sm border-b border-off-white/15">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-light text-off-white">Scan History</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/profile/index')}
              className="p-1.5 rounded-full text-off-white/80 hover:bg-white/10 transition-colors"
              aria-label="Profile"
            >
              <User size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-full text-off-white/80 hover:bg-white/10 transition-colors"
              aria-label="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow max-w-md mx-auto px-4 py-6 sm:px-6 lg:px-8 w-full">
        <div className="space-y-4">
            {error && (
                <div className={errorBoxStyle}>
                  <Info size={18} className="inline-block mr-2"/> {error}
                </div>
            )} 

            {!loading && scans.length === 0 && !error && (
              <div className={emptyStateCardStyle}>
                <ScanLine size={40} className="mx-auto mb-4 text-green-300"/>
                <h3 className="text-lg font-medium text-off-white mb-2">No scans yet</h3>
                <p className="text-sm text-off-white/80 mb-6">Start scanning restaurant menus to get nutritional insights.</p>
                <button
                  onClick={() => router.push('/scan/index')}
                  className="px-5 py-2 bg-[#34A853] text-off-white rounded-full font-normal text-sm hover:bg-[#2c9247] transition-colors"
                >
                  Scan Your First Menu
                </button>
              </div>
            )}

            {scans.map((scan) => {
              const healthScore = getPlaceholderHealthScore();
              
              return (
                <div key={scan.id} className={cardStyle}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-medium text-off-white mb-1">
                          {scan.restaurant_name || 'Unnamed Scan'}
                        </h3>
                        <p className="text-xs text-off-white/70">
                          {scan.location || 'Unknown Location'} • {formatDate(scan.scanned_at)}
                        </p>
                      </div>
                      <div className={`text-lg font-semibold px-2 py-0.5 rounded ${ 
                        healthScore >= 80 ? 'text-green-300' : 
                        healthScore >= 60 ? 'text-yellow-300' : 
                        'text-orange-400' 
                      }`}>
                        {healthScore}<span className="text-xs">/100</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end items-center">
                      <button
                        onClick={() => router.push(`/scan/${scan.id}`)}
                        className={linkStyle}
                      >
                        See Details →
                      </button>
                    </div>
                </div>
              );
            })}
         </div>
      </main>

      <button 
        className={buttonPrimaryStyle} 
        onClick={() => router.push('/scan/index')}
        aria-label="New Scan"
      >
        <PlusCircle size={24} />
      </button>
    </div>
  );
} 