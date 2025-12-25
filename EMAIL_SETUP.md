# Email Automation Setup Guide

This guide explains how to set up email monitoring for automatic ticket transfer verification.

## Overview

The email automation system works as follows:

1. **Seller transfers tickets** → Sends to escrow email (e.g., `escrow+ticketmaster@crow.com`)
2. **Email service receives transfer** → Forwards to webhook endpoint
3. **Parser extracts ticket details** → Matches transfer code to listing
4. **System verifies transfer** → Updates listing status to VERIFIED
5. **Seller gets notified** → Listing becomes active for buyers

---

## Option 1: SendGrid Inbound Parse (RECOMMENDED)

SendGrid is the easiest option for production. It's free for up to 100 emails/day.

### Setup Steps:

1. **Create SendGrid Account**
   - Go to https://sendgrid.com
   - Sign up for free account
   - Verify your email

2. **Set Up Inbound Parse**
   - Navigate to Settings → Inbound Parse
   - Click "Add Host & URL"
   - Configure:
     - **Subdomain**: `escrow` (or any subdomain)
     - **Domain**: Your domain (e.g., `yourdomain.com`)
     - **Destination URL**: `https://yourdomain.com/api/email/webhook`
     - Check "POST the raw, full MIME message"

3. **DNS Configuration**
   - Add MX record to your domain DNS:
     ```
     Type: MX
     Host: escrow.yourdomain.com
     Points to: mx.sendgrid.net
     Priority: 10
     ```

4. **Test Configuration**
   - Send test email to `escrow+ticketmaster@yourdomain.com`
   - Check webhook receives the email
   - Verify parsing works correctly

5. **Environment Variables**
   Add to `.env.local`:
   ```bash
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_INBOUND_DOMAIN=escrow.yourdomain.com
   ```

### Email Addresses After Setup:
- `escrow+ticketmaster@yourdomain.com`
- `escrow+axs@yourdomain.com`
- `escrow+stubhub@yourdomain.com`
- etc.

---

## Option 2: Gmail API (For Development/Testing)

Good for local testing and development. Free but requires more setup.

### Setup Steps:

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create new project: "Escrow Email Monitor"
   - Enable Gmail API

2. **Create OAuth2 Credentials**
   - Go to APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/gmail/callback`
   - Download credentials JSON

3. **Set Up Gmail Filter**
   - Create filter in Gmail:
     - From: `*@ticketmaster.com OR *@axs.com OR *@stubhub.com`
     - To: `your-escrow@gmail.com`
     - Action: Forward to webhook (via Apps Script or third-party service)

4. **Create Gmail Monitor Script**
   ```typescript
   // lib/gmail-monitor.ts
   import { google } from 'googleapis'

   export async function monitorGmail() {
     const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

     // Poll for new messages
     const response = await gmail.users.messages.list({
       userId: 'me',
       q: 'is:unread from:ticketmaster OR from:axs',
     })

     // Process each message
     for (const message of response.data.messages || []) {
       const fullMessage = await gmail.users.messages.get({
         userId: 'me',
         id: message.id,
       })

       // Parse and send to webhook
       await processEmail(fullMessage)

       // Mark as read
       await gmail.users.messages.modify({
         userId: 'me',
         id: message.id,
         requestBody: {
           removeLabelIds: ['UNREAD'],
         },
       })
     }
   }
   ```

5. **Environment Variables**
   Add to `.env.local`:
   ```bash
   GMAIL_CLIENT_ID=your_client_id
   GMAIL_CLIENT_SECRET=your_client_secret
   GMAIL_REFRESH_TOKEN=your_refresh_token
   GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
   ```

6. **Set Up Cron Job**
   - Create Vercel cron job or use node-cron
   - Poll Gmail every 1-5 minutes
   - Process new emails

---

## Option 3: Mailgun (Alternative to SendGrid)

Similar to SendGrid, good for production.

### Setup Steps:

1. **Create Mailgun Account**
   - Go to https://mailgun.com
   - Sign up (free tier: 100 emails/day)

2. **Add Domain**
   - Add your domain in Mailgun dashboard
   - Verify DNS records (MX, TXT, CNAME)

3. **Configure Routes**
   - Go to Receiving → Routes
   - Create route:
     - **Priority**: 0
     - **Filter Expression**: `match_recipient("escrow.*@yourdomain.com")`
     - **Actions**: Forward to URL `https://yourdomain.com/api/email/webhook`
     - **Description**: Escrow email forwarding

4. **Environment Variables**
   Add to `.env.local`:
   ```bash
   MAILGUN_API_KEY=your_mailgun_api_key
   MAILGUN_DOMAIN=mg.yourdomain.com
   ```

---

## Testing the Email Parser

### Method 1: Use Test Endpoint

```bash
# Test with sample Ticketmaster email
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"useSample": "TICKETMASTER"}'

# Test with sample AXS email
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"useSample": "AXS"}'

# Test with custom email
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@ticketmaster.com",
    "to": "escrow+ticketmaster@crow.com",
    "subject": "Tickets transferred",
    "text": "Your tickets have been transferred. Transfer Code: TM-ABC123"
  }'
```

### Method 2: Use Webhook Directly

```bash
# Test webhook with sample email
curl -X POST http://localhost:3000/api/email/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@ticketmaster.com",
    "to": "escrow+ticketmaster@crow.com",
    "subject": "Your Tickets for Taylor Swift have been transferred",
    "text": "Event: Taylor Swift\nVenue: SoFi Stadium\nTransfer Code: TM-ABC123"
  }'
```

### Method 3: Browser Testing

Visit `http://localhost:3000/api/email/test` to see sample emails and usage instructions.

---

## Email Format Requirements

For successful parsing, transfer confirmation emails should include:

### Required Fields:
- **Transfer Code**: Format `XX-XXXXX` (e.g., `TM-ABC123`, `AX-XYZ789`)
  - Should be included by seller in message/notes field when transferring

### Recommended Fields:
- Event name
- Venue
- Event date
- Section, Row, Seat
- Confirmation/Order number
- Sender email
- Quantity

### Example Email Structure:

```
Subject: Tickets transferred: Event Name

Your tickets have been successfully transferred!

Event: Artist Name - Tour Name
Venue: Arena/Stadium Name
Date: Saturday, August 5, 2024 at 7:00 PM
Section: 101
Row: 15
Seats: 1-2

Transfer Code: TM-ABC123

Confirmation #: 45-67890/LOS

Transferred to: escrow+ticketmaster@crow.com
```

---

## Parser Configuration

### Adding New Platform Parsers

1. Create parser class in `/lib/email-parser.ts`:
   ```typescript
   export class NewPlatformParser extends BaseEmailParser {
     platform = 'NEWPLATFORM'

     parse(emailContent: string, emailSubject: string): EmailParserResult {
       // Extract data from email
       return { success: true, data: {...} }
     }
   }
   ```

2. Register in factory:
   ```typescript
   private parsers: Map<string, BaseEmailParser> = new Map([
     ['TICKETMASTER', new TicketmasterParser()],
     ['AXS', new AXSParser()],
     ['NEWPLATFORM', new NewPlatformParser()], // Add here
   ])
   ```

3. Add platform detection:
   ```typescript
   detectPlatform(emailContent: string, emailFrom: string): string {
     // ... existing code ...
     if (from.includes('newplatform') || content.includes('newplatform')) {
       return 'NEWPLATFORM'
     }
   }
   ```

---

## Monitoring and Debugging

### Check Webhook Logs

```bash
# In production (Vercel)
vercel logs

# In development
# Check terminal where `npm run dev` is running
```

### View Transfer Records

```sql
-- Check all transfers
SELECT * FROM TicketTransfer ORDER BY createdAt DESC;

-- Check failed transfers
SELECT * FROM TicketTransfer WHERE verificationStatus = 'FAILED';

-- Check verified transfers
SELECT * FROM TicketTransfer
WHERE verificationStatus = 'VERIFIED'
ORDER BY receivedAt DESC;
```

### Common Issues:

1. **No transfer code found**
   - Seller forgot to include code in message
   - Parser regex doesn't match format
   - Solution: Check email content, update regex pattern

2. **Platform not detected**
   - Email from domain not recognized
   - Solution: Update `detectPlatform()` method

3. **No matching listing**
   - Transfer code doesn't exist in database
   - Typo in transfer code
   - Solution: Check listings table, verify code format

---

## Security Considerations

1. **Webhook Authentication**
   - Add signature verification for production
   - Validate sender IP addresses
   - Rate limit webhook endpoint

2. **Email Validation**
   - Verify emails come from legitimate platforms
   - Check SPF/DKIM records
   - Reject suspicious emails

3. **Data Privacy**
   - Store only necessary email data
   - Encrypt sensitive information
   - Follow GDPR/privacy regulations

---

## Production Checklist

- [ ] Email service configured (SendGrid/Mailgun)
- [ ] DNS records set up correctly
- [ ] Webhook endpoint deployed and accessible
- [ ] HTTPS enabled for webhook URL
- [ ] Environment variables configured
- [ ] Test emails successfully processed
- [ ] Database migrations applied
- [ ] Error monitoring set up (Sentry, etc.)
- [ ] Email notifications configured
- [ ] Backup email storage configured
- [ ] Rate limiting implemented
- [ ] Webhook authentication enabled

---

## Next Steps

After email automation is working:

1. **Add Email Notifications** - Notify sellers when transfers are verified
2. **Build Buyer Transfer System** - Auto-transfer tickets to buyers after payment
3. **Create Admin Dashboard** - View and manage all transfers
4. **Add Manual Verification** - Allow admins to manually verify failed transfers
5. **Implement Retry Logic** - Retry failed parsing attempts
6. **Add Analytics** - Track verification success rates by platform

---

## Support

For issues or questions:
- Check logs in `/tmp/email-webhook-logs`
- Review parsed data in TicketTransfer table
- Test with `/api/email/test` endpoint
- Contact support if emails aren't being received
