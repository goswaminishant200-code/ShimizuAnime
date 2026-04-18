'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { getAllProfiles, grantPremium, revokePremium, makeAdmin, banUser, unbanUser, postAnnouncement, getAnnouncements, removeAnnouncement, postNews, getNews, deleteNews } from '@/lib/db'
import toast from 'react-hot-toast'

const TABS = ['Overview', 'Users', 'Announcements', 'News']

const Badge = ({ role, banned }) => {
  if (banned) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400">Banned</span>
  if (role === 'admin') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-shim-gold/20 border border-shim-gold/30 text-shim-gold">Admin</span>
  if (role === 'premium') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-shim-primary/20 border border-shim-primary/30 text-shim-accent">Premium</span>
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-shim-bgalt border border-shim-border text-shim-muted">Free</span>
}

const Btn = ({ label, color, busy, onClick }) => {
  const colors = {
    gold: 'border-shim-gold/50 text-shim-gold hover:bg-shim-gold/10',
    pink: 'border-shim-primary/50 text-shim-primary hover:bg-shim-primary/10',
    red: 'border-red-500/50 text-red-400 hover:bg-red-500/10',
    green: 'border-green-500/50 text-green-400 hover:bg-green-500/10',
    gray: 'border-shim-border text-shim-textD hover:text-shim-text',
  }
  return (
    <button onClick={onClick} disabled={busy}
      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-50 cursor-pointer ${colors[color]}`}>
      {busy ? '...' : label}
    </button>
  )
}
export default function AdminPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState('Overview')
  const [users, setUsers] = useState([])
  const [anns, setAnns] = useState([])
  const [news, setNews] = useState([])
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(null)
  const [uLoad, setULoad] = useState(false)
  const [pageReady, setPageReady] = useState(false)
  const [annForm, setAnnForm] = useState({ title: '', message: '' })
  const [newsForm, setNewsForm] = useState({ title: '', content: '', image_url: '', category: 'General' })
  const [episodes, setEpisodes] = useState([])
  const [epForm, setEpForm] = useState({ anime_id: '', episode_num: '', title: '', embed_url: '', language: 'sub', quality: 'HD' })
  const [epLoading, setEpLoading] = useState(false)
  const loadEpisodes = async () => {
  const { data } = await supabase.from('episodes').select('*').order('anime_id').order('episode_num')
  setEpisodes(data || [])
  const [tab, setTab] = useState('Users')
}

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    if (profile && profile.role !== 'admin') { toast.error('Admins only'); router.push('/'); return }
    if (profile && profile.role === 'admin') {
      setPageReady(true)
      load()
      loadAnns()
      loadNews()
    }
  }, [loading, user, profile])

  const load = async () => {
    setULoad(true)
    try {
      const data = await getAllProfiles()
      setUsers(data || [])
    } catch (e) {
      toast.error('Failed to load users: ' + e.message)
    }
    setULoad(false)
  }

  const loadAnns = async () => {
    try { setAnns(await getAnnouncements() || []) } catch (e) { console.error(e) }
  }

  const loadNews = async () => {
    try { setNews(await getNews() || []) } catch (e) { console.error(e) }
  }

  const act = async (action, uid, label) => {
    setBusy(uid + action)
    try {
      if (action === 'grant') await grantPremium(uid)
      if (action === 'revoke') await revokePremium(uid)
      if (action === 'admin') await makeAdmin(uid)
      if (action === 'ban') await banUser(uid)
      if (action === 'unban') await unbanUser(uid)
      toast.success(label + ' ✓')
      await load()
    } catch (e) { toast.error('Failed: ' + e.message) }
    setBusy(null)
  }

  const submitAnn = async () => {
    if (!annForm.title || !annForm.message) { toast.error('Fill all fields'); return }
    try {
      await postAnnouncement(annForm.title, annForm.message, profile?.display_name || 'Admin')
      toast.success('Posted!'); setAnnForm({ title: '', message: '' }); loadAnns()
    } catch (e) { toast.error(e.message) }
  }

  const submitNews = async () => {
    if (!newsForm.title || !newsForm.content) { toast.error('Fill title and content'); return }
    try {
      await postNews({ ...newsForm, author: profile?.display_name || 'Admin' })
      toast.success('Published!'); setNewsForm({ title: '', content: '', image_url: '', category: 'General' }); loadNews()
    } catch (e) { toast.error(e.message) }
  }

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: users.length,
    premium: users.filter(u => u.role === 'premium').length,
    admin: users.filter(u => u.role === 'admin').length,
    banned: users.filter(u => u.banned).length,
    free: users.filter(u => u.role === 'free' && !u.banned).length,
  }

  if (loading || !pageReady) {
    return (
      <div className="min-h-screen bg-shim-bg flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-shim-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-shim-muted text-sm">
          {loading ? 'Checking auth...' : !profile ? 'Loading profile...' : 'Loading admin panel...'}
        </p>
      </div>
    )
  }
  const addEpisode = async () => {
  if (!epForm.anime_id || !epForm.episode_num || !epForm.embed_url) {
    toast.error('Anime ID, Episode Number, aur Embed URL required hai')
    return
  }
  setEpLoading(true)
  const { error } = await supabase.from('episodes').upsert({
    anime_id: epForm.anime_id,
    episode_num: parseInt(epForm.episode_num),
    title: epForm.title,
    embed_url: epForm.embed_url,
    language: epForm.language,
    quality: epForm.quality,
  })
  if (error) toast.error(error.message)
  else { toast.success('Episode saved!'); loadEpisodes() }
  setEpLoading(false)
}

const deleteEpisode = async (id) => {
  await supabase.from('episodes').delete().eq('id', id)
  toast.success('Deleted')
  loadEpisodes()
}

  return (
    <div className="min-h-screen bg-shim-bg">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-shim-gold to-shim-primary flex items-center justify-center text-xl">👑</div>
          <div>
            <h1 className="text-2xl font-bold text-shim-text">Admin Dashboard</h1>
            <p className="text-shim-muted text-sm">管理者パネル — Full Control</p>
          </div>
          <div className="ml-auto px-4 py-2 rounded-xl border border-shim-gold/30 text-shim-gold text-sm">{profile?.display_name}</div>
        </div>

        <div className="flex gap-1 mb-8 border-b border-shim-border overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-shrink-0 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${tab === t ? 'border-shim-gold text-shim-gold' : 'border-transparent text-shim-textD hover:text-shim-text'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { l: 'Total', v: stats.total, c: 'text-shim-text', i: '👥' },
                { l: 'Free', v: stats.free, c: 'text-shim-textD', i: '🆓' },
                { l: 'Premium', v: stats.premium, c: 'text-shim-gold', i: '⭐' },
                { l: 'Admins', v: stats.admin, c: 'text-shim-primary', i: '👑' },
                { l: 'Banned', v: stats.banned, c: 'text-red-400', i: '🚫' },
              ].map(s => (
                <div key={s.l} className="bg-shim-card border border-shim-border rounded-2xl p-5 text-center">
                  <div className="text-2xl mb-2">{s.i}</div>
                  <div className={`text-3xl font-bold ${s.c} mb-1`}>{s.v}</div>
                  <div className="text-xs text-shim-muted">{s.l}</div>
                </div>
              ))}
            </div>
            <div>
              <h2 className="text-base font-semibold text-shim-text mb-4">Recent Users</h2>
              <div className="space-y-2">
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-4 bg-shim-card border border-shim-border rounded-xl">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${u.role === 'admin' ? 'bg-shim-gold/20 text-shim-gold' : u.role === 'premium' ? 'bg-shim-primary/20 text-shim-accent' : 'bg-shim-bgalt text-shim-textD'}`}>
                      {u.display_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-shim-text">{u.display_name}</p>
                      <p className="text-xs text-shim-muted truncate">{u.email}</p>
                    </div>
                    <Badge role={u.role} banned={u.banned} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'Users' && (
          <div>
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-shim-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-base pl-10" />
              </div>
              <button onClick={load} className="btn-ghost px-4">↻ Refresh</button>
            </div>
            {uLoad ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-shim-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="space-y-3">
                {filtered.length === 0 && <div className="text-center py-12 text-shim-muted">{users.length === 0 ? 'No users — click Refresh' : 'No matching users'}</div>}
                {filtered.map(u => (
                  <div key={u.id} className={`p-4 rounded-2xl border ${u.banned ? 'border-red-500/30 bg-red-500/5' : 'border-shim-border bg-shim-card'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${u.role === 'admin' ? 'bg-shim-gold/20 text-shim-gold' : u.role === 'premium' ? 'bg-shim-primary/20 text-shim-accent' : 'bg-shim-bgalt text-shim-textD'}`}>
                          {u.display_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-semibold text-shim-text">{u.display_name}</p><Badge role={u.role} banned={u.banned} /></div>
                          <p className="text-xs text-shim-muted truncate">{u.email}</p>
                        </div>
                      </div>
                      {u.role !== 'admin' && (
                        <div className="flex flex-wrap gap-2">
                          {u.role === 'free'
                            ? <Btn label="Grant Premium" color="gold" busy={busy === u.id + 'grant'} onClick={() => act('grant', u.id, 'Premium granted')} />
                            : <Btn label="Revoke Premium" color="gray" busy={busy === u.id + 'revoke'} onClick={() => act('revoke', u.id, 'Premium revoked')} />}
                          <Btn label="Make Admin" color="pink" busy={busy === u.id + 'admin'} onClick={() => { if (window.confirm(`Make ${u.display_name} admin?`)) act('admin', u.id, 'Admin assigned') }} />
                          {u.banned
                            ? <Btn label="Unban" color="green" busy={busy === u.id + 'unban'} onClick={() => act('unban', u.id, 'Unbanned')} />
                            : <Btn label="Ban" color="red" busy={busy === u.id + 'ban'} onClick={() => { if (window.confirm(`Ban ${u.display_name}?`)) act('ban', u.id, 'Banned') }} />}
                        </div>
                      )}
                      {u.role === 'admin' && <span className="text-xs text-shim-gold px-3 py-1.5 rounded-lg border border-shim-gold/30">Admin account</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Announcements' && (
          <div className="space-y-8">
            <div className="glass rounded-2xl border border-shim-border p-6">
              <h2 className="text-base font-semibold text-shim-text mb-5">Post Announcement</h2>
              <div className="space-y-4">
                <div><label className="block text-sm text-shim-textD mb-2">Title</label><input type="text" value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} placeholder="Title..." className="input-base" /></div>
                <div><label className="block text-sm text-shim-textD mb-2">Message</label><textarea value={annForm.message} onChange={e => setAnnForm(f => ({ ...f, message: e.target.value }))} placeholder="Message..." rows={3} className="input-base resize-none" /></div>
                <button onClick={submitAnn} className="btn-primary">📢 Post</button>
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-shim-text mb-4">Active ({anns.length})</h2>
              {anns.length === 0 ? <p className="text-shim-muted text-sm">No announcements</p> : (
                <div className="space-y-3">
                  {anns.map(a => (
                    <div key={a.id} className="p-4 bg-shim-card border border-shim-border rounded-xl flex items-start justify-between gap-4">
                      <div><p className="font-semibold text-shim-text text-sm">{a.title}</p><p className="text-shim-textD text-sm mt-1">{a.message}</p></div>
                      <button onClick={() => removeAnnouncement(a.id).then(loadAnns)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'News' && (
          <div className="space-y-8">
            <div className="glass rounded-2xl border border-shim-border p-6">
              <h2 className="text-base font-semibold text-shim-text mb-5">Publish Article</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-sm text-shim-textD mb-2">Title</label><input type="text" value={newsForm.title} onChange={e => setNewsForm(f => ({ ...f, title: e.target.value }))} placeholder="Title..." className="input-base" /></div>
                  <div><label className="block text-sm text-shim-textD mb-2">Category</label>
                    <select value={newsForm.category} onChange={e => setNewsForm(f => ({ ...f, category: e.target.value }))} className="input-base">
                      {['General', 'New Season', 'Episode Release', 'Movie', 'Announcement', 'Review'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="block text-sm text-shim-textD mb-2">Image URL (optional)</label><input type="text" value={newsForm.image_url} onChange={e => setNewsForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." className="input-base" /></div>
                <div><label className="block text-sm text-shim-textD mb-2">Content</label><textarea value={newsForm.content} onChange={e => setNewsForm(f => ({ ...f, content: e.target.value }))} placeholder="Content..." rows={5} className="input-base resize-none" /></div>
                <button onClick={submitNews} className="btn-primary">📰 Publish</button>
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-shim-text mb-4">Published ({news.length})</h2>
              <div className="space-y-3">
                {news.map(n => (
                  <div key={n.id} className="flex gap-4 p-4 bg-shim-card border border-shim-border rounded-xl">
                    {n.image_url && <img src={n.image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap"><p className="font-semibold text-shim-text text-sm">{n.title}</p><span className="genre-tag">{n.category}</span></div>
                      <p className="text-shim-textD text-xs clamp2">{n.content}</p>
                      <p className="text-xs text-shim-muted mt-1">by {n.author}</p>
                    </div>
                    <button onClick={() => deleteNews(n.id).then(loadNews)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </div>
                ))}
                {news.length === 0 && <p className="text-shim-muted text-sm">No articles yet</p>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
// Tabs array mein add karo
'Episodes'
{tab === 'Episodes' && (
  <div className="space-y-6">
    {/* Add form */}
    <div className="glass rounded-2xl border border-shim-border p-6">
      <h3 className="text-base font-semibold text-shim-text mb-4">Add / Update Episode</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input
          placeholder="Anime MAL ID (e.g. 21)"
          value={epForm.anime_id}
          onChange={e => setEpForm(p => ({...p, anime_id: e.target.value}))}
          className="input-field"
        />
        <input
          placeholder="Episode Number (e.g. 1)"
          type="number"
          value={epForm.episode_num}
          onChange={e => setEpForm(p => ({...p, episode_num: e.target.value}))}
          className="input-field"
        />
        <input
          placeholder="Episode Title (optional)"
          value={epForm.title}
          onChange={e => setEpForm(p => ({...p, title: e.target.value}))}
          className="input-field"
        />
        <input
          placeholder="Embed URL (e.g. https://voe.sx/e/xxxxx)"
          value={epForm.embed_url}
          onChange={e => setEpForm(p => ({...p, embed_url: e.target.value}))}
          className="input-field"
        />
        <select
          value={epForm.language}
          onChange={e => setEpForm(p => ({...p, language: e.target.value}))}
          className="input-field"
        >
          <option value="sub">SUB</option>
          <option value="dub">DUB</option>
          <option value="hindi">HINDI</option>
        </select>
        <select
          value={epForm.quality}
          onChange={e => setEpForm(p => ({...p, quality: e.target.value}))}
          className="input-field"
        >
          <option value="HD">HD</option>
          <option value="FHD">1080p</option>
          <option value="SD">SD</option>
        </select>
      </div>
      <input
        placeholder="Full Embed URL"
        value={epForm.embed_url}
        onChange={e => setEpForm(p => ({...p, embed_url: e.target.value}))}
        className="input-field w-full mb-3"
      />
      <button onClick={addEpisode} disabled={epLoading}
        className="btn-primary">
        {epLoading ? 'Saving...' : 'Save Episode'}
      </button>
    </div>

    {/* Episodes list */}
    <div className="glass rounded-2xl border border-shim-border overflow-hidden">
      <div className="px-4 py-3 border-b border-shim-border">
        <h3 className="text-sm font-semibold text-shim-text">All Episodes ({episodes.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-shim-border">
              <th className="text-left px-4 py-2 text-shim-muted font-medium">Anime ID</th>
              <th className="text-left px-4 py-2 text-shim-muted font-medium">Ep</th>
              <th className="text-left px-4 py-2 text-shim-muted font-medium">Title</th>
              <th className="text-left px-4 py-2 text-shim-muted font-medium">Lang</th>
              <th className="text-left px-4 py-2 text-shim-muted font-medium">Quality</th>
              <th className="text-left px-4 py-2 text-shim-muted font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {episodes.map(ep => (
              <tr key={ep.id} className="border-b border-shim-border/50 hover:bg-white/5">
                <td className="px-4 py-2 text-shim-textD">{ep.anime_id}</td>
                <td className="px-4 py-2 text-shim-textD">{ep.episode_num}</td>
                <td className="px-4 py-2 text-shim-textD clamp1 max-w-[150px]">{ep.title || '-'}</td>
                <td className="px-4 py-2">
                  <span className="genre-tag">{ep.language}</span>
                </td>
                <td className="px-4 py-2 text-shim-textD">{ep.quality}</td>
                <td className="px-4 py-2">
                  <button onClick={() => deleteEpisode(ep.id)}
                    className="text-red-400 hover:text-red-300 text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}