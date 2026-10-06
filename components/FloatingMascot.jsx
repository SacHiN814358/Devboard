'use client'
import { useState, useEffect } from 'react'
import { playBoing, playPop } from '../lib/sound'
import { X, MessageSquareQuote } from 'lucide-react'

const TIPS = [
  "I am vengeance... I am the night... I am finishing tasks! 🦇",
  "Gotham's tasks won't complete themselves. Stay sharp! ⚡",
  "The Bat-Signal is on: your next priority awaits! 🔦",
  "Even the Dark Knight takes 5-minute Pomodoro breaks! ☕",
  "Pro-tip: Drag finished tasks to 'Done' like villains to Arkham! 💥",
  "A hero is defined by what gets shipped today! 🏆",
  "Justice never sleeps, but make sure to drink water! 💧",
  "No superpowers needed—just ruthless consistency! 🚀",
  "Every closed task makes the codebase a safer place! 🛡️",
  "Focus, discipline, and execution. That's how we defeat bugs! ⚔️",
  "I have a contingency plan for every task on this board. 📋"
]

const BAT_PARTICLES = ['🦇', '⚡', '💛', '🛡️', '🌟']

export default function FloatingMascot() {
  const [tipIdx, setTipIdx] = useState(0)
  const [showBubble, setShowBubble] = useState(true) // Visible by default so quotes show immediately!
  const [isSleeping, setIsSleeping] = useState(false)
  const [isDancing, setIsDancing] = useState(false)
  const [particles, setParticles] = useState([])
  const [minimized, setMinimized] = useState(false)

  // 1. Initial quote + auto-rotate every 9 seconds so Batman constantly speaks!
  useEffect(() => {
    setShowBubble(true)

    const quoteTimer = setInterval(() => {
      setIsSleeping(sleeping => {
        if (!sleeping) {
          setTipIdx(prev => (prev + 1) % TIPS.length)
          setShowBubble(true)
        }
        return sleeping
      })
    }, 9000)

    return () => clearInterval(quoteTimer)
  }, [])

  // 2. Idle detector — sleep after 50 seconds of inactivity
  useEffect(() => {
    let idleTimer

    const resetIdle = () => {
      if (isSleeping) {
        setIsSleeping(false)
        setShowBubble(true)
        setTipIdx(prev => (prev + 1) % TIPS.length)
      }
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        setIsSleeping(true)
        setShowBubble(false)
      }, 50000)
    }

    window.addEventListener('mousemove', resetIdle)
    window.addEventListener('keydown', resetIdle)
    window.addEventListener('click', resetIdle)
    idleTimer = setTimeout(() => setIsSleeping(true), 50000)

    // Listen for celebration events when a task is dropped into DONE
    const handleTaskDone = () => {
      setIsDancing(true)
      setShowBubble(true)
      setTipIdx(Math.floor(Math.random() * TIPS.length))
      setTimeout(() => setIsDancing(false), 3200)
    }
    window.addEventListener('devboard_task_done', handleTaskDone)

    return () => {
      clearTimeout(idleTimer)
      window.removeEventListener('mousemove', resetIdle)
      window.removeEventListener('keydown', resetIdle)
      window.removeEventListener('click', resetIdle)
      window.removeEventListener('devboard_task_done', handleTaskDone)
    }
  }, [isSleeping])

  const nextQuote = () => {
    setTipIdx(prev => (prev + 1) % TIPS.length)
    setShowBubble(true)
  }

  const handleClick = () => {
    playBoing()
    setIsSleeping(false)
    nextQuote()

    // Bat / Lightning particle burst
    const randomIcon = BAT_PARTICLES[Math.floor(Math.random() * BAT_PARTICLES.length)]
    const newParticle = { id: Date.now(), x: Math.random() * 26 - 13, icon: randomIcon }
    setParticles((prev) => [...prev, newParticle])
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id))
    }, 1000)
  }

  const handleMouseEnter = () => {
    if (!isSleeping) {
      setShowBubble(true)
    }
  }

  if (minimized) {
    return (
      <button
        onClick={() => {
          setMinimized(false)
          playPop()
          setShowBubble(true)
        }}
        className="fixed bottom-5 right-5 z-40 w-13 h-13 rounded-2xl bg-gradient-to-tr from-zinc-950 via-zinc-900 to-amber-500 text-white shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-xl select-none animate-bounce border border-amber-500/30"
        title="Open Batman Companion 🦇"
      >
        🦇
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-6 z-40 select-none">
      {/* Floating Bat & Lightning Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute -top-6 left-6 font-bold text-lg animate-[gentleFloat_1s_ease-out_forwards] pointer-events-none"
          style={{ transform: `translateX(${p.x}px)` }}
        >
          {p.icon}
        </div>
      ))}

      {/* Bat Speech Bubble (Always precisely positioned ABOVE Batman) */}
      {showBubble && !isSleeping && (
        <div className="absolute bottom-[calc(100%+10px)] right-0 w-72 max-w-[calc(100vw-36px)] bg-zinc-950/95 dark:bg-black/95 text-zinc-100 text-xs font-semibold p-3.5 rounded-2xl shadow-2xl border-2 border-amber-500/50 shadow-amber-500/15 animate-pop z-50 backdrop-blur-md">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <span className="text-base select-none mt-0.5">🦇</span>
              <p className="leading-snug text-zinc-100 font-medium">
                {TIPS[tipIdx]}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowBubble(false)
              }}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              title="Close quote"
            >
              <X size={13} />
            </button>
          </div>
          {/* Bubble Pointer pointing down to Batman's head */}
          <div className="absolute -bottom-1.5 right-12 w-3.5 h-3.5 bg-zinc-950 dark:bg-black border-r-2 border-b-2 border-amber-500/50 rotate-45" />
        </div>
      )}

      {/* Sleeping Bat Zzz Bubble */}
      {isSleeping && (
        <div className="absolute bottom-[calc(100%+6px)] right-6 text-amber-400 font-extrabold text-xs animate-bounce bg-zinc-950/95 px-3 py-1 rounded-full border border-amber-500/40 shadow-lg flex items-center gap-1.5">
          <span>Zzz...</span>
          <span className="text-xs">🦇</span>
        </div>
      )}

      {/* Mascot Card Container */}
      <div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        className={`group relative flex items-end gap-2 p-1.5 cursor-pointer transition-all duration-300 ${
          isDancing
            ? 'animate-bounce scale-110'
            : 'hover:scale-105 active:scale-95'
        }`}
        title="I am Batman! Click me for quotes! 🦇"
      >
        {/* 3D Chibi Bobblehead Batman Figurine */}
        <div className="relative">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-amber-500/20 dark:bg-amber-400/25 blur-lg rounded-full -z-10 scale-90" />

          {/* Batman Figurine Image */}
          <img
            src="/batman.png"
            alt="3D Chibi Batman"
            className={`w-16 h-28 sm:w-18 sm:h-32 object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.65)] select-none pointer-events-none transition-all duration-300 ${
              isSleeping
                ? 'rotate-6 opacity-85 scale-95'
                : isDancing
                ? 'scale-115 rotate-[-4deg] animate-pulse'
                : 'animate-mascot-bob group-hover:scale-105'
            }`}
            draggable={false}
          />
        </div>

        {/* Mascot Mini Tag */}
        <div className="bg-zinc-950/95 dark:bg-zinc-900/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-lg border border-amber-500/40 text-[11px] font-bold text-amber-400 flex items-center gap-1.5 mb-2 hover:border-amber-400 transition-colors">
          <span className="text-zinc-100 font-black tracking-wide">Batman</span>
          <span className="text-xs">{isSleeping ? '💤' : isDancing ? '🏆' : '🦇'}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMinimized(true)
            }}
            className="text-zinc-400 hover:text-zinc-200 ml-1 transition-colors"
            title="Minimize"
          >
            <X size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}
