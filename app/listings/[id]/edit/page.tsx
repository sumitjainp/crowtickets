"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "1",
    sellAsGroup: true,
    eventDate: "",
    eventName: "",
    venue: "",
    category: "Ticket",
    cancellationPolicy: "MODERATE",
    ticketType: "PDF",
    ticketPlatform: "TICKETMASTER",
    allowCounterOffers: false,
  })

  useEffect(() => {
    async function fetchListing() {
      try {
        // Unwrap params promise
        const resolvedParams = await params
        const listingId = resolvedParams.id
        setId(listingId)

        const res = await fetch(`/api/listings/${listingId}`)
        const data = await res.json()

        if (!res.ok) {
          setError("Failed to load listing")
          setIsLoading(false)
          return
        }

        // Convert date to datetime-local format
        const eventDate = new Date(data.eventDate)
        const localDate = new Date(eventDate.getTime() - eventDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)

        setFormData({
          title: data.title,
          description: data.description,
          price: data.price.toString(),
          quantity: data.quantity?.toString() || "1",
          sellAsGroup: data.sellAsGroup !== undefined ? data.sellAsGroup : true,
          eventDate: localDate,
          eventName: data.eventName,
          venue: data.venue,
          category: data.category,
          cancellationPolicy: data.cancellationPolicy,
          ticketType: ["TICKETMASTER", "AXS", "STUBHUB", "SEATGEEK", "VIVID_SEATS", "GAMETIME", "OTHER"].includes(data.ticketType) ? "TRANSFER" : "PDF",
          ticketPlatform: ["TICKETMASTER", "AXS", "STUBHUB", "SEATGEEK", "VIVID_SEATS", "GAMETIME", "OTHER"].includes(data.ticketType) ? data.ticketType : "TICKETMASTER",
          allowCounterOffers: data.allowCounterOffers || false,
        })
        setIsLoading(false)
      } catch (err) {
        setError("Failed to load listing")
        setIsLoading(false)
      }
    }

    fetchListing()
  }, [])

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
    setIsSaving(true)

    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          sellAsGroup: formData.sellAsGroup,
          eventDate: new Date(formData.eventDate).toISOString(),
          ticketType: formData.ticketType,
          ticketPlatform: formData.ticketPlatform,
          allowCounterOffers: formData.allowCounterOffers,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to update listing")
        setIsSaving(false)
        return
      }

      // Redirect based on ticket type
      if (formData.ticketType === "TRANSFER") {
        router.push(`/listings/${id}/transfer-instructions`)
      } else {
        router.push(`/listings/${id}`)
      }
      router.refresh()
    } catch (error) {
      setError("Something went wrong. Please try again.")
      setIsSaving(false)
    }
  }

  if (isLoading || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/listings" className="text-blue-600 hover:text-blue-700">
            ← Back to Listings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-200px)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/listings/${id}`}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
          >
            ← Back to Listing
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Your Listing
          </h1>
          <p className="mt-2 text-gray-600">
            Update your ticket listing details
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

          {/* Platform Selection */}
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
              />
              <p className="mt-1 text-sm text-gray-500">
                Number of tickets (1-10)
              </p>
            </div>
          </div>

          {/* Sell as Group option - only show if quantity > 1 */}
          {parseInt(formData.quantity) > 1 && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                id="sellAsGroup"
                name="sellAsGroup"
                checked={formData.sellAsGroup}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="sellAsGroup" className="block text-sm font-medium text-gray-900 cursor-pointer">
                  🎫 Sell All Tickets Together
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  If checked, buyers must purchase all {formData.quantity} tickets at once. Uncheck to allow individual ticket purchases.
                </p>
              </div>
            </div>
          )}

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
              <option value="MODERATE">⚖️ Moderate - Partial refunds until 24hrs before event</option>
              <option value="FLEXIBLE">✅ Flexible - Most buyer-friendly</option>
            </select>
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
            />
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

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href={`/listings/${id}`}
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
