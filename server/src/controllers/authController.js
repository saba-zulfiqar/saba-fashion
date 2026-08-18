// Authentication: signup, login, and "who am I".
const User = require("../models/User");
const { signToken } = require("../middleware/auth");

/**
 * POST /api/auth/signup
 * Public. Creates a customer account and returns a token + user object.
 * Admins are only ever created via the seed script, never through the public API.
 */
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, phone = "", address = "", city = "" } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) return res.status(409).json({ message: "An account with this email already exists." });

    const user = await User.create({ name, email, password, phone, address, city, role: "customer" });
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Public. Verifies credentials for both customers and admins.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Protected. Returns the currently authenticated user.
 */
exports.me = async (req, res) => {
  res.json({ user: req.user });
};
