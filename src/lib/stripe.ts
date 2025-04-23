import Stripe from 'stripe';

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil', // Use the latest API version
});

// Define subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  AI: 'ai',
};

// Define product IDs
export const PRODUCT_IDS = {
  PREMIUM: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRODUCT_ID || '',
  AI: process.env.NEXT_PUBLIC_STRIPE_AI_PRODUCT_ID || '',
};

// Define price IDs
export const PRICE_IDS = {
  PREMIUM: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || '',
  AI: process.env.NEXT_PUBLIC_STRIPE_AI_PRICE_ID || '',
};

// Map product IDs to subscription tiers
export const PRODUCT_TO_TIER: Record<string, string> = {
  [PRODUCT_IDS.PREMIUM]: SUBSCRIPTION_TIERS.PREMIUM,
  [PRODUCT_IDS.AI]: SUBSCRIPTION_TIERS.AI,
};

// Log the product ID mappings for debugging
console.log('PRODUCT_IDS:', PRODUCT_IDS);
console.log('PRODUCT_TO_TIER mapping:', PRODUCT_TO_TIER);

// Map price IDs to subscription tiers
export const PRICE_TO_TIER: Record<string, string> = {
  [PRICE_IDS.PREMIUM]: SUBSCRIPTION_TIERS.PREMIUM,
  [PRICE_IDS.AI]: SUBSCRIPTION_TIERS.AI,
};

// Create a checkout session
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Create a customer portal session
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
}

// Create a Stripe customer
export async function createCustomer({
  email,
  name,
  metadata,
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });

    return { customerId: customer.id };
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

// Get a customer by ID
export async function getCustomer(customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Error retrieving customer:', error);
    throw error;
  }
}

// Get a subscription by ID
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

// Update a subscription
export async function updateSubscription({
  subscriptionId,
  priceId,
}: {
  subscriptionId: string;
  priceId: string;
}) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Update the subscription with the new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
    });

    return updatedSubscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}
