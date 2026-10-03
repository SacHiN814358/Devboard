'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'
import { LayoutDashboard, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Email ya password galat hai' : error.message)
      setLoading(false)
    } else {
      toast.success('Welcome back! 👋')
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <Toaster position="top-right" />
      <div className="card w-full max-w-md p-8 animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <LayoutDashboard size={22} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-primary-600">DevBoard</span>
        </div>

        <h2 className="text-xl font-semibold text-center mb-1">Welcome back!</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Apne account mein login karo</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} className="input pr-10"
                placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Login ho raha hai...</> : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-500">
          Account nahi hai?{' '}
          <Link href="/register" className="text-primary-600 font-semibold hover:underline">
            Register karo
          </Link>
        </p>
      </div>
    </div>
  )
}
