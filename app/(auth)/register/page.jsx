'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const Logo = () => (
  <svg viewBox="0 0 280 280" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="140" cy="140" r="128" fill="none" stroke="#c8446a" strokeWidth="1" opacity="0.3"/>
    <ellipse cx="140" cy="88" rx="22" ry="36" fill="#f4a7bc" transform="rotate(0, 140, 140)"/>
    <ellipse cx="140" cy="88" rx="22" ry="36" fill="#f4a7bc" transform="rotate(72, 140, 140)"/>
    <ellipse cx="140" cy="88" rx="22" ry="36" fill="#f4a7bc" transform="rotate(144, 140, 140)"/>
    <ellipse cx="140" cy="88" rx="22" ry="36" fill="#f4a7bc" transform="rotate(216, 140, 140)"/>
    <ellipse cx="140" cy="88" rx="22" ry="36" fill="#f4a7bc" transform="rotate(288, 140, 140)"/>
    <circle cx="140" cy="140" r="28" fill="#c8446a"/>
    <circle cx="140" cy="140" r="20" fill="#f4a7bc"/>
    <circle cx="140" cy="140" r="10" fill="#c8446a"/>
  </svg>
)

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [pw,      setPw]      = useState('')
  const [pw2,     setPw2]     = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false) // email verification sent state

  const strength = (() => {
    let s = 0
    if (pw.length >= 6) s++
    if (pw.length >= 10) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  })()
  const sLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength]
  const sColor = ['', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'][strength]

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Enter display name'); return }
    if (!email.includes('@')) { toast.error('Enter valid email'); return }
    if (pw.length < 6) { toast.error('Password min 6 chars'); return }
    if (pw !== pw2) { toast.error("Passwords don't match"); return }
    setLoading(true)
    try {
      const result = await register(email, pw, name)
      if (result?.needsConfirmation) {
        // Show email verification screen
        setDone(true)
      } else {
        toast.success('Account created!')
        router.push('/')
      }
    } catch (err) {
      toast.error(
        err.message?.includes('already') ? 'Email already registered' :
        err.message || 'Registration failed'
      )
    }
    setLoading(false)
  }

  // Email verification sent screen
  if (done) {
    return (
      <div className="min-h-screen bg-shim-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-6">📧</div>
          <h1 className="text-2xl font-bold text-shim-text mb-3">Check Your Email!</h1>
          <p className="text-shim-textD mb-2">
            We sent a verification link to
          </p>
          <p className="text-shim-accent font-semibold mb-6">{email}</p>
          <div className="glass rounded-2xl border border-shim-border p-6 mb-6 text-left space-y-3">
            <p className="text-shim-textD text-sm flex items-start gap-2">
              <span className="text-shim-primary flex-shrink-0">1.</span>
              Open your email inbox
            </p>
            <p className="text-shim-textD text-sm flex items-start gap-2">
              <span className="text-shim-primary flex-shrink-0">2.</span>
              Click the <span className="text-shim-accent font-medium">Verify My Email</span> button in the email from ShimizuAnime
            </p>
            <p className="text-shim-textD text-sm flex items-start gap-2">
              <span className="text-shim-primary flex-shrink-0">3.</span>
              Come back and login
            </p>
          </div>
          <p className="text-xs text-shim-muted mb-4">Spam folder check karo agar email nahi mili</p>
          <Link href="/login" className="btn-primary inline-flex">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-shim-bg flex items-center justify-center px-4 relative overflow-hidden py-12">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden>
        <span style={{fontSize:'200px',opacity:.04,color:'#c8446a',fontFamily:'Noto Sans JP'}}>桜</span>
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Logo/>
            <span className="font-display text-2xl font-bold">
              <span className="text-shim-primary">Shimizu</span>
              <span className="text-shim-text">Anime</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-shim-text">Create Account</h1>
          <p className="text-shim-muted text-sm mt-1 font-jp">アカウントを作成する</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-shim-border">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-shim-textD mb-2">Display Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your anime name" className="input-base" autoComplete="name"
                maxLength={30}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-shim-textD mb-2">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className="input-base" autoComplete="email"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-shim-textD mb-2">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={pw}
                  onChange={e => setPw(e.target.value)} placeholder="Min 6 characters"
                  className="input-base pr-12" autoComplete="new-password"/>
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-shim-muted hover:text-shim-textD transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                </button>
              </div>
              {pw && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all"
                        style={{background: i <= strength ? sColor : '#2a1a3a'}}/>
                    ))}
                  </div>
                  <span className="text-xs" style={{color: sColor}}>{sLabel}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-shim-textD mb-2">Confirm Password</label>
              <input type="password" value={pw2} onChange={e => setPw2(e.target.value)}
                placeholder="Re-enter password"
                className={`input-base ${pw2 && pw2 !== pw ? '!border-red-500' : pw2 && pw2 === pw ? '!border-green-500' : ''}`}
                autoComplete="new-password"/>
              {pw2 && pw2 !== pw && <p className="text-xs text-red-400 mt-1">Passwords don't match</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating...</>
                : 'Create Account'
              }
            </button>
          </form>

          <div className="sakura-div my-6"/>
          <p className="text-center text-sm text-shim-muted">
            Already have account?{' '}
            <Link href="/login" className="text-shim-primary hover:text-shim-accent font-medium transition-colors">Login</Link>
          </p>
        </div>

        <p className="text-center text-xs text-shim-muted mt-6">
          <Link href="/" className="hover:text-shim-textD transition-colors">← Back to ShimizuAnime</Link>
        </p>
      </div>
    </div>
  )
}