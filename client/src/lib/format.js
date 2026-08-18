// Formatting helpers used across the storefront.

/** Format a number as Pakistani Rupees, e.g. Rs. 12,400. */
export function money(n) {
  if (n === null || n === undefined || isNaN(n)) return "Rs. 0";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  })
    .format(n)
    .replace("PKR", "Rs.");
}

/** Human-friendly order status label. */
export function orderStatusLabel(status) {
  const labels = {
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
}
