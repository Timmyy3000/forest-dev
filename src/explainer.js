import { animate, createTimeline } from 'animejs'

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

// a rounded chip with a mono label, centered on x
function chip(x, y, label, color, { w, h = 26, fs = 12.5 } = {}) {
  const g = el('g')
  const width = w || label.length * 7.6 + 22
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
  const t = text(x, y + 4.5, label, { size: fs, fill: PAPER })
  g.appendChild(t)
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
  const Y = 205
  const folder = chip(320, 52, 'repo/  ·  main', PAPER)
  const line = hline(90, 550, Y)
  const lineLbl = text(90, Y + 24, 'main', { size: 11.5, anchor: 'start' })
  const agent = chip(150, Y - 46, 'agent-1', MOSS, { fs: 11.5, h: 23 })
  const st = status(196, Y - 42, 'working', MOSS)
  const xs = [160, 250, 340, 430, 520]
  const commits = xs.map((x) => commit(x, Y, MOSS))
  const note = text(320, 285, 'one change at a time, in a single line', { size: 12 })
  note.style.opacity = 0
  const ann1 = label(320, 78, 'the repo — one working folder')
  const ann2 = label(150, Y - 74, 'a coding agent')
  const ann3 = label(550, Y + 44, 'each dot = one commit', 'end')
  ;[line, lineLbl, folder, agent, st, ...commits, note, ann1, ann2, ann3].forEach((n) => g.appendChild(n))

  if (reduced) {
    showAll([line, ...commits, note])
    return
  }

  agent.style.opacity = 0
  st.style.opacity = 0

  const play = () => {
    if (ctx.dead) return
    commits.forEach((c) => (c.style.transform = 'scale(0)'))
    line.style.strokeDashoffset = line._len
    note.style.opacity = 0
    agent.style.opacity = 0
    st.style.opacity = 0
    reveal(ctx, line, 650)
    ctx.run([agent, st], { opacity: [0, 1], duration: 400, delay: 500 })
    xs.forEach((x, i) => {
      const t = 800 + i * 620
      popIn(ctx, commits[i], t)
      ctx.run(agent, { translateX: x - 150, duration: 480, delay: Math.max(0, t - 380), ease: 'inOutQuad' })
      ctx.run(st, { translateX: x - 150, duration: 480, delay: Math.max(0, t - 380), ease: 'inOutQuad' })
    })
    ctx.run(note, { opacity: [0, 1], duration: 500, delay: 800 + xs.length * 620 })
    ctx.later(() => {
      ctx.run(g, {
        opacity: [1, 0],
        duration: 400,
        onComplete: () => {
          if (ctx.dead) return
          agent.style.transform = ''
          st.style.transform = ''
          g.style.opacity = 1
          play()
        },
      })
    }, 800 + xs.length * 620 + 1900)
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

  const folder = chip(320, 40, 'repo/  ·  one working folder', PAPER)
  const head = chip(330, YA, 'HEAD', AMBER, { fs: 10.5, h: 20 })
  head.style.transformBox = 'fill-box'

  const agentA = chip(126, YA, 'agent-1', MOSS, { fs: 11, h: 22 })
  const agentB = chip(126, YB, 'agent-2', BLUE, { fs: 11, h: 22 })
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
    { x: 150, color: MOSS, name: 'dark-mode/', agent: 'agent-1' },
    { x: 320, color: BLUE, name: 'kill-jank/', agent: 'agent-2' },
    { x: 490, color: AMBER, name: 'fix-prod/', agent: 'agent-3' },
  ]
  const TOP = 66
  const BOT = 238
  const GIT_Y = 296

  const gitChip = chip(320, GIT_Y, 'one shared .git', PAPER, { fs: 11.5, h: 24 })
  const parts = [gitChip]
  const perCol = cols.map((c) => {
    const folder = chip(c.x, TOP, c.name, c.color, { fs: 11.5, h: 24 })
    const agent = status(c.x - 34, TOP - 22, 'working', c.color)
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
    link.setAttribute('d', `M${c.x},${BOT + 10} C${c.x},${BOT + 40} 320,${GIT_Y - 40} 320,${GIT_Y - 14}`)
    link.setAttribute('stroke', 'rgba(237,232,216,0.25)')
    link.setAttribute('stroke-width', 1.3)
    link.setAttribute('fill', 'none')
    link.setAttribute('stroke-dasharray', '3 5')
    const ys = [210, 172, 134, 96]
    const commits = ys.map((y) => commit(c.x, y, c.color, 4))
    parts.push(link, line, folder, agent, ...commits)
    return { ...c, line, commits, folder, agent }
  })
  const note = text(320, GIT_Y + 26, 'every branch gets its own folder — everyone works at once', { size: 12 })
  note.style.opacity = 0
  const ann1 = label(320, 30, 'each folder is a worktree — same repo, its own branch')
  parts.push(note, ann1)
  parts.forEach((n) => g.appendChild(n))

  if (reduced) {
    showAll([note, ...perCol.flatMap((c) => [c.line, ...c.commits])])
    return
  }

  const play = () => {
    if (ctx.dead) return
    perCol.forEach((c) => {
      c.line.style.strokeDashoffset = c.line._len
      c.commits.forEach((n) => (n.style.transform = 'scale(0)'))
    })
    note.style.opacity = 0
    perCol.forEach((c, i) => {
      reveal(ctx, c.line, 700, 200 + i * 120)
      // interleaved commits — everyone lands work at the same time
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
