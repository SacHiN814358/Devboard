'use client'
import { useState, useEffect } from 'react'
import { playBoing, playPop } from '../lib/sound'
import { X } from 'lucide-react'

const TIPS = [
  "I am vengeance... I am the night... I am finishing tasks! 🦇",
  "Gotham's tasks won't complete themselves. Stay sharp! ⚡",
  "The Bat-Signal is on: your next priority awaits! 🔦",
  "Even the Dark Knight takes 5-minute Pomodoro breaks! ☕",
  "Pro-tip: Drag finished tasks to 'Done' like villains to Arkham! 💥",
  "A hero is defined by what gets shipped today! 🏆",
  "Justice never sleeps, but make sure to drink water! 💧",
  "No superpowers needed—just ruthless consistency! 🚀",
  "Every closed task makes the codebase a safer place! 🛡️"
]

const BAT_PARTICLES = ['🦇', '⚡', '💛', '🛡️', '🌟']

export default function FloatingMascot() {
  const [tipIdx, setTipIdx] = useState(0)
  const [showBubble, setShowBubble] = useState(false)
  const [isSleeping, setIsSleeping] = useState(false)
  const [isDancing, setIsDancing] = useState(false)
  const [particles, setParticles] = useState([])
  const [minimized, setMinimized] = useState(false)

  // Idle detector — sleep after 50 seconds of inactivity
  useEffect(() => {
    let idleTimer

    const resetIdle = () => {
      if (isSleeping) {
        setIsSleeping(false)
        setShowBubble(true)
        setTimeout(() => setShowBubble(false), 3500)
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

  const handleClick = () => {
    playBoing()
    setIsSleeping(false)
    setShowBubble(true)
    setTipIdx((prev) => (prev + 1) % TIPS.length)

    // Bat / Lightning particle burst
    const randomIcon = BAT_PARTICLES[Math.floor(Math.random() * BAT_PARTICLES.length)]
    const newParticle = { id: Date.now(), x: Math.random() * 26 - 13, icon: randomIcon }
    setParticles((prev) => [...prev, newParticle])
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id))
    }, 1000)
  }

  if (minimized) {
    return (
      <button
        onClick={() => {
          setMinimized(false)
          playPop()
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

      {/* Bat Speech Bubble */}
      {showBubble && !isSleeping && (
        <div className="absolute -top-16 right-0 max-w-xs w-68 bg-zinc-950 text-zinc-100 text-xs font-semibold p-3.5 rounded-2xl shadow-2xl border border-zinc-800 shadow-amber-500/10 animate-pop">
          <div className="flex items-start justify-between gap-1.5">
            <p className="leading-snug text-zinc-200">{TIPS[tipIdx]}</p>
            <button
              onClick={() => setShowBubble(false)}
              className="text-zinc-400 hover:text-white p-0.5 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
          {/* Bubble Pointer */}
          <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-zinc-950 border-r border-b border-zinc-800 rotate-45" />
        </div>
      )}

      {/* Sleeping Bat Zzz Bubble */}
      {isSleeping && (
        <div className="absolute -top-6 right-2 text-amber-400 font-extrabold text-xs animate-bounce bg-zinc-950/95 px-2.5 py-0.5 rounded-full border border-amber-500/30 shadow-md flex items-center gap-1">
          <span>Zzz...</span>
          <span className="text-[10px]">🦇</span>
        </div>
      )}

      {/* Mascot Card Container */}
      <div
        onClick={handleClick}
        className={`group relative flex items-end gap-2 p-1.5 cursor-pointer transition-all duration-300 ${
          isDancing
            ? 'animate-bounce scale-110'
            : 'hover:scale-105 active:scale-95'
        }`}
        title="I am Batman! Click me! 🦇"
      >
        {/* 3D Chibi Bobblehead Batman Figurine */}
        <div className="relative">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-amber-500/15 dark:bg-amber-400/20 blur-lg rounded-full -z-10 scale-90" />

          {/* Batman Figurine Image */}
          <img
            src="/batman.png"
            alt="3D Chibi Batman"
            className={`w-16 h-28 sm:w-18 sm:h-32 object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.6)] select-none pointer-events-none transition-all duration-300 ${
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
        <div className="bg-zinc-950/95 dark:bg-zinc-900/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-lg border border-amber-500/30 text-[11px] font-bold text-amber-400 flex items-center gap-1.5 mb-2">
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
