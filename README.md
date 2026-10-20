# APEX ALPINE — concept site

Original luxury winter performance driving brand (concept). Vite + React + TypeScript, React Three Fiber + drei, Framer Motion, Lenis.
No affiliation with any vehicle or tyre manufacturer. All copy, testimonials and contact details are placeholders.

Live: https://fardeen459.github.io/apex-alpine/

```
npm install
npm run dev          # uses binary media from public/media
npm run build:pages  # production build for GitHub Pages (media re-encoded as base64 text, decoded to Blob URLs at runtime)
```

Media (`public/media`: hero.mp4/webm loop, poster, gallery stills) is not committed to `main` because the deployment
connector could only commit text files; it is included in the project zip and served (base64) from the `gh-pages` branch.

Hero video prep (ffmpeg): audio stripped; the first 0.8 s is crossfaded onto the tail for a seamless 7.23 s loop;
H.264 CRF 27 + faststart (~2.0 MB) and VP9 WebM CRF 38; poster + gallery stills extracted, cropped and de-logoed.
