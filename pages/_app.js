import '../styles/globals.css'
import { UserProfileProvider } from '../contexts/UserProfileContext'
import { OCRProvider } from '../contexts/OCRContext'
import { MenuAnalysisProvider } from '../contexts/MenuAnalysisContext'
import { NavigationProvider } from '../contexts/NavigationContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

// List of paths that don't require authentication
const PUBLIC_PATHS = [
  '/auth/login', 
  '/', 
  '/api/auth/callback', 
  '/auth/signup', 
  '/auth/choose-plan'
]

// Enable this flag to bypass authentication checks for onboarding pages during development
const DEV_MODE = process.env.NODE_ENV === 'development'

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for authenticated user on initial load and setup auth listener
  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        
        // Set user state based on session
        if (session?.user) {
          console.log('[AUTH] Found active session for user:', session.user.id)
          setUser(session.user)
        } else {
          console.log('[AUTH] No active session found')
          setUser(null)
        }
        
        // Check if user needs to be redirected to login
        const currentPath = router.pathname
        const isPublicPath = PUBLIC_PATHS.includes(currentPath);
        const isOnboardingPath = currentPath.startsWith('/onboarding') || currentPath === '/auth/payment-success'; 
        const hasSession = !!session?.user;
        
        console.log('[AUTH Check]', { currentPath, isPublicPath, hasSession, DEV_MODE, isOnboardingPath });
        
        // Simplified check: Redirect if not public, not onboarding/success, and no session
        if (!isPublicPath && !isOnboardingPath && !hasSession) { 
          console.log(`[AUTH] Redirecting unauthenticated user from restricted path (${currentPath}) to login`);
          router.push('/auth/login'); 
        }
      } catch (error) {
        console.error('[AUTH] Error initializing auth:', error.message)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Setup auth listener for changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AUTH] Auth state changed:', event)
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[AUTH] User signed in:', session.user.id)
        setUser(session.user)
      } else if (event === 'SIGNED_OUT') {
        console.log('[AUTH] User signed out')
        setUser(null)
        
        // Check conditions before redirecting
        const currentPath = router.pathname;
        const isPublicPath = PUBLIC_PATHS.includes(currentPath);
        const isOnboardingPath = currentPath.startsWith('/onboarding') || currentPath === '/auth/payment-success';
        
        // Simplified check: Redirect if not public and not onboarding/success after sign out
        if (!isPublicPath && !isOnboardingPath) {
          console.log(`[AUTH] Redirecting signed out user from restricted path (${currentPath}) to login`);
          router.push('/auth/login')
        } else {
          console.log(`[AUTH] Not redirecting from ${currentPath} after sign out (public, onboarding, or success path)`);
        }
      }
    })

    // Cleanup
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  // Keep the original dependency array for this test
  }, [router.pathname, router.isReady, router.push, router.replace]) 


  if (loading) {
    // Show loading screen while checking auth
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    )
  }

  // Restore ALL providers --> // Re-enabling providers
  return (
    <NavigationProvider>
     <UserProfileProvider>
       <OCRProvider>
         <MenuAnalysisProvider>
            <Component {...pageProps} user={user} />
         </MenuAnalysisProvider>
       </OCRProvider>
     </UserProfileProvider>
    </NavigationProvider>
  );
}

export default MyApp