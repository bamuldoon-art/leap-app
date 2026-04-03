import { useState } from 'react'
import { postReport } from '../api'
import styles from './ReportTab.module.css'

export default function ReportTab({ reports, setReports, user, onNeedRegister }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    area: '',
    sigs: '',
    date: new Date().toISOString().slice(0, 10),
    notes: ''
  })
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const totalSigs = reports.reduce((a, r) => a + (parseInt(r.sigs) || 0), 0)
  const goal = 12429

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.area || !form.sigs) return
    setSubmitting(true)
    const report = { ...form, sigs: parseInt(form.sigs) || 0, submitted: new Date().toISOString(), id: `rep-${Date.now()}` }
    setReports(prev => [...prev, report])
    await postReport(report)
    setForm(f => ({ ...f, area: '', sigs: '', notes: '' }))
    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => setSuccess(false), 5000)
  }

  const pct = Math.min(100, Math.round((totalSigs / goal) * 100))

  return (
    <div>
      {/* Progress bar */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className={styles.progressHeader}>
          <div>
            <div className={styles.progressTitle}>Campaign Progress</div>
            <div className={styles.progressSub}>Goal: {goal.toLocaleString()} signatures to advance to ballot</div>
          </div>
          <div className={styles.progressCount}>{totalSigs.toLocaleString()}</div>
        </div>
        <div className={styles.progressBarBg}>
          <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
        </div>
        <div className={styles.progressPct}>{pct}% of goal</div>
      </div>

      {/* Form */}
      <div className="card">
        <div className={styles.formTitle}>Log Signatures Collected</div>
        <form onSubmit={handleSubmit}>
          <div className={styles.twoCol}>
            <div>
              <label>Your name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="First and last name" />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" />
            </div>
          </div>
          <div className={styles.twoCol}>
            <div>
              <label>City / Town where collected *</label>
              <input required value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. Somerville, MA" />
            </div>
            <div>
              <label>Date collected</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div className={styles.sigRow}>
            <div style={{ flex: 1 }}>
              <label>Number of signatures * </label>
              <input
                type="number"
                required
                min="1"
                value={form.sigs}
                onChange={e => setForm(f => ({ ...f, sigs: e.target.value }))}
                placeholder="0"
                className={styles.sigInput}
              />
            </div>
          </div>
          <label>Notes (optional)</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Event, location, anything useful..." />

          <div className={styles.submitRow}>
            <button type="submit" disabled={submitting} className={styles.submitBtn}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
            {success && (
              <div className={styles.successMsg}>✓ Logged! Thank you for collecting signatures.</div>
            )}
          </div>
        </form>
      </div>

      {/* Recent reports */}
      {reports.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className={styles.recentTitle}>Recent Reports</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Collector</th>
                <th>Area</th>
                <th style={{ textAlign: 'right' }}>Sigs</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {reports.slice().reverse().slice(0, 20).map((r, i) => (
                <tr key={r.id || i}>
                  <td>{r.name}</td>
                  <td style={{ color: 'var(--gray-600)' }}>{r.area}</td>
                  <td style={{ textAlign: 'right', color: 'var(--navy)', fontWeight: 600 }}>{r.sigs}</td>
                  <td style={{ color: 'var(--gray-600)' }}>{r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
