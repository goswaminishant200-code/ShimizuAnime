'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading])
  
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
    if (error) { console.error('Profile fetch error:', error); return }
    if (data?.banned) {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      window.location.href = '/login?banned=true'
      return
    }
    setProfile(data)
  } catch(e) {
    console.error('loadProfile exception:', e)
  }
}

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) {
        loadProfile(u.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadProfile(u.id)
      else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const register = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName } }
    })
    if (error) throw error
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        display_name: displayName,
        role: 'free',
        banned: false,
        mal_link: '',
        anilist_link: ''
      })
    }
    toast.success('Account created!')
    return data
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    toast.success('Welcome! ようこそ')
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null)
    toast.success('Logged out!')
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
