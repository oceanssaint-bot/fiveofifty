# FIVEOFIFTY STUDIOS — Website

A static, multi-page portfolio site for FIVEOFIFTY STUDIOS (creative production house, Durban, South Africa). Built on the studio's light-led brand system: **Paper `#FFFFFF` · Ink `#0A0A0A` · Orange `#FF5C00`**, Bebas Neue (display) / Montserrat (body) / DM Mono (labels) / Be Vietnam Pro (pull-quotes).

## Structure

```
site/
├── index.html      Home — editorial hero, Highlights, Showreel + manifesto, Latest
├── videos.html     Work / Videos — 12 portrait video tiles (hover to unmute)
├── stills.html     Work / Stills — 15 photos + lightbox (arrow-key nav)
├── team.html       Meet the Team — 4 members, alternating layout
├── contact.html    Studio info + contact form (Netlify Forms ready)
├── styles.css      All styling + brand tokens
├── main.js         Nav, mobile menu, lazy video, hover-to-unmute, page-transition fades, lightbox, form
├── assets/         Logo marks, ring, seal, OG share image
└── fonts/          Self-hosted brand fonts
```

## Local preview
Open `index.html` in a browser, or serve the folder:
`npx serve site` (any static server works — paths are relative).

## Deploy (Netlify / Vercel)
Point the host at the `site/` folder as the publish directory. No build step.
`_headers` sets long-cache for fonts/assets; `sitemap.xml` + `robots.txt` are included.
The contact form is wired for **Netlify Forms** (`data-netlify="true"`); a JS fallback
shows a "Thanks for submitting!" success state so it also works in preview.

## Home layout
The home page leads with the **Editorial** hero (type-led) chosen at sign-off, followed by
the Highlights mosaic, the Showreel + manifesto block, and the Latest grid — mirroring the
rhythm of the reference site (`halfandhalve.com`).

## Interaction details
- **Hover-to-unmute** — hovering (or keyboard-focusing) any video tile unmutes that clip and
  mutes every other; leaving re-mutes. Audio is suppressed under `prefers-reduced-motion` and
  when the tab is hidden. (First unmute may need one page interaction, per browser autoplay rules.)
- **Page-transition fades** — internal navigation fades the page out (300 ms) and the next
  page fades in; off-site links, new-tab links, downloads, and reduced-motion users bypass it.

---

## ⚠️ Asset-swap checklist (before client handoff)

All media is placeholder. Swap before going live:

- [ ] **Videos** — replace every `https://commondatastorage.googleapis.com/...mp4` with
      client reels. Use `data-src` (lazy-loaded) + a `poster` image. Compress to ≤ 5 MB
      per loop (MP4/WebM), keep `muted loop playsinline`.
- [ ] **Stills** — replace every `https://picsum.photos/seed/...` image (thumb + the
      `data-full` large version on stills.html) with client photography.
- [ ] **Team** — real photos (`assets/`), names, roles, and **client-approved bios**
      (remove the "Placeholder bio" flags in `team.html`).
- [ ] **Manifesto** — approve / replace the draft copy in `index.html`
      (remove the "Draft — client to approve" flag).
- [ ] **Contact** — real email, phone, city, Instagram + TikTok handles.
- [ ] **Showreel** — point the `Showreel` link (`index.html`) at the real reel (Vimeo/YouTube).
- [ ] **Logo** — current header/footer use the seal monogram + type wordmark. Swap for the
      final logo SVG if/when supplied (also `assets/og-placeholder.png` and the favicon).
- [ ] **Domain + OG** — update absolute URLs in `sitemap.xml`, `robots.txt`, and the
      `og:image` paths once the production domain is live.

---

## Self-service CMS (client adds work with a passcode — no GitHub access)

The work list is **data-driven**. The Videos page and the home **Latest Work** list both
render from one file — [`data/videos.json`](data/videos.json) — via `initWork()` in `main.js`.
The client edits this file through a passcode-protected form at **`/admin`**. They never
touch GitHub: saving runs through a serverless function that commits to the repo using
**your** token (kept secret on the server).

```
data/videos.json    ← the work list (title, category, year, platform, link, …)
admin/index.html    ← the /admin passcode login + editing form (self-contained)
api/save-videos.js  ← validates the passcode, commits data/videos.json via GitHub API
```

**Flow:** client opens `yoursite.com/admin` → enters the **passcode** → edits the form
(paste a YouTube/Vimeo link) → **Publish** → the function commits `data/videos.json` →
Vercel redeploys (~1 min) → live. Tiles open a player modal; YouTube thumbnails are
auto-derived, Vimeo thumbnails are fetched via Vimeo oEmbed (or set a custom one).

### One-time setup (needs your GitHub + Vercel accounts)

1. **Create a fine-grained GitHub token** — GitHub → *Settings → Developer settings →
   Personal access tokens → Fine-grained tokens → Generate new*:
   - **Resource owner:** your account · **Repository access:** *Only select repositories* →
     pick `fiveofifty`.
   - **Permissions:** *Repository permissions → Contents → Read and write*.
   - Generate and copy the token (starts with `github_pat_…`).
2. **Add two env vars in Vercel** (*Project → Settings → Environment Variables*, Production),
   then redeploy:
   - `GITHUB_TOKEN` = the fine-grained token from step 1
   - `ADMIN_PASSWORD` = the passcode you'll give the client
   - *(optional)* `GITHUB_REPO` (default `oceanssaint-bot/fiveofifty`), `GITHUB_BRANCH` (default `main`)
3. Visit `https://YOUR-DOMAIN/admin`, enter the passcode, and publish a test change. Done —
   give the client only the URL and the passcode.

> **Why this is safe:** the GitHub token lives only in Vercel's server environment and is
> never sent to the browser. The client authenticates with the passcode alone. To rotate
> access later, change `ADMIN_PASSWORD` (client) or regenerate `GITHUB_TOKEN` (you).

## Backlog / nice-to-haves (not yet built)
Hover-to-unmute on video tiles ✓ · page-transition fades ✓ · passcode CMS ✓ ·
Stills via CMS (image uploads) · analytics (Plausible/GA4).
