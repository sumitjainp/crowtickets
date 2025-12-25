"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Props = {
  transactionId: string
  otherPartyName: string
  isBuyer: boolean
}

export default function ReviewForm({
  transactionId,
  otherPartyName,
  isBuyer,
}: Props) {
  const router = useRouter()
  const [satisfied, setSatisfied] = useState<boolean | null>(null)
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (satisfied === null) {
      setError("Please select if you're satisfied or dissatisfied")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId,
          satisfied,
          comment: comment.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit review")
      }

      setIsSubmitted(true)
      router.refresh()
    } catch (error) {
      console.error("Error submitting review:", error)
      setError(
        error instanceof Error ? error.message : "Failed to submit review"
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-3">✓</div>
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Review Submitted!
        </h3>
        <p className="text-sm text-green-800">
          Thank you for your feedback. Your review helps build trust in our
          community.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        Review {isBuyer ? "seller" : "buyer"}: {otherPartyName}
      </h3>

      {/* Satisfaction Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How was your experience?
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSatisfied(true)}
            className={`p-6 border-2 rounded-lg transition-all ${
              satisfied === true
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-green-300 hover:bg-green-50"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">😊</span>
              <span className="font-semibold text-gray-900">Satisfied</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSatisfied(false)}
            className={`p-6 border-2 rounded-lg transition-all ${
              satisfied === false
                ? "border-red-500 bg-red-50"
                : "border-gray-300 hover:border-red-300 hover:bg-red-50"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">😞</span>
              <span className="font-semibold text-gray-900">Dissatisfied</span>
            </div>
          </button>
        </div>
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Comment (optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={`Share your experience ${
            isBuyer ? "buying from" : "selling to"
          } ${otherPartyName}...`}
        />
        <p className="text-sm text-gray-500 mt-1">
          {comment.length}/1000 characters
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  )
}
