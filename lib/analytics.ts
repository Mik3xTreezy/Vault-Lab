export async function trackLockerEvent({
  locker_id,
  event_type,
  user_id,
  task_index,
  duration,
  extra,
}: {
  locker_id: string;
  event_type: string;
  user_id?: string | null;
  task_index?: number | null;
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
        task_index,
        duration,
        extra,
      }),
    });
  } catch (e) {
    // Optionally log or ignore errors
    console.error("Failed to track analytics event", e);
  }
} 