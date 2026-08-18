// Stripe payment integration.
// Only two payment options are supported store-wide: Cash on Delivery (cod)
// and card payments through Stripe Checkout. No JazzCash / EasyPaisa.
const Order = require("../models/Order");
const Product = require("../models/Product");
const { getStripe } = require("../lib/stripe");

const SHIPPING_THRESHOLD = 6000;
const FLAT_SHIPPING = 250;

/**
 * POST /api/payments/checkout
 * Public (guests allowed). Creates the order up-front (paymentStatus: pending),
 * decrements stock, then redirects the customer to a Stripe Checkout Session.
 * The webhook later marks the order as paid.
 */
exports.createCheckoutSession = async (req, res, next) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({
        message: "Stripe is not configured yet. Please add STRIPE_SECRET_KEY to the server .env.",
      });
    }
    const stripe = getStripe();

    const { items, customer, successUrl, cancelUrl } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty." });
    }
    if (!customer?.name || !customer?.address || !customer?.phone || !customer?.email) {
      return res.status(400).json({ message: "Please provide all delivery details." });
    }

    // Snapshot product details server-side (never trust client prices).
    const productIds = [...new Set(items.map((i) => i.product))];
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const orderItems = items.map((it) => {
      const product = productMap.get(String(it.product));
      if (!product) {
        const err = new Error("One of the products in your cart is no longer available.");
        err.statusCode = 400;
        throw err;
      }
      if (product.stock < it.quantity) {
        const err = new Error(`Only ${product.stock} in stock for "${product.name}".`);
        err.statusCode = 409;
        throw err;
      }
      return {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: it.quantity,
        size: it.size || "",
        image: product.images[0] || "",
      };
    });

    const subtotal = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const shipping = subtotal >= SHIPPING_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIPPING;

    // Create the order first so the webhook has something to reconcile.
    const order = await Order.create({
      user: req.user ? req.user._id : null,
      items: orderItems,
      customer,
      paymentMethod: "stripe",
      paymentStatus: "pending",
      subtotal,
      shipping,
      total: subtotal + shipping,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: orderItems.map((it) => ({
        price_data: {
          currency: "pkr",
          product_data: { name: `${it.name}${it.size ? ` (${it.size})` : ""}` },
          unit_amount: Math.round(it.price * 100),
        },
        quantity: it.quantity,
      })),
      // Metadata lets the webhook find and mark this order as paid.
      metadata: { orderId: String(order._id) },
      success_url: successUrl || `${process.env.CLIENT_ORIGIN}/checkout?payment=success`,
      cancel_url: cancelUrl || `${process.env.CLIENT_ORIGIN}/checkout?payment=cancelled`,
    });

    // Store the session id on the order, then hand the hosted URL to the client.
    order.stripeSessionId = session.id;
    await order.save();

    // Stock was reserved at order creation; only the webhook marks it paid.
    await Promise.all(
      orderItems.map((it) =>
        Product.findByIdAndUpdate(it.product, { $inc: { stock: -it.quantity } })
      )
    );

    res.json({ url: session.url, orderId: order._id });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/payments/webhook
 * Public. Receives Stripe events and marks orders as paid.
 * Requires the raw body (wired up in index.js) and STRIPE_WEBHOOK_SECRET.
 */
exports.webhook = async (req, res, next) => {
  try {
    const stripe = getStripe();
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId || session.client_reference_id;
        if (orderId) {
          await Order.findByIdAndUpdate(orderId, {
            paymentStatus: "paid",
            status: "processing",
            stripeSessionId: session.id,
          });
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          const order = await Order.findByIdAndUpdate(
            orderId,
            { paymentStatus: "failed", status: "cancelled" },
            { new: true }
          );
          // Restore reserved stock for cancelled card orders.
          if (order) {
            await Promise.all(
              order.items.map((it) =>
                Product.findByIdAndUpdate(it.product, { $inc: { stock: it.quantity } })
              )
            );
          }
        }
        break;
      }
      default:
        break;
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};
