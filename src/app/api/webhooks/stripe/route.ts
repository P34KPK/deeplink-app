import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { clerkClient } from '@clerk/nextjs/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
    return new NextResponse('Webhook endpoint is active', { status: 200 });
}

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        if (!session?.metadata?.userId) {
            return new NextResponse('User ID is missing in session metadata', { status: 400 });
        }

        const client = await clerkClient();

        await client.users.updateUserMetadata(session.metadata.userId, {
            publicMetadata: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(
                    (subscription as any).current_period_end * 1000
                ),
            },
        });

        // UPDATE REDIS PLAN (Fix for Dashboard not syncing)
        const { redis } = await import('@/lib/redis');
        if (redis) {
            const planKey = `user:${session.metadata.userId}:plan`;
            await redis.set(planKey, 'pro');
            console.log(`[Stripe Webhook] Upgraded user ${session.metadata.userId} to PRO in Redis`);
        }

        // Track Affiliate Sale
        if (session.metadata.referrerId) {
            const { trackAffiliateSale } = await import('@/lib/analytics');
            await trackAffiliateSale(session.metadata.referrerId, 1.00);
        }
    }

    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as Stripe.Invoice;

        if ((invoice as any).subscription) {
            const subscription = await stripe.subscriptions.retrieve(
                (invoice as any).subscription as string
            );
            // Find user by subscription ID ? 
            // Clerk doesn't allow searching by metadata easily without listUsers loop.
            // Usually, we trust the checkout flow to set it up initially.
            // For renewals, we might need a database to map stripeCustomerId -> userId.
            // Since we don't have a DB, we might skip renewal updates for now, 
            // relying on the initial setup or the user re-logging in to refresh status if we logic check against Stripe API.
        }
    }

    return new NextResponse(null, { status: 200 });
}
