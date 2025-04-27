'use client'; // Ensure present

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';
import logger from '../../lib/logger';
import { History, User, LogOut, Info, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'; // Added AlertTriangle

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

// --- Styles from STYLE_GUIDE.md ---
const cardStyle = "bg-off-white/20 backdrop-blur-xl rounded-2xl border border-off-white/15 shadow-xl overflow-hidden"; // Added overflow-hidden
const cardHeaderStyle = "bg-green-800/30 p-5 border-b border-off-white/15"; // Darker header section
const cardContentStyle = "p-5";
const buttonSecondaryStyle = "px-4 py-2 border border-off-white/30 text-off-white/80 rounded-lg text-sm hover:bg-off-white/10 transition-colors";
const buttonPrimaryStyle = "px-4 py-2 bg-[#34A853] text-off-white rounded-lg text-sm hover:bg-[#2c9247] transition-colors font-normal";
const detailBoxStyle = "bg-white/5 p-3 rounded-lg";
const errorBoxStyle = "mt-4 p-4 bg-red-700/20 border border-red-500/30 text-red-200 rounded-lg text-sm";
const backLinkStyle = "flex items-center space-x-2 text-sm text-green-200 hover:text-green-100 mb-6";
// ---

export default function ScanDetailPage() {
  // Add user state
  const [user, setUser] = useState<User | null>(null);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // logger.log('AUTH', 'No authenticated user found, redirecting to login');
        router.replace('/auth/login');
      } else {
        // logger.log('AUTH', `User authenticated: ${session.user.id}`);
        setUser(session.user as User);
      }
    };
    checkAuth();
  }, [router]);

  // Fetch scan data
  useEffect(() => {
    const fetchScanData = async () => {
      if (!id || !user) { return; }
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        // logger.log('DETAILS', `Fetching scan data for ID: ${id}`);
        const { data: fetchedScan, error: queryError } = await supabase
          .from('menu_scan')
          .select('*, user_profile(first_name)') // Fetch profile name too if needed
          .eq('id', id)
          .single();
        
        if (queryError) {
          if (queryError.code === 'PGRST116') {
            setNotFound(true);
          } else { throw queryError; }
          return;
        }
        if (!fetchedScan || fetchedScan.user_id !== user.id) {
          setNotFound(true);
          return;
        }
        setScan(fetchedScan);
      } catch (err: any) {
        logger.error('ERROR', `Scan detail fetch failed: ${err.message}`, err.stack);
        setError(`Failed to load scan details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    if (id && user) { // Only fetch if ID and user are available
        fetchScanData();
    }
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
  
  // Toggle text expansion
  const toggleTextExpansion = () => setIsTextExpanded(!isTextExpanded);

  const handleLogout = async () => {
    logger.log('AUTH', 'User signing out from scan detail page');
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Render Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#14532D] to-[#0A4923] text-off-white p-4">
        <div className="w-10 h-10 border-t-2 border-b-2 border-green-300 rounded-full animate-spin mb-4"></div>
        <p>Loading scan details...</p>
      </div>
    );
  }

  return (
    // Apply guide background and font
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#14532D] to-[#0A4923] font-['Poppins',sans-serif] text-off-white">
      <Head>
        <title>{scan?.restaurant_name || 'Scan Details'} - NutriFlow</title>
      </Head>
      
       {/* Header - Simplified & Styled */}
      <header className="sticky top-0 z-10 bg-[#14532D]/80 backdrop-blur-sm border-b border-off-white/15">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-light text-off-white">Scan Details</h1>
          <div className="flex items-center space-x-4">
             <button
              onClick={() => router.push('/history/index')}
              className="p-1.5 rounded-full text-off-white/80 hover:bg-white/10 transition-colors"
              aria-label="History"
            >
              <History size={20} />
            </button>
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
      
      <main className="flex-grow max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8 w-full">
        {/* Back Link */}
        <button onClick={() => router.push('/history/index')} className={backLinkStyle}>
            <History size={16} className="mr-1" />
            Back to Scan History
        </button>

        {error ? (
            <div className={errorBoxStyle}>
                <Info size={18} className="inline-block mr-2"/> {error}
            </div>
        ) : notFound ? (
            <div className={cardStyle + " text-center p-8"}>
                <AlertTriangle size={40} className="mx-auto mb-4 text-orange-400"/>
                <h3 className="text-xl font-medium text-off-white mb-2">Scan Not Found</h3>
                <p className="text-sm text-off-white/80 mb-6">This scan doesn't exist or you don't have permission to view it.</p>
                <button onClick={() => router.push('/history/index')} className={buttonPrimaryStyle + " w-auto px-6"}>
                  Return to History
                </button>
            </div>
        ) : scan ? (
          <div className={cardStyle}>
            {/* Card Header */}
            <div className={cardHeaderStyle}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl sm:text-2xl font-medium text-off-white">
                    {scan.restaurant_name || 'Unnamed Scan'}
                  </h2>
                  <p className="text-sm text-off-white/70 mt-1">
                    {scan.location || 'Unknown Location'}
                  </p>
                </div>
                {/* Score Display */}
                <div className="text-right flex-shrink-0 pl-4">
                   <div className={`text-xl font-semibold px-2.5 py-1 rounded ${ 
                    getHealthScore() >= 80 ? 'text-green-300' : 
                    getHealthScore() >= 60 ? 'text-yellow-300' : 
                    'text-orange-400' 
                  }`}>
                    {getHealthScore()}<span className="text-xs opacity-80">/100</span>
                  </div>
                   <div className="text-xs text-off-white/60 mt-0.5">NutriScore™</div>
                </div>
              </div>
              <div className="text-xs text-off-white/60 mt-3">
                Scanned on {formatDate(scan.scanned_at)}
              </div>
            </div>
            
            {/* Card Content */}
            <div className={cardContentStyle}>
              {/* Scan Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={detailBoxStyle}>
                  <div className="text-xs text-off-white/60 mb-1">Scan Method</div>
                  <div className="text-sm font-medium text-off-white/90">{scan.scan_method || 'Standard'}</div>
                </div>
                <div className={detailBoxStyle}>
                  <div className="text-xs text-off-white/60 mb-1">OCR Method</div>
                  <div className="text-sm font-medium text-off-white/90">{scan.ocr_method || 'Standard'}</div>
                </div>
                {/* Add more details if needed */}
                 <div className={detailBoxStyle + " col-span-2"}>
                  <div className="text-xs text-off-white/60 mb-1">Scan ID</div>
                  <div className="text-xs font-mono text-off-white/70 break-all">{scan.id}</div>
                </div>
              </div>
              
              {/* Menu Text Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-medium text-off-white">Menu Text</h3>
                  <button 
                    onClick={toggleTextExpansion}
                    className="text-xs text-green-300 hover:text-green-100 flex items-center"
                  >
                    {isTextExpanded ? 'Show Less' : 'Show More'} 
                    {isTextExpanded ? <ChevronUp size={14} className="ml-1"/> : <ChevronDown size={14} className="ml-1"/>}
                  </button>
                </div>
                <div className={`bg-black/20 p-3 rounded-lg text-xs font-mono text-off-white/80 overflow-hidden transition-all duration-300 ease-in-out ${isTextExpanded ? 'max-h-[1000px]' : 'max-h-40'}`}>
                  <pre className="whitespace-pre-wrap break-words">{scan.menu_raw_text || 'No menu text available'}</pre>
                </div>
              </div>
              
              {/* AI Summary Section */}
              {scan.ai_summary && (
                <div className="mb-6">
                  <h3 className="text-base font-medium text-off-white mb-2">AI Analysis</h3>
                  <div className="bg-green-800/20 p-4 rounded-lg border border-green-500/30 text-sm text-off-white/90">
                     {/* Basic rendering, improve if summary is JSON */}
                     <p className="whitespace-pre-wrap">{String(parseAiSummary())}</p>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-between items-center mt-8">
                <button onClick={() => router.push('/history/index')} className={buttonSecondaryStyle}>
                  Back to History
                </button>
                <button onClick={() => router.push('/scan/index')} className={buttonPrimaryStyle}>
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