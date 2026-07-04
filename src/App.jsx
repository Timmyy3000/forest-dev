import { useEffect, useRef, useState } from 'react'
import { mountForest } from './forest.js'

const INSTALL = 'curl -fsSL https://forest.timi.click/install.sh | sh'
const REPO = 'https://github.com/Timmyy3000/git-forest'
const TWITTER = 'https://x.com/timithechef'

const mono = "'JetBrains Mono', monospace"

function App() {
  const rootRef = useRef(null)
  const copyTimer = useRef(null)
  const [stars, setStars] = useState('★ —')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const dispose = mountForest(rootRef.current)
    return dispose
  }, [])

  useEffect(() => {
    let dead = false
    fetch('https://api.github.com/repos/Timmyy3000/git-forest')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!dead && typeof d.stargazers_count === 'number') {
          setStars('★ ' + d.stargazers_count.toLocaleString())
        }
      })
      .catch(() => {})
    return () => {
      dead = true
      clearTimeout(copyTimer.current)
    }
  }, [])

  const copyInstall = () => {
    const done = () => {
      setCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 1800)
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(INSTALL).then(done).catch(done)
    } else {
      done()
    }
  }

  return (
    <div
      ref={rootRef}
      style={{
        background: '#0D1512',
        color: '#EDE8D8',
        fontFamily: "'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
        minHeight: '100vh',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ============ HERO (full-bleed stage; content capped inside) ============ */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* faint atmosphere: a low horizon glow, a cool wash up top, a soft vignette — full width */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(135% 95% at 50% 116%, rgba(163,197,133,0.08), transparent 58%), radial-gradient(95% 75% at 50% -10%, rgba(127,166,201,0.05), transparent 60%), radial-gradient(145% 125% at 50% 46%, transparent 54%, rgba(0,0,0,0.32))',
          }}
        />

        {/* translucent vines drooping from the top; barely there — full width */}
        <div
          data-vines-wrap="1"
          aria-hidden="true"
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '44%', zIndex: 0, pointerEvents: 'none' }}
        >
          <svg
            data-vines="1"
            viewBox="0 0 1200 300"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMin slice"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <g data-vines-g="1" />
          </svg>
        </div>

        {/* The signature: a forest that keeps growing, commit by commit — full width */}
        <div
          data-forest-wrap="1"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 46,
            height: 'clamp(280px,50%,560px)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          <svg
            data-forest="1"
            viewBox="0 0 1200 480"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMax meet"
            role="img"
            aria-label="A forest of parallel worktrees growing from the main branch, commit by commit — many trees, many tasks, all visible at once, with dark-mode, kill-jank, and fix-prod marked."
            style={{ display: 'block', overflow: 'visible', fontFamily: mono }}
          >
            <g data-forest-g="1" />
          </svg>
        </div>

        {/* content column, capped */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: 1240,
            margin: '0 auto',
            padding: 'clamp(24px,5vw,56px)',
          }}
        >
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 14.5V7" stroke="#A3C585" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8 9.5C8 7.8 6.6 7 5.2 6" stroke="#A3C585" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8 7C8 5.3 9.4 4.5 10.8 3.5" stroke="#A3C585" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="4.7" cy="5.6" r="1.3" fill="#A3C585" />
                <circle cx="11.3" cy="3.1" r="1.3" fill="#A3C585" />
                <circle cx="8" cy="6.4" r="1" fill="#A3C585" fillOpacity="0.7" />
              </svg>
              <span style={{ fontWeight: 500, fontSize: 15.5, letterSpacing: '0.01em', color: 'rgba(237,232,216,0.92)' }}>
                git-forest
              </span>
            </span>
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="fx-focus"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                textDecoration: 'none',
                color: '#EDE8D8',
                fontSize: 13.5,
                fontWeight: 500,
                padding: '7px 12px',
                border: '1px solid rgba(237,232,216,0.14)',
                borderRadius: 8,
                background: '#16241D',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span data-star-count="1">{stars}</span>
            </a>
          </header>

          {/* The sky: headline, centered */}
          <div
            data-hero-grid="1"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              paddingTop: 'clamp(8px,2.5vw,34px)',
            }}
          >
            <div style={{ maxWidth: 660, width: '100%', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
              <h1
                style={{
                  fontFamily: "'Fraunces',Georgia,serif",
                  fontWeight: 600,
                  fontSize: 'clamp(40px,6vw,70px)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.02em',
                  margin: '0 0 24px',
                  color: '#EDE8D8',
                }}
              >
                <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.06em' }}>
                  <span data-word="1" style={{ display: 'inline-block' }}>
                    Worktrees
                  </span>
                </span>
                <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.06em' }}>
                  <span data-word="2" style={{ display: 'inline-block', fontStyle: 'italic', fontWeight: 500, color: '#A3C585' }}>
                    that&nbsp;don&rsquo;t&nbsp;suck.
                  </span>
                </span>
              </h1>
              <p
                style={{
                  fontSize: 'clamp(15.5px,1.7vw,18px)',
                  lineHeight: 1.62,
                  color: 'rgba(237,232,216,0.82)',
                  margin: '0 auto 30px',
                  maxWidth: '42ch',
                }}
              >
                Forest makes using git worktrees less annoying so you can tokenmaxx and run multiple coding agents on
                every feature at once. Godspeed.
              </p>

              <button
                type="button"
                onClick={copyInstall}
                className="fx-focus"
                aria-label="Copy install command"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                  maxWidth: 520,
                  margin: '0 auto',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: '#16241D',
                  border: '1px solid rgba(163,197,133,0.22)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  color: '#EDE8D8',
                  fontFamily: mono,
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                <span aria-hidden="true" style={{ color: '#A3C585', flexShrink: 0 }}>
                  $
                </span>
                <span style={{ flex: 1, minWidth: 0, overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
                  {INSTALL}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: copied ? '#A3C585' : 'rgba(237,232,216,0.4)',
                    minWidth: 44,
                    textAlign: 'right',
                  }}
                >
                  {copied ? 'copied' : 'copy'}
                </span>
              </button>
              <p
                style={{
                  margin: '14px auto 0',
                  fontSize: 13,
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                  color: 'rgba(237,232,216,0.45)',
                }}
              >
                free &amp; open source&nbsp;&nbsp;·&nbsp;&nbsp;MIT license
              </p>
              <span
                aria-live="polite"
                style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
              >
                {copied ? 'copied to clipboard' : ''}
              </span>
            </div>
          </div>

          <footer
            style={{
              fontSize: 13,
              color: 'rgba(237,232,216,0.5)',
              paddingTop: 8,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              justifyContent: 'space-between',
            }}
          >
            <span>
              <a
                href={REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="fx-focus"
                style={{
                  color: 'rgba(237,232,216,0.72)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                  textDecorationColor: 'rgba(237,232,216,0.25)',
                }}
              >
                GitHub
              </a>
              <span style={{ display: 'inline-block', width: 26, textAlign: 'center', opacity: 0.5 }}>·</span>
              <a
                href="/agents.md"
                className="fx-focus"
                style={{
                  color: 'rgba(237,232,216,0.72)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                  textDecorationColor: 'rgba(237,232,216,0.25)',
                }}
              >
                agents.md
              </a>
            </span>
            <span>
              built by{' '}
              <a
                href={TWITTER}
                target="_blank"
                rel="noopener noreferrer"
                className="fx-focus"
                style={{
                  color: 'rgba(237,232,216,0.72)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                  textDecorationColor: 'rgba(237,232,216,0.25)',
                }}
              >
                @timithechef
              </a>{' '}
              in an afternoon
            </span>
          </footer>
        </div>
      </section>
    </div>
  )
}

export default App
