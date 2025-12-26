# Third-Party Services & Products Guide
**Project:** CrowTickets Escrow App
**Last Updated:** December 25, 2025

---

## 📦 Complete Service Stack

This document explains every third-party service and product used in the CrowTickets application, what each does, why we need it, and how they work together.

---

## 🌐 Hosting & Infrastructure

### 1. **Vercel**
**Website:** https://vercel.com
**What it is:** Cloud hosting platform optimized for Next.js applications

**What we use it for:**
- Hosting our production application
- Automatic deployments when code is pushed to GitHub
- Edge network for fast global delivery
- SSL certificates (HTTPS) automatically configured
- Environment variable management
- Build and deployment logs

**Why we need it:**
- Makes the app accessible on the internet 24/7
- Handles scaling automatically as traffic increases
- Provides fast performance worldwide
- Free tier is generous for our needs

**Cost:** Free tier (we're using this)

**Our Setup:**
- Project: `crowtickets-f9fu`
- URL: `https://crowtickets-f9fu.vercel.app`
- Connected to GitHub for auto-deployment

---

### 2. **GitHub**
**Website:** https://github.com
**What it is:** Version control and code hosting platform

**What we use it for:**
- Storing all our source code
- Version history (track changes over time)
- Triggering automatic deployments to Vercel
- Code backup and collaboration

**Why we need it:**
- Never lose code - everything is backed up
- Can revert to previous versions if something breaks
- Vercel requires it for automatic deployments
- Industry standard for code management

**Cost:** Free (public repository)

**Our Setup:**
- Repository: `github.com/sumitjainp/crowtickets`
- Branch: `main`
- Authentication: SSH key

---

### 3. **GoDaddy**
**Website:** https://godaddy.com
**What it is:** Domain registrar and DNS management service

**What we use it for:**
- Purchased domain: `crowtickets.com`
- DNS management (directing email traffic)
- MX records for email routing
- CNAME records for email authentication

**Why we need it:**
- Own a professional domain name
- Control where emails are delivered
- Configure email security (SPF, DKIM)

**Cost:** ~$10-15/year for domain registration

**Our Setup:**
- Domain: `crowtickets.com`
- MX Record: Points `escrow.crowtickets.com` to SendGrid
- CNAME Records: Email authentication for SendGrid

---

## 💳 Payment Processing

### 4. **Stripe**
**Website:** https://stripe.com
**What it is:** Payment processing platform

**What we use it for:**
- Processing credit card payments from buyers
- Holding funds in escrow
- Releasing payments to sellers
- Processing refunds when needed
- Taking platform fees (5% commission)

**Why we need it:**
- Can't process credit cards ourselves (requires complex compliance)
- Industry-leading security (PCI compliant)
- Built-in fraud detection
- Supports escrow-style payment flows

**Cost:** 2.9% + $0.30 per transaction (Stripe's fee)

**Our Setup:**
- Mode: Test mode (using test API keys)
- API Version: `2025-12-15.clover`
- Integration: Direct API + React Stripe.js for frontend

**Key Features We Use:**
- **Payment Intents:** Secure payment collection
- **Metadata:** Attach transaction IDs to payments
- **Refunds:** Return money to buyers
- **Connected Accounts:** (Future) Pay sellers directly

---

## 📧 Email Services

### 5. **SendGrid**
**Website:** https://sendgrid.com
**What it is:** Email delivery and receiving platform

**What we use it for:**
- **Inbound Parse:** Receiving emails sent to `escrow+platform@crowtickets.com`
- Parsing email content to extract ticket transfer codes
- Forwarding parsed email data to our webhook endpoint

**Why we need it:**
- Can't receive emails directly to our app
- Handles email deliverability and spam filtering
- Parses email format into structured JSON data
- Reliable email infrastructure

**Cost:** Free tier (100 emails/day)

**Our Setup:**
- Subdomain: `escrow.crowtickets.com`
- Inbound Parse Webhook: `https://crowtickets-f9fu.vercel.app/api/email/webhook`
- Email addresses:
  - `escrow+ticketmaster@crowtickets.com`
  - `escrow+stubhub@crowtickets.com`
  - `escrow+seatgeek@crowtickets.com`
  - And more...

**How it works:**
1. User forwards ticket transfer email to `escrow+ticketmaster@crowtickets.com`
2. GoDaddy DNS routes email to SendGrid's mail server
3. SendGrid parses the email (extracts sender, subject, body)
4. SendGrid sends parsed data as JSON to our webhook
5. Our app extracts transfer code and verifies the listing

---

## 🗄️ Database

### 6. **Neon** ⭐ NEW
**Website:** https://neon.tech
**What it is:** Serverless PostgreSQL database platform

**What we use it for:**
- Production database hosting
- Storing all application data:
  - User accounts
  - Listings
  - Transactions
  - Disputes
  - Messages
  - Reviews

**Why we need it:**
- Need permanent storage for all app data
- Serverless architecture (auto-scales, auto-suspends)
- Perfect match for Vercel + Next.js
- Database branching for dev/staging/production
- Cost-effective (only pay for what you use)

**Cost:**
- Free tier: 0.5GB storage (what we're using now)
- Pro tier: $19/month when we need more

**Our Setup:**
- Project: `crowtickets-production`
- Region: US East (N. Virginia)
- PostgreSQL Version: 17
- Connection: Pooled connection for serverless
- Database: `neondb`

**Why Neon over alternatives:**
- ✅ Built for serverless (Vercel/Next.js)
- ✅ Auto-scaling and auto-suspend (saves money)
- ✅ Database branching (dev/staging/prod copies)
- ✅ Best pricing for our use case
- ✅ Fast cold starts
- ✅ Modern architecture

**Key Features:**
- **Serverless:** No always-on servers, scales to zero
- **Branching:** Create database copies instantly for testing
- **Connection Pooling:** Handles serverless connection limits
- **Autoscaling:** Compute scales with traffic
- **Point-in-time Recovery:** Restore to any moment

---

### 7. **Prisma**
**Website:** https://prisma.io
**What it is:** Database ORM (Object-Relational Mapping) toolkit

**What we use it for:**
- Defining database structure (schema)
- Generating TypeScript types from database schema
- Querying database with type-safe code
- Running database migrations

**Why we need it:**
- Makes database code safer and easier to write
- Prevents SQL injection vulnerabilities
- Auto-generates TypeScript types
- Better developer experience than raw SQL

**Cost:** Free (open source)

**Our Setup:**
- Schema: `prisma/schema.prisma`
- Database: PostgreSQL (Neon)
- Client: Auto-generated with `prisma generate`
- Migrations: Version-controlled schema changes

---

## 🔐 Authentication

### 8. **NextAuth.js**
**Website:** https://next-auth.js.org
**What it is:** Authentication library for Next.js

**What we use it for:**
- User registration and login
- Session management (keeping users logged in)
- Password hashing with bcrypt
- Protected API routes
- Role-based access control (admin vs regular users)

**Why we need it:**
- Building auth from scratch is complex and error-prone
- Handles security best practices automatically
- Built specifically for Next.js
- Supports multiple auth methods

**Cost:** Free (open source)

**Our Setup:**
- Provider: Credentials (email + password)
- Session Strategy: JWT tokens
- Password Hashing: bcryptjs

---

## ⚛️ Frontend Framework

### 9. **Next.js**
**Website:** https://nextjs.org
**What it is:** React framework for web applications

**What we use it for:**
- Building the entire user interface
- Server-side rendering (faster page loads)
- API routes (backend endpoints)
- File-based routing
- Image optimization

**Why we need it:**
- More powerful than plain React
- Better SEO and performance
- Built-in API routes (don't need separate backend)
- Excellent developer experience

**Cost:** Free (open source)

**Our Setup:**
- Version: 16.0.10
- App Router (new architecture)
- TypeScript for type safety

---

### 10. **React**
**Website:** https://react.dev
**What it is:** JavaScript library for building user interfaces

**What we use it for:**
- Component-based UI development
- All frontend pages and components
- State management
- Interactive forms and buttons

**Why we need it:**
- Industry-standard UI library
- Component reusability
- Large ecosystem
- Required by Next.js

**Cost:** Free (open source)

**Our Setup:**
- Version: 19.2.1
- Used through Next.js

---

### 11. **Tailwind CSS**
**Website:** https://tailwindcss.com
**What it is:** Utility-first CSS framework

**What we use it for:**
- Styling all UI components
- Responsive design (mobile, tablet, desktop)
- Consistent design system
- Fast styling without writing custom CSS

**Why we need it:**
- Faster than writing custom CSS
- Consistent styling across the app
- Built-in responsive utilities
- Small production bundle size

**Cost:** Free (open source)

**Our Setup:**
- Version: 4
- PostCSS configuration
- Custom color schemes

---

## 🔧 Development Tools

### 12. **TypeScript**
**Website:** https://typescriptlang.org
**What it is:** Typed superset of JavaScript

**What we use it for:**
- Type checking during development
- Catching bugs before runtime
- Better IDE autocomplete
- Code documentation through types

**Why we need it:**
- Prevents many common JavaScript bugs
- Makes refactoring safer
- Better developer experience
- Industry best practice

**Cost:** Free (open source)

**Our Setup:**
- Strict mode enabled
- All `.ts` and `.tsx` files

---

### 13. **Zod**
**Website:** https://zod.dev
**What it is:** TypeScript-first schema validation library

**What we use it for:**
- Validating API request data
- Ensuring data matches expected format
- Runtime type checking
- Error messages for invalid data

**Why we need it:**
- Can't trust user input
- Prevents invalid data from reaching database
- Type-safe validation
- Better error messages

**Cost:** Free (open source)

**Our Setup:**
- Used in all API routes
- Validates request bodies

---

### 14. **bcryptjs**
**Website:** https://www.npmjs.com/package/bcryptjs
**What it is:** Password hashing library

**What we use it for:**
- Hashing passwords before storing in database
- Comparing hashed passwords during login

**Why we need it:**
- Never store passwords in plain text
- Industry-standard hashing algorithm
- Protects user passwords even if database is leaked

**Cost:** Free (open source)

**Our Setup:**
- 10 salt rounds
- Used in registration and login

---

## 🎨 UI Components

### 15. **Stripe Elements / React Stripe.js**
**Website:** https://stripe.com/docs/stripe-js/react
**What it is:** Pre-built payment UI components from Stripe

**What we use it for:**
- Secure credit card input forms
- PCI-compliant payment collection
- Card validation and error handling

**Why we need it:**
- Can't handle credit card data directly (PCI compliance)
- Secure, tested components
- Handles complex payment flows

**Cost:** Free (included with Stripe)

**Our Setup:**
- CardElement for payment forms
- Elements provider for context

---

## 📊 Service Dependency Map

```
User Browser
    ↓
[Vercel] ← [GitHub] (auto-deployment)
    ↓
[Next.js App]
    ↓
├─ [NextAuth.js] (authentication)
├─ [Prisma] → [Neon PostgreSQL] (data storage)
├─ [Stripe API] (payments)
└─ [SendGrid Webhook] ← [Email] ← [GoDaddy DNS]
```

---

## 💰 Cost Breakdown

| Service | Current Cost | Production Cost (Est.) |
|---------|-------------|----------------------|
| Vercel | Free | Free (or $20/mo Pro) |
| GitHub | Free | Free |
| GoDaddy | $12/year | $12/year |
| Stripe | Free (test mode) | 2.9% + $0.30 per transaction |
| SendGrid | Free | Free (up to 100 emails/day) |
| **Neon** | **Free** | **$19/mo when scaling needed** |
| Next.js | Free | Free |
| React | Free | Free |
| Tailwind | Free | Free |
| TypeScript | Free | Free |
| Prisma | Free | Free |
| Zod | Free | Free |
| NextAuth.js | Free | Free |
| bcryptjs | Free | Free |
| Stripe.js | Free | Free |

**Total Monthly Cost (Production - Current Scale):**
- Fixed: ~$1/month (just domain, Neon free tier)
- Variable: 2.9% + $0.30 per transaction (Stripe fees)

**Total Monthly Cost (After Scaling):**
- Fixed: ~$20/month ($19 Neon + $1 domain)
- Variable: 2.9% + $0.30 per transaction (Stripe fees)

---

## 🔗 Service Integration Flow

### User Creates a Listing
1. **Frontend (React/Next.js)** → Renders form
2. **User** → Enters ticket details
3. **API Route (Next.js)** → Receives data
4. **Zod** → Validates data format
5. **Prisma** → Saves to **Neon PostgreSQL**
6. **Email generated:** `escrow+ticketmaster@crowtickets.com`

### User Makes a Payment
1. **Frontend (React Stripe.js)** → Collects card info securely
2. **Stripe** → Tokenizes card data
3. **API Route** → Creates Payment Intent
4. **Stripe API** → Charges card
5. **Prisma** → Creates transaction in **Neon PostgreSQL**
6. **Funds held** in escrow by **Stripe**

### Seller Forwards Transfer Email
1. **Seller** → Forwards email to `escrow+ticketmaster@crowtickets.com`
2. **GoDaddy DNS** → Routes to **SendGrid**
3. **SendGrid** → Parses email content
4. **SendGrid Webhook** → POSTs to **Vercel** endpoint
5. **API Route** → Extracts transfer code
6. **Prisma** → Updates listing to VERIFIED in **Neon PostgreSQL**

### Releasing Funds
1. **API Route** → Checks if verified + time passed
2. **Stripe API** → Releases payment to seller
3. **Prisma** → Updates transaction to COMPLETED in **Neon PostgreSQL**

---

## 🎓 Understanding the Stack

### Why So Many Services?

Each service specializes in one thing and does it really well:

- **Vercel** → Hosting (don't need to manage servers)
- **GitHub** → Code backup (don't lose work)
- **Stripe** → Payments (legally required, extremely complex)
- **SendGrid** → Email (deliverability is hard)
- **Neon** → Database (serverless, auto-scaling, cost-effective)
- **Next.js/React** → UI (modern web development)

### What Could We Self-Host?

**Theoretically:**
- PostgreSQL (but Neon is easier and cheaper at scale)
- Email server (but deliverability is terrible)

**Never Self-Host:**
- Payment processing (PCI compliance costs millions)
- Domain registration (need registrar access)

### What's Free Forever?

- Vercel (hobby tier)
- GitHub (public repos)
- Next.js/React/TypeScript/etc (open source)
- SendGrid (up to 100 emails/day)
- Stripe API (only pay transaction fees)
- Neon (free tier 0.5GB)

### What Will Cost Money in Production?

- Neon database (~$19/month when we exceed free tier)
- Domain renewal (~$12/year)
- Stripe transaction fees (2.9% + $0.30)
- Potentially Vercel Pro if we exceed free limits

---

## 📚 Learning Resources

### For Each Service:

- **Vercel:** https://vercel.com/docs
- **Next.js:** https://nextjs.org/docs
- **Stripe:** https://stripe.com/docs
- **Neon:** https://neon.tech/docs/introduction
- **Prisma:** https://www.prisma.io/docs
- **SendGrid:** https://docs.sendgrid.com
- **NextAuth.js:** https://next-auth.js.org/getting-started/introduction
- **Tailwind CSS:** https://tailwindcss.com/docs

---

*Last Updated: December 25, 2025*
*Total Services: 15 (Neon added today)*
*Status: All services configured and operational ✅*
