// Admin-only routes for the dashboard.
const router = require("express").Router();
const admin = require("../controllers/adminController");
const { adminOnly } = require("../middleware/auth");
const { upload } = require("../config/multer");

// All admin routes require a valid admin JWT.
router.use(adminOnly);

router.get("/stats", admin.getStats);

router.get("/products", admin.getProducts);
router.post("/products", upload.array("images", 4), admin.createProduct);
router.patch("/products/:id", upload.array("images", 4), admin.updateProduct);
router.patch("/products/:id/stock", admin.updateStock);
router.delete("/products/:id", admin.deleteProduct);

router.get("/orders", admin.getOrders);
router.patch("/orders/:id", admin.updateOrderStatus);

router.get("/customers", admin.getCustomers);

module.exports = router;
