'use client'
import { useState, useEffect } from 'react'
import { playPeek, playBoing } from '../lib/sound'

export const MASCOTS = [
  {
    id: 'cat',
    name: 'Whiskers',
    speeches: [
      'You got this! 🐾',
      'Meow-velous work! ✨',
      'Purr-fect focus! 😸',
      "Don't stop now! 🐟",
      'Cat-tastic job! 🐱',
      'Paws-itively crushing it! 🐾'
    ],
    color: '#f97316',
    render: () => (
      <svg viewBox="0 0 70 65" className="w-16 h-14 drop-shadow-md overflow-visible select-none">
        {/* Tail wagging behind */}
        <path d="M 12 45 Q 4 35 10 26 Q 16 34 16 42" fill="#fb923c" className="origin-bottom animate-[wave-hand_1.5s_ease-in-out_infinite]" />
        {/* Left Ear */}
        <polygon points="18,25 24,6 34,22" fill="#ea580c" />
        <polygon points="21,22 25,10 31,20" fill="#fecdd3" />
        {/* Right Ear */}
        <polygon points="46,22 56,6 62,25" fill="#ea580c" />
        <polygon points="49,20 55,10 59,22" fill="#fecdd3" />
        {/* Head/Body */}
        <ellipse cx="40" cy="38" rx="22" ry="19" fill="#fb923c" />
        {/* Tummy patch */}
        <ellipse cx="40" cy="45" rx="14" ry="11" fill="#ffedd5" />
        {/* Cheeks */}
        <circle cx="28" cy="42" r="3" fill="#f43f5e" opacity="0.4" />
        <circle cx="52" cy="42" r="3" fill="#f43f5e" opacity="0.4" />
        {/* Eyes (Happy arcs) */}
        <path d="M 30 36 Q 34 32 38 36" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M 42 36 Q 46 32 50 36" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Nose & Mouth */}
        <polygon points="38,39 42,39 40,42" fill="#f43f5e" />
        <path d="M 37 43 Q 40 46 43 43" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Whiskers */}
        <line x1="20" y1="38" x2="12" y2="36" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="42" x2="13" y2="44" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="60" y1="38" x2="68" y2="36" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="60" y1="42" x2="67" y2="44" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round" />
        {/* Left Paw resting on card edge */}
        <ellipse cx="26" cy="54" rx="5" ry="4" fill="#ffedd5" stroke="#ea580c" strokeWidth="1" />
        {/* Right Waving Paw */}
        <g className="origin-[54px_50px] animate-wave-hand">
          <ellipse cx="58" cy="45" rx="6" ry="5" fill="#ffedd5" stroke="#ea580c" strokeWidth="1" />
          <circle cx="58" cy="45" r="2" fill="#f43f5e" opacity="0.5" />
        </g>
      </svg>
    )
  },
  {
    id: 'bear',
    name: 'Barnaby',
    speeches: [
      'Keep going! 🍯',
      'Bear with it! 🐻',
      'Un-bear-lievably good! 🌟',
      'Sweet progress! 🍯',
      'Big bear hug! 🤗',
      'Crushing those goals! 💪'
    ],
    color: '#854d0e',
    render: () => (
      <svg viewBox="0 0 70 65" className="w-16 h-14 drop-shadow-md overflow-visible select-none">
        {/* Left Round Ear */}
        <circle cx="22" cy="18" r="8" fill="#a16207" />
        <circle cx="22" cy="18" r="4.5" fill="#fef08a" />
        {/* Right Round Ear */}
        <circle cx="58" cy="18" r="8" fill="#a16207" />
        <circle cx="58" cy="18" r="4.5" fill="#fef08a" />
        {/* Head */}
        <circle cx="40" cy="35" r="21" fill="#ca8a04" />
        {/* Snout */}
        <ellipse cx="40" cy="40" rx="9" ry="7" fill="#fef08a" />
        <ellipse cx="40" cy="37" rx="3.5" ry="2.5" fill="#422006" />
        <path d="M 40 40 L 40 43" stroke="#422006" strokeWidth="1.5" />
        <path d="M 37 43 Q 40 45 43 43" stroke="#422006" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Eyes */}
        <circle cx="31" cy="32" r="2.5" fill="#1c1917" />
        <circle cx="30" cy="31" r="0.8" fill="#ffffff" />
        <circle cx="49" cy="32" r="2.5" fill="#1c1917" />
        <circle cx="48" cy="31" r="0.8" fill="#ffffff" />
        {/* Cheeks */}
        <circle cx="26" cy="37" r="3.5" fill="#f97316" opacity="0.4" />
        <circle cx="54" cy="37" r="3.5" fill="#f97316" opacity="0.4" />
        {/* Resting Left Paw */}
        <ellipse cx="27" cy="52" rx="6" ry="4.5" fill="#a16207" />
        {/* Right Waving Paw */}
        <g className="origin-[55px_46px] animate-wave-hand">
          <ellipse cx="58" cy="42" rx="6.5" ry="5.5" fill="#a16207" />
          <ellipse cx="58" cy="42" rx="3" ry="2.5" fill="#fef08a" />
        </g>
      </svg>
    )
  },
  {
    id: 'bunny',
    name: 'Pip',
    speeches: [
      'Hop to it! 🥕',
      'No bunny does it better! 🐰',
      'Jump for joy! 🌸',
      'Speedy like a hare! ⚡',
      'Carrot power! 🥕',
      'Bouncing with energy! ✨'
    ],
    color: '#ec4899',
    render: () => (
      <svg viewBox="0 0 70 65" className="w-16 h-14 drop-shadow-md overflow-visible select-none">
        {/* Tall Left Ear */}
        <ellipse cx="28" cy="14" rx="5" ry="13" fill="#fdf2f8" stroke="#f472b6" strokeWidth="1.5" transform="rotate(-8 28 14)" />
        <ellipse cx="28" cy="14" rx="2.5" ry="9" fill="#fbcfe8" transform="rotate(-8 28 14)" />
        {/* Tall Right Ear (Flirty tilt) */}
        <ellipse cx="52" cy="14" rx="5" ry="13" fill="#fdf2f8" stroke="#f472b6" strokeWidth="1.5" transform="rotate(10 52 14)" />
        <ellipse cx="52" cy="14" rx="2.5" ry="9" fill="#fbcfe8" transform="rotate(10 52 14)" />
        {/* Head */}
        <ellipse cx="40" cy="38" rx="20" ry="17" fill="#fdf2f8" stroke="#f472b6" strokeWidth="1.5" />
        {/* Cute Big Eyes */}
        <ellipse cx="32" cy="36" rx="3" ry="4" fill="#374151" />
        <circle cx="31" cy="34" r="1.2" fill="#ffffff" />
        <ellipse cx="48" cy="36" rx="3" ry="4" fill="#374151" />
        <circle cx="47" cy="34" r="1.2" fill="#ffffff" />
        {/* Pink Nose & Smile */}
        <polygon points="38,40 42,40 40,42" fill="#ec4899" />
        <path d="M 37 43 Q 40 45 43 43" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Rosy Cheeks */}
        <circle cx="26" cy="40" r="3.5" fill="#f472b6" opacity="0.4" />
        <circle cx="54" cy="40" r="3.5" fill="#f472b6" opacity="0.4" />
        {/* Left Paw */}
        <ellipse cx="27" cy="52" rx="5" ry="4" fill="#fdf2f8" stroke="#f472b6" strokeWidth="1" />
        {/* Right Waving Paw */}
        <g className="origin-[54px_48px] animate-wave-hand">
          <ellipse cx="57" cy="42" rx="5.5" ry="4.5" fill="#fdf2f8" stroke="#f472b6" strokeWidth="1" />
        </g>
      </svg>
    )
  },
  {
    id: 'robot',
    name: 'Beep',
    speeches: [
      'Power 100%! ⚡',
      'Status: 100% awesome! 🤖',
      'Beep boop! Fantastic! 🚀',
      'CPU running at peak! 🔥',
      'System optimal! ⚙️',
      'Productivity protocol: ON! 💡'
    ],
    color: '#06b6d4',
    render: () => (
      <svg viewBox="0 0 70 65" className="w-16 h-14 drop-shadow-md overflow-visible select-none">
        {/* Antenna */}
        <line x1="40" y1="18" x2="40" y2="8" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="40" cy="7" r="4" fill="#f59e0b" className="animate-pulse" />
        {/* Head Box */}
        <rect x="20" y="18" width="40" height="32" rx="8" fill="#06b6d4" stroke="#0891b2" strokeWidth="1.5" />
        {/* Screen/Face */}
        <rect x="25" y="23" width="30" height="21" rx="5" fill="#164e63" />
        {/* Pixel Eyes */}
        <circle cx="33" cy="32" r="3.5" fill="#22d3ee" className="animate-pulse" />
        <circle cx="47" cy="32" r="3.5" fill="#22d3ee" className="animate-pulse" />
        {/* Smile curve in pixel style */}
        <path d="M 36 38 Q 40 41 44 38" stroke="#a5f3fc" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Left Ear knob */}
        <rect x="16" y="29" width="4" height="9" rx="2" fill="#0891b2" />
        {/* Right Ear knob */}
        <rect x="60" y="29" width="4" height="9" rx="2" fill="#0891b2" />
        {/* Left hand resting */}
        <circle cx="26" cy="51" r="4.5" fill="#0891b2" />
        {/* Right Waving Metal Claw */}
        <g className="origin-[56px_48px] animate-wave-hand">
          <circle cx="58" cy="40" r="5" fill="#f59e0b" />
          <path d="M 55 37 Q 58 34 61 37" stroke="#ffffff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    )
  },
  {
    id: 'dino',
    name: 'Rexy',
    speeches: [
      "Let's crush it! 🦖",
      'Dino-mite effort! 💥',
      'Roar of victory! 🌿',
      'Big stomps, big wins! 🦕',
      'Jurassic productivity! 🍃',
      'T-Rex approved! ⭐'
    ],
    color: '#10b981',
    render: () => (
      <svg viewBox="0 0 70 65" className="w-16 h-14 drop-shadow-md overflow-visible select-none">
        {/* Back Spine plates */}
        <polygon points="18,30 23,20 28,30" fill="#f59e0b" />
        <polygon points="26,20 31,10 36,20" fill="#f59e0b" />
        <polygon points="34,14 39,4 44,14" fill="#f59e0b" />
        {/* Head & Body */}
        <path d="M 24 45 C 24 25 35 15 50 16 C 58 17 62 23 62 30 C 62 38 56 42 52 44 C 48 46 36 48 24 45 Z" fill="#10b981" />
        {/* Belly patch */}
        <ellipse cx="36" cy="42" rx="10" ry="6" fill="#a7f3d0" />
        {/* Cute Big Eye */}
        <circle cx="50" cy="26" r="4" fill="#ffffff" />
        <circle cx="51" cy="26" r="2.5" fill="#064e3b" />
        <circle cx="50" cy="25" r="1" fill="#ffffff" />
        {/* Cute Friendly Tooth/Mouth */}
        <path d="M 54 34 Q 58 37 61 34" stroke="#064e3b" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Rosy Cheek */}
        <circle cx="45" cy="34" r="3" fill="#f43f5e" opacity="0.4" />
        {/* Little Left Claw */}
        <ellipse cx="30" cy="50" rx="4" ry="3" fill="#059669" />
        {/* Right Waving Dino Arm */}
        <g className="origin-[50px_46px] animate-wave-hand">
          <ellipse cx="54" cy="42" rx="5" ry="3.5" fill="#059669" />
        </g>
      </svg>
    )
  },
  {
    id: 'ghost',
    name: 'Blinky',
    speeches: [
      'Doing great! ✨',
      'Boo! I believe in you! 👻',
      'Hauntingly productive! 🔮',
      'Floating through tasks! ☁️',
      'Supernatural speed! 🌌',
      'Spooky clean work! 🌟'
    ],
    color: '#8b5cf6',
    render: () => (
      <svg viewBox="0 0 70 65" className="w-16 h-14 drop-shadow-md overflow-visible select-none">
        {/* Floating Sparkle */}
        <path d="M 40 6 L 41 10 L 45 11 L 41 12 L 40 16 L 39 12 L 35 11 L 39 10 Z" fill="#facc15" className="animate-spin origin-[40px_11px]" />
        {/* Ghost Body */}
        <path d="M 22 45 C 20 22 30 14 40 14 C 50 14 60 22 58 45 C 55 42 52 46 48 43 C 44 46 40 42 36 45 C 32 42 28 46 25 43 C 23 45 22 44 22 45 Z" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="1.5" />
        {/* Happy Eyes */}
        <path d="M 32 29 Q 36 26 40 29" stroke="#5b21b6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M 44 29 Q 48 26 52 29" stroke="#5b21b6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Rosy Cheeks */}
        <circle cx="28" cy="34" r="3.5" fill="#f472b6" opacity="0.4" />
        <circle cx="54" cy="34" r="3.5" fill="#f472b6" opacity="0.4" />
        {/* Open O-mouth */}
        <ellipse cx="41" cy="35" rx="2.5" ry="3.5" fill="#7c3aed" />
        {/* Left hand */}
        <path d="M 24 38 Q 18 36 17 40 Q 18 43 23 41" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="1" />
        {/* Right Waving Spirit Hand */}
        <g className="origin-[54px_38px] animate-wave-hand">
          <path d="M 54 36 Q 62 30 63 35 Q 60 40 55 39" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="1" />
        </g>
      </svg>
    )
  },
  {
    id: 'batman',
    name: 'Batman',
    speeches: [
      'I am vengeance! 🦇',
      "Gotham's tasks await! ⚡",
      'Stay focused! 🛡️',
      'The Bat-Signal is on! 🔦',
      'Justice never rests! 💥',
      'Finish it! 🏆'
    ],
    color: '#09090b',
    render: () => (
      <img
        src="/batman.png"
        alt="Batman"
        className="w-14 h-20 object-contain drop-shadow-md select-none pointer-events-none transform -translate-y-2"
        draggable={false}
      />
    )
  }
]

export default function CardMascot({ index = 0, taskId = '', columnId = '' }) {
  // Compute initial unique seed per card based on taskId and column
  const getSeed = () => {
    let hash = index
    const str = `${taskId}-${columnId}`
    for (let j = 0; j < str.length; j++) {
      hash = (hash + str.charCodeAt(j) * (j + 1)) % MASCOTS.length
    }
    return hash
  }

  const [mascotIdx, setMascotIdx] = useState(getSeed)
  const [speechIdx, setSpeechIdx] = useState(() => Math.floor(Math.random() * 6))
  const [bounce, setBounce] = useState(false)

  // Every time the card is hovered, cycle to a fresh mascot and fresh dialogue!
  const handleHover = () => {
    playPeek()
    setMascotIdx(prev => (prev + 1 + Math.floor(Math.random() * 2)) % MASCOTS.length)
    setSpeechIdx(prev => (prev + 1) % 6)
    setBounce(true)
    setTimeout(() => setBounce(false), 400)
  }

  const currentMascot = MASCOTS[mascotIdx % MASCOTS.length]
  const currentSpeech = currentMascot.speeches[speechIdx % currentMascot.speeches.length]

  return (
    <div
      onMouseEnter={handleHover}
      className={`absolute -top-12 sm:-top-13 right-5 sm:right-7 z-20 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] translate-y-7 opacity-0 scale-75 group-hover:translate-y-0 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto ${
        bounce ? 'scale-110' : ''
      }`}
    >
      {/* Cartoon Character Body */}
      <div className="relative flex items-center justify-center animate-mascot-bob">
        {/* Speech Bubble popping above */}
        <div className="absolute -top-7.5 right-0 whitespace-nowrap bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[11px] font-extrabold px-3 py-1 rounded-xl shadow-lg border border-zinc-200/90 dark:border-zinc-700/80 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75 scale-90 group-hover:scale-100 animate-pop">
          <span className="text-xs">✨</span>
          <span>{currentSpeech}</span>
          {/* Speech bubble tail pointer */}
          <div className="absolute -bottom-1 right-5 w-2.5 h-2.5 bg-white dark:bg-zinc-800 border-r border-b border-zinc-200/90 dark:border-zinc-700/80 rotate-45" />
        </div>

        {/* Mascot SVG */}
        <div
          onClick={(e) => {
            e.stopPropagation()
            playBoing()
            setBounce(true)
            setTimeout(() => setBounce(false), 400)
          }}
          className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
          title={`Hi, I'm ${currentMascot.name}! Click me!`}
        >
          {currentMascot.render()}
        </div>
      </div>
    </div>
  )
}
