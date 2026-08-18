// Centralised error handler. Attached last in the Express stack so every
// controller can simply `next(err)` and receive a consistent JSON response.
function notFound(req, res, _next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Multer / validation style errors carry a statusCode or name we can read.
  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((e) => e.message).join(" ");
    return res.status(400).json({ message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid identifier." });
  }

  const status = err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: err.message || "Something went wrong on the server." });
}

module.exports = { notFound, errorHandler };
