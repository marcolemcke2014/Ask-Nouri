import Head from 'next/head'
import Link from 'next/link'
import { useRef } from 'react'
import CameraScanner from '../components/CameraScanner'

export default function Home() {
  const cameraRef = useRef();

  const handleScanImage = (imageBlob) => {
    console.log('Image captured:', imageBlob);
    // Later: send to MediaPipe OCR or backend
  };

  return (
    <div className="flex flex-col min-h-screen relative bg-gray-900">
      {/* Camera component providing full-screen background */}
      <CameraScanner ref={cameraRef} onCapture={handleScanImage} />
      
      {/* Content container with z-index to ensure it's above the camera background */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Head>
          <title>NutriFlow - AI Menu Scanner</title>
          <meta name="description" content="Scan menus, find healthy options with AI assistance" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>

        {/* Header */}
        <header className="flex justify-between items-center p-6">
          <div className="flex-1"></div>
          <h1 className="text-xl font-medium text-white">Scan Your Menu</h1>
          <div className="flex-1 flex justify-end">
            <button className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center">
              <span className="text-white">?</span>
            </button>
          </div>
        </header>

        {/* Empty space for future scanner overlay */}
        <div className="flex-1"></div>

        {/* Welcome Message - adjusted with more bottom padding and responsive width */}
        <div className="px-6 pb-32">
          <div className="bg-white p-4 rounded-2xl max-w-[99%] mx-auto">
            <p className="text-gray-400 mb-1">Good Evening, Marco!</p>
            <p className="text-figma-green font-medium text-lg">
              Late-night cravings? We'll help you find something healthier.
            </p>
          </div>
        </div>
        
        {/* Navigation Bar Container - Fixed positioning and max width */}
        <div className="fixed bottom-0 left-0 right-0 z-20">
          <div className="mx-auto w-full max-w-md relative">
            {/* Navigation Bar - With SVG notch */}
            <nav className="relative h-24 overflow-visible">
              {/* 315px width SVG - Used as default for smaller screens */}
              <div className="absolute inset-x-0 bottom-0 z-10 block 415:hidden">
                <img 
                  src="/images/nav-notches/NavNotch_315.svg" 
                  className="w-full h-auto" 
                  alt="Navigation bar" 
                />
              </div>
              
              {/* 415px width SVG */}
              <div className="absolute inset-x-0 bottom-0 z-10 hidden 415:block 535:hidden">
                <img 
                  src="/images/nav-notches/NavNotch_415.svg" 
                  className="w-full h-auto" 
                  alt="Navigation bar" 
                />
              </div>
              
              {/* 535px width SVG */}
              <div className="absolute inset-x-0 bottom-0 z-10 hidden 535:block 615:hidden">
                <img 
                  src="/images/nav-notches/NavNotch_535.svg" 
                  className="w-full h-auto" 
                  alt="Navigation bar" 
                />
              </div>
              
              {/* 615px and up - Use this as the default for wider screens */}
              <div className="absolute inset-x-0 bottom-0 z-10 hidden 615:block">
                <img 
                  src="/images/nav-notches/NavNotch_615.svg" 
                  className="w-full h-auto" 
                  alt="Navigation bar" 
                />
              </div>
              
              {/* Navigation Content - Positioned above the SVG */}
              <div className="relative z-20 h-full flex items-center justify-around pt-3">
                {/* Stats */}
                <div className="w-20 flex flex-col items-center">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="4" height="7.5" />
                    <rect x="10" y="1.5" width="4" height="21" />
                    <rect x="17" y="10.5" width="4" height="12" />
                  </svg>
                  <span className="text-xs text-gray-400 mt-1">Stats</span>
                </div>
                
                {/* Center Spacer */}
                <div className="invisible w-20">
                  {/* Empty space to maintain flex spacing */}
                </div>
                
                {/* Profile */}
                <div className="w-20 flex flex-col items-center">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M3 21v-2c0-3.3 2.7-6 6-6h6c3.3 0 6 2.7 6 6v2" />
                  </svg>
                  <span className="text-xs text-gray-400 mt-1">Profile</span>
                </div>
              </div>
              
              {/* Scan Button - Positioned to sit in the notch with higher z-index */}
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 z-30">
                <button
                  onClick={() => cameraRef.current?.captureFrame()}
                  className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg focus:outline-none"
                  aria-label="Capture Menu"
                  style={{ backgroundColor: '#4CAF50' }}
                >
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="6" height="6" stroke="none" fill="white" />
                  </svg>
                </button>
              </div>
            </nav>
          </div>
        </div>
        
        {/* Home indicator */}
        <div className="fixed bottom-3 left-0 right-0 flex justify-center z-30">
          <div className="w-32 h-1.5 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  )
} 