// Cart controller: server-side shopping cart for logged-in customers.
const User = require("../models/User");
const Product = require("../models/Product");

/** Return a user's cart lines, populated with full product documents. */
async function cartItems(userId) {
  const user = await User.findById(userId).populate("cart.product");
  return (user.cart || [])
    .filter((it) => it.product)
    .map((it) => ({ product: it.product, size: it.size, qty: it.qty }));
}

// GET /api/cart — current user's cart.
async function getCart(req, res, next) {
  try {
    res.json({ items: await cartItems(req.user._id) });
  } catch (e) {
    next(e);
  }
}

// PUT /api/cart — replace the whole cart: { items: [{ product, size, qty }] }.
async function replaceCart(req, res, next) {
  try {
    const incoming = Array.isArray(req.body.items) ? req.body.items : [];
    const user = await User.findById(req.user._id);
    user.cart = [];
    for (const it of incoming) {
      if (!it || !it.product) continue;
      const product = await Product.findById(it.product);
      if (!product) continue;
      const qty = Math.max(1, parseInt(it.qty, 10) || 1);
      const size = it.size || "";
      const existing = user.cart.find(
        (c) => String(c.product) === String(product._id) && (c.size || "") === size
      );
      if (existing) existing.qty = qty;
      else user.cart.push({ product: product._id, size, qty });
    }
    await user.save();
    res.json({ items: await cartItems(req.user._id) });
  } catch (e) {
    next(e);
  }
}

// POST /api/cart/items — add a product (or bump its quantity).
async function addItem(req, res, next) {
  try {
    const { productId, size = "", qty = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found." });
    const add = Math.max(1, parseInt(qty, 10) || 1);
    const cap = Math.max(product.stock, 1);
    const user = await User.findById(req.user._id);
    const existing = user.cart.find(
      (it) => String(it.product) === String(productId) && (it.size || "") === size
    );
    if (existing) existing.qty = Math.min(existing.qty + add, cap);
    else user.cart.push({ product: product._id, size, qty: Math.min(add, cap) });
    await user.save();
    res.status(201).json({ items: await cartItems(req.user._id) });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/cart/items/:productId — set quantity ({ size, qty }); 0 removes the line.
async function updateItem(req, res, next) {
  try {
    const { size = "", qty = 1 } = req.body;
    const productId = req.params.productId;
    const user = await User.findById(req.user._id);
    const item = user.cart.find(
      (it) => String(it.product) === String(productId) && (it.size || "") === size
    );
    if (!item) return res.status(404).json({ message: "Item not in cart." });
    const q = parseInt(qty, 10) || 0;
    if (q <= 0) user.cart.pull(item._id);
    else item.qty = q;
    await user.save();
    res.json({ items: await cartItems(req.user._id) });
  } catch (e) {
    next(e);
  }
}

// DELETE /api/cart/items/:productId?size=S — remove one cart line.
async function removeItem(req, res, next) {
  try {
    const { size = "" } = req.query;
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter(
      (it) => !(String(it.product) === String(req.params.productId) && (it.size || "") === size)
    );
    await user.save();
    res.json({ items: await cartItems(req.user._id) });
  } catch (e) {
    next(e);
  }
}

// DELETE /api/cart — empty the cart.
async function clearCart(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();
    res.json({ items: [] });
  } catch (e) {
    next(e);
  }
}

module.exports = { getCart, replaceCart, addItem, updateItem, removeItem, clearCart };
