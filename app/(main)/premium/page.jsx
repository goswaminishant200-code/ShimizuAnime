import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

const FREE = ['Browse 10,000+ anime','Watch Episodes 1–3','Standard quality','Watchlist','Search & filters','Anime news']
const PRO  = ['Unlimited episodes','HD quality','Sub & Dub toggle','Unlimited watchlist','Download history','Comments & ratings','Premium badge on profile','Priority access to new anime']

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-shim-bg">
      <Navbar/>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-shim-gold/30 bg-shim-gold/10 text-shim-gold text-sm font-medium mb-6">⭐ ShimuAnime Premium</span>
          <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-4">Unlock Everything</h1>
          <p className="text-shim-textD text-lg max-w-xl mx-auto">Premium access is granted by our admins. No payment needed — completely free.</p>
          <p className="text-shim-muted font-jp mt-2 text-sm">無制限のアニメを楽しもう</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {/* Free */}
          <div className="bg-shim-card border border-shim-border rounded-2xl p-8">
            <h2 className="text-xl font-bold text-shim-text mb-1">Free</h2>
            <p className="text-shim-muted text-sm mb-4">Start watching immediately</p>
            <div className="mb-6"><span className="text-4xl font-bold text-shim-text">¥0</span><span className="text-shim-muted text-sm ml-2">forever</span></div>
            <ul className="space-y-3 mb-8">
              {FREE.map(f=><li key={f} className="flex items-center gap-3 text-sm text-shim-textD"><span className="text-green-400 flex-shrink-0">✓</span>{f}</li>)}
            </ul>
            <Link href="/register" className="btn-ghost w-full text-center block py-3">Get Started Free</Link>
          </div>

          {/* Premium */}
          <div className="relative bg-gradient-to-br from-shim-card to-shim-bgalt border-2 border-shim-primary rounded-2xl p-8 overflow-hidden" style={{boxShadow:'0 0 40px rgba(200,68,106,0.2)'}}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{background:'rgba(200,68,106,0.08)'}}/>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-shim-gold to-shim-primary text-white text-xs font-bold shadow-lg">MOST POPULAR</span>
            </div>
            <div className="mt-4 mb-1"><h2 className="text-xl font-bold text-shim-text">Premium</h2></div>
            <p className="text-shim-muted text-sm mb-4">Admin-granted full access</p>
            <div className="mb-6">
              <span className="text-4xl font-bold gradient-text">₹20*</span>
              <p className="text-xs text-shim-muted mt-1">*Payment — Telegram/Discord Only</p>
            </div>
            <ul className="space-y-3 mb-8">
              {PRO.map(f=><li key={f} className="flex items-center gap-3 text-sm text-shim-text"><span className="text-shim-gold flex-shrink-0">⭐</span>{f}</li>)}
            </ul>
            <a href="https://discord.gg/42B3KghktF" target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-center block py-3">Request Premium Access</a>
          </div>
        </div>

        {/* How it works */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-shim-text mb-8">How to Get Premium</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {n:'01',title:'Create Account', desc:'Register a free ShimuAnime account',icon:''},
              {n:'02',title:'Contact Admin',  desc:'Join our Discord or DM an admin',icon:'💬'},
              {n:'03',title:'Get Access',     desc:'Admin reviews and grants premium',icon:'✅'},
            ].map(s=>(
              <div key={s.n} className="flex flex-col items-center gap-3 p-6 glass rounded-2xl border border-shim-border">
                <div className="text-4xl">{s.icon}</div>
                <div className="text-shim-primary font-bold text-sm">{s.n}</div>
                <h3 className="font-semibold text-shim-text">{s.title}</h3>
                <p className="text-shim-muted text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer/>
    </div>
  )
}
