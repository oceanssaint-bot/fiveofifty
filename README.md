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

## Self-service CMS (owner adds work without touching code)

The work list is **data-driven**. The Videos page and the home **Latest Work** list both
render from one file — [`data/videos.json`](data/videos.json) — via `initWork()` in `main.js`.
Add an entry there and both update. The owner edits this file through a friendly form at
**`/admin`** (Decap CMS); no HTML required.

```
data/videos.json   ← the work list (title, category, year, platform, link, …)
admin/             ← Decap CMS (the /admin login + form)
api/auth.js        ← GitHub OAuth start  (Vercel serverless function)
api/callback.js    ← GitHub OAuth finish (Vercel serverless function)
```

**Flow:** owner opens `yoursite.com/admin` → *Login with GitHub* → fills the form
(paste a YouTube/Vimeo link) → **Publish** → commits `data/videos.json` to GitHub →
Vercel redeploys (~1 min) → live. Tiles open a player modal; YouTube thumbnails are
auto-derived, Vimeo thumbnails are fetched via Vimeo oEmbed (or set a custom one).

### One-time setup (needs your GitHub + Vercel accounts)

1. **Push to GitHub** — create a repo and push this folder:
   `git add . && git commit -m "Site + CMS" && git remote add origin <repo-url> && git push -u origin main`
2. **Deploy on Vercel** — *New Project* → import the repo. Framework preset: **Other**
   (it's static, no build). Deploy.
3. **Create a GitHub OAuth App** — GitHub → *Settings → Developer settings → OAuth Apps → New*:
   - Homepage URL: `https://YOUR-DOMAIN.vercel.app`
   - Authorization callback URL: `https://YOUR-DOMAIN.vercel.app/api/callback`
   - Copy the **Client ID** and generate a **Client Secret**.
4. **Add env vars in Vercel** (*Project → Settings → Environment Variables*), then redeploy:
   - `OAUTH_GITHUB_CLIENT_ID`
   - `OAUTH_GITHUB_CLIENT_SECRET`
5. **Edit [`admin/config.yml`](admin/config.yml)** — replace the 3 placeholders:
   `repo: OWNER/REPO`, and both `https://YOUR-DOMAIN.vercel.app` URLs. Commit + push.
6. Visit `https://YOUR-DOMAIN.vercel.app/admin` and log in with GitHub. Done.

> The owner's GitHub account must have write access to the repo. To add the owner without
> giving them the whole GitHub account, invite them as a collaborator on the repo.

> **Simpler-auth alternative:** [Sveltia CMS](https://github.com/sveltia/sveltia-cms) is a
> drop-in Decap replacement that uses the *same* `config.yml` but needs no `api/` OAuth
> functions on Vercel. Swap the script in `admin/index.html` if you'd rather skip steps 3–4.

## Backlog / nice-to-haves (not yet built)
Hover-to-unmute on video tiles ✓ · page-transition fades ✓ · CMS layer (Decap) ✓ ·
Stills via CMS (image uploads) · analytics (Plausible/GA4).
