import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { Analytics } from '@vercel/analytics/next'
import StructuredData from '../components/StructuredData'
import { ErrorBoundary } from '../components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-icon-maker.com'),
  title: {
    default: 'AI Logo Builder - Create Professional Logos with AI',
    template: '%s | AI Logo Builder'
  },
  description: 'Create professional-grade logos with AI-powered generation using GPT Image 1. Perfect for designers, developers, and content creators. Multiple styles, instant downloads, and personal library storage.',
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
    
    // Technology-specific
    'GPT logo generator',
    'ChatGPT logo maker',
    'AI powered logo design',
    'machine learning logo creator',
    'neural network logo generator',
    
    // Use Case Keywords
    'business logo generator',
    'company logo maker',
    'brand logo generator',
    'startup logo creator',
    'social media logo maker',
    'app logo generator',
    'website logo creator',
    'professional logo maker',
    
    // Feature-based Keywords
    'PNG logo generator',
    'transparent background logos',
    'custom logo generator',
    'professional logo maker',
    'commercial use logos',
    'royalty free logo generator',
    'brand identity generator',
    
    // Platform/User-specific
    'logo maker for developers',
    'logo generator for designers',
    'logo creator for startups',
    'logo maker for businesses',
    'logo generator for brands',
    
    // Action-oriented
    'create logos online',
    'generate logos with AI',
    'make logos instantly',
    'design logos with AI',
    'build custom logos',
    
    // Quality descriptors
    'high quality logo generator',
    'professional logo creator',
    'modern logo maker',
    'unique logo generator',
    'custom AI logos',
  ],
  authors: [{ name: 'AI Logo Builder' }],
  creator: 'AI Logo Builder',
  publisher: 'AI Logo Builder',
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
    url: 'https://ai-icon-maker.com',
    title: 'AI Logo Builder - Create Professional Logos with AI',
    description: 'Create professional-grade logos with AI-powered generation using GPT Image 1. Perfect for designers, developers, and content creators.',
    siteName: 'AI Logo Builder',
    images: [
      {
        url: '/images/AI-Logo-Generator-Logo.png',
        width: 1200,
        height: 630,
        alt: 'AI Logo Builder - Professional AI Logo Generation',
      },
    ],
  },
  alternates: {
    canonical: 'https://ai-icon-maker.com',
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