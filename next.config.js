const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com'
    ],
  },
  // Add server paths that need to be serverless
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // Increase limit for image uploads
    },
  },
};

module.exports = withPWA(nextConfig); 