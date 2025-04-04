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
          <div className="bg-white p-4 rounded-2xl max-w-[95%] mx-auto">
            <p className="text-gray-400 mb-1">Good Evening, Marco!</p>
            <p className="text-figma-green font-medium text-lg">
              Late-night cravings? We'll help you find something healthier.
            </p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white rounded-t-xl flex items-center justify-around z-20">
          <div className="w-20 flex flex-col items-center">
            <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="4" height="7.5" />
              <rect x="10" y="1.5" width="4" height="21" />
              <rect x="17" y="10.5" width="4" height="12" />
            </svg>
            <span className="text-xs text-gray-400 mt-1">Stats</span>
          </div>
          
          <div className="relative -top-5">
            <button
              onClick={() => cameraRef.current?.captureFrame()}
              className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40"
              aria-label="Capture Menu"
            >
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" />
                <path d="M3 3 L21 3 L21 21 L21 21" />
                <line x1="3" y1="15" x2="21" y2="15" />
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