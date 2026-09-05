// src/pages/PodcastCreatorPage.js
// Campaign landing — route: /podcast-studio (same top-level pattern as /pricing).
//
// Implementation mirrors PricingPage.js exactly:
//   • Scoped container class (.podcast-creator-container) + its own CSS file
//   • Same tokens, .dbl helper, .pill / .tile / .cat / .section-head vocabulary
//   • SEOHead + react-router Links
//
// ROUTING (per spec):
//   Pricing links      → /pricing
//   All other CTAs     → /login
//
// IMAGE MANIFEST — all assets live in /public/assets/podcast-creator/
// (see ASSETS constant). Every slot degrades gracefully if the file is
// missing: video → animated gradient fallback, images → studio-gradient
// background-color, so the page never shows a broken tile.

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './PodcastCreatorPage.css';
import SEOHead from '../components/SEO/SEOHead';

// ── Image manifest ───────────────────────────────────────────────────────────
// Stills + portrait: your own uploads in /public/assets/podcast-creator/.
// Environment plates: REAL Spaces CDN URLs (podcast_environments table) — no
// re-upload, the page points straight at the same plates the studio uses.
// Hero video: upload the compressed loop to Spaces and paste its CDN URL into
// heroMp4 (see note). Every slot degrades gracefully if a file is missing.
const A = '/assets/podcast-creator';
const CDN = 'https://awakeverse-blog.lon1.cdn.digitaloceanspaces.com';

const ASSETS = {
  // Live on Spaces CDN. NOTE: filename is 'podcasts' (plural) — matches the
  // actual uploaded object; do not "correct" to singular or the hero 404s.
  heroMp4:     `${CDN}/content/campaign/podcasts-hero-loop.mp4`,
  heroWebm:    `${A}/hero-loop.webm`,       // optional; MP4 covers all browsers
  heroPoster:  `${CDN}/content/campaign/hero-poster.jpg`,

  stillWide:   `${A}/still-interview-wide.jpg`,  // your render, 1600×900
  stillPanel:  `${A}/still-panel-three.jpg`,     // your render, 1600×900
  stillSolo:   `${A}/still-solo-close.jpg`,      // your render, 1600×900
  portrait:    `${A}/character-portrait.jpg`,    // your character, 1200×1500 (4:5)
};

// Environment plates for the "Pick your set" strip — real CDN plates,
// curated for visual range (studios, outdoor, and a 3-seat panel to show
// panel mode). guestCap surfaces the panel capability as a tag.
const ENV_PLATES = [
  { name: 'Tech Studio',       cap: 2, url: `${CDN}/content/podcast_environments/studio_tech.png` },
  { name: 'Photographer',      cap: 2, url: `${CDN}/content/podcast_environments/studio_photo.png` },
  { name: 'City Rooftop',      cap: 2, url: `${CDN}/content/podcast_environments/outdoor_city.png` },
  { name: 'Beach',             cap: 2, url: `${CDN}/content/podcast_environments/outdoor_beach.png` },
  { name: 'Living Room',       cap: 2, url: `${CDN}/content/podcast_environments/studio_living_room.png` },
  { name: 'Gaming Studio',     cap: 2, url: `${CDN}/content/podcast_environments/studio_gaming.png` },
  { name: 'Legends Studio',    cap: 2, url: `${CDN}/content/podcast_environments/studio_legends.png` },
  { name: 'Debate Panel',      cap: 3, url: `${CDN}/content/podcast_environments/panel_debate_c.png` },
];

const bg = (url) => ({ backgroundImage: `url('${url}')` });

const PodcastCreatorPage = () => {
  const videoRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);

  // Hero video: autoplay+muted+loop+playsinline works on macOS/iOS Safari,
  // Chrome (Win/Mac/ChromeOS), Edge and Android. Kick play() for Safari.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // React quirk: the `muted` prop sets the JS property but not always the
    // DOM attribute — Safari's autoplay policy checks can fail without it.
    // Force both, plus playsInline, before kicking play().
    v.muted = true;
    v.setAttribute('muted', '');
    v.playsInline = true;
    if (v.play) v.play().catch(() => {});
  }, []);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll('.podcast-creator-container .rv');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="podcast-creator-container">
      <SEOHead
        title="Podcast Creator — Solo shows, guests & panels | AwakeVerse"
        description="Turn your documents into cinematic, cited podcast videos. Upload sources, get instant insight and an instant script with every claim checked, then create your podcast — solo, interview or full panel."
        url="https://awakeverse.com/podcast-studio"
      />

      {/* Header — same structure as PricingPage */}
      <header className="site">
        <Link to="/" className="logo">AwakeVerse</Link>
        <nav className="nav">
          <a href="#pipeline">How it works</a>
          <a href="#individuals">For individuals</a>
          <Link to="/pricing">Pricing</Link>
          <Link to="/login" className="btn ghost">Sign In</Link>
          <Link to="/login" className="btn solid">Try Podcast Studio</Link>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="vhero">
        {!videoFailed && (
          <video
            ref={videoRef}
            autoPlay muted loop playsInline preload="metadata"
            poster={ASSETS.heroPoster}
            onError={() => setVideoFailed(true)}
          >
            <source src={ASSETS.heroMp4} type="video/mp4"
                    onError={() => setVideoFailed(true)} />
          </video>
        )}
        {videoFailed && <div className="vfallback" />}
        <div className="scrim" />
        <div className="vhero-inner">
          <span className="pill">◆ Solo · Interview · Panel</span>
          <h1>Podcast Creator</h1>
          <div className="sub">For solo podcasts, guests, and panels.</div>
          <p className="lede">
            Your documents in — a cinematic, cited, lip-synced podcast video out.
            Sources read, insights extracted, the script written and every claim checked.
          </p>
          <div className="cta-row">
            <Link to="/login" className="btn solid">Try Podcast Studio</Link>
            <a href="#pipeline" className="btn ghost">See how it works ↓</a>
          </div>
          <div className="hint">Runs in the browser — Mac, Windows, ChromeOS &amp; mobile</div>
        </div>
      </section>

      {/* ── FOLD — finished outputs as player cards ── */}
      <div className="fold">
        <div className="player rv">
          <div className="screen" style={bg(ASSETS.stillWide)}>
            <div className="playbtn" />
            <div className="time">04:12</div>
            <div className="cap">“…page four of the Q3 report tells the story.”</div>
          </div>
          <div className="meta">
            <span className="cat">Interview</span>
            <span className="t">Host + guest · tech studio</span>
          </div>
        </div>
        <div className="player rv">
          <div className="screen" style={bg(ASSETS.stillPanel)}>
            <div className="playbtn" />
            <div className="time">06:48</div>
            <div className="cap">“Let’s hear the counter-argument on that.”</div>
          </div>
          <div className="meta">
            <span className="cat green">Panel</span>
            <span className="t">Three speakers · host centre</span>
          </div>
        </div>
        <div className="player rv">
          <div className="screen" style={bg(ASSETS.stillSolo)}>
            <div className="playbtn" />
            <div className="time">01:00</div>
            <div className="cap">“Three things your team should know this week.”</div>
          </div>
          <div className="meta">
            <span className="cat">Solo brief</span>
            <span className="t">One speaker · 1-min update</span>
          </div>
        </div>
      </div>

      {/* ── PIPELINE — Upload → Insight → Script → Podcast ── */}
      <section id="pipeline" className="wrap">
        <div className="section-head rv">
          <span className="pill">From documents to broadcast</span>
          <h2>Four steps. No studio. No crew.</h2>
          <p>Built for teams that publish on the record — every line traceable to a source.</p>
        </div>

        <div className="pipeline rv">
          <div className="tile dbl">
            <div className="ic">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-2)" strokeWidth="1.8">
                <path d="M12 16V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
              </svg>
            </div>
            <div className="cats"><span className="cat">Step 1</span></div>
            <h3>Upload your sources</h3>
            <p>PDFs, Word docs, decks, text, web links, YouTube — even 40 minutes of audio, transcribed automatically.</p>
          </div>

          <div className="tile dbl">
            <div className="ic">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-2)" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5M11 8v3l2 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="cats"><span className="cat">Step 2</span></div>
            <h3>Instant insight</h3>
            <p>The studio reads everything and notes the key points — the claims, numbers and narrative worth airtime.</p>
          </div>

          <div className="tile dbl">
            <div className="ic">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-2)" strokeWidth="1.8">
                <path d="M12 19l7-7 3 3-7 7-3-3z" strokeLinejoin="round" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="cats"><span className="cat">Step 3</span></div>
            <h3>Instant script</h3>
            <p>A natural conversation in your chosen style, tone and length — every line carrying citations back to your sources.</p>
          </div>

          <div className="tile dbl green">
            <div className="ic green">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8">
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <path d="M10 9.5l4.5 2.5-4.5 2.5z" fill="var(--green)" stroke="none" />
              </svg>
            </div>
            <div className="cats"><span className="cat green">Step 4</span></div>
            <h3>Create podcast</h3>
            <p>Lip-synced delivery, cinematic camera cuts, ambient sound and captions — a finished MP4, verified before it renders.</p>
          </div>
        </div>

        {/* Live proof: sources in → cited script out */}
        <div className="pipedemo">
          <div className="dcard dbl rv">
            <div className="dhead">Sources · your library</div>
            <div className="dbody">
              <div className="srow">📄 Q3-Report.pdf · 42 pages<span className="status ok">Ready</span></div>
              <div className="srow">📊 Board-Deck.pptx · 18 slides<span className="status ok">Ready</span></div>
              <div className="srow">▶️ Earnings call · 38 min<span className="status busy">Listening…</span></div>
              <div className="insight">
                <b>Instant insight</b> — Churn fell 18% in Q3, driven by the July onboarding
                rebuild; retention now leads the sector median by 6 points.
              </div>
            </div>
          </div>
          <div className="dcard dbl green rv">
            <div className="dhead"><span className="dot" /> Script · every claim checked</div>
            <div className="dbody">
              <div className="gline">
                <div className="who host">Host</div>
                <div className="txt">Churn dropped eighteen percent in Q3 — the biggest quarterly improvement since launch.</div>
                <div className="chips">
                  <span className="chip">❝ Q3-Report.pdf · p.4</span>
                  <span className="chip">❝ Board-Deck.pptx · §2</span>
                </div>
              </div>
              <div className="gline">
                <div className="who guest">Guest</div>
                <div className="txt">And almost all of that came from the onboarding rebuild we shipped in July.</div>
                <div className="chips">
                  <span className="chip">❝ Q3-Report.pdf · p.6</span>
                  <span className="chip warn">⚠ Earnings call · needs review</span>
                </div>
              </div>
              <div className="gnote">
                Chips open the exact passage they cite. <b>Amber</b> means the grounding check
                couldn’t fully back the line — flagged for review before render, not after publish.
              </div>
            </div>
          </div>
          <div className="dcard dbl rv">
            <div className="dhead">Voice · pick a sound</div>
            <div className="dbody">
              <div className="vrow clone">
                <div className="vplay" />
                <div className="vmeta">
                  <div className="vname">Your voice</div>
                  <div className="vtag">Cloned · 42s sample</div>
                </div>
                <span className="vpick you">You</span>
              </div>
              <div className="vrow sel">
                <div className="vplay" />
                <div className="vmeta">
                  <div className="vname">Rachel</div>
                  <div className="vtag">Warm · Female</div>
                </div>
                <span className="vpick">Host</span>
              </div>
              <div className="vrow">
                <div className="vplay" />
                <div className="vmeta">
                  <div className="vname">Adam</div>
                  <div className="vtag">Neutral · Male</div>
                </div>
              </div>
              <div className="vrow">
                <div className="vplay" />
                <div className="vmeta">
                  <div className="vname">Domi</div>
                  <div className="vtag">Confident · Female</div>
                </div>
              </div>
              <div className="gnote">
                Clone your own from a 30-second reading, or assign any line a
                library voice. Tap ▶ to preview.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR INDIVIDUALS ── */}
      <section id="individuals" className="wrap">
        <div className="section-head rv">
          <span className="pill green">For individuals</span>
          <h2>No documents? Start from a conversation.</h2>
          <p>The same studio works from a blank page — build a host, talk your idea through, press Generate.</p>
        </div>
        <div className="indiv">
          <div className="portrait dbl rv" style={bg(ASSETS.portrait)}>
            <div className="plabel">
              <span className="cat">Generated host</span>
              <span className="cat green">Voice cloned</span>
            </div>
          </div>
          <div className="indiv-tiles">
            <div className="tile dbl rv">
              <div className="cats"><span className="cat">01 · Create character</span></div>
              <h3>A host from one photo — or one sentence</h3>
              <p>Upload a clear photo and become the host, or describe a character and we generate one. Clone your voice from a 30-second reading, or pick from the voice library.</p>
            </div>
            <div className="tile dbl rv">
              <div className="cats"><span className="cat">02 · Start a chat</span></div>
              <h3>Talk the episode into existence</h3>
              <p>Give the AI writer a topic and shape the script in conversation — or import a chat you’ve already had. Edit line by line, record any line in your own voice.</p>
            </div>
            <div className="tile dbl rv">
              <div className="cats"><span className="cat green">03 · Create podcast</span></div>
              <h3>Press Generate, publish anywhere</h3>
              <p>The studio lip-syncs every line, cuts the cameras and mixes the room. Your episode lands in My Podcasts as an MP4 — from 1-minute clips to 5-minute deep dives.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ENVIRONMENTS ── */}
      <section className="wrap">
        <div className="section-head rv">
          <span className="pill">Pick your set</span>
          <h2>Seventeen studios. Or invent your own.</h2>
          <p>Two-seat studios for interviews, three-seat panels for debates — or describe a set and we build it.</p>
        </div>
        <div className="envs rv">
          {ENV_PLATES.map((e) => (
            <div key={e.url} className="env" style={bg(e.url)}>
              {e.cap === 3 && <span className="cap-tag">3-seat panel</span>}
              <span>{e.name}</span>
            </div>
          ))}
          <div className="env custom"><span>+ Describe your own</span></div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="wrap">
        <div className="band dbl rv">
          <h2>Put your documents on air.</h2>
          <p>
            Start free with credits for your first render. Episodes are priced by spoken
            length — the exact cost is shown before you press Generate.
          </p>
          <div className="cta-row">
            <Link to="/login" className="btn solid">Try Podcast Studio</Link>
            <Link to="/pricing" className="btn ghost">See pricing</Link>
          </div>
          <div className="fineprint">No camera. No mic required. No editing timeline. Ever.</div>
        </div>
      </section>

      <footer className="pc-footer">© 2026 AwakeVerse. All rights reserved.</footer>
    </div>
  );
};

export default PodcastCreatorPage;