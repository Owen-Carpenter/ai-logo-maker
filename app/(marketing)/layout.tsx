import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    absolute: 'AI Logo Builder',
  },
  description: 'Generate stunning, professional-grade logos in seconds with AI-powered technology. Choose from multiple styles, download instantly, and save to your personal library. Starting at just $5/month for 25 credits.',
  keywords: ['AI logo generator', 'create logos online', 'AI design tool', 'professional logo maker', 'GPT Image 1 logos', 'PNG logo download', 'logo generation service', 'AI graphics tool', 'brand logo creator', 'business logo maker'],
  openGraph: {
    title: 'AI Logo Builder',
    description: 'Generate stunning, professional-grade logos in seconds with AI-powered technology. Multiple styles, instant downloads, and personal library storage.',
    type: 'website',
    images: [
      {
        url: '/images/AI-Logo-Generator-Logo.png',
        width: 1200,
        height: 630,
        alt: 'AI Logo Builder - Create Professional Logos',
      },
    ],
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

