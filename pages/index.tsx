import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import LoginPage from './login'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        
        if (sessionData.session?.user) {
          // User is logged in, redirect to scan page
          router.replace('/scan')
        } else {
          // User is not logged in, show login page
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to check auth status:', error)
        setLoading(false)
      }
    }
    
    checkSession()
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