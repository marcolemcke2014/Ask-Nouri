import React from 'react';

interface ScannerButtonProps {
  onClick: () => void;
  isProcessing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Specialized button for initiating menu scans
 * Features a camera icon and scan ring animation
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
      aria-label="Scan menu"
    >
      {/* Camera icon */}
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
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
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