import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Newlanding.jsx
 * — Localhost test for Scroll 1 (3‑slide carousel) + Scroll 2 (feature preview)
 * — Uses only image paths that already exist in /public/images (no new deps)
 * — Doesn’t touch your existing LandingPage.js/CSS
 *
 * Drop this file at: src/landing/pages/Newlanding.jsx
 * Add a route like: <Route path="/new" element={<Newlanding/>} />
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

      {/* ===== Scroll 2: Feature preview (lightweight) ===== */}
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
        <h1 className="headline">Awakeverse</h1>
        <p className="subcopy">Create, chat, and collaborate with legendary minds—real‑time.</p>
        <div className="cta-row">
          <Link to="/register" className="cta">Get started — it’s free</Link>
          <Link to="/register" className="ghost">Try a live demo →</Link>
        </div>
      </div>
    </div>
  );
}

/* --------------- Slide 2: 3–6 feature categories grid --------------- */
function CategoriesSlide() {
  // Only use existing image paths (no imports from your data files)
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
        <h2>Explore by craft</h2>
        <p>Pick a path—each category unlocks unique characters and tools.</p>
      </header>
      <div className="grid">
        {categories.slice(0, 6).map((c) => (
          <Link key={c.key} to="/register" className="card" aria-label={`${c.title} — open register`}>
            <img src={c.image} alt={c.title} loading="lazy" />
            <div className="card-title">{c.title}</div>
          </Link>
        ))}
        {/* Last summary tile: Invite Experts */}
        <Link to="/register" className="card invite" aria-label="Invite experts — open register">
          <div className="invite-badge">NEW</div>
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
    <div className="slide create">
      <header className="slide-hdr">
        <h2>Create your own character</h2>
        <p>Design persona, goals, style, and boundaries—then talk to it like a teammate.</p>
      </header>
      <ul className="bullets">
        <li>Pick a template (advisor, detective, coder, muse)</li>
        <li>Fill in traits & guardrails</li>
        <li>Chat instantly—iterate as you go</li>
      </ul>
      <Link to="/register" className="cta">Start building</Link>
    </div>
  );
}

/* -------------------------- Scroll 2 content ------------------------- */
function FeaturePreview() {
  const features = [
    {
      title: "Zero‑jitter scrolling",
      copy: "Native CSS scroll‑snap + passive listeners for buttery performance (desktop & mobile).",
    },
    {
      title: "Invite in‑chat experts",
      copy: "Context‑aware suggestions add the right specialists to your current thread.",
    },
    {
      title: "One‑click start",
      copy: "All CTAs route to /register for a focused funnel while we iterate the UI.",
    },
  ];

  return (
    <div className="feature-preview">
      <h2>Under the hood</h2>
      <div className="f-grid">
        {features.map((f, i) => (
          <div className="f-card" key={i}>
            <h3>{f.title}</h3>
            <p>{f.copy}</p>
          </div>
        ))}
      </div>
      <div className="cta-row center">
        <Link to="/register" className="cta">Create an account</Link>
      </div>
    </div>
  );
}

/* ----------------------------- Carousel ----------------------------- */
function Carousel({ children }) {
  const scrollerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const slides = useMemo(() => React.Children.toArray(children), [children]);

  // Snap to selected index
  const goTo = (i) => {
    const clamped = Math.max(0, Math.min(i, slides.length - 1));
    setIndex(clamped);
    const el = scrollerRef.current?.children?.[clamped];
    el?.scrollIntoView({ behavior: "smooth", inline: "start" });
  };

  // Update index on manual swipe/scroll
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
    background: "#0b0f14",
    color: "#eef2f6",
  },
};

const css = `
:root {
  --bg: #0b0f14;
  --bg2: #0e1218;
  --card: #141a22;
  --ink: #eef2f6;
  --muted: #b6c0cc;
  --brand: #64d98a; /* matches your greenlit tone */
  --brand-ink: #0a1a10;
  --ring: 0 0 0 3px rgba(100, 217, 138, 0.35);
}

main { overflow-y: auto; height: 100vh; scroll-behavior: smooth; scroll-snap-type: y mandatory; }
.snap-section { scroll-snap-align: start; min-height: 100vh; display:flex; align-items:center; justify-content:center; padding: clamp(16px, 4vw, 48px); background: var(--bg); }
.snap-section.alt { background: var(--bg2); }

/* Carousel */
.carousel { width: min(1200px, 100%); margin: 0 auto; position: relative; }
.track { display: grid; grid-auto-flow: column; grid-auto-columns: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; border-radius: 20px; }
.track::-webkit-scrollbar { height: 8px; }
.track::-webkit-scrollbar-thumb { background: #1f2732; border-radius: 999px; }
.pane { scroll-snap-align: start; min-height: 72vh; display:flex; align-items:center; justify-content:center; background: linear-gradient(180deg, #0f1620, #0b0f14); border: 1px solid #1a2430; border-radius: 20px; padding: clamp(16px, 4vw, 48px); }
.dots { display:flex; gap:10px; justify-content:center; margin-top: 14px; }
.dot { width:10px; height:10px; border-radius:50%; background:#2a3442; border:none; cursor:pointer; }
.dot.active { background: var(--brand); box-shadow: var(--ring); }

/* Slide 1 */
.hero-inner { text-align:center; max-width: 860px; }
.headline { font-size: clamp(40px, 7vw, 72px); letter-spacing: -0.02em; margin: 0 0 10px; }
.subcopy { color: var(--muted); font-size: clamp(16px, 2.2vw, 20px); margin: 0 0 26px; }
.cta-row { display:flex; gap:12px; justify-content:center; flex-wrap: wrap; }
.cta { background: var(--brand); color: var(--brand-ink); padding: 12px 18px; border-radius: 12px; text-decoration: none; font-weight: 700; }
.ghost { background: transparent; border: 1px solid #2a3442; color: var(--ink); padding: 12px 18px; border-radius: 12px; text-decoration: none; }
.cta:focus-visible, .ghost:focus-visible, .card:focus-visible, .dot:focus-visible { outline: none; box-shadow: var(--ring); }

/* Slide 2 */
.slide-hdr { text-align:center; margin-bottom: 18px; }
.slide-hdr h2 { font-size: clamp(28px, 4vw, 40px); margin: 0 0 6px; }
.slide-hdr p { color: var(--muted); margin: 0; }
.grid { display:grid; gap: 14px; grid-template-columns: repeat( auto-fit, minmax(200px, 1fr) ); width: 100%; max-width: 1100px; }
.card { position: relative; background: var(--card); border: 1px solid #1a2430; border-radius: 16px; overflow: hidden; text-decoration: none; color: var(--ink); min-height: 180px; display:flex; align-items:flex-end; }
.card img { position:absolute; inset:0; width:100%; height:100%; object-fit: cover; filter: saturate(0.9) brightness(0.85); transition: transform .5s ease; }
.card:hover img { transform: scale(1.04); }
.card-title { position: relative; z-index:1; padding: 12px 14px; font-weight: 700; text-shadow: 0 1px 10px rgba(0,0,0,.35); }
.card.invite { display:block; padding: 16px; }
.card.invite .card-title { padding: 0; margin-bottom: 4px; }
.card-copy { color: var(--muted); margin: 0; }
.invite-badge { display:inline-block; font-size: 12px; background: #1f2732; color: var(--ink); padding: 2px 8px; border-radius: 999px; margin-bottom: 8px; border: 1px solid #2a3442; }

/* Slide 3 */
.create { text-align:center; max-width: 900px; }
.bullets { list-style: none; padding: 0; margin: 14px auto 22px; display: grid; gap: 8px; color: var(--muted); max-width: 620px; }
.bullets li::before { content: "• "; color: var(--brand); }

/* Scroll 2 */
.feature-preview { width: min(1100px, 100%); margin: 0 auto; text-align:center; }
.feature-preview h2 { font-size: clamp(28px, 4vw, 40px); margin-bottom: 16px; }
.f-grid { display:grid; gap: 14px; grid-template-columns: repeat( auto-fit, minmax(260px, 1fr) ); }
.f-card { background: var(--card); border: 1px solid #1a2430; border-radius: 16px; padding: 18px; text-align:left; }
.f-card h3 { margin: 0 0 8px; font-size: 18px; }
.f-card p { margin: 0; color: var(--muted); }
.cta-row.center { justify-content: center; margin-top: 16px; }

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .track { scroll-behavior: auto; }
}
`;
