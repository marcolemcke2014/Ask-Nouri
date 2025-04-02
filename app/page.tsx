/**
 * Home page component
 */
import Link from 'next/link';
import { Camera, History, User, ArrowRight } from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';

export default function HomePage() {
  return (
    <MainLayout title="NutriFlow">
      <div className="flex flex-col gap-6">
        {/* Hero section */}
        <section className="mt-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Make healthier menu choices<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Scan any restaurant menu and instantly see what fits your dietary needs and health goals.
          </p>
        </section>

        {/* Action buttons */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Link 
            href="/scan" 
            className="flex items-center gap-4 p-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Camera className="h-6 w-6" />
            <div className="flex-1">
              <h3 className="font-medium">Scan Menu</h3>
              <p className="text-sm opacity-90">Take a photo or upload an image</p>
            </div>
            <ArrowRight className="h-5 w-5" />
          </Link>
          
          <Link 
            href="/history" 
            className="flex items-center gap-4 p-4 bg-card text-card-foreground rounded-lg hover:bg-accent/50 transition-colors"
          >
            <History className="h-6 w-6" />
            <div className="flex-1">
              <h3 className="font-medium">View History</h3>
              <p className="text-sm text-muted-foreground">See your past scans</p>
            </div>
            <ArrowRight className="h-5 w-5" />
          </Link>
          
          <Link 
            href="/profile" 
            className="flex items-center gap-4 p-4 bg-card text-card-foreground rounded-lg hover:bg-accent/50 transition-colors"
          >
            <User className="h-6 w-6" />
            <div className="flex-1">
              <h3 className="font-medium">Profile & Preferences</h3>
              <p className="text-sm text-muted-foreground">Set your dietary needs</p>
            </div>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </section>

        {/* Recent scans preview (placeholder) */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Scans</h2>
            <Link href="/history" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          
          <div className="border rounded-lg p-6 text-center bg-card">
            <p className="text-muted-foreground">
              You haven&apos;t scanned any menus yet. Get started by scanning your first menu!
            </p>
            <Link 
              href="/scan" 
              className="mt-4 inline-block py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm"
            >
              Scan a Menu
            </Link>
          </div>
        </section>

        {/* Features highlight */}
        <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-medium mb-2">Personalized Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              Get personalized dish recommendations based on your dietary preferences and health goals.
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-medium mb-2">Nutrition Analysis</h3>
            <p className="text-sm text-muted-foreground">
              See detailed nutrition information for each dish, including calories, protein, carbs, and more.
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-medium mb-2">Healthier Alternatives</h3>
            <p className="text-sm text-muted-foreground">
              Discover healthier alternatives to dishes that don't match your dietary needs.
            </p>
          </div>
        </section>
      </div>
    </MainLayout>
  );
} 