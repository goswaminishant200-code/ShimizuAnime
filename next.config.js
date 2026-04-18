/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.myanimelist.net' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // X-Frame-Options removed — breaks VOE/video embeds
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection',           value: '1; mode=block' },
          // Allow iframes only from trusted video hosts
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://cdn.myanimelist.net https://img.youtube.com https://*.supabase.co",
              "media-src 'self' blob:",
              "frame-src https://voe.sx https://mixdrop.ag https://www.youtube.com https://youtube.com",
              "connect-src 'self' https://*.supabase.co https://api.jikan.moe wss://*.supabase.co",
            ].join('; '),
          },
        ],
      },
    ]
  },
}
module.exports = nextConfig