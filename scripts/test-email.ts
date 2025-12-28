/**
 * Test script for email notifications
 * Run with: RESEND_API_KEY="..." ADMIN_EMAIL="..." npx tsx scripts/test-email.ts
 */

import { notifyAdminNewTransfer } from "../lib/email"

async function testEmail() {
  console.log("🧪 Testing email notification system...\n")

  const result = await notifyAdminNewTransfer({
    transactionId: "test_123",
    listingTitle: "Taylor Swift - The Eras Tour",
    buyerEmail: "buyer@example.com",
    amount: 15000, // $150.00 in cents
    transferCode: "TM-ABC123",
  })

  if (result.success) {
    console.log("✅ Email sent successfully!")
    if (result.data) {
      console.log("📧 Email ID:", result.data)
    }
  } else {
    console.log("❌ Email failed to send")
    console.error("Error:", result.error)
  }
}

testEmail()
