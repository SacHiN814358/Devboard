# 🚀 DevBoard — Next.js + Supabase

> Full-stack Kanban project manager — Next.js 14 App Router + Supabase

## ✨ Tech Stack

| | Technology |
|---|---|
| Framework | **Next.js 14** (App Router) |
| Database | **Supabase** (PostgreSQL) |
| Auth | **Supabase Auth** (built-in) |
| Real-time | **Supabase Realtime** |
| Styling | **Tailwind CSS** |
| Drag & Drop | **@hello-pangea/dnd** |
| Deploy | **Vercel** (free) |

## 🔥 Features
- ✅ Login / Register (Supabase Auth)
- ✅ Project banaao with custom colors
- ✅ Kanban Board — Drag & Drop tasks
- ✅ Real-time updates (Supabase Realtime)
- ✅ Task comments
- ✅ Team members add karo
- ✅ Dark Mode

## 🚀 Setup

### Step 1 — Supabase Project Banao
1. [supabase.com](https://supabase.com) → New Project
2. **SQL Editor** → `supabase-schema.sql` ka poora content paste karo → Run

### Step 2 — Keys Copy Karo
Supabase Dashboard → **Settings → API**:
- `Project URL`
- `anon public` key

### Step 3 — .env.local banao
```bash
cp .env.local.example .env.local
```
Fill karo:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Step 4 — Install & Run
```bash
npm install
npm run dev
```

App: **http://localhost:3000** 🎉

## 📁 Structure
```
devboard-next/
├── app/
│   ├── (auth)/login/       # Login page
│   ├── (auth)/register/    # Register page
│   ├── dashboard/          # Projects dashboard
│   └── projects/[id]/      # Kanban board
├── components/
│   └── Navbar.jsx
├── lib/supabase/
│   ├── client.js           # Browser client
│   └── server.js           # Server client
├── middleware.js            # Route protection
└── supabase-schema.sql      # Database schema
```

## 🌐 Deploy on Vercel
```bash
# Vercel CLI
npm i -g vercel
vercel

# Ya GitHub se connect karo vercel.com pe
```
Environment variables Vercel pe bhi daalo!
