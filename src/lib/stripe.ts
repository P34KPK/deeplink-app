import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || ('sk_test_' + 'nMzBK13c4v6cOmOiE78AP4tm'), {
    apiVersion: '2025-12-15.clover', // Use the latest API version or the one matching your account
    typescript: true,
});
