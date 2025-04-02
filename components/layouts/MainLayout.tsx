/**
 * Main layout component for the application
 */
import React from 'react';
import Link from 'next/link';
import { Home, Camera, User, Settings, Menu as MenuIcon } from 'lucide-react';

type MainLayoutProps = {
  children: React.ReactNode;
  showNavigation?: boolean;
  title?: string;
};

export default function MainLayout({
  children,
  showNavigation = true,
  title = 'Paquapp_v1'
}: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <MenuIcon className="md:hidden h-5 w-5" />
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>

          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/scan" className="text-muted-foreground hover:text-foreground transition-colors">
              Scan Menu
            </Link>
            <Link href="/history" className="text-muted-foreground hover:text-foreground transition-colors">
              History
            </Link>
            <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
              Profile
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/profile" className="size-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container py-4">{children}</main>

      {/* Footer navigation */}
      {showNavigation && (
        <footer className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur md:hidden">
          <div className="container flex h-16 items-center justify-around">
            <Link href="/" className="flex flex-col items-center gap-1 text-xs">
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link href="/scan" className="flex flex-col items-center gap-1 text-xs">
              <Camera className="h-5 w-5" />
              <span>Scan</span>
            </Link>
            <Link href="/history" className="flex flex-col items-center gap-1 text-xs">
              <MenuIcon className="h-5 w-5" />
              <span>History</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center gap-1 text-xs">
              <User className="h-5 w-5" />
              <span>Profile</span>
            </Link>
            <Link href="/settings" className="flex flex-col items-center gap-1 text-xs">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </div>
        </footer>
      )}
    </div>
  );
} 