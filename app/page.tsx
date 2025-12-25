import Link from "next/link";
import CrowLogo from "@/components/CrowLogo";

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <CrowLogo size="xl" className="text-gray-900" />
            </div>
            <h1 className="text-5xl font-bold mb-6 text-gray-900">
              Secure Escrow, Simply Done
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Crow protects your ticket transactions with escrow.
              Buy and sell with confidence. Zero scams, zero fraud.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/listings"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
              >
                Browse Tickets
              </Link>
              <Link
                href="/listings/create"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
              >
                Sell Your Tickets
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">List Your Ticket</h3>
              <p className="text-gray-600">
                Sellers upload their ticket and set a price. Your ticket is securely stored in escrow.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Buyer Purchases</h3>
              <p className="text-gray-600">
                Payment is held in secure escrow. Buyer receives the ticket immediately after payment.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Release</h3>
              <p className="text-gray-600">
                Funds released to seller after buyer confirms receipt or event date passes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Crow?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">🔒 Secure Escrow</h3>
              <p className="text-gray-600">
                Your money is protected until the ticket is verified and delivered.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">✓ Verified Tickets</h3>
              <p className="text-gray-600">
                All tickets are checked to prevent double-selling and fraud.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">⚡ Instant Delivery</h3>
              <p className="text-gray-600">
                Get your tickets immediately after payment confirmation.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">🛡️ Buyer Protection</h3>
              <p className="text-gray-600">
                Built-in dispute resolution system to handle any issues.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of buyers and sellers using Crow
          </p>
          <Link
            href="/auth/signup"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition inline-block"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
