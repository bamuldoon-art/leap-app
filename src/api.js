const URL_KEY = 'leap_sheets_url'

export function getSheetUrl() {
  return localStorage.getItem(URL_KEY) || ''
}

export function setSheetUrl(url) {
  localStorage.setItem(URL_KEY, url)
}

async function post(action, data) {
  const url = getSheetUrl()
  if (!url) return { ok: false, reason: 'no_url' }
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data })
    })
    return { ok: true }
  } catch (e) {
    console.warn('Sheet post failed:', e)
    return { ok: false, reason: e.message }
  }
}

export async function postReport(report) {
  return post('report', report)
}

export async function postRegistration(user) {
  return post('register', user)
}

export async function postMessage(msg) {
  return post('message', msg)
}

export async function postEvent(event) {
  return post('event', event)
}

export async function postRsvp(rsvp) {
  return post('rsvp', rsvp)
}
