// Web Audio API Synthesizer — High-performance, zero latency, 0 external files
// Engineered to work 100% reliably across Chrome, Edge, Safari, Firefox, and mobile browsers

let audioCtx = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass()
    }
  }
  return audioCtx
}

// Global user interaction listener to wake up & unlock AudioContext immediately on first interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext()
      if (ctx && ctx.state === 'suspended') {
        ctx.resume()
      }
    } catch (e) {}
  }
  ['click', 'touchstart', 'keydown', 'mousedown', 'pointerdown'].forEach((ev) => {
    window.addEventListener(ev, unlockAudio, { passive: true })
  })
}

export function isSoundEnabled() {
  if (typeof window === 'undefined') return true
  const saved = localStorage.getItem('devboard_sound')
  return saved === null ? true : saved === 'true'
}

export function setSoundEnabled(enabled) {
  if (typeof window === 'undefined') return
  localStorage.setItem('devboard_sound', enabled ? 'true' : 'false')
  window.dispatchEvent(new Event('devboard_sound_change'))
}

// Helper to ensure context is fully resumed before scheduling nodes
async function runAudio(action) {
  if (!isSoundEnabled()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    action(ctx)
  } catch (err) {
    // Graceful fallback
  }
}

// 1. Playful Bubble Pop / Button Tap / Modal Click
export function playPop() {
  runAudio((ctx) => {
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    // Bubbly upward pitch swoop: 500Hz -> 1150Hz
    osc.type = 'sine'
    osc.frequency.setValueAtTime(520, t)
    osc.frequency.exponentialRampToValueAtTime(1150, t + 0.1)

    // Clear audible punchy envelope (0.38 gain, 140ms duration)
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(0.38, t + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(t)
    osc.stop(t + 0.14)
  })
}

// 2. Cheerful Airy Whoosh on Card Drag / Open Drawer / Reset
export function playWhoosh() {
  runAudio((ctx) => {
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    // Triangle wave with audible mid frequencies (620Hz -> 920Hz -> 480Hz)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(620, t)
    osc.frequency.linearRampToValueAtTime(920, t + 0.08)
    osc.frequency.linearRampToValueAtTime(480, t + 0.18)

    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(0.28, t + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(t)
    osc.stop(t + 0.19)
  })
}

// 3. Tactile Card Drop / Snap into Column (TODO / IN_PROGRESS)
export function playDrop() {
  runAudio((ctx) => {
    const t = ctx.currentTime

    // Note 1: crisp snap
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(820, t)
    osc1.frequency.exponentialRampToValueAtTime(500, t + 0.07)
    gain1.gain.setValueAtTime(0.001, t)
    gain1.gain.linearRampToValueAtTime(0.32, t + 0.008)
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(t)
    osc1.stop(t + 0.08)

    // Note 2: tactile thud
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(540, t + 0.04)
    osc2.frequency.exponentialRampToValueAtTime(320, t + 0.14)
    gain2.gain.setValueAtTime(0.001, t + 0.04)
    gain2.gain.linearRampToValueAtTime(0.28, t + 0.05)
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(t + 0.04)
    osc2.stop(t + 0.15)
  })
}

// 4. Springy Cartoon Boing for Mascot Kiko Petting / Click
export function playBoing() {
  runAudio((ctx) => {
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    // Bouncy cartoon spring pitch wobble: 400Hz -> 850Hz -> 620Hz -> 800Hz -> 550Hz
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, t)
    osc.frequency.linearRampToValueAtTime(850, t + 0.07)
    osc.frequency.linearRampToValueAtTime(620, t + 0.14)
    osc.frequency.linearRampToValueAtTime(800, t + 0.21)
    osc.frequency.linearRampToValueAtTime(550, t + 0.28)

    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(0.36, t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.29)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(t)
    osc.stop(t + 0.3)
  })
}

// 5. Joyful Victory Arpeggio (Task Moved to DONE! 🌟)
export function playSuccess() {
  runAudio((ctx) => {
    const t = ctx.currentTime
    // C5, E5, G5, C6 + high sparkle E6!
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const startTime = t + i * 0.075

      osc.type = i === notes.length - 1 ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.001, startTime)
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.29)
    })
  })
}

// 6. Bell / Chime Sound for Timer Finish & Important Notifications
export function playChime() {
  runAudio((ctx) => {
    const t = ctx.currentTime
    const chords = [587.33, 880.00, 1174.66] // D5, A5, D6 harmonic chime
    chords.forEach((freq) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.001, t)
      gain.gain.linearRampToValueAtTime(0.24, t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.78)
    })
  })
}

// 7. Subtle Cute Peek Blip on Mascot Wave / Card Hover (Rate-limited)
let lastPeekTime = 0
export function playPeek() {
  const now = Date.now()
  if (now - lastPeekTime < 350) return // prevents audio clutter when cursor moves fast
  lastPeekTime = now
  runAudio((ctx) => {
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, t)
    osc.frequency.exponentialRampToValueAtTime(1300, t + 0.07)
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(0.14, t + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.08)
  })
}
