'use client'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

const LANGS = [
  { key: 'url_sub',    label: '🇯🇵 SUB',    code: 'sub' },
  { key: 'url_dub',    label: '🇺🇸 DUB',    code: 'dub' },
  { key: 'url_hindi',  label: '🇮🇳 HIN',    code: 'hindi' },
  { key: 'url_tamil',  label: '🇮🇳 TAM',    code: 'tamil' },
  { key: 'url_telugu', label: '🇮🇳 TEL',    code: 'telugu' },
]

export default function WatchPage() {
  const params = useParams()
  const sp = useSearchParams()
  const { isPremium } = useAuth()

  const id = params.id
  const ep = sp.get('ep') || '1'

  const [anime,      setAnime]      = useState(null)
  const [episodes,   setEpisodes]   = useState([])
  const [dbEpisodes, setDbEpisodes] = useState([])
  const [lang,       setLang]       = useState('url_sub')
  const [loading,    setLoading]    = useState(true)
  const [epPage,     setEpPage]     = useState(1)
  const EPP = 50

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`https://api.jikan.moe/v4/anime/${id}`).then(r => r.json()),
      fetch(`https://api.jikan.moe/v4/anime/${id}/episodes`).then(r => r.json()),
      supabase.from('episodes').select('*').eq('anime_id', String(id)).order('episode_num'),
    ]).then(([a, e, { data: dbEps }]) => {
      setAnime(a.data)
      setEpisodes(e.data || [])
      setDbEpisodes(dbEps || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const title  = anime?.title_english || anime?.title || 'Loading...'
  const epInt  = parseInt(ep)
  const isLocked = !isPremium && epInt > 3
  const pagedEps = episodes.slice((epPage - 1) * EPP, epPage * EPP)
  const totalPgs = Math.ceil(episodes.length / EPP)

  const currentDbEp = dbEpisodes.find(e => e.episode_num === epInt)
  const embedUrl = currentDbEp?.[lang] || null

  const availableLangs = LANGS.filter(l => currentDbEp?.[l.key])

  // Auto select first available lang
  useEffect(() => {
    if (currentDbEp) {
      const first = LANGS.find(l => currentDbEp[l.key])
      if (first && !currentDbEp[lang]) setLang(first.key)
    }
  }, [currentDbEp])

  return (
    <div className="min-h-screen bg-shim-bg">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-shim-muted mb-4 flex-wrap">
            <Link href="/" className="hover:text-shim-text">Home</Link>
            <span>/</span>
            <Link href={`/anime/${id}`} className="hover:text-shim-text clamp2 max-w-[200px]">{title}</Link>
            <span>/</span>
            <span className="text-shim-textD">Episode {ep}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">

              {/* Title + lang toggle */}
              <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
                <h1 className="text-base font-bold text-shim-text">
                  {title} <span className="text-shim-primary">— Ep {ep}</span>
                </h1>

                {/* Language buttons */}
                {availableLangs.length > 0 && (
                  <div className="flex rounded-xl overflow-hidden border border-shim-border flex-shrink-0">
                    {availableLangs.map(l => (
                      <button key={l.key} onClick={() => setLang(l.key)}
                        className={`px-3 py-2 text-xs font-medium transition-all ${lang === l.key ? 'bg-shim-primary text-white' : 'bg-shim-card text-shim-textD hover:text-shim-text'}`}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Video player */}
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-shim-border shadow-2xl">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-shim-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : isLocked ? (
                  <div className="absolute inset-0 bg-shim-bg/95 flex items-center justify-center">
                    <div className="text-center p-8 max-w-sm">
                      <div className="text-5xl mb-4">⭐</div>
                      <h3 className="text-xl font-bold text-shim-gold mb-2">Premium Content</h3>
                      <p className="text-shim-textD text-sm mb-6">Episodes 4+ need Premium access.</p>
                      <Link href="/premium" className="btn-primary inline-flex">Upgrade to Premium</Link>
                    </div>
                  </div>
                ) : embedUrl ? (
                   <iframe
                     key={`${id}-${ep}-${lang}`}
                     src={embedUrl}
                     width="100%"
                     height="100%"
                     allowFullScreen
                     allow="fullscreen"
                     frameBorder="0"
                   />
                ) : (
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="text-4xl mb-3">🎬</div>
                      <p className="text-shim-textD font-medium mb-1">Episode not available yet</p>
                      <p className="text-shim-muted text-sm">Admin ne abhi is episode ka link add nahi kiya.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Episode nav */}
              <div className="flex items-center justify-between mt-4 gap-3">
                <Link href={`/watch/${id}?ep=${Math.max(1, epInt - 1)}`}
                  className={`btn-ghost text-sm ${epInt <= 1 ? 'opacity-40 pointer-events-none' : ''}`}>
                  ← Prev
                </Link>
                <span className="text-shim-muted text-sm">Episode {ep} of {anime?.episodes || '?'}</span>
                <Link href={`/watch/${id}?ep=${epInt + 1}`} className="btn-ghost text-sm">Next →</Link>
              </div>

              {/* Anime info strip */}
              {anime && (
                <div className="mt-4 flex items-center gap-4 p-4 glass rounded-xl border border-shim-border flex-wrap">
                  <Link href={`/anime/${id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <img src={anime.images?.jpg?.image_url} alt={title}
                      className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-shim-text hover:text-shim-accent transition-colors clamp2">{title}</p>
                      <p className="text-xs text-shim-muted">{anime.genres?.slice(0,2).map(g=>g.name).join(', ')}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-shim-gold font-bold">★ {anime.score?.toFixed(1)||'N/A'}</span>
                    <span className="text-xs text-shim-muted">{anime.episodes} eps</span>
                  </div>
                </div>
              )}
            </div>

            {/* Episode sidebar */}
            <div className="lg:w-72 xl:w-80 flex-shrink-0">
              <div className="glass rounded-2xl border border-shim-border overflow-hidden">
                <div className="px-4 py-3 border-b border-shim-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-shim-text">Episodes</h3>
                  <span className="text-xs text-shim-muted">{episodes.length || anime?.episodes || '?'} total</span>
                </div>

                {totalPgs > 1 && (
                  <div className="flex gap-1 p-2 border-b border-shim-border overflow-x-auto">
                    {Array.from({length: totalPgs}, (_,i) => (
                      <button key={i} onClick={() => setEpPage(i+1)}
                        className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium transition-all ${epPage===i+1?'bg-shim-primary text-white':'text-shim-muted hover:text-shim-text'}`}>
                        {i*EPP+1}-{Math.min((i+1)*EPP, episodes.length)}
                      </button>
                    ))}
                  </div>
                )}

                <div className="overflow-y-auto" style={{maxHeight:'520px'}}>
                  {episodes.length === 0 ? (
                    <div className="p-3 grid grid-cols-5 gap-1.5">
                      {Array.from({length: Math.min(anime?.episodes||24, 200)}, (_,i) => i+1).map(n => {
                        const hasEp = dbEpisodes.some(e => e.episode_num === n)
                        return (
                          <Link key={n} href={`/watch/${id}?ep=${n}`}
                            className={`flex items-center justify-center py-2 rounded-lg text-xs font-medium transition-all
                              ${String(n)===ep?'bg-shim-primary text-white':''}
                              ${hasEp&&String(n)!==ep?'bg-shim-card border border-shim-primary/40 text-shim-accent':''}
                              ${!hasEp&&String(n)!==ep?'bg-shim-card border border-shim-border text-shim-textD hover:border-shim-primary/50':''}`}>
                            {n}
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    pagedEps.map(e2 => {
                      const hasEp = dbEpisodes.some(e => e.episode_num === e2.mal_id)
                      return (
                        <Link key={e2.mal_id} href={`/watch/${id}?ep=${e2.mal_id}`}
                          className={`flex items-center gap-3 px-4 py-3 border-b border-shim-border/50 transition-all hover:bg-white/5 ${String(e2.mal_id)===ep?'bg-shim-primary/10 border-l-2 border-l-shim-primary':''}`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${String(e2.mal_id)===ep?'bg-shim-primary text-white':hasEp?'bg-shim-primary/20 text-shim-accent':'bg-shim-card text-shim-textD'}`}>
                            {e2.mal_id}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs clamp2 ${String(e2.mal_id)===ep?'text-shim-accent':hasEp?'text-shim-text':'text-shim-textD'}`}>
                              {e2.title||`Episode ${e2.mal_id}`}
                            </p>
                            {e2.aired && <p className="text-xs text-shim-muted">{new Date(e2.aired).toLocaleDateString()}</p>}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {hasEp && <span className="text-shim-primary text-xs">▶</span>}
                            {!isPremium && e2.mal_id > 3 && <span className="text-shim-gold text-xs">⭐</span>}
                          </div>
                        </Link>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}