'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()
      if (error) { console.error('Profile error:', error); setLoading(false); return }
      if (data?.banned) {
        await supabase.auth.signOut()
        setUser(null); setProfile(null); setLoading(false)
        toast.error('Account banned. Contact admin.')
        return
      }
      setProfile(data)
    } catch(e) {
      console.error('loadProfile error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) loadProfile(u.id)
      else setLoading(false)
    })

    // Ban check every 60 seconds
    const banInterval = setInterval(async () => {
      const { data } = await supabase.auth.getSession()
      const u = data.session?.user ?? null
      if (u) loadProfile(u.id)
    }, 60000)

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadProfile(u.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => {
      sub.subscription.unsubscribe()
      clearInterval(banInterval)
    }
  }, [])

  const register = async (email, password, displayName) => {
    // Input sanitization
    const cleanName = displayName.trim().slice(0, 30).replace(/[<>]/g, '')
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanName) throw new Error('Display name required')
    if (password.length < 6) throw new Error('Password min 6 characters')

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { display_name: cleanName } }
    })
    if (error) throw error

    // Create profile only if user confirmed (or email confirm disabled)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: cleanEmail,
        display_name: cleanName,
        role: 'free',
        banned: false,
        bio: '',
        photo_url: '',
        mal_link: '',
        anilist_link: ''
      })
    }

    // Check if email confirmation needed
    if (data.user && !data.session) {
      // Email confirmation required
      return { needsConfirmation: true }
    }

    return { needsConfirmation: false }
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    })
    if (error) throw error
    toast.success('Welcome back! ようこそ')
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null)
    toast.success('Logged out! さようなら')
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