// Customer account endpoints: profile management and wishlist.
const User = require("../models/User");
const Product = require("../models/Product");

/**
 * PATCH /api/users/profile
 * Protected (customer). Update name, phone, address, email.
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, email } = req.body;

    if (email) {
      const taken = await User.findOne({ email: String(email).toLowerCase(), _id: { $ne: req.user._id } });
      if (taken) return res.status(409).json({ message: "That email is already in use." });
    }

    req.user.name = name ?? req.user.name;
    req.user.phone = phone ?? req.user.phone;
    req.user.address = address ?? req.user.address;
    req.user.email = email ? String(email).toLowerCase() : req.user.email;
    await req.user.save();

    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/wishlist
 * Protected. Returns wishlist products (category populated).
 */
exports.getWishlist = async (req, res, next) => {
  try {
    await req.user.populate({ path: "wishlist", populate: { path: "category", select: "name slug" } });
    res.json({ wishlist: req.user.wishlist });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/wishlist  (body: { productId })
 * Protected. Adds a product to the wishlist (no duplicates).
 */
exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found." });

    const exists = req.user.wishlist.some((id) => String(id) === String(productId));
    if (!exists) {
      req.user.wishlist.push(product._id);
      await req.user.save();
    }
    res.status(201).json({ wishlist: req.user.wishlist });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/wishlist/:productId
 * Protected. Removes a product from the wishlist.
 */
exports.removeFromWishlist = async (req, res, next) => {
  try {
    req.user.wishlist = req.user.wishlist.filter((id) => String(id) !== String(req.params.productId));
    await req.user.save();
    res.json({ wishlist: req.user.wishlist });
  } catch (err) {
    next(err);
  }
};
