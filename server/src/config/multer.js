// Multer configuration for product image uploads.
// Images are stored on disk under server/uploads/products so they can be
// served by Express as static files. In production you can swap this for a
// Cloudinary/S3 adapter while keeping the same controller interfaces.
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Vercel's filesystem is read-only except for /tmp, so use /tmp there.
const UPLOAD_DIR = process.env.VERCEL
  ? "/tmp/uploads/products"
  : path.join(__dirname, "../../uploads/products");

// Make sure the upload directory exists before multer tries to write to it.
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  // Unique, collision-safe filename: timestamp + random suffix + original extension.
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]+/gi, "-").slice(0, 30);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}-${unique}${ext}`);
  },
});
const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ok = allowed.test(file.mimetype);
  if (!ok) return cb(new Error("Only JPEG, PNG and WEBP images are allowed."));
  cb(null, true);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 4 }, // max 8 MB per file, max 4 files
});
module.exports = { upload, UPLOAD_DIR };
