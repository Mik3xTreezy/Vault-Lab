"use client"

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export function ReferralHandler() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const referralCode = searchParams.get('ref');
    if (!referralCode) return;

    // Check if we've already processed this referral to avoid duplicates
    const processedKey = `referral_processed_${user.id}`;
    if (localStorage.getItem(processedKey)) return;

    // Register the referral
    const registerReferral = async () => {
      try {
        const response = await fetch('/api/referrals/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ referralCode }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Referral registered successfully:', data);
          
          // Mark as processed to avoid duplicates
          localStorage.setItem(processedKey, 'true');
          
          // Optional: Show a success message to the user
          // You could add a toast notification here
        } else {
          const error = await response.json();
          console.log('Referral registration failed:', error.error);
          // Don't show error to user unless it's important
        }
      } catch (error) {
        console.error('Error registering referral:', error);
      }
    };

    // Add a small delay to ensure the user is fully created
    const timeout = setTimeout(() => {
      registerReferral();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isLoaded, user, searchParams]);

  // This component doesn't render anything
  return null;
} 