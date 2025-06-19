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
    console.log('[ANALYTICS] Sending event to API:', {
      locker_id,
      event_type,
      user_id: user_id || 'anonymous',
      task_id,
      duration,
      extra,
    });

    const response = await fetch("/api/analytics", {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ANALYTICS] API response not ok:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(`Analytics API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[ANALYTICS] API response success:', result);
    return result;
  } catch (e) {
    console.error('[ANALYTICS] Failed to track analytics event:', e);
    throw e; // Re-throw so the caller can handle it
  }
} 