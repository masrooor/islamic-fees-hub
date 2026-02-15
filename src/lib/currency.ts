/**
 * Format a number as Pakistani Rupees (PKR).
 * Example: formatPKR(15000) => "Rs. 15,000"
 */
export function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}
