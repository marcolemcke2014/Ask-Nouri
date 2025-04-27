// auth-landing.tsx - Landing page that handles authentication routing
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import LoginPage from './auth/login'

export default function AuthLanding() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // User is logged in, redirect to the scan page
          router.replace('/scan/index')
        } else {
          // User is not logged in, show login page
          setLoading(false)
        }
      }
    )
  }, [router])

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <p className="mb-2">Loading...</p>
          <div className="w-8 h-8 border-t-2 border-b-2 border-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  // Show login page if user is not authenticated
  return <LoginPage />
} 