# Control Video · LED Truck Co. — sites

Static HTML for the two sister sites, plus a gateway page for internal review.

| Page | Site |
|---|---|
| `index.html` | Review gateway linking both sites |
| `home.html`, `work.html`, `events.html`, `technology.html`, `identity.html` | Control Video (dark) |
| `led.html`, `led-fleet.html` | LED Truck Co. (light) |

Images and the self-hosted Sora font live in `assets/`.

## Status
Draft for internal review — pages are desktop layouts (1440px canvas scaled to the window) and are marked `noindex`. Remove the `robots` meta tags, `robots.txt` and the `X-Robots-Tag` header in `netlify.toml` before launch.

## Run locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Deploy
Netlify site `control-video-review` — connect this repo in **Project configuration → Build & deploy → Link repository**. No build command; publish directory is the repo root.
