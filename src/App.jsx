import { useState, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { SEED_EVENTS } from './data'
import EventsTab from './components/EventsTab'
import ReportTab from './components/ReportTab'
import AdminTab from './components/AdminTab'
import RegisterModal from './components/RegisterModal'
import styles from './App.module.css'

const TABS = [
  { id: 'events', label: 'Events' },
  { id: 'report', label: 'Report Signatures' },
  { id: 'admin', label: '🔒 Admin' }
]

export default function App() {
  const [tab, setTab] = useState('events')
  const [user, setUser] = useLocalStorage('leap_user', null)
  const [events, setEvents] = useLocalStorage('leap_events', null)
  const [reports, setReports] = useLocalStorage('leap_reports', [])
  const [registrations, setRegistrations] = useLocalStorage('leap_registrations', [])
  const [messages, setMessages] = useLocalStorage('leap_messages', [])
  const [showRegister, setShowRegister] = useState(false)

  // Seed events on first load
  useEffect(() => {
    if (!events) setEvents(SEED_EVENTS)
  }, [])

  const eventsData = events || SEED_EVENTS

  function handleRegister(userData) {
    setUser(userData)
    const already = registrations.find(r => r.email === userData.email)
    if (!already) {
      setRegistrations(prev => [...prev, { ...userData, joined: new Date().toISOString() }])
    }
    setShowRegister(false)
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>LEAP</div>
            <div>
              <div className={styles.headerTitle}>Signature Campaign 2026</div>
              <div className={styles.headerSub}>Legislative Effectiveness &amp; Accountability Project</div>
            </div>
          </div>
          <div className={styles.headerRight}>
            {user ? (
              <div className={styles.userPill} onClick={() => setShowRegister(true)}>
                <span className={styles.userDot} />
                {user.name.split(' ')[0]}
              </div>
            ) : (
              <button className={styles.joinBtn} onClick={() => setShowRegister(true)}>
                Join / Register
              </button>
            )}
          </div>
        </div>

        {/* Latest message banner */}
        {messages.length > 0 && (
          <div className={styles.msgBanner}>
            <span className={styles.msgIcon}>📢</span>
            <strong>{messages[messages.length - 1].subject}:</strong>&nbsp;
            {messages[messages.length - 1].body}
            <span className={styles.msgTime}>
              — {new Date(messages[messages.length - 1].sent).toLocaleDateString()}
            </span>
          </div>
        )}
      </header>

      {/* Nav */}
      <nav className={styles.nav}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.navBtn} ${tab === t.id ? styles.navActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className={styles.main}>
        {tab === 'events' && (
          <EventsTab
            events={eventsData}
            setEvents={setEvents}
            user={user}
            onNeedRegister={() => setShowRegister(true)}
          />
        )}
        {tab === 'report' && (
          <ReportTab
            reports={reports}
            setReports={setReports}
            user={user}
            onNeedRegister={() => setShowRegister(true)}
          />
        )}
        {tab === 'admin' && (
          <AdminTab
            events={eventsData}
            reports={reports}
            registrations={registrations}
            messages={messages}
            setMessages={setMessages}
          />
        )}
      </main>

      {showRegister && (
        <RegisterModal
          existing={user}
          onRegister={handleRegister}
          onClose={() => setShowRegister(false)}
        />
      )}
    </div>
  )
}
