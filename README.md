# Control Video · LED Truck Co. — sites

Static HTML for the two sister sites, plus a gateway page for internal review.

| Page | Site |
|---|---|
| `index.html` | Review gateway linking both sites |
| `home.html`, `work.html`, `events.html`, `technology.html`, `identity.html` | Control Video (dark) |
| `led.html`, `led-fleet.html` | LED Truck Co. (light) |

Images, the self-hosted Sora font, and the shared `site.css` / `site.js` live in `assets/`.

## Switching between the sites
A two-position switch beside the logo (built by `assets/site.js`) flips between Control Video (dark) and LED Truck Co. (light) with a circular color wipe, landing on the matching page: Home ↔ LED home, Technology ↔ Fleet, Events ↔ LED “Built for the crowd”.

## Status
Draft for internal review — responsive from 375px phones up to 1440px desktop, and marked `noindex`. Remove the `robots` meta tags, `robots.txt` and the `X-Robots-Tag` header in `netlify.toml` before launch.

## Run locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Deploy
GitHub Pages serves `main` at https://controlvideodc5-tech.github.io/control-video-sites/ (links are relative, so it works from the sub-path).

Netlify: site `control-video-review` — connect this repo in **Project configuration → Build & deploy → Link repository**. No build command; publish directory is the repo root.

## Forms: 5-things bot, contact form, Careers
- **5-things bot** — every project call to action ("Let’s talk", "Start a project", "Email us", "Book a truck", rig cards) opens a full-screen chat that asks the questions from the printed "5 things we need to know about your event" sheet (`assets/control-video-5-things.pdf`) one at a time: how many people, where, when, what the audience should see and hear, and what can’t go wrong, plus budget and files. Truck cards pre-fill the rig. `#talk` or `#quote` in the URL opens it.
- **Contact form** — the bot’s “Just send a message” button switches to a short form (name, email, phone, date, message, files). `#message` opens it.
- **Careers** — any "Careers" link opens a separate candidate form (name, email, phone, role, about, résumé). `#careers` opens it.

To change what the bot says, edit `assets/bot-script.js` — every line, button and hint is there, with notes on what's safe to change.

Plain email-address links still open email. Uploads: up to 10 files, 5 MB each, plus a link for anything larger.

Submissions go through `netlify/functions/forms.mjs` into the Airtable base **Control Video — Inquiries**:

| Path | Airtable table | Email automation |
|---|---|---|
| `/api/inquiry` | Inquiries | Email new inquiry to hello@controlvideo.com |
| `/api/careers` | Candidates | Email new candidate to hello@controlvideo.com |

Flow: create record (Status empty) → upload each file into the record → set Status = New, which triggers the email (with the files attached and Reply-To set to the sender).

Spam protection: a hidden honeypot field, a server-signed arithmetic check, a minimum fill time (4 s), link-count limits, and file type/size checks, all verified server-side.

### Setup
1. Netlify → `control-video-review` → link this repo (no build command, publish directory `.`). Functions are picked up from `netlify/functions`.
2. Airtable → create a personal access token with `data.records:read` and `data.records:write` on the Inquiries base, then add it in Netlify as the environment variable `AIRTABLE_TOKEN` (scope: Functions).
3. Airtable → Automations → test and turn on both email automations.

The GitHub Pages copy posts to the Netlify site (CORS is allowed only for `https://controlvideodc5-tech.github.io`; override with `ALLOWED_ORIGINS`).

To send submissions to another system later (e.g. Stagera), add a second store next to `store` in `forms.mjs`.
