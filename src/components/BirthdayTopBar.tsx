"use client";

import { Fragment, useState } from "react";
import { Gift } from "lucide-react";
import { ClassmateDetailModal } from "./ClassmateDetailModal";

interface BirthdayClassmate {
  id: string;
  fullName: string | null;
  birthday: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  photoThen: string | null;
  photoNow: string | null;
  studyPeriods: { yearStart: number; yearEnd: number }[];
}

function getFirstName(fullName: string | null): string {
  if (!fullName) return "";
  return fullName.split(" ")[0];
}

export function BirthdayTopBar({ classmates }: { classmates: BirthdayClassmate[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (classmates.length === 0) return null;

  return (
    <>
      <div className="bg-amber-50 border-b border-amber-200 py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 flex-wrap text-sm font-body text-amber-900">
          <Gift size={15} className="text-amber-500 shrink-0" />
          <span>
            {classmates.map((c, i) => (
              <Fragment key={c.id}>
                {i > 0 && i < classmates.length - 1 && ", "}
                {i > 0 && i === classmates.length - 1 && " e "}
                <button
                  onClick={() => setSelectedIndex(i)}
                  className="font-semibold underline underline-offset-2 decoration-amber-400 hover:text-amber-700 transition-colors"
                >
                  {getFirstName(c.fullName)}
                </button>
              </Fragment>
            ))}
            {" "}
            {classmates.length === 1 ? "está fazendo" : "estão fazendo"} aniversário essa semana!
          </span>
        </div>
      </div>

      {selectedIndex !== null && (
        <ClassmateDetailModal
          classmates={classmates}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}
