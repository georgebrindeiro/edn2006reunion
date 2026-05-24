// src/lib/constants.ts
// ─────────────────────────────────────────────────────────────────────────────
// FILL IN YOUR EVENT DETAILS HERE
// ─────────────────────────────────────────────────────────────────────────────

import type { EventDetails } from "@/types";

export const EVENT: EventDetails = {
  date:          "2026-XX-XX",                          // e.g. "2026-09-20"
  time:          "XX:00",                               // e.g. "18:00"
  venueName:     "Nome do Local",                       // venue name
  venueAddress:  "Endereço completo do local",          // full address
  venueCity:     "Brasília, DF — Brasil",
  mapsUrl:       "https://maps.google.com/?q=...",      // Google Maps link
  costPerPerson: 0,                                     // amount in BRL
  currency:      "BRL",
  paymentInfo:   "PIX: xxx@email.com | Nome: XXXXXXX", // payment instructions
  whatsIncluded: [
    "Churrasco",
    "Bebidas não-alcoólicas",
    "Chopp (para quem optar)",
  ],
};

// Google Photos shared album embed URL
// Share the album → Get link → paste it here
export const GOOGLE_PHOTOS_ALBUM_URL =
  "https://photos.app.goo.gl/REPLACE_WITH_YOUR_ALBUM_LINK";

// Reunion info
export const REUNION = {
  schoolName:    "Escola das Nações",
  schoolSlogan:  "World Citizens",
  classYear:     2006,
  yearsAgo:      20,
  foundedYear:   1980,
  schoolQuote:   "A Terra é um só país, e os seres humanos seus cidadãos.",
  quoteAuthor:   "Bahá'u'lláh",
};
