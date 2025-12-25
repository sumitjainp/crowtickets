# CrowTickets.com Email Setup Guide

This guide provides step-by-step instructions to set up email automation for **crowtickets.com**.

---

## 📧 Your Escrow Email Addresses

Once configured, these will be your escrow email addresses:

- `escrow+ticketmaster@crowtickets.com`
- `escrow+axs@crowtickets.com`
- `escrow+stubhub@crowtickets.com`
- `escrow+seatgeek@crowtickets.com`
- `escrow+vividseats@crowtickets.com`
- `escrow+gametime@crowtickets.com`

---

## Step-by-Step Setup

### Step 1: Purchase Domain (If Not Done)

1. Go to domain registrar (Namecheap, GoDaddy, Google Domains, etc.)
2. Purchase `crowtickets.com`
3. Wait for domain to be active (usually instant)

**Estimated Time:** 5-10 minutes
**Cost:** $10-15/year

---

### Step 2: Create SendGrid Account

1. Go to https://signup.sendgrid.com/
2. Sign up for **Free Plan** (100 emails/day - more than enough to start)
3. Verify your email address
4. Complete profile setup

**Estimated Time:** 5 minutes
**Cost:** FREE

---

### Step 3: Configure SendGrid Inbound Parse

1. Log into SendGrid dashboard
2. Go to **Settings** → **Inbound Parse**
3. Click **"Add Host & URL"**
4. Fill in the form:

   ```
   Subdomain: escrow
   Domain: crowtickets.com
   Destination URL: https://crowtickets.vercel.app/api/email/webhook

   ✓ Check "POST the raw, full MIME message"
   ```

5. Click **"Add"**
6. SendGrid will show you the MX record you need to add

**Estimated Time:** 3 minutes

---

### Step 4: Add DNS Records

**Where:** Your domain registrar (where you bought crowtickets.com)

**What to add:**

#### MX Record for Email Receiving:
```
Type: MX
Host: escrow (or escrow.crowtickets.com)
Points to: mx.sendgrid.net
Priority: 10
TTL: 3600 (or Auto/Automatic)
```

#### Example for Common Registrars:

**Namecheap:**
1. Go to Domain List → Manage
2. Click "Advanced DNS"
3. Click "Add New Record"
4. Select "MX Record"
5. Fill in values above

**GoDaddy:**
1. Go to My Products → Domains
2. Click "DNS" next to your domain
3. Click "Add" under Records
4. Select "MX" type
5. Fill in values above

**Google Domains:**
1. Go to My Domains
2. Click "DNS" for crowtickets.com
3. Scroll to "Custom resource records"
4. Add MX record with values above

**Estimated Time:** 5 minutes
**Propagation Time:** 5 minutes - 48 hours (usually under 30 minutes)

---

### Step 5: Deploy to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy your app:**
   ```bash
   # From your project directory
   cd /Users/sumitjain/escrow-app
   vercel
   ```

4. **Set up environment variables in Vercel:**
   ```bash
   # Go to your project settings on vercel.com
   # Settings → Environment Variables
   # Add these:

   ESCROW_EMAIL_DOMAIN = crowtickets.com
   DATABASE_URL = your-production-postgres-url
   NEXTAUTH_URL = https://crowtickets.vercel.app
   NEXTAUTH_SECRET = your-production-secret
   STRIPE_SECRET_KEY = sk_live_your_live_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_your_live_key
   ```

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

**Your app will be at:** `https://crowtickets.vercel.app`

**Estimated Time:** 10-15 minutes

---

### Step 6: Update SendGrid with Production URL

1. Go back to SendGrid → Inbound Parse
2. Edit the parse webhook
3. Update Destination URL to: `https://crowtickets.vercel.app/api/email/webhook`
4. Save changes

**Estimated Time:** 2 minutes

---

### Step 7: Test the Setup

#### Test 1: DNS Propagation
```bash
# Check if MX record is set up
dig MX escrow.crowtickets.com

# Should show: mx.sendgrid.net
```

#### Test 2: Send Test Email
1. Create a listing on your app (https://crowtickets.vercel.app)
2. Select "Platform Transfer" → "Ticketmaster"
3. Note the transfer code (e.g., `TM-ABC123`)
4. Send email to `escrow+ticketmaster@crowtickets.com` with:
   ```
   Subject: Test transfer
   Body: Transfer Code: TM-ABC123
   ```
5. Check listing status - should change to VERIFIED

#### Test 3: Check Logs
```bash
# View Vercel logs
vercel logs

# Look for:
# "📧 Received email"
# "✅ Webhook processed successfully"
```

---

### Step 8: Custom Domain (Optional)

If you want to use `crowtickets.com` instead of `crowtickets.vercel.app`:

1. In Vercel dashboard, go to Settings → Domains
2. Add `crowtickets.com`
3. Add DNS records shown by Vercel:
   ```
   A Record:
   Host: @
   Points to: 76.76.21.21

   CNAME Record:
   Host: www
   Points to: cname.vercel-dns.com
   ```
4. Wait for verification (5-30 minutes)
5. Update NEXTAUTH_URL to `https://crowtickets.com`

---

## 🔍 Troubleshooting

### Email not being received?

**Check 1: DNS Propagation**
```bash
dig MX escrow.crowtickets.com
```
If no result, DNS hasn't propagated yet. Wait 1-24 hours.

**Check 2: SendGrid Activity**
- Go to SendGrid → Activity
- Look for inbound parse events
- Check if emails are arriving but webhook is failing

**Check 3: Webhook Logs**
```bash
vercel logs --follow
```
Look for errors in webhook processing.

**Check 4: Test Locally First**
```bash
# Test the webhook directly
curl -X POST https://crowtickets.vercel.app/api/email/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "escrow+ticketmaster@crowtickets.com",
    "subject": "Test",
    "text": "Transfer Code: TM-TEST123"
  }'
```

### Listing not being verified?

1. Check transfer code matches exactly
2. Check listing exists with that transfer code
3. Check email contains transfer code in body
4. Look at TicketTransfer table for failed transfers:
   ```sql
   SELECT * FROM TicketTransfer WHERE verificationStatus = 'FAILED';
   ```

---

## 📊 Success Checklist

- [ ] Domain purchased: crowtickets.com
- [ ] SendGrid account created (free tier)
- [ ] Inbound Parse configured in SendGrid
- [ ] MX record added to DNS
- [ ] DNS propagated (test with `dig`)
- [ ] App deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] SendGrid webhook points to production URL
- [ ] Test email sent and processed
- [ ] Listing verified automatically
- [ ] Production database connected (PostgreSQL)
- [ ] Stripe live keys configured

---

## 🎯 Quick Reference

**Your App:** https://crowtickets.vercel.app (or https://crowtickets.com)
**Webhook Endpoint:** https://crowtickets.vercel.app/api/email/webhook
**Escrow Emails:** escrow+[platform]@crowtickets.com
**SendGrid Dashboard:** https://app.sendgrid.com/
**Vercel Dashboard:** https://vercel.com/dashboard

---

## 💰 Costs Summary

- **Domain:** $10-15/year (one-time)
- **SendGrid:** FREE (up to 100 emails/day)
- **Vercel:** FREE (hobby tier)
- **PostgreSQL:** $0-5/month (Vercel Postgres free tier or Supabase)

**Total to get started:** ~$12/year

---

## 🚀 Next Steps After Email is Working

1. Set up email notifications for sellers
2. Implement buyer transfer system
3. Add more platform parsers (SeatGeek, Vivid Seats)
4. Set up monitoring (Sentry for errors)
5. Add PDF upload system
6. Configure auto-release cron job
7. Set up analytics

---

## 📞 Support

If you get stuck:
1. Check Vercel logs: `vercel logs`
2. Check SendGrid Activity dashboard
3. Test webhook directly with curl
4. Check DNS propagation
5. Review TicketTransfer table for errors

Good luck! 🎫
