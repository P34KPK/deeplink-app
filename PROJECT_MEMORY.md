# DeepLinkrs Project Memory & Context

## Project Overview
**Name**: DeepLinkrs
**Goal**: #1 Amazon Deep Linking Tool for Influencers. Allows creating "deep links" that open directly in the Amazon App to maximize affiliate commissions.
**Core Features**:
- Deep Linking (App opening logic)
- Link in Bio pages for influencers
- Admin Dashboard (Analytics, User management)
- Monetization (Stripe integration, Pro plans)

## Infrastructure & Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (Custom "Monolook" aesthetic - Black/White/Grayscale)
- **Database**: Upstash Redis (Key-value store for profiles, links, stats)
- **Auth**: Clerk
- **Hosting/Deployment**: Vercel (Connected via GitHub)
- **Repository**: GitHub (P34KPK/deeplink-app)

## Key Design Rules
- **Aesthetic**: "MONO" / Brutalist. High contrast, sharp edges, no gradients, no shadows. Premium feel.
- **Theme Logic**:
    - **Guests/Logged Out**: FORCED Light Mode (White). Clean, trustworthy landing page.
    - **Users/Logged In**: Custom preference (Light, Dark, System). Persisted to user profile in Redis.
    - **Sync**: Theme preference syncs across devices via `ThemeSync` component.

## Recent Major Implementations
- **Theme System Refactor**: Moved from simple toggle to robust 3-option system (Light/Dark/System). Implemented guest restrictions. (Jan 2026)
- **Admin Dashboard**: Added detailed user stats, "Login as User" capability.
- **Link in Bio**: Custom pages for influencers with analytics.

## Important Commands
- `npm run dev`: Start local server
- `git push`: Triggers Vercel deployment automatically

## Known "Do Not Forget" Items
- **Deployment**: We are FULLY set up on Vercel with GitHub integration. No manual deployment needed, just push.
- **Credentials**: (Note: Do not store real secrets here, but remember we use specific test accounts like `peakafeller`).
- **User Constraints**: Focus on "Wowing" the user with design. Avoid generic "bootstrappy" looks.

## Interaction Rules
- **User Title**: ALWAYS address the user as **"Maitre"** (Master). This is a strict requirement.
- **Tone**: Professional, loyal, efficient, and aesthetic-focused.

*This file serves as a persistent context anchor for the AI assistant.*
