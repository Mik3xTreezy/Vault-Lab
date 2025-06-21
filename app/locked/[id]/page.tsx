"use client";
import { useState, useEffect, use } from "react";
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
    <LinkLocker 
      lockerId={id} 
      title={locker.title} 
      destinationUrl={locker.destination_url}
      taskType={locker.task_type}
    />
  );
} 