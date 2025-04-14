import '../styles/globals.css'
import { UserProfileProvider } from '../contexts/UserProfileContext'
import { OCRProvider } from '../contexts/OCRContext'
import { MenuAnalysisProvider } from '../contexts/MenuAnalysisContext'
import { NavigationProvider } from '../contexts/NavigationContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'

// List of paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/', '/api/auth/callback']

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
        if (!PUBLIC_PATHS.includes(currentPath) && !session?.user) {
          console.log('[AUTH] Redirecting unauthenticated user to login')
          router.push('/login')
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
        router.push('/login')
      }
    })

    // Cleanup
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [router])

  if (loading) {
    // Show loading screen while checking auth
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    )
  }

  // Add user to pageProps for easy access in all components
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
  )
}

export default MyApp