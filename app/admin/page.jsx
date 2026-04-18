'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { getAllProfiles, grantPremium, revokePremium, makeAdmin, banUser, unbanUser, postAnnouncement, getAnnouncements, removeAnnouncement, postNews, getNews, deleteNews } from '@/lib/db'
import toast from 'react-hot-toast'

const TABS = ['Overview', 'Users', 'Announcements', 'News', 'Episodes']

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
  const csvRef = useRef()

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
  const [epFilter, setEpFilter] = useState('')
  const [epLoading, setEpLoading] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvPreview, setCsvPreview] = useState([])
  const [epForm, setEpForm] = useState({
    anime_id: '', episode_num: '', title: '',
    url_sub: '', url_dub: '', url_hindi: '', url_tamil: '', url_telugu: ''
  })

  const loadEpisodes = async () => {
    const { data } = await supabase.from('episodes').select('*').order('anime_id').order('episode_num')
    setEpisodes(data || [])
  }

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    if (profile && profile.role !== 'admin') { toast.error('Admins only'); router.push('/'); return }
    if (profile && profile.role === 'admin') {
      setPageReady(true)
      load(); loadAnns(); loadNews(); loadEpisodes()
    }
  }, [loading, user, profile])

  const load = async () => {
    setULoad(true)
    try { setUsers(await getAllProfiles() || []) } catch (e) { toast.error('Failed: ' + e.message) }
    setULoad(false)
  }
  const loadAnns = async () => { try { setAnns(await getAnnouncements() || []) } catch (e) { console.error(e) } }
  const loadNews = async () => { try { setNews(await getNews() || []) } catch (e) { console.error(e) } }

  const act = async (action, uid, label) => {
    setBusy(uid + action)
    try {
      if (action === 'grant') await grantPremium(uid)
      if (action === 'revoke') await revokePremium(uid)
      if (action === 'admin') await makeAdmin(uid)
      if (action === 'ban') await banUser(uid)
      if (action === 'unban') await unbanUser(uid)
      toast.success(label + ' ✓'); await load()
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

  const saveEpisode = async () => {
    if (!epForm.anime_id || !epForm.episode_num) { toast.error('Anime ID aur Episode Number required'); return }
    if (!epForm.url_sub && !epForm.url_dub && !epForm.url_hindi && !epForm.url_tamil && !epForm.url_telugu) {
      toast.error('Kam se kam ek URL daalo'); return
    }
    setEpLoading(true)
    const { error } = await supabase.from('episodes').upsert({
      anime_id: String(epForm.anime_id),
      episode_num: parseInt(epForm.episode_num),
      title: epForm.title,
      url_sub: epForm.url_sub,
      url_dub: epForm.url_dub,
      url_hindi: epForm.url_hindi,
      url_tamil: epForm.url_tamil,
      url_telugu: epForm.url_telugu,
    }, { onConflict: 'anime_id,episode_num' })
    if (error) toast.error(error.message)
    else {
      toast.success('Episode saved!')
      setEpForm(p => ({ ...p, episode_num: String(parseInt(p.episode_num) + 1), title: '', url_sub: '', url_dub: '', url_hindi: '', url_tamil: '', url_telugu: '' }))
      loadEpisodes()
    }
    setEpLoading(false)
  }

  const downloadTemplate = () => {
    const csv = 'anime_id,episode_num,title,url_sub,url_dub,url_hindi,url_tamil,url_telugu\n21,1,Episode 1,https://voe.sx/e/xxx,,,,'
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'shimizu_episodes_template.csv'
    a.click()
  }

  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim())
      const obj = {}
      headers.forEach((h, i) => obj[h] = vals[i] || '')
      return obj
    }).filter(r => r.anime_id && r.episode_num)
  }

  const onCsvSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCsvPreview(parseCSV(ev.target.result))
    reader.readAsText(file)
  }

  const importCSV = async () => {
    if (csvPreview.length === 0) { toast.error('Pehle CSV select karo'); return }
    setCsvLoading(true)
    const rows = csvPreview.map(r => ({
      anime_id: String(r.anime_id),
      episode_num: parseInt(r.episode_num),
      title: r.title || '',
      url_sub: r.url_sub || '',
      url_dub: r.url_dub || '',
      url_hindi: r.url_hindi || '',
      url_tamil: r.url_tamil || '',
      url_telugu: r.url_telugu || '',
    }))
    const batchSize = 50
    let imported = 0
    for (let i = 0; i < rows.length; i += batchSize) {
      const { error } = await supabase.from('episodes').upsert(rows.slice(i, i + batchSize), { onConflict: 'anime_id,episode_num' })
      if (error) { toast.error('Error: ' + error.message); setCsvLoading(false); return }
      imported += rows.slice(i, i + batchSize).length
    }
    toast.success(`${imported} episodes imported!`)
    setCsvPreview([])
    if (csvRef.current) csvRef.current.value = ''
    loadEpisodes()
    setCsvLoading(false)
  }

  const deleteEpisode = async (id) => {
    if (!window.confirm('Delete?')) return
    await supabase.from('episodes').delete().eq('id', id)
    toast.success('Deleted'); loadEpisodes()
  }

  const deleteAllForAnime = async (animeId) => {
    if (!window.confirm(`Delete ALL episodes for Anime ID ${animeId}?`)) return
    await supabase.from('episodes').delete().eq('anime_id', animeId)
    toast.success('All deleted'); loadEpisodes()
  }

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredEps = epFilter ? episodes.filter(e => e.anime_id === epFilter) : episodes
  const animeIds = [...new Set(episodes.map(e => e.anime_id))]
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
        <p className="text-shim-muted text-sm">{loading ? 'Checking auth...' : 'Loading admin panel...'}</p>
      </div>
    )
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
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { l: 'Total Users', v: stats.total, c: 'text-shim-text', i: '👥' },
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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-shim-card border border-shim-border rounded-2xl p-5 text-center">
                <div className="text-2xl mb-2">🎬</div>
                <div className="text-3xl font-bold text-shim-accent mb-1">{episodes.length}</div>
                <div className="text-xs text-shim-muted">Total Episodes</div>
              </div>
              <div className="bg-shim-card border border-shim-border rounded-2xl p-5 text-center">
                <div className="text-2xl mb-2">📺</div>
                <div className="text-3xl font-bold text-shim-accent mb-1">{animeIds.length}</div>
                <div className="text-xs text-shim-muted">Anime Added</div>
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
                      <button onClick={() => removeAnnouncement(a.id).then(loadAnns)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
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

        {tab === 'Episodes' && (
          <div className="space-y-6">

            {/* CSV Import */}
            <div className="glass rounded-2xl border border-shim-primary/30 p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h3 className="text-base font-semibold text-shim-text">📥 Bulk Import via CSV</h3>
                  <p className="text-xs text-shim-muted mt-1">Google Sheet se CSV download karo aur yahan import karo — ek baar mein poora season</p>
                </div>
                <button onClick={downloadTemplate}
                  className="px-4 py-2 rounded-xl border border-shim-border text-xs text-shim-textD hover:text-shim-text hover:border-shim-primary/40 transition-all">
                  📄 Template Download
                </button>
              </div>

              <div className="mb-4 p-3 bg-shim-bgalt rounded-xl border border-shim-border">
                <p className="text-xs text-shim-muted font-mono">anime_id, episode_num, title, url_sub, url_dub, url_hindi, url_tamil, url_telugu</p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <input ref={csvRef} type="file" accept=".csv" onChange={onCsvSelect}
                  className="text-xs text-shim-textD file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-shim-primary file:text-white hover:file:opacity-90 cursor-pointer" />
                {csvPreview.length > 0 && (
                  <button onClick={importCSV} disabled={csvLoading} className="btn-primary text-sm">
                    {csvLoading ? 'Importing...' : `Import ${csvPreview.length} episodes`}
                  </button>
                )}
              </div>

              {csvPreview.length > 0 && (
                <div className="mt-4 rounded-xl border border-shim-border overflow-hidden">
                  <div className="px-4 py-2 border-b border-shim-border bg-shim-bgalt">
                    <p className="text-xs text-shim-muted">Preview — {csvPreview.length} rows (showing first 10)</p>
                  </div>
                  <div className="overflow-x-auto max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-shim-border">
                          {['anime_id','ep','title','sub','dub','hindi','tamil','telugu'].map(h => (
                            <th key={h} className="text-left px-3 py-2 text-shim-muted font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(0, 10).map((r, i) => (
                          <tr key={i} className="border-b border-shim-border/50">
                            <td className="px-3 py-1.5 text-shim-textD">{r.anime_id}</td>
                            <td className="px-3 py-1.5 text-shim-textD">{r.episode_num}</td>
                            <td className="px-3 py-1.5 text-shim-textD max-w-[80px] truncate">{r.title || '-'}</td>
                            {['url_sub','url_dub','url_hindi','url_tamil','url_telugu'].map(k => (
                              <td key={k} className="px-3 py-1.5">{r[k] ? <span className="text-green-400">✓</span> : <span className="text-shim-muted">-</span>}</td>
                            ))}
                          </tr>
                        ))}
                        {csvPreview.length > 10 && (
                          <tr><td colSpan={8} className="px-3 py-2 text-center text-shim-muted">...aur {csvPreview.length - 10} rows</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Single Episode */}
            <div className="glass rounded-2xl border border-shim-border p-6">
              <h3 className="text-base font-semibold text-shim-text mb-4">➕ Single Episode Add</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <input placeholder="Anime MAL ID (e.g. 21)" value={epForm.anime_id}
                  onChange={e => setEpForm(p => ({...p, anime_id: e.target.value}))} className="input-base" />
                <input placeholder="Episode Number" type="number" value={epForm.episode_num}
                  onChange={e => setEpForm(p => ({...p, episode_num: e.target.value}))} className="input-base" />
                <input placeholder="Title (optional)" value={epForm.title}
                  onChange={e => setEpForm(p => ({...p, title: e.target.value}))} className="input-base" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {[
                  { key: 'url_sub', label: '🇯🇵 SUB URL' },
                  { key: 'url_dub', label: '🇺🇸 DUB URL' },
                  { key: 'url_hindi', label: '🇮🇳 HINDI URL' },
                  { key: 'url_tamil', label: '🇮🇳 TAMIL URL' },
                  { key: 'url_telugu', label: '🇮🇳 TELUGU URL' },
                ].map(({ key, label }) => (
                  <input key={key} placeholder={label} value={epForm[key]}
                    onChange={e => setEpForm(p => ({...p, [key]: e.target.value}))} className="input-base" />
                ))}
              </div>
              <button onClick={saveEpisode} disabled={epLoading} className="btn-primary">
                {epLoading ? 'Saving...' : 'Save Episode'}
              </button>
              <p className="text-xs text-shim-muted mt-2">Save ke baad episode number auto increment hoga — ek ek episode quickly add kar sakte ho</p>
            </div>

            {/* Episodes List */}
            <div className="glass rounded-2xl border border-shim-border overflow-hidden">
              <div className="px-4 py-3 border-b border-shim-border flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-sm font-semibold text-shim-text">All Episodes ({filteredEps.length})</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={epFilter} onChange={e => setEpFilter(e.target.value)} className="input-base text-xs py-1.5">
                    <option value="">All Anime</option>
                    {animeIds.map(id => <option key={id} value={id}>Anime ID: {id}</option>)}
                  </select>
                  {epFilter && (
                    <button onClick={() => deleteAllForAnime(epFilter)}
                      className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-500/30 rounded-lg">
                      Delete All
                    </button>
                  )}
                  <button onClick={loadEpisodes} className="text-xs text-shim-muted hover:text-shim-text px-2">↻</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-shim-border">
                      <th className="text-left px-4 py-2 text-shim-muted font-medium">Anime ID</th>
                      <th className="text-left px-4 py-2 text-shim-muted font-medium">Ep</th>
                      <th className="text-left px-4 py-2 text-shim-muted font-medium">Title</th>
                      <th className="text-left px-4 py-2 text-shim-muted font-medium">Languages</th>
                      <th className="text-left px-4 py-2 text-shim-muted font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEps.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-shim-muted text-sm">No episodes yet</td></tr>
                    )}
                    {filteredEps.map(ep => (
                      <tr key={ep.id} className="border-b border-shim-border/50 hover:bg-white/5">
                        <td className="px-4 py-2 text-shim-textD">{ep.anime_id}</td>
                        <td className="px-4 py-2 text-shim-textD font-medium">{ep.episode_num}</td>
                        <td className="px-4 py-2 text-shim-textD max-w-[120px] truncate">{ep.title || '-'}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1 flex-wrap">
                            {ep.url_sub && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">SUB</span>}
                            {ep.url_dub && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">DUB</span>}
                            {ep.url_hindi && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">HIN</span>}
                            {ep.url_tamil && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">TAM</span>}
                            {ep.url_telugu && <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400">TEL</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <button onClick={() => deleteEpisode(ep.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}