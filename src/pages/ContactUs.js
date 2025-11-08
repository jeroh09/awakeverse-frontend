// src/pages/ContactUs.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('General enquiry'); // used to prefix message only
  const [expanded, setExpanded] = useState(null); // FAQ accordion
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Contact Us — AwakeVerse';
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format.';
    if (!form.message.trim()) errs.message = 'Message is required.';
    return errs;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      // Keep backend payload unchanged; we just prefix the selected topic to the message
      const payload = {
        ...form,
        message: `[${topic}] ${form.message}`.trim(),
      };

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://api.awakeverse.com'}/api/contact`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error sending message.');
      }
      setStatus('✅ Thank you! Your message has been sent. We’ll get back to you shortly.');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Contact form error:', err);
      setStatus(`⚠️ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: 'How fast do you reply?',
      a: 'We aim to respond within 1–2 business days. For urgent issues (like billing access), choose “Account & Billing” as the topic.',
    },
    {
      q: 'Can I request a custom character or integration?',
      a: 'Yes. Use “Partnerships & Integrations” to outline your idea. Include scope, timeline, and any relevant links.',
    },
    {
      q: 'Where are you based?',
      a: 'We operate remotely with a presence in Manchester / UK. Visits are by appointment only.',
    },
    {
      q: 'Is my data safe?',
      a: 'We use secure session handling and store only what we need to provide the service. See the Privacy note below for more details.',
    },
  ];

  // Inline style sheet (scoped to this page)
  const styles = `
    :root{
      --bg:#0a0d18;
      --panel:#0f1428;
      --ink:#e9ecf1;
      --muted:#a9b2c7;
      --gold:#e8c26b;
      --line:#1a2244;
      --chip:#141a33;
      --radius:16px;
    }
    .page{
      color:var(--ink);
      background:
        radial-gradient(1200px 600px at 12% -10%, #2230 0%, #0000 60%),
        linear-gradient(180deg, #090d19 0%, #0a0d18 100%);
      min-height: 100vh;
    }
    .wrap{ width:min(1100px, 92vw); margin: 0 auto; padding: 24px 0 64px }
    .hero{
      margin-top: 18px;
      background: linear-gradient(180deg, #101638, #0f1428);
      border: 1px solid var(--line);
      border-radius: calc(var(--radius) + 8px);
      padding: clamp(18px, 4vw, 32px);
      box-shadow: 0 10px 40px #0008, inset 0 0 0 1px #ffffff0a;
    }
    .title{ font-size: clamp(24px, 3vw, 34px); margin: 0 0 6px 0 }
    .sub{ color: var(--muted); margin: 0 }
    .grid{
      margin-top: 18px;
      display: grid; gap: 18px;
      grid-template-columns: 1.2fr .8fr;
    }
    @media (max-width: 860px){ .grid{ grid-template-columns: 1fr } }

    /* Form card */
    .card{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: clamp(14px, 3vw, 20px);
      box-shadow: 0 8px 28px #0007, inset 0 0 0 1px #ffffff08;
    }
    .legend{
      font-size: 16px; font-weight: 600; margin: 0 0 12px 0; letter-spacing: .2px;
    }
    .row{ display: grid; gap: 12px; grid-template-columns: 1fr 1fr; }
    @media (max-width: 560px){ .row{ grid-template-columns: 1fr } }
    label{ font-size: 13px; color: var(--muted); display:block; margin: 8px 0 6px }
    input[type="text"], input[type="email"], select, textarea{
      width: 100%; padding: 12px 12px; border-radius: 12px;
      border: 1px solid var(--line); background: #0b1022; color: var(--ink);
      box-shadow: inset 0 0 0 1px #ffffff08;
      outline: none;
    }
    input:focus, select:focus, textarea:focus{ box-shadow: inset 0 0 0 1px var(--gold) }
    .hint{ font-size: 12px; color: var(--muted); margin-top: 4px }
    .err{ color:#ff8c8c; font-size: 12px; margin-top: 6px }
    .actions{ display:flex; gap:10px; align-items:center; margin-top: 12px }
    .btn{
      appearance:none; border:0; cursor:pointer;
      background:linear-gradient(180deg, #f0d488, #d9b662); color:#1d1707; font-weight:700;
      padding: 12px 16px; border-radius: 12px; letter-spacing:.2px;
    }
    .btn:disabled{ opacity:.6; cursor:not-allowed }
    .ghost{
      background:#141b38; color:#c4cef3; border:1px solid #263468; font-weight:600;
    }
    .status{ margin-top: 10px; font-size: 14px }

    /* Side column */
    .mini-grid{ display:grid; gap:12px }
    .info{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 14px;
    }
    .info h4{ margin: 0 0 8px 0; font-size: 15px }
    .info p{ margin: 0; color: var(--muted); font-size: 14px }
    .pair{ display:flex; justify-content:space-between; gap:10px; margin-top:8px; color: var(--ink); font-size:14px }
    .pair span{ color: var(--muted) }

    .chips{ display:flex; gap:8px; flex-wrap:wrap; margin-top: 10px }
    .chip{
      background: var(--chip);
      border: 1px solid var(--line);
      color: var(--ink);
      padding: 6px 10px; border-radius: 999px; font-size: 12px;
    }

    /* FAQ */
    .faq{
      margin-top: 18px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 14px;
    }
    .item{ border-top: 1px dashed #24305a; }
    .item:first-child{ border-top: 0 }
    .q{
      display:flex; justify-content:space-between; align-items:center;
      cursor:pointer; padding: 12px 0; font-weight:600;
    }
    .a{ color: var(--muted); padding: 0 0 12px 0; }

    /* Map placeholder */
    .map{
      margin-top: 18px;
      background:#0b1022; border:1px solid var(--line); border-radius: var(--radius);
      padding: 10px; height: 220px; display:grid; place-items:center; color: var(--muted);
    }

    /* Footer notes */
    .notes{
      margin-top: 18px;
      display:grid; gap:12px;
      grid-template-columns: 1fr 1fr;
    }
    @media (max-width: 860px){ .notes{ grid-template-columns: 1fr } }
    .note{ background:var(--panel); border:1px solid var(--line); border-radius: var(--radius); padding: 14px }
    .note h4{ margin:0 0 6px 0; font-size: 15px }
    .note p{ margin:0; color:var(--muted) }

    /* Social */
    .social{ display:flex; gap:10px; margin-top: 10px }
    .social a{
      color:#c4cef3; text-decoration:none; border-bottom:1px dotted #5f6ea5;
    }
    .social a:hover{ color:var(--ink) }
  `;

  return (
    <div className="page">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="wrap">
        {/* HERO */}
        <section className="hero" aria-labelledby="contactTitle">
          <h1 id="contactTitle" className="title">Get in touch</h1>
          <p className="sub">Questions, ideas, or partnership proposals? We’d love to hear from you.</p>

          <div className="grid">
            {/* LEFT: FORM */}
            <div className="card">
              <p className="legend">Send us a message</p>
              <form onSubmit={handleSubmit} noValidate>
                <div className="row">
                  <div>
                    <label htmlFor="name">Your name</label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Ada Lovelace"
                      autoComplete="name"
                    />
                    {errors.name && <div className="err">{errors.name}</div>}
                  </div>

                  <div>
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    {errors.email && <div className="err">{errors.email}</div>}
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <label htmlFor="topic">Topic</label>
                  <select id="topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
                    <option>General enquiry</option>
                    <option>Account & Billing</option>
                    <option>Technical support</option>
                    <option>Partnerships & Integrations</option>
                    <option>Press & Media</option>
                  </select>
                  <div className="hint">We’ll route your message to the right person.</div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us what you have in mind…"
                  />
                  {errors.message && <div className="err">{errors.message}</div>}
                </div>

                <div className="actions">
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Sending…' : 'Send message'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="btn ghost"
                    disabled={loading}
                  >
                    Back
                  </button>
                </div>

                {status && <div className="status">{status}</div>}
              </form>
            </div>

            {/* RIGHT: QUICK CONTACT & DETAILS */}
            <aside className="mini-grid">
              <div className="info">
                <h4>Quick contacts</h4>
                <p>Prefer email? Reach us directly:</p>
                <div className="pair"><span>Support</span> <a href="mailto:support@awakeverse.com">support@awakeverse.com</a></div>
                <div className="pair"><span>Partnerships</span> <a href="mailto:partners@awakeverse.com">partners@awakeverse.com</a></div>
                <div className="pair"><span>Press</span> <a href="mailto:press@awakeverse.com">press@awakeverse.com</a></div>
                <div className="chips">
                  <span className="chip">Mon–Fri</span>
                  <span className="chip">9:00–17:30 (UK)</span>
                  <span className="chip">Avg. reply: 1–2 days</span>
                </div>
              </div>

              <div className="info">
                <h4>Office (by appointment)</h4>
                <p>AwakeVerse Ltd<br/>Oxford Road, Manchester M13 9PL<br/>United Kingdom</p>
                <p style={{ marginTop: 8 }}>Company No: 00000000</p>
              </div>

              <div className="info">
                <h4>Social</h4>
                <p>Follow updates and launch news:</p>
                <div className="social">
                  <a href="https://twitter.com/awakeverse" target="_blank" rel="noreferrer">X/Twitter</a>
                  <a href="https://instagram.com/awakeverse" target="_blank" rel="noreferrer">Instagram</a>
                  <a href="https://linkedin.com/company/awakeverse" target="_blank" rel="noreferrer">LinkedIn</a>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq" aria-labelledby="faqTitle" style={{ marginTop: 18 }}>
          <h3 id="faqTitle" style={{ margin: '4px 0 8px 0' }}>Frequently asked questions</h3>
          {faqs.map((f, i) => (
            <div className="item" key={i}>
              <div className="q" onClick={() => setExpanded(expanded === i ? null : i)} aria-expanded={expanded === i}>
                <span>{f.q}</span>
                <span>{expanded === i ? '–' : '+'}</span>
              </div>
              {expanded === i && <div className="a">{f.a}</div>}
            </div>
          ))}
        </section>

        {/* Map / Embed placeholder */}
        <section className="map" aria-label="Map">
          {/* Replace with an actual map iframe if you like */}
          <div>Map / directions placeholder (embed Google Maps or static image)</div>
        </section>

        {/* Notes: Accessibility & Privacy */}
        <section className="notes">
          <div className="note">
            <h4>Accessibility</h4>
            <p>We aim to make AwakeVerse usable by everyone. If you need adjustments or encounter barriers, please describe them in your message and we’ll prioritise a fix.</p>
          </div>
          <div className="note">
            <h4>Privacy</h4>
            <p>We only use your details to respond to your enquiry. For more, see our Privacy Policy and Data Retention Guide (links to be added).</p>
          </div>
        </section>
      </div>
    </div>
  );
}
