# EDN Reencontro 2006 — Project Context for Claude Code

This document summarizes all design decisions, requirements, and implementation details
discussed during the initial planning session. Use it as the source of truth when
continuing development.

---

## 1. What This Is

A **private reunion website** for the Class of 2006 of **Escola das Nações** (Brasília, DF, Brazil),
marking their **20-year reunion**. The school's motto is "World Citizens" and it was founded
September 1, 1980. Its founding quote (displayed prominently):

> "A Terra é um só país, e os seres humanos seus cidadãos." — Bahá'u'lláh

The site is **not public**. Access is gated by a shared passphrase. New member registration
is only possible via a secret, admin-rotatable invite link.

---

## 2. Brand & Visual Identity

**Source assets:** Photos of original school uniforms (t-shirts) showing the logo.

**Logo:** Three stick figures holding hands, with a gradient of fill:
- Left figure: solid dark navy
- Center figure: medium steel blue / cross-hatched
- Right figure: outlined / lightest

Below the figures: "WORLD CITIZENS" (small caps, tracked) and "Escola das Nações" (bold display font)

**Color palette** (all defined as Tailwind tokens under `edn-*`):

| Token | Hex | Use |
|---|---|---|
| `edn-navy` | `#1a2744` | Primary — backgrounds, buttons, nav |
| `edn-navy-mid` | `#243461` | Hover states |
| `edn-steel` | `#4a6080` | Secondary text, accents |
| `edn-steel-lt` | `#7a96b8` | Light accents |
| `edn-mist` | `#c8d6e8` | Very light blue-gray |
| `edn-cloud` | `#edf1f7` | Page backgrounds, cards |

**Typography:**
- Display/headings: `Playfair Display` (Google Fonts) → `var(--font-display)`
- Body: `DM Sans` (Google Fonts) → `var(--font-body)`

**Design direction:** Clean and warm, slightly nostalgic. Navy-dominant with white cards.
The stick figure logo is used as a recurring motif (watermark on hero sections, favicon, etc.).
Mobile-first — most users will access on phones.

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + custom `edn-*` tokens |
| Auth | NextAuth.js v5 (credentials provider, passphrase-based) |
| Database | Neon (Postgres serverless) + Prisma ORM |
| File uploads | Uploadthing (photos + videos) |
| Hosting | Vercel |
| Language | TypeScript |

---

## 4. Authentication Model

**Two access levels:**

1. **Members** — log in with their email + a shared `LOGIN_PASSPHRASE` (set in `.env.local`).
   First login auto-creates their user record.

2. **Admin** — log in with any email + `ADMIN_PASSPHRASE`. Automatically gets `role: ADMIN`.

**Registration flow:**
- Admin generates a secret invite link from `/admin`
- Link format: `/register/[token]` — a 32-char random token stored in `InviteToken` table
- Link is not linked anywhere on the site
- Admin can rotate the token at any time; old links immediately stop working
- After registering, members log in via `/login` with the shared passphrase

---

## 5. Site Structure (All Routes)

| Route | Layout | Access | Description |
|---|---|---|---|
| `/` | — | Public | Redirects to `/login` or `/dashboard` |
| `/login` | Auth | Public | Passphrase login |
| `/register/[token]` | Auth | Token-gated | New member registration |
| `/dashboard` | Protected | Members | Main hub — event info, countdown, quick links |
| `/rsvp` | Protected | Members | Event details + RSVP form |
| `/memories` | Protected | Members | Google Photos embed + user contributions |
| `/classmates` | Protected | Members | Then & Now profile grid |
| `/messages` | Protected | Members | Video messages (record or upload) |
| `/profile/edit` | Protected | Members | Edit own profile + upload photos |
| `/admin` | Protected | Admin only | Stats, invite link rotation, CSV export |

---

## 6. Data Model (Prisma Schema)

Key models:

- **User** — email, role, fullName, birthday, phone, city/state/country, photoThen (URL), photoNow (URL)
- **StudyPeriod** — yearStart, yearEnd (linked to User; can have multiple rows per user)
- **Rsvp** — isAttending, joinsBarbecue, drinksAlcohol, drinkPreference, paymentRef; linked to User
- **Guest** — fullName, age (optional); linked to Rsvp as either adult or child guest
- **Memory** — type (PHOTO | VIDEO | QUOTE | STORY), title, content, mediaUrl; linked to User
- **VideoMessage** — videoUrl, approved; one per User
- **InviteToken** — token (unique string), active (bool)

---

## 7. Registration Form Fields (`/register/[token]`)

- Full name *
- Birthday (date picker)
- Phone / WhatsApp *
- Email *
- City *, State, Country *
- Study period(s) at EDN — multi-row year range selector (yearStart → yearEnd)
  - School years span roughly 1985–2010
  - Users can add multiple periods (e.g. if they left and came back)

---

## 8. RSVP Form Fields (`/rsvp`)

Shown alongside event details card (date, venue, cost, payment info, what's included).

**Attendance:**
- Are you coming? Yes / No
- If No → nudge to leave a video message

**Adult guests:**
- Add/remove rows; each row: full name (required)

**Child guests:**
- Add/remove rows; each row: full name (required) + age (required)
- Ages collected for planning purposes; names needed for door list

**Food & drinks:**
- Participating in barbecue? Yes / No
- Will you drink alcohol? Yes / No
- If yes → preference: Draft beer / Spirits & cocktails / Both

**Payment:**
- Text field for PIX reference / payment confirmation code

---

## 9. Profile Page (`/profile/edit`)

- All registration fields (editable)
- **Then & Now photos:**
  - "Foto na EDN (antes)" — drag-and-drop or click to upload old school photo
  - "Foto hoje (depois)" — same for current photo
  - Both uploaded via Uploadthing (`profilePhoto` endpoint)
  - These photos appear side-by-side on the `/classmates` grid

---

## 10. Memories Page (`/memories`)

Two sections:

**Google Photos album:**
- Embedded via iframe using a shared album URL
- URL configured in `src/lib/constants.ts` → `GOOGLE_PHOTOS_ALBUM_URL`
- Falls back gracefully to a placeholder if not configured

**User contributions (tabbed):**
- **Citações (Quotes)** — short text, displayed as navy blockquotes
- **Histórias (Stories)** — longer text with optional title
- **Fotos / Vídeos** — uploaded via Uploadthing (`memoryMedia` endpoint), masonry layout

---

## 11. Video Messages Page (`/messages`)

- Members can record directly in browser (MediaRecorder API, up to 2 min / 120 seconds)
- Or upload a pre-recorded file (MP4, MOV, WebM, up to 256 MB)
- Video uploaded via Uploadthing (`videoMessage` endpoint)
- One video message per user (upsert)
- Gallery shown to all logged-in members
- Admin can approve/hide messages

**Primary use case:** Members who **cannot attend** leaving a message for the reunion.
But anyone can submit one.

---

## 12. Classmates Page (`/classmates`)

- Grid of all registered members who have a `fullName`
- Each card shows:
  - Left half: `photoThen` (old school photo) — placeholder 🎒 if not uploaded
  - Right half: `photoNow` (current photo) — placeholder 🙂 if not uploaded
  - "Antes" / "Hoje" labels
  - Name, city/country, EDN study period(s)

---

## 13. Admin Panel (`/admin`)

- **Stats cards:** total registered, attending, not going, no RSVP, barbecue count,
  alcohol count, adult guests total, child guests total
- **Invite link management:** display current active link, copy button, rotate button
  (calls `/api/admin/rotate-token` which deactivates all tokens and creates a new one)
- **Member table:** name, email, city, RSVP status, guest count, payment status
- **CSV export:** downloads all RSVP data as a `.csv` file

---

## 14. Uploadthing File Router (3 endpoints)

Defined in `src/lib/uploadthing.ts`:

| Endpoint | Types | Max size | Used by |
|---|---|---|---|
| `profilePhoto` | image | 8 MB | Profile then/now photos |
| `memoryMedia` | image or video | 16 MB / 256 MB | Memories page contributions |
| `videoMessage` | video | 256 MB | Video messages |

Client hooks exported from `src/lib/uploadthing-client.ts`.

---

## 15. Event Details (All Placeholders — Fill In)

Edit `src/lib/constants.ts`:

```ts
export const EVENT = {
  date:          "2026-XX-XX",         // actual event date
  time:          "XX:00",              // e.g. "18:00"
  venueName:     "Nome do Local",
  venueAddress:  "Endereço completo",
  venueCity:     "Brasília, DF — Brasil",
  mapsUrl:       "https://maps.google.com/?q=...",
  costPerPerson: 0,                    // in BRL
  currency:      "BRL",
  paymentInfo:   "PIX: xxx@email.com",
  whatsIncluded: ["Churrasco", "Bebidas não-alcoólicas", "Chopp"],
};

export const GOOGLE_PHOTOS_ALBUM_URL =
  "https://photos.app.goo.gl/REPLACE_WITH_YOUR_ALBUM_LINK";
```

---

## 16. Environment Variables (`.env.local`)

```env
DATABASE_URL="postgresql://..."        # Neon pooled connection
DIRECT_URL="postgresql://..."          # Neon direct connection
AUTH_SECRET="..."                      # openssl rand -base64 32
LOGIN_PASSPHRASE="..."                 # shared with all members
ADMIN_PASSPHRASE="..."                 # admin-only, keep secret
NEXT_PUBLIC_APP_URL="https://..."      # your Vercel URL
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="..."
```

---

## 17. First-Run Setup Sequence

```bash
npm install                  # also runs prisma generate (postinstall)
cp .env.example .env.local   # fill in all values
npm run db:push              # push schema to Neon
npm run db:seed              # creates first invite token, prints the link
npm run dev                  # start local dev server
```

Then:
1. Go to `/login`, use any email + your `ADMIN_PASSPHRASE`
2. Go to `/admin` — you'll see the invite link
3. Share it with classmates

---

## 18. Known TODOs / Next Steps

- [ ] Fill in event details in `src/lib/constants.ts`
- [ ] Add Google Photos album URL to `src/lib/constants.ts`
- [ ] Configure Uploadthing (get keys, add to `.env.local`)
- [ ] Set up Neon project and add connection strings to `.env.local`
- [ ] Deploy to Vercel and set all env vars in the dashboard
- [ ] Run `npm run db:seed` to generate the first invite token
- [ ] Consider adding a live countdown component (client-side) to the dashboard
- [ ] Consider adding admin ability to approve/reject memories and video messages
- [ ] Consider adding email notifications (Resend or similar) when someone RSVPs
- [ ] Uploadthing: wire up direct file upload for in-browser recorded videos
  (currently records as Blob, converts to File, uploads — should work but needs testing)
- [ ] Test MediaRecorder in mobile Safari (may need `video/mp4` fallback mimeType)
- [ ] Add `favicon.ico` based on the EDN stick figures logo

---

## 19. Repository

**GitHub:** https://github.com/georgebrindeiro/edn2006reunion  
**Hosting:** Vercel (connected to the repo above)  
**v2 scaffold:** All files from the planning session are in this repo.
