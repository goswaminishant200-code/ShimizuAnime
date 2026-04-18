import Link from 'next/link'

const Logo = () => (
  <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
    <circle cx="16" cy="10" r="5" fill="#c8446a" opacity=".9"/>
    <circle cx="22" cy="16" r="5" fill="#c8446a" opacity=".7"/>
    <circle cx="10" cy="16" r="5" fill="#c8446a" opacity=".7"/>
    <circle cx="16" cy="16" r="4" fill="#f4a7bc"/>
  </svg>
)

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-shim-border bg-shim-bgalt/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Logo/>
              <span className="font-display font-bold text-sm">
                <span className="text-shim-primary">Shimizu</span>
                <span className="text-shim-text">Anime</span>
              </span>
            </div>
            <p className="text-shim-textD text-xs leading-relaxed">Your gateway to Japanese animation. Free & Premium.</p>
            <p className="text-shim-primary/50 text-xs mt-1 font-jp">アニメの世界へ</p>
          </div>
          {[
            { t: 'Browse',  ls: [['/',        'Home'],    ['/catalog', 'Catalog'], ['/catalog?f=trending', 'Trending'], ['/news', 'News']] },
            { t: 'Account', ls: [['/login',   'Login'],   ['/register', 'Register'], ['/profile', 'Profile'], ['/premium', 'Premium']] },
            { t: 'Info',    ls: [['/about',   'About'],   ['/dmca', 'DMCA'], ['/privacy', 'Privacy'], ['/terms', 'Terms']] },
          ].map(col => (
            <div key={col.t}>
              <h4 className="text-shim-text font-semibold text-xs mb-3">{col.t}</h4>
              <ul className="space-y-2">
                {col.ls.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-shim-textD text-xs hover:text-shim-accent transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="sakura-div mb-5"/>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-shim-muted">
          <p>© {new Date().getFullYear()} ShimizuAnime. All rights reserved.</p>
          <p className="font-jp text-shim-primary/40">桜のように美しく</p>
        </div>
      </div>
    </footer>
  )
}