import React from 'react';

interface ScannerButtonProps {
  onClick: () => void;
  isProcessing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Specialized button for initiating menu scans or image uploads
 * Features an upload icon and animation
 */
export default function ScannerButton({
  onClick,
  isProcessing = false,
  size = 'lg',
  className = '',
}: ScannerButtonProps) {
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  };
  
  const iconSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={isProcessing}
      className={`
        relative rounded-full bg-white shadow-lg flex items-center justify-center
        transition-all duration-200 
        ${isProcessing ? 'opacity-75' : 'opacity-100 hover:scale-105 active:scale-95'}
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label="Upload image"
    >
      {/* Upload icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${iconSizeClasses[size]} text-gray-800`}
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      
      {/* Processing animation */}
      {isProcessing && (
        <div className="absolute top-0 left-0 w-full h-full rounded-full">
          <div className="absolute inset-0 rounded-full border-4 border-primary animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-primary animate-spin"></div>
        </div>
      )}
    </button>
  );
} 