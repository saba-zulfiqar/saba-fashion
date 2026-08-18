// Admin dashboard endpoints: inventory management, order management,
// registered customers and basic sales overview. Every route here is guarded
// by the `adminOnly` middleware (JWT + role check).
const Category = require("../models/Category");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const { UPLOAD_DIR } = require("../config/multer");
const fs = require("fs");
const path = require("path");

/** Map a set of multer files to public URLs (e.g. /uploads/products/abc.jpg). */
function toUrls(files = []) {
  return files.map((f) => `/uploads/products/${f.filename}`);
}

/** Delete stored files when a product is replaced or removed. */
function removeFiles(urls = []) {
  urls.forEach((url) => {
    if (!url.startsWith("/uploads/")) return;
    const filePath = path.join(UPLOAD_DIR, path.basename(url));
    fs.unlink(filePath, () => {});
  });
}

/**
 * GET /api/admin/stats
 * Dashboard overview: totals, revenue, pending orders and low-stock alert.
 */
exports.getStats = async (_req, res, next) => {
  try {
    const [orders, customers, products] = await Promise.all([
      Order.find(),
      User.countDocuments({ role: "customer" }),
      Product.find(),
    ]);
    res.json({
      totalOrders: orders.length,
      totalCustomers: customers,
      totalProducts: products.length,
      lowStock: products.filter((p) => p.stock <= 3).length,
      lowStockItems: products.filter((p) => p.stock <= 3).slice(0, 8),
      revenue: orders.reduce((sum, o) => sum + (o.status !== "cancelled" ? o.total : 0), 0),
      pendingOrders: orders.filter((o) => o.status === "pending").length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/products
 * Full inventory listing (all fields, category populated).
 */
exports.getProducts = async (_req, res, next) => {
  try {
    const products = await Product.find().populate("category", "name slug").sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/products
 * Create a product. Requires exactly four image files (multipart field "images").
 * Form fields: name, description, price, category (slug or id), stock, sizes (comma list).
 */
exports.createProduct = async (req, res, next) => {
  try {
    let images = [];
    if (req.files && req.files.length === 4) {
      images = toUrls(req.files);
    } else if (req.body.images) {
      images = typeof req.body.images === "string" ? JSON.parse(req.body.images) : req.body.images;
    }
    if (!Array.isArray(images) || images.length !== 4) {
      // Fallback default posture shots if admin does not upload all 4 custom images
      images = [
        "/uploads/products/pk01-a.jpg",
        "/uploads/products/pk01-b.jpg",
        "/uploads/products/pk01-c.jpg",
        "/uploads/products/pk01-d.jpg",
      ];
    }

    const category = await resolveCategory(req.body.category);
    if (!category) return res.status(400).json({ message: "Please choose a valid category." });

    const product = await Product.create({
      name: req.body.name,
      description: req.body.description || "",
      price: Number(req.body.price),
      discount: Math.max(0, Math.min(100, Number(req.body.discount) || 0)),
      category: category._id,
      stock: Number(req.body.stock) || 0,
      sizes: parseSizes(req.body.sizes),
      images,
    });

    res.status(201).json(await Product.findById(product._id).populate("category", "name slug"));
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/products/:id
 * Update product fields. Images are optional; if exactly four files are
 * uploaded they fully replace the current set.
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    const update = {};
    if (req.body.name !== undefined) update.name = req.body.name;
    if (req.body.description !== undefined) update.description = req.body.description;
    if (req.body.price !== undefined) update.price = Number(req.body.price);
    if (req.body.discount !== undefined) update.discount = Math.max(0, Math.min(100, Number(req.body.discount) || 0));
    if (req.body.stock !== undefined) update.stock = Number(req.body.stock);
    if (req.body.sizes !== undefined) update.sizes = parseSizes(req.body.sizes);
    if (req.body.category) {
      const category = await resolveCategory(req.body.category);
      if (!category) return res.status(400).json({ message: "Please choose a valid category." });
      update.category = category._id;
    }

    if (req.files && req.files.length) {
      if (req.files.length !== 4) {
        return res.status(400).json({
          message: "Replacement images must include exactly 4 files.",
        });
      }
      removeFiles(product.images); // free disk space for replaced photos
      update.images = toUrls(req.files);
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, update, { new: true }).populate(
      "category",
      "name slug"
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/products/:id/stock
 * Adjust stock by a signed delta: { stockDelta: -2 } or { stockDelta: 5 }.
 * Also accepts an absolute { stock } value.
 */
exports.updateStock = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    if (req.body.stock !== undefined) {
      product.stock = Math.max(0, Number(req.body.stock));
    } else if (req.body.stockDelta !== undefined) {
      product.stock = Math.max(0, product.stock + Number(req.body.stockDelta));
    } else {
      return res.status(400).json({ message: "Provide either stock or stockDelta." });
    }

    await product.save();
    res.json({ _id: product._id, name: product.name, stock: product.stock });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/products/:id
 * Permanently removes a product and its stored images.
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    removeFiles(product.images);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/orders
 * All orders with the customer user populated.
 */
exports.getOrders = async (_req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/orders/:id
 * Update fulfilment status: pending / processing / shipped / delivered.
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["pending", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid order status." });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/customers
 * Registered customers (password excluded automatically by the model).
 */
exports.getCustomers = async (_req, res, next) => {
  try {
    const customers = await User.find({ role: "customer" }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    next(err);
  }
};

/* ----------------------------- helpers ----------------------------- */

/** Accept a category slug or id and return the matching Category document. */
async function resolveCategory(value) {
  if (!value) return null;
  const byId = /^[0-9a-fA-F]{24}$/.test(value);
  if (byId) {
    const found = await Category.findById(value);
    if (found) return found;
  }
  return Category.findOne({ slug: String(value).toLowerCase() });
}

/** Parse a comma-separated size list into an array. */
function parseSizes(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return ["S", "M", "L", "XL"];
}
