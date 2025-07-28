import stripe from 'stripe';
import Booking from '../models/Booking.js';

// Test endpoint to check webhook configuration
export const testWebhook = async (req, res) => {
    try {
        console.log('🧪 Testing webhook configuration...');
        
        // Check environment variables
        const hasSecretKey = !!process.env.STRIPE_SECRET_KEY;
        const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
        
        console.log('🔑 Environment check:', {
            hasSecretKey,
            hasWebhookSecret,
            secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) + '...',
            webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 7) + '...',
            nodeEnv: process.env.NODE_ENV
        });
        
        // Test Stripe connection
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        const account = await stripeInstance.accounts.retrieve();
        
        // Get deployment URL
        const deploymentUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : `${req.protocol}://${req.get('host')}`;
        
        res.json({
            success: true,
            message: 'Webhook configuration is valid',
            environment: {
                hasSecretKey,
                hasWebhookSecret,
                stripeAccountId: account.id,
                stripeAccountType: account.type,
                nodeEnv: process.env.NODE_ENV,
                vercelUrl: process.env.VERCEL_URL
            },
            webhookUrl: `${deploymentUrl}/api/stripe`,
            instructions: [
                '1. Update your Stripe webhook endpoint URL to point to your Vercel deployment',
                '2. Make sure the webhook secret matches your Vercel environment variables',
                '3. Test with a payment to see webhook events',
                '4. Check Vercel function logs for webhook processing'
            ]
        });
    } catch (error) {
        console.error('❌ Webhook test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Webhook configuration error',
            error: error.message
        });
    }
}

export const stripeWebhooks = async (request, response) => {
    console.log('🔄 Stripe webhook received');
    console.log('📋 Headers:', {
        'stripe-signature': request.headers['stripe-signature'] ? 'Present' : 'Missing',
        'content-type': request.headers['content-type'],
        'user-agent': request.headers['user-agent']
    });
    
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers['stripe-signature'];
    
    if (!sig) {
        console.error('❌ Missing stripe-signature header');
        return response.status(400).send('Missing stripe-signature header');
    }
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
        return response.status(500).send('Webhook secret not configured');
    }
    
    let event;

    try {
        console.log('🔐 Verifying webhook signature...');
        event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        console.log('✅ Webhook signature verified');
    } catch (error) {
        console.error('❌ Webhook signature verification failed:', error.message);
        return response.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        console.log("📨 Processing Stripe event:", event.type);
        console.log("🆔 Event ID:", event.id);
        
        // Helper to update booking by bookingId
        const updateBookingPaid = async (bookingId, source) => {
            if (!bookingId) return false;
            try {
                const updateResult = await Booking.findByIdAndUpdate(
                    bookingId, 
                    { 
                        isPaid: true, 
                        paymentLink: "",
                        updatedAt: new Date()
                    },
                    { new: true }
                );
                if (updateResult) {
                    console.log(`✅ Booking updated as paid from ${source}:`, bookingId);
                    return true;
                } else {
                    console.error(`❌ Booking not found for update from ${source}:`, bookingId);
                }
            } catch (err) {
                console.error(`❌ Error updating booking from ${source}:`, err);
            }
            return false;
        };

        switch (event.type) {
            case 'payment_intent.succeeded': {
                console.log('💰 Processing payment_intent.succeeded');
                const paymentIntent = event.data.object; 
                console.log("💳 PaymentIntent ID:", paymentIntent.id);
                console.log("💵 Amount:", paymentIntent.amount);
                console.log("💱 Currency:", paymentIntent.currency);
                try {
                    const sessionList = await stripeInstance.checkout.sessions.list({
                        payment_intent: paymentIntent.id,
                    });
                    if (!sessionList.data || sessionList.data.length === 0) {
                        console.error("❌ No sessions found for payment intent", paymentIntent.id);
                        break;
                    }
                    let bookingUpdated = false;
                    for (const session of sessionList.data) {
                        const { bookingId } = session.metadata || {};
                        if (bookingId) {
                            console.log("🎫 Found bookingId in session:", bookingId);
                            const updated = await updateBookingPaid(bookingId, 'payment_intent.succeeded');
                            if (updated) bookingUpdated = true;
                        } else {
                            console.warn("⚠️ No bookingId in session metadata", session.metadata);
                        }
                    }
                    if (!bookingUpdated) {
                        console.error("❌ No booking updated for payment_intent.succeeded");
                    }
                } catch (sessionError) {
                    console.error("❌ Error processing session:", sessionError);
                }
                break;
            }
            case 'checkout.session.completed': {
                console.log('🛒 Processing checkout.session.completed');
                const session = event.data.object;
                console.log("🛒 Session ID:", session.id);
                console.log("📋 Session metadata:", session.metadata);
                const { bookingId } = session.metadata || {};
                if (bookingId) {
                    await updateBookingPaid(bookingId, 'checkout.session.completed');
                } else {
                    console.warn("⚠️ No bookingId in session metadata for checkout.session.completed", session.metadata);
                }
                break;
            }
            default:
                console.log("ℹ️ Unhandled event type:", event.type);
        }
        
        console.log("✅ Webhook processed successfully");
        response.json({ received: true });
    } catch (err) {
        console.error("❌ Webhook processing error:", err);
        console.error("❌ Error stack:", err.stack);
        response.status(500).send("Internal Server Error");
    }
}