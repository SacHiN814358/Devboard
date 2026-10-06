'use client'
import { useState, useEffect } from 'react'
import { playBoing, playPop } from '../lib/sound'
import { X, Heart, Sparkles, MessageCircle, Volume2, VolumeX } from 'lucide-react'

const TIPS = [
  "You're making incredible progress! Keep going! 🚀",
  "Don't forget to take a stretch & sip some water! 💧",
  "Pro-tip: Dragging tasks to 'Done' blasts confetti! 🎉",
  "One task at a time is the secret to super focus! ⚡",
  "Click any task card to chat & leave notes! 💬",
  "You're a productivity superstar! ⭐",
  "Need focus? Try the Pomodoro timer at the top! ⏱️",
  "Every small step gets you closer to the finish line! 🏆"
]

export default function FloatingMascot() {
  const [tipIdx, setTipIdx] = useState(0)
  const [showBubble, setShowBubble] = useState(false)
  const [isSleeping, setIsSleeping] = useState(false)
  const [isDancing, setIsDancing] = useState(false)
  const [hearts, setHearts] = useState([])
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
      setTimeout(() => setIsDancing(false), 3000)
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

    // Heart particle burst
    const newHeart = { id: Date.now(), x: Math.random() * 20 - 10 }
    setHearts((prev) => [...prev, newHeart])
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id))
    }, 1000)
  }

  if (minimized) {
    return (
      <button
        onClick={() => {
          setMinimized(false)
          playPop()
        }}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-xl select-none animate-bounce"
        title="Open Mascot Companion"
      >
        🦊
      </button>
    )
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 select-none">
      {/* Floating Hearts */}
      {hearts.map((h) => (
        <div
          key={h.id}
          className="absolute -top-6 left-6 text-rose-500 font-bold text-lg animate-[gentleFloat_1s_ease-out_forwards] pointer-events-none"
          style={{ transform: `translateX(${h.x}px)` }}
        >
          ❤️
        </div>
      ))}

      {/* Speech Bubble */}
      {showBubble && !isSleeping && (
        <div className="absolute -top-16 right-0 max-w-xs w-64 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold p-3 rounded-2xl shadow-2xl border border-zinc-200/90 dark:border-zinc-700/80 animate-pop">
          <div className="flex items-start justify-between gap-1">
            <p className="leading-snug">{TIPS[tipIdx]}</p>
            <button
              onClick={() => setShowBubble(false)}
              className="text-zinc-400 hover:text-zinc-600 p-0.5"
            >
              <X size={12} />
            </button>
          </div>
          {/* Bubble Pointer */}
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white dark:bg-zinc-800 border-r border-b border-zinc-200/90 dark:border-zinc-700/80 rotate-45" />
        </div>
      )}

      {/* Sleeping Zzz Bubble */}
      {isSleeping && (
        <div className="absolute -top-8 right-2 text-indigo-500 dark:text-indigo-400 font-extrabold text-xs animate-bounce bg-white/90 dark:bg-zinc-800/90 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-zinc-700 shadow-sm flex items-center gap-1">
          <span>Zzz...</span>
          <span className="text-[10px]">😴</span>
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
      >
        {/* Animated Fox / Red Panda SVG */}
        <div className="relative w-14 h-14 filter drop-shadow-lg">
          <svg viewBox="0 0 70 70" className="w-full h-full overflow-visible">
            {/* Tail */}
            <path
              d="M 12 50 C 2 40 4 25 18 20 C 12 32 20 45 25 50 Z"
              fill="#ea580c"
              className="origin-bottom animate-[waveHand_2s_ease-in-out_infinite]"
            />
            <path d="M 12 50 C 6 42 7 32 15 25 Z" fill="#ffffff" />

            {/* Left Ear */}
            <polygon points="18,22 25,6 35,20" fill="#c2410c" />
            <polygon points="21,20 26,10 32,18" fill="#ffedd5" />

            {/* Right Ear */}
            <polygon points="45,20 55,6 62,22" fill="#c2410c" />
            <polygon points="48,18 54,10 59,20" fill="#ffedd5" />

            {/* Head */}
            <circle cx="40" cy="38" r="21" fill="#ea580c" />

            {/* White face patches */}
            <path
              d="M 23 35 C 23 48 35 55 40 55 C 45 55 57 48 57 35 C 50 38 45 35 40 42 C 35 35 30 38 23 35 Z"
              fill="#ffffff"
            />

            {/* Eyes */}
            {isSleeping ? (
              <>
                <path
                  d="M 30 36 Q 34 40 38 36"
                  stroke="#1c1917"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 42 36 Q 46 40 50 36"
                  stroke="#1c1917"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            ) : isDancing ? (
              <>
                {/* Happy Joy Stars for Eyes */}
                <text x="29" y="38" fontSize="9" fill="#1c1917">★</text>
                <text x="43" y="38" fontSize="9" fill="#1c1917">★</text>
              </>
            ) : (
              <>
                <circle cx="33" cy="35" r="3" fill="#1c1917" />
                <circle cx="32" cy="34" r="1" fill="#ffffff" />
                <circle cx="47" cy="35" r="3" fill="#1c1917" />
                <circle cx="46" cy="34" r="1" fill="#ffffff" />
              </>
            )}

            {/* Cheeks */}
            <circle cx="27" cy="42" r="3.5" fill="#f43f5e" opacity="0.5" />
            <circle cx="53" cy="42" r="3.5" fill="#f43f5e" opacity="0.5" />

            {/* Nose & Smile */}
            <polygon points="38,43 42,43 40,45" fill="#1c1917" />
            <path
              d="M 37 46 Q 40 48 43 46"
              stroke="#1c1917"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Paws */}
            <ellipse cx="30" cy="56" rx="5" ry="4" fill="#1c1917" />
            {/* Waving Right Paw */}
            <g className="origin-[50px_52px] animate-wave-hand">
              <ellipse cx="52" cy="48" rx="5.5" ry="4.5" fill="#1c1917" />
            </g>
          </svg>
        </div>

        {/* Mascot Mini Tag */}
        <div className="bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-md border border-zinc-200/80 dark:border-zinc-700/80 text-[11px] font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
          <span>Kiko</span>
          <span className="text-xs">{isSleeping ? '💤' : isDancing ? '🎉' : '✨'}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMinimized(true)
            }}
            className="text-zinc-400 hover:text-zinc-600 ml-1"
            title="Minimize"
          >
            <X size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}
