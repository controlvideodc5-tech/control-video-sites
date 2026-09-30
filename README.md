# Control Video · LED Truck Co. — sites

Static HTML for the two sister sites, plus a gateway page for internal review.

| Page | Site |
|---|---|
| `index.html` | Review gateway linking both sites |
| `home.html`, `work.html`, `events.html`, `technology.html`, `identity.html` | Control Video (dark) |
| `led.html`, `led-fleet.html` | LED Truck Co. (light) |

Images, the self-hosted Sora font, and the shared `site.css` / `site.js` live in `assets/`.

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

## Forms (Let's talk + Careers)
Buttons that used to open email ("Let’s talk", "Start a project", "Email us", "Book a truck", rig cards) open a full-screen project form; any "Careers" link opens a separate candidate form. Both accept file uploads (up to 10 files, 5 MB each) plus shared links for anything larger. Plain email-address links still open email.

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
