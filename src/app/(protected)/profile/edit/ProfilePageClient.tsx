"use client";

import { useState } from "react";
import { ProfileForm } from "./ProfileForm";
import { MyContributions } from "@/components/MyContributions";

type Tab = "profile" | "contributions";

export function ProfilePageClient({
  user,
  memories,
}: {
  user: any;
  memories: any[];
}) {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="max-w-lg mx-auto">
      {/* Tab bar */}
      <div className="flex border-b border-edn-mist mb-6">
        <button
          onClick={() => setTab("profile")}
          className={`px-5 py-3 text-sm font-body font-medium transition-colors border-b-2 -mb-px ${
            tab === "profile"
              ? "border-edn-navy text-edn-navy"
              : "border-transparent text-edn-gray hover:text-edn-navy"
          }`}
        >
          Meu Perfil
        </button>
        <button
          onClick={() => setTab("contributions")}
          className={`px-5 py-3 text-sm font-body font-medium transition-colors border-b-2 -mb-px ${
            tab === "contributions"
              ? "border-edn-navy text-edn-navy"
              : "border-transparent text-edn-gray hover:text-edn-navy"
          }`}
        >
          Minhas Contribuições
          {memories.length > 0 && (
            <span className="ml-1.5 text-xs bg-edn-cloud text-edn-gray rounded-full px-1.5 py-0 leading-4">
              {memories.length}
            </span>
          )}
        </button>
      </div>

      {tab === "profile" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <ProfileForm user={user} />
        </div>
      )}

      {tab === "contributions" && (
        <MyContributions initialMemories={memories} />
      )}
    </div>
  );
}
