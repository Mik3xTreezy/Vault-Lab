"use client";
import { ClerkProvider, useUser } from "@clerk/nextjs";
import { useEffect } from "react";

function UserSyncer() {
  const { user, isSignedIn, isLoaded } = useUser();
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    // Prepare user data for Supabase
    const userData = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      full_name: user.fullName || "",
      balance: 0, // Default, or fetch from Supabase if you want to preserve
      status: "Active",
      joined: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      last_login: new Date().toISOString(),
      role: user.publicMetadata?.role || "user",
      lockers: 0, // Default, or fetch if you want to preserve
      country: user.publicMetadata?.country || "",
      referral_code: user.publicMetadata?.referral_code || "",
      referred_by: user.publicMetadata?.referred_by || "",
      notes: user.publicMetadata?.notes || "",
    };
    // Check if user exists, then insert if not
    fetch(`/api/users?id=${user.id}`)
      .then(res => res.json())
      .then(existing => {
        if (!existing || existing.error || (Array.isArray(existing) && existing.length === 0)) {
          fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          });
        }
      });
  }, [isLoaded, isSignedIn, user]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <ClerkProvider><UserSyncer />{children}</ClerkProvider>;
} 