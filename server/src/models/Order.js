// Order model. Supports both guest and registered checkouts.
// Only two payment methods are offered: Cash on Delivery (cod) and card via Stripe.
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, default: "" },
    // Snapshot of the first posture image so the order survives product edits.
    image: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Human-friendly order reference shown to customers, e.g. SAB-482913.
    orderNumber: { type: String, unique: true },
    // Optional — guest orders have no user.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    customer: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      province: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      phone: { type: String, required: true },
      email: { type: String, default: "" },
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "stripe", "card", "easypaisa", "jazzcash"],
      default: "cod",
    },
    // For Stripe orders this becomes "paid" once the webhook confirms payment.
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    // Stripe Checkout Session id, populated when a card order is started.
    stripeSessionId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
