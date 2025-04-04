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
        
        {/* Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white flex items-center justify-around z-20 overflow-visible shadow-md">
          {/* Custom SVG Notch */}
          <div className="absolute -top-[43px] left-0 right-0 w-full overflow-visible z-10">
            <img 
              src="/images/nav-notch.svg" 
              alt="Nav notch" 
              className="w-full h-auto" 
            />
          </div>
          
          <div className="w-20 flex flex-col items-center">
            <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="4" height="7.5" />
              <rect x="10" y="1.5" width="4" height="21" />
              <rect x="17" y="10.5" width="4" height="12" />
            </svg>
            <span className="text-xs text-gray-400 mt-1">Stats</span>
          </div>
          
          <div className="relative -top-10 z-30">
            <button
              onClick={() => cameraRef.current?.captureFrame()}
              className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center shadow-md"
              aria-label="Capture Menu"
              style={{ backgroundColor: '#4CAF50' }}
            >
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="6" height="6" stroke="none" fill="white" />
              </svg>
            </button>
          </div>
          
          <div className="w-20 flex flex-col items-center">
            <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="7" r="4" />
              <path d="M3 21v-2c0-3.3 2.7-6 6-6h6c3.3 0 6 2.7 6 6v2" />
            </svg>
            <span className="text-xs text-gray-400 mt-1">Profile</span>
          </div>
        </nav>
        
        {/* Home indicator */}
        <div className="fixed bottom-3 left-0 right-0 flex justify-center z-20">
          <div className="w-32 h-1.5 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  )
} 