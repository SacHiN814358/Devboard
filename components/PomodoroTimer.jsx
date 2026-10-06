'use client'
import { useState, useEffect } from 'react'
import { playPop, playWhoosh, playChime } from '../lib/sound'
import { Play, Pause, RotateCcw, X, Sparkles, Coffee, Flame } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function PomodoroTimer({ isOpen, onClose }) {
  const [mode, setMode] = useState('focus') // 'focus' | 'break'
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)

  // Switch modes
  const handleModeChange = (newMode) => {
    playPop()
    setMode(newMode)
    setIsRunning(false)
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60)
  }

  // Timer interval
  useEffect(() => {
    let interval = null
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false)
      playChime()
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 }
        })
      } catch (e) {}
      if (mode === 'focus') {
        setMode('break')
        setTimeLeft(5 * 60)
      } else {
        setMode('focus')
        setTimeLeft(25 * 60)
      }
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, mode])

  if (!isOpen) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60
  const progress = ((totalTime - timeLeft) / totalTime) * 100

  return (
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-3xl p-6 sm:p-7 w-full max-w-sm border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-pop relative">
        {/* Close Button */}
        <button
          onClick={() => {
            playPop()
            onClose()
          }}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Mascot & Title */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-orange-500 to-amber-500 p-1 shadow-lg shadow-orange-500/20 animate-mascot-bob">
            <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-[20px] flex items-center justify-center text-3xl select-none">
              {mode === 'focus' ? '🍅' : '☕'}
            </div>
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight">Focus Pomodoro</h2>
            <p className="text-xs text-zinc-400">
              {mode === 'focus' ? 'Stay in the zone with laser focus' : 'Rest your eyes & stretch a bit'}
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl gap-1 w-full mt-2">
            <button
              onClick={() => handleModeChange('focus')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'focus'
                  ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Flame size={13} /> Focus (25m)
            </button>
            <button
              onClick={() => handleModeChange('break')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'break'
                  ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Coffee size={13} /> Break (5m)
            </button>
          </div>

          {/* Huge Timer Clock Display */}
          <div className="py-6 relative flex flex-col items-center justify-center">
            <span className="text-5xl font-extrabold tracking-tight font-mono text-zinc-900 dark:text-zinc-100">
              {formattedTime}
            </span>
            {/* Progress bar line */}
            <div className="w-48 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 w-full pt-1">
            <button
              onClick={() => {
                playPop()
                setIsRunning(!isRunning)
              }}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/25'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause size={16} /> Pause
                </>
              ) : (
                <>
                  <Play size={16} fill="white" /> Start Focus
                </>
              )}
            </button>

            <button
              onClick={() => {
                playWhoosh()
                setIsRunning(false)
                setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60)
              }}
              className="p-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-600 dark:text-zinc-300 transition-all active:scale-95"
              title="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
