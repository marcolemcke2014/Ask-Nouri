import React from 'react';
import { useRouter } from 'next/router';
import AppShell from '../layout/AppShell';
import Button from '../ui/Button';

/**
 * Home screen with app intro and scan button
 */
export default function HomeScreen() {
  const router = useRouter();
  
  const handleScanMenu = () => {
    router.push('/scan');
  };
  
  return (
    <AppShell
      title="NutriFlow"
      fullHeight
      className="bg-gradient-to-b from-primary/90 to-primary"
    >
      <div className="flex flex-col items-center justify-between h-full text-white p-8">
        {/* Hero section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="mb-6 text-7xl">🍽️</div>
          <h1 className="text-3xl font-bold mb-4">
            Find the best meal for your health goals
          </h1>
          <p className="text-lg mb-8 opacity-90">
            Scan any menu. Get instant, personalized recommendations based on your health needs.
          </p>
        </div>
        
        {/* Call to action */}
        <div className="w-full pb-8">
          <Button
            onClick={handleScanMenu}
            variant="secondary"
            size="lg"
            fullWidth
            className="bg-white text-primary hover:bg-white/90 mb-4"
          >
            Scan a Menu
          </Button>
          
          <p className="text-center text-sm opacity-80">
            Start by scanning a restaurant menu. We'll analyze it with AI and show you the best options.
          </p>
        </div>
      </div>
    </AppShell>
  );
} 