'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getWatchlist, getDownloads, updateProfile } from '@/lib/db'
import toast from 'react-hot-toast'
import AuthGuard from '@/components/AuthGuard'
const TABS = ['Watchlist','Downloads','Settings']

export default function ProfilePage() {
  const { user, profile, isPremium, isAdmin, loading } = useAuth()
  const router = useRouter()
  const [tab,      setTab]      = useState('Watchlist')
  const [watchlist,setWatchlist]= useState([])
  const [downloads,setDownloads]= useState([])
  const [dataLoad, setDataLoad] = useState(false)
  const [form,     setForm]     = useState({display_name:'',mal_link:'',anilist_link:''})
  const [saving,   setSaving]   = useState(false)

  useEffect(()=>{ if (!loading&&!user) router.push('/login') },[user,loading])
  useEffect(()=>{ if (profile) setForm({display_name:profile.display_name||'',mal_link:profile.mal_link||'',anilist_link:profile.anilist_link||''}) },[profile])

  useEffect(()=>{
    if (!user) return
    setDataLoad(true)
    Promise.all([getWatchlist(user.id).catch(()=>[]),getDownloads(user.id).catch(()=>[])])
      .then(([wl,dl])=>{ setWatchlist(wl); setDownloads(dl) })
      .finally(()=>setDataLoad(false))
  },[user])

  const save = async () => {
    if (!form.display_name.trim()) { toast.error('Display name required'); return }
    setSaving(true)
    try {
      await updateProfile(user.id,{display_name:form.display_name.trim(),mal_link:form.mal_link.trim(),anilist_link:form.anilist_link.trim()})
      toast.success('Profile updated ✓')
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }

  if (loading||!user) return <div className="min-h-screen bg-shim-bg flex items-center justify-center"><div className="w-8 h-8 border-2 border-shim-primary border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="min-h-screen bg-shim-bg">
      <Navbar/>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Profile card */}
        <div className="glass rounded-2xl border border-shim-border p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0 ${isPremium?'bg-gradient-to-br from-shim-gold to-shim-primary text-white':'bg-shim-primary/20 text-shim-accent'}`}>
              {profile?.display_name?.[0]?.toUpperCase()||'U'}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-shim-text">{profile?.display_name}</h1>
                {isAdmin&&<span className="px-3 py-1 rounded-full bg-shim-gold/20 border border-shim-gold/30 text-shim-gold text-xs font-medium">👑 Admin</span>}
                {isPremium&&!isAdmin&&<span className="px-3 py-1 rounded-full bg-shim-primary/20 border border-shim-primary/30 text-shim-accent text-xs font-medium">⭐ Premium</span>}
                {!isPremium&&!isAdmin&&<span className="px-3 py-1 rounded-full bg-shim-bgalt border border-shim-border text-shim-muted text-xs">Free</span>}
              </div>
              <p className="text-shim-muted text-sm">{profile?.email}</p>
              <div className="flex items-center gap-4 mt-2 justify-center sm:justify-start flex-wrap text-xs">
                <span className="text-shim-textD">{watchlist.length} in watchlist</span>
                {profile?.mal_link&&<a href={profile.mal_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">MAL ↗</a>}
                {profile?.anilist_link&&<a href={profile.anilist_link} target="_blank" rel="noopener noreferrer" className="text-shim-accent hover:text-shim-primary transition-colors">AniList ↗</a>}
              </div>
            </div>
            {!isPremium&&<Link href="/premium" className="btn-primary flex-shrink-0 text-sm">⭐ Upgrade</Link>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-shim-border">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${tab===t?'border-shim-primary text-shim-primary':'border-transparent text-shim-textD hover:text-shim-text'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Watchlist */}
        {tab==='Watchlist'&&(
          dataLoad?(
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_,i)=><div key={i} className="bg-shim-card rounded-xl overflow-hidden animate-pulse"><div className="aspect-[3/4] bg-shim-bgalt"/><div className="p-3 space-y-2"><div className="h-3 bg-shim-bgalt rounded w-3/4"/></div></div>)}
            </div>
          ) : watchlist.length===0?(
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📚</div>
              <p className="text-shim-textD font-medium">Your watchlist is empty</p>
              <Link href="/catalog" className="inline-block mt-4 btn-primary text-sm">Browse Catalog</Link>
            </div>
          ):(
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {watchlist.map(a=>(
                <Link key={a.anime_id} href={`/anime/${a.anime_id}`} className="group block">
                  <div className="anime-card bg-shim-card border border-shim-border rounded-xl overflow-hidden">
                    <div className="relative aspect-[3/4]">
                      <img src={a.image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/70"><span className="text-shim-gold text-xs">★</span><span className="text-shim-gold text-xs font-bold">{a.score}</span></div>
                    </div>
                    <div className="p-3"><p className="text-xs font-medium text-shim-text clamp2 group-hover:text-shim-accent transition-colors">{a.title}</p><p className="text-xs text-shim-muted mt-1">{a.episodes} eps</p></div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Downloads */}
        {tab==='Downloads'&&(
          !isPremium?(
            <div className="text-center py-16">
              <div className="text-5xl mb-4">⭐</div>
              <p className="text-shim-textD font-medium">Download history is a Premium feature</p>
              <Link href="/premium" className="inline-block mt-4 btn-primary text-sm">Upgrade to Premium</Link>
            </div>
          ) : downloads.length===0?(
            <div className="text-center py-16"><div className="text-5xl mb-4">📥</div><p className="text-shim-textD">No downloads yet</p></div>
          ):(
            <div className="space-y-3">
              {downloads.map(d=>(
                <div key={d.anime_id} className="flex items-center gap-4 p-4 bg-shim-card border border-shim-border rounded-xl">
                  <img src={d.image} alt={d.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0"/>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-shim-text">{d.title}</p><p className="text-xs text-shim-muted">{new Date(d.created_at).toLocaleDateString()}</p></div>
                  <Link href={`/anime/${d.anime_id}`} className="text-xs text-shim-primary hover:text-shim-accent transition-colors">View</Link>
                </div>
              ))}
            </div>
          )
        )}

        {/* Settings */}
        {tab==='Settings'&&(
          <div className="max-w-lg space-y-5">
            <div><label className="block text-sm text-shim-textD mb-2">Display Name</label><input type="text" value={form.display_name} onChange={e=>setForm(f=>({...f,display_name:e.target.value}))} className="input-base"/></div>
            <div><label className="block text-sm text-shim-textD mb-2">MyAnimeList URL</label><input type="url" value={form.mal_link} onChange={e=>setForm(f=>({...f,mal_link:e.target.value}))} placeholder="https://myanimelist.net/profile/..." className="input-base"/></div>
            <div><label className="block text-sm text-shim-textD mb-2">AniList URL</label><input type="url" value={form.anilist_link} onChange={e=>setForm(f=>({...f,anilist_link:e.target.value}))} placeholder="https://anilist.co/user/..." className="input-base"/></div>
            <button onClick={save} disabled={saving} className="btn-primary">{saving?'Saving...':'Save Changes'}</button>
            <div className="pt-4 border-t border-shim-border space-y-1">
              <p className="text-xs text-shim-muted">Email: {profile?.email}</p>
              <p className="text-xs text-shim-muted">Joined: {profile?.created_at?new Date(profile.created_at).toLocaleDateString():''}</p>
              <p className="text-xs text-shim-muted">Role: {profile?.role}</p>
            </div>
          </div>
        )}
      </main>
      <Footer/>
    </div>
  )
}
