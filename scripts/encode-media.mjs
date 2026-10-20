// Pages build helper: replace binary media in dist/media with base64 text files (see src/media.ts).
import fs from 'node:fs'
const dir = 'dist/media'
for (const f of fs.readdirSync(dir)) {
  if (f.endsWith('.txt')) continue
  if (f === 'hero.webm' || f === 'poster.jpg') { fs.rmSync(`${dir}/${f}`); continue } // mp4 is enough for Pages build
  fs.writeFileSync(`${dir}/${f}.b64.txt`, fs.readFileSync(`${dir}/${f}`).toString('base64'))
  fs.rmSync(`${dir}/${f}`)
}
fs.writeFileSync('dist/.nojekyll', '')
console.log(fs.readdirSync(dir).map(f => f + ' ' + fs.statSync(`${dir}/${f}`).size).join('\n'))
