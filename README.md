# Serenive Beauty & Spa: serenive.com.au

The website for Serenive Beauty & Spa, built from the Serenive design pack. It's a static site
(plain HTML, CSS and a small script) served by a Cloudflare Worker, and it deploys from this repo.

```
public/          the website, served as-is
  _headers       response headers (includes the pre-launch noindex)
  404.html       branded not-found page
src/worker.js    the Worker behind the contact and newsletter forms
wrangler.jsonc   Cloudflare Worker config (assets, email and KV bindings)
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
| `/privacy` | `privacy.html` | Privacy policy, linked from the footer's bottom bar |

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
`public/` directly: there's no build step. The forms work locally too: the email binding is
simulated (messages are logged in the terminal, not sent) and KV is a local store.

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
- [ ] Connect online booking and gift vouchers (see below). The forms are connected.
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

## Privacy policy and legal details

`/privacy` (`public/privacy.html`) is written in plain language for the Australian Privacy
Principles and the Spam Act, and names the services that touch client data: Square (bookings,
payments, gift cards), Google Workspace (email), Cloudflare (hosting, forms, analytics) and Me².
When it changes, update the "Last updated" line in the page's side column.

- Operator: Rebecca Handyside, sole trader, ABN 61 463 662 718 (active from 20 Oct 2026, not GST
  registered at the time of writing). The ABR showed no business name linked to the ABN; trading as
  "Serenive Beauty & Spa" normally needs the name registered with ASIC. Worth confirming with the owners.
- Social: Instagram https://www.instagram.com/serenive.au/ and Facebook
  https://www.facebook.com/Serenive.au/, linked from every footer and listed as `sameAs` in the
  home page's `DaySpa` data. There is no TikTok account, so no TikTok link.
- A booking and cancellation policy is not on the site yet; it needs the owners' terms (notice
  period, deposit and no-show rules) once Square is set up.

## Search, analytics and small comforts

- **Structured data.** The home page declares the `DaySpa` (address, phone, hours). Each treatment page
  declares a `Service` with an `OfferCatalog` of every menu item (name, duration, price in AUD) and a
  `BreadcrumbList`; the treatments index declares an `ItemList`. It is generated from the menu markup,
  so when prices change in the HTML, regenerate or edit the JSON-LD in the same page's `<head>`.
  Check with https://search.google.com/test/rich-results.
- **Analytics.** Cloudflare Web Analytics, loaded by the beacon script at the end of every page.
  Cookieless, so no consent banner. Reports live in the Me² Cloudflare account under Analytics &
  Logs → Web Analytics (site `serenive.com.au`). Automatic injection is switched off for the zone so
  the beacon is not counted twice.
- **Instant navigation.** A Speculation Rules block in every `<head>` prefetches same-site links as the
  pointer approaches them (`eagerness: moderate`), excluding `/api/*`. Browsers without support ignore it.
- **Open now.** `[data-open-status]` elements (home hero caption, Visit page, mobile menu) are filled by
  `site.js` from the hours table at the top of the open-now block, in Adelaide time. Public holidays are
  not known to it, so the wording stays soft. If the hours change, update the table there, the Visit
  page, the footer and the `DaySpa` data on the home page.

## Forms and email

`src/worker.js` answers two endpoints; everything else is served as a static asset.

- `POST /api/contact` (the Visit page) emails the message to `hello@serenive.com.au` with the
  visitor's address as Reply-To, so the team answers from their inbox.
- `POST /api/newsletter` (home and Rituals pages) stores the address and emails the team a note.

Mail goes out through **Cloudflare Email Service** from `website@mail.serenive.com.au`.
`mail.serenive.com.au` is a sending subdomain on the zone, with its own SPF, DKIM and DMARC, so it
never collides with the Google Workspace records on the apex that run the hello@ mailbox.

Every submission is also written to the KV namespace `serenive-site-forms` (Me² account):
`contact:<time>:<id>` entries are kept for 90 days, `subscriber:<email>` entries are kept until the
list moves to an email platform. Export subscribers from the Cloudflare dashboard (Storage & Databases
→ KV) or with `npx wrangler kv key list --namespace-id d01e8fe1a22e400cb4457d18e3da31bd --prefix subscriber:`.

Spam handling, in order: same-origin check, a honeypot field (`website`), a three-second minimum fill
time (the `t` field the script adds), and six submissions an hour per address. Spam gets a quiet
"ok". If it ever becomes a problem, Cloudflare Turnstile is the next step.

Settings live in `wrangler.jsonc` under `vars` (`CONTACT_TO`, `FROM_ADDRESS`, `FROM_NAME`).

## The menu

Treatments, durations and prices come from the owners' approved list (Serenive Beauty & Spa,
November 2026) and live in one place: the `TREATMENTS` list in the page builder, which writes the
category pages. Seasonal offers (for example the Winter Comforter) are deliberately left off the
site, because they change continually; promote them on Instagram instead. Treatment names should
match the booking system exactly.

Address, phone, email and treatment hours are on the Visit page, in the footer and in the home
page's structured data.

## Content needed from Serenive

- Square booking link and the Square eGift card link (Square chosen; account being verified).
- Professional photography of the space, team and treatments to replace the stock images.

## House rules (Me²)

- **Credit:** every site Me² builds carries "Powered by Me²", linking to https://mesquaredagency.com/,
  in the footer (here: bottom right of the footer's bottom bar, opposite the copyright).
  Keep it when editing the footer.

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
