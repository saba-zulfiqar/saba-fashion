// Multer configuration for product image uploads.
// Images are uploaded directly to Cloudinary (works on Vercel's read-only
// filesystem) instead of being saved to local disk.
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "saba-fashion/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
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

module.exports = { upload, cloudinary };
