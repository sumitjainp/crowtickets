"use client"

import { useState, useEffect, useRef } from "react"
import { formatDateTime } from "@/lib/utils"

type Message = {
  id: string
  content: string
  createdAt: Date | string
  sender: {
    id: string
    name: string
    role: string
  }
}

type Props = {
  disputeId: string
  initialMessages: Message[]
  currentUserId: string
}

export default function DisputeMessages({
  disputeId,
  initialMessages,
  currentUserId,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/disputes/${disputeId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to send message")
      }

      const message = await response.json()
      setMessages([...messages, message])
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      setError(
        error instanceof Error ? error.message : "Failed to send message"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold">Dispute Messages</h2>
        <p className="text-sm text-gray-600 mt-1">
          Communicate with the other party and admin to resolve this dispute
        </p>
      </div>

      {/* Messages List */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-3">💬</div>
            <p>No messages yet. Start the conversation below.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender.id === currentUserId
              const isAdmin = message.sender.role === "ADMIN"

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isAdmin
                        ? "bg-purple-50 border border-purple-200"
                        : isOwnMessage
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 border border-gray-200"
                    } rounded-lg p-4`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-sm font-semibold ${
                          isAdmin
                            ? "text-purple-900"
                            : isOwnMessage
                            ? "text-blue-900"
                            : "text-gray-900"
                        }`}
                      >
                        {message.sender.name}
                        {isAdmin && " (Admin)"}
                        {isOwnMessage && " (You)"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-6 border-t bg-gray-50">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !newMessage.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {newMessage.length}/1000 characters
          </p>
        </form>
      </div>
    </div>
  )
}
