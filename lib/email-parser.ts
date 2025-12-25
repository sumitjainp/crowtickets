/**
 * Email Parser for Ticket Transfer Confirmations
 *
 * This module provides parsers for different ticket platforms to extract
 * transfer details from confirmation emails.
 */

export interface ParsedTicketTransfer {
  transferCode?: string
  platform: string
  eventName?: string
  eventDate?: string
  venue?: string
  section?: string
  row?: string
  seat?: string
  quantity?: number
  confirmationNumber?: string
  barcode?: string
  senderEmail?: string
  receiverEmail?: string
  transferDate?: Date
  rawData?: any
}

export interface EmailParserResult {
  success: boolean
  data?: ParsedTicketTransfer
  error?: string
}

/**
 * Base email parser interface
 */
export abstract class BaseEmailParser {
  abstract platform: string

  /**
   * Parse email content and extract ticket transfer details
   */
  abstract parse(emailContent: string, emailSubject: string): EmailParserResult

  /**
   * Extract transfer code from email body
   * Looks for patterns like "TM-ABC123", "AX-XYZ789", etc.
   */
  protected extractTransferCode(content: string): string | undefined {
    // Match pattern: 2 uppercase letters, hyphen, then alphanumeric
    const codeRegex = /\b([A-Z]{2}-[A-Z0-9]{5,10})\b/g
    const matches = content.match(codeRegex)

    // Return first match if found
    return matches ? matches[0] : undefined
  }

  /**
   * Extract email addresses from content
   */
  protected extractEmails(content: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    return content.match(emailRegex) || []
  }

  /**
   * Extract date from various formats
   */
  protected extractDate(content: string): Date | undefined {
    // Common date patterns in ticket emails
    const datePatterns = [
      /(\w+,?\s+\w+\s+\d{1,2},?\s+\d{4})/i, // January 15, 2024
      /(\d{1,2}\/\d{1,2}\/\d{4})/,          // 1/15/2024
      /(\d{4}-\d{2}-\d{2})/,                // 2024-01-15
    ]

    for (const pattern of datePatterns) {
      const match = content.match(pattern)
      if (match) {
        const date = new Date(match[1])
        if (!isNaN(date.getTime())) {
          return date
        }
      }
    }

    return undefined
  }

  /**
   * Clean and normalize text
   */
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E]/g, '')
      .trim()
  }
}

/**
 * Ticketmaster Email Parser
 */
export class TicketmasterParser extends BaseEmailParser {
  platform = 'TICKETMASTER'

  parse(emailContent: string, emailSubject: string): EmailParserResult {
    try {
      const data: ParsedTicketTransfer = {
        platform: this.platform,
        transferDate: new Date(),
      }

      // Extract transfer code
      data.transferCode = this.extractTransferCode(emailContent)

      // Extract event name from subject or body
      // Ticketmaster subjects often: "Your Tickets for [Event Name] have been transferred"
      const eventMatch = emailSubject.match(/tickets?\s+(?:for|to)\s+([^-]+)/i)
      if (eventMatch) {
        data.eventName = this.cleanText(eventMatch[1])
      } else {
        // Try to find in body
        const bodyEventMatch = emailContent.match(/event:\s*([^\n]+)/i)
        if (bodyEventMatch) {
          data.eventName = this.cleanText(bodyEventMatch[1])
        }
      }

      // Extract venue
      const venueMatch = emailContent.match(/venue:\s*([^\n]+)/i) ||
                        emailContent.match(/location:\s*([^\n]+)/i) ||
                        emailContent.match(/at\s+([A-Z][A-Za-z\s&]+(?:Arena|Stadium|Center|Theatre|Theater|Hall))/i)
      if (venueMatch) {
        data.venue = this.cleanText(venueMatch[1])
      }

      // Extract event date
      const dateMatch = emailContent.match(/date:\s*([^\n]+)/i) ||
                       emailContent.match(/(?:on|date:)\s*(\w+,?\s+\w+\s+\d{1,2},?\s+\d{4})/i)
      if (dateMatch) {
        data.eventDate = this.cleanText(dateMatch[1])
      }

      // Extract seating information
      const sectionMatch = emailContent.match(/section:\s*([^\n,]+)/i)
      if (sectionMatch) {
        data.section = this.cleanText(sectionMatch[1])
      }

      const rowMatch = emailContent.match(/row:\s*([^\n,]+)/i)
      if (rowMatch) {
        data.row = this.cleanText(rowMatch[1])
      }

      const seatMatch = emailContent.match(/seat[s]?:\s*([^\n]+)/i)
      if (seatMatch) {
        data.seat = this.cleanText(seatMatch[1])
      }

      // Extract quantity
      const qtyMatch = emailContent.match(/(\d+)\s+ticket[s]?/i)
      if (qtyMatch) {
        data.quantity = parseInt(qtyMatch[1], 10)
      }

      // Extract confirmation number
      const confirmMatch = emailContent.match(/confirmation[#\s]*:?\s*([A-Z0-9-]+)/i) ||
                          emailContent.match(/order[#\s]*:?\s*([A-Z0-9-]+)/i)
      if (confirmMatch) {
        data.confirmationNumber = confirmMatch[1]
      }

      // Extract emails
      const emails = this.extractEmails(emailContent)
      // Filter out escrow emails and common no-reply emails
      const userEmails = emails.filter(email =>
        !email.includes('escrow') &&
        !email.includes('noreply') &&
        !email.includes('ticketmaster.com')
      )

      if (userEmails.length > 0) {
        data.senderEmail = userEmails[0]
      }

      // Receiver email (escrow email)
      const escrowEmail = emails.find(email => email.includes('escrow'))
      if (escrowEmail) {
        data.receiverEmail = escrowEmail
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse Ticketmaster email',
      }
    }
  }
}

/**
 * AXS Email Parser
 */
export class AXSParser extends BaseEmailParser {
  platform = 'AXS'

  parse(emailContent: string, emailSubject: string): EmailParserResult {
    try {
      const data: ParsedTicketTransfer = {
        platform: this.platform,
        transferDate: new Date(),
      }

      // Extract transfer code
      data.transferCode = this.extractTransferCode(emailContent)

      // Extract event name
      // AXS subjects often: "Tickets transferred: [Event Name]"
      const eventMatch = emailSubject.match(/transferred:\s*([^-]+)/i) ||
                        emailSubject.match(/for\s+([^-]+)/i)
      if (eventMatch) {
        data.eventName = this.cleanText(eventMatch[1])
      } else {
        const bodyEventMatch = emailContent.match(/event:\s*([^\n]+)/i) ||
                              emailContent.match(/show:\s*([^\n]+)/i)
        if (bodyEventMatch) {
          data.eventName = this.cleanText(bodyEventMatch[1])
        }
      }

      // Extract venue
      const venueMatch = emailContent.match(/venue:\s*([^\n]+)/i) ||
                        emailContent.match(/at\s+([A-Z][A-Za-z\s&]+(?:Arena|Stadium|Center|Theatre|Theater|Hall|Pavilion))/i)
      if (venueMatch) {
        data.venue = this.cleanText(venueMatch[1])
      }

      // Extract event date
      const dateMatch = emailContent.match(/date[:\s]+([^\n]+)/i) ||
                       emailContent.match(/(?:on|when:)\s*(\w+,?\s+\w+\s+\d{1,2},?\s+\d{4})/i)
      if (dateMatch) {
        data.eventDate = this.cleanText(dateMatch[1])
      }

      // Extract seating information
      const sectionMatch = emailContent.match(/section[:\s]+([^\n,]+)/i) ||
                          emailContent.match(/sec[:\s]+([^\n,]+)/i)
      if (sectionMatch) {
        data.section = this.cleanText(sectionMatch[1])
      }

      const rowMatch = emailContent.match(/row[:\s]+([^\n,]+)/i)
      if (rowMatch) {
        data.row = this.cleanText(rowMatch[1])
      }

      const seatMatch = emailContent.match(/seat[s]?[:\s]+([^\n]+)/i)
      if (seatMatch) {
        data.seat = this.cleanText(seatMatch[1])
      }

      // Extract quantity
      const qtyMatch = emailContent.match(/qty[:\s]*(\d+)/i) ||
                      emailContent.match(/(\d+)\s+ticket[s]?/i)
      if (qtyMatch) {
        data.quantity = parseInt(qtyMatch[1], 10)
      }

      // Extract confirmation/order number
      const confirmMatch = emailContent.match(/confirmation[#\s]*:?\s*([A-Z0-9-]+)/i) ||
                          emailContent.match(/order[#\s]*:?\s*([A-Z0-9-]+)/i) ||
                          emailContent.match(/reference[#\s]*:?\s*([A-Z0-9-]+)/i)
      if (confirmMatch) {
        data.confirmationNumber = confirmMatch[1]
      }

      // Extract emails
      const emails = this.extractEmails(emailContent)
      const userEmails = emails.filter(email =>
        !email.includes('escrow') &&
        !email.includes('noreply') &&
        !email.includes('axs.com') &&
        !email.includes('aegpresents.com')
      )

      if (userEmails.length > 0) {
        data.senderEmail = userEmails[0]
      }

      const escrowEmail = emails.find(email => email.includes('escrow'))
      if (escrowEmail) {
        data.receiverEmail = escrowEmail
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse AXS email',
      }
    }
  }
}

/**
 * StubHub Email Parser
 */
export class StubHubParser extends BaseEmailParser {
  platform = 'STUBHUB'

  parse(emailContent: string, emailSubject: string): EmailParserResult {
    try {
      const data: ParsedTicketTransfer = {
        platform: this.platform,
        transferDate: new Date(),
      }

      data.transferCode = this.extractTransferCode(emailContent)

      const eventMatch = emailSubject.match(/(?:for|to)\s+([^-]+)/i)
      if (eventMatch) {
        data.eventName = this.cleanText(eventMatch[1])
      }

      const venueMatch = emailContent.match(/venue:\s*([^\n]+)/i)
      if (venueMatch) {
        data.venue = this.cleanText(venueMatch[1])
      }

      const sectionMatch = emailContent.match(/section[:\s]+([^\n,]+)/i)
      if (sectionMatch) {
        data.section = this.cleanText(sectionMatch[1])
      }

      const rowMatch = emailContent.match(/row[:\s]+([^\n,]+)/i)
      if (rowMatch) {
        data.row = this.cleanText(rowMatch[1])
      }

      const confirmMatch = emailContent.match(/order[#\s]*:?\s*([A-Z0-9-]+)/i)
      if (confirmMatch) {
        data.confirmationNumber = confirmMatch[1]
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse StubHub email',
      }
    }
  }
}

/**
 * Generic Email Parser (fallback for other platforms)
 */
export class GenericParser extends BaseEmailParser {
  platform = 'OTHER'

  parse(emailContent: string, emailSubject: string): EmailParserResult {
    try {
      const data: ParsedTicketTransfer = {
        platform: this.platform,
        transferDate: new Date(),
      }

      // Try to extract basic info using generic patterns
      data.transferCode = this.extractTransferCode(emailContent)

      // Generic event name extraction
      const eventMatch = emailContent.match(/event[:\s]+([^\n]+)/i) ||
                        emailSubject.match(/(?:for|to)\s+([^-]+)/i)
      if (eventMatch) {
        data.eventName = this.cleanText(eventMatch[1])
      }

      // Generic confirmation
      const confirmMatch = emailContent.match(/(?:confirmation|order|reference)[#\s]*:?\s*([A-Z0-9-]+)/i)
      if (confirmMatch) {
        data.confirmationNumber = confirmMatch[1]
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse email',
      }
    }
  }
}

/**
 * Email Parser Factory
 * Returns appropriate parser based on platform or email content
 */
export class EmailParserFactory {
  private parsers: Map<string, BaseEmailParser> = new Map([
    ['TICKETMASTER', new TicketmasterParser()],
    ['AXS', new AXSParser()],
    ['STUBHUB', new StubHubParser()],
  ])

  /**
   * Get parser for a specific platform
   */
  getParser(platform: string): BaseEmailParser {
    const parser = this.parsers.get(platform.toUpperCase())
    return parser || new GenericParser()
  }

  /**
   * Detect platform from email content
   */
  detectPlatform(emailContent: string, emailFrom: string): string {
    const content = emailContent.toLowerCase()
    const from = emailFrom.toLowerCase()

    if (from.includes('ticketmaster') || content.includes('ticketmaster')) {
      return 'TICKETMASTER'
    }
    if (from.includes('axs.com') || from.includes('aegpresents') || content.includes('axs.com')) {
      return 'AXS'
    }
    if (from.includes('stubhub') || content.includes('stubhub')) {
      return 'STUBHUB'
    }
    if (from.includes('seatgeek') || content.includes('seatgeek')) {
      return 'SEATGEEK'
    }
    if (from.includes('vividseats') || content.includes('vivid seats')) {
      return 'VIVID_SEATS'
    }
    if (from.includes('gametime') || content.includes('gametime')) {
      return 'GAMETIME'
    }

    return 'OTHER'
  }

  /**
   * Parse email with automatic platform detection
   */
  parseEmail(
    emailContent: string,
    emailSubject: string,
    emailFrom: string,
    platformHint?: string
  ): EmailParserResult {
    const platform = platformHint || this.detectPlatform(emailContent, emailFrom)
    const parser = this.getParser(platform)
    return parser.parse(emailContent, emailSubject)
  }
}

// Export singleton factory instance
export const emailParserFactory = new EmailParserFactory()
