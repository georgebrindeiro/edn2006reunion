// src/lib/constants.ts
// ─────────────────────────────────────────────────────────────────────────────
// FILL IN YOUR EVENT DETAILS HERE
// ─────────────────────────────────────────────────────────────────────────────

import type { EventDetails } from "@/types";

export const EVENT: EventDetails = {
  date:             "2026-06-20",
  time:             "12:00 - 20:00",
  venueName:        "Clube da Aeronáutica",
  venueAddress:     "SCEN Trecho 1 Conjunto 6",
  venueCity:        "Brasília, DF — Brasil",
  mapsUrl:          "https://maps.app.goo.gl/UShjxiKcpuiq1uoZ9",
  costPerPerson:        160,
  costPerPersonReduced: 40,   // NO_FOOD + OWN_DRINKS
  costPerChild:         80,
  currency:         "BRL",
  pixKey:           "george.brindeiro@gmail.com",
  pixRecipientName: "EDN REUNION 2006",
  pixCity:          "BRASILIA",   // max 15 chars, no special characters
  whatsIncluded: [
    "Churrasco",
    "Bebidas não-alcoólicas",
    "Chopp",
  ],
};

// Google Photos shared album embed URL
export const GOOGLE_PHOTOS_ALBUM_URL =
  "https://photos.app.goo.gl/ekfKLHTk9TLAYTFi9";

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
