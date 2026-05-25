"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
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

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-body font-medium text-edn-gray uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.has(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={`text-xs font-body px-3 py-1 rounded-full border transition-colors ${
                active
                  ? "bg-edn-navy text-white border-edn-navy"
                  : "bg-white text-edn-gray border-edn-mist hover:border-edn-steel"
              }`}
            >
              {opt}
              {active && <span className="ml-1 opacity-70">×</span>}
            </button>
          );
        })}
      </div>
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

  function toggleSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = name.trim().toLowerCase();
    return classmates.filter((c) => {
      if (q && !c.fullName?.toLowerCase().includes(q)) return false;
      if (locationFilters.size > 0 && (!c.city || !locationFilters.has(c.city))) return false;
      if (yearFilters.size > 0) {
        const match = c.studyPeriods.some((p) =>
          yearFilters.has(`${p.yearStart}–${p.yearEnd}`)
        );
        if (!match) return false;
      }
      return true;
    });
  }, [classmates, name, locationFilters, yearFilters]);

  const hasFilters = name.trim() !== "" || locationFilters.size > 0 || yearFilters.size > 0;

  function clearFilters() {
    setName("");
    setLocationFilters(new Set());
    setYearFilters(new Set());
  }

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        {/* Name search */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-edn-gray/50 pointer-events-none"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Buscar pelo nome..."
            className="w-full pl-9 pr-4 py-2.5 text-sm font-body border border-edn-mist rounded-lg focus:outline-none focus:border-edn-steel placeholder:text-edn-gray/40"
          />
        </div>

        <ChipGroup
          label="Cidade"
          options={cities}
          selected={locationFilters}
          onToggle={(v) => toggleSet(setLocationFilters, v)}
        />

        {yearRanges.length > 1 && (
          <ChipGroup
            label="Período na EDN"
            options={yearRanges}
            selected={yearFilters}
            onToggle={(v) => toggleSet(setYearFilters, v)}
          />
        )}

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-edn-steel hover:text-edn-navy font-body transition-colors"
          >
            <X size={11} /> Limpar filtros
          </button>
        )}
      </div>

      {/* World map — shows filtered classmates */}
      <section>
        <h2 className="font-body font-semibold text-edn-navy text-sm mb-3">
          Onde estão agora
        </h2>
        <WorldMap classmates={filtered} total={classmates.length} />
      </section>

      {/* Cards grid */}
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
