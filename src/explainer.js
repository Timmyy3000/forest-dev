import { animate } from 'animejs'
import { ICONS } from './icons.js'

const NS = 'http://www.w3.org/2000/svg'
const el = (n) => document.createElementNS(NS, n)

const PAPER = '#EDE8D8'
const MOSS = '#A3C585'
const BLUE = '#7FA6C9'
const AMBER = '#D9A05B'
const RUST = '#C96F4A'
const DIM = 'rgba(237,232,216,0.55)'
const LINE = 'rgba(237,232,216,0.5)'
const MONO = "'JetBrains Mono', monospace"

function makeCtx() {
  const ctx = { dead: false, timers: [], anims: [] }
  ctx.later = (fn, ms) => {
    const t = setTimeout(() => {
      if (!ctx.dead) fn()
    }, ms)
    ctx.timers.push(t)
    return t
  }
  ctx.run = (targets, params) => {
    const a = animate(targets, params)
    ctx.anims.push(a)
    return a
  }
  ctx.dispose = () => {
    ctx.dead = true
    ctx.timers.forEach(clearTimeout)
    ctx.anims.forEach((a) => {
      if (a && typeof a.pause === 'function') a.pause()
    })
  }
  return ctx
}

// ---------- shared bits ----------

// explanatory annotation — Geist italic, dim
function label(x, y, str, anchor = 'middle') {
  const t = el('text')
  t.setAttribute('x', x)
  t.setAttribute('y', y)
  t.setAttribute('fill', 'rgba(237,232,216,0.5)')
  t.setAttribute('font-size', 11.5)
  t.setAttribute('text-anchor', anchor)
  t.setAttribute('font-family', "'Geist', sans-serif")
  t.setAttribute('font-style', 'italic')
  t.textContent = str
  return t
}

// mono text — code artifacts
function text(x, y, str, { size = 12, fill = DIM, anchor = 'middle' } = {}) {
  const t = el('text')
  t.setAttribute('x', x)
  t.setAttribute('y', y)
  t.setAttribute('fill', fill)
  t.setAttribute('font-size', size)
  t.setAttribute('text-anchor', anchor)
  t.setAttribute('font-family', MONO)
  t.textContent = str
  return t
}

// rounded chip centered on x: [icon] label [status dot]
function chip(x, y, labelStr, color, { w, h = 26, fs = 12.5, icon, dot } = {}) {
  const g = el('g')
  const iconW = icon ? 19 : 0
  const dotW = dot ? 15 : 0
  const width = w || Math.round(labelStr.length * 7.2 + 22 + iconW + dotW)
  const r = el('rect')
  r.setAttribute('x', x - width / 2)
  r.setAttribute('y', y - h / 2)
  r.setAttribute('width', width)
  r.setAttribute('height', h)
  r.setAttribute('rx', 7)
  r.setAttribute('fill', '#16241D')
  r.setAttribute('stroke', color)
  r.setAttribute('stroke-opacity', '0.55')
  g.appendChild(r)
  if (icon) {
    const ig = el('g')
    const sc = 12.5 / 24
    ig.setAttribute('transform', `translate(${(x - width / 2 + 9).toFixed(1)}, ${(y - 6.2).toFixed(1)}) scale(${sc.toFixed(3)})`)
    const ip = el('path')
    ip.setAttribute('d', icon.d)
    ip.setAttribute('fill', icon.color)
    ig.appendChild(ip)
    g.appendChild(ig)
  }
  g.appendChild(text(x + iconW / 2 - dotW / 2, y + 4.5, labelStr, { size: fs, fill: PAPER }))
  if (dot) {
    const c = el('circle')
    c.setAttribute('cx', x + width / 2 - 10.5)
    c.setAttribute('cy', y)
    c.setAttribute('r', 3.2)
    c.setAttribute('fill', dot)
    g.appendChild(c)
    g._dot = c
  }
  g._w = width
  return g
}

const setDot = (chipEl, color) => chipEl._dot && chipEl._dot.setAttribute('fill', color)

function hline(x1, x2, y, color = LINE, width = 2) {
  const p = el('path')
  p.setAttribute('d', `M${x1},${y} L${x2},${y}`)
  p.setAttribute('stroke', color)
  p.setAttribute('stroke-width', width)
  p.setAttribute('fill', 'none')
  p.setAttribute('stroke-linecap', 'round')
  const L = p.getTotalLength()
  p.style.strokeDasharray = L
  p.style.strokeDashoffset = L
  p._len = L
  return p
}

function commit(x, y, color, r = 4.5) {
  const c = el('circle')
  c.setAttribute('cx', x)
  c.setAttribute('cy', y)
  c.setAttribute('r', r)
  c.setAttribute('fill', color)
  c.style.transformBox = 'fill-box'
  c.style.transformOrigin = 'center'
  c.style.transform = 'scale(0)'
  return c
}

const popIn = (ctx, node, delay = 0) => ctx.run(node, { scale: [0, 1.25, 1], duration: 380, delay, ease: 'outBack(2)' })

const reveal = (ctx, path, dur = 500, delay = 0) =>
  ctx.run(path, { strokeDashoffset: [path._len, 0], duration: dur, delay, ease: 'outQuad' })

function showAll(nodes) {
  nodes.forEach((n) => {
    if (n._len !== undefined) n.style.strokeDashoffset = 0
    if (n.style.transform === 'scale(0)') n.style.transform = 'scale(1)'
    n.style.opacity = 1
  })
}

// ================= SCENE 1: one branch — agents wait in a queue =================

function scene1(g, ctx, reduced) {
  g.innerHTML = ''
  const Y = 226 // the main line
  const ACTIVE_Y = 186 // where the working agent rides
  const QY = 116 // the waiting queue row
  const QXS = [150, 262, 374] // queue slots

  const folder = chip(320, 42, 'repo/ · main', PAPER, { icon: ICONS.git })
  const ann1 = label(320, 68, 'the repo — one working folder')
  const annQ = label(96, QY - 26, 'the queue: waiting for the one checkout', 'start')

  const claude = chip(QXS[0], QY, 'claude', MOSS, { fs: 11, h: 22, icon: ICONS.claude, dot: AMBER })
  const codex = chip(QXS[1], QY, 'codex', BLUE, { fs: 11, h: 22, icon: ICONS.codex, dot: AMBER })
  const cursor = chip(QXS[2], QY, 'cursor', AMBER, { fs: 11, h: 22, icon: ICONS.cursor, dot: AMBER })

  const line = hline(90, 550, Y)
  const lineLbl = text(90, Y + 24, 'main', { size: 11.5, anchor: 'start' })
  const ann3 = label(550, Y + 44, 'each dot = one commit', 'end')

  const xsA = [180, 270, 360]
  const xsB = [450, 530]
  const cA = xsA.map((x) => commit(x, Y, MOSS))
  const cB = xsB.map((x) => commit(x, Y, BLUE))
  const note = text(320, 300, 'one at a time — everyone else waits in line', { size: 12 })
  note.style.opacity = 0

  ;[line, lineLbl, folder, ann1, annQ, claude, codex, cursor, ann3, ...cA, ...cB, note].forEach((n) => g.appendChild(n))

  if (reduced) {
    showAll([line, ...cA, ...cB, note])
    return
  }

  const play = () => {
    if (ctx.dead) return
    ;[...cA, ...cB].forEach((c) => (c.style.transform = 'scale(0)'))
    line.style.strokeDashoffset = line._len
    note.style.opacity = 0
    ;[claude, codex, cursor].forEach((n) => {
      n.style.transform = ''
      n.style.opacity = 1
      setDot(n, AMBER)
    })

    reveal(ctx, line, 600)

    // claude leaves the queue, drops to the line, and commits left to right
    ctx.later(() => {
      setDot(claude, MOSS)
      ctx.run(claude, { translateX: xsA[0] - QXS[0], translateY: ACTIVE_Y - QY, duration: 600, ease: 'inOutQuad' })
    }, 900)
    xsA.forEach((x, i) => {
      popIn(ctx, cA[i], 1700 + i * 650)
      if (i > 0)
        ctx.later(() => ctx.run(claude, { translateX: x - QXS[0], duration: 450, ease: 'inOutQuad' }), 1300 + i * 650)
    })

    // claude finishes and leaves; codex takes the line; cursor moves up the queue
    ctx.later(() => {
      if (ctx.dead) return
      ctx.run(claude, { opacity: [1, 0], duration: 450 })
      ctx.later(() => {
        setDot(codex, BLUE)
        ctx.run(codex, { translateX: xsB[0] - QXS[1], translateY: ACTIVE_Y - QY, duration: 600, ease: 'inOutQuad' })
        ctx.run(cursor, { translateX: QXS[1] - QXS[2], duration: 500, delay: 50, ease: 'inOutQuad' })
      }, 480)
    }, 3700)

    xsB.forEach((x, i) => {
      popIn(ctx, cB[i], 5100 + i * 650)
      if (i > 0)
        ctx.later(() => ctx.run(codex, { translateX: x - QXS[1], duration: 450, ease: 'inOutQuad' }), 4700 + i * 650)
    })

    ctx.run(note, { opacity: [0, 1], duration: 500, delay: 6200 })

    ctx.later(() => {
      ctx.run(g, {
        opacity: [1, 0],
        duration: 450,
        onComplete: () => {
          if (ctx.dead) return
          g.style.opacity = 1
          play()
        },
      })
    }, 8800)
  }
  play()
}

// ================= SCENE 2: branches, but one checkout =================

function scene2(g, ctx, reduced) {
  g.innerHTML = ''
  const Y = 262
  const YA = 196
  const YB = 124
  const FORK = 175
  const PARK = 116 // where the waiting agent sits
  const RIDE0 = 285 // where the working agent starts riding

  const folder = chip(320, 40, 'repo/ · one working folder', PAPER, { icon: ICONS.git })
  const annHead = label(320, 66, 'HEAD = the branch checked out right now')

  const main = hline(90, 550, Y)
  const mainLbl = text(90, Y + 24, 'main', { size: 11.5, anchor: 'start' })

  const mkBranch = (yTop, color) => {
    const p = el('path')
    p.setAttribute('d', `M${FORK},${Y} C${FORK + 45},${Y} ${FORK + 25},${yTop} ${FORK + 78},${yTop} L520,${yTop}`)
    p.setAttribute('stroke', color)
    p.setAttribute('stroke-width', 2)
    p.setAttribute('fill', 'none')
    p.setAttribute('stroke-linecap', 'round')
    p.setAttribute('stroke-opacity', '0.8')
    const L = p.getTotalLength()
    p.style.strokeDasharray = L
    p.style.strokeDashoffset = L
    p._len = L
    return p
  }
  const brA = mkBranch(YA, MOSS)
  const brB = mkBranch(YB, BLUE)
  const lblA = text(532, YA + 4, 'feat-a', { size: 11.5, fill: MOSS, anchor: 'start' })
  const lblB = text(532, YB + 4, 'feat-b', { size: 11.5, fill: BLUE, anchor: 'start' })

  const head = chip(RIDE0 - 62, YA - 24, 'HEAD', PAPER, { fs: 10, h: 19 })

  // claude starts on feat-a; codex waits, parked by feat-b
  const claude = chip(RIDE0, YA - 24, 'claude', MOSS, { fs: 11, h: 22, icon: ICONS.claude, dot: MOSS })
  const codex = chip(PARK, YB - 24, 'codex', BLUE, { fs: 11, h: 22, icon: ICONS.codex, dot: AMBER })

  const cA = [commit(320, YA, MOSS), commit(400, YA, MOSS)]
  const cB = [commit(320, YB, BLUE), commit(400, YB, BLUE)]

  const checkout = text(320, 312, '$ git checkout feat-b   # stash your changes first…', { size: 12, fill: AMBER })
  checkout.style.opacity = 0
  const bang = text(320, 92, '✕ one checkout — you can’t both work at once', { size: 11.5, fill: RUST })
  bang.style.opacity = 0

  ;[main, mainLbl, brA, brB, lblA, lblB, folder, annHead, head, claude, codex, ...cA, ...cB, checkout, bang].forEach((n) =>
    g.appendChild(n)
  )

  if (reduced) {
    showAll([main, brA, brB, ...cA, ...cB, checkout])
    return
  }

  const play = () => {
    if (ctx.dead) return
    ;[...cA, ...cB].forEach((c) => (c.style.transform = 'scale(0)'))
    ;[main, brA, brB].forEach((p) => (p.style.strokeDashoffset = p._len))
    checkout.style.opacity = 0
    bang.style.opacity = 0
    ;[head, claude, codex].forEach((n) => (n.style.transform = ''))
    setDot(claude, MOSS)
    setDot(codex, AMBER)

    reveal(ctx, main, 500)
    reveal(ctx, brA, 550, 400)
    reveal(ctx, brB, 550, 520)

    // claude rides feat-a, landing commits; codex waits
    ;[320, 400].forEach((x, i) => {
      popIn(ctx, cA[i], 1400 + i * 700)
      ctx.later(() => {
        ctx.run(claude, { translateX: x + 55 - RIDE0, duration: 500, ease: 'inOutQuad' })
        ctx.run(head, { translateX: x + 55 - RIDE0, duration: 500, ease: 'inOutQuad' })
      }, 1000 + i * 700)
    })

    // the checkout dance: HEAD jumps branches, the agents trade places
    ctx.later(() => {
      if (ctx.dead) return
      ctx.run(checkout, { opacity: [0, 1], duration: 350 })
      ctx.later(() => {
        ctx.run(head, { translateY: YB - YA, duration: 600, ease: 'inOutQuad' })
        // claude parks by feat-a, now waiting
        ctx.run(claude, { translateX: PARK - RIDE0, duration: 650, ease: 'inOutQuad' })
        // codex takes the ride position on feat-b
        ctx.run(codex, { translateX: RIDE0 - PARK, duration: 650, delay: 100, ease: 'inOutQuad' })
      }, 400)
      ctx.later(() => {
        setDot(claude, AMBER)
        setDot(codex, BLUE)
      }, 1000)
    }, 3100)

    // codex rides feat-b
    ;[320, 400].forEach((x, i) => {
      popIn(ctx, cB[i], 5100 + i * 700)
      ctx.later(() => {
        ctx.run(codex, { translateX: RIDE0 - PARK + (x + 55 - RIDE0), duration: 500, ease: 'inOutQuad' })
        ctx.run(head, { translateX: x + 55 - RIDE0, duration: 500, ease: 'inOutQuad' })
      }, 4700 + i * 700)
    })

    // both try to work at once — there's only one HEAD
    ctx.later(() => {
      if (ctx.dead) return
      setDot(claude, MOSS)
      ctx.run(checkout, { opacity: [1, 0], duration: 300 })
      ctx.run(folder, { translateX: [0, -5, 5, -4, 4, 0], duration: 480, delay: 400, ease: 'inOutQuad' })
      ctx.run(bang, { opacity: [0, 1], duration: 350, delay: 450 })
    }, 6800)

    ctx.later(() => {
      ctx.run(g, {
        opacity: [1, 0],
        duration: 450,
        onComplete: () => {
          if (ctx.dead) return
          g.style.opacity = 1
          play()
        },
      })
    }, 9400)
  }
  play()
}

// ================= SCENE 3: worktrees — everyone at once =================

function scene3(g, ctx, reduced) {
  g.innerHTML = ''
  const cols = [
    { x: 150, color: MOSS, name: 'dark-mode/', icon: ICONS.claude },
    { x: 320, color: BLUE, name: 'kill-jank/', icon: ICONS.codex },
    { x: 490, color: AMBER, name: 'fix-prod/', icon: ICONS.cursor },
  ]
  const TOP = 58
  const BOT = 236
  const GIT_Y = 294

  const ann1 = label(320, 26, 'each folder is a worktree — same repo, its own branch')
  const gitChip = chip(320, GIT_Y, 'one shared .git', PAPER, { fs: 11.5, h: 24, icon: ICONS.git })
  const parts = [ann1, gitChip]

  const perCol = cols.map((c) => {
    // one rect per agent: logo + its worktree folder + a working dot, all inside
    const card = chip(c.x, TOP, c.name, c.color, { fs: 11.5, h: 26, icon: c.icon, dot: c.color })
    const line = el('path')
    line.setAttribute('d', `M${c.x},${BOT} L${c.x},${TOP + 22}`)
    line.setAttribute('stroke', c.color)
    line.setAttribute('stroke-width', 2)
    line.setAttribute('stroke-opacity', '0.8')
    line.setAttribute('stroke-linecap', 'round')
    line.setAttribute('fill', 'none')
    const L = line.getTotalLength()
    line.style.strokeDasharray = L
    line.style.strokeDashoffset = L
    line._len = L
    const link = el('path')
    link.setAttribute('d', `M${c.x},${BOT + 10} C${c.x},${BOT + 38} 320,${GIT_Y - 38} 320,${GIT_Y - 14}`)
    link.setAttribute('stroke', 'rgba(237,232,216,0.25)')
    link.setAttribute('stroke-width', 1.3)
    link.setAttribute('fill', 'none')
    link.setAttribute('stroke-dasharray', '3 5')
    const ys = [212, 172, 132, 96]
    const commits = ys.map((y) => commit(c.x, y, c.color, 4))
    parts.push(link, line, card, ...commits)
    return { ...c, line, commits, card }
  })

  const note = text(320, GIT_Y + 26, 'every branch gets its own folder — everyone works at once', { size: 12 })
  note.style.opacity = 0
  parts.push(note)
  parts.forEach((n) => g.appendChild(n))

  if (reduced) {
    showAll([note, ...perCol.flatMap((c) => [c.line, ...c.commits])])
    return
  }

  // working dots pulse the whole time — everyone is live
  perCol.forEach((c, i) => {
    if (c.card._dot)
      ctx.run(c.card._dot, { opacity: [1, 0.25], duration: 900, delay: i * 300, loop: true, alternate: true, ease: 'inOutSine' })
  })

  const play = () => {
    if (ctx.dead) return
    perCol.forEach((c) => {
      c.line.style.strokeDashoffset = c.line._len
      c.commits.forEach((n) => (n.style.transform = 'scale(0)'))
    })
    note.style.opacity = 0
    perCol.forEach((c, i) => {
      reveal(ctx, c.line, 700, 200 + i * 120)
      c.commits.forEach((n, k) => popIn(ctx, n, 900 + k * 700 + i * 230))
    })
    ctx.run(note, { opacity: [0, 1], duration: 500, delay: 900 + 4 * 700 })
    ctx.later(() => {
      ctx.run(g, {
        opacity: [1, 0],
        duration: 450,
        onComplete: () => {
          if (ctx.dead) return
          g.style.opacity = 1
          play()
        },
      })
    }, 900 + 4 * 700 + 2300)
  }
  play()
}

// ================= public API =================

const SCENES = [scene1, scene2, scene3]

export function mountExplainer(svgEl_, step) {
  const ctx = makeCtx()
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let g = svgEl_.querySelector('g')
  if (!g) {
    g = el('g')
    svgEl_.appendChild(g)
  }
  g.style.opacity = 1
  SCENES[step](g, ctx, reduced)
  return () => ctx.dispose()
}
