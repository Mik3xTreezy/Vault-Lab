"use client";
import { useState, useEffect, use } from "react";
import Script from "next/script";
import dynamic from "next/dynamic";

const LinkLocker = dynamic(() => import("../link-locker"), { ssr: false });

export default function LockedLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [locker, setLocker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLocker() {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/lockers/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Locker not found");
        setLocker(null);
      } else {
        setLocker(data);
      }
      setLoading(false);
    }
    fetchLocker();
  }, [id]);

  // Set page title when locker data is loaded
  useEffect(() => {
    if (locker?.title) {
      document.title = `${locker.title} - VaultLab`;
    } else if (error) {
      document.title = "Content Not Found - VaultLab";
    } else {
      document.title = "Loading Content - VaultLab";
    }
  }, [locker, error]);

  if (loading) return <div className="text-center mt-20 text-white">Loading...</div>;
  if (error) return <div className="text-center mt-20 text-red-400">{error}</div>;
  if (!locker) return null;

  return (
    <>
      <Script 
        src="//pl15868784.profitableratecpm.com/f6/3d/ac/f63dac670d8a31c91e16e3ed9f84503b.js"
        strategy="afterInteractive"
      />
      <LinkLocker 
        lockerId={id} 
        title={locker.title} 
        destinationUrl={locker.destination_url}
        taskType={locker.task_types || locker.task_type || "adult"}
      />
    </>
  );
} 