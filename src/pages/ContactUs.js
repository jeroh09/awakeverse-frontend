// src/pages/ContactUs.js
// Full rewrite — single-viewport, pill-nav tab system, no scroll.
// Three panels: Message Us · FAQ · Find Us

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ContactUs.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

// ── SVG icons ─────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" width="11" height="11">
    <path d="M9 2L4 7l5 5"/>
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <line x1="2" y1="14" x2="14" y2="2"/>
    <polyline points="6 2 14 2 14 10"/>
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" width="12" height="12">
    <rect x="1" y="2.5" width="12" height="9" rx="1.5"/>
    <polyline points="1 2.5 7 8 13 2.5"/>
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" width="12" height="12">
    <path d="M7 1.5A4.5 4.5 0 0 1 11.5 6c0 3-4.5 6.5-4.5 6.5S2.5 9 2.5 6A4.5 4.5 0 0 1 7 1.5z"/>
    <circle cx="7" cy="6" r="1.5"/>
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" width="12" height="12">
    <circle cx="7" cy="7" r="5.5"/>
    <path d="M7 2.5C5.5 4 4.8 5.2 4.8 7S5.5 10 7 11.5"/>
    <path d="M7 2.5C8.5 4 9.2 5.2 9.2 7S8.5 10 7 11.5"/>
    <line x1="1.5" y1="7" x2="12.5" y2="7"/>
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" width="12" height="12">
    <circle cx="7" cy="7" r="5.5"/>
    <line x1="7" y1="4" x2="7" y2="7.5"/>
    <line x1="7" y1="7.5" x2="9.5" y2="9.5"/>
  </svg>
);

const MapPinLargeIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4"
    strokeLinecap="round" width="40" height="40">
    <path d="M20 4A10 10 0 0 1 30 14c0 8-10 22-10 22S10 22 10 14A10 10 0 0 1 20 4z"/>
    <circle cx="20" cy="14" r="4"/>
  </svg>
);

const XTwitterIcon = () => (
  <svg viewBox="0 0 12 12" fill="currentColor" width="10" height="10">
    <path d="M11 1.5l-4 4.7L11.5 11H8.5L6 7.8 3.2 11H.5l4.3-5L0 1.5h3L6 4.5 8.5 1.5z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3"
    strokeLinecap="round" width="10" height="10">
    <rect x="1.5" y="1.5" width="9" height="9" rx="2.5"/>
    <circle cx="6" cy="6" r="2.2"/>
    <circle cx="8.8" cy="3.2" r=".55" fill="currentColor" stroke="none"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 12 12" fill="currentColor" width="10" height="10">
    <rect x="1" y="4.5" width="2" height="6.5" rx=".4"/>
    <circle cx="2" cy="2.2" r="1.1"/>
    <path d="M5 4.5h2v1a2.5 2.5 0 0 1 2-1.2c1.7 0 2.5 1.1 2.5 3V11H9V7.5c0-.8-.4-1.3-1.1-1.3-.8 0-1.4.5-1.4 1.5V11H5z"/>
  </svg>
);

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'How fast do you reply?',
    a: <>We aim to respond within 1–2 business days. For urgent issues such as billing or account access, choose <strong>Account &amp; Billing</strong> as the topic to prioritise routing.</>,
  },
  {
    q: 'Can I request a custom character or integration?',
    a: <>Yes. Select <strong>Partnerships &amp; Integrations</strong> as the topic and include your scope, timeline, and any relevant links. We review proposals weekly.</>,
  },
  {
    q: 'Where are you based?',
    a: 'We operate remotely with a registered presence in Bolton, Greater Manchester, UK. The office is available for correspondence — visits by appointment only.',
  },
  {
    q: 'Is my data safe when I contact you?',
    a: "We use encrypted channels and store only what's necessary to respond to your enquiry. Your details are never sold or shared. See our Privacy Policy for full details.",
  },
  {
    q: "I have a technical issue — what's the fastest way to get help?",
    a: <>Select <strong>Technical support</strong> and describe the issue clearly — which feature, any error messages, and your device/browser. Screenshots help us significantly.</>,
  },
];

const TOPICS = [
  'General enquiry',
  'Account & Billing',
  'Technical support',
  'Partnerships & Integrations',
  'Press & Media',
];

// ── Main component ────────────────────────────────────────────────────────────

export default function ContactUs() {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState('message');

  // Form state
  const [form, setForm]       = useState({ name: '', email: '', message: '' });
  const [errors, setErrors]   = useState({});
  const [topic, setTopic]     = useState(TOPICS[0]);
  const [status, setStatus]   = useState(null); // { type: 'ok'|'err', text: string }
  const [loading, setLoading] = useState(false);

  // FAQ state
  const [expanded, setExpanded] = useState(0); // open first by default

  useEffect(() => {
    document.title = 'Contact Us — AwakeVerse';
  }, []);

  // ── Form handlers ──────────────────────────────────────────────────────────

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  }, []);

  const validate = useCallback(() => {
    const errs = {};
    if (!form.name.trim())    errs.name    = 'Name is required.';
    if (!form.email.trim())   errs.email   = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                              errs.email   = 'Invalid email format.';
    if (!form.message.trim()) errs.message = 'Message is required.';
    return errs;
  }, [form]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setStatus(null);
    try {
      const payload = {
        ...form,
        message: `[${topic}] ${form.message}`.trim(),
      };
      const res = await fetch(`${API_BASE}/api/contact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error sending message.');
      }
      setStatus({ type: 'ok', text: "Message sent — we'll get back to you shortly." });
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  }, [form, topic, validate]);

  const handleClear = useCallback(() => {
    setForm({ name: '', email: '', message: '' });
    setErrors({});
    setStatus(null);
  }, []);

  // ── FAQ handler ────────────────────────────────────────────────────────────

  const toggleFaq = useCallback((i) => {
    setExpanded(prev => prev === i ? null : i);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <header className={styles.header}>
        <span className={styles.wordmark}>
          <span className={styles.wmAccent}>A</span>
          <span className={styles.wmBase}>wake</span>
          <span className={styles.wmAccent}>V</span>
          <span className={styles.wmBase}>erse</span>
        </span>

        <div className={styles.headerCenter}>
          <span className={styles.headerTitle}>Contact Us</span>
          <span className={styles.headerSub}>We'd love to hear from you</span>
        </div>

        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <BackIcon />
          Back
        </button>
      </header>

      {/* ── PILL NAV ── */}
      <nav className={styles.navStrip} aria-label="Contact sections">
        <div className={styles.pillNav}>
          {[
            { id: 'message', label: 'Message Us' },
            { id: 'faq',     label: 'FAQ'         },
            { id: 'find',    label: 'Find Us'      },
          ].map(tab => (
            <button
              key={tab.id}
              className={`${styles.pillBtn} ${activeTab === tab.id ? styles.pillActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <main className={styles.contentArea}>

        {/* ── PANEL: MESSAGE US ── */}
        <div className={`${styles.panel} ${styles.messagePanel} ${activeTab === 'message' ? styles.panelActive : ''}`}>

          {/* Form column */}
          <form className={styles.formCol} onSubmit={handleSubmit} noValidate>
            <p className={styles.formLegend}>Send us a message</p>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">Your name</label>
                <input
                  id="name" name="name" type="text"
                  className={styles.input}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                />
                {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email address</label>
                <input
                  id="email" name="email" type="email"
                  className={styles.input}
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
              </div>
            </div>

            <div className={styles.fieldFull}>
              <label className={styles.label} htmlFor="topic">Topic</label>
              <select
                id="topic"
                className={styles.select}
                value={topic}
                onChange={e => setTopic(e.target.value)}
              >
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className={styles.fieldGrow}>
              <label className={styles.label} htmlFor="message">Message</label>
              <textarea
                id="message" name="message"
                className={styles.textarea}
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us what you have in mind…"
              />
              {errors.message && <span className={styles.fieldError}>{errors.message}</span>}
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                <SendIcon />
                {loading ? 'Sending…' : 'Send message'}
              </button>
              <button type="button" className={styles.btnGhost} onClick={handleClear} disabled={loading}>
                Clear
              </button>
              {status && (
                <span className={`${styles.statusMsg} ${status.type === 'ok' ? styles.statusOk : styles.statusErr}`}>
                  {status.text}
                </span>
              )}
            </div>
          </form>

          {/* Contact sidebar */}
          <aside className={styles.contactCol}>

            <div className={styles.infoCard}>
              <div className={styles.infoCardTitle}>
                <MailIcon />
                Direct email
              </div>
              {[
                { label: 'Support',      href: 'mailto:support@awakeverse.com',  text: 'support@awakeverse.com'  },
                { label: 'Partnerships', href: 'mailto:partners@awakeverse.com', text: 'partners@awakeverse.com' },
                { label: 'Press',        href: 'mailto:press@awakeverse.com',    text: 'press@awakeverse.com'    },
              ].map(({ label, href, text }) => (
                <div key={label} className={styles.contactPair}>
                  <span className={styles.contactPairLabel}>{label}</span>
                  <a href={href} className={styles.contactPairLink}>{text}</a>
                </div>
              ))}
              <div className={styles.chipsRow}>
                <span className={styles.chip}>Mon–Fri</span>
                <span className={styles.chip}>9:00–17:30 UK</span>
                <span className={styles.chip}>Avg. reply 1–2 days</span>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoCardTitle}>
                <PinIcon />
                Office
              </div>
              <p className={styles.officeText}>
                <strong>AwakeVerse Ltd</strong><br/>
                Astley Brook, Bolton BL1<br/>
                United Kingdom<br/>
                <span className={styles.officeSmall}>Co. No. 16791906 · By appointment</span>
              </p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoCardTitle}>
                <GlobeIcon />
                Follow us
              </div>
              <div className={styles.socialRow}>
                <a href="https://twitter.com/av.ai" target="_blank" rel="noreferrer" className={styles.socialLink}>
                  <XTwitterIcon /> X / Twitter
                </a>
                <a href="https://instagram.com/awakeverse.ai" target="_blank" rel="noreferrer" className={styles.socialLink}>
                  <InstagramIcon /> Instagram
                </a>
                <a href="https://linkedin.com/company/awakeverse" target="_blank" rel="noreferrer" className={styles.socialLink}>
                  <LinkedInIcon /> LinkedIn
                </a>
              </div>
            </div>

          </aside>
        </div>

        {/* ── PANEL: FAQ ── */}
        <div className={`${styles.panel} ${styles.faqPanel} ${activeTab === 'faq' ? styles.panelActive : ''}`}>
          <div className={styles.faqWrap}>
            <div className={styles.faqHeader}>
              <h2>Frequently asked questions</h2>
              <p>Can't find what you're looking for? Switch to Message Us to reach us directly.</p>
            </div>

            <div className={styles.faqList}>
              {FAQS.map((faq, i) => (
                <div key={i} className={styles.faqItem}>
                  <button
                    className={`${styles.faqQ} ${expanded === i ? styles.faqQOpen : ''}`}
                    onClick={() => toggleFaq(i)}
                    aria-expanded={expanded === i}
                  >
                    <span className={styles.faqQText}>{faq.q}</span>
                    <span className={`${styles.faqIcon} ${expanded === i ? styles.faqIconOpen : ''}`}>
                      +
                    </span>
                  </button>
                  {expanded === i && (
                    <div className={styles.faqA}>{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── PANEL: FIND US ── */}
        <div className={`${styles.panel} ${styles.findPanel} ${activeTab === 'find' ? styles.panelActive : ''}`}>

          {/* Map column — replace div with iframe when ready */}
          <div className={styles.mapCol}>
            {/* To embed Google Maps, replace the content below with:
                <iframe
                  src="https://maps.google.com/maps?q=Bolton+BL1&output=embed"
                  className={styles.mapIframe}
                  title="AwakeVerse office location"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
            */}
            <div className={styles.mapPlaceholder}>
              <MapPinLargeIcon />
              <p>Astley Brook, Bolton BL1<br/>Greater Manchester, UK</p>
              <small>Replace with Google Maps iframe</small>
            </div>
          </div>

          {/* Details column */}
          <div className={styles.detailsCol}>

            <div className={styles.detailBlock}>
              <div className={styles.detailTitle}><PinIcon /> Registered office</div>
              <p className={styles.detailText}>
                <strong>AwakeVerse Ltd</strong><br/>
                Astley Brook, Bolton BL1<br/>
                United Kingdom<br/><br/>
                <strong>Company No:</strong> 16791906<br/>
                <strong>Visits:</strong> By appointment only
              </p>
            </div>

            <div className={styles.detailBlock}>
              <div className={styles.detailTitle}><ClockIcon /> Office hours</div>
              <p className={styles.detailText}>
                <strong>Monday – Friday</strong><br/>
                9:00 – 17:30 (GMT / BST)<br/><br/>
                <strong>Response time:</strong> 1–2 business days<br/>
                <strong>Urgent?</strong> <em>Mark topic as Account &amp; Billing</em>
              </p>
            </div>

            <div className={styles.detailBlock}>
              <div className={styles.detailTitle}><MailIcon /> Contact</div>
              <p className={styles.detailText}>
                <strong>Support</strong>{' '}
                <a href="mailto:support@awakeverse.com">support@awakeverse.com</a><br/>
                <strong>Press</strong>{' '}
                <a href="mailto:press@awakeverse.com">press@awakeverse.com</a><br/>
                <strong>Partnerships</strong>{' '}
                <a href="mailto:partners@awakeverse.com">partners@awakeverse.com</a>
              </p>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}