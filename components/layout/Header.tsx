import React from 'react';

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
        {leftElement}
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