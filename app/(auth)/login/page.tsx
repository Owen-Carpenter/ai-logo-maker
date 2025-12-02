'use client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import GoogleSignInButton from '../../../components/auth/GoogleSignInButton'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        // Wait for auth context to update with user data
        setTimeout(async () => {
          // Check subscription status and redirect accordingly
          const response = await fetch('/api/user/profile')
          if (response.ok) {
            const data = await response.json()
            if (data.hasActiveSubscription) {
              // User has subscription - go to generate page
              router.push('/generate')
            } else {
              // User has no subscription - go to home page
              router.push('/')
            }
          } else {
            // Fallback to home page if we can't check subscription
            router.push('/')
          }
        }, 1000) // Give more time for auth context to update
      }
    } catch (error) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 group mb-8">
            <div className="w-12 h-12 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <img 
                src="/images/AIIconMakerLogo.png" 
                alt="AI Icon Maker" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <span className="text-2xl font-bold text-neutral-900">AI Logo Maker</span>
          </Link>
          <h2 className="text-3xl font-bold text-neutral-900">
            Welcome back
          </h2>
          <p className="mt-2 text-neutral-700">
            Sign in to your account to continue creating amazing logos
          </p>
        </div>

        <div className="bg-white backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-200 p-8">
          {/* Google Sign In */}
          <div className="mb-6">
            <GoogleSignInButton text="Sign in with Google" />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-600">Or continue with email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors duration-300"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors duration-300"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700 transition-colors duration-300">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-accent-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-accent-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-neutral-700">
                Don't have an account?{' '}
                <Link href="/register" className="text-primary-600 hover:text-primary-700 transition-colors duration-300 font-semibold">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 