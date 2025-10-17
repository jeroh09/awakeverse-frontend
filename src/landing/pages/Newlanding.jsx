import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Newlanding.jsx — localhost test (Scroll 1 & 2)
 * ✔ Midnight‑blue gradient background (no stars)
 * ✔ Blue · White · Gold theme
 * ✔ "AwakeVerse" capitalization
 * ✔ Lightsource panels (glowing cards)
 * ✔ No dependency on old landing files; uses only image paths
 *
 * Place at: src/landing/pages/Newlanding.jsx
 * Route: <Route path="/new" element={<Newlanding/>} />
 */
export default function Newlanding() {
  return (
    <main style={styles.page}>
      <style>{css}</style>

      {/* ===== Scroll 1: 3‑slide carousel ===== */}
      <section className="snap-section">
        <Carousel>
          <HeroSlide />
          <CategoriesSlide />
          <CreateYourOwnSlide />
        </Carousel>
      </section>

      {/* ===== Scroll 2: Deep‑dive preview ===== */}
      <section className="snap-section alt">
        <FeaturePreview />
      </section>
    </main>
  );
}

/* --------------------------- Slide 1: Hero --------------------------- */
function HeroSlide() {
  return (
    <div className="slide hero">
      <div className="hero-inner">
        <h1 className="headline">AwakeVerse</h1>
        <p className="subcopy">Create, chat, and collaborate with legendary minds — in real time.</p>
        <div className="cta-row">
          <Link to="/register" className="btn btn-gold">Get started — it’s free</Link>
          <Link to="/register" className="btn btn-ghost">Browse characters</Link>
        </div>
      </div>
    </div>
  );
}

/* --------------- Slide 2: 3–6 feature categories grid --------------- */
function CategoriesSlide() {
  // Uses only existing image paths in /public/images
  const categories = [
    { key: "sleuths",      title: "Detectives",    image: "/images/sherlock.jpg" },
    { key: "stargazers",   title: "Astrologers",   image: "/images/ptolemy.jpg" },
    { key: "truthweavers", title: "Truthseekers",  image: "/images/iktomi.jpg" },
    { key: "veilwalkers",  title: "Mystics",       image: "/images/anansi.jpg" },
    { key: "goldhands",    title: "Entrepreneurs", image: "/images/mansa_musa.jpg" },
    { key: "heartstrings", title: "Cupids",        image: "/images/helen.jpg" },
  ];

  return (
    <div className="slide cats">
      <header className="slide-hdr">
        <h2 className="h2">Explore by craft</h2>
        <p className="muted">Pick a path — each category unlocks unique characters and tools.</p>
      </header>

      <div className="grid">
        {categories.slice(0, 6).map((c) => (
          <Link key={c.key} to="/register" className="card av-panel" aria-label={`${c.title} — open register`}>
            <img src={c.image} alt={c.title} loading="lazy" />
            <div className="card-title">{c.title}</div>
          </Link>
        ))}

        {/* Invite Experts special tile */}
        <Link to="/register" className="card av-panel invite" aria-label="Invite experts — open register">
          <div className="spark" aria-hidden="true" />
          <div className="card-title">Invite Experts</div>
          <p className="card-copy">Bring specialist characters into the same chat to co‑solve problems.</p>
        </Link>
      </div>
    </div>
  );
}

/* ---------------- Slide 3: Create‑your‑own character ---------------- */
function CreateYourOwnSlide() {
  return (
    <div className="slide create av-panel">
      <header className="slide-hdr">
        <h2 className="h2">Create your own character</h2>
        <p className="muted">Design persona, goals, style, and boundaries — then talk to it like a teammate.</p>
      </header>
      <ul className="bullets">
        <li>Pick a template (advisor, detective, coder, muse)</li>
        <li>Fill in traits & guardrails</li>
        <li>Chat instantly — iterate as you go</li>
      </ul>
      <div className="cta-row">
        <Link to="/register" className="btn btn-gold">Start building</Link>
        <Link to="/register" className="btn btn-ghost">See examples</Link>
      </div>
    </div>
  );
}

/* -------------------------- Scroll 2 content ------------------------- */
function FeaturePreview() {
  const features = [
    {
      title: "Zero‑jitter scrolling",
      copy: "Native scroll + CSS snap; GPU‑friendly transforms/opacity only.",
    },
    {
      title: "Invite in‑chat experts",
      copy: "Context‑aware suggestions add the right specialists to your current thread.",
    },
    {
      title: "Focused funnel",
      copy: "All CTAs route to /register while we refine the rest of the UI.",
    },
  ];

  return (
    <div className="feature-preview">
      <h2 className="h2">Under the hood</h2>
      <div className="f-grid">
        {features.map((f, i) => (
          <div className="f-card av-panel" key={i}>
            <h3 className="h3">{f.title}</h3>
            <p className="muted">{f.copy}</p>
          </div>
        ))}
      </div>
      <div className="cta-row center">
        <Link to="/register" className="btn btn-gold">Create an account</Link>
      </div>
    </div>
  );
}

/* ----------------------------- Carousel ----------------------------- */
function Carousel({ children }) {
  const scrollerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const slides = useMemo(() => React.Children.toArray(children), [children]);

  const goTo = (i) => {
    const clamped = Math.max(0, Math.min(i, slides.length - 1));
    setIndex(clamped);
    const el = scrollerRef.current?.children?.[clamped];
    el?.scrollIntoView({ behavior: "smooth", inline: "start" });
  };

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const onScroll = () => {
      const { scrollLeft, clientWidth } = node;
      const i = Math.round(scrollLeft / clientWidth);
      if (i !== index) setIndex(i);
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, [index]);

  return (
    <div className="carousel">
      <div className="track" ref={scrollerRef}>
        {slides.map((s, i) => (
          <div className="pane" key={i}>{s}</div>
        ))}
      </div>
      <div className="dots" role="tablist" aria-label="carousel pagination">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            aria-selected={index === i}
            className={"dot" + (index === i ? " active" : "")}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- Styles ----------------------------- */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0B0F22 0%, #0E142B 50%, #0B0F22 100%)",
    color: "#F5F7FA",
  },
};

const css = `
:root {
  /* Midnight blue base + accents */
  --mid-950: #0B0F22;
  --mid-900: #0E142B;
  --mid-800: #111A33;
  --gold: #FFD700;
  --ink:  #F5F7FA;
  --muted:#C8D1E0;
  --rim-blue: rgba(120,155,255,.18);
  --ring: 0 0 0 3px rgba(255, 215, 0, 0.35);
}

main { overflow-y: auto; height: 100vh; scroll-behavior: smooth; scroll-snap-type: y proximity; }
.snap-section { scroll-snap-align: start; min-height: 100vh; display:flex; align-items:center; justify-content:center; padding: clamp(16px, 4vw, 48px); background: transparent; }
.snap-section.alt { background: linear-gradient(180deg, var(--mid-900), var(--mid-950)); }

/* Typography */
.h2 { font-size: clamp(28px, 4vw, 40px); margin: 0 0 8px; letter-spacing: .1px; }
.h3 { font-size: 18px; margin: 0 0 6px; }
.muted { color: var(--muted); }

/* Buttons */
.btn { display:inline-flex; align-items:center; justify-content:center; min-height:44px; padding:10px 18px; border-radius:12px; font-weight:700; text-decoration:none; transition: transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease; }
.btn:focus-visible, .card:focus-visible, .dot:focus-visible { outline:none; box-shadow: var(--ring); }
.btn-gold { color: var(--mid-950); background: linear-gradient(135deg, var(--gold), #FFF3A0); box-shadow: 0 10px 30px rgba(255,215,0,.25); }
.btn-gold:hover { transform: translateY(-1px); box-shadow: 0 16px 40px rgba(255,215,0,.38); }
.btn-ghost { border: 2px solid rgba(255,215,0,.45); color: var(--gold); background: rgba(255,255,255,.06); }
.btn-ghost:hover { border-color: var(--gold); background: rgba(255,215,0,.10); }

/* Carousel */
.carousel { width: min(1200px, 100%); margin: 0 auto; position: relative; }
.track { display: grid; grid-auto-flow: column; grid-auto-columns: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; border-radius: 22px; }
.track::-webkit-scrollbar { height: 8px; }
.track::-webkit-scrollbar-thumb { background: #1b2330; border-radius: 999px; }
.pane { scroll-snap-align: start; min-height: 72vh; display:flex; align-items:center; justify-content:center; background: linear-gradient(180deg, var(--mid-800), var(--mid-950)); border: 1px solid rgba(255,255,255,.06); border-radius: 22px; padding: clamp(16px, 4vw, 48px); }
.dots { display:flex; gap:10px; justify-content:center; margin-top: 14px; }
.dot { width:10px; height:10px; border-radius:50%; background:#2a3442; border:none; cursor:pointer; }
.dot.active { background: var(--gold); box-shadow: var(--ring); }

/* Lightsource panels */
.av-panel { position: relative; background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03)); border-radius: 18px; border: 1px solid rgba(255,215,0,.25); box-shadow: 0 12px 40px rgba(0,0,0,.35), 0 0 0 1px rgba(255,215,0,.10) inset, 0 0 28px rgba(255,215,0,.18); overflow: clip; }
.av-panel::before { content: ""; position: absolute; inset: -1px; pointer-events: none; background: radial-gradient(600px 220px at 20% -10%, rgba(255,215,0,.18), transparent 60%), radial-gradient(500px 240px at 110% 10%, var(--rim-blue), transparent 60%); mix-blend-mode: screen; }
.av-panel::after { content: ""; position: absolute; inset: 8px; border-radius: 14px; border: 1px solid rgba(255,255,255,.08); box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); pointer-events: none; }

/* Slide 1 */
.hero-inner { text-align:center; max-width: 860px; }
.headline { font-size: clamp(40px, 7vw, 72px); letter-spacing: -0.02em; margin: 0 0 10px; text-shadow: 0 0 24px rgba(255,215,0,.18); }
.subcopy { color: var(--muted); font-size: clamp(16px, 2.2vw, 20px); margin: 0 0 26px; }
.cta-row { display:flex; gap:12px; justify-content:center; flex-wrap: wrap; }

/* Slide 2 */
.slide-hdr { text-align:center; margin-bottom: 18px; }
.grid { display:grid; gap: 14px; grid-template-columns: repeat( auto-fit, minmax(220px, 1fr) ); width: 100%; max-width: 1100px; }
.card { position: relative; border-radius: 16px; text-decoration: none; color: var(--ink); min-height: 200px; display:flex; align-items:flex-end; }
.card img { position:absolute; inset:0; width:100%; height:100%; object-fit: cover; filter: saturate(0.9) brightness(0.86); transition: transform .5s ease, filter .4s ease; }
.card:hover img { transform: scale(1.04); filter: saturate(1) brightness(0.95); }
.card-title { position: relative; z-index:1; padding: 12px 14px; font-weight: 800; text-shadow: 0 1px 10px rgba(0,0,0,.35); }
.card.invite { display:block; padding: 18px; min-height: 200px; }
.card.invite .card-title { padding: 0; margin-bottom: 6px; color: var(--gold); }
.card-copy { color: var(--muted); margin: 0; max-width: 32ch; }
.spark { position:absolute; inset: -20%; pointer-events:none; background: radial-gradient(240px 120px at 10% -10%, rgba(255,215,0,.28), transparent 60%), radial-gradient(220px 120px at 120% 10%, rgba(120,155,255,.22), transparent 60%); mix-blend-mode: screen; filter: blur(6px); }

/* Slide 3 */
.create { text-align:center; max-width: 900px; padding: clamp(16px, 3vw, 24px); }
.bullets { list-style: none; padding: 0; margin: 14px auto 22px; display: grid; gap: 8px; color: var(--muted); max-width: 620px; text-align:left; }
.bullets li::marker { content: none; }
.bullets li::before { content: "★ "; color: var(--gold); margin-right: 6px; }

/* Scroll 2 */
.feature-preview { width: min(1100px, 100%); margin: 0 auto; text-align:center; }
.f-grid { display:grid; gap: 14px; grid-template-columns: repeat( auto-fit, minmax(260px, 1fr) ); }
.f-card { padding: 18px; text-align:left; }

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .track { scroll-behavior: auto; }
}
`;
