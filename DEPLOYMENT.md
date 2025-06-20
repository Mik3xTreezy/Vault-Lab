# Link-Locker Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables Setup
Copy `env.example` to `.env.local` and fill in all required values:

```bash
cp env.example .env.local
```

### 2. Required Services Setup

#### Clerk Authentication
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Enable the following OAuth providers:
   - Google OAuth
   - Discord OAuth  
   - Apple OAuth (if needed)
4. Copy the publishable key and secret key to your `.env.local`
5. Set redirect URLs:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`

#### Supabase Database
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Run the database migration scripts in this order:
   - `database_setup.sql`
   - `database_migration_publisher_final.sql`
4. Copy the project URL and anon key to your `.env.local`
5. Get the service role key from Settings > API

### 3. Build and Test Locally
```bash
npm install
npm run build
npm run start
```

### 4. Deployment Options

#### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add all environment variables in Netlify dashboard

#### Custom Server
1. Build the application: `npm run build`
2. Start with: `npm run start`
3. Ensure all environment variables are set
4. Use a process manager like PM2 for production

### 5. Domain Configuration
1. Add your custom domain to your hosting provider
2. Update `NEXT_PUBLIC_APP_URL` in environment variables
3. Update Clerk allowed origins and redirect URLs

### 6. Post-Deployment Verification
- [ ] Landing page loads correctly
- [ ] Email sign-in works
- [ ] Social sign-in works (Google, Discord, Apple)
- [ ] Dashboard loads for authenticated users
- [ ] Link creation works
- [ ] Locked links work correctly
- [ ] Analytics are tracking
- [ ] All API endpoints respond correctly

## Troubleshooting

### Social Sign-In Issues
- Verify OAuth providers are enabled in Clerk
- Check redirect URLs match exactly
- Ensure domain is added to allowed origins

### Database Connection Issues
- Verify Supabase connection string
- Check if database migrations ran successfully
- Ensure service role key has correct permissions

### Build Issues
- Run `npm run lint` to check for errors
- Ensure all TypeScript errors are resolved
- Check Next.js configuration

## Security Considerations
- Never commit `.env.local` to version control
- Use strong, unique keys for production
- Enable HTTPS for all production domains
- Regularly update dependencies

## Performance Optimization
- Enable image optimization in Next.js config
- Use CDN for static assets
- Enable gzip compression
- Monitor Core Web Vitals

## Monitoring
- Set up error tracking (Sentry recommended)
- Monitor database performance
- Track user analytics
- Set up uptime monitoring