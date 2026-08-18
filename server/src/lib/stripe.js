// Lazily-initialised Stripe client. Constructing `stripe()` without a key
// throws, so we only build the client when STRIPE_SECRET_KEY is present.
let stripeClient = null;

/**
 * @returns The Stripe SDK instance.
 * @throws A 503-friendly error if STRIPE_SECRET_KEY is not configured.
 */
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    const err = new Error(
      "Stripe is not configured. Add STRIPE_SECRET_KEY to the server .env file."
    );
    err.statusCode = 503;
    throw err;
  }
  if (!stripeClient) {
    stripeClient = require("stripe")(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

module.exports = { getStripe };
