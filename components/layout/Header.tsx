import React from 'react';
import { useNavigation } from '../../contexts/NavigationContext';

interface HeaderProps {
  title?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  transparent?: boolean;
  className?: string;
}

/**
 * App header component with customizable elements
 */
export default function Header({
  title = 'NutriFlow',
  leftElement,
  rightElement,
  transparent = false,
  className = '',
}: HeaderProps) {
  const { toggleMenu } = useNavigation();
  
  // Default hamburger menu button
  const defaultLeftElement = (
    <button 
      onClick={toggleMenu}
      className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
      aria-label="Open menu"
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
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );

  return (
    <header 
      className={`
        w-full flex items-center justify-between h-16 px-4 
        ${transparent 
          ? 'bg-transparent text-white' 
          : 'bg-white text-gray-800 shadow-sm'
        }
        ${className}
      `}
    >
      <div className="flex-1 flex items-center">
        {leftElement || defaultLeftElement}
      </div>
      
      <div className="flex-1 text-center">
        <h1 className="text-xl font-bold truncate">{title}</h1>
      </div>
      
      <div className="flex-1 flex items-center justify-end">
        {rightElement}
      </div>
    </header>
  );
} 