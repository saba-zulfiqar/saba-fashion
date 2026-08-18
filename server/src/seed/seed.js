// Database seeder.
//   cd server && npm run seed
// Seeds:
//   - the 5 categories (Silk, Summer, Casual, Printed, Embroidery)
//   - 40 products (8 per category) with 4 posture images each, using the
//     pre-downloaded placeholder photos in server/uploads/products
//   - a demo admin + demo customer account
//   - a handful of sample orders so the dashboards have data on first run
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Category = require("../models/Category");
const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");
const imageMap = require("../image_map.json");

// 8 distinct Pakistani dress names per category.
const PRODUCT_NAMES = {
  silk: [
    "Pearl Silk Suit", "Jasmine Silk Ensemble", "Noor Silk Anarkali", "Marhaba Silk Set",
    "Zainab Silk Kurta", "Falak Silk Suit", "Sitara Silk Dress", "Mahira Silk Gown",
  ],
  summer: [
    "Bahar Lawn Suit", "Nilofer Lawn Set", "Zara Summer Kurta", "Gulnaz Lawn Dress",
    "Roshan Summer Suit", "Aiman Lawn Kurta", "Sahar Summer Set", "Meher Lawn Ensemble",
  ],
  casual: [
    "Daily Comfort Kurta", "Rukhsana Casual Suit", "Sana Everyday Kurta", "Iqra Lounge Set",
    "Hira Two-Piece", "Nadia Easy Suit", "Zeba Cotton Kurta", "Anila Casual Set",
  ],
  printed: [
    "Gulabi Printed Suit", "Sitara Print Kurta", "Rang Printed Set", "Chandni Print Dress",
    "Pari Floral Suit", "Haseena Printed Kurta", "Surkh Print Ensemble", "Bahaar Print Suit",
  ],
  embroidery: [
    "Tara Embroidered Suit", "Zaynab Festive Kurta", "Nazneen Embroidered Set", "Anaya Formal Suit",
    "Rumaisa Embroidered Dress", "Saba Detail Kurta", "Iman Embroidered Ensemble", "Ayesha Festive Suit",
  ],
};

const PRICES = {
  silk: [12400, 14900, 9800, 11200, 8600, 13400, 15900, 10500],
  summer: [4200, 4900, 3600, 5400, 3800, 4500, 6100, 4700],
  casual: [2900, 3400, 2600, 3100, 2400, 3800, 2200, 3500],
  printed: [3900, 4600, 3400, 5100, 3700, 4400, 4800, 5200],
  embroidery: [8200, 9800, 7400, 11900, 8900, 7600, 13500, 10400],
};

const DESCRIPTIONS = {
  silk: [
    "Lustrous raw-silk kameez with delicate tilla accents and a soft flowing dupatta.",
    "Hand-finished silk ensemble with subtle zardozi detail along the neckline.",
    "Flowing anarkali in pure silk with a pleated flare and pearl-button front.",
    "Two-tone silk set with embroidered panel front and matching silk trouser.",
    "Everyday-glam silk kurta with a relaxed drape and embroidered cuffs.",
    "Silk suit with a scalloped hem, embroidered yoke and contrast dupatta.",
    "Statement silk dress with an embellished bodice and full skirt.",
    "Floor-length silk gown with a soft sheen, perfect for evening dawat.",
  ],
  summer: [
    "Breathable lawn suit with a digital print dupatta and straight trousers.",
    "Feather-light lawn set in a fresh pastel palette with scalloped trims.",
    "Cool summer kurta with cap sleeves and a matching printed shawl.",
    "Flowy lawn dress with a boxy cut and lightweight chiffon dupatta.",
    "All-day summer suit in crisp lawn with contrast piped trousers.",
    "Easy lawn kurta with three-quarter sleeves and printed borders.",
    "Summer-ready two-piece with an airy silhouette and soft print.",
    "Lawn ensemble with a self-design dupatta, made for long warm days.",
  ],
  casual: [
    "Soft cotton kurta with a relaxed fit and simple neckline.",
    "Everyday suit in washed cotton with a straight-cut trouser.",
    "Breathable cotton kurta with functional pockets and side slits.",
    "Lounge-friendly two-piece in stretch cotton, easy to wear all day.",
    "Two-piece cotton set with a drawstring trouser and plain kurta.",
    "Easy suit with a minimal collar and comfortable full sleeves.",
    "Plain cotton kurta with a subtle stitch detail on the yoke.",
    "Casual set in soft cambric with a relaxed, uncluttered design.",
  ],
  printed: [
    "All-over floral printed suit with a block-printed dupatta.",
    "Abstract-print kurta in bold yet wearable colour blocking.",
    "Digital print set with a contrasting printed trouser.",
    "Printed dress with a modern asymmetric hem and full sleeves.",
    "Fresh floral lawn suit with a soft chiffon dupatta.",
    "Geometric-print kurta with a minimalist clean silhouette.",
    "Vibrant printed ensemble with a tonal border dupatta.",
    "Playful print suit in cool tones, cut for everyday comfort.",
  ],
  embroidery: [
    "Hand-embroidered suit with intricate threadwork along the front.",
    "Festive kurta with multicolour embroidery and sequin accents.",
    "Embroidered set with a heavily worked yoke and stone details.",
    "Formal suit with an embellished neckline and embroidered sleeves.",
    "Embroidered dress with a detailed hem and soft net overlay.",
    "Dainty embroidered kurta with pearl and bead detailing.",
    "Statement embroidered ensemble with mirror-work panels.",
    "Occasion-wear suit with rich embroidery and a delicate dupatta.",
  ],
};

const STOCK = [
  42, 8, 25, 3, 60, 15, 0, 30, 22, 48, 12, 2, 35, 55, 18, 27, 40, 7, 33, 50, 19, 28, 45, 5, 16, 38, 10, 24, 52, 14, 6, 31,
];

// Colourways per product (one entry per product, in the same order as the
// product names above). Each array lists the swatch colours for that dress.
const COLORS = {
  silk: [
    ["Ivory", "Champagne", "Blush"], ["Emerald", "Teal", "Gold"], ["Maroon", "Dusty Pink"], ["Navy", "Burgundy"],
    ["Pearl Grey", "Sage"], ["Sapphire", "Wine"], ["Black", "Ivory", "Rose Gold"], ["Midnight", "Silver"],
  ],
  summer: [
    ["Mint", "Peach"], ["Sky Blue", "Lavender"], ["Butter Yellow", "White"], ["Coral", "Aqua"],
    ["Rose", "Mint Green"], ["Periwinkle", "Sand"], ["Turquoise", "Lemon"], ["Ice Blue", "Pistachio"],
  ],
  casual: [
    ["Ecru", "Grey"], ["Dusty Rose", "Olive"], ["Black", "Oat"], ["Navy", "Stone"],
    ["Terracotta", "Off-white"], ["Slate", "Ivory"], ["Camel", "White"], ["Charcoal", "Blush"],
  ],
  printed: [
    ["Multi"], ["Red & Gold"], ["Blue & Ivory"], ["Pink & Green"],
    ["Orange & Teal"], ["Purple & Yellow"], ["Green & Maroon"], ["Coral & Navy"],
  ],
  embroidery: [
    ["Ivory", "Gold"], ["Rust", "Green"], ["Red", "Rose"], ["Emerald", "Ivory"],
    ["Black", "Gold"], ["Burgundy", "Cream"], ["Royal Blue", "Silver"], ["Plum", "Pink"],
  ],
};

const ADMIN = { name: "Saba Admin", email: "admin@sabafashion.com", password: "Admin@1234" };
const CUSTOMER = { name: "Ayesha Customer", email: "customer@sabafashion.com", password: "Customer@1234", phone: "0300-1234567", address: "House 12, Street 7, Gulberg III, Lahore", city: "Lahore", province: "Punjab", postalCode: "54000" };

async function seed() {
  await connectDB();

  // SAFEGUARD: Check if products already exist. Never silently wipe real data.
  const existingCount = await Product.countDocuments();
  const force = process.env.FORCE_SEED === "true";
  if (existingCount > 0 && !force) {
    console.error(
      `\n⚠  SAFETY STOP: ${existingCount} product(s) already exist in the database.\n` +
        `   Refusing to clear them. If you truly want to re-seed and DELETE all products,\n` +
        `   run:  FORCE_SEED=true npm run seed\n\n` +
        `   This safeguard exists to prevent accidentally wiping manually-added products.`
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  if (existingCount > 0) {
    console.log(`FORCE_SEED is set. Clearing ${existingCount} existing product(s) and re-seeding…`);
  }
  console.log("Clearing existing data…");
  await Promise.all([Category.deleteMany({}), Product.deleteMany({}), User.deleteMany({}), Order.deleteMany({})]);

  console.log("Seeding categories…");
  const categoryDocs = await Promise.all(
    Object.keys(PRODUCT_NAMES).map((slug, idx) =>
      Category.create({ name: idxName(slug), slug })
    )
  );
  const categoryBySlug = Object.fromEntries(categoryDocs.map((c) => [c.slug, c]));

  console.log("Seeding products…");
  const products = [];
  for (const [slug, names] of Object.entries(PRODUCT_NAMES)) {
    const sets = imageMap[slug]; // 8 products × 4 filenames
    names.forEach((name, i) => {
      const images = sets[i].map((file) => {
        const name = file.endsWith(".jpg") ? file : `${file}.jpg`;
        return `/uploads/products/${name}`;
      });
      products.push({
        name,
        description: DESCRIPTIONS[slug][i],
        price: PRICES[slug][i],
        category: categoryBySlug[slug]._id,
        images,
        sizes: ["S", "M", "L", "XL"],
        colors: COLORS[slug][i],
        stock: STOCK[(products.length + i) % STOCK.length],
      });
    });
  }
  makeThumbnailsUnique(products);
  const productDocs = await Product.insertMany(products);

  console.log("Seeding users…");
  await User.create([
    { ...ADMIN, role: "admin" },
    { ...CUSTOMER, role: "customer" },
  ]);

  console.log("Seeding sample orders…");
  const customer = await User.findOne({ email: CUSTOMER.email });
  const [silks, summer, casual, printed, embroidery] = await Promise.all(
    ["silk", "summer", "casual", "printed", "embroidery"].map((slug) =>
      Product.find({ category: categoryBySlug[slug]._id })
    )
  );

  const orderDefs = [
    {
      status: "delivered", paymentMethod: "cod", paymentStatus: "paid", daysAgo: 21,
      picks: [[summer[0], 1, "M"], [printed[1], 1, "L"]],
    },
    {
      status: "shipped", paymentMethod: "cod", paymentStatus: "paid", daysAgo: 9,
      picks: [[embroidery[3], 1, "M"]],
    },
    {
      status: "processing", paymentMethod: "stripe", paymentStatus: "paid", daysAgo: 4,
      picks: [[silks[4], 1, "S"], [casual[2], 2, "M"]],
    },
    {
      status: "pending", paymentMethod: "cod", paymentStatus: "paid", daysAgo: 1,
      picks: [[printed[6], 1, "L"], [summer[7], 1, "M"], [silks[0], 1, "S"]],
    },
  ];

  for (const def of orderDefs) {
    const items = def.picks.map(([p, qty, size]) => ({
      product: p._id, name: p.name, price: p.price, quantity: qty, size, image: p.images[0],
    }));
    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const shipping = subtotal >= 6000 ? 0 : 250;
    await Order.create({
      orderNumber: `SAB-${(100000 + Math.floor(Math.random() * 900000))}`,
      user: customer._id,
      items,
      subtotal,
      shipping,
      total: subtotal + shipping,
      customer: { name: CUSTOMER.name, address: CUSTOMER.address, city: CUSTOMER.city, province: CUSTOMER.province, postalCode: CUSTOMER.postalCode, phone: CUSTOMER.phone, email: CUSTOMER.email },
      status: def.status,
      paymentMethod: def.paymentMethod,
      paymentStatus: def.paymentStatus,
      createdAt: new Date(Date.now() - def.daysAgo * 86400000),
    });
  }

  console.log(`Done. ${categoryDocs.length} categories, ${productDocs.length} products.`);
  console.log(`Admin login:    ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`Customer login: ${CUSTOMER.email} / ${CUSTOMER.password}`);
  await mongoose.disconnect();
}

/** Capitalised category display name from the lowercase slug. */
function idxName(slug) {
  const map = { silk: "Silk", summer: "Summer", casual: "Casual", printed: "Printed", embroidery: "Embroidery" };
  return map[slug] || slug;
}

/**
 * Ensure every product's first (thumbnail) image is globally unique so no two
 * product cards on the home page look identical. Keeps each product's 4-image
 * set intact when possible and only replaces a colliding thumbnail with a file
 * from disk that is not already used as a thumbnail and not already in that
 * product's own image set.
 */
function makeThumbnailsUnique(products) {
  const uploadDir = path.join(__dirname, "../../uploads/products");
  const pool = fs
    .readdirSync(uploadDir)
    .filter((f) => f.endsWith(".jpg"))
    .map((f) => `/uploads/products/${f}`);
  const usedThumbnails = new Set();
  for (const product of products) {
    if (usedThumbnails.has(product.images[0])) {
      const replacement = pool.find(
        (url) =>
          !usedThumbnails.has(url) &&
          !product.images.includes(url)
      );
      if (replacement) product.images[0] = replacement;
      else console.warn(`Could not deduplicate thumbnail for "${product.name}"`);
    }
    usedThumbnails.add(product.images[0]);
  }
  return products;
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
