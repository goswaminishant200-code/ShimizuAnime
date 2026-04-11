'use client'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const Logo = () => (
  <svg viewBox="0 0 32 32" className="w-10 h-10" fill="none">
    <circle cx="16" cy="10" r="5" fill="#c8446a" opacity=".9"/>
    <circle cx="22" cy="16" r="5" fill="#c8446a" opacity=".7"/>
    <circle cx="10" cy="16" r="5" fill="#c8446a" opacity=".7"/>
    <circle cx="20" cy="23" r="5" fill="#c8446a" opacity=".5"/>
    <circle cx="12" cy="23" r="5" fill="#c8446a" opacity=".5"/>
    <circle cx="16" cy="16" r="4" fill="#f4a7bc"/>
  </svg>
)
{isBanned && (
  <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
    🚫 You Account has been Baned.You Need To Contact To Admin.
  </div>
)}
export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const searchParams = useSearchParams()
  const isBanned = searchParams.get('banned') === 'true'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Fill all fields'); return }
    setLoading(true)
    try {
      await login(email, password)
      router.push('/')
    } catch (err) {
      toast.error(err.message?.includes('Invalid') ? 'Wrong email or password' : err.message || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-shim-bg flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden>
        <span style={{fontSize:'200px',opacity:.04,color:'#c8446a',fontFamily:'Noto Sans JP'}}>桜</span>
      </div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl" style={{background:'rgba(200,68,106,0.05)'}}/>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl" style={{background:'rgba(244,167,188,0.05)'}}/>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4"><Logo/>
            <span className="font-display text-2xl font-bold"><span className="text-shim-primary">Shimu</span><span className="text-shim-text">Anime</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-shim-text">Welcome Back</h1>
          <p className="text-shim-muted text-sm mt-1 font-jp">おかえりなさい</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-shim-border">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-shim-textD mb-2">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="input-base" autoComplete="email"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-shim-textD mb-2">Password</label>
              <div className="relative">
                <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="input-base pr-12" autoComplete="current-password"/>
                <button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-shim-muted hover:text-shim-textD transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {showPw
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>}
                  </svg>
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Logging in...</> : 'Login'}
            </button>
          </form>
          <div className="sakura-div my-6"/>
          <p className="text-center text-sm text-shim-muted">No account? <Link href="/register" className="text-shim-primary hover:text-shim-accent font-medium transition-colors">Sign up free</Link></p>
        </div>
        <p className="text-center text-xs text-shim-muted mt-6"><Link href="/" className="hover:text-shim-textD transition-colors">← Back to ShimuAnime</Link></p>
      </div>
    </div>
  )
}
import { Suspense } from 'react'

// Poora LoginPage component ko LoginForm rename karo
function LoginForm() {
  // ... existing code
}

// Naya default export
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-shim-bg" />}>
      <LoginForm />
    </Suspense>
  )
}git