import Head from 'next/head'
import Link from 'next/link'
import { useRef, useEffect } from 'react'
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
          <div className="flex-1 flex justify-start">
            <button className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <h1 className="text-xl font-medium text-white">Scan Your Menu</h1>
          <div className="flex-1 flex justify-end">
            <button className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center">
              <span className="text-white">?</span>
            </button>
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
        
        {/* Scan Menu Button */}
        <div className="fixed bottom-16 left-0 right-0 z-20 w-full px-6">
          <button
            onClick={() => cameraRef.current?.captureFrame()}
            className="backdrop-blur-lg text-white w-full max-w-md mx-auto h-14 rounded-full flex items-center justify-center focus:outline-none font-medium text-lg transition-all duration-200 ease-in-out active:scale-[0.98] hover:scale-[1.01]"
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
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 5h-3.2L15 3H9L7.2 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            Scan Menu
          </button>
        </div>
      </div>
    </div>
  )
} 