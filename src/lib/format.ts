const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** 270 → "₹270", 1250.5 → "₹1,250.5" */
export function formatRupees(amount: number) {
  return rupees.format(amount);
}
