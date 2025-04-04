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
        
        {/* Navigation - using SVG as the actual navbar shape */}
        <div className="fixed bottom-0 left-0 right-0 h-24 z-20 overflow-visible">
          {/* SVG Navigation Shape with Notch */}
          <div className="absolute bottom-0 left-0 right-0 w-full z-10 pointer-events-none">
            <svg 
              width="100%" 
              height="83" 
              viewBox="0 0 375 83" 
              preserveAspectRatio="xMidYMax slice" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="block"
            >
              <path 
                d="M0 8.00024C0 3.58197 3.58172 0.000244141 8 0.000244141H93.75H132C140.837 0.000244141 148.02 7.33404 151.067 15.6286C155.189 26.8493 164.851 40.0002 187.5 40.0002C210.734 40.0002 220.639 26.8357 224.862 15.6112C227.973 7.34058 235.163 0.000244141 244 0.000244141H279H367C371.418 0.000244141 375 3.58197 375 8.00024V83.0002H0V8.00024Z" 
                fill="white"
              />
            </svg>
          </div>
          
          {/* Navigation content positioned relative to the SVG shape */}
          <div className="relative w-full h-20 flex items-center justify-around pt-2 z-10 pointer-events-auto">
            <div className="w-20 flex flex-col items-center">
              <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="4" height="7.5" />
                <rect x="10" y="1.5" width="4" height="21" />
                <rect x="17" y="10.5" width="4" height="12" />
              </svg>
              <span className="text-xs text-gray-400 mt-1">Stats</span>
            </div>
            
            <div className="invisible w-20">
              {/* Empty space to maintain flex spacing */}
            </div>
            
            <div className="w-20 flex flex-col items-center">
              <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="7" r="4" />
                <path d="M3 21v-2c0-3.3 2.7-6 6-6h6c3.3 0 6 2.7 6 6v2" />
              </svg>
              <span className="text-xs text-gray-400 mt-1">Profile</span>
            </div>
          </div>
          
          {/* Scan button positioned to be centered in the notch */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-[-10px] z-20">
            <button
              onClick={() => cameraRef.current?.captureFrame()}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
              aria-label="Capture Menu"
              style={{ backgroundColor: '#4CAF50' }}
            >
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="6" height="6" stroke="none" fill="white" />
              </svg>
            </button>
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