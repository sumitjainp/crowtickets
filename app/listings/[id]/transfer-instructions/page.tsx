"use client"

import { notFound } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"

// Remove the server-side function - we'll fetch client-side

const platformInstructions: Record<string, { steps: string[]; tips: string[] }> = {
  TICKETMASTER: {
    steps: [
      "Log in to your Ticketmaster account",
      "Go to 'My Events' and find your ticket",
      "Click 'Transfer Tickets'",
      "Enter the escrow email address shown below",
      "In the message field, include your transfer code",
      "Complete the transfer",
    ],
    tips: [
      "Ticketmaster usually processes transfers instantly",
      "The recipient will receive an email to accept the transfer",
      "Make sure to include the transfer code in the message",
    ],
  },
  AXS: {
    steps: [
      "Log in to your AXS account at axs.com",
      "Navigate to 'My Events'",
      "Select the event and click 'Transfer'",
      "Enter the escrow email address shown below",
      "Add your transfer code in the notes/message field",
      "Confirm and send the transfer",
    ],
    tips: [
      "AXS transfers are usually instant",
      "Both parties will receive confirmation emails",
      "Keep your confirmation email as proof of transfer",
    ],
  },
  STUBHUB: {
    steps: [
      "Log in to your StubHub account",
      "Go to 'My tickets' section",
      "Find your listing and click 'Deliver'",
      "Choose 'Transfer' as delivery method",
      "Enter the escrow email address",
      "Include the transfer code in the message",
      "Complete the transfer process",
    ],
    tips: [
      "StubHub may take a few minutes to process",
      "You'll receive a confirmation email",
      "Save your transfer confirmation number",
    ],
  },
  SEATGEEK: {
    steps: [
      "Open the SeatGeek app or website",
      "Go to 'Orders' and select your tickets",
      "Tap 'Transfer Tickets'",
      "Enter the escrow email address",
      "Add the transfer code to the message",
      "Send the transfer",
    ],
    tips: [
      "SeatGeek transfers are typically instant",
      "Both you and the recipient get notifications",
      "Make sure your app is updated to the latest version",
    ],
  },
  VIVID_SEATS: {
    steps: [
      "Log in to Vivid Seats",
      "Navigate to 'My Orders'",
      "Select the tickets to transfer",
      "Click 'Transfer' and enter the escrow email",
      "Include your transfer code in the notes",
      "Confirm the transfer",
    ],
    tips: [
      "Keep your order number handy",
      "Transfer confirmations are sent via email",
      "Contact support if transfer takes longer than 10 minutes",
    ],
  },
  GAMETIME: {
    steps: [
      "Open the Gametime app",
      "Go to your purchased tickets",
      "Select 'Transfer Tickets'",
      "Enter the escrow email address",
      "Add transfer code to the message",
      "Complete the transfer",
    ],
    tips: [
      "Gametime transfers are instant",
      "You can track transfer status in the app",
      "Screenshot the confirmation for your records",
    ],
  },
  OTHER: {
    steps: [
      "Log in to your ticketing platform",
      "Find the transfer or send tickets option",
      "Enter the escrow email address shown below",
      "Include your transfer code in any message/notes field",
      "Complete the transfer process",
      "Save your confirmation",
    ],
    tips: [
      "Different platforms have different transfer processes",
      "Always include the transfer code",
      "Keep proof of transfer (screenshots or emails)",
      "Contact us if you need help with your specific platform",
    ],
  },
}

export default function TransferInstructionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [id, setId] = useState<string | null>(null)
  const [listing, setListing] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Unwrap params promise
        const resolvedParams = await params
        const listingId = resolvedParams.id
        setId(listingId)

        // Fetch session
        const sessionRes = await fetch("/api/auth/session")
        const sessionData = await sessionRes.json()
        setSession(sessionData)

        // Fetch listing
        const listingRes = await fetch(`/api/listings/${listingId}`)
        const listingData = await listingRes.json()
        setListing(listingData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h1>
          <Link href="/listings" className="text-blue-600 hover:text-blue-700">
            ← Back to Listings
          </Link>
        </div>
      </div>
    )
  }

  // Only the seller can see transfer instructions
  if (!session?.user || session.user.id !== listing.sellerId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only the seller can view transfer instructions.</p>
          <Link href="/listings" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            ← Back to Listings
          </Link>
        </div>
      </div>
    )
  }

  // Only show for transfer-based tickets
  if (listing.ticketType === "PDF") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Transfer Required</h1>
          <p className="text-gray-600">This is a PDF-based listing. No transfer needed.</p>
          <Link href={`/listings/${id}`} className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            View Listing
          </Link>
        </div>
      </div>
    )
  }

  const instructions = platformInstructions[listing.ticketType] || platformInstructions.OTHER
  const isVerified = listing.verificationStatus === "VERIFIED"

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/listings/${id}`}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
          >
            ← Back to Listing
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Transfer Your Tickets to Escrow
          </h1>
          <p className="mt-2 text-gray-600">
            Follow these steps to transfer your {listing.ticketType} tickets to our secure escrow account
          </p>
        </div>

        {/* Verification Status */}
        <div className={`mb-8 p-6 rounded-lg border-2 ${
          isVerified
            ? "bg-green-50 border-green-200"
            : "bg-yellow-50 border-yellow-200"
        }`}>
          <div className="flex items-start gap-3">
            <div className="text-3xl">
              {isVerified ? "✅" : "⏳"}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isVerified ? "Transfer Verified!" : "Awaiting Transfer"}
              </h2>
              <p className="text-sm text-gray-700 mt-1">
                {isVerified
                  ? "We've received and verified your ticket transfer. Your listing is now active!"
                  : "Once you complete the transfer, we'll verify your tickets and activate your listing."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Transfer Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Transfer Details</h2>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transfer To (Email):
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border border-blue-300 text-blue-900 font-mono text-lg">
                  {listing.escrowEmail}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(listing.escrowEmail || "")}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transfer Code (Include in Message/Notes):
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border border-purple-300 text-purple-900 font-mono text-2xl font-bold">
                  {listing.transferCode}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(listing.transferCode || "")}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold"
                >
                  Copy
                </button>
              </div>
              <p className="text-sm text-purple-700 mt-2">
                ⚠️ Important: Include this code so we can match the transfer to your listing
              </p>
            </div>
          </div>
        </div>

        {/* Platform-Specific Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Step-by-Step Instructions for {listing.ticketType}
          </h2>

          <ol className="space-y-3">
            {instructions.steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  {index + 1}
                </span>
                <span className="text-gray-700 pt-1">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">💡 Tips:</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              {instructions.tips.map((tip, index) => (
                <li key={index} className="flex gap-2">
                  <span>•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What Happens Next?</h2>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="text-2xl">📧</div>
              <div>
                <h3 className="font-semibold text-gray-900">1. We receive your transfer</h3>
                <p className="text-sm text-gray-600">
                  Our system monitors the escrow email for incoming transfers
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-2xl">🔍</div>
              <div>
                <h3 className="font-semibold text-gray-900">2. Verification</h3>
                <p className="text-sm text-gray-600">
                  We verify the tickets match your listing details using your transfer code
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="font-semibold text-gray-900">3. Listing activated</h3>
                <p className="text-sm text-gray-600">
                  Your listing goes live and buyers can purchase with confidence
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-2xl">💰</div>
              <div>
                <h3 className="font-semibold text-gray-900">4. Sale & transfer to buyer</h3>
                <p className="text-sm text-gray-600">
                  When sold, we transfer the tickets to the buyer and release funds to you
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href={`/listings/${id}`}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold text-center"
          >
            View My Listing
          </Link>
          <Link
            href="/listings/my-listings"
            className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold"
          >
            My Listings
          </Link>
        </div>
      </div>
    </div>
  )
}
