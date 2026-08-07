const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../config/email');

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Public
router.post('/create-intent', async (req, res, next) => {
    try {
        const { orderId, amount } = req.body;

        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects amount in cents
            currency: 'usd',
            metadata: {
                orderId: order.orderId,
                orderDbId: order._id.toString()
            }
        });

        // Create payment record
        const payment = await Payment.create({
            order: order._id,
            amount,
            paymentMethod: 'stripe',
            stripePaymentIntentId: paymentIntent.id,
            status: 'pending'
        });

        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentId: payment._id
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Public
router.post('/confirm', async (req, res, next) => {
    try {
        const { paymentIntentId } = req.body;

        // Retrieve the payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            // Update payment record
            const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
            if (payment) {
                payment.status = 'succeeded';
                payment.stripeChargeId = paymentIntent.charges.data[0]?.id;
                await payment.save();

                // Update order
                const order = await Order.findById(payment.order);
                if (order) {
                    order.isPaid = true;
                    order.paidAt = Date.now();
                    order.status = 'processing';
                    order.paymentInfo = {
                        method: 'stripe',
                        transactionId: payment.transactionId
                    };
                    await order.save();

                    // Send payment success email
                    try {
                        await sendEmail({
                            to: order.customerInfo.email,
                            subject: 'تأكيد الدفع - خدمات التقنية',
                            html: emailTemplates.paymentSuccess({
                                amount: payment.amount,
                                transactionId: payment.transactionId
                            })
                        });
                    } catch (emailError) {
                        console.error('Email error:', emailError);
                    }
                }
            }

            res.status(200).json({
                success: true,
                message: 'تم الدفع بنجاح'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'فشل الدفع'
            });
        }
    } catch (error) {
        next(error);
    }
});

// @desc    Get payment by order ID
// @route   GET /api/payments/order/:orderId
// @access  Private
router.get('/order/:orderId', protect, async (req, res, next) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        const payment = await Payment.findOne({ order: order._id });

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('💰 Payment succeeded:', paymentIntent.id);
            // Update payment and order status
            break;
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('❌ Payment failed:', failedPayment.id);
            // Update payment status to failed
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

// @desc    Refund payment
// @route   POST /api/payments/:id/refund
// @access  Private/Admin
router.post('/:id/refund', protect, require('../middleware/auth').authorize('admin'), async (req, res, next) => {
    try {
        const { amount } = req.body;
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'الدفع غير موجود'
            });
        }

        if (payment.status !== 'succeeded') {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن استرداد هذا الدفع'
            });
        }

        // Create refund in Stripe
        const refund = await stripe.refunds.create({
            payment_intent: payment.stripePaymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined
        });

        // Update payment record
        payment.status = 'refunded';
        payment.refundedAmount = amount || payment.amount;
        payment.refundedAt = Date.now();
        await payment.save();

        // Update order
        const order = await Order.findById(payment.order);
        if (order) {
            order.isPaid = false;
            order.status = 'cancelled';
            await order.save();
        }

        res.status(200).json({
            success: true,
            message: 'تم الاسترداد بنجاح',
            data: payment
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
