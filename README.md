# TicketEscrow - Secure Ticket Marketplace

A full-stack escrow service for buying and selling digital tickets and goods, built with Next.js 14, TypeScript, and PostgreSQL.

## Features Completed

### Phase 1: Project Setup ✅
- Next.js 14 with TypeScript and Tailwind CSS
- PostgreSQL database with Prisma ORM
- Complete database schema (7 models)
- Professional landing page
- Responsive layout with Header and Footer

### Phase 2: Authentication System ✅
- NextAuth.js integration with JWT sessions
- Email/password authentication
- User registration with automatic profile creation
- Sign in and sign up pages
- Protected route middleware
- User dropdown menu with navigation
- Session management
- Role-based access control (BUYER/SELLER/ADMIN)

### Phase 3: Core Listing System ✅
- Complete CRUD API for listings
- Create listing page with comprehensive form
- Browse listings page with grid layout
- Individual listing detail page
- My Listings dashboard for sellers
- Listing status management (ACTIVE/SOLD/EXPIRED/REMOVED)
- Seller information and ratings display
- Price and event date formatting

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe (to be integrated)
- **File Storage**: Vercel Blob / AWS S3 (to be integrated)

## Database Schema

- **User** - User accounts with authentication
- **UserProfile** - Extended user information and ratings
- **Listing** - Ticket listings for sale
- **Transaction** - Escrow transactions
- **Review** - User reviews and ratings
- **Dispute** - Dispute resolution system
- **Message** - Dispute messaging

## Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or remote)

### Installation

1. Navigate to the project directory:
```bash
cd /Users/sumitjain/escrow-app
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Set up environment variables:
- Review `.env.local` and update as needed
- Generate a new `NEXTAUTH_SECRET` if needed: `openssl rand -base64 32`

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
escrow-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── auth/          # Authentication endpoints
│   ├── auth/              # Auth pages (signin, signup)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/
│   ├── layout/            # Layout components (Header, Footer, UserMenu)
│   └── providers/         # React context providers
├── lib/
│   ├── prisma.ts          # Prisma client
│   ├── auth.ts            # NextAuth configuration
│   ├── auth-helpers.ts    # Auth utility functions
│   └── utils.ts           # General utilities
├── prisma/
│   └── schema.prisma      # Database schema
├── types/
│   └── next-auth.d.ts     # NextAuth type definitions
└── middleware.ts          # Route protection middleware
```

## Environment Variables

Required environment variables (see `.env.local`):

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - App URL (http://localhost:3000 for dev)
- `NEXTAUTH_SECRET` - Secret for JWT encryption
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key (Phase 4)
- `STRIPE_SECRET_KEY` - Stripe secret key (Phase 4)

## What's Next

### Phase 3: Core Listing System
- Create and manage ticket listings
- File upload for ticket PDFs/images
- Browse and search listings
- Listing detail pages

### Phase 4: Stripe Escrow Integration
- Payment processing with Stripe
- Escrow fund holding
- Automatic fund release
- Checkout flow

### Phase 5: Transaction Management
- Transaction tracking and status
- Auto-release logic
- Buyer confirmation
- Ticket delivery

### Phase 6-8: Advanced Features
- User profiles and ratings
- Dispute resolution
- Admin dashboard
- Security and validation

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Run database migrations
- `npx prisma generate` - Generate Prisma Client

## Testing the Authentication

1. Go to http://localhost:3000
2. Click "Sign Up" and create an account
3. You'll be automatically signed in
4. Click your profile icon in the header to access the menu
5. Try navigating to protected routes (they'll redirect to sign in if not authenticated)

## Implementation Plan

Full implementation plan available at:
`/Users/sumitjain/.claude/plans/stateless-wobbling-manatee.md`
