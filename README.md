# Serenive Beauty & Spa: serenive.com.au

The website for Serenive Beauty & Spa, built from the Serenive design pack. It's a static site
(plain HTML, CSS and a small script) served by a Cloudflare Worker, and it deploys from this repo.

```
public/          the website, served as-is
  _headers       response headers (includes the pre-launch noindex)
  404.html       branded not-found page
wrangler.jsonc   Cloudflare Worker config
package.json     pins Wrangler, the Cloudflare CLI
```

## Pages

| Address | File | Page |
| --- | --- | --- |
| `/` | `index.html` | Home: hero, why we exist, treatments, the space, packages and vouchers, Instagram, newsletter |
| `/philosophy` | `philosophy.html` | Why We Exist (client copy, verbatim) |
| `/treatments` | `treatments.html` | The seven menu categories, with from-prices and Book buttons |
| `/treatments/facials` and six more | `treatments/*.html` | One page per menu category with the full price list and its own share image |
| `/packages` | `packages.html` | Signature spa rituals and gift cards |
| `/visit` | `visit.html` | Address, hours, contact form |
| `/book` | `book.html` | Booking, framed in the site's header and footer, ready for the Square embed |

Cloudflare serves `visit.html` at `/visit` and redirects `/visit.html` there, so links in the
pages use the short form (`/visit`).

## Working on it locally

```bash
npm install
```

```bash
npm run dev
```

The site runs at http://localhost:8787, served the same way Cloudflare serves it. Edit the files in
`public/` directly: there's no build step.

## Deploying (Cloudflare Workers Builds)

One-time setup in the Cloudflare dashboard:

1. **Workers & Pages → Create → Import a repository**, then choose `MeSquaredAgency/serenive-site`.
2. Leave the build command empty. The deploy command is `npx wrangler deploy`.
3. Production branch: `main`. Pushes to `main` go live; other branches get preview URLs.

**Domain:**

1. Add `serenive.com.au` to Cloudflare as a site and switch the domain's nameservers to the two
   Cloudflare gives you. Keep the registration where it is.
2. Before switching, add any existing DNS records (Google Workspace MX and verification records) in
   Cloudflare so email keeps working.
3. On the Worker, go to **Settings → Domains & Routes** and add `serenive.com.au` and
   `www.serenive.com.au` as custom domains.
4. Add a Redirect Rule (Rules → Redirect Rules → template "Redirect from WWW to root") so `www`
   goes to `https://serenive.com.au`.

## Performance

- **Fonts** are self-hosted in `public/fonts/`: Playfair Display and Montserrat, latin subset, variable
  weights, under the SIL Open Font License. The two upright faces are preloaded. Nothing loads from
  Google Fonts.
- **Textures** are pre-rendered WebP images (`assets/textures/*.webp`), not live SVG filters. Blur and
  grain filters redraw on every scroll frame and caused visible jank. Keep new decorative art as
  images or plain-stroke SVG.
- **Hero:** the backdrop is a single image that drifts on the GPU, and the gold line art is a plain SVG
  drawn once on load. The headline never fades from invisible, so it counts as painted straight away.
- **Smooth scrolling** uses Lenis (`js/vendor/lenis-1.3.27.min.js`, MIT) for mouse and trackpad. Touch
  keeps native scrolling, and it switches off for visitors who prefer reduced motion.

## Draft mode

`<html data-draft>` on every page shows two kinds of note for review:

- **Photo briefs** on every image slot (for example "Photo · Hands, warm oil, soft light on skin").
  Until the photography arrives, the slots hold brand textures based on the brand board's patterns.
- **"(to confirm)" tags** on content the client still has to supply. All of it carries the `.tbc` class.

## Launch checklist

- [ ] Remove `X-Robots-Tag: noindex` from `public/_headers`. It keeps search engines out until launch.
- [ ] Remove `data-draft` from the `<html>` tag on every page.
- [ ] Replace every `.tbc` placeholder (search the code for `class="tbc`).
- [ ] Swap brand textures for photography (see below).
- [ ] Add the address, phone and opening hours to the `DaySpa` structured data in `index.html`.
- [ ] Connect Square booking, gift vouchers and the forms (see below).
- [ ] Point the social links at the confirmed handles.
- [ ] Submit `https://serenive.com.au/sitemap.xml` in Google Search Console.

## Photography

Stand-in stock photography from Unsplash (free commercial licence) is in `public/assets/photos/`,
graded toward the brand palette, at two sizes per image (`name.webp` and `name-sm.webp`). Sources
are listed in `public/assets/photos/CREDITS.md`. Replace them with Serenive's own shoot, keeping
the file names, or update the references in the pages.

## Swapping in photography

Each image slot is a `<figure class="media media--…">`. Put an `<img>` inside it and it covers the
texture:

```html
<figure class="media split__media">
  <img src="/assets/photos/hot-stone-massage-room-serenive.jpg" alt="Hot stone massage room at Serenive">
</figure>
```

For the treatment cards on the home page, replace `<div class="card__inner media--…"></div>` with
`<img class="card__inner" …>`. Use descriptive file names and alt text, and compress images before
committing them.

## Still to connect

- **Square Appointments:** paste Square's embed into `public/book.html` (see the comment there), or
  put the Square booking URL in `data-square-url` on `#booking-continue`. In Square, set the button
  colour to Forest `#2F4A3B` and upload `serenive-monogram` as the logo.
- **Gift vouchers:** point the "Buy a gift voucher" button in `public/packages.html` at Square eGift Cards.
- **Newsletter and contact forms:** set `data-endpoint` on each `<form data-form>`. The plan is a small
  Worker script (`src/worker.js`, set as `main` in `wrangler.jsonc`) that receives the submission and
  forwards it to the email platform. With no endpoint set, the forms show a preview message.

## The menu

Treatments, durations and prices come from the owners' approved list (Serenive Beauty & Spa,
November 2026) and live in one place: the `TREATMENTS` list in the page builder, which writes the
category pages. Seasonal offers (for example the Winter Comforter) are deliberately left off the
site, because they change continually; promote them on Instagram instead. Treatment names should
match the booking system exactly.

Address, phone, email and treatment hours are on the Visit page, in the footer and in the home
page's structured data.

## Content needed from Serenive

- Set up the hello@serenive.com.au mailbox (the domain has no mail records yet).
- Online booking link (Acuity or Square) and the e-gift card link.
- Social handles.
- Professional photography of the space, team and treatments to replace the stock images.

## Brand rules (from the design pack)

Keep to these when editing:

- **Colour:** forest, sage, ivory and gold, plus the pack's derived text tokens (`ink-muted`, `accent`).
  No other hues, and no gradients apart from the sage-marble texture.
- **Shadows:** none. Separate things with space, hairlines or a gold rule.
- **Gold:** the monogram, rules, line art and the header Book button only. No other gold buttons or
  blocks.
- **Buttons:** the header Book button is gold. Book buttons on ivory are forest. Every other button is
  an outline.
- **Type:** Playfair Display for headings, Montserrat for text and UI. Headings in sentence case
  ("Body treatments"); uppercase only for eyebrows and buttons.
- **Alignment:** body text left-aligned. Centring only for the hero and signage moments.
- **Corners:** square on images, panels and cards; 4px on buttons and fields.
- **Grounds:** ivory and forest alternate. Sage once per page at most.
- **Motion:** fade and rise at 600–900ms, switched off for visitors who prefer reduced motion.
- **Share images:** `assets/og/serenive-share.png` by default, plus one per treatment
  (`serenive-<treatment>.png`), 1200×630.
