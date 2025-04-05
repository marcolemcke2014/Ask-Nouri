import React from 'react';
import Header from './Header';
import MobileDrawer from './MobileDrawer';
import { useNavigation } from '@/contexts/NavigationContext';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  noHeader?: boolean;
  transparentHeader?: boolean;
  fullHeight?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

/**
 * Main app shell component providing consistent layout
 */
export default function AppShell({
  children,
  title,
  leftElement,
  rightElement,
  noHeader = false,
  transparentHeader = false,
  fullHeight = false,
  className = '',
  headerClassName = '',
  contentClassName = '',
}: AppShellProps) {
  const { isMenuOpen, closeMenu } = useNavigation();
  
  return (
    <div className={`flex flex-col w-full bg-gray-50 ${fullHeight ? 'h-full min-h-screen' : ''} ${className}`}>
      {!noHeader && (
        <Header
          title={title}
          leftElement={leftElement}
          rightElement={rightElement}
          transparent={transparentHeader}
          className={headerClassName}
        />
      )}
      
      <main className={`flex-1 w-full ${contentClassName}`}>
        {children}
      </main>
      
      {/* Mobile Drawer */}
      <MobileDrawer isOpen={isMenuOpen} onClose={closeMenu} />
    </div>
  );
} 