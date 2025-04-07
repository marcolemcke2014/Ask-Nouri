/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com'
    ],
  },
  swcMinify: false,
  // Allow Next.js to run on Replit
  output: 'standalone',
  // Expose environment variables to the browser
  env: {
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
  // Enable the experimental App Router alongside Pages Router
  experimental: {
    appDir: true,
  }
};

module.exports = withPWA(nextConfig);