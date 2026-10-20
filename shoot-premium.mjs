import { chromium } from 'playwright'
const NEW = 'http://localhost:4174/apex-alpine/', OLD = 'http://localhost:4175/apex-alpine/'
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] })
const wait = ms => new Promise(r => setTimeout(r, ms))
const top = (p, sel, extra = 0) => p.evaluate(([s, e]) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + e) }, [sel, extra])
async function heroFreeze(p) { await p.evaluate(() => { const v = document.querySelector('video'); if (v) { v.pause(); v.currentTime = 1.0 } const s = document.querySelector('.hero-snow'); if (s) s.style.visibility = 'hidden' }); await wait(800) }
for (const [vp, tag] of [[{ width: 1440, height: 900 }, 'desktop'], [{ width: 390, height: 844, isMobile: true, hasTouch: true }, 'mobile']]) {
  const opts = { viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: tag === 'mobile' ? 2 : 1, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch }
  // hero comparison (before vs after), video frozen at 1.0s, snow hidden
  for (const [u, n] of [[OLD, 'before'], [NEW, 'after']]) {
    const p = await browser.newPage(opts); await p.goto(u, { waitUntil: 'load' }); await wait(3500); await heroFreeze(p)
    await p.screenshot({ path: `screenshots/premium-${tag}-hero-${n}-frozen.png` })
    await p.evaluate(() => window.scrollTo(0, innerHeight * 0.75)); await wait(1800)
    await p.screenshot({ path: `screenshots/premium-${tag}-hero-transition-${n}.png` }); await p.close()
  }
  const p = await browser.newPage(opts)
  p.on('console', m => { if (m.type() === 'error') console.log(tag, 'ERR', m.text()) })
  p.on('pageerror', e => console.log(tag, 'PAGEERR', e.message))
  await p.goto(NEW, { waitUntil: 'load' }); await wait(3000)
  await p.screenshot({ path: `screenshots/premium-${tag}-00-hero-live.png` })
  const shots = [
    ['01-manifesto', '.manifesto', 120, 1800], ['02-stats', '.stats', -300, 2200], ['03-marquee', '.marquee', -400, 1200],
    ['04-experiences-intro', '#experiences', 10, 1800],
  ]
  for (const [n, s, e, w] of shots) { await top(p, s, e); await wait(w); await p.screenshot({ path: `screenshots/premium-${tag}-${n}.png` }) }
  if (tag === 'desktop') {
    await top(p, '#experiences', 900); await wait(1800); await p.mouse.move(900, 400); await wait(1500)
    await p.screenshot({ path: `screenshots/premium-${tag}-05-experiences-scroll.png` })
    await top(p, '#experiences', 1700); await wait(1800); await p.screenshot({ path: `screenshots/premium-${tag}-06-experiences-end.png` })
  } else {
    await top(p, '.xcard', -60); await wait(1500); await p.screenshot({ path: `screenshots/premium-${tag}-05-experience-card.png` })
  }
  for (const [n, s, e, w] of [['07-interstitial-open', '.inter', 0, 1500], ['08-interstitial-full', '.inter', vp.height * 0.7, 1800], ['09-craft', '#craft', 250, 3500], ['10-gallery', '#gallery', 200, 2500], ['11-gallery-grid', '.g-grid', 300, 2500], ['12-chapters', '.chap-wrap', -150, 1500]]) {
    await top(p, s, e); await wait(w)
    if (n === '12-chapters' && tag === 'desktop') { const b = await p.locator('.chapter').nth(1).boundingBox(); await p.mouse.move(b.x + b.width * 0.6, b.y + b.height / 2); await wait(400); await p.mouse.move(b.x + b.width * 0.62, b.y + b.height / 2 + 5); await wait(1200) }
    await p.screenshot({ path: `screenshots/premium-${tag}-${n}.png` })
  }
  await top(p, '.testi', -200); await wait(1800); await p.screenshot({ path: `screenshots/premium-${tag}-13-testimonials.png` })
  await top(p, '#enquire', 0); await wait(2200)
  if (tag === 'desktop') { await p.fill('input[name=name]', 'Ahmad Shokoori').catch(() => {}); await p.locator('textarea').focus(); await wait(1200) }
  await p.screenshot({ path: `screenshots/premium-${tag}-14-enquire.png` })
  if (tag === 'mobile') { await top(p, '.enq-card', -40); await wait(1500); await p.screenshot({ path: `screenshots/premium-${tag}-15-enquire-form.png` }) }
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await wait(1800); await p.screenshot({ path: `screenshots/premium-${tag}-16-footer.png` })
  await p.close()
}
await browser.close()
