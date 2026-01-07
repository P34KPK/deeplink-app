import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const stripeCustomerId = user.publicMetadata?.stripeCustomerId as string;

        if (!stripeCustomerId) {
            return new NextResponse('No active subscription found', { status: 400 });
        }

        const settingsUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const session = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${settingsUrl}/dashboard`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('[STRIPE_PORTAL_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
