import { animate, createTimeline, stagger } from 'animejs'

const NS = 'http://www.w3.org/2000/svg'
const svgEl = (n) => document.createElementNS(NS, n)
const R = (a, b) => a + Math.random() * (b - a)

// status → colour. green = in progress, blue = merged, orange = blocked
const COL = { progress: '#A3C585', merged: '#7FA6C9', blocked: '#D9A05B' }
const GLOW = { progress: 'rgba(163,197,133,', merged: 'rgba(127,166,201,', blocked: 'rgba(217,160,91,' }

// mobile: fewer, bigger trees across a narrower scene so they read at phone size
const TREES_MOBILE = [
  { xf: 0.11, h: 215, depth: 4, layer: 0.85, tag: 'dark-mode', label: 'dark-mode' },
  { xf: 0.33, h: 120, depth: 3, layer: 0.35 },
  { xf: 0.53, h: 240, depth: 4, layer: 1.0, tag: 'kill-jank', label: 'kill-jank', status: 'merged' },
  { xf: 0.73, h: 115, depth: 3, layer: 0.3, status: 'merged' },
  { xf: 0.9, h: 205, depth: 4, layer: 0.8, tag: 'fix-prod', label: 'fix-prod', status: 'blocked' },
]

// many trees, spread out; three are named worktrees.
// tall & named trees live on the flanks (clear of the centred copy); the middle stays short
const TREES = [
  { xf: 0.045, h: 168, depth: 3, layer: 0.3, status: 'merged' },
  { xf: 0.135, h: 240, depth: 4, layer: 0.9, tag: 'dark-mode', label: 'dark-mode' },
  { xf: 0.225, h: 150, depth: 3, layer: 0.5 },
  { xf: 0.32, h: 118, depth: 3, layer: 0.32 },
  { xf: 0.41, h: 140, depth: 3, layer: 0.5, status: 'blocked' },
  { xf: 0.775, h: 108, depth: 3, layer: 0.28 },
  { xf: 0.59, h: 134, depth: 3, layer: 0.44, status: 'merged' },
  { xf: 0.68, h: 150, depth: 3, layer: 0.52 },
  { xf: 0.5, h: 250, depth: 4, layer: 1.0, tag: 'kill-jank', label: 'kill-jank', status: 'merged' },
  { xf: 0.865, h: 176, depth: 3, layer: 0.5 },
  { xf: 0.945, h: 224, depth: 4, layer: 0.82, tag: 'fix-prod', label: 'fix-prod', status: 'blocked' },
]

export function mountForest(root) {
  const ctx = {
    dead: false,
    reduced: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    timers: [],
    anims: [],
    segs: [],
    nodes: [],
    pills: [],
    roots: [],
    liveSpines: [],
    active: 0,
  }
  const later = (fn, ms) => {
    const t = setTimeout(fn, ms)
    ctx.timers.push(t)
    return t
  }
  const run = (targets, params) => {
    const a = animate(targets, params)
    ctx.anims.push(a)
    return a
  }

  const g = root.querySelector('[data-forest-g]')
  const words = Array.from(root.querySelectorAll('[data-word]'))
  if (!g) return () => {}

  // narrower scene + bigger type on phones so the forest isn't postage-stamp sized
  const mobile = window.innerWidth <= 820
  const svg = root.querySelector('[data-forest]')
  if (mobile && svg) svg.setAttribute('viewBox', '0 0 480 480')

  buildForest(ctx, g, {
    W: mobile ? 480 : 1200,
    trees: mobile ? TREES_MOBILE : TREES,
    fs: mobile ? 1.45 : 1,
  })
  buildVines(ctx, root, run)
  const ground = ctx.ground

  if (ctx.reduced) {
    words.forEach((w) => {
      w.style.transform = 'none'
      w.style.opacity = 1
    })
    ground.style.strokeDashoffset = 0
    ctx.segs.forEach((s) => {
      s.pathEl.style.strokeDashoffset = 0
    })
    ctx.nodes.forEach((n) => {
      n.style.transform = 'scale(1)'
      n.style.opacity = n.dataset.baseOpacity
    })
    ctx.pills.forEach((p) => {
      p.style.opacity = 1
    })
  } else {
    words.forEach((w) => {
      w.style.transform = 'translateY(102%)'
      w.style.opacity = 0
    })
    const tl = createTimeline({ defaults: { ease: 'outCubic' } })
    ctx.anims.push(tl)
    tl.add(ground, { strokeDashoffset: [ground._len, 0], duration: 950, ease: 'inOutQuad' }, 0)
    tl.add(words, { translateY: ['102%', '0%'], opacity: [0, 1], duration: 820, delay: stagger(130), ease: 'out(3)' }, 200)
    tl.then(() => {
      if (!ctx.dead) {
        startGrowth(ctx, run, later)
        startPulses(ctx, run, later)
      }
    })
  }

  return () => {
    ctx.dead = true
    ctx.timers.forEach(clearTimeout)
    ctx.anims.forEach((a) => {
      if (a && typeof a.pause === 'function') a.pause()
    })
  }
}

function buildForest(ctx, g, { W, trees, fs }) {
  g.innerHTML = ''
  const groundY = 430

  const ground = svgEl('path')
  ground.setAttribute('d', `M40,${groundY} L${W - 40},${groundY}`)
  ground.setAttribute('fill', 'none')
  ground.setAttribute('stroke', '#EDE8D8')
  ground.setAttribute('stroke-width', '2')
  ground.setAttribute('stroke-linecap', 'round')
  ground.setAttribute('opacity', '0.5')
  g.appendChild(ground)
  {
    const L = ground.getTotalLength()
    ground.style.strokeDasharray = L
    ground.style.strokeDashoffset = L
    ground._len = L
  }

  const mainLbl = svgEl('text')
  mainLbl.setAttribute('x', '40')
  mainLbl.setAttribute('y', groundY - 9)
  mainLbl.setAttribute('fill', 'rgba(237,232,216,0.6)')
  mainLbl.setAttribute('font-size', (13.5 * fs).toFixed(1))
  mainLbl.setAttribute('letter-spacing', '0.04em')
  mainLbl.textContent = 'main'
  g.appendChild(mainLbl)

  const spineLayer = svgEl('g')
  spineLayer.setAttribute('aria-hidden', 'true')
  const pulseLayer = svgEl('g')
  pulseLayer.setAttribute('aria-hidden', 'true')

  const col = (cfg) => COL[cfg.status || 'progress']
  const glow = (cfg, a) => GLOW[cfg.status || 'progress'] + a + ')'

  const mkSeg = (d, cfg, order) => {
    const p = svgEl('path')
    const w = Math.max(0.8, (1.1 + cfg.layer * 1.7) * (1 - order * 0.13))
    p.setAttribute('d', d)
    p.setAttribute('fill', 'none')
    p.setAttribute('stroke', col(cfg))
    p.setAttribute('stroke-width', w.toFixed(2))
    p.setAttribute('stroke-linecap', 'round')
    // dimmer for far/small trees so they recede into the distance
    p.setAttribute('opacity', (0.1 + cfg.layer * 0.74).toFixed(2))
    return p
  }
  // every node is a commit: junctions small, tips a touch larger
  const mkNode = (x, y, cfg, terminal) => {
    const c = svgEl('circle')
    const r = terminal ? 2.6 + cfg.layer * 2.0 : 1.5 + cfg.layer * 1.1
    c.setAttribute('cx', x.toFixed(1))
    c.setAttribute('cy', y.toFixed(1))
    c.setAttribute('r', r.toFixed(1))
    c.setAttribute('fill', col(cfg))
    c.setAttribute('opacity', '0')
    c.dataset.baseOpacity = (terminal ? 0.4 + cfg.layer * 0.55 : 0.22 + cfg.layer * 0.42).toFixed(2)
    c.style.transformBox = 'fill-box'
    c.style.transformOrigin = 'center'
    c.style.transform = 'scale(0)'
    if (terminal && cfg.layer > 0.7) c.style.filter = `drop-shadow(0 0 5px ${glow(cfg, 0.35)})`
    return c
  }

  trees.forEach((cfg) => {
    const treeG = svgEl('g')
    if (cfg.tag) treeG.setAttribute('data-tree', cfg.tag)
    const x0 = 40 + cfg.xf * (W - 80)
    const lean = Math.random() < 0.5 ? -1 : 1 // trunk leans one way, then curves

    const build = (px, py, ang, len, depth, order, chainD, parent) => {
      const x1 = px + Math.sin(ang) * len
      const y1 = py - Math.cos(ang) * len
      const dx = x1 - px
      const dy = y1 - py
      const pl = Math.hypot(dx, dy) || 1
      const nx = -dy / pl
      const ny = dx / pl
      // no straight trunks — order 0 gets a firm, consistent bend
      const curve = order === 0 ? lean * len * (0.2 + Math.random() * 0.12) : (Math.random() * 2 - 1) * len * 0.16
      const cxp = (px + x1) / 2 + nx * curve
      const cyp = (py + y1) / 2 + ny * curve
      const d = `M${px.toFixed(1)},${py.toFixed(1)} Q${cxp.toFixed(1)},${cyp.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
      const terminal = depth <= 1
      const path = mkSeg(d, cfg, order)
      treeG.appendChild(path)
      const L = path.getTotalLength()
      path.style.strokeDasharray = L
      path.style.strokeDashoffset = L
      const node = mkNode(x1, y1, cfg, terminal)
      treeG.appendChild(node)
      ctx.nodes.push(node)
      const chain = chainD + ` Q${cxp.toFixed(1)},${cyp.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
      const obj = { pathEl: path, node, len: L, order, terminal, children: [], cfg }
      ctx.segs.push(obj)
      if (order === 0) ctx.roots.push(obj)
      if (parent) parent.children.push(obj)

      if (terminal) {
        const sp = svgEl('path')
        sp.setAttribute('d', chain)
        sp.setAttribute('fill', 'none')
        sp.setAttribute('stroke', 'none')
        spineLayer.appendChild(sp)
        obj.spine = { path: sp, len: sp.getTotalLength(), node, status: cfg.status || 'progress', layer: cfg.layer }
      } else {
        const spread = 0.34 + Math.random() * 0.2
        const ratio = 0.7 + Math.random() * 0.08
        build(x1, y1, ang - spread + (Math.random() * 2 - 1) * 0.06, len * ratio, depth - 1, order + 1, chain, obj)
        build(x1, y1, ang + spread + (Math.random() * 2 - 1) * 0.06, len * ratio, depth - 1, order + 1, chain, obj)
      }
      return obj
    }

    const rootObj = build(x0, groundY, (Math.random() * 2 - 1) * 0.05, cfg.h * 0.46, cfg.depth, 0, `M${x0.toFixed(1)},${groundY}`, null)

    // worktree name as a plate set into the trunk, with a clear status pill above it
    if (cfg.label) {
      const c = col(cfg)
      const pg = svgEl('g')
      pg.style.opacity = '0'
      const py = groundY - 52 * fs
      const labelFs = 11.5 * fs
      const tw = (cfg.label.length * 6.7 + 18) * fs
      const h = 20 * fs
      const rect = svgEl('rect')
      rect.setAttribute('x', (x0 - tw / 2).toFixed(1))
      rect.setAttribute('y', (py - h / 2).toFixed(1))
      rect.setAttribute('width', tw.toFixed(1))
      rect.setAttribute('height', h)
      rect.setAttribute('rx', '4')
      rect.setAttribute('fill', '#0D1512')
      rect.setAttribute('stroke', c)
      rect.setAttribute('stroke-opacity', '0.5')
      rect.setAttribute('stroke-width', '1')
      const t = svgEl('text')
      t.setAttribute('x', x0.toFixed(1))
      t.setAttribute('y', (py + 4 * fs).toFixed(1))
      t.setAttribute('text-anchor', 'middle')
      t.setAttribute('font-size', labelFs.toFixed(1))
      t.setAttribute('fill', '#EDE8D8')
      t.setAttribute('letter-spacing', '0.02em')
      t.textContent = cfg.label
      pg.appendChild(rect)
      pg.appendChild(t)

      const st = cfg.status && cfg.status !== 'progress' ? cfg.status : null
      if (st) {
        const sy = py - 25 * fs
        const sh = 17 * fs
        const sw = (st.length * 6.4 + 16) * fs
        const sr = svgEl('rect')
        sr.setAttribute('x', (x0 - sw / 2).toFixed(1))
        sr.setAttribute('y', (sy - sh / 2).toFixed(1))
        sr.setAttribute('width', sw.toFixed(1))
        sr.setAttribute('height', sh)
        sr.setAttribute('rx', (8.5 * fs).toFixed(1))
        sr.setAttribute('fill', '#0D1512')
        sr.setAttribute('stroke', c)
        sr.setAttribute('stroke-opacity', '0.75')
        sr.setAttribute('stroke-width', '1')
        const stt = svgEl('text')
        stt.setAttribute('x', x0.toFixed(1))
        stt.setAttribute('y', (sy + 3.5 * fs).toFixed(1))
        stt.setAttribute('text-anchor', 'middle')
        stt.setAttribute('font-size', (10 * fs).toFixed(1))
        stt.setAttribute('fill', c)
        stt.setAttribute('letter-spacing', '0.06em')
        stt.textContent = st
        pg.appendChild(sr)
        pg.appendChild(stt)
      }
      treeG.appendChild(pg)
      rootObj.pill = pg
    }
    g.appendChild(treeG)
  })

  g.appendChild(spineLayer)
  g.appendChild(pulseLayer)

  ctx.pills = ctx.segs.filter((s) => s.pill).map((s) => s.pill)
  ctx.ground = ground
  ctx.pulseLayer = pulseLayer
}

// faint vines drooping from the top, gently swaying
function buildVines(ctx, root, run) {
  const g = root.querySelector('[data-vines-g]')
  if (!g) return
  g.innerHTML = ''
  const cols = ['rgba(163,197,133,', 'rgba(163,197,133,', 'rgba(127,166,201,']
  const vines = []
  const n = 8
  for (let i = 0; i < n; i++) {
    const x = 30 + (i / (n - 1)) * 1140 + R(-42, 42)
    const len = R(120, 250)
    const x2 = x + R(-70, 70)
    const c1x = x + R(-24, 24)
    const c1y = len * 0.42
    const c2x = x2 + R(-34, 34)
    const c2y = len * 0.78
    const base = cols[Math.floor(Math.random() * cols.length)]
    const vg = svgEl('g')
    vg.style.transformBox = 'view-box'
    vg.style.transformOrigin = `${x.toFixed(1)}px 0px`
    const p = svgEl('path')
    p.setAttribute('d', `M${x.toFixed(1)},-6 C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2.toFixed(1)},${len.toFixed(1)}`)
    p.setAttribute('fill', 'none')
    p.setAttribute('stroke', base + '0.09)')
    p.setAttribute('stroke-width', R(1, 1.7).toFixed(2))
    p.setAttribute('stroke-linecap', 'round')
    vg.appendChild(p)
    const L = p.getTotalLength()
    const leaves = 2 + Math.floor(Math.random() * 3)
    for (let k = 1; k <= leaves; k++) {
      const pt = p.getPointAtLength(L * (0.4 + (0.58 * k) / leaves))
      const c = svgEl('circle')
      c.setAttribute('cx', pt.x.toFixed(1))
      c.setAttribute('cy', pt.y.toFixed(1))
      c.setAttribute('r', R(1.4, 2.4).toFixed(1))
      c.setAttribute('fill', base + '0.11)')
      vg.appendChild(c)
    }
    g.appendChild(vg)
    vines.push({ vg, amp: R(0.8, 1.8), dur: R(6200, 9600) })
  }

  // hanging garlands: both ends anchored off-screen above the top edge,
  // sagging into a small crescent — short and sparse
  const SPANS = [
    [70, 290],
    [540, 730],
    [990, 1200],
  ]
  SPANS.forEach(([a, b]) => {
    const x1 = a + R(-25, 25)
    const x2 = b + R(-25, 25)
    const sag = R(50, 90)
    const base = cols[Math.floor(Math.random() * cols.length)]
    const vg = svgEl('g')
    const midX = (x1 + x2) / 2
    vg.style.transformBox = 'view-box'
    vg.style.transformOrigin = `${midX.toFixed(1)}px 0px`
    const p = svgEl('path')
    p.setAttribute(
      'd',
      `M${x1.toFixed(1)},-12 C${(x1 + (x2 - x1) * 0.22).toFixed(1)},${(sag * 0.9).toFixed(1)} ${(x1 + (x2 - x1) * 0.78).toFixed(1)},${(sag * 0.9).toFixed(1)} ${x2.toFixed(1)},-12`
    )
    p.setAttribute('fill', 'none')
    p.setAttribute('stroke', base + '0.10)')
    p.setAttribute('stroke-width', R(1.1, 1.8).toFixed(2))
    p.setAttribute('stroke-linecap', 'round')
    vg.appendChild(p)
    const L = p.getTotalLength()
    const leaves = 2 + Math.floor(Math.random() * 2)
    for (let k = 1; k <= leaves; k++) {
      const pt = p.getPointAtLength(L * (0.18 + (0.64 * k) / leaves))
      const c = svgEl('circle')
      c.setAttribute('cx', pt.x.toFixed(1))
      c.setAttribute('cy', pt.y.toFixed(1))
      c.setAttribute('r', R(1.5, 2.6).toFixed(1))
      c.setAttribute('fill', base + '0.12)')
      vg.appendChild(c)
    }
    g.appendChild(vg)
    vines.push({ vg, amp: R(0.35, 0.8), dur: R(7500, 11500) })
  })

  if (ctx.reduced || ctx.dead) return
  vines.forEach((v) => run(v.vg, { rotate: [-v.amp, v.amp], duration: v.dur, loop: true, alternate: true, ease: 'inOutSine' }))
}

// gradual growth: branches sprout at random intervals, each landing a commit node
function startGrowth(ctx, run, later) {
  if (ctx.reduced || ctx.dead) return
  const frontier = ctx.roots.slice()

  const reveal = (seg) => {
    const dur = 360 + seg.order * 60 + Math.random() * 160
    run(seg.pathEl, { strokeDashoffset: [seg.len, 0], duration: dur, ease: 'outQuad' })
    if (seg.pill) run(seg.pill, { opacity: [0, 1], duration: 700, delay: 260, ease: 'outCubic' })
    later(() => {
      if (ctx.dead) return
      // a commit lands
      run(seg.node, { scale: [0, 1.35, 1], opacity: [0, +seg.node.dataset.baseOpacity], duration: 520, ease: 'outBack(3)' })
      if (seg.terminal && seg.spine) ctx.liveSpines.push(seg.spine)
    }, dur * 0.5)
    seg.children.forEach((c) => frontier.push(c))
  }

  // prefer lower-order (trunks first), then let the canopy fill in
  const pick = () => {
    let bi = Math.floor(Math.random() * frontier.length)
    let best = frontier[bi]
    for (let k = 0; k < 2; k++) {
      const j = Math.floor(Math.random() * frontier.length)
      if (frontier[j].order < best.order) {
        best = frontier[j]
        bi = j
      }
    }
    frontier.splice(bi, 1)
    return best
  }

  const tick = () => {
    if (ctx.dead || !frontier.length) return
    reveal(pick())
    if (frontier.length > 16 && Math.random() < 0.45) reveal(pick())
    later(tick, 150 + Math.random() * 340)
  }
  tick()
}

// ongoing life: commits travel up finished branches; blocked tasks stall
function startPulses(ctx, run, later) {
  if (ctx.reduced || ctx.dead) return

  const spawn = () => {
    if (ctx.dead) return
    const live = ctx.liveSpines
    if (live.length && ctx.active < 3) {
      let s = live[Math.floor(Math.random() * live.length)]
      // favour near trees, and mostly the in-progress ones (merged work is done)
      if (Math.random() > s.layer) s = live[Math.floor(Math.random() * live.length)]
      if (s.status !== 'progress' && Math.random() < 0.55) s = live[Math.floor(Math.random() * live.length)]
      const blocked = s.status === 'blocked' && Math.random() < 0.55
      const DOT = { progress: '#D6F0B4', merged: '#B7D4EE', blocked: '#E7B678' }
      const DGLOW = { progress: 'rgba(163,197,133,0.95)', merged: 'rgba(127,166,201,0.9)', blocked: 'rgba(217,160,91,0.9)' }
      const dot = svgEl('circle')
      dot.setAttribute('r', '3.4')
      dot.setAttribute('fill', DOT[s.status] || DOT.progress)
      dot.setAttribute('opacity', '0')
      dot.style.filter = `drop-shadow(0 0 7px ${DGLOW[s.status] || DGLOW.progress})`
      ctx.pulseLayer.appendChild(dot)
      ctx.active++
      const p0 = s.path.getPointAtLength(0)
      dot.setAttribute('cx', p0.x)
      dot.setAttribute('cy', p0.y)
      const end = blocked ? R(0.45, 0.62) : 1
      const prog = { t: 0 }
      run(dot, { opacity: [0, 1], duration: 220, ease: 'outQuad' })
      run(prog, {
        t: [0, end],
        duration: R(1500, 2300) * (blocked ? 0.8 : 1),
        ease: blocked ? 'outCubic' : 'inOutSine',
        onUpdate: () => {
          const pt = s.path.getPointAtLength(s.len * prog.t)
          dot.setAttribute('cx', pt.x)
          dot.setAttribute('cy', pt.y)
        },
        onComplete: () => {
          if (!blocked && s.node) {
            const base = +s.node.dataset.baseOpacity
            run(s.node, { scale: [1, 1.9, 1], duration: 620, ease: 'outElastic(1,0.6)' })
            run(s.node, { opacity: [base, 1, base], duration: 620, ease: 'inOutSine' })
          }
          run(dot, {
            opacity: [1, 0],
            duration: blocked ? 460 : 300,
            ease: 'inQuad',
            onComplete: () => {
              dot.remove()
              ctx.active--
            },
          })
        },
      })
    }
    if (!ctx.dead) later(spawn, R(900, 1900))
  }
  later(spawn, 3200)
}
