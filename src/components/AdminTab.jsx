import { useState } from 'react'
import { getSheetUrl, setSheetUrl, postMessage } from '../api'
import styles from './AdminTab.module.css'

const ADMIN_PASS = 'leap2026'

function exportCSV(data, filename, headers, row) {
  const rows = [headers.join(','), ...data.map(row)].join('\n')
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows)
  a.download = filename
  a.click()
}

export default function AdminTab({ events, reports, registrations, messages, setMessages }) {
  const [auth, setAuth] = useState(false)
  const [pass, setPass] = useState('')
  const [passErr, setPassErr] = useState(false)
  const [sheetUrl, setSheetUrlState] = useState(getSheetUrl())
  const [urlSaved, setUrlSaved] = useState(false)
  const [msgSubject, setMsgSubject] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [msgSent, setMsgSent] = useState(false)
  const [sending, setSending] = useState(false)

  if (!auth) {
    return (
      <div style={{ maxWidth: 360, margin: '60px auto' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className={styles.lockIcon}>🔒</div>
          <div className={styles.lockTitle}>Admin Access</div>
          <div className={styles.lockSub}>Enter the campaign admin password</div>
          <input
            type="password"
            value={pass}
            onChange={e => { setPass(e.target.value); setPassErr(false) }}
            placeholder="Password"
            onKeyDown={e => e.key === 'Enter' && checkPass()}
            style={{ marginTop: 16, textAlign: 'center' }}
          />
          {passErr && <div className={styles.passErr}>Incorrect password</div>}
          <button
            className={styles.loginBtn}
            onClick={checkPass}
            style={{ marginTop: 12 }}
          >
            Enter
          </button>
        </div>
      </div>
    )

    function checkPass() {
      if (pass === ADMIN_PASS) setAuth(true)
      else { setPassErr(true); setPass('') }
    }
  }

  function checkPass() {
    if (pass === ADMIN_PASS) setAuth(true)
    else { setPassErr(true); setPass('') }
  }

  const totalSigs = reports.reduce((a, r) => a + (parseInt(r.sigs) || 0), 0)
  const totalAttendees = [...new Set(events.flatMap(e => e.attendees))].length

  async function sendMessage() {
    if (!msgSubject || !msgBody) return
    setSending(true)
    const msg = {
      id: `msg-${Date.now()}`,
      subject: msgSubject,
      body: msgBody,
      sent: new Date().toISOString(),
      sentTo: registrations.length
    }
    setMessages(prev => [...prev, msg])
    await postMessage({ ...msg, recipients: registrations.map(r => r.email).filter(Boolean) })
    setMsgSubject('')
    setMsgBody('')
    setMsgSent(true)
    setSending(false)
    setTimeout(() => setMsgSent(false), 5000)
  }

  function saveUrl() {
    setSheetUrl(sheetUrl)
    setUrlSaved(true)
    setTimeout(() => setUrlSaved(false), 3000)
  }

  return (
    <div>
      {/* Stats */}
      <div className={styles.statGrid}>
        <StatCard n={totalSigs.toLocaleString()} label="Total signatures" color="navy" />
        <StatCard n={reports.length} label="Reports submitted" />
        <StatCard n={registrations.length} label="Registered users" color="green" />
        <StatCard n={events.filter(e => new Date(e.date) >= new Date()).length} label="Upcoming events" />
        <StatCard n={totalAttendees} label="Event RSVPs" color="blue" />
        <StatCard n={messages.length} label="Messages sent" />
      </div>

      {/* Message everyone */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>📢 Send Message to All Users</div>
          <span className="badge badge-blue">{registrations.length} registered</span>
        </div>
        <div className={styles.msgNote}>
          Message appears as a banner in the app for all visitors. When connected to Google Sheets (see below), it also sends emails via your Apps Script.
        </div>
        <label>Subject / headline</label>
        <input value={msgSubject} onChange={e => setMsgSubject(e.target.value)} placeholder="e.g. Urgent: We need your help this weekend!" />
        <label>Message body</label>
        <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={4} placeholder="Write your message to all volunteers and registrants..." />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <button
            onClick={sendMessage}
            disabled={sending || !msgSubject || !msgBody}
            className={styles.sendBtn}
          >
            {sending ? 'Sending...' : '📢 Send to All'}
          </button>
          {msgSent && <div className={styles.sentConfirm}>✓ Message broadcast sent!</div>}
        </div>

        {/* Message history */}
        {messages.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className={styles.historyLabel}>Message history</div>
            {messages.slice().reverse().map(m => (
              <div key={m.id} className={styles.msgRow}>
                <div className={styles.msgRowHead}>
                  <strong>{m.subject}</strong>
                  <span className={styles.msgRowMeta}>{new Date(m.sent).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                <div className={styles.msgRowBody}>{m.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reports table */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>Signature Reports</div>
          <button
            className={styles.exportBtn}
            onClick={() => exportCSV(
              reports,
              `LEAP_reports_${new Date().toISOString().slice(0,10)}.csv`,
              ['Name','Email','Phone','Area','Signatures','Date','Notes','Submitted'],
              r => [r.name,r.email,r.phone,r.area,r.sigs,r.date,r.notes,r.submitted].map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(',')
            )}
          >
            ↓ Export CSV
          </button>
        </div>
        {reports.length === 0 ? (
          <div className="empty-state">No reports yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead><tr>
                <th>Name</th><th>Area</th><th style={{textAlign:'right'}}>Sigs</th><th>Date</th><th>Notes</th>
              </tr></thead>
              <tbody>
                {reports.slice().reverse().map((r, i) => (
                  <tr key={r.id || i}>
                    <td>{r.name}</td>
                    <td style={{ color: 'var(--gray-600)' }}>{r.area}</td>
                    <td style={{ textAlign: 'right', color: 'var(--navy)', fontWeight: 700 }}>{r.sigs}</td>
                    <td style={{ color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>{r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                    <td style={{ color: 'var(--gray-600)', fontSize: 12, maxWidth: 200 }}>{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registered users */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>Registered Users</div>
          <button
            className={styles.exportBtn}
            onClick={() => exportCSV(
              registrations,
              `LEAP_users_${new Date().toISOString().slice(0,10)}.csv`,
              ['Name','Email','Phone','Joined'],
              r => [r.name,r.email,r.phone,r.joined].map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(',')
            )}
          >
            ↓ Export CSV
          </button>
        </div>
        {registrations.length === 0 ? (
          <div className="empty-state">No registrations yet.</div>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th></tr></thead>
            <tbody>
              {registrations.slice().reverse().map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td style={{ color: 'var(--gray-600)' }}>{r.email}</td>
                  <td style={{ color: 'var(--gray-600)' }}>{r.phone}</td>
                  <td style={{ color: 'var(--gray-600)', fontSize: 12 }}>{r.joined ? new Date(r.joined).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Google Sheets config */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className={styles.sectionTitle} style={{ marginBottom: 8 }}>Google Sheets Connection</div>
        <div className={styles.sheetsNote}>
          All reports, RSVPs, registrations, and messages post to your Google Sheet via Apps Script. Paste your deployment URL below.
        </div>
        <label>Apps Script Web App URL</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 0 }}>
          <input value={sheetUrl} onChange={e => setSheetUrlState(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" />
          <button onClick={saveUrl} style={{ whiteSpace: 'nowrap', padding: '9px 14px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Save</button>
        </div>
        {urlSaved && <div style={{ color: 'var(--green)', fontSize: 12, marginTop: 4 }}>✓ Saved</div>}
        <details style={{ marginTop: 12 }}>
          <summary style={{ fontSize: 13, color: 'var(--navy)', cursor: 'pointer', fontWeight: 500 }}>Setup instructions ▾</summary>
          <div className={styles.instructions}>
            <p>1. Open your Google Sheet → Extensions → Apps Script</p>
            <p>2. Replace all content with the Code.gs script (provided separately)</p>
            <p>3. Click Deploy → New Deployment → Web App → Execute as: Me, Who has access: Anyone</p>
            <p>4. Copy the Web App URL and paste it above</p>
            <p>5. All submissions will now flow into your sheet automatically</p>
          </div>
        </details>
      </div>

      {/* Change password note */}
      <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: 8 }}>
        Admin password: <code>leap2026</code> — update in <code>src/data.js</code> before deploying
      </div>
    </div>
  )
}

function StatCard({ n, label, color }) {
  const colors = { navy: 'var(--navy)', green: 'var(--green)', blue: 'var(--blue-text)' }
  return (
    <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: colors[color] || 'var(--gray-800)', lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 3 }}>{label}</div>
    </div>
  )
}
