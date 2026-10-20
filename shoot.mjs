import { chromium } from 'playwright'
const url = 'http://localhost:4174/apex-alpine/'
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] })
const shot = async (page, name, w = 1800) => { await page.waitForTimeout(w); await page.screenshot({ path: `screenshots/${name}.png` }) }
const to = async (page, sel, extra = 0) => { await page.evaluate(([s, e]) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + e) }, [sel, extra]) }
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', m => { if (m.type() === 'error') console.log('ERR', m.text()) })
page.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()) })
await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(800)
console.log('video', await page.evaluate(() => { const v = document.querySelector('video'); return v && { t: v.currentTime, rs: v.readyState, src: v.currentSrc, paused: v.paused } }))
await shot(page, 'desktop-01-hero', 2200)
await page.evaluate(() => window.scrollTo(0, innerHeight * 0.75)); await shot(page, 'desktop-02-hero-transition')
await to(page, '.manifesto', 300); await shot(page, 'desktop-03-manifesto')
await to(page, '#experiences', 80); await page.click('.exp-card:nth-child(2)'); await shot(page, 'desktop-04-experiences')
await to(page, '#craft', 100); await shot(page, 'desktop-05-craft', 2500)
await to(page, '#gallery', 300); await shot(page, 'desktop-06-gallery')
await to(page, '#enquire', 0); await shot(page, 'desktop-07-enquire')
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await shot(page, 'desktop-08-footer')
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await m.goto(url, { waitUntil: 'load' }); await shot(m, 'mobile-01-hero', 5000)
await to(m, '#experiences', 0); await shot(m, 'mobile-02-experiences')
await browser.close()
