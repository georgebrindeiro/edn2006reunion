"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, GraduationCap, MapPin, Search, X } from "lucide-react";
import { WorldMap } from "./WorldMap";
import { ClassmatesGrid } from "./ClassmatesGrid";

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
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-lg border border-edn-mist z-30 min-w-[180px] py-1.5">
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

export function ClassmatesView({
  classmates,
  isAdmin,
}: {
  classmates: FullClassmate[];
  isAdmin: boolean;
}) {
  const [name, setName] = useState("");
  const [locationFilters, setLocationFilters] = useState<Set<string>>(new Set());
  const [yearFilters, setYearFilters] = useState<Set<string>>(new Set());

  const cities = useMemo(
    () =>
      [...new Set(classmates.map((c) => c.city).filter((c): c is string => !!c))].sort(
        (a, b) => a.localeCompare(b, "pt-BR")
      ),
    [classmates]
  );

  const yearRanges = useMemo(
    () =>
      [
        ...new Set(
          classmates.flatMap((c) =>
            c.studyPeriods.map((p) => `${p.yearStart}–${p.yearEnd}`)
          )
        ),
      ].sort(),
    [classmates]
  );

  function toggleLocation(city: string) {
    setLocationFilters((prev) => {
      const next = new Set(prev);
      if (next.has(city)) next.delete(city);
      else next.add(city);
      return next;
    });
  }

  function toggleYear(yr: string) {
    setYearFilters((prev) => {
      const next = new Set(prev);
      if (next.has(yr)) next.delete(yr);
      else next.add(yr);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = name.trim().toLowerCase();
    return classmates.filter((c) => {
      if (q && !c.fullName?.toLowerCase().includes(q)) return false;
      if (locationFilters.size > 0 && (!c.city || !locationFilters.has(c.city))) return false;
      if (yearFilters.size > 0) {
        if (!c.studyPeriods.some((p) => yearFilters.has(`${p.yearStart}–${p.yearEnd}`))) return false;
      }
      return true;
    });
  }, [classmates, name, locationFilters, yearFilters]);

  const hasFilters = name.trim() !== "" || locationFilters.size > 0 || yearFilters.size > 0;

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
        {/* Name search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-edn-gray/40 pointer-events-none" />
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
          options={cities}
          selected={locationFilters}
          onToggle={toggleLocation}
        />

        {yearRanges.length > 1 && (
          <FilterDropdown
            icon={<GraduationCap size={12} />}
            label="Período"
            options={yearRanges}
            selected={yearFilters}
            onToggle={toggleYear}
          />
        )}

        {hasFilters && (
          <button
            onClick={() => {
              setName("");
              setLocationFilters(new Set());
              setYearFilters(new Set());
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

      {/* Cards */}
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
