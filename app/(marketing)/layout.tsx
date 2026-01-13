import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    absolute: 'AI Logo Builder',
  },
  description: 'Generate stunning, professional-grade logos in seconds with AI-powered technology. Create custom logos for your business, brand, or startup. Choose from 10+ styles, download high-resolution PNG files instantly, and save to your personal library. Starting at just $10 for 25 credits.',
  keywords: [
    'AI logo generator',
    'create logos online',
    'AI design tool',
    'professional logo maker',
    'GPT Image 1 logos',
    'PNG logo download',
    'logo generation service',
    'AI graphics tool',
    'brand logo creator',
    'business logo maker',
    'startup logo generator',
    'custom logo maker',
    'logo creator AI',
    'instant logo generator',
    'professional logo design',
  ],
  openGraph: {
    title: 'AI Logo Builder - Create Professional Logos with AI',
    description: 'Generate stunning, professional-grade logos in seconds with AI-powered technology. Multiple styles, instant downloads, high-resolution PNG files, and personal library storage. Starting at $5.',
    type: 'website',
    url: 'https://ai-logo-builder.com',
    siteName: 'AI Logo Builder',
    images: [
      {
        url: '/images/AI-Logo-Generator-Logo.png',
        width: 1200,
        height: 630,
        alt: 'AI Logo Builder - Create Professional Logos with AI',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Logo Builder - Create Professional Logos with AI',
    description: 'Generate professional-grade logos instantly with AI. Multiple styles, high-resolution downloads, and full commercial rights.',
    images: ['/images/AI-Logo-Generator-Logo.png'],
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

