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

/* ---------- 2. manifesto ---------- */
const MANIFESTO = 'Grip is a conversation. On ice it becomes a whisper — and we teach you to listen. Every corner is choreographed, every slide is earned, every evening ends by the fire.'
function Word({ w, range, p }: { w: string; range: [number, number]; p: MotionValue<number> }) {
  const o = useTransform(p, range, [0.12, 1])
  return <motion.span style={{ opacity: o }}>{w} </motion.span>
}
function Manifesto() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.6'] })
  const words = MANIFESTO.split(' ')
  return (
    <section ref={ref} className="manifesto section">
      <div className="wrap">
        <p className="label">01 — Manifesto</p>
        <h2 className="manifesto-text">
          {words.map((w, i) => <Word key={i} w={w} p={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />)}
        </h2>
        <div className="stats">
          {[['−18°', 'Average circuit temperature'], ['1:2', 'Instructor to guest ratio'], ['14 km', 'Of private groomed ice'], ['6', 'Guests per expedition']].map(([n, l], i) => (
            <Reveal key={l} delay={i * 0.1} className="stat"><span className="stat-n">{n}</span><span className="stat-l">{l}</span></Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- 3. experiences ---------- */
const EXPERIENCES = [
  { id: 'circuit', n: '01', title: 'Ice Circuit Day', tag: 'One day · From €4,900', img: 'drift' as MediaKey,
    copy: 'A full day on our private frozen circuit. Progress from car-control fundamentals to linking long, committed slides through the signature hairpin complex.',
    points: ['Private 3.2 km ice circuit', 'Two instructor sessions + telemetry review', 'Studded performance tyres', 'Lakeside lunch & sauna'] },
  { id: 'drift', n: '02', title: 'Private Drift Coaching', tag: 'Two days · From €11,500', img: 'spray' as MediaKey,
    copy: 'One guest, one coach, one machine. A bespoke programme built around your driving style, with in-car video and a personal progression plan.',
    points: ['1:1 coaching with former racing drivers', 'In-car multi-angle footage', 'Choice of rear-drive machines', 'Chalet suite with private chef'] },
  { id: 'tour', n: '03', title: 'Alpine Grand Tour', tag: 'Five days · From €26,000', img: 'valley' as MediaKey,
    copy: 'A traversal of high passes and frozen valleys, punctuated by closed-road stages and nights in exceptional mountain hotels.',
    points: ['Four closed-road special stages', 'Helicopter transfer to the summit lodge', 'Support crew & recovery vehicle', 'Michelin-calibre dining each evening'] },
]
function Experiences() {
  const [active, setActive] = useState(0)
  const e = EXPERIENCES[active]
  return (
    <section id="experiences" className="section experiences">
      <div className="wrap">
        <Reveal><p className="label">02 — Experiences</p><h2 className="h2">Three ways<br />to find the edge.</h2></Reveal>
        <div className="exp-grid">
          <div className="exp-list" role="tablist">
            {EXPERIENCES.map((x, i) => (
              <button key={x.id} role="tab" aria-selected={i === active} className={`exp-card ${i === active ? 'on' : ''}`} onClick={() => setActive(i)} onMouseEnter={() => setActive(i)}>
                <span className="exp-n">{x.n}</span>
                <span className="exp-t">{x.title}</span>
                <span className="exp-tag">{x.tag}</span>
                {i === active && <motion.span layoutId="exp-bar" className="exp-bar" />}
              </button>
            ))}
          </div>
          <div className="exp-panel">
            <AnimatePresence mode="wait">
              <motion.div key={e.id} className="exp-detail" initial={{ opacity: 0, y: 30, clipPath: 'inset(8% 0 8% 0)' }} animate={{ opacity: 1, y: 0, clipPath: 'inset(0% 0 0% 0)' }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                <div className="exp-img"><MotionMImg k={e.img} initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} /></div>
                <div className="exp-body">
                  <h3>{e.title}</h3>
                  <p>{e.copy}</p>
                  <ul>{e.points.map((pt, j) => <motion.li key={pt} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + j * 0.08 }}>{pt}</motion.li>)}</ul>
                  <Magnetic href="#enquire" className="btn-gold">Reserve this experience</Magnetic>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 4. features ---------- */
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
  const y = useTransform(sp, [0, 1], [80, -80])
  return (
    <section id="craft" ref={ref} className="section features">
      <div className="crystal"><Suspense fallback={null}><CrystalScene progress={sp} /></Suspense></div>
      <div className="wrap feat-wrap">
        <motion.div style={{ y }} className="feat-head">
          <p className="label">03 — The Craft</p>
          <h2 className="h2">Every detail,<br /><em>tempered</em> in cold.</h2>
          <p className="muted">Four disciplines, obsessively refined, so the only thing you think about is the next apex.</p>
        </motion.div>
        <div className="feat-list">
          {FEATURES.map((f, i) => (
            <Reveal key={f.k} delay={i * 0.08} className="feat">
              <span className="feat-k">0{i + 1} / {f.k}</span>
              <h3>{f.t}</h3><p>{f.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- 5. gallery + testimonials ---------- */
const GALLERY = [
  { src: 'sunrise' as MediaKey, c: 'wide', cap: 'First light, valley descent' },
  { src: 'wheel' as MediaKey, c: 'tall', cap: 'Studs, spray, commitment' },
  { src: 'road' as MediaKey, c: '', cap: 'The descent' },
  { src: 'drift' as MediaKey, c: '', cap: 'Hairpin, held sideways' },
  { src: 'spray' as MediaKey, c: 'tall', cap: 'Rooster tail' },
  { src: 'valley' as MediaKey, c: 'wide', cap: 'Valley stage' },
]
function GalleryItem({ g, i }: { g: typeof GALLERY[0]; i: number }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  return (
    <motion.figure ref={ref} className={`g-item ${g.c}`} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-5%' }} transition={{ duration: 1, delay: (i % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}>
      <MotionMImg k={g.src} alt={g.cap} style={{ y }} />
      <figcaption>{g.cap}</figcaption>
    </motion.figure>
  )
}
/* PLACEHOLDER testimonials — fictional names and quotes, replace with real client feedback. */
const TESTIMONIALS = [
  { q: 'I have driven on many circuits. Nothing prepared me for the silence of a perfect slide at sunrise.', a: 'Placeholder Guest — Zürich' },
  { q: 'The coaching was surgical, the chalet was absurd in the best way. We have already booked next season.', a: 'Placeholder Guest — London' },
  { q: 'Five days that recalibrated how I think about grip — and about hospitality.', a: 'Placeholder Guest — Dubai' },
]
function Gallery() {
  const [t, setT] = useState(0)
  useEffect(() => { const id = setInterval(() => setT(v => (v + 1) % TESTIMONIALS.length), 6000); return () => clearInterval(id) }, [])
  return (
    <section id="gallery" className="section gallery">
      <div className="wrap">
        <Reveal><p className="label">04 — Gallery</p><h2 className="h2">Notes from<br />the frozen line.</h2></Reveal>
        <div className="g-grid">{GALLERY.map((g, i) => <GalleryItem key={g.cap} g={g} i={i} />)}</div>
        <div className="testi">
          <span className="testi-mark">“</span>
          <AnimatePresence mode="wait">
            <motion.blockquote key={t} initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }} transition={{ duration: 0.8 }}>
              <p>{TESTIMONIALS[t].q}</p><cite>{TESTIMONIALS[t].a}</cite>
            </motion.blockquote>
          </AnimatePresence>
          <div className="dots">{TESTIMONIALS.map((_, i) => <button key={i} aria-label={`Testimonial ${i + 1}`} className={i === t ? 'on' : ''} onClick={() => setT(i)} />)}</div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 6. enquiry ---------- */
function Enquire() {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const submit = (e: FormEvent) => { e.preventDefault(); setBusy(true); setTimeout(() => { setBusy(false); setSent(true) }, 900) } // front-end only, no backend
  return (
    <section id="enquire" className="section enquire">
      <div className="enq-bg"><MImg k="road" /></div>
      <div className="wrap enq-wrap">
        <Reveal className="enq-head">
          <p className="label">05 — Private Enquiry</p>
          <h2 className="h2">Reserve your<br />season.</h2>
          <p className="muted">Places are limited to six guests per expedition. Our concierge replies within one business day.</p>
        </Reveal>
        <Reveal delay={0.15} className="enq-card">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="ok" className="enq-ok" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                <motion.svg viewBox="0 0 52 52" width="64" height="64"><motion.circle cx="26" cy="26" r="24" fill="none" stroke="#e9c88a" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} /><motion.path d="M15 27l7 7 15-16" fill="none" stroke="#e9c88a" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 0.5 }} /></motion.svg>
                <h3>Enquiry received.</h3><p>Thank you — a member of our concierge team will be in touch shortly. (Demo only: nothing was sent.)</p>
                <button className="link" onClick={() => setSent(false)}>Send another enquiry</button>
              </motion.div>
            ) : (
              <motion.form key="f" onSubmit={submit} exit={{ opacity: 0, y: -10 }}>
                <div className="row"><label>Full name<input required name="name" autoComplete="name" /></label><label>Email<input required type="email" name="email" autoComplete="email" /></label></div>
                <div className="row">
                  <label>Experience<select name="exp" defaultValue="Ice Circuit Day">{EXPERIENCES.map(x => <option key={x.id}>{x.title}</option>)}</select></label>
                  <label>Preferred month<select name="month" defaultValue="January">{['December', 'January', 'February', 'March'].map(m => <option key={m}>{m}</option>)}</select></label>
                </div>
                <div className="row"><label>Guests<input type="number" min={1} max={6} defaultValue={2} name="guests" /></label><label>Driving experience<select name="level" defaultValue="Some track days"><option>New to performance driving</option><option>Some track days</option><option>Experienced / licensed racer</option></select></label></div>
                <label>Anything we should know?<textarea rows={3} name="notes" /></label>
                <Magnetic type="submit" className="btn-gold wide">{busy ? 'Sending…' : 'Send enquiry'}</Magnetic>
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
        <div className="foot-big">APEX<br />ALPINE</div>
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
        <div className="foot-bottom">
          <span>© 2026 APEX ALPINE — concept site. All copy is placeholder.</span>
          <span>Independent concept · no affiliation with any vehicle or tyre manufacturer.</span>
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
          <Manifesto /><Experiences /><Features /><Gallery /><Enquire />
        </div>
      </main>
      <Footer />
      <div className="grain" aria-hidden /><div className="vignette" aria-hidden />
    </>
  )
}
