"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { ReferralHandler } from "@/components/referral-handler";
import { Suspense } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <Suspense fallback={null}>
        <ReferralHandler />
      </Suspense>
      {children}
    </ClerkProvider>
  );
} 