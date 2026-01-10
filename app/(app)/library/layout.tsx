import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Logo Library',
  description: 'Access your saved logo collection. View, download, and manage all your AI-generated logos in one place.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

