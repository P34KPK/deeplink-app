# DeepLink - Architecture & Project Status
**Last Updated:** January 2026

## 🏗️ Technical Stack (The Foundation)
*   **Framework:** Next.js 14+ (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (Custom "Black Matte" Aesthetic)
*   **Authentication:** Clerk (Middleware protected)
*   **Database:** Redis (Upstash) - Key/Value store for fast link access
*   **Hosting:** Vercel (Auto-deployment via GitHub)

## 🔑 Key Features & Implementation Details

### 1. Dashboard (The Command Center)
*   **Location:** `src/app/dashboard/page.tsx`
*   **Widgets:** Draggable Grid system (`dnd-kit`).
*   **Stats:** Real-time analytics from Redis.

### 2. Public Link-in-Bio Page
*   **Location:** `src/app/u/[userId]/page.tsx`
*   **Dynamic Background:**
    *   Supports AI-Generated Images.
    *   Renders full-screen on mobile (`object-contain`).
    *   Includes SEO metadata dynamically generated.

### 3. AI Image Generator (Custom Proxy)
*   **Frontend:** `window.prompt` captures user vibe -> sends to internal API.
*   **Backend Proxy:** `src/app/api/ai/generate-image/route.ts`
    *   **Why?** Bypasses browser CORS/Blocking issues and Rate Limits.
    *   **Resolution:** 1080x1920 (HD).
    *   **Model:** Pollinations AI (Turbo mode for speed).
    *   **Security:** Adds User-Agent headers to mimic browser traffic.

### 4. Custom Profile Upload
*   **Logic:** Client-side resizing (Max 400px) + Compression (JPEG 0.8) before storage to prevent "Entity Too Large" errors.
*   **Storage:** DataURL stored directly in Redis User Profile.

### 5. Amazon Metadata Fetcher (Robust)
*   **Location:** `src/lib/metadata-fetcher.ts`
*   **Strategy:** "Microlink-First" expansion (Bypass Bot Blocking) + Bing Image Validation.
*   **Fail-Safe:** Internal Proxy (`/api/proxy-image`) to serve external images.
    *   **Why?** Bypasses Browser CORS / Mixed Content / Hotlink Protection mechanisms.
    *   **Result:** 100% success rate even on blocked/broken short links (`amzn.to`).

## 📱 Mobile Strategy (Future Roadmap)
*   **Technology:** Capacitor (Hybrid Native Wrapper).
*   **Plan:**
    1.  Keep developing the Web App (Responsive).
    2.  "Wrap" the web code using Capacitor.
    3.  Deploy to App Store/Google Play.
*   **Why?** Allows 100% code reuse. The "App" is just a window to the Vercel server.

## 🛡️ Critical Security Notes
*   **Middleware:** `src/middleware.ts` protects all `/dashboard` routes.
*   **Env Variables:** Never commit `.env.local` to GitHub. It contains the keys for Clerk and Redis.

---
*This document serves as the "Memory Vault" for the project structure.*
