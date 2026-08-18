// Order placement and customer order history.
const Order = require("../models/Order");
const Product = require("../models/Product");

const SHIPPING_THRESHOLD = 6000; // free delivery over this amount (PKR)
const FLAT_SHIPPING = 250;       // otherwise a flat delivery charge

/**
 * Recalculate the subtotal / shipping / total on the server so the client
 * can never tamper with prices.
 */
function computeTotals(items) {
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIPPING;
  return { subtotal, shipping, total: subtotal + shipping };
}

/**
 * POST /api/orders
 * Public (guests allowed) or protected. Creates an order from the cart,
 * snapshots item details and decrements product stock.
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { items, customer, paymentMethod = "cod" } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty." });
    }
    if (!customer?.name || !customer?.address || !customer?.phone) {
      return res.status(400).json({ message: "Please provide all delivery details." });
    }
    if (!["cod", "stripe", "card", "easypaisa", "jazzcash"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Unsupported payment method." });
    }

    // Load each product so we use server-side prices and current stock.
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

    const { subtotal, shipping, total } = computeTotals(orderItems);

    const order = await Order.create({
      orderNumber: `SAB-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`,
      user: req.user ? req.user._id : null,
      items: orderItems,
      customer,
      paymentMethod,
      subtotal,
      shipping,
      total,
      // COD orders start as "paid" so customers see them as active; Stripe orders
      // stay "pending" until the webhook confirms the charge.
      paymentStatus: paymentMethod === "cod" ? "paid" : "pending",
    });

    // Decrement stock atomically for each sold item.
    await Promise.all(
      orderItems.map((it) =>
        Product.findByIdAndUpdate(it.product, { $inc: { stock: -it.quantity } })
      )
    );

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/me
 * Protected (customer). Returns the authenticated user's order history.
 */
exports.myOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};
