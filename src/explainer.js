import { animate, createTimeline } from 'animejs'
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
  ctx.tl = (params) => {
    const t = createTimeline(params)
    ctx.anims.push(t)
    return t
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

// explanatory annotation — Geist, dim, so "explanation" reads differently from mono "code"
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

function text(x, y, str, { size = 12, fill = DIM, anchor = 'middle', weight = 400 } = {}) {
  const t = el('text')
  t.setAttribute('x', x)
  t.setAttribute('y', y)
  t.setAttribute('fill', fill)
  t.setAttribute('font-size', size)
  t.setAttribute('text-anchor', anchor)
  t.setAttribute('font-family', MONO)
  if (weight !== 400) t.setAttribute('font-weight', weight)
  return t
}

// a rounded chip with a mono label, centered on x; optional brand icon and status dot
function chip(x, y, label, color, { w, h = 26, fs = 12.5, icon, dot } = {}) {
  const g = el('g')
  const iconW = icon ? 19 : 0
  const dotW = dot ? 14 : 0
  const width = w || label.length * 7.6 + 22 + iconW + dotW
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
  const t = text(x + iconW / 2 - dotW / 2, y + 4.5, label, { size: fs, fill: PAPER })
  g.appendChild(t)
  if (dot) {
    const c = el('circle')
    c.setAttribute('cx', x + width / 2 - 10)
    c.setAttribute('cy', y)
    c.setAttribute('r', 3)
    c.setAttribute('fill', dot)
    g.appendChild(c)
    g._dot = c
  }
  g._w = width
  return g
}

// small status dot + word to the side of an agent chip
function status(x, y, word, color) {
  const g = el('g')
  const c = el('circle')
  c.setAttribute('cx', x)
  c.setAttribute('cy', y - 3.5)
  c.setAttribute('r', 3.2)
  c.setAttribute('fill', color)
  g.appendChild(c)
  g.appendChild(text(x + 9, y, word, { size: 11, fill: color, anchor: 'start' }))
  return g
}

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

const popIn = (ctx, node, delay = 0) =>
  ctx.run(node, { scale: [0, 1.3, 1], duration: 420, delay, ease: 'outBack(2.5)' })

function reveal(ctx, path, dur = 500, delay = 0) {
  ctx.run(path, { strokeDashoffset: [path._len, 0], duration: dur, delay, ease: 'outQuad' })
}

function showAll(nodes) {
  nodes.forEach((n) => {
    if (n._len !== undefined) n.style.strokeDashoffset = 0
    if (n.style.transform === 'scale(0)') n.style.transform = 'scale(1)'
    n.style.opacity = 1
  })
}

// ================= SCENE 1: one repo, one branch =================

function scene1(g, ctx, reduced) {
  g.innerHTML = ''
  const Y = 215
  const folder = chip(320, 44, 'repo/  \u00b7  main', PAPER, { icon: ICONS.git })
  const line = hline(90, 550, Y)
  const lineLbl = text(90, Y + 24, 'main', { size: 11.5, anchor: 'start' })

  // the queue: one agent works, the rest wait in line
  const QX = 122
  const SLOTS = [126, 158, 190]
  const claude = chip(QX, SLOTS[0], 'claude', MOSS, { fs: 11, h: 22, icon: ICONS.claude })
  const codex = chip(QX, SLOTS[1], 'codex', BLUE, { fs: 11, h: 22, icon: ICONS.codex })
  const cursor = chip(QX, SLOTS[2], 'cursor', AMBER, { fs: 11, h: 22, icon: ICONS.cursor })
  const sCodex = label(178, SLOTS[1] + 4, 'in queue\u2026', 'start')
  const sCursor = label(178, SLOTS[2] + 4, 'in queue\u2026', 'start')

  const ann1 = label(320, 70, 'the repo \u2014 one working folder')
  const annQ = label(78, 98, 'agents queue for the one checkout', 'start')
  const ann3 = label(550, Y + 44, 'each dot = one commit', 'end')

  const xsA = [200, 280, 360]
  const xsB = [440, 520]
  const cA = xsA.map((x) => commit(x, Y, MOSS))
  const cB = xsB.map((x) => commit(x, Y, BLUE))
  const note = text(320, 292, 'one at a time \u2014 everyone else waits in line', { size: 12 })
  note.style.opacity = 0
  ;[line, lineLbl, folder, claude, codex, cursor, sCodex, sCursor, ann1, annQ, ann3, ...cA, ...cB, note].forEach((n) =>
    g.appendChild(n)
  )

  if (reduced) {
    showAll([line, ...cA, ...cB, note])
    return
  }

  const play = () => {
    if (ctx.dead) return
    ;[...cA, ...cB].forEach((c) => (c.style.transform = 'scale(0)'))
    line.style.strokeDashoffset = line._len
    note.style.opacity = 0
    ;[claude, codex, cursor, sCodex, sCursor].forEach((n) => {
      n.style.transform = ''
      n.style.opacity = 1
    })

    reveal(ctx, line, 600)

    // claude steps out of the queue onto the line and commits
    ctx.run(claude, { translateX: xsA[0] - QX, translateY: Y - 40 - SLOTS[0], duration: 550, delay: 900, ease: 'inOutQuad' })
    xsA.forEach((x, i) => {
      popIn(ctx, cA[i], 1600 + i * 600)
      if (i > 0) ctx.run(claude, { translateX: x - QX, duration: 420, delay: 1250 + i * 600, ease: 'inOutQuad' })
    })

    // claude finishes; codex moves up and takes over; cursor shuffles forward
    ctx.later(() => {
      if (ctx.dead) return
      ctx.run(claude, { opacity: [1, 0], duration: 400 })
      ctx.run(sCodex, { opacity: [1, 0], duration: 300 })
      ctx.run(codex, { translateX: xsB[0] - QX, translateY: Y - 40 - SLOTS[1], duration: 600, delay: 250, ease: 'inOutQuad' })
      ctx.run(cursor, { translateY: SLOTS[0] - SLOTS[2], duration: 450, delay: 250, ease: 'inOutQuad' })
      ctx.run(sCursor, { translateY: SLOTS[0] - SLOTS[2], duration: 450, delay: 250, ease: 'inOutQuad' })
    }, 3500)
    xsB.forEach((x, i) => {
      popIn(ctx, cB[i], 4500 + i * 600)
      if (i > 0) ctx.run(codex, { translateX: x - QX, duration: 420, delay: 4150 + i * 600, ease: 'inOutQuad' })
    })

    ctx.run(note, { opacity: [0, 1], duration: 500, delay: 5600 })
    ctx.later(() => {
      ctx.run(g, {
        opacity: [1, 0],
        duration: 400,
        onComplete: () => {
          if (ctx.dead) return
          g.style.opacity = 1
          play()
        },
      })
    }, 8100)
  }
  play()
}

// ================= SCENE 2: branches, but one folder =================

function scene2(g, ctx, reduced) {
  g.innerHTML = ''
  const Y = 250
  const YA = 168
  const YB = 108
  const FORK = 190

  const main = hline(90, 550, Y)
  const mainLbl = text(90, Y + 24, 'main', { size: 11.5, anchor: 'start' })

  const mkBranch = (yTop, color) => {
    const p = el('path')
    p.setAttribute('d', `M${FORK},${Y} C${FORK + 45},${Y} ${FORK + 25},${yTop} ${FORK + 78},${yTop} L545,${yTop}`)
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
  const lblA = text(556, YA + 4, 'feat-a', { size: 11.5, fill: MOSS, anchor: 'start' })
  const lblB = text(556, YB + 4, 'feat-b', { size: 11.5, fill: BLUE, anchor: 'start' })

  const folder = chip(320, 40, 'repo/  ·  one working folder', PAPER, { icon: ICONS.git })
  const head = chip(330, YA, 'HEAD', AMBER, { fs: 10.5, h: 20 })
  head.style.transformBox = 'fill-box'

  const agentA = chip(126, YA, 'claude', MOSS, { fs: 11, h: 22, icon: ICONS.claude })
  const agentB = chip(126, YB, 'codex', BLUE, { fs: 11, h: 22, icon: ICONS.codex })
  const stA = status(90, YA - 22, 'working', MOSS)
  const stB = status(90, YB - 22, 'waiting…', AMBER)

  const cA = [commit(300, YA, MOSS), commit(390, YA, MOSS)]
  const cB = [commit(300, YB, BLUE), commit(390, YB, BLUE)]

  const checkout = text(320, 305, '$ git checkout feat-b   # stash your changes first…', { size: 12, fill: AMBER })
  checkout.style.opacity = 0
  const ann1 = label(320, 64, 'still one working folder')
  const ann2 = label(364, YA - 14, 'HEAD = the branch checked out right now', 'start')

  ;[main, mainLbl, brA, brB, lblA, lblB, folder, head, agentA, agentB, stA, stB, ...cA, ...cB, checkout, ann1, ann2].forEach(
    (n) => g.appendChild(n)
  )

  if (reduced) {
    showAll([main, brA, brB, ...cA, ...cB, checkout])
    return
  }

  const setStatus = (stEl, word, color) => {
    stEl.innerHTML = ''
    const c = el('circle')
    c.setAttribute('cx', 90)
    c.setAttribute('cy', (stEl === stA ? YA : YB) - 25.5)
    c.setAttribute('r', 3.2)
    c.setAttribute('fill', color)
    stEl.appendChild(c)
    stEl.appendChild(text(99, (stEl === stA ? YA : YB) - 22, word, { size: 11, fill: color, anchor: 'start' }))
  }

  const play = () => {
    if (ctx.dead) return
    ;[...cA, ...cB].forEach((c) => (c.style.transform = 'scale(0)'))
    ;[main, brA, brB].forEach((p) => (p.style.strokeDashoffset = p._len))
    checkout.style.opacity = 0
    head.style.transform = ''
    setStatus(stA, 'working', MOSS)
    setStatus(stB, 'waiting…', AMBER)

    reveal(ctx, main, 500)
    reveal(ctx, brA, 500, 400)
    reveal(ctx, brB, 500, 500)

    // act 1: HEAD on feat-a, agent-1 commits, agent-2 waits
    popIn(ctx, cA[0], 1200)
    popIn(ctx, cA[1], 1800)

    // act 2: checkout dance — HEAD jumps, amber warning flashes
    ctx.later(() => {
      if (ctx.dead) return
      ctx.run(checkout, { opacity: [0, 1], duration: 350 })
      ctx.run(head, { translateY: YB - YA, duration: 650, delay: 350, ease: 'inOutBack(1.4)' })
      setStatus(stA, 'stashed · waiting…', AMBER)
      setStatus(stB, 'working', BLUE)
    }, 2600)

    // act 3: agent-2 commits, agent-1 waits
    popIn(ctx, cB[0], 3900)
    popIn(ctx, cB[1], 4500)

    // act 4: both try at once — collision
    ctx.later(() => {
      if (ctx.dead) return
      setStatus(stA, 'working?', MOSS)
      setStatus(stB, 'working?', BLUE)
      ctx.run(folder, { translateX: [0, -5, 5, -4, 4, 0], duration: 450, delay: 450, ease: 'inOutQuad' })
      const bang = text(320, 86, '✕ one checkout — you can’t both be here', { size: 11.5, fill: RUST })
      bang.style.opacity = 0
      g.appendChild(bang)
      ctx.run(bang, { opacity: [0, 1], duration: 300, delay: 500 })
      ctx.later(() => bang.remove(), 2600)
    }, 5300)

    ctx.later(() => {
      ctx.run(g, {
        opacity: [1, 0],
        duration: 400,
        onComplete: () => {
          if (ctx.dead) return
          g.style.opacity = 1
          play()
        },
      })
    }, 8600)
  }
  play()
}

// ================= SCENE 3: worktrees =================

function scene3(g, ctx, reduced) {
  g.innerHTML = ''
  const cols = [
    { x: 150, color: MOSS, name: 'dark-mode/', agent: 'claude', icon: ICONS.claude },
    { x: 320, color: BLUE, name: 'kill-jank/', agent: 'codex', icon: ICONS.codex },
    { x: 490, color: AMBER, name: 'fix-prod/', agent: 'cursor', icon: ICONS.cursor },
  ]
  const TOP = 74
  const BOT = 240
  const GIT_Y = 298

  const gitChip = chip(320, GIT_Y, 'one shared .git', PAPER, { fs: 11.5, h: 24, icon: ICONS.git })
  const ann1 = label(320, 20, 'each folder is a worktree \u2014 same repo, its own branch')
  const parts = [gitChip, ann1]
  const perCol = cols.map((c) => {
    const agent = chip(c.x, 42, c.agent, c.color, { fs: 11, h: 22, icon: c.icon, dot: c.color })
    const folder = chip(c.x, TOP, c.name, c.color, { fs: 11.5, h: 24 })
    const line = el('path')
    line.setAttribute('d', `M${c.x},${BOT} L${c.x},${TOP + 20}`)
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
    link.setAttribute('d', `M${c.x},${BOT + 10} C${c.x},${BOT + 40} 320,${GIT_Y - 40} 320,${GIT_Y - 14}`)
    link.setAttribute('stroke', 'rgba(237,232,216,0.25)')
    link.setAttribute('stroke-width', 1.3)
    link.setAttribute('fill', 'none')
    link.setAttribute('stroke-dasharray', '3 5')
    const ys = [216, 178, 140, 108]
    const commits = ys.map((y) => commit(c.x, y, c.color, 4))
    parts.push(link, line, agent, folder, ...commits)
    return { ...c, line, commits, folder, agent }
  })
  const note = text(320, GIT_Y + 26, 'every branch gets its own folder \u2014 everyone works at once', { size: 12 })
  note.style.opacity = 0
  parts.push(note)
  parts.forEach((n) => g.appendChild(n))

  if (reduced) {
    showAll([note, ...perCol.flatMap((c) => [c.line, ...c.commits])])
    return
  }

  // working dots pulse the whole time \u2014 everyone is live at once
  perCol.forEach((c, i) => {
    if (c.agent._dot)
      ctx.run(c.agent._dot, { opacity: [1, 0.25], duration: 900, delay: i * 300, loop: true, alternate: true, ease: 'inOutSine' })
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
      // interleaved commits \u2014 everyone lands work at the same time
      c.commits.forEach((n, k) => popIn(ctx, n, 900 + k * 700 + i * 230))
    })
    ctx.run(note, { opacity: [0, 1], duration: 500, delay: 900 + 4 * 700 })
    ctx.later(() => {
      ctx.run(g, {
        opacity: [1, 0],
        duration: 400,
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
