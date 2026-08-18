// Database connection helper using Mongoose.
// Reads the connection string from MONGODB_URI in the environment (.env).
const mongoose = require("mongoose");

/**
 * Connect to MongoDB.
 * - Retries a few times so a not-yet-ready local database does not crash the app.
 * - Logs a clear error and exits if the database can never be reached.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/saba-fashion";
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log("MongoDB connected:", uri.replace(/\/\/.*@/, "//<credentials>@"));
      return;
    } catch (err) {
      console.warn(`MongoDB connection attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
      if (attempt === maxAttempts) {
        console.error("Exiting: could not connect to MongoDB.");
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

module.exports = connectDB;
