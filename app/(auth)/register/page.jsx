'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'
import { LayoutDashboard, Loader2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password kam se kam 6 characters ka hona chahiye')
    setLoading(true)

    try {
      // Step 1: Auth mein signup karo
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name } },
      })

      if (error) throw error

      const user = data.user
      if (!user) throw new Error('User create nahi hua')

      // Step 2: Profile manually create karo (trigger pe depend mat karo)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: form.name || form.email.split('@')[0],
        })

      if (profileError) {
        console.warn('Profile creation warning:', profileError.message)
        // Profile error ignore karo — auth toh ho gaya
      }

      toast.success('Account ban gaya! 🎉')
      router.push('/dashboard')
      router.refresh()

    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Registration fail ho gayi')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <Toaster position="top-right" />
      <div className="card w-full max-w-md p-8 animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-[#6366f1] rounded-xl flex items-center justify-center">
            <LayoutDashboard size={22} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-[#6366f1]">DevBoard</span>
        </div>

        <h2 className="text-xl font-semibold text-center mb-1">Account banao 🚀</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Free mein shuru karo</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="label">Tumhara Naam</label>
            <input type="text" className="input" placeholder="e.g. Sachin Gupta"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="Min 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Bana raha hoon...</>
              : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-500">
          Pehle se account hai?{' '}
          <Link href="/login" className="text-[#6366f1] font-semibold hover:underline">
            Login karo
          </Link>
        </p>
      </div>
    </div>
  )
}
