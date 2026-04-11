'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function WatchPage() {
  const params   = useParams()
  const sp       = useSearchParams()
  const { user, isPremium, loading: authLoading } = useAuth()
  const router = useRouter()

useEffect(() => {
  if (!authLoading && !user) router.push('/login')
}, [user, authLoading, router])
  const id  = params.id
  const ep  = sp.get('ep') || '1'

  const [anime,    setAnime]    = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [mode,     setMode]     = useState('sub')
  const [loading,  setLoading]  = useState(true)
  const [epPage,   setEpPage]   = useState(1)
  const EPP = 50

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`https://api.jikan.moe/v4/anime/${id}`).then(r=>r.json()),
      fetch(`https://api.jikan.moe/v4/anime/${id}/episodes`).then(r=>r.json()),
    ]).then(([a,e]) => {
      setAnime(a.data); setEpisodes(e.data||[])
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [id])

  const title    = anime?.title_english || anime?.title || 'Loading...'
  const pagedEps = episodes.slice((epPage-1)*EPP, epPage*EPP)
  const totalPgs = Math.ceil(episodes.length/EPP)
  const epInt    = parseInt(ep)
  const isLocked = !isPremium && epInt > 3

  return (
    <div className="min-h-screen bg-shim-bg">
      <Navbar/>
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-shim-muted mb-4">
            <Link href="/" className="hover:text-shim-text transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/anime/${id}`} className="hover:text-shim-text transition-colors clamp2 max-w-[160px]">{title}</Link>
            <span>/</span>
            <span className="text-shim-textD">Ep {ep}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">

            {/* Player */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                <h1 className="text-base font-bold text-shim-text">
                  {title} <span className="text-shim-primary">— Ep {ep}</span>
                </h1>
                {/* Sub/Dub toggle */}
                <div className="flex rounded-xl overflow-hidden border border-shim-border">
                  {['sub','dub'].map(m=>(
                    <button key={m} onClick={()=>setMode(m)}
                      className={`px-4 py-2 text-sm font-medium capitalize transition-all ${mode===m?'bg-shim-primary text-white':'bg-shim-card text-shim-textD hover:text-shim-text'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video area */}
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-shim-border shadow-2xl">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-2 border-shim-primary border-t-transparent rounded-full animate-spin"/>
                      <p className="text-shim-muted text-sm">Loading player...</p>
                    </div>
                  </div>
                ) : isLocked ? (
                  /* Premium lock overlay */
                  <div className="absolute inset-0 bg-shim-bg/95 flex items-center justify-center">
                    <div className="text-center p-8 max-w-sm">
                      <div className="text-5xl mb-4">⭐</div>
                      <h3 className="text-xl font-bold text-shim-gold mb-2">Premium Content</h3>
                      <p className="text-shim-textD text-sm mb-6">
                        Episodes 4+ need a Premium account. Get unlimited episodes and HD quality.
                      </p>
                      <Link href="/premium" className="btn-primary inline-flex">Upgrade to Premium</Link>
                      <p className="text-xs text-shim-muted mt-3">Or ask an admin to grant access</p>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={`https://embtaku.pro/streaming.php?id=${id}-episode-${ep}&type=${mode==='dub'?'1':'0'}`}
                    className="w-full h-full" allowFullScreen allow="autoplay; fullscreen" frameBorder="0"
                    title={`${title} Episode ${ep}`}
                  />
                )}
              </div>

              {/* Ep navigation */}
              <div className="flex items-center justify-between mt-4 gap-3">
                <Link href={`/watch/${id}?ep=${Math.max(1,epInt-1)}`}
                  className={`btn-ghost text-sm ${epInt<=1?'opacity-40 pointer-events-none':''}`}>
                  ← Prev Episode
                </Link>
                <span className="text-shim-muted text-sm hidden sm:block">Episode {ep} of {anime?.episodes||'?'}</span>
                <Link href={`/watch/${id}?ep=${epInt+1}`} className="btn-ghost text-sm">
                  Next Episode →
                </Link>
              </div>

              {/* Anime info strip */}
              {anime && (
                <div className="mt-4 flex items-center gap-4 p-4 glass rounded-xl border border-shim-border">
                  <Link href={`/anime/${id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <img src={anime.images?.jpg?.image_url} alt={title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0"/>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-shim-text hover:text-shim-accent transition-colors clamp2">{title}</p>
                      <p className="text-xs text-shim-muted">{anime.genres?.slice(0,2).map(g=>g.name).join(', ')}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 text-shim-gold flex-shrink-0">
                    <span>★</span><span className="text-sm font-bold">{anime.score?.toFixed(1)||'N/A'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Episode sidebar */}
            <div className="lg:w-72 xl:w-80 flex-shrink-0">
              <div className="glass rounded-2xl border border-shim-border overflow-hidden">
                <div className="px-4 py-3 border-b border-shim-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-shim-text">Episodes</h3>
                  <span className="text-xs text-shim-muted">{episodes.length||anime?.episodes||'?'} total</span>
                </div>

                {/* Page tabs for episodes */}
                {totalPgs>1&&(
                  <div className="flex gap-1 p-2 border-b border-shim-border overflow-x-auto">
                    {Array.from({length:totalPgs},(_,i)=>(
                      <button key={i} onClick={()=>setEpPage(i+1)}
                        className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium transition-all ${epPage===i+1?'bg-shim-primary text-white':'text-shim-muted hover:text-shim-text'}`}>
                        {i*EPP+1}-{Math.min((i+1)*EPP,episodes.length)}
                      </button>
                    ))}
                  </div>
                )}

                <div className="overflow-y-auto" style={{maxHeight:'520px'}}>
                  {episodes.length===0 ? (
                    /* Fallback number grid */
                    <div className="p-3 grid grid-cols-5 gap-1.5">
                      {Array.from({length:Math.min(anime?.episodes||24,100)},(_,i)=>i+1).map(n=>(
                        <Link key={n} href={`/watch/${id}?ep=${n}`}
                          className={`flex items-center justify-center py-2 rounded-lg text-xs font-medium transition-all ${String(n)===ep?'bg-shim-primary text-white':'bg-shim-card border border-shim-border text-shim-textD hover:border-shim-primary/50 hover:text-shim-accent'}`}>
                          {n}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    pagedEps.map(e2=>(
                      <Link key={e2.mal_id} href={`/watch/${id}?ep=${e2.mal_id}`}
                        className={`flex items-center gap-3 px-4 py-3 border-b border-shim-border/50 transition-all hover:bg-white/5 ${String(e2.mal_id)===ep?'bg-shim-primary/10 border-l-2 border-l-shim-primary':''}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${String(e2.mal_id)===ep?'bg-shim-primary text-white':'bg-shim-card text-shim-textD'}`}>{e2.mal_id}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs clamp2 ${String(e2.mal_id)===ep?'text-shim-accent':'text-shim-textD'}`}>{e2.title||`Episode ${e2.mal_id}`}</p>
                          {e2.aired&&<p className="text-xs text-shim-muted">{new Date(e2.aired).toLocaleDateString()}</p>}
                        </div>
                        {!isPremium&&e2.mal_id>3&&<span className="text-shim-gold text-xs flex-shrink-0">⭐</span>}
                      </Link>
                    ))
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
