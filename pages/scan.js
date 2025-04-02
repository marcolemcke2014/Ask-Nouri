import Head from 'next/head'
import Link from 'next/link'

export default function ScanPage() {
  return (
    <div className="flex flex-col min-h-screen bg-figma-green">
      <Head>
        <title>Scan Menu - NutriFlow</title>
        <meta name="description" content="Scan a menu with NutriFlow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <div className="flex-1">
          <Link href="/">
            <a className="text-white font-medium">&larr; Back</a>
          </Link>
        </div>
        <h1 className="text-xl font-medium text-white">Scan Your Menu</h1>
        <div className="flex-1 flex justify-end">
          <button className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center">
            <span className="text-white">?</span>
          </button>
        </div>
      </header>

      {/* Scanner Frame */}
      <div className="flex-1 flex items-center justify-center px-10">
        <div className="relative w-full max-w-[300px] aspect-square">
          {/* Scanner border */}
          <div className="absolute inset-0 rounded-3xl border-2 border-figma-green-light"></div>
          
          {/* Corner indicators */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-figma-green-light rounded-tl-3xl"></div>
          <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-figma-green-light rounded-tr-3xl"></div>
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-figma-green-light rounded-bl-3xl"></div>
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-figma-green-light rounded-br-3xl"></div>
          
          {/* Center line */}
          <div className="absolute top-1/2 left-[5%] w-[90%] h-0.5 bg-figma-green-light transform -translate-y-1/2"></div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="p-6 pb-24">
        <div className="bg-white p-4 rounded-2xl">
          <p className="text-gray-400 mb-1">Good Evening, Marco!</p>
          <p className="text-figma-green font-medium text-lg">
            Late-night cravings? We'll help you find something healthier.
          </p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white rounded-t-xl flex items-center justify-around">
        <div className="w-20 flex flex-col items-center">
          <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="4" height="7.5" />
            <rect x="10" y="1.5" width="4" height="21" />
            <rect x="17" y="10.5" width="4" height="12" />
          </svg>
          <span className="text-xs text-gray-400 mt-1">Stats</span>
        </div>
        
        <div className="relative -top-5">
          <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="18" />
              <path d="M3 3 L21 3 L21 21 L21 21" />
              <line x1="3" y1="15" x2="21" y2="15" />
            </svg>
          </div>
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
      <div className="fixed bottom-3 left-0 right-0 flex justify-center">
        <div className="w-32 h-1.5 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  )
} 