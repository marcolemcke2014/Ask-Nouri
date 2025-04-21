import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export default function Dashboard({ user }: { user: User | null }) {
  const router = useRouter();
  
  // Redirect to login if no user
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };
  
  if (!user) {
    return null; // Don't render anything while redirecting
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Dashboard - NutriFlow</title>
      </Head>
      
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">NutriFlow</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {user.user_metadata?.full_name || user.email}</h2>
          <p className="text-gray-600 mb-6">This is your personalized dashboard.</p>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Your Account</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Account ID:</span> {user.id.substring(0, 8)}...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 