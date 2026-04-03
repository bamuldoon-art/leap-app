import { useState } from 'react'
import { postRegistration } from '../api'
import styles from './RegisterModal.module.css'

export default function RegisterModal({ existing, onRegister, onClose }) {
  const [form, setForm] = useState({
    name: existing?.name || '',
    email: existing?.email || '',
    phone: existing?.phone || '',
    area: existing?.area || ''
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email) return
    setSubmitting(true)
    await postRegistration({ ...form, joined: new Date().toISOString() })
    onRegister(form)
    setSubmitting(false)
  }

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>Join LEAP Signature Campaign</div>
            <div className={styles.sub}>Register to RSVP for events and get updates from the campaign</div>
          </div>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Full name *</label>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" autoFocus />
          <label>Email address *</label>
          <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@email.com" />
          <label>Phone number (optional)</label>
          <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="617-555-0100" />
          <label>Your city / town</label>
          <input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. Somerville, MA" />
          <div className={styles.note}>
            Your info is used only for this campaign. We will not share it with third parties.
          </div>
          <div className={styles.btns}>
            <button type="submit" disabled={submitting} className={styles.submitBtn}>
              {submitting ? 'Joining...' : existing ? 'Update Info' : 'Join Campaign'}
            </button>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
