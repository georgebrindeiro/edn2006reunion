export type MemoryEra =
  | "KINDERGARTEN"
  | "LOWER_SCHOOL"
  | "MIDDLE_SCHOOL"
  | "HIGH_SCHOOL"
  | "ADULT_LIFE";

export const MEMORY_ERAS: {
  value: MemoryEra;
  label: string;
  years: string;
  emoji: string;
}[] = [
  { value: "KINDERGARTEN",  label: "Kindergarten",  years: "1993–1995", emoji: "🌱" },
  { value: "LOWER_SCHOOL",  label: "Lower School",  years: "1995–1999", emoji: "📚" },
  { value: "MIDDLE_SCHOOL", label: "Middle School", years: "1999–2003", emoji: "🏫" },
  { value: "HIGH_SCHOOL",   label: "High School",   years: "2003–2006", emoji: "🎓" },
  { value: "ADULT_LIFE",    label: "Adult Life",    years: "2006+",     emoji: "🌟" },
];

export function eraLabel(era: string | null): string {
  if (!era) return "Sem classificação";
  return MEMORY_ERAS.find((e) => e.value === era)?.label ?? era;
}
