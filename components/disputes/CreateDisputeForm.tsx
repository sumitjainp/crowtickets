"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Props = {
  transactionId: string
  listingTitle: string
}

export default function CreateDisputeForm({
  transactionId,
  listingTitle,
}: Props) {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/disputes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId,
          reason,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create dispute")
      }

      const dispute = await response.json()
      router.push(`/disputes/${dispute.id}`)
    } catch (error) {
      console.error("Error creating dispute:", error)
      setError(
        error instanceof Error ? error.message : "Failed to create dispute"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Describe the Issue <span className="text-red-500">*</span>
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          minLength={10}
          maxLength={1000}
          rows={8}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Please explain in detail what went wrong with this transaction. Include any relevant information that will help us resolve the issue..."
        />
        <p className="text-sm text-gray-500 mt-1">
          {reason.length}/1000 characters (minimum 10)
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Important:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Raising a dispute will freeze this transaction</li>
              <li>An admin will review your case and communicate with both parties</li>
              <li>Be honest and provide all relevant details</li>
              <li>The admin's decision will be final</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading || reason.length < 10}
          className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Submitting..." : "Raise Dispute"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
