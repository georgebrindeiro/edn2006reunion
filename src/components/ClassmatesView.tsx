"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, GraduationCap, MapPin, Search, X } from "lucide-react";
import { WorldMap } from "./WorldMap";
import { ClassmatesGrid } from "./ClassmatesGrid";
import { SCHOOL_YEAR_START, SCHOOL_YEAR_END } from "@/lib/utils";

export interface FullClassmate {
  id: string;
  fullName: string | null;
  birthday: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  photoThen: string | null;
  photoNow: string | null;
  studyPeriods: { yearStart: number; yearEnd: number }[];
}

function locationKey(city: string | null, country: string | null): string {
  return [city, country].filter(Boolean).join(", ");
}

const ALL_YEARS = Array.from(
  { length: SCHOOL_YEAR_END - SCHOOL_YEAR_START + 1 },
  (_, i) => SCHOOL_YEAR_START + i
);

// Compact dropdown with checkboxes
function FilterDropdown({
  icon,
  label,
  options,
  selected,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  if (options.length === 0) return null;

  const count = selected.size;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-xs font-body px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
          count > 0
            ? "bg-edn-navy text-white"
            : "bg-edn-cloud/70 text-edn-gray hover:bg-edn-cloud"
        }`}
      >
        {icon}
        {label}
        {count > 0 && (
          <span className="bg-white/25 rounded-full px-1.5 py-0 leading-4">{count}</span>
        )}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-lg border border-edn-mist z-30 min-w-[200px] py-1.5">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2.5 px-3.5 py-1.5 hover:bg-edn-cloud/40 cursor-pointer text-xs font-body text-edn-navy"
            >
              <input
                type="checkbox"
                checked={selected.has(opt)}
                onChange={() => onToggle(opt)}
                className="rounded accent-[#1a2744]"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// Year-range picker: select a start and end year; matches anyone whose period overlaps
function PeriodDropdown({
  yearFrom,
  yearTo,
  onYearFromChange,
  onYearToChange,
}: {
  yearFrom: number | null;
  yearTo: number | null;
  onYearFromChange: (y: number | null) => void;
  onYearToChange: (y: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const isActive = yearFrom !== null || yearTo !== null;

  const buttonLabel =
    yearFrom && yearTo
      ? `${yearFrom}–${yearTo}`
      : yearFrom
      ? `desde ${yearFrom}`
      : yearTo
      ? `até ${yearTo}`
      : "Período";

  const selectClass =
    "w-full text-xs font-body border border-edn-mist rounded-lg px-2 py-1.5 mt-1 bg-white focus:outline-none focus:border-edn-steel";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-xs font-body px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
          isActive
            ? "bg-edn-navy text-white"
            : "bg-edn-cloud/70 text-edn-gray hover:bg-edn-cloud"
        }`}
      >
        <GraduationCap size={12} />
        {buttonLabel}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-lg border border-edn-mist z-30 p-3 min-w-[220px]">
          <p className="text-[10px] font-body text-edn-gray uppercase tracking-wider mb-2">
            Estudou na EDN entre…
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-body text-edn-steel">De</label>
              <select
                value={yearFrom ?? ""}
                onChange={(e) =>
                  onYearFromChange(e.target.value ? parseInt(e.target.value) : null)
                }
                className={selectClass}
              >
                <option value="">Qualquer</option>
                {ALL_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-body text-edn-steel">Até</label>
              <select
                value={yearTo ?? ""}
                onChange={(e) =>
                  onYearToChange(e.target.value ? parseInt(e.target.value) : null)
                }
                className={selectClass}
              >
                <option value="">Qualquer</option>
                {ALL_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {isActive && (
            <button
              onClick={() => {
                onYearFromChange(null);
                onYearToChange(null);
              }}
              className="mt-2 text-[10px] text-edn-steel hover:text-edn-navy font-body flex items-center gap-1 transition-colors"
            >
              <X size={10} /> Limpar período
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ClassmatesView({
  classmates,
  isAdmin,
}: {
  classmates: FullClassmate[];
  isAdmin: boolean;
}) {
  const [name, setName] = useState("");
  const [locationFilters, setLocationFilters] = useState<Set<string>>(new Set());
  const [yearFrom, setYearFrom] = useState<number | null>(null);
  const [yearTo, setYearTo] = useState<number | null>(null);

  // Combined "City, Country" strings for the dropdown
  const locations = useMemo(
    () =>
      [
        ...new Set(
          classmates
            .filter((c) => c.city)
            .map((c) => locationKey(c.city, c.country))
        ),
      ].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [classmates]
  );

  function toggleLocation(key: string) {
    setLocationFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q    = name.trim().toLowerCase();
    const from = yearFrom ?? SCHOOL_YEAR_START;
    const to   = yearTo   ?? SCHOOL_YEAR_END;

    return classmates.filter((c) => {
      if (q && !c.fullName?.toLowerCase().includes(q)) return false;

      if (locationFilters.size > 0) {
        if (!locationFilters.has(locationKey(c.city, c.country))) return false;
      }

      if (yearFrom !== null || yearTo !== null) {
        // Overlap: classmate's period overlaps [from, to]
        const match = c.studyPeriods.some(
          (p) => p.yearStart <= to && p.yearEnd >= from
        );
        if (!match) return false;
      }

      return true;
    });
  }, [classmates, name, locationFilters, yearFrom, yearTo]);

  const hasFilters =
    name.trim() !== "" || locationFilters.size > 0 || yearFrom !== null || yearTo !== null;

  return (
    <div className="space-y-4">
      {/* Map — always shows all pins; clicking a pin toggles the location filter */}
      <WorldMap
        classmates={classmates}
        total={classmates.length}
        activeCities={locationFilters}
        onCityToggle={toggleLocation}
      />

      {/* Streamlined filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-edn-gray/40 pointer-events-none"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome..."
            className="pl-7 pr-3 py-1.5 text-xs font-body bg-edn-cloud/70 rounded-full focus:outline-none focus:bg-edn-cloud placeholder:text-edn-gray/40 w-28"
          />
        </div>

        <FilterDropdown
          icon={<MapPin size={12} />}
          label="Cidade"
          options={locations}
          selected={locationFilters}
          onToggle={toggleLocation}
        />

        <PeriodDropdown
          yearFrom={yearFrom}
          yearTo={yearTo}
          onYearFromChange={setYearFrom}
          onYearToChange={setYearTo}
        />

        {hasFilters && (
          <button
            onClick={() => {
              setName("");
              setLocationFilters(new Set());
              setYearFrom(null);
              setYearTo(null);
            }}
            className="flex items-center gap-1 text-xs text-edn-gray/50 hover:text-edn-gray font-body transition-colors"
          >
            <X size={11} /> limpar
          </button>
        )}

        {hasFilters && (
          <span className="text-xs text-edn-steel font-body ml-auto">
            {filtered.length} colega{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {filtered.length > 0 ? (
        <ClassmatesGrid classmates={filtered} isAdmin={isAdmin} />
      ) : (
        <div className="text-center py-12 text-edn-gray font-body text-sm">
          {hasFilters
            ? "Nenhum colega encontrado com esses filtros."
            : "Nenhum colega cadastrado ainda."}
        </div>
      )}
    </div>
  );
}
