// LEAP Signature Campaign — Google Apps Script Backend
// Deploy as Web App: Execute as Me, Who has access: Anyone
// Sheet tabs: Reports | Registrations | Events | RSVPs | Messages

const SHEET_NAMES = {
  reports: 'Reports',
  registrations: 'Registrations',
  events: 'Events',
  rsvps: 'RSVPs',
  messages: 'Messages'
}

function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    sheet.appendRow(headers)
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold')
      .setBackground('#1F4E79').setFontColor('white')
  }
  return sheet
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    const action = data.action

    if (action === 'report') {
      const sheet = getOrCreateSheet(SHEET_NAMES.reports,
        ['ID','Name','Email','Phone','Area','Signatures','Date','Notes','Submitted'])
      sheet.appendRow([data.id, data.name, data.email, data.phone, data.area,
        data.sigs, data.date, data.notes, data.submitted])
    }

    else if (action === 'register') {
      const sheet = getOrCreateSheet(SHEET_NAMES.registrations,
        ['Name','Email','Phone','Area','Joined'])
      // Check for duplicate email
      const existing = sheet.getDataRange().getValues()
      const dup = existing.slice(1).some(row => row[1] === data.email)
      if (!dup) {
        sheet.appendRow([data.name, data.email, data.phone, data.area, data.joined])
      }
    }

    else if (action === 'event') {
      const sheet = getOrCreateSheet(SHEET_NAMES.events,
        ['ID','Name','Date','Area','Location','Notes','Host','Created By'])
      sheet.appendRow([data.id, data.name, data.date, data.area,
        data.location, data.notes, data.host, data.createdBy])
    }

    else if (action === 'rsvp') {
      const sheet = getOrCreateSheet(SHEET_NAMES.rsvps,
        ['Event ID','Name','Email','Timestamp'])
      sheet.appendRow([data.eventId, data.name, data.email, new Date().toISOString()])
    }

    else if (action === 'message') {
      const sheet = getOrCreateSheet(SHEET_NAMES.messages,
        ['ID','Subject','Body','Sent','Sent To'])
      sheet.appendRow([data.id, data.subject, data.body, data.sent, data.sentTo])

      // Send emails to all registered users (optional — requires Gmail access)
      if (data.recipients && data.recipients.length > 0) {
        const subject = '[LEAP Campaign] ' + data.subject
        const htmlBody = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1F4E79;color:white;padding:20px;border-radius:8px 8px 0 0">
              <strong>LEAP · Signature Campaign 2026</strong>
            </div>
            <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px">
              <h2 style="color:#1F4E79;margin-top:0">${data.subject}</h2>
              <p style="color:#333;line-height:1.6">${data.body}</p>
              <hr style="border:1px solid #eee;margin:20px 0">
              <p style="color:#999;font-size:12px">
                You're receiving this because you registered with the LEAP Signature Campaign.
                Visit the campaign app to see events and report signatures.
              </p>
            </div>
          </div>`
        data.recipients.forEach(email => {
          try {
            GmailApp.sendEmail(email, subject, data.body, { htmlBody })
          } catch(err) {
            // Continue even if individual email fails
          }
        })
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON)

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

function doGet(e) {
  // Health check
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', app: 'LEAP Signature Campaign' }))
    .setMimeType(ContentService.MimeType.JSON)
}
