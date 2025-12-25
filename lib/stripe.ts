import Stripe from "stripe"

// Initialize Stripe with the secret key (or placeholder for build time)
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_for_build",
  {
    apiVersion: "2025-12-15.clover",
    typescript: true,
  }
)

// Stripe configuration constants
export const STRIPE_CONFIG = {
  currency: "usd",
  // Application fee percentage (platform takes 5% commission)
  applicationFeePercent: 0.05,
  // Minimum charge amount in cents ($0.50 USD minimum)
  minimumChargeAmount: 50,
}

/**
 * Calculate the application fee for a given amount
 * @param amount - Amount in cents
 * @returns Application fee in cents
 */
export function calculateApplicationFee(amount: number): number {
  return Math.round(amount * STRIPE_CONFIG.applicationFeePercent)
}

/**
 * Format amount from dollars to cents for Stripe
 * @param dollars - Amount in dollars
 * @returns Amount in cents
 */
export function formatAmountForStripe(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Format amount from cents to dollars for display
 * @param cents - Amount in cents
 * @returns Amount in dollars
 */
export function formatAmountFromStripe(cents: number): number {
  return cents / 100
}
