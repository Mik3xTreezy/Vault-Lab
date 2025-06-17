// Bulk sync Clerk users to Supabase users table
// Usage: node clerk-to-supabase-sync.js


require('dotenv').config();

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CLERK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set CLERK_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  process.exit(1);
}

async function fetchAllClerkUsers() {
  let users = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetch(`https://api.clerk.dev/v1/users?page=${page}&limit=100`, {
      headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
    });
    if (!res.ok) throw new Error(`Failed to fetch Clerk users: ${res.status}`);
    const data = await res.json();
    users = users.concat(data);
    totalPages = parseInt(res.headers.get('x-total-pages') || '1', 10);
    page++;
  } while (page <= totalPages);
  return users;
}

async function fetchSupabaseUserIds() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=not.is.null`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch Supabase users');
  const data = await res.json();
  return new Set(data.map(u => u.id));
}

async function insertUserToSupabase(user) {
  const userData = {
    id: user.id,
    email: user.email_addresses?.[0]?.email_address || '',
    full_name: user.full_name || '',
    balance: 0,
    status: 'Active',
    joined: user.created_at ? new Date(user.created_at).toISOString() : new Date().toISOString(),
    last_login: user.last_sign_in_at ? new Date(user.last_sign_in_at).toISOString() : null,
    role: user.public_metadata?.role || 'user',
    lockers: 0,
    country: user.public_metadata?.country || '',
    referral_code: user.public_metadata?.referral_code || '',
    referred_by: user.public_metadata?.referred_by || '',
    notes: user.public_metadata?.notes || '',
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify([userData]),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to insert user ${user.id}: ${err}`);
  }
}

(async () => {
  try {
    console.log('Fetching Clerk users...');
    const clerkUsers = await fetchAllClerkUsers();
    console.log(`Fetched ${clerkUsers.length} users from Clerk.`);
    console.log('Fetching Supabase user IDs...');
    const supabaseUserIds = await fetchSupabaseUserIds();
    let inserted = 0;
    for (const user of clerkUsers) {
      if (!supabaseUserIds.has(user.id)) {
        await insertUserToSupabase(user);
        inserted++;
        console.log(`Inserted user: ${user.id} (${user.email_addresses?.[0]?.email_address})`);
      }
    }
    console.log(`Sync complete. Inserted ${inserted} new users.`);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
})(); 