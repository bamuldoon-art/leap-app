import { useState, useMemo } from 'react'
import { postEvent, postRsvp } from '../api'
import styles from './EventsTab.module.css'

const MA_REGIONS = [
  'All Regions',
  'Greater Boston',
  'North Shore',
  'South Shore',
  'MetroWest',
  'Worcester Area',
  'Pioneer Valley',
  'Western MA',
  'South Coast',
  'Cape & Islands',
  'Merrimack Valley'
]

function regionForArea(area) {
  const a = area.toLowerCase()
  if (/cambridge|somerville|boston|brookline|newton|watertown|belmont|medford|malden|everett|quincy|braintree/.test(a)) return 'Greater Boston'
  if (/salem|gloucester|beverly|newburyport|amesbury|marblehead|peabody/.test(a)) return 'North Shore'
  if (/quincy|weymouth|braintree|plymouth|marshfield|duxbury|hingham|norwell/.test(a)) return 'South Shore'
  if (/framingham|natick|wellesley|needham|waltham|lexington|concord|weston/.test(a)) return 'MetroWest'
  if (/worcester|fitchburg|leominster|gardner|webster/.test(a)) return 'Worcester Area'
  if (/northampton|amherst|holyoke|springfield|chicopee|westfield/.test(a)) return 'Pioneer Valley'
  if (/pittsfield|great barrington|lenox|north adams/.test(a)) return 'Western MA'
  if (/new bedford|fall river|taunton|attleboro/.test(a)) return 'South Coast'
  if (/falmouth|barnstable|hyannis|cape|nantucket|vineyard/.test(a)) return 'Cape & Islands'
  if (/lowell|lawrence|haverhill|methuen|andover/.test(a)) return 'Merrimack Valley'
  return null
}

function formatDate(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function dayLabel(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const now = new Date()
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'past'
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff < 7) return `in ${diff} days`
  return null
}

export default function EventsTab({ events, setEvents, user, onNeedRegister }) {
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('All Regions')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', date: '', area: '', location: '', notes: '', host: '' })
  const [rsvpd, setRsvpd] = useState({}) // local optimistic state

  const now = new Date()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return (events || [])
      .filter(e => {
        const matchSearch = !q || e.name.toLowerCase().includes(q) || e.area.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q)
        const matchRegion = region === 'All Regions' || regionForArea(e.area) === region || e.area.toLowerCase().includes(region.toLowerCase())
        return matchSearch && matchRegion
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [events, search, region])

  const upcoming = filtered.filter(e => e.date && new Date(e.date) >= now)
  const past = filtered.filter(e => e.date && new Date(e.date) < now)

  function handleRsvp(eventId) {
    if (!user) { onNeedRegister(); return }
    const name = user.name
    setRsvpd(prev => ({ ...prev, [eventId]: true }))
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e
      const already = e.attendees.includes(name)
      return already ? e : { ...e, attendees: [...e.attendees, name] }
    }))
    postRsvp({ eventId, name, email: user.email })
  }

  function handleAddEvent(e) {
    e.preventDefault()
    if (!form.name || !form.area) return
    const newEvent = {
      id: `ev-${Date.now()}`,
      ...form,
      attendees: user ? [user.name] : [],
      createdBy: user?.name || 'Anonymous'
    }
    setEvents(prev => [...prev, newEvent])
    postEvent({ ...newEvent })
    setForm({ name: '', date: '', area: '', location: '', notes: '', host: '' })
    setShowForm(false)
  }

  return (
    <div>
      {/* Search/Filter row */}
      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="Search by city, town, or keyword..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={region} onChange={e => setRegion(e.target.value)} className={styles.regionSelect}>
          {MA_REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <button className="btn-primary" style={{ padding: '9px 16px', borderRadius: 6, background: 'var(--navy)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => setShowForm(v => !v)}>
          + Add Event
        </button>
      </div>

      {/* Add event form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className={styles.formTitle}>Add a Signature Event</div>
          <form onSubmit={handleAddEvent}>
            <label>Event name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Somerville Saturday Canvass" />
            <div className={styles.twoCol}>
              <div>
                <label>Date &amp; time</label>
                <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label>City / Town / Area *</label>
                <input required value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. Arlington, MA" />
              </div>
            </div>
            <label>Location / Address</label>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Specific address or landmark" />
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="What to bring, parking, instructions..." />
            <label>Organizer name</label>
            <input value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} placeholder={user?.name || 'Your name'} />
            <div className={styles.formBtns}>
              <button type="submit" className="btn-primary" style={{ background: 'var(--navy)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Save Event</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <div className={styles.sectionLabel}>{upcoming.length} upcoming event{upcoming.length !== 1 ? 's' : ''}</div>
      )}
      {upcoming.map(ev => (
        <EventCard key={ev.id} ev={ev} onRsvp={handleRsvp} rsvpd={rsvpd[ev.id] || ev.attendees.includes(user?.name)} dayLabel={dayLabel(ev.date)} />
      ))}

      {upcoming.length === 0 && (
        <div className="empty-state">No upcoming events match your search.</div>
      )}

      {past.length > 0 && (
        <>
          <div className={styles.sectionLabel} style={{ marginTop: 20, color: 'var(--gray-400)' }}>Past events</div>
          {past.map(ev => (
            <EventCard key={ev.id} ev={ev} onRsvp={() => {}} rsvpd={false} past />
          ))}
        </>
      )}
    </div>
  )
}

function EventCard({ ev, onRsvp, rsvpd, dayLabel: dl, past }) {
  const [expanded, setExpanded] = useState(false)
  const isFinal = ev.id === 'seed-22'

  return (
    <div className={`card ${styles.eventCard} ${isFinal ? styles.finalEvent : ''} ${past ? styles.pastCard : ''}`}>
      <div className={styles.eventTop}>
        <div className={styles.eventInfo}>
          <div className={styles.eventMeta}>
            {dl && <span className={`badge ${dl === 'today' || dl === 'tomorrow' ? 'badge-amber' : 'badge-blue'}`}>{dl}</span>}
            <span className="badge badge-gray">{ev.area}</span>
            {isFinal && <span className="badge badge-red">🚨 Final day</span>}
          </div>
          <h3 className={styles.eventName}>{ev.name}</h3>
          {ev.date && <div className={styles.eventDate}>{formatDate(ev.date)}</div>}
          {ev.location && <div className={styles.eventLocation}>📍 {ev.location}</div>}
        </div>
        {!past && (
          <button
            className={`${styles.rsvpBtn} ${rsvpd ? styles.rsvpDone : ''}`}
            onClick={() => !rsvpd && onRsvp(ev.id)}
          >
            {rsvpd ? '✓ Going' : "I'm Going"}
          </button>
        )}
      </div>

      {ev.attendees.length > 0 && (
        <div className={styles.attendees}>
          <span className="badge badge-green">{ev.attendees.length} {ev.attendees.length === 1 ? 'person' : 'people'} going</span>
          {expanded && (
            <span className={styles.attendeeList}> · {ev.attendees.join(', ')}</span>
          )}
          {ev.attendees.length > 0 && (
            <button className={styles.expandBtn} onClick={() => setExpanded(v => !v)}>
              {expanded ? 'hide' : 'who?'}
            </button>
          )}
        </div>
      )}

      {ev.notes && <div className={styles.eventNotes}>{ev.notes}</div>}
      {ev.host && ev.host !== 'LEAP Campaign' && (
        <div className={styles.eventHost}>Organized by {ev.host}</div>
      )}
    </div>
  )
}
