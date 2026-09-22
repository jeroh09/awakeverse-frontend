// src/pages/PricingPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import './PricingPage.css';
import SEOHead from '../components/SEO/SEOHead';

// ── Subscription plans (canonical: starter=Explorer, pro=Professional, unlimited=Creator) ──
const plans = [
  {
    id: 'free',
    name: 'Free',
    tag: 'Start creating, no card',
    price: '£0',
    cta: 'Get started',
    to: '/register',
    variant: 'free',
    features: [
      { type: 'tick', text: 'Free character creation' },
      { type: 'tick', text: 'Market Hub access' },
      { type: 'tick', text: 'A trial render to explore' },
      { type: 'tick', text: 'Community access' },
    ],
  },
  {
    id: 'starter',
    name: 'Explorer',
    tag: 'Unlock the Verse',
    price: '£10.99',
    cta: 'Choose Explorer',
    to: '/register',
    features: [
      { type: 'tick', metric: '2,000', text: 'credits / month' },
      { type: 'tick', text: 'Everything in Free' },
      { type: 'tick', text: 'Creator Hub access' },
      { type: 'tick', text: 'Unlimited consistent characters' },
      { type: 'tick', metric: '300', text: 'image generations' },
      { type: 'tick', text: 'Podcast, dialogue & film' },
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    tag: 'Build & monetise',
    price: '£19.99',
    cta: 'Choose Professional',
    to: '/login',
    popular: true,
    features: [
      { type: 'tick', metric: '4,000', text: 'credits / month' },
      { type: 'lead', text: 'Everything in Explorer, plus' },
      { type: 'tick', text: 'Monetisation — earn from Market Hub' },
      { type: 'tick', text: '60/40 revenue share' },
      { type: 'star', metric: 'Business intelligence', text: '— weekly briefs' },
      { type: 'tick', metric: '700', text: 'image generations' },
    ],
  },
  {
    id: 'unlimited',
    name: 'Creator',
    tag: 'Go pro & scale',
    price: '£29.99',
    cta: 'Choose Creator',
    to: '/login',
    features: [
      { type: 'tick', metric: '6,000', text: 'credits / month' },
      { type: 'lead', text: 'Everything in Professional, plus' },
      { type: 'tick', text: 'Featured marketplace placement' },
      { type: 'tick', text: '80/20 revenue share' },
      { type: 'tick', text: 'Priority AI models & support' },
      { type: 'tick', metric: '1,000', text: 'image generations' },
    ],
  },
];

const Feature = ({ f }) => {
  if (f.type === 'lead') return <li className="lead">{f.text}</li>;
  const marker = f.type === 'star'
    ? <span className="star">★</span>
    : <span className="tk">✓</span>;
  return (
    <li>
      {marker}
      <span>{f.metric && <span className="metric">{f.metric} </span>}{f.text}</span>
    </li>
  );
};

const PricingPage = () => {
  return (
    <div className="pricing-container">
      <SEOHead
        title="Pricing — Create, Own & Earn | AwakeVerse"
        description="AwakeVerse is free to start. Build AI characters, films, podcasts and dialogue, own your creations with IP certification, earn from Market Hub, and get weekly business intelligence on Professional and up."
        url="https://awakeverse.com/pricing"
      />

      {/* Header */}
      <header className="site">
        <Link to="/" className="logo">AwakeVerse</Link>
        <nav className="nav">
          <a href="#create">Create</a>
          <a href="#earn">Earn</a>
          <a href="#business">Business</a>
          <a href="#plans">Pricing</a>
          <Link to="/login" className="btn ghost">Sign In</Link>
          <Link to="/register" className="btn solid">Get Started</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero">
        <span className="pill">◆ AI film, podcast &amp; dialogue studio</span>
        <h1>Create characters, films &amp; podcasts —<br />own them, and earn</h1>
        <p>One credit balance across every tool. Build characters for free, generate 1080p video, and turn your creations into income.</p>
        <div className="free-line">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12l4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Character creation is 100% free — no card to start
        </div>
      </section>

      {/* CREATE */}
      <section id="create" className="wrap">
        <div className="section-head">
          <span className="pill">Create</span>
          <h2>Four ways to create</h2>
          <p>Start with a character, then bring it to life — every generation draws from your monthly credits.</p>
        </div>
        <div className="grid4">
          {/* Characters */}
          <div className="tile dbl">
            <div className="ic green">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20a8 8 0 0 1 16 0" strokeLinecap="round" />
                <path d="M18 3l.7 1.6L20.5 5l-1.8.8L18 7l-.7-1.4L15.5 5l1.8-.4z" fill="var(--green)" stroke="none" />
              </svg>
            </div>
            <div className="cats"><span className="cat green">Free</span><span className="cat">Consistent</span></div>
            <h3>Characters</h3>
            <p>Design consistent, reusable AI characters — completely free. They're the cast for everything else you make.</p>
          </div>

          {/* Podcast */}
          <div className="tile dbl">
            <div className="ic">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-2)" strokeWidth="1.8">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M6 11a6 6 0 0 0 12 0" strokeLinecap="round" />
                <path d="M12 17v4M8 21h8" strokeLinecap="round" />
                <circle cx="19" cy="5" r="2" fill="var(--indigo-2)" stroke="none" />
              </svg>
            </div>
            <div className="cats"><span className="cat">Solo</span><span className="cat">2 guests</span></div>
            <h3>Podcast</h3>
            <p>Host a solo show, or sit down with up to two AI guests for a natural, back-and-forth conversation.</p>
          </div>

          {/* Dialogue */}
          <div className="tile dbl">
            <div className="ic">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-2)" strokeWidth="1.8">
                <path d="M3 5h9a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H7l-4 3z" strokeLinejoin="round" />
                <path d="M21 9v3a2 2 0 0 1-2 2h-1v3l-3-3" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="cats"><span className="cat">Multi-character</span><span className="cat green">→ Film</span></div>
            <h3>Dialogue</h3>
            <p>A debate or discussion between multiple characters — then turn the whole exchange into a finished film.</p>
          </div>

          {/* Film */}
          <div className="tile dbl">
            <div className="ic">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-2)" strokeWidth="1.8">
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <path d="M3 9h18M7 6v3M12 6v3M17 6v3" />
                <path d="M10 12l4 2.5-4 2.5z" fill="var(--indigo-2)" stroke="none" />
              </svg>
            </div>
            <div className="cats"><span className="cat">Free-form</span><span className="cat">AI director</span></div>
            <h3>Film</h3>
            <p>Free-form creation with an AI assistant and a director that shapes anything you can imagine, shot by shot.</p>
          </div>
        </div>
      </section>

      {/* EARN & OWN */}
      <section id="earn" className="wrap">
        <div className="section-head">
          <span className="pill green">Earn</span>
          <h2>Own your creations — and earn from them</h2>
          <p>Your characters are yours. Publish them, get them certified, and earn every time someone uses them.</p>
        </div>
        <div className="grid-earn">
          {/* Publish & earn */}
          <div className="tile dbl green">
            <div className="ic green">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8">
                <path d="M12 16V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
              </svg>
            </div>
            <div className="cats"><span className="cat green">Market Hub</span><span className="cat green">Revenue share</span></div>
            <h3>Publish &amp; earn</h3>
            <p>List your characters on Market Hub for others to use, and earn a monthly share — up to 80/20 in your favour.</p>
          </div>

          {/* You own it */}
          <div className="tile dbl">
            <div className="ic">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-2)" strokeWidth="1.8">
                <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="cats"><span className="cat">Yours</span></div>
            <h3>You own your characters</h3>
            <p>Everything you create belongs to you. Keep, publish, or take it anywhere — no lock-in.</p>
          </div>

          {/* IP certified */}
          <div className="tile dbl">
            <div className="ic">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-2)" strokeWidth="1.8">
                <circle cx="12" cy="9" r="5" />
                <path d="M9 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.5 13.5L7 22l5-2.5L17 22l-1.5-8.5" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="cats"><span className="cat">IP certificate</span><span className="cat">QR verified</span></div>
            <h3>IP-certified characters</h3>
            <p>Each character earns an IP certificate with a public, QR-verifiable record — proof it's yours, anywhere it appears.</p>
          </div>
        </div>
      </section>

      {/* BUILD YOUR BUSINESS (SMB Intelligence) */}
      <section id="business" className="wrap">
        <div className="section-head">
          <span className="pill">Professional &amp; up</span>
          <h2>Build your creative business</h2>
          <p>Curated intelligence for your niche — so your creations meet a real market.</p>
        </div>

        <div className="biz dbl">
          <div>
            <span className="pill">Business intelligence</span>
            <h3>Weekly briefs, tuned to your niche</h3>
            <p>Tell AwakeVerse about your business and audience. Each week it scans your sector, scores what matters to you, and delivers a strategic brief you can act on — and download as PDF or DOCX.</p>
            <ul className="feat biz-feat">
              <li><span className="tk">✓</span><span>Scenarios you configure for your own niche &amp; audience</span></li>
              <li><span className="tk">✓</span><span>Cross-checked by three AI roles — Analyst, Strategist &amp; Critic</span></li>
              <li><span className="tk">✓</span><span>Delivered weekly, with approve / note / track</span></li>
              <li><span className="tk">✓</span><span>Exportable as PDF &amp; DOCX</span></li>
            </ul>
          </div>
          <div className="brief">
            <div className="brief-top">
              <span className="tag">Weekly brief</span>
              <span className="tag">Your niche</span>
            </div>
            <div className="brief-line m" />
            <div className="brief-line s" />
            <div className="brief-line m" />
            <div className="brief-line" />
            <div className="brief-line s" />
            <div className="roles">
              <span className="role">◆ Analyst</span><span className="role">◆ Strategist</span><span className="role">◆ Critic</span>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="plans" className="wrap">
        <div className="section-head">
          <span className="pill">Pricing</span>
          <h2>Simple credits. Serious output.</h2>
          <p>Every credit works across film, podcast and dialogue. Cancel anytime.</p>
        </div>

        <div className="plans">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan ${plan.popular ? 'popular' : 'dbl'} ${plan.variant === 'free' ? 'free' : ''}`}
            >
              {plan.popular && <div className="ribbon">★ MOST POPULAR</div>}
              <div className="pbody">
                <div className="pname">{plan.name}</div>
                <div className="ptag">{plan.tag}</div>
                <div className="price"><b>{plan.price}</b><span>/month</span></div>
                <Link to={plan.to} className="pcta">{plan.cta}</Link>
                <ul className="feat">
                  {plan.features.map((f, i) => <Feature key={i} f={f} />)}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Trust */}
        <div className="trust">
          <div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" strokeLinejoin="round" /></svg>
            Secure payment
          </div>
          <div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 10a8 8 0 1 1 2 5" strokeLinecap="round" /><path d="M4 5v5h5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Cancel anytime
          </div>
          <div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12M8 11l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 21h14" strokeLinecap="round" /></svg>
            Earn from your characters
          </div>
          <div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="9" r="5" /><path d="M8.5 13.5L7 22l5-2.5L17 22l-1.5-8.5" /></svg>
            IP-certified &amp; verifiable
          </div>
        </div>
      </section>

      <footer className="pricing-footer">© 2026 AwakeVerse. All rights reserved.</footer>
    </div>
  );
};

export default PricingPage;