
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { priceId, mode = 'subscription' } = await req.json();

        if (!priceId) {
            return new NextResponse('Price ID is required', { status: 400 });
        }

        const settingsUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const cookieStore = await cookies();
        const referrerId = cookieStore.get('deeplink_ref')?.value;

        const session = await stripe.checkout.sessions.create({
            // payment_method_types: ['card'], // Commented out to allow Dashboard configuration
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: mode as 'subscription' | 'payment',
            success_url: `${settingsUrl}/dashboard?success=true`,
            cancel_url: `${settingsUrl}/dashboard?canceled=true`,
            customer_email: user.emailAddresses[0].emailAddress,
            automatic_tax: {
                enabled: true,
            },
            billing_address_collection: 'required', // Required for tax calculation
            customer_update: {
                address: 'auto',
            },
            metadata: {
                userId,
                referrerId: referrerId || null
            },
            subscription_data: mode === 'subscription' ? {
                metadata: {
                    userId,
                    referrerId: referrerId || null
                },
            } : undefined,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('[STRIPE_CHECKOUT_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
