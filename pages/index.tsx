import Head from 'next/head'
import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'
import CameraScanner from '../components/CameraScanner'
import MobileDrawer from '../components/layout/MobileDrawer'
import HamburgerButton from '../components/ui/HamburgerButton'
import { useNavigation } from '../contexts/NavigationContext'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import logger from '../lib/logger'

interface CameraScannerHandle {
  captureFrame: () => void;
}

export default function Home() {
  const cameraRef = useRef<CameraScannerHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isMenuOpen, toggleMenu } = useNavigation();
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  
  // Check if user has completed onboarding
  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        // Get current session
        logger.log('AUTH', 'Checking user session for homepage');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error('AUTH', 'Error retrieving session', sessionError);
        }
        
        if (session?.user) {
          logger.log('AUTH', `User authenticated: ${session.user.id}`);
          logger.log('ONBOARDING', `Checking onboarding status for user`, { userId: session.user.id });
          
          // Query user profile to check onboarding status
          const { data: profile, error } = await supabase
            .from('user_profile')
            .select('onboarding_complete')
            .eq('id', session.user.id)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            logger.error('ERROR', 'Failed to check onboarding status', error);
          } else if (!profile || profile.onboarding_complete === false) {
            // User hasn't completed onboarding
            logger.log('ONBOARDING', 'User has not completed onboarding');
            logger.log('ONBOARDING', 'Redirecting user to onboarding flow');
            router.push('/onboarding');
            return;
          }
          
          logger.log('ONBOARDING', 'User has completed onboarding');
          logger.log('AUTH', 'Showing homepage for authenticated user');
        } else {
          logger.log('AUTH', 'No authenticated user, showing public homepage');
        }
      } catch (err) {
        logger.error('ERROR', 'Error checking onboarding status', err);
      } finally {
        setIsCheckingOnboarding(false);
      }
    }
    
    checkOnboardingStatus();
  }, [router]);
  
  const handleScanImage = async (imageBlob: Blob) => {
    logger.log('UPLOAD', 'Image selected for scanning', { 
      size: Math.round(imageBlob.size / 1024) + ' KB',
      bytes: imageBlob.size
    });
    setIsScanning(true);
    
    try {
      // Create FormData and append the image blob
      const formData = new FormData();
      formData.append('image', imageBlob);
      
      logger.log('UPLOAD', 'Sending image to /api/save-scan endpoint');
      // Send to backend using FormData
      const response = await fetch('/api/save-scan', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        logger.log('OCR', 'OCR processing completed successfully', data);
        
        // Log the Supabase insert ID if available
        if (data.success && data.supabaseInsertId) {
          logger.log('SUPABASE', `Scan saved to database with ID: ${data.supabaseInsertId}`);
        }
        
        // Navigate to results page or show success
        logger.log('AUTH', 'Redirecting to scan results page');
        router.push('/scan?latest=true');
      } else {
        const errorData = await response.json();
        logger.error('ERROR', 'Scan processing failed', {
          error: errorData.error || 'Unknown error',
          statusCode: response.status
        });
        alert('Failed to process the menu image. Please try again.');
      }
    } catch (error) {
      logger.error('ERROR', 'Exception during scan processing', error);
      alert('An error occurred while processing the image.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      logger.warn('UPLOAD', 'No file selected in file picker');
      return;
    }
    
    logger.log('UPLOAD', 'File selected from device', {
      filename: file.name,
      type: file.type,
      size: Math.round(file.size / 1024) + ' KB'
    });
    
    // Process the selected file just like a camera capture
    handleScanImage(file);
  };

  const handleUploadClick = () => {
    logger.log('UPLOAD', 'User clicked upload button, opening file picker');
    // Trigger the hidden file input when the upload button is clicked
    fileInputRef.current?.click();
  };

  // Show loading indicator while checking onboarding status
  if (isCheckingOnboarding) {
    logger.log('AUTH', 'Showing loading indicator while checking auth/onboarding status');
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <p className="mb-2">Loading...</p>
          <div className="w-8 h-8 border-t-2 border-b-2 border-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative bg-gray-900">
      {/* Camera component providing full-screen background */}
      <CameraScanner ref={cameraRef} onCapture={handleScanImage} />
      
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
        disabled={isScanning}
      />
      
      {/* Content container with z-index to ensure it's above the camera background */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Head>
          <title>NutriFlow - AI Menu Scanner</title>
          <meta name="description" content="Scan menus, find healthy options with AI assistance" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>

        {/* Header */}
        <header className="flex justify-between items-center p-6">
          <div className="flex-1 flex justify-start">
            <HamburgerButton 
              onClick={() => {
                logger.log('AUTH', 'User toggled menu');
                toggleMenu();
              }}
              isOpen={isMenuOpen}
            />
          </div>
          <h1 className="text-xl font-medium text-white">Scan Your Menu</h1>
          <div className="flex-1 flex justify-end">
            {/* Empty div for layout balance */}
          </div>
        </header>

        {/* Empty space for future scanner overlay */}
        <div className="flex-1"></div>

        {/* Welcome Message */}
        <div className="px-6 pb-32">
          <div className="bg-white p-4 rounded-2xl w-full max-w-md mx-auto">
            <p className="text-gray-400 mb-1">Good Evening, Marco!</p>
            <p className="text-figma-green font-medium text-lg">
              Late-night cravings? We'll help you find something healthier.
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="fixed bottom-16 left-0 right-0 z-20 w-full px-6">
          <div className="w-full max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  logger.log('UPLOAD', 'User clicked scan menu button');
                  cameraRef.current?.captureFrame();
                }}
                className="backdrop-blur-lg text-white flex-1 h-14 rounded-full flex items-center justify-center focus:outline-none font-medium text-lg transition-all duration-200 ease-in-out active:scale-[0.98] hover:scale-[1.01]"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'hsla(143.8, 61.2%, 20.2%, 0.8)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.backgroundColor = 'hsla(143.8, 61.2%, 20.2%, 0.9)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(1px) scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.backgroundColor = 'hsla(143.8, 61.2%, 20.2%, 0.8)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.transform = '';
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.backgroundColor = 'hsla(143.8, 61.2%, 20.2%, 0.9)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(1px) scale(0.98)';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.backgroundColor = 'hsla(143.8, 61.2%, 20.2%, 0.8)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.transform = '';
                }}
                aria-label="Scan Menu"
                disabled={isScanning}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 5h-3.2L15 3H9L7.2 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                Scan Menu
              </button>
              
              <button
                onClick={handleUploadClick}
                className="backdrop-blur-lg text-white h-14 aspect-square rounded-full flex items-center justify-center focus:outline-none transition-all duration-200 ease-in-out active:scale-[0.98] hover:scale-[1.01]"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)'
                }}
                title="Upload Image"
                aria-label="Upload Image"
                disabled={isScanning}
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Drawer */}
      <MobileDrawer isOpen={isMenuOpen} onClose={() => {
        logger.log('AUTH', 'User closed menu');
        toggleMenu();
      }} />
    </div>
  );
} 