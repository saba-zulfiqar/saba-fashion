// Public catalogue endpoints: categories and products.
const Category = require("../models/Category");
const Product = require("../models/Product");

/**
 * GET /api/categories
 * Public. Returns all categories (ordered Silk, Summer, Casual, Printed, Embroidery).
 */
exports.getCategories = async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ _id: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products?category=<slug>
 * Public. Lists products, optionally filtered by category slug.
 * Products are grouped on the client, so this returns the flat list.
 */
exports.getProducts = async (req, res, next) => {
  try {
    const { category } = req.query;
    let filter = {};
    if (category) {
      const cat = await Category.findOne({ slug: category.toLowerCase() });
      if (!cat) return res.status(404).json({ message: "Category not found." });
      filter = { category: cat._id };
    }
    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: 1 });
    res.json(products);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id
 * Public. Returns a single product with its category populated.
 */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name slug");
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json(product);
  } catch (err) {
    next(err);
  }
};
