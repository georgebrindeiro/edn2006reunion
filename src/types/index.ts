// src/types/index.ts

export type UserRole = "MEMBER" | "ADMIN";

export type MemoryType = "PHOTO" | "VIDEO" | "QUOTE" | "STORY";

export type FoodPreference  = "BARBECUE" | "VEGETARIAN" | "NO_FOOD";
export type DrinkPreference = "CHOPP" | "NON_ALCOHOLIC" | "OWN_DRINKS";

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
  fullName:        string;
  age?:            number;
  foodPreference:  FoodPreference;
  drinkPreference: DrinkPreference;
}

export interface RsvpFormData {
  isAttending:     boolean;
  foodPreference:  FoodPreference;
  drinkPreference: DrinkPreference;
  guestAdults:     GuestInput[];
  guestChildren:   GuestInput[];
  paymentProofUrl?: string;
}

// ─── Event config (edit in constants.ts) ─────────────────────────────────────
export interface EventDetails {
  date:             string;
  time:             string;
  venueName:        string;
  venueAddress:     string;
  venueCity:        string;
  mapsUrl:          string;
  costPerPerson:        number;
  costPerPersonReduced: number; // NO_FOOD + OWN_DRINKS
  costPerChild:         number;
  currency:         string;
  pixKey:           string;
  pixRecipientName: string; // max 25 chars, no accents
  pixCity:          string; // max 15 chars, no accents
  whatsIncluded:    string[];
}
