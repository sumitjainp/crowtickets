"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function CreateListingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "1",
    eventDate: "",
    eventName: "",
    venue: "",
    category: "Ticket",
    cancellationPolicy: "MODERATE",
    ticketType: "PDF", // PDF or TRANSFER
    ticketPlatform: "TICKETMASTER", // For transfer-based tickets
    allowCounterOffers: false,
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          eventDate: new Date(formData.eventDate).toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create listing")
        setIsLoading(false)
        return
      }

      // Redirect to transfer instructions for transfer-based tickets
      if (formData.ticketType === "TRANSFER") {
        router.push(`/listings/${data.id}/transfer-instructions`)
      } else {
        router.push(`/listings/${data.id}`)
      }
      router.refresh()
    } catch (error) {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/listings"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
          >
            ← Back to Listings
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            List Your Ticket
          </h1>
          <p className="mt-2 text-gray-600">
            Fill out the details below to list your ticket for sale
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow">
          {/* Ticket Delivery Method Selection */}
          <div className="border-b pb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ticket Delivery Method *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, ticketType: "PDF" })}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  formData.ticketType === "PDF"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📄</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">PDF Upload</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Upload your ticket as a PDF or screenshot
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, ticketType: "TRANSFER" })}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  formData.ticketType === "TRANSFER"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🔄</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Platform Transfer</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Transfer from Ticketmaster, AXS, StubHub, etc.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Platform Selection (only show if TRANSFER selected) */}
          {formData.ticketType === "TRANSFER" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label htmlFor="ticketPlatform" className="block text-sm font-medium text-gray-900 mb-2">
                Select Ticket Platform *
              </label>
              <select
                id="ticketPlatform"
                name="ticketPlatform"
                value={formData.ticketPlatform}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="TICKETMASTER">Ticketmaster</option>
                <option value="AXS">AXS</option>
                <option value="STUBHUB">StubHub</option>
                <option value="SEATGEEK">SeatGeek</option>
                <option value="VIVID_SEATS">Vivid Seats</option>
                <option value="GAMETIME">Gametime</option>
                <option value="OTHER">Other Platform</option>
              </select>
              <p className="mt-2 text-sm text-blue-700">
                ℹ️ After listing, you'll receive transfer instructions to our secure escrow account
              </p>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Listing Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 2 Taylor Swift Eras Tour Tickets"
            />
          </div>

          <div>
            <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">
              Event Name *
            </label>
            <input
              type="text"
              id="eventName"
              name="eventName"
              required
              value={formData.eventName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Taylor Swift - The Eras Tour"
            />
          </div>

          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
              Venue *
            </label>
            <input
              type="text"
              id="venue"
              name="venue"
              required
              value={formData.venue}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Madison Square Garden, New York"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
                Event Date *
              </label>
              <input
                type="datetime-local"
                id="eventDate"
                name="eventDate"
                required
                value={formData.eventDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (USD) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                required
                min="1"
                max="10"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="1"
              />
              <p className="mt-1 text-sm text-gray-500">
                Number of tickets (1-10)
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Ticket">Concert Ticket</option>
              <option value="Sports">Sports Event</option>
              <option value="Theater">Theater/Show</option>
              <option value="Festival">Festival Pass</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="cancellationPolicy" className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Policy *
            </label>
            <select
              id="cancellationPolicy"
              name="cancellationPolicy"
              value={formData.cancellationPolicy}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="STRICT">🔒 Strict - No refunds after 24 hours</option>
              <option value="MODERATE">⚖️ Moderate - Partial refunds until 24hrs before event (Recommended)</option>
              <option value="FLEXIBLE">✅ Flexible - Most buyer-friendly, refunds until 24hrs before event</option>
            </select>
            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {formData.cancellationPolicy === "STRICT" && (
                <div>
                  <strong>Strict Policy:</strong> Full refund within 2 hours, 50% within 24 hours, no refunds after. Best for high-demand events.
                </div>
              )}
              {formData.cancellationPolicy === "MODERATE" && (
                <div>
                  <strong>Moderate Policy:</strong> Full refund within 2 hours, 90% up to 24hrs, sliding scale until event. Balanced approach.
                </div>
              )}
              {formData.cancellationPolicy === "FLEXIBLE" && (
                <div>
                  <strong>Flexible Policy:</strong> 90% refund until 7 days before event, 75% until 3 days, 50% until 24hrs before. Most buyer-friendly.
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your ticket(s), section, row, seat numbers, any special notes..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Include details like section, row, seat numbers, and any special features
            </p>
          </div>

          {/* Allow Counter Offers */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <input
              type="checkbox"
              id="allowCounterOffers"
              name="allowCounterOffers"
              checked={formData.allowCounterOffers}
              onChange={handleChange}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="allowCounterOffers" className="block text-sm font-medium text-gray-900 cursor-pointer">
                💬 Allow Counter Offers
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Let buyers propose a different price. You can accept, decline, or counter their offer.
              </p>
            </div>
          </div>

          {/* PDF Upload section (only show if PDF selected) */}
          {formData.ticketType === "PDF" && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">
                📄 PDF/Screenshot Upload (Coming Soon)
              </h3>
              <p className="text-sm text-yellow-700">
                File upload functionality will be added soon. For now, you can create the listing and upload later.
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isLoading ? "Creating..." : "Create Listing"}
            </button>
            <Link
              href="/listings"
              className="px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-semibold"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
