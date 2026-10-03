'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import { LayoutDashboard, Moon, Sun, Bell, LogOut, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState(null)
  const [dark, setDark] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const stored = localStorage.getItem('devboard_theme')
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDark = () => {
    setDark(d => {
      const next = !d
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('devboard_theme', next ? 'dark' : 'light')
      return next
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'U'

  return (
    <nav className="card border-x-0 border-t-0 rounded-none sticky top-0 z-50 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <LayoutDashboard size={18} className="text-white" />
          </div>
          <span className="text-primary-600 dark:text-primary-400">DevBoard</span>
        </Link>

        <div className="flex items-center gap-2">
          <button onClick={toggleDark}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden sm:block">{name}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-12 card w-48 py-1 shadow-lg z-50">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold truncate">{name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
