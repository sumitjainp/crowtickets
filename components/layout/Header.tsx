import Link from 'next/link'
import UserMenu from './UserMenu'
import { CrowLogoWithText } from '../CrowLogo'

export default function Header() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <CrowLogoWithText size="sm" />
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/listings" className="text-gray-700 hover:text-gray-900 font-medium">
              Browse
            </Link>
            <Link href="/listings/create" className="text-gray-700 hover:text-gray-900 font-medium">
              Sell
            </Link>
            <Link href="/transactions" className="text-gray-700 hover:text-gray-900 font-medium">
              Transactions
            </Link>
          </nav>

          <UserMenu />
        </div>
      </div>
    </header>
  )
}
