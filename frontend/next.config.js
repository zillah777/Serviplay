/** @type {import('next').NextConfig} */
// Force deploy - Updated for Vercel compatibility
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true
  },
  // Disable Vercel Analytics temporarily to fix 404 errors
  analytics: false,
  experimental: {
    optimizeCss: false
  }
}

module.exports = nextConfig