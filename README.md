# Amazon Deep Link Generator

A personal tool to generate "deep links" for Amazon products. These links, when clicked on mobile devices (via generic social media browsers), attempt to open the Amazon App directly, preserving your affiliate tag.

## How it works

1. **Paste**: Enter your Amazon Affiliate link (full link).
2. **Generate**: The app extracts the ASIN and your Tag.
3. **Share**: Copy the generated link (e.g., `your-site.com/go?asin=...`) and paste it on Instagram/TikTok/etc.
4. **Click**: When users click, they are redirected to the Amazon App.

## Deployment

To use this on social media, **you must deploy this application to a public HTTPS domain**.

### Deploy on Vercel (Recommended)

1. Push this code to a GitHub repository.
2. Go to [Vercel](https://vercel.com) and import the repository.
3. Deploy.
4. Your deep links will look like: `https://your-project.vercel.app/go?asin=...`

## Technologies

- **Next.js 15 (App Router)**
- **Tailwind-like Styling** (Custom CSS variables & Glassmorphism)
- **TypeScript**

## Customization

- Edit `src/app/globals.css` to change the color scheme.
- Edit `src/app/go/page.tsx` to tweak the redirection logic (timeout durations, fallback behaviors).
