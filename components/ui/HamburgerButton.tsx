import React from 'react';

interface HamburgerButtonProps {
  onClick: () => void;
  className?: string;
  isOpen?: boolean;
}

/**
 * A hamburger menu button that toggles the mobile drawer
 */
export default function HamburgerButton({ 
  onClick, 
  className = '',
  isOpen = false 
}: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      className={`
        w-10 h-10 rounded-xl border-2 border-white 
        flex items-center justify-center 
        transition-all duration-300
        hover:bg-white hover:bg-opacity-20 
        focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-30
        active:scale-95
        ${className}
      `}
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
        className="text-white transition-transform duration-300"
      >
        {isOpen ? (
          <>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </>
        ) : (
          <>
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </>
        )}
      </svg>
    </button>
  );
} 