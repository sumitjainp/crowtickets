"use client"

import { useState } from "react"

interface CopyButtonProps {
  text: string
  label?: string
  variant?: "blue" | "purple"
}

export default function CopyButton({ text, label = "Copy", variant = "blue" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const bgColor = variant === "purple" ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-2 ${bgColor} text-white rounded text-sm font-semibold transition-colors`}
    >
      {copied ? "✓ Copied!" : label}
    </button>
  )
}
