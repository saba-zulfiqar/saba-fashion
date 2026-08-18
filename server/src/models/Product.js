// Product model. Every product carries up to four posture images
// (front / side / back / close-up), a price, stock and description.
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    // Optional percentage discount shown on product cards.
    discount: { type: Number, default: 0, min: 0, max: 100 },
    // Reference to the Category collection.
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    // Relative URLs such as "/uploads/products/abc.jpg". Exactly 4 for catalogue products.
    images: {
      type: [String],
      validate: {
        validator: (v) => v.length === 4,
        message: "Each product needs exactly four posture images.",
      },
    },
    // Available sizes for the size selector on the product view.
    sizes: { type: [String], default: ["S", "M", "L", "XL"] },
    // Available colourways, shown as swatches on the product view.
    colors: { type: [String], default: [] },
    stock: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Keep the catalogue listing lightweight: any /uploads prefix is kept as-is.
productSchema.methods.toJSON = function () {
  const obj = this.toObject();
  return obj;
};

module.exports = mongoose.model("Product", productSchema);
