"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ProfileForm } from "@/app/(protected)/profile/edit/ProfileForm";

interface ClassmateForEdit {
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

export function EditProfileModal({
  classmate,
  onClose,
}: {
  classmate: ClassmateForEdit;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-edn-mist">
          <div>
            <p className="text-edn-steel text-xs font-body uppercase tracking-widest">
              Admin · Editar perfil
            </p>
            <h2 className="font-display text-edn-navy text-lg font-bold leading-tight">
              {classmate.fullName ?? "Sem nome"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-edn-gray hover:text-edn-navy rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <ProfileForm
            user={{
              fullName:    classmate.fullName  ?? undefined,
              birthday:    classmate.birthday  ?? undefined,
              phone:       classmate.phone     ?? undefined,
              city:        classmate.city      ?? undefined,
              state:       classmate.state     ?? undefined,
              country:     classmate.country   ?? undefined,
              photoThen:   classmate.photoThen ?? undefined,
              photoNow:    classmate.photoNow  ?? undefined,
              studyPeriods: classmate.studyPeriods,
            }}
            apiEndpoint={`/api/admin/profile/${classmate.id}`}
            onSaved={onClose}
          />
        </div>
      </div>
    </div>
  );
}
