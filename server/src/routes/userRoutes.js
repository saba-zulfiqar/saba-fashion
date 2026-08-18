// Customer account routes (profile + wishlist).
const router = require("express").Router();
const user = require("../controllers/userController");
const { protect } = require("../middleware/auth");

router.use(protect());

router.patch("/profile", user.updateProfile);
router.get("/wishlist", user.getWishlist);
router.post("/wishlist", user.addToWishlist);
router.delete("/wishlist/:productId", user.removeFromWishlist);

module.exports = router;
