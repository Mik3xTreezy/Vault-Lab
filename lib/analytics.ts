export async function trackLockerEvent({
  locker_id,
  event_type,
  user_id,
  task_id,
  duration,
  extra,
}: {
  locker_id: string;
  event_type: string;
  user_id?: string | null;
  task_id?: string | null;
  duration?: number | null;
  extra?: any;
}) {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locker_id,
        event_type,
        user_id,
        task_id,
        duration,
        extra,
      }),
    });
  } catch (e) {
    // Optionally log or ignore errors
    console.error("Failed to track analytics event", e);
  }
} 