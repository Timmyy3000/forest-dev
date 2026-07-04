import { useEffect, useRef, useState } from 'react'
import { mountExplainer } from './explainer.js'

const mono = "'JetBrains Mono', monospace"

const STEPS = [
  {
    title: 'One branch, one line',
    badge: 'without worktrees',
    badgeColor: '#D9A05B',
    caption:
      'A repo starts as one folder on one branch. Every change waits its turn — work moves in a single file line.',
  },
  {
    title: 'Branches ≠ parallel work',
    badge: 'without worktrees',
    badgeColor: '#D9A05B',
    caption:
      'Branches hold parallel histories, but there’s still ONE working folder — only one branch can be checked out at a time. Agents queue, stash, and step on each other.',
  },
  {
    title: 'Worktrees: a folder per branch',
    badge: 'with worktrees',
    badgeColor: '#A3C585',
    caption:
      'A worktree gives each branch its own folder, all sharing one .git. Multiple agents, multiple tasks, all committing at the same time — nobody waits, nothing collides, no limit to how many.',
  },
]

export default function WorktreeModal({ open, onClose }) {
  const [step, setStep] = useState(0)
  const svgRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setStep(0)
    document.body.style.overflow = 'hidden'
    closeRef.current && closeRef.current.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setStep((s) => Math.min(2, s + 1))
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open || !svgRef.current) return
    const dispose = mountExplainer(svgRef.current, step)
    return dispose
  }, [open, step])

  if (!open) return null
  const s = STEPS[step]

  const navBtn = (disabled) => ({
    fontFamily: mono,
    fontSize: 12.5,
    padding: '8px 16px',
    borderRadius: 8,
    cursor: disabled ? 'default' : 'pointer',
    background: disabled ? 'transparent' : '#1C2F25',
    border: `1px solid ${disabled ? 'rgba(237,232,216,0.08)' : 'rgba(163,197,133,0.3)'}`,
    color: disabled ? 'rgba(237,232,216,0.25)' : '#EDE8D8',
  })

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(6,10,8,0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="How do worktrees work?"
        style={{
          width: '100%',
          maxWidth: 720,
          background: '#101A14',
          border: '1px solid rgba(237,232,216,0.12)',
          borderRadius: 16,
          padding: 'clamp(20px,4vw,32px)',
          boxShadow: '0 30px 90px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2
              style={{
                fontFamily: "'Fraunces',Georgia,serif",
                fontWeight: 600,
                fontSize: 'clamp(21px,3vw,26px)',
                margin: '0 0 6px',
                color: '#EDE8D8',
                letterSpacing: '-0.01em',
              }}
            >
              {s.title}
            </h2>
            <span
              style={{
                fontFamily: mono,
                fontSize: 10.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: s.badgeColor,
                border: `1px solid ${s.badgeColor}55`,
                borderRadius: 20,
                padding: '3px 10px',
              }}
            >
              {s.badge}
            </span>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="fx-focus"
            style={{
              fontFamily: mono,
              fontSize: 14,
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: 'pointer',
              background: 'transparent',
              border: '1px solid rgba(237,232,216,0.15)',
              color: 'rgba(237,232,216,0.7)',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 640 330"
          width="100%"
          style={{ display: 'block', margin: '10px 0 4px' }}
          aria-hidden="true"
        />

        <p
          style={{
            fontSize: 14.5,
            lineHeight: 1.6,
            color: 'rgba(237,232,216,0.75)',
            margin: '0 0 18px',
            minHeight: 46,
          }}
        >
          {s.caption}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button type="button" className="fx-focus" disabled={step === 0} onClick={() => setStep(step - 1)} style={navBtn(step === 0)}>
            ← back
          </button>
          <div style={{ display: 'flex', gap: 8 }} aria-label={`step ${step + 1} of 3`}>
            {STEPS.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: i === step ? '#A3C585' : 'rgba(237,232,216,0.18)',
                  transition: 'background .2s',
                }}
              />
            ))}
          </div>
          {step < 2 ? (
            <button type="button" className="fx-focus" onClick={() => setStep(step + 1)} style={navBtn(false)}>
              next →
            </button>
          ) : (
            <button type="button" className="fx-focus" onClick={onClose} style={navBtn(false)}>
              got it
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
