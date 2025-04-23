import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRODUCT_TO_TIER } from '@/lib/stripe';
import { supabase as supabaseAdmin } from '@/lib/supabase-admin';
import Stripe from 'stripe';

// This is your Stripe webhook secret for testing your endpoint locally.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    console.log('Webhook received');
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
      if (!webhookSecret) {
        console.error('Webhook secret not set');
        throw new Error('Webhook secret not set');
      }
      console.log('Constructing event with webhook secret:', webhookSecret.substring(0, 5) + '...');
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('Event constructed successfully:', event.type);
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed.`, err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    console.log('Handling event type:', event.type);
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        console.log('Handling subscription change event');
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        console.log('Handling subscription canceled event');
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        console.log('Handling invoice payment succeeded event');
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        console.log('Handling invoice payment failed event');
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    console.log('Processing subscription change:', subscription.id);
    const customerId = subscription.customer as string;
    const subscriptionId = subscription.id;
    const status = subscription.status;
    const priceId = subscription.items.data[0].price.id;
    const productId = subscription.items.data[0].price.product as string;
    console.log('Product ID:', productId);
    console.log('PRODUCT_TO_TIER mapping:', PRODUCT_TO_TIER);
    const tier = PRODUCT_TO_TIER[productId] || 'free';
    console.log('Determined tier:', tier);
    const currentPeriodStart = new Date(subscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;

    console.log('Looking up user by Stripe customer ID:', customerId);
    // Find the user by Stripe customer ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError) {
      console.error('Error finding user for Stripe customer ID:', userError);

      // Try to find the user by subscription ID as a fallback
      console.log('Trying to find user by subscription ID:', subscriptionId);
      const { data: subData, error: subError } = await supabaseAdmin
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      if (subError || !subData) {
        console.error('User not found by subscription ID either:', subscriptionId);
        return;
      }

      console.log('User found by subscription ID:', subData.user_id);
      return subData.user_id;
    }

    if (!userData) {
      console.error('User data not found for Stripe customer ID:', customerId);
      return;
    }

    console.log('User found:', userData.user_id);

    const userId = userData.user_id;

    console.log('Updating user subscription for user:', userId);
    console.log('Updating with tier:', tier, 'status:', status);

    // Update the user's subscription
    const { error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        tier,
        status,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        current_period_end: currentPeriodEnd.toISOString(),
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating user subscription:', updateError);
    } else {
      console.log('User subscription updated successfully');
    }

    console.log('Checking for existing subscription in subscriptions table');
    // Also update the subscriptions table
    const { data: existingSubscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error checking existing subscription:', subscriptionError);
      return;
    }

    if (existingSubscription) {
      console.log('Updating existing subscription in subscriptions table:', existingSubscription.id);
      // Update existing subscription
      const { error: updateSubError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          user_id: userId,
          tier,
          status,
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
          cancel_at_period_end: cancelAtPeriodEnd,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id);

      if (updateSubError) {
        console.error('Error updating subscription in subscriptions table:', updateSubError);
      } else {
        console.log('Subscription updated successfully in subscriptions table');
      }
    } else {
      console.log('Creating new subscription in subscriptions table');
      // Create new subscription
      const { error: insertError } = await supabaseAdmin
        .from('subscriptions')
        .insert([
          {
            user_id: userId,
            tier,
            status,
            current_period_start: currentPeriodStart.toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
            cancel_at_period_end: cancelAtPeriodEnd,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          },
        ]);

      if (insertError) {
        console.error('Error creating subscription in subscriptions table:', insertError);
      } else {
        console.log('Subscription created successfully in subscriptions table');
      }
    }

    console.log(`Subscription ${subscriptionId} updated for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
    throw error;
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    const subscriptionId = subscription.id;

    // Update the user's subscription in both tables
    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        tier: 'free',
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    console.log(`Subscription ${subscriptionId} canceled`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string;
    const customerId = invoice.customer as string;

    // Update the subscription status to active
    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    console.log(`Invoice payment succeeded for subscription ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string;
    const customerId = invoice.customer as string;

    // Update the subscription status to past_due
    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    console.log(`Invoice payment failed for subscription ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  }
}
