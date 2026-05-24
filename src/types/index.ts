// src/types/index.ts

export type UserRole = "MEMBER" | "ADMIN";

export type MemoryType = "PHOTO" | "VIDEO" | "QUOTE" | "STORY";

export type DrinkPreference = "DRAFT_BEER" | "SPIRITS" | "BOTH";

// ─── Profile ──────────────────────────────────────────────────────────────────
export interface ProfileFormData {
  fullName:    string;
  birthday:    string; // ISO date string
  phone:       string;
  email:       string;
  city:        string;
  state:       string;
  country:     string;
  studyPeriods: StudyPeriodInput[];
  photoThen?:  string; // URL
  photoNow?:   string; // URL
}

export interface StudyPeriodInput {
  yearStart: number;
  yearEnd:   number;
}

// ─── RSVP ─────────────────────────────────────────────────────────────────────
export interface GuestInput {
  fullName: string;
  age?:     number;
}

export interface RsvpFormData {
  isAttending:     boolean;
  guestAdults:     GuestInput[];
  guestChildren:   GuestInput[];
  joinsBarbecue:   boolean;
  drinksAlcohol:   boolean;
  drinkPreference?: DrinkPreference;
  paymentRef?:     string;
}

// ─── Event config (edit in constants.ts) ─────────────────────────────────────
export interface EventDetails {
  date:          string;
  time:          string;
  venueName:     string;
  venueAddress:  string;
  venueCity:     string;
  mapsUrl:       string;
  costPerPerson: number;
  currency:      string;
  paymentInfo:   string;
  whatsIncluded: string[];
}
