import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',             // Landing page is public
  '/sign-in(.*)',  // Sign-in page is public
  '/sign-up(.*)',  // Sign-up page is public
  '/locked(.*)',   // Locked links are public
  '/api/lockers(.*)', // Locker API is public for locked links
  '/api/tasks(.*)',   // Tasks API is public for locked links
  '/api/tasks/webhooks(.*)', // Webhook API must be public for advertisers
  '/api/analytics(.*)', // Analytics API is public for locked links
  '/api/dashboard-analytics(.*)', // Dashboard analytics API is public
  '/api/locker-analytics(.*)', // Locker analytics API is public
  '/api/users(.*)', // Users API is public
  '/api/withdrawals(.*)', // Withdrawals API is public
  '/api/geolocation(.*)', // Geolocation API is public
  '/api/device-targeting(.*)', // Device targeting API for admin
  '/api/ip-tracking(.*)', // IP tracking API for revenue validation
  '/api/referrals(.*)', // Referrals API for commission tracking
]);

export const middleware = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
