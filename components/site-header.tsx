'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const NAV = [
  { id: 'nav-demo', label: 'Morph Pad', href: '#morph-demo' },
  { id: 'nav-features', label: 'Engine', href: '#features' },
  { id: 'nav-pricing', label: 'Pricing', href: '#checkout' },
  { id: 'nav-specs', label: 'Specs', href: '#specs' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    
    return () => {
      window.removeEventListener('scroll', onScroll)
      unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  return (
    <header
      id="site-header"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'py-2' : 'py-4'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5">
        <a
          id="brand-logo-link"
          href="#hero"
          className={`flex items-center gap-2.5 rounded-full px-3 py-2 transition-all ${
            scrolled ? 'glass' : ''
          }`}
        >
          <span className="relative flex size-6 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-cyan/30 blur-[6px]" />
            <span className="relative size-3 rounded-full bg-gradient-to-tr from-cyan to-magenta" />
          </span>
          <span className="font-heading text-sm font-bold tracking-[0.2em] text-foreground">
            MORE&#8211;PHI
          </span>
        </a>

        <nav
          id="primary-nav"
          aria-label="Primary"
          className="glass hidden items-center gap-1 rounded-full px-2 py-1.5 md:flex"
        >
          {NAV.map((item) => (
            <a
              key={item.id}
              id={item.id}
              href={item.href}
              className="rounded-full px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3.5">
                  <span className="hidden text-xs text-muted-foreground sm:inline-block">
                    Hi, <span className="font-medium text-foreground">{user.displayName || user.email?.split('@')[0]}</span>
                  </span>
                  <button
                    id="header-signout"
                    onClick={handleSignOut}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  id="header-signin"
                  href="/signin"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign In
                </Link>
              )}
            </>
          )}
          <a
            id="header-cta-acquire"
            href="#checkout"
            className="glass halo-gold rounded-full px-4 py-2 text-sm font-medium text-primary transition-transform hover:scale-[1.03]"
          >
            Acquire &mdash; $129
          </a>
        </div>
      </div>
    </header>
  )
}
