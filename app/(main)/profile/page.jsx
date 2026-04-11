'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getWatchlist, getDownloads, updateProfile } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const TABS = ['Watchlist', 'Downloads', 'Settings']

export default function ProfilePage() {
  const { user, profile, isPremium, isAdmin, loading } = useAuth()
  const router  = useRouter()
  const fileRef = useRef(null)

  const [tab,       setTab]       = useState('Watchlist')
  const [watchlist, setWatchlist] = useState([])
  const [downloads, setDownloads] = useState([])
  const [dataLoad,  setDataLoad]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form,      setForm]      = useState({
    display_name: '',
    bio:          '',
    mal_link:     '',
    anilist_link: '',
    photo_url:    '',
  })

  useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading])

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        bio:          profile.bio          || '',
        mal_link:     profile.mal_link     || '',
        anilist_link: profile.anilist_link || '',
        photo_url:    profile.photo_url    || '',
      })
    }
  }, [profile])

  useEffect(() => {
    if (!user) return
    setDataLoad(true)
    Promise.all([
      getWatchlist(user.id).catch(() => []),
      getDownloads(user.id).catch(() => []),
    ]).then(([wl, dl]) => { setWatchlist(wl); setDownloads(dl) })
      .finally(() => setDataLoad(false))
  }, [user])

  // Upload PFP to Supabase Storage
  const handlePFP = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    if (!file.type.startsWith('image/')) { toast.error('Only images allowed'); return }

    setUploading(true)
    try {
      const ext      = file.name.split('.').pop()
      const filename = `${user.id}/avatar.${ext}`

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(filename, file, { upsert: true })

      if (upErr) throw upErr

      const { data } = supabase.storage.from('avatars').getPublicUrl(filename)
      const url      = data.publicUrl + '?t=' + Date.now()

      setForm(f => ({ ...f, photo_url: url }))
      await updateProfile(user.id, { photo_url: url })
      toast.success('Profile picture updated ✓')
    } catch (e) {
      toast.error('Upload failed: ' + e.message)
    }
    setUploading(false)
  }

  const save = async () => {
    if (!form.display_name.trim()) { toast.error('Display name required'); return }
    setSaving(true)
    try {
      await updateProfile(user.id, {
        display_name: form.display_name.trim(),
        bio:          form.bio.trim(),
        mal_link:     form.mal_link.trim(),
        anilist_link: form.anilist_link.trim(),
      })
      toast.success('Profile saved ✓')
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }

  if (loading || !user) return (
    <div className="min-h-screen bg-shim-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-shim-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const avatar = form.photo_url || profile?.photo_url

  return (
    <div className="min-h-screen bg-shim-bg">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Profile Hero Card */}
        <div className="glass rounded-2xl border border-shim-border overflow-hidden mb-8">
          {/* Cover banner */}
          <div className="h-28 sm:h-36 relative" style={{ background: 'linear-gradient(135deg,#1a0a1a,#12122a,#0e0e1f)' }}>
            <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 30% 50%,#c8446a 0%,transparent 70%)' }} />
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-24 h-24 rounded-2xl border-4 overflow-hidden flex items-center justify-center text-3xl font-bold shadow-xl ${isPremium ? 'border-shim-gold bg-gradient-to-br from-shim-gold/30 to-shim-primary/30' : 'border-shim-bg bg-shim-primary/20'}`}>
                  {avatar
                    ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-shim-accent">{profile?.display_name?.[0]?.toUpperCase() || 'U'}</span>
                  }
                </div>
                {/* Upload button */}
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-shim-primary hover:bg-shim-primaryH flex items-center justify-center shadow-lg transition-all disabled:opacity-60">
                  {uploading
                    ? <svg className="w-3.5 h-3.5 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  }
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePFP} className="hidden" />
              </div>

              {/* Name + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold text-shim-text">{profile?.display_name}</h1>
                  {isAdmin && <span className="px-2.5 py-0.5 rounded-full bg-shim-gold/20 border border-shim-gold/30 text-shim-gold text-xs font-medium">👑 Admin</span>}
                  {isPremium && !isAdmin && <span className="px-2.5 py-0.5 rounded-full bg-shim-primary/20 border border-shim-primary/30 text-shim-accent text-xs font-medium">⭐ Premium</span>}
                  {!isPremium && !isAdmin && <span className="px-2.5 py-0.5 rounded-full bg-shim-bgalt border border-shim-border text-shim-muted text-xs">Free</span>}
                </div>
                <p className="text-shim-muted text-sm">{profile?.email}</p>
                {profile?.bio && <p className="text-shim-textD text-sm mt-2 leading-relaxed">{profile.bio}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {profile?.Anime_List && (
                  <a href={profile.Anime_List} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 text-xs hover:bg-blue-500/10 transition-all">MAL ↗</a>
                )}
                {profile?.Anime_Profile && (
                  <a href={profile.Anime_Profile} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-shim-primary/30 text-shim-accent text-xs hover:bg-shim-primary/10 transition-all">AniList ↗</a>
                )}
                {!isPremium && (
                  <Link href="/premium" className="btn-primary text-xs px-4 py-2">⭐ Upgrade</Link>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 flex-wrap border-t border-shim-border pt-4">
              <div className="text-center">
                <p className="text-lg font-bold text-shim-text">{watchlist.length}</p>
                <p className="text-xs text-shim-muted">Watchlist</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-shim-text">{downloads.length}</p>
                <p className="text-xs text-shim-muted">Downloads</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-shim-text capitalize">{profile?.role || 'free'}</p>
                <p className="text-xs text-shim-muted">Account Type</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-shim-text">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                </p>
                <p className="text-xs text-shim-muted">Joined</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-shim-border">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${tab === t ? 'border-shim-primary text-shim-primary' : 'border-transparent text-shim-textD hover:text-shim-text'}`}>
              {t}
              {t === 'Watchlist' && watchlist.length > 0 && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-shim-primary/20 text-shim-accent">{watchlist.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* WATCHLIST */}
        {tab === 'Watchlist' && (
          dataLoad ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-shim-card rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-[3/4] bg-shim-bgalt" />
                  <div className="p-3 space-y-2"><div className="h-3 bg-shim-bgalt rounded w-3/4" /></div>
                </div>
              ))}
            </div>
          ) : watchlist.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📚</div>
              <p className="text-shim-textD font-medium">Watchlist empty hai</p>
              <p className="text-shim-muted text-sm mt-1">Anime browse karo aur + Watchlist dabao</p>
              <Link href="/catalog" className="inline-block mt-4 btn-primary text-sm">Browse Catalog</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchlist.map(a => (
                <Link key={a.anime_id} href={`/anime/${a.anime_id}`} className="group block">
                  <div className="anime-card bg-shim-card border border-shim-border rounded-xl overflow-hidden">
                    <div className="relative aspect-[3/4]">
                      <img src={a.image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/70">
                        <span className="text-shim-gold text-xs">★</span>
                        <span className="text-shim-gold text-xs font-bold">{a.score}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium text-shim-text clamp2 group-hover:text-shim-accent transition-colors">{a.title}</p>
                      <p className="text-xs text-shim-muted mt-1">{a.episodes} eps</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* DOWNLOADS */}
        {tab === 'Downloads' && (
          !isPremium ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">⭐</div>
              <p className="text-shim-textD font-medium">Download history Premium feature hai</p>
              <Link href="/premium" className="inline-block mt-4 btn-primary text-sm">Upgrade to Premium</Link>
            </div>
          ) : downloads.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📥</div>
              <p className="text-shim-textD">No downloads yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {downloads.map(d => (
                <div key={d.anime_id} className="flex items-center gap-4 p-4 bg-shim-card border border-shim-border rounded-xl hover:border-shim-primary/30 transition-all">
                  <img src={d.image} alt={d.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-shim-text">{d.title}</p>
                    <p className="text-xs text-shim-muted">{new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  <Link href={`/anime/${d.anime_id}`} className="text-xs text-shim-primary hover:text-shim-accent transition-colors flex-shrink-0">View →</Link>
                </div>
              ))}
            </div>
          )
        )}

        {/* SETTINGS */}
        {tab === 'Settings' && (
          <div className="max-w-lg">
            <div className="glass rounded-2xl border border-shim-border p-6 space-y-5">
              <h2 className="text-base font-semibold text-shim-text mb-2">Edit Profile</h2>

              {/* Avatar preview in settings */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-shim-border flex items-center justify-center bg-shim-card flex-shrink-0">
                  {avatar
                    ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-2xl font-bold text-shim-accent">{profile?.display_name?.[0]?.toUpperCase() || 'U'}</span>
                  }
                </div>
                <div>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="btn-ghost text-sm mb-1 disabled:opacity-60">
                    {uploading ? 'Uploading...' : '📷 Change Photo'}
                  </button>
                  <p className="text-xs text-shim-muted">JPG, PNG — max 2MB</p>
                </div>
              </div>

              <div className="sakura-div" />

              <div>
                <label className="block text-sm font-medium text-shim-textD mb-2">Display Name</label>
                <input type="text" value={form.display_name}
                  onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                  className="input-base" placeholder="Your name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-shim-textD mb-2">Bio</label>
                <textarea value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell something about yourself..."
                  rows={3} maxLength={200}
                  className="input-base resize-none" />
                <p className="text-xs text-shim-muted mt-1 text-right">{form.bio.length}/200</p>
              </div>

              <div className="sakura-div" />

              <div>
                <label className="block text-sm font-medium text-shim-textD mb-2">
                  MyAnimeList Profile URL
                </label>
                <input type="url" value={form.mal_link}
                  onChange={e => setForm(f => ({ ...f, mal_link: e.target.value }))}
                  placeholder="https://myanimelist.net/profile/yourname"
                  className="input-base" />
              </div>

              <div>
                <label className="block text-sm font-medium text-shim-textD mb-2">
                  AniList Profile URL
                </label>
                <input type="url" value={form.anilist_link}
                  onChange={e => setForm(f => ({ ...f, anilist_link: e.target.value }))}
                  placeholder="https://anilist.co/user/yourname"
                  className="input-base" />
              </div>

              <button onClick={save} disabled={saving} className="btn-primary w-full">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              <div className="pt-2 border-t border-shim-border space-y-1">
                <p className="text-xs text-shim-muted">Email: {profile?.email}</p>
                <p className="text-xs text-shim-muted">
                  Joined: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                </p>
                <p className="text-xs text-shim-muted capitalize">Role: {profile?.role}</p>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}