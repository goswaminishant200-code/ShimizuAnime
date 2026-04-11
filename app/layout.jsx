import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from 'react-hot-toast'
import Petals from '@/components/Petals'
import './globals.css'

export const metadata = { title: 'ShimizuAnime — 清水アニメ', description: 'Stream anime Premium. Sub & Dub.' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><ellipse cx='50' cy='20' rx='15' ry='25' fill='%23f4a7bc' transform='rotate(0,50,50)'/><ellipse cx='50' cy='20' rx='15' ry='25' fill='%23f4a7bc' transform='rotate(72,50,50)'/><ellipse cx='50' cy='20' rx='15' ry='25' fill='%23f4a7bc' transform='rotate(144,50,50)'/><ellipse cx='50' cy='20' rx='15' ry='25' fill='%23f4a7bc' transform='rotate(216,50,50)'/><ellipse cx='50' cy='20' rx='15' ry='25' fill='%23f4a7bc' transform='rotate(288,50,50)'/><circle cx='50' cy='50' r='18' fill='%23c8446a'/><circle cx='50' cy='50' r='12' fill='%23f4a7bc'/><circle cx='50' cy='50' r='6' fill='%23c8446a'/></svg>"/>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-shim-bg text-shim-text min-h-screen overflow-x-hidden">
        <AuthProvider>
          <Petals />
          <Toaster position="top-right" toastOptions={{ style: { background:'#12122a', color:'#f0eaf4', border:'1px solid rgba(200,68,106,0.4)', borderRadius:'10px' } }} />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
