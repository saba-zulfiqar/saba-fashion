// JWT helpers: sign tokens and verify them in request middleware.
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Create a signed JWT for a user document.
 * @param {object} user Mongoose user document.
 * @returns {string} Signed token, valid for 7 days.
 */
function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

/**
 * Middleware that protects a route.
 * - Verifies the `Authorization: Bearer <token>` header.
 * - Loads the user into req.user (password excluded).
 * - Optionally restricts to one or more roles via `allowedRoles`.
 */
function protect(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;
      if (!token) return res.status(401).json({ message: "Authentication required." });

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id).select("+password");
      if (!user) return res.status(401).json({ message: "Account no longer exists." });

      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "You do not have access to this resource." });
      }

      req.user = user;
      next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired session." });
    }
  };
}

/** Convenience middleware: admin-only route guard. */
const adminOnly = protect(["admin"]);

module.exports = { signToken, protect, adminOnly };
