"use client";

import { useEffect } from "react";

export function ActivityPing() {
  useEffect(() => {
    fetch("/api/activity", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
