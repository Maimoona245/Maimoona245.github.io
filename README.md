# Zaina Boutique — 4-Page Website + Node Backend

```
zaina-boutique/
├── index.html  about.html  services.html  contact.html
├── style.css      ← one stylesheet for all pages
├── script.js      ← mobile menu + contact form (calls the API)
├── images/        ← optimized .webp + SVG team placeholders
├── server.js      ← Node/Express backend
├── package.json   render.yaml   .gitignore
```

## Run locally
```
npm install
npm start          # http://localhost:3000
```
Optional env vars: `PORT`, `ADMIN_TOKEN` (enables `GET /api/messages`), `ALLOWED_ORIGIN` (CORS), `DATA_DIR`.

## API
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/contact` | Validates and saves a contact message to `data/messages.json` |
| GET | `/api/messages` | Owner-only (`Authorization: Bearer <ADMIN_TOKEN>`) |
| GET | `/api/health` | Health check |

## Deploy (public URL)
**Option A — Render (full site + backend, free):**
1. Create a GitHub account → New repository `zaina-boutique` → upload all files (not `node_modules`).
2. render.com → New → Web Service → connect the repo. Build: `npm install`, Start: `npm start`.
3. You get `https://zaina-boutique.onrender.com`. Note: free instances sleep when idle, and the JSON file resets on redeploy.

**Option B — GitHub Pages / Netlify (frontend only):**
GitHub Pages: repo → Settings → Pages → Deploy from branch `main` / root.
Netlify: drag the folder onto app.netlify.com/drop.
These host static files only, so deploy `server.js` to Render too, then set `API_BASE` in `script.js`
to the Render URL and set `ALLOWED_ORIGIN` on Render to your Pages/Netlify URL.

## PageSpeed
Test at pagespeed.web.dev (Mobile). Already done: webp images with explicit sizes,
lazy loading, deferred JS, gzip, long cache headers, no render-blocking JS.
