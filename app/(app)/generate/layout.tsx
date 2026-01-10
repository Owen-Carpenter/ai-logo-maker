import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Generate Logos',
  description: 'Create custom AI-generated logos with our powerful logo generator. Describe your logo idea and let AI bring it to life with multiple style options.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

