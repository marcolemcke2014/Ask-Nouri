import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export default function EditProfile({ user }: { user: User | null }) {
  const router = useRouter();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('[PROFILE] No user session found, redirecting to login');
        router.push('/auth/login');
      }
    };
    
    checkAuth();
  }, [router]);

  console.log('[PROFILE] Rendering edit profile page (placeholder)');

  const handleBack = () => {
    router.push('/profile');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    router.push('/profile/index');
  };

  if (!user) {
    return null; // Don't render if not authenticated
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Edit Profile - NutriFlow</title>
      </Head>
      
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">NutriFlow</h1>
          <button
            onClick={() => {
              supabase.auth.signOut();
              router.push('/login');
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Edit Profile</h2>
          
          <div className="text-center p-8 border border-gray-200 rounded-lg mb-8">
            <p className="text-gray-600 mb-4">
              Profile editing functionality will be available in a future update.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Currently, you can edit your preferences through the profile page.
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 