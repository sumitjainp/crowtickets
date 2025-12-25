type Props = {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export default function CrowLogo({ size = "md", className = "" }: Props) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${sizes[size]} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Crow silhouette */}
      <path
        d="M50 15C45 15 40 18 38 22L35 28C33 25 30 23 27 23C23 23 20 26 20 30C20 32 21 34 22 35L15 45C13 47 12 50 12 53V60C12 65 16 69 21 69H25C25 75 30 80 36 80H64C70 80 75 75 75 69H79C84 69 88 65 88 60V53C88 50 87 47 85 45L78 35C79 34 80 32 80 30C80 26 77 23 73 23C70 23 67 25 65 28L62 22C60 18 55 15 50 15Z"
        fill="currentColor"
      />
      {/* Eye */}
      <circle cx="42" cy="35" r="3" fill="white" />
      <circle cx="42" cy="35" r="1.5" fill="black" />
      {/* Beak */}
      <path
        d="M35 42L28 45L35 48Z"
        fill="#FFA500"
      />
      {/* Wing detail */}
      <path
        d="M55 50C55 50 60 55 65 58C70 61 75 62 75 62"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CrowLogoWithText({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  }

  return (
    <div className="flex items-center gap-3">
      <CrowLogo size={size} className="text-gray-900" />
      <span className={`font-bold text-gray-900 ${textSizes[size]}`}>
        Crow
      </span>
    </div>
  )
}
