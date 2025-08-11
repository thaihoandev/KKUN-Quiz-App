// src/hooks/useCurrentUser.ts
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export const useCurrentUser = (opts?: { revalidate?: "always" | "idle" | "never" }) => {
  const user = useAuthStore(s => s.user);
  const refreshMe = useAuthStore(s => s.refreshMe);
  const refreshMeIfStale = useAuthStore(s => s.refreshMeIfStale);

  useEffect(() => {
    if (opts?.revalidate === "always") refreshMe();
    else if (opts?.revalidate !== "never") refreshMeIfStale();
  }, [opts?.revalidate, refreshMe, refreshMeIfStale]);

  return user;
};
