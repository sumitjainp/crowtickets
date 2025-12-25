import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">TicketEscrow</h3>
            <p className="text-gray-600 text-sm">
              Secure escrow service for buying and selling tickets and digital goods.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/listings" className="hover:text-blue-600">Browse Tickets</Link></li>
              <li><Link href="/listings/create" className="hover:text-blue-600">Sell Tickets</Link></li>
              <li><Link href="/how-it-works" className="hover:text-blue-600">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/help" className="hover:text-blue-600">Help Center</Link></li>
              <li><Link href="/safety" className="hover:text-blue-600">Safety Tips</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/terms" className="hover:text-blue-600">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} TicketEscrow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
