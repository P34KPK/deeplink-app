import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing. Please set it in your .env file.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia', // Use the latest API version or the one matching your account
    typescript: true,
});
