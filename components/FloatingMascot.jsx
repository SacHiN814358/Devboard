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
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-2xl bg-gradient-to-tr from-zinc-950 via-zinc-900 to-amber-500 text-white shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-xl select-none animate-bounce border border-amber-500/30"
        title="Open Bat-Buddy 🦇"
      >
        🦇
      </button>
    )
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 select-none">
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
        <div className="absolute -top-16 right-0 max-w-xs w-68 bg-zinc-900 text-zinc-100 text-xs font-semibold p-3.5 rounded-2xl shadow-2xl border border-zinc-800 shadow-amber-500/5 animate-pop">
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
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-zinc-900 border-r border-b border-zinc-800 rotate-45" />
        </div>
      )}

      {/* Sleeping Bat Zzz Bubble */}
      {isSleeping && (
        <div className="absolute -top-8 right-2 text-amber-400 font-extrabold text-xs animate-bounce bg-zinc-900/95 px-2.5 py-0.5 rounded-full border border-amber-500/30 shadow-md flex items-center gap-1">
          <span>Zzz...</span>
          <span className="text-[10px]">🦇</span>
        </div>
      )}

      {/* Mascot Card Container */}
      <div
        onClick={handleClick}
        className={`group relative flex items-center gap-2 p-2 rounded-2xl cursor-pointer transition-all duration-200 ${
          isDancing
            ? 'animate-bounce scale-110'
            : 'hover:scale-105 active:scale-95'
        }`}
        title="I am Bat-Buddy! Click me! 🦇"
      >
        {/* Animated Chibi Mini Batman SVG */}
        <div className="relative w-14 h-14 filter drop-shadow-xl">
          <svg viewBox="0 0 75 75" className="w-full h-full overflow-visible">
            {/* Batman Cape (Flowing behind / wrapping around when sleeping) */}
            {isSleeping ? (
              // Wrapped tightly in his cape like a cozy bat cocoon
              <path
                d="M 23 28 C 15 36 18 64 38 65 C 58 64 61 36 53 28 C 45 32 31 32 23 28 Z"
                fill="#18181b"
                stroke="#27272a"
                strokeWidth="1.5"
              />
            ) : isDancing ? (
              // Cape spread wide like majestic bat wings
              <g className="animate-pulse">
                <path
                  d="M 12 36 Q 2 24 0 45 Q 8 60 18 55 Q 26 62 38 58 Q 50 62 58 55 Q 68 60 76 45 Q 74 24 64 36 Z"
                  fill="#18181b"
                />
                <path
                  d="M 8 46 Q 16 54 24 50 M 52 50 Q 60 54 68 46"
                  stroke="#27272a"
                  strokeWidth="1.5"
                  fill="none"
                />
              </g>
            ) : (
              // Heroic fluttering cape with scalloped bat wing edges
              <g className="origin-top animate-[waveHand_3s_ease-in-out_infinite]">
                <path
                  d="M 22 36 Q 10 46 12 62 Q 20 58 26 62 Q 32 58 38 62 Q 44 58 50 62 Q 56 58 64 62 Q 66 46 54 36 Z"
                  fill="#09090b"
                />
                <path
                  d="M 22 36 Q 16 48 18 60 Q 24 57 28 60"
                  stroke="#27272a"
                  strokeWidth="1"
                  fill="none"
                />
              </g>
            )}

            {/* Boots & Legs */}
            <rect x="29" y="56" width="7" height="9" rx="3" fill="#09090b" />
            <rect x="40" y="56" width="7" height="9" rx="3" fill="#09090b" />

            {/* Body / Torso (Charcoal Batsuit) */}
            <rect x="25" y="38" width="26" height="20" rx="7" fill="#3f3f46" stroke="#27272a" strokeWidth="1" />

            {/* Batsuit Chest Plate Line */}
            <path
              d="M 31 43 Q 38 45 45 43"
              stroke="#27272a"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Iconic Yellow Bat-Insignia Oval */}
            <ellipse cx="38" cy="46" rx="8" ry="5" fill="#facc15" stroke="#eab308" strokeWidth="0.8" />
            {/* Black Bat Silhouette */}
            <path
              d="M 33 46 Q 34.5 44 36.5 45.2 L 37.2 43.8 L 38 45 L 38.8 43.8 L 39.5 45.2 Q 41.5 44 43 46 Q 41.5 48.5 38 47.5 Q 34.5 48.5 33 46 Z"
              fill="#09090b"
            />

            {/* Golden Utility Belt */}
            <rect x="25.5" y="53" width="25" height="4.5" rx="2" fill="#eab308" />
            <rect x="27.5" y="53.5" width="3" height="3.5" rx="0.8" fill="#ca8a04" />
            <rect x="32" y="53.5" width="3" height="3.5" rx="0.8" fill="#ca8a04" />
            <rect x="41" y="53.5" width="3" height="3.5" rx="0.8" fill="#ca8a04" />
            <rect x="45.5" y="53.5" width="3" height="3.5" rx="0.8" fill="#ca8a04" />
            <rect x="36.5" y="52.8" width="3" height="5" rx="1" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />

            {/* Left Arm / Gauntlet with Blades */}
            <rect x="17" y="40" width="8" height="13" rx="3.5" fill="#18181b" transform="rotate(12 17 40)" />
            <polygon points="16,45 13,46.5 16,48" fill="#27272a" />
            <polygon points="17,49 14,50.5 17,52" fill="#27272a" />

            {/* Right Arm / Gauntlet (Waving!) */}
            <g className="origin-[50px_42px] animate-wave-hand">
              <ellipse cx="54" cy="40" rx="5.5" ry="4.5" fill="#18181b" />
              <polygon points="57,36 61,35 58,39" fill="#27272a" />
              <polygon points="56,41 60,40 57,44" fill="#27272a" />
            </g>

            {/* Batman Cowl Head & Ears */}
            {/* Left Bat Ear Horn */}
            <polygon points="23,28 20,7 30,20" fill="#18181b" />
            {/* Right Bat Ear Horn */}
            <polygon points="53,28 56,7 46,20" fill="#18181b" />

            {/* Cowl Main Head Dome */}
            <circle cx="38" cy="27" r="18" fill="#18181b" />

            {/* Exposed Jaw / Chin Opening (Classic Batman Peachy Skin) */}
            <path
              d="M 28 30 C 28 41 48 41 48 30 C 44 33 32 33 28 30 Z"
              fill="#fed7aa"
            />

            {/* Determined Chibi Smirk / Mouth */}
            {isSleeping ? (
              <path
                d="M 35 36 Q 38 37 41 36"
                stroke="#78350f"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            ) : isDancing ? (
              <path
                d="M 34 35 Q 38 40 42 35"
                stroke="#78350f"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="#f43f5e"
              />
            ) : (
              <path
                d="M 34 36 Q 38 38 41 35"
                stroke="#78350f"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
              />
            )}

            {/* Eyes */}
            {isSleeping ? (
              <>
                <path
                  d="M 27 24 Q 31 27 35 24"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 41 24 Q 45 27 49 24"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            ) : isDancing ? (
              <>
                <polygon points="27,21 35,24 33,28 27,24" fill="#facc15" className="animate-pulse" />
                <polygon points="49,21 41,24 43,28 49,24" fill="#facc15" className="animate-pulse" />
              </>
            ) : (
              <>
                <polygon
                  points="26,22 35,25 33,28 26,25"
                  fill="#ffffff"
                  filter="drop-shadow(0 0 2px #38bdf8)"
                />
                <polygon
                  points="50,22 41,25 43,28 50,25"
                  fill="#ffffff"
                  filter="drop-shadow(0 0 2px #38bdf8)"
                />
              </>
            )}
          </svg>
        </div>

        {/* Mascot Mini Tag */}
        <div className="bg-zinc-950/95 dark:bg-zinc-900/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-md border border-amber-500/30 text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
          <span className="text-zinc-100 font-extrabold">Bat-Buddy</span>
          <span className="text-xs">{isSleeping ? '💤' : isDancing ? '🦇' : '⚡'}</span>
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
