'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.')
      return
    }

    setIsLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      )
      // Set the user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name,
        })
      }
      router.push('/')
    } catch (err: any) {
      let friendlyMessage = 'Failed to create an account. Please try again.'
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'An account already exists with this email address.'
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.'
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password must be at least 6 characters long.'
      }
      setError(friendlyMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError('')
    setIsLoading(true)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      router.push('/')
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Failed to sign up with Google.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-5 overflow-hidden bg-background">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-40" />
      <div className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] rounded-full bg-cyan/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] rounded-full bg-magenta/5 blur-[100px]" />

      {/* Back to Home Button */}
      <Link
        href="/"
        className="glass absolute top-6 left-6 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-muted-foreground transition-all hover:text-foreground hover:scale-[1.02]"
      >
        <ArrowLeft className="size-3.5" />
        Back to Home
      </Link>

      {/* Card */}
      <div className="glass-strong relative w-full max-w-md rounded-3xl p-8 md:p-10 z-10">
        {/* Glowing Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-4 group">
            <span className="relative flex size-8 items-center justify-center transition-transform group-hover:scale-110">
              <span className="absolute inset-0 rounded-full bg-cyan/30 blur-[8px]" />
              <span className="relative size-4 rounded-full bg-gradient-to-tr from-cyan to-magenta" />
            </span>
            <span className="font-heading text-base font-bold tracking-[0.25em] text-foreground">
              MORE&#8211;PHI
            </span>
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start morphing, evolutionary breeding, and evolving your sound
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive text-center">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1">
            <label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                <User className="size-4" />
              </span>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-line bg-background/40 text-sm text-foreground placeholder-muted-foreground transition-all outline-none focus:border-cyan focus:ring-1 focus:ring-cyan"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                <Mail className="size-4" />
              </span>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-line bg-background/40 text-sm text-foreground placeholder-muted-foreground transition-all outline-none focus:border-cyan focus:ring-1 focus:ring-cyan"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                <Lock className="size-4" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-line bg-background/40 text-sm text-foreground placeholder-muted-foreground transition-all outline-none focus:border-cyan focus:ring-1 focus:ring-cyan"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                <Lock className="size-4" />
              </span>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-line bg-background/40 text-sm text-foreground placeholder-muted-foreground transition-all outline-none focus:border-cyan focus:ring-1 focus:ring-cyan"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="agreeTerms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="size-4 rounded border-slate-line bg-background/40 text-cyan accent-cyan focus:ring-cyan focus:ring-opacity-25 mt-0.5 cursor-pointer"
              disabled={isLoading}
            />
            <label htmlFor="agreeTerms" className="text-xs text-muted-foreground leading-normal">
              I agree to the{' '}
              <a href="#" className="text-cyan hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-cyan hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan to-magenta hover:shadow-[0_0_24px_-4px_rgba(6,182,212,0.55)] text-foreground font-semibold tracking-wide border-none transition-all duration-300 cursor-pointer mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                Creating Account...
              </span>
            ) : (
              'Sign Up'
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-line" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#141419] px-2.5 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Sign Up */}
        <Button
          type="button"
          onClick={handleGoogleSignUp}
          variant="outline"
          className="w-full h-11 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer"
          disabled={isLoading}
        >
          <svg className="size-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>

        {/* Footer info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/signin" className="text-cyan font-medium hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
