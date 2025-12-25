import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(date))
}

export type CancellationPolicy = "STRICT" | "MODERATE" | "FLEXIBLE"

export interface RefundCalculation {
  refundPercentage: number
  refundAmount: number
  canCancel: boolean
  reason?: string
}

/**
 * Calculate refund amount based on cancellation policy and timing
 */
export function calculateRefund(
  policy: CancellationPolicy,
  purchaseDate: Date,
  eventDate: Date,
  amount: number
): RefundCalculation {
  const now = new Date()
  const hoursSincePurchase = (now.getTime() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60)
  const hoursUntilEvent = (new Date(eventDate).getTime() - now.getTime()) / (1000 * 60 * 60)
  const daysUntilEvent = hoursUntilEvent / 24

  // No refunds within 24 hours of event (all policies)
  if (hoursUntilEvent < 24) {
    return {
      refundPercentage: 0,
      refundAmount: 0,
      canCancel: false,
      reason: "No refunds within 24 hours of event"
    }
  }

  // Event has already passed
  if (hoursUntilEvent < 0) {
    return {
      refundPercentage: 0,
      refundAmount: 0,
      canCancel: false,
      reason: "Event has already occurred"
    }
  }

  let refundPercentage = 0

  switch (policy) {
    case "STRICT":
      if (hoursSincePurchase <= 2) {
        refundPercentage = 100 // Full refund within 2 hours
      } else if (hoursSincePurchase <= 24) {
        refundPercentage = 50 // 50% refund within 24 hours
      } else {
        return {
          refundPercentage: 0,
          refundAmount: 0,
          canCancel: false,
          reason: "Strict policy: No refunds after 24 hours of purchase"
        }
      }
      break

    case "MODERATE":
      if (hoursSincePurchase <= 2) {
        refundPercentage = 100 // Full refund within 2 hours
      } else if (hoursSincePurchase <= 24) {
        refundPercentage = 90 // 90% refund within 24 hours
      } else if (daysUntilEvent > 7) {
        refundPercentage = 75 // 75% refund more than 7 days before event
      } else if (daysUntilEvent >= 1) {
        refundPercentage = 50 // 50% refund 1-7 days before event
      }
      break

    case "FLEXIBLE":
      if (hoursSincePurchase <= 2) {
        refundPercentage = 100 // Full refund within 2 hours
      } else if (daysUntilEvent > 7) {
        refundPercentage = 90 // 90% refund more than 7 days before
      } else if (daysUntilEvent >= 3) {
        refundPercentage = 75 // 75% refund 3-7 days before
      } else if (daysUntilEvent >= 1) {
        refundPercentage = 50 // 50% refund 1-3 days before
      }
      break
  }

  const refundAmount = (amount * refundPercentage) / 100

  return {
    refundPercentage,
    refundAmount,
    canCancel: refundPercentage > 0,
  }
}
