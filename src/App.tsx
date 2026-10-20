import { useEffect, useRef, useState, lazy, Suspense, type ReactNode, type FormEvent } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, useReducedMotion, type MotionValue } from 'framer-motion'
import Lenis from 'lenis'
import { useMedia, mediaMode, type MediaKey } from './media'

const SnowOverlay = lazy(() => import('./Scene').then(m => ({ default: m.SnowOverlay })))
const CrystalScene = lazy(() => import('./Scene').then(m => ({ default: m.CrystalScene })))

/* ---------- utilities ---------- */
function useLenis(disabled: boolean) {
  useEffect(() => {
    if (disabled) return
    const lenis = new Lenis({ duration: 1.25, smoothWheel: true })
    let id = 0
    const raf = (t: number) => { lenis.raf(t); id = requestAnimationFrame(raf) }
    id = requestAnimationFrame(raf)
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!a) return
      const el = document.querySelector(a.getAttribute('href')!)
      if (el) { e.preventDefault(); lenis.scrollTo(el as HTMLElement, { offset: -10 }) }
    }
    document.addEventListener('click', onClick)
    return () => { cancelAnimationFrame(id); lenis.destroy(); document.removeEventListener('click', onClick) }
  }, [disabled])
}

function Magnetic({ children, className = '', href, onClick, type }: { children: ReactNode; className?: string; href?: string; onClick?: () => void; type?: 'submit' | 'button' }) {
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 16 }), sy = useSpring(y, { stiffness: 220, damping: 16 })
  const move = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left - r.width / 2) * 0.35); y.set((e.clientY - r.top - r.height / 2) * 0.35)
  }
  const leave = () => { x.set(0); y.set(0) }
  const inner = <motion.span style={{ x: sx, y: sy }} className="mag-inner">{children}</motion.span>
  return href
    ? <motion.a href={href} className={`mag ${className}`} onMouseMove={move} onMouseLeave={leave} style={{ x: sx, y: sy }}>{inner}</motion.a>
    : <motion.button type={type ?? 'button'} onClick={onClick} className={`mag ${className}`} onMouseMove={move} onMouseLeave={leave} style={{ x: sx, y: sy }}>{inner}</motion.button>
}

const Reveal = ({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10% 0px' }} transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}>{children}</motion.div>
)

function Letters({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span className="letters" aria-label={text}>
      {text.split('').map((c, i) => (
        <motion.span key={i} aria-hidden initial={{ y: '110%', opacity: 0 }} animate={{ y: '0%', opacity: 1 }} transition={{ delay: delay + i * 0.035, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>{c === ' ' ? '\u00a0' : c}</motion.span>
      ))}
    </span>
  )
}

function MImg({ k, alt = '' }: { k: MediaKey; alt?: string }) { const u = useMedia(k); return u ? <img src={u} alt={alt} loading="lazy" /> : null }
function MotionMImg({ k, alt = '', ...rest }: { k: MediaKey; alt?: string } & React.ComponentProps<typeof motion.img>) {
  const u = useMedia(k); return u ? <motion.img src={u} alt={alt} loading="lazy" {...rest} /> : null
}

/* ---------- nav & chrome ---------- */
function Nav() {
  const { scrollY } = useScroll()
  const [solid, setSolid] = useState(false)
  useEffect(() => scrollY.on('change', v => setSolid(v > 80)), [scrollY])
  return (
    <header className={`nav ${solid ? 'solid' : ''}`}>
      <a href="#top" className="brand"><span className="brand-mark">◆</span> APEX ALPINE</a>
      <nav className="nav-links">
        <a href="#experiences">Experiences</a><a href="#craft">Craft</a><a href="#gallery">Gallery</a><a href="#enquire">Enquire</a>
      </nav>
      <Magnetic href="#enquire" className="btn-ghost small">Reserve</Magnetic>
    </header>
  )
}

function Progress() {
  const { scrollYProgress } = useScroll()
  const s = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  return <motion.div className="progress" style={{ scaleX: s }} />
}

/* ---------- 1. hero ---------- */
function Hero({ reduced }: { reduced: boolean }) {
  const poster = useMedia('poster'), webm = useMedia(mediaMode === 'b64' ? 'poster' : 'webm'), mp4 = useMedia(reduced ? 'poster' : 'mp4')
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 24 })
  const scale = useTransform(p, [0, 1], [1, 1.18])
  const blur = useTransform(p, [0, 0.6, 1], ['blur(0px)', 'blur(4px)', 'blur(10px)'])
  const dark = useTransform(p, [0, 1], [0, 0.85])
  const textY = useTransform(p, [0, 1], ['0%', '-40%'])
  const textO = useTransform(p, [0, 0.55], [1, 0])
  return (
    <section id="top" ref={ref} className="hero">
      <div className="hero-sticky">
        <motion.div className="hero-media" style={{ scale, filter: blur }}>
          {poster && <img src={poster} alt="A white race car on a frozen alpine road at sunrise" />}
          {!reduced && mediaMode === 'binary' && <video autoPlay muted loop playsInline preload="auto" poster={poster} aria-hidden>
            <source src={webm} type="video/webm" />
            <source src={mp4} type="video/mp4" />
          </video>}
          {!reduced && mediaMode === 'b64' && mp4 && <video src={mp4} autoPlay muted loop playsInline preload="auto" poster={poster} aria-hidden />}
        </motion.div>
        <div className="hero-grad" />
        <motion.div className="hero-dark" style={{ opacity: dark }} />
        {!reduced && <div className="hero-snow"><Suspense fallback={null}><SnowOverlay /></Suspense></div>}
        <motion.div className="hero-copy" style={{ y: textY, opacity: textO }}>
          <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 1.2 }}>Winter Performance Driving · Est. 2026</motion.p>
          <h1><Letters text="Master" delay={0.35} /><br /><Letters text="the ice." delay={0.6} /></h1>
          <motion.p className="hero-sub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 1 }}>
            Private frozen circuits, drift coaching and alpine grand tours — curated for drivers who want to feel every degree of grip.
          </motion.p>
          <motion.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.55, duration: 1 }}>
            <Magnetic href="#experiences" className="btn-gold">Explore experiences</Magnetic>
            <Magnetic href="#enquire" className="btn-ghost">Private enquiry</Magnetic>
          </motion.div>
        </motion.div>
        <motion.div className="hero-meta" style={{ opacity: textO }}>
          <span>46°N · 2,100 m</span><span>Season Dec — Mar</span>
        </motion.div>
        <motion.div className="scroll-cue" style={{ opacity: textO }}><span />Scroll</motion.div>
      </div>
    </section>
  )
}

/* =====================================================================
   BELOW THE HERO — premium editorial redesign
   ===================================================================== */
const EASE = [0.16, 1, 0.3, 1] as const

function useIsDesktop() {
  const q = '(min-width: 901px)'
  const [d, setD] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => { const m = window.matchMedia(q); const f = () => setD(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f) }, [])
  return d
}

/** Image that reveals with a clip-path wipe and inner parallax. */
function MaskImg({ k, alt = '', className = '', from = 'inset(100% 0 0 0)', parallax = 10, delay = 0 }: { k: MediaKey; alt?: string; className?: string; from?: string; parallax?: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [`-${parallax}%`, `${parallax}%`])
  return (
    <motion.div ref={ref} className={`mask ${className}`} initial={{ clipPath: from }} whileInView={{ clipPath: 'inset(0% 0 0% 0)' }} viewport={{ once: true, margin: '-8% 0px' }} transition={{ duration: 1.5, delay, ease: EASE }}>
      <MotionMImg k={k} alt={alt} style={{ y, scale: 1 + parallax / 50 }} />
    </motion.div>
  )
}

function Rule({ n, label }: { n: string; label: string }) {
  return (
    <div className="rule">
      <span className="rule-n">{n}</span>
      <motion.span className="rule-line" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: EASE }} />
      <span className="rule-l">{label}</span>
    </div>
  )
}

/* ---------- 2. manifesto ---------- */
const MANIFESTO = 'Grip is a conversation. On ice it becomes a whisper — and we teach you to listen. Every corner is choreographed, every slide is earned, every evening ends by the fire.'
const SERIF_WORDS = new Set(['whisper', 'listen.', 'earned,', 'fire.'])
function Word({ w, range, p }: { w: string; range: [number, number]; p: MotionValue<number> }) {
  const o = useTransform(p, range, [0.1, 1])
  return <motion.span style={{ opacity: o }} className={SERIF_WORDS.has(w.replace('—', '')) ? 'serif-i' : ''}>{w} </motion.span>
}
function Counter({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const [v, setV] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect()
      const t0 = performance.now()
      const tick = (t: number) => { const k = Math.min(1, (t - t0) / 1800); setV(Math.round(to * (1 - Math.pow(1 - k, 4)))); if (k < 1) requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    io.observe(el); return () => io.disconnect()
  }, [to])
  return <span ref={ref}>{prefix}{v.toLocaleString('en-US')}{suffix}</span>
}
const STATS = [
  { el: <Counter to={18} prefix="−" suffix="°" />, l: 'Average circuit temperature', r: 'I' },
  { el: <>1<i>:</i>2</>, l: 'Instructor to guest ratio', r: 'II' },
  { el: <Counter to={14} suffix=" km" />, l: 'Of private groomed ice', r: 'III' },
  { el: <Counter to={6} />, l: 'Guests per expedition', r: 'IV' },
]
function Manifesto() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.7'] })
  const words = MANIFESTO.split(' ')
  return (
    <section ref={ref} className="manifesto section">
      <div className="wrap">
        <Rule n="01" label="Manifesto" />
        <div className="man-grid">
          <aside className="man-aside">
            <span className="crest">◆</span>
            <p>An invitation-only<br />winter atelier for<br />the art of driving.</p>
            <span className="coords">46°31′N · 9°52′E</span>
          </aside>
          <h2 className="manifesto-text">
            {words.map((w, i) => <Word key={i} w={w} p={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />)}
          </h2>
        </div>
        <div className="stats">
          {STATS.map((s, i) => (
            <Reveal key={s.l} delay={i * 0.12} className="stat">
              <span className="stat-r">{s.r}</span>
              <span className="stat-n">{s.el}</span>
              <span className="stat-l">{s.l}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- marquee ---------- */
const TICKER = ['Ice Circuit', 'Drift Atelier', 'Alpine Grand Tour', 'Private Coaching', 'Fireside Dining', 'Season MMXXVI']
function Marquee() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  const row = [...TICKER, ...TICKER, ...TICKER]
  return (
    <div ref={ref} className="marquee" aria-hidden>
      <motion.div className="marquee-track" style={{ x }}>
        <div className="marquee-inner">
          {row.map((t, i) => <span key={i} className={i % 2 ? 'serif-i' : ''}>{t}<b>◆</b></span>)}
        </div>
      </motion.div>
    </div>
  )
}

/* ---------- cinematic interstitial ---------- */
function Interstitial() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 22 })
  const clip = useTransform(p, [0.05, 0.45], ['inset(18% 22% 18% 22% round 24px)', 'inset(0% 0% 0% 0% round 0px)'])
  const scale = useTransform(p, [0, 1], [1.25, 1])
  const ty = useTransform(p, [0.2, 0.8], ['30%', '-20%'])
  const to = useTransform(p, [0.25, 0.45, 0.75, 0.9], [0, 1, 1, 0])
  return (
    <section ref={ref} className="inter">
      <div className="inter-sticky">
        <motion.div className="inter-media" style={{ clipPath: clip }}>
          <MotionMImg k="profile" alt="The car in profile on a frozen mountain road" style={{ scale }} />
          <div className="inter-shade" />
        </motion.div>
        <motion.div className="inter-copy" style={{ y: ty, opacity: to }}>
          <p className="label">Interlude</p>
          <p className="inter-q">“The quietest <em>sound</em> in motorsport<br />is a car sliding perfectly on ice.”</p>
          <span className="inter-meta">Frame 02 · Engadin pass · 07:42</span>
        </motion.div>
      </div>
    </section>
  )
}

/* ---------- 3. experiences (sticky horizontal) ---------- */
const EXPERIENCES = [
  { id: 'circuit', n: '01', title: 'Ice Circuit Day', dur: 'One day', price: '€4,900', img: 'drift' as MediaKey,
    copy: 'A full day on our private frozen circuit. Progress from car-control fundamentals to linking long, committed slides through the signature hairpin complex.',
    points: ['Private 3.2 km ice circuit', 'Two instructor sessions + telemetry review', 'Studded performance tyres', 'Lakeside lunch & sauna'] },
  { id: 'drift', n: '02', title: 'Private Drift Coaching', dur: 'Two days', price: '€11,500', img: 'spray' as MediaKey,
    copy: 'One guest, one coach, one machine. A bespoke programme built around your driving style, with in-car video and a personal progression plan.',
    points: ['1:1 coaching with former racing drivers', 'In-car multi-angle footage', 'Choice of rear-drive machines', 'Chalet suite with private chef'] },
  { id: 'tour', n: '03', title: 'Alpine Grand Tour', dur: 'Five days', price: '€26,000', img: 'valley' as MediaKey,
    copy: 'A traversal of high passes and frozen valleys, punctuated by closed-road stages and nights in exceptional mountain hotels.',
    points: ['Four closed-road special stages', 'Helicopter transfer to the summit lodge', 'Support crew & recovery vehicle', 'Michelin-calibre dining each evening'] },
]
function ExpCard({ e }: { e: typeof EXPERIENCES[0] }) {
  return (
    <article className="xcard">
      <div className="xcard-img">
        <MImg k={e.img} alt={e.title} />
        <span className="xcard-n">{e.n}<small>/03</small></span>
        <div className="xcard-price"><span>From</span><strong>{e.price}</strong><span>{e.dur} · per guest</span></div>
      </div>
      <div className="xcard-body">
        <div className="xcard-top"><span className="xcard-dur">{e.dur}</span><span className="xcard-hair" /></div>
        <h3>{e.title}</h3>
        <p>{e.copy}</p>
        <ul>{e.points.map(pt => <li key={pt}>{pt}</li>)}</ul>
        <a href="#enquire" className="xcard-link"><span>Reserve this experience</span><i>→</i></a>
      </div>
    </article>
  )
}
function Experiences() {
  const desktop = useIsDesktop()
  const ref = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)
  useEffect(() => {
    if (!desktop) return
    const f = () => { if (track.current) setDist(Math.max(0, track.current.scrollWidth - window.innerWidth)) }
    f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f)
  }, [desktop])
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const sp = useSpring(scrollYProgress, { stiffness: 90, damping: 26 })
  const x = useTransform(sp, [0, 1], [0, -dist])
  const bar = useTransform(sp, [0, 1], [0, 1])
  return (
    <section id="experiences" ref={ref} className="experiences" style={desktop ? { height: `calc(100vh + ${dist}px)` } : undefined}>
      <div className={desktop ? 'x-sticky' : 'x-static'}>
        <motion.div ref={track} className="x-track" style={desktop ? { x } : undefined}>
          <div className="x-intro">
            <Rule n="02" label="Experiences" />
            <h2 className="h2">Three ways<br />to find <span className="serif-i">the edge.</span></h2>
            <p className="muted">Each programme is limited to six guests and tailored in advance by our head coach. Prices are per guest, all-inclusive.</p>
            {desktop && <span className="x-hint">Scroll to explore <i>→</i></span>}
          </div>
          {EXPERIENCES.map(e => <ExpCard key={e.id} e={e} />)}
          {desktop && <div className="x-end"><p className="serif-i">Something more<br />bespoke?</p><a href="#enquire" className="xcard-link"><span>Speak to the concierge</span><i>→</i></a></div>}
        </motion.div>
        {desktop && <div className="x-progress"><motion.span style={{ scaleX: bar }} /></div>}
      </div>
    </section>
  )
}

/* ---------- 4. craft / crystal ---------- */
const FEATURES = [
  { k: 'Instructors', t: 'Coached by champions', d: 'Former endurance and rally professionals who have spent decades reading low-grip surfaces.' },
  { k: 'Machines', t: 'A curated winter fleet', d: 'Rear-drive performance cars prepared in-house with studded tyres, roll protection and data logging.' },
  { k: 'Hospitality', t: 'Fireside, not pit-side', d: 'Timber chalets, a private chef, thermal spa and a sommelier who understands a long day on the ice.' },
  { k: 'Safety', t: 'Engineered calm', d: 'Groomed run-off, marshals at every corner, medical team on site and real-time weather intelligence.' },
]
function Features() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const sp = useSpring(scrollYProgress, { stiffness: 60, damping: 20 })
  const y = useTransform(sp, [0, 1], [60, -60])
  return (
    <section id="craft" ref={ref} className="section features">
      <div className="wrap">
        <Rule n="03" label="The Craft" />
        <div className="craft-grid">
          <div className="craft-stage">
            <div className="crystal"><Suspense fallback={null}><CrystalScene progress={sp} /></Suspense></div>
            <div className="craft-ring" />
            <span className="craft-cap">Fig. I — Ice, tempered</span>
          </div>
          <div>
            <motion.div style={{ y }} className="feat-head">
              <h2 className="h2">Every detail,<br /><span className="serif-i gold">tempered</span> in cold.</h2>
              <p className="muted">Four disciplines, obsessively refined, so the only thing you think about is the next apex.</p>
            </motion.div>
            <ol className="feat-list">
              {FEATURES.map((f, i) => (
                <Reveal key={f.k} delay={i * 0.08} className="feat">
                  <span className="feat-n">{['I', 'II', 'III', 'IV'][i]}</span>
                  <div><span className="feat-k">{f.k}</span><h3>{f.t}</h3><p>{f.d}</p></div>
                  <span className="feat-arrow">↗</span>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 5. gallery + cursor index + testimonials ---------- */
const GALLERY = [
  { src: 'sunrise' as MediaKey, c: 'g-a', cap: 'First light, valley descent' },
  { src: 'wheel' as MediaKey, c: 'g-b', cap: 'Studs, spray, commitment' },
  { src: 'road' as MediaKey, c: 'g-c', cap: 'The descent' },
  { src: 'drift' as MediaKey, c: 'g-d', cap: 'Hairpin, held sideways' },
  { src: 'spray' as MediaKey, c: 'g-e', cap: 'Rooster tail' },
  { src: 'valley' as MediaKey, c: 'g-f', cap: 'Valley stage' },
]
const CHAPTERS = [
  { t: 'The Hairpin Complex', s: 'Circuit · 3.2 km', img: 'drift' as MediaKey },
  { t: 'Bernina Ascent', s: 'Grand Tour · Stage II', img: 'pass' as MediaKey },
  { t: 'Frozen Lake Sessions', s: 'Coaching · Dawn', img: 'sunrise' as MediaKey },
  { t: 'Valley Night Run', s: 'Grand Tour · Stage IV', img: 'road' as MediaKey },
]
function ChapterIndex() {
  const [hover, setHover] = useState<number | null>(null)
  const mx = useMotionValue(0), my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 160, damping: 20 }), sy = useSpring(my, { stiffness: 160, damping: 20 })
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: React.MouseEvent) => { const r = ref.current!.getBoundingClientRect(); mx.set(e.clientX - r.left); my.set(e.clientY - r.top) }
  return (
    <div ref={ref} className="chapters" onMouseMove={move} onMouseLeave={() => setHover(null)}>
      {CHAPTERS.map((c, i) => (
        <a key={c.t} href="#experiences" className={`chapter ${hover !== null && hover !== i ? 'dim' : ''}`} onMouseEnter={() => setHover(i)}>
          <span className="chapter-n">0{i + 1}</span>
          <span className="chapter-t">{c.t}</span>
          <span className="chapter-s">{c.s}</span>
          <span className="chapter-a">→</span>
        </a>
      ))}
      <motion.div className="chapter-peek" style={{ x: sx, y: sy }} animate={{ opacity: hover === null ? 0 : 1, scale: hover === null ? 0.85 : 1 }} transition={{ duration: 0.4, ease: EASE }} aria-hidden>
        {CHAPTERS.map((c, i) => <div key={c.t} className={`peek-img ${hover === i ? 'on' : ''}`}><MImg k={c.img} /></div>)}
      </motion.div>
    </div>
  )
}
/* PLACEHOLDER testimonials — fictional names and quotes, replace with real client feedback. */
const TESTIMONIALS = [
  { q: 'I have driven on many circuits. Nothing prepared me for the silence of a perfect slide at sunrise.', a: 'Placeholder Guest', c: 'Zürich' },
  { q: 'The coaching was surgical, the chalet was absurd in the best way. We have already booked next season.', a: 'Placeholder Guest', c: 'London' },
  { q: 'Five days that recalibrated how I think about grip — and about hospitality.', a: 'Placeholder Guest', c: 'Dubai' },
]
function Gallery() {
  const [t, setT] = useState(0)
  useEffect(() => { const id = setInterval(() => setT(v => (v + 1) % TESTIMONIALS.length), 7000); return () => clearInterval(id) }, [t])
  return (
    <section id="gallery" className="section gallery">
      <div className="wrap">
        <Rule n="04" label="Gallery" />
        <div className="g-head">
          <h2 className="h2">Notes from<br /><span className="serif-i">the frozen line.</span></h2>
          <p className="muted">Stills from the 2026 season — captured on the circuit, the passes and the long road home.</p>
        </div>
        <div className="g-grid">
          {GALLERY.map((g, i) => (
            <figure key={g.cap} className={`g-item ${g.c}`}>
              <MaskImg k={g.src} alt={g.cap} delay={(i % 3) * 0.12} from={i % 2 ? 'inset(0 0 100% 0)' : 'inset(100% 0 0 0)'} />
              <figcaption><span>{String(i + 1).padStart(2, '0')}</span>{g.cap}</figcaption>
            </figure>
          ))}
        </div>
        <div className="chap-wrap">
          <p className="label">Chapters of the season</p>
          <ChapterIndex />
        </div>
        <div className="testi">
          <span className="testi-mark">“</span>
          <AnimatePresence mode="wait">
            <motion.blockquote key={t} initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }} transition={{ duration: 0.9, ease: EASE }}>
              <p>{TESTIMONIALS[t].q}</p><cite><b>{TESTIMONIALS[t].a}</b> — {TESTIMONIALS[t].c}</cite>
            </motion.blockquote>
          </AnimatePresence>
          <div className="dots">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} aria-label={`Testimonial ${i + 1}`} className={i === t ? 'on' : ''} onClick={() => setT(i)}>
                <span className="dot-n">0{i + 1}</span><span className="dot-bar">{i === t && <motion.i initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 7, ease: 'linear' }} />}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 6. enquiry ---------- */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="fl">{children}<span>{label}</span></label>
}
function Enquire() {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const submit = (e: FormEvent) => { e.preventDefault(); setBusy(true); setTimeout(() => { setBusy(false); setSent(true) }, 900) } // front-end only, no backend
  return (
    <section id="enquire" className="section enquire">
      <div className="wrap enq-wrap">
        <div className="enq-side">
          <Rule n="05" label="Private Enquiry" />
          <h2 className="h2">Reserve<br />your <span className="serif-i gold">season.</span></h2>
          <p className="muted">Places are limited to six guests per expedition. Our concierge replies within one business day.</p>
          <MaskImg k="pass" className="enq-img" alt="Car climbing an alpine pass" />
          <dl className="enq-facts"><div><dt>Season</dt><dd>December — March</dd></div><div><dt>Response</dt><dd>Within 24 hours</dd></div><div><dt>Guests</dt><dd>Six per expedition</dd></div></dl>
        </div>
        <Reveal delay={0.15} className="enq-card">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="ok" className="enq-ok" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                <motion.svg viewBox="0 0 52 52" width="64" height="64"><motion.circle cx="26" cy="26" r="24" fill="none" stroke="#e9c88a" strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} /><motion.path d="M15 27l7 7 15-16" fill="none" stroke="#e9c88a" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 0.5 }} /></motion.svg>
                <h3>Enquiry received.</h3><p>Thank you — a member of our concierge team will be in touch shortly. (Demo only: nothing was sent.)</p>
                <button className="link" onClick={() => setSent(false)}>Send another enquiry</button>
              </motion.div>
            ) : (
              <motion.form key="f" onSubmit={submit} exit={{ opacity: 0, y: -10 }}>
                <div className="enq-card-head"><span>Concierge request</span><span>Nº 2026 / ◆</span></div>
                <div className="row"><Field label="Full name"><input required name="name" autoComplete="name" placeholder=" " /></Field><Field label="Email"><input required type="email" name="email" autoComplete="email" placeholder=" " /></Field></div>
                <div className="row">
                  <Field label="Experience"><select name="exp" defaultValue="Ice Circuit Day">{EXPERIENCES.map(x => <option key={x.id}>{x.title}</option>)}</select></Field>
                  <Field label="Preferred month"><select name="month" defaultValue="January">{['December', 'January', 'February', 'March'].map(m => <option key={m}>{m}</option>)}</select></Field>
                </div>
                <div className="row"><Field label="Guests"><input type="number" min={1} max={6} defaultValue={2} name="guests" placeholder=" " /></Field><Field label="Driving experience"><select name="level" defaultValue="Some track days"><option>New to performance driving</option><option>Some track days</option><option>Experienced / licensed racer</option></select></Field></div>
                <Field label="Anything we should know?"><textarea rows={3} name="notes" placeholder=" " /></Field>
                <Magnetic type="submit" className="btn-gold wide">{busy ? 'Sending…' : 'Send enquiry'}</Magnetic>
                <p className="enq-fine">Your details are held in confidence and never shared.</p>
              </motion.form>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- 7. footer ---------- */
function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-top">
          <p className="foot-invite">Until the <span className="serif-i gold">first frost.</span></p>
          <a href="#enquire" className="xcard-link"><span>Begin an enquiry</span><i>→</i></a>
        </div>
        <div className="foot-grid">
          <div><p className="label">Contact</p>
            {/* PLACEHOLDER contact details — replace before launch */}
            <a href="mailto:hello@example.com">hello@example.com</a>
            <a href="tel:+41000000000">+41 00 000 00 00</a>
          </div>
          <div><p className="label">Base camp</p><p>{/* PLACEHOLDER address */}Placeholder Lodge<br />Alpine Valley, Switzerland</p></div>
          <div><p className="label">Explore</p><a href="#experiences">Experiences</a><a href="#craft">The Craft</a><a href="#gallery">Gallery</a></div>
          <div><p className="label">Follow</p><a href="#top">Instagram</a><a href="#top">Journal</a></div>
        </div>
        <div className="foot-big" aria-label="Apex Alpine">APEX <span className="serif-i">Alpine</span></div>
        <div className="foot-bottom">
          <span>© 2026 APEX ALPINE — concept site. All copy is placeholder.</span>
          <span className="foot-coord">46°31′N · 9°52′E · 2,100 m</span>
          <span>Independent concept · no affiliation with any vehicle or tyre manufacturer.</span>
          <a href="#top" className="foot-up">Back to top ↑</a>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const reduced = !!useReducedMotion()
  useLenis(reduced)
  return (
    <>
      <Progress /><Nav />
      <main>
        <Hero reduced={reduced} />
        <div className="rise">
          <Manifesto /><Marquee /><Experiences /><Interstitial /><Features /><Gallery /><Enquire />
        </div>
      </main>
      <Footer />
      <div className="grain" aria-hidden /><div className="vignette" aria-hidden />
    </>
  )
}
