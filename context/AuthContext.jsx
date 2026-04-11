'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getProfile, registerUser, loginUser, logoutUser } from '@/lib/db'
import toast from 'react-hot-toast'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (uid) => {
    const p = await getProfile(uid)
    if (p?.banned) { await logoutUser(); toast.error('Account banned.'); setUser(null); setProfile(null); return }
    setProfile(p)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) loadProfile(u.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadProfile(u.id); else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const register = async (email, password, displayName) => {
    await registerUser(email, password, displayName)
    toast.success('Account created! Verify your email.')
  }
  const login = async (email, password) => {
    await loginUser(email, password)
    toast.success('Welcome! ようこそ')
  }
  const logout = async () => {
    await logoutUser(); setUser(null); setProfile(null)
    toast.success('Logged out. さようなら!')
  }

  const isAdmin   = profile?.role === 'admin'
  const isPremium = profile?.role === 'premium' || profile?.role === 'admin'

  return (
    <Ctx.Provider value={{ user, profile, loading, register, login, logout, isAdmin, isPremium }}>
      {children}
    </Ctx.Provider>
  )
}
export const useAuth = () => useContext(Ctx)
