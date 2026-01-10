import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { Analytics } from '@vercel/analytics/next'
import StructuredData from '../components/StructuredData'
import { ErrorBoundary } from '../components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-logo-builder.com'),
  title: {
    default: 'AI Logo Builder - Create Professional Logos with AI in Seconds',
    template: '%s | AI Logo Builder'
  },
  description: 'Generate professional-grade logos instantly with AI-powered technology. Create custom logos for your business, brand, or startup in seconds. Multiple styles, high-resolution PNG downloads, and full commercial rights. Starting at just $5.',
  keywords: [
    // Primary Keywords
    'AI logo generator',
    'logo maker online',
    'AI logo creator',
    'logo generator',
    'brand logo maker',
    'logo generator AI',
    'AI design tool',
    'logo creator online',
    'AI graphics generator',
    'logo design tool',
    'professional logo maker',
    'business logo generator',
    'company logo maker',
    'startup logo creator',
    'custom logo generator',
    
    // Technology-specific
    'GPT Image 1 logo generator',
    'AI powered logo design',
    'machine learning logo creator',
    'neural network logo generator',
    'artificial intelligence logo maker',
    
    // Use Case Keywords
    'brand logo generator',
    'social media logo maker',
    'app logo generator',
    'website logo creator',
    'ecommerce logo maker',
    'restaurant logo generator',
    'tech startup logo creator',
    'agency logo maker',
    
    // Feature-based Keywords
    'PNG logo generator',
    'transparent background logos',
    'high resolution logo generator',
    'commercial use logos',
    'royalty free logo generator',
    'brand identity generator',
    'logo improvement tool',
    'logo iteration generator',
    
    // Platform/User-specific
    'logo maker for developers',
    'logo generator for designers',
    'logo creator for startups',
    'logo maker for businesses',
    'logo generator for brands',
    'logo maker for entrepreneurs',
    'logo generator for agencies',
    
    // Action-oriented
    'create logos online',
    'generate logos with AI',
    'make logos instantly',
    'design logos with AI',
    'build custom logos',
    'generate logo free',
    'create logo online free',
    
    // Quality descriptors
    'high quality logo generator',
    'professional logo creator',
    'modern logo maker',
    'unique logo generator',
    'custom AI logos',
    'premium logo generator',
    'studio quality logos',
  ],
  authors: [{ name: 'AI Logo Builder' }],
  creator: 'AI Logo Builder',
  publisher: 'AI Logo Builder',
  category: 'Design Software',
  classification: 'AI Logo Generation Tool',
  verification: {
    google: 'EFS5qxq_vRGUABjbt4LNQPlrLjtGyolIolAmwfMgGzw',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/images/AI-Logo-Generator-Logo.png',
    shortcut: '/images/AI-Logo-Generator-Logo.png',
    apple: '/images/AI-Logo-Generator-Logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ai-logo-builder.com',
    title: 'AI Logo Builder - Create Professional Logos with AI in Seconds',
    description: 'Generate professional-grade logos instantly with AI-powered technology. Create custom logos for your business, brand, or startup. Multiple styles, high-resolution PNG downloads, and full commercial rights.',
    siteName: 'AI Logo Builder',
    images: [
      {
        url: '/images/AI-Logo-Generator-Logo.png',
        width: 1200,
        height: 630,
        alt: 'AI Logo Builder - Professional AI Logo Generation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Logo Builder - Create Professional Logos with AI',
    description: 'Generate professional-grade logos instantly with AI-powered technology. Multiple styles, high-resolution downloads, and full commercial rights.',
    images: ['/images/AI-Logo-Generator-Logo.png'],
    creator: '@ailogobuilder',
  },
  alternates: {
    canonical: 'https://ai-logo-builder.com',
  },
  other: {
    'application-name': 'AI Logo Builder',
    'apple-mobile-web-app-title': 'AI Logo Builder',
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17770613842"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17770613842');
            `,
          }}
        />
        <StructuredData />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
} 