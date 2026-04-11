'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function AuthGuard({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    if (adminOnly && profile?.role !== 'admin') { router.push('/'); return }
  }, [user, profile, loading])

  if (loading || !user) return (
    <div className="min-h-screen bg-shim-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-shim-primary border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return children
}
