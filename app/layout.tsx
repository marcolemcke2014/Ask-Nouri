import '../styles/globals.css';
import { Inter } from 'next/font/google';
import type { Metadata, Viewport } from 'next';

// Use Inter font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Metadata
export const metadata: Metadata = {
  title: {
    default: 'Paquapp_v1 - AI Menu Scanner',
    template: '%s | Paquapp_v1',
  },
  description: 'Scan menus, find healthy options with AI assistance',
  keywords: ['nutrition', 'menu scanner', 'OCR', 'AI', 'health', 'diet', 'food'],
  authors: [{ name: 'Paquapp_v1 Team' }],
  creator: 'Paquapp_v1',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://paquapp_v1.com',
    title: 'Paquapp_v1 - AI Menu Scanner',
    description: 'Scan menus, find healthy options with AI assistance',
    siteName: 'Paquapp_v1',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paquapp_v1 - AI Menu Scanner',
    description: 'Scan menus, find healthy options with AI assistance',
  },
};

// Viewport
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
};

// Root layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/pwa/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
} 