/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,            // faster, smaller JS bundles
  compress: true,             // gzip responses where supported
  productionBrowserSourceMaps: false, // avoid shipping large source maps to users
  images: {
    // add domains you load remote images from (example)
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com'],
    // deviceSizes and formats can be tuned if you use next/image
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Add Cache-Control for static assets via your CDN/platform instead
        ],
      },
    ]
  },
}

module.exports = nextConfig
