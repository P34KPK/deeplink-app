import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
    // 🛡️ Rate Limit: 10 requests per minute
    const limiter = await rateLimit(req, { limit: 10, windowMs: 60 * 1000 });
    if (!limiter.success) {
        return new NextResponse('Too Many Requests', { status: 429 });
    }

    try {
        const { product, context, type } = await req.json();

        // Mode: BIO GENERATOR
        if (type === 'bio') {
            const prompt = `Write a short, engaging social media bio (max 150 chars) for an influencer profile.
            Keywords/Vibe: ${product || 'Lifestyle, Tech, Deals'}.
            Context: ${context || 'General'}.
            Include 1-2 emojis. 
            Output JUST the bio text.`;

            // Reuse logic for fetching (Pollinations preferred for free tier)
            try {
                const safePrompt = encodeURIComponent(prompt);
                const res = await fetch(`https://text.pollinations.ai/${safePrompt}`);
                const text = await res.text();
                return NextResponse.json({ result: text.trim() });
            } catch (e) {
                return NextResponse.json({ result: "Welcome to my curated shop! 🛍️✨ #Deals" });
            }
        }

        // Mode: CAPTION GENERATOR (Default)
        if (!product) {
            return new NextResponse('Product name is required', { status: 400 });
        }

        const prompt = `Write 3 catchy, viral social media captions for a product called "${product}". 
        Context: ${context || 'General promotion'}. 
        Include emojis and hashtags. 
        Format: Just the captions, separated by double newlines.`;

        // Helper for timeout
        const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        };

        // 1. Try OpenAI if Key exists
        if (process.env.OPENAI_API_KEY) {
            try {
                const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.7
                    })
                });
                const data = await res.json();
                if (data.choices?.[0]?.message?.content) {
                    const captions = data.choices[0].message.content.split('\n\n').filter((c: string) => c.length > 10);
                    return NextResponse.json({ captions });
                }
            } catch (error) {
                console.error('OpenAI Error/Timeout:', error);
            }
        }

        // 2. Fallback to Pollinations.ai (Free)
        try {
            const safePrompt = encodeURIComponent(prompt + " Return valid JSON array of strings.");
            const res = await fetchWithTimeout(`https://text.pollinations.ai/${safePrompt}`);
            const text = await res.text();

            // Clean up the response
            const captions = text.split('\n').filter(line => line.trim().length > 10).slice(0, 3);

            // Basic validation
            if (captions.length > 0 && !text.includes('Error')) {
                return NextResponse.json({ captions });
            }
        } catch (error) {
            console.error('Pollinations Error/Timeout:', error);
        }

        // 3. Last Resort Fallback (Mock) if everything fails (offline/error)
        const mockCaptions = [
            `🔥 Check out ${product}! It's absolutely amazing. #MustHave`,
            `Obsessed with this ${product}. You need to try it! 🚀 #Viral`,
            `Stop scrolling and look at ${product}. Best purchase ever. ✨ #AmazonFinds`
        ];
        return NextResponse.json({ captions: mockCaptions, source: 'fallback' });

    } catch (error) {
        return new NextResponse(JSON.stringify({ error: 'Internal Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
