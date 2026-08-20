// src/landing/components/StageHero.jsx
//
// Replaces the old .hero-scene (<img> + .chat-overlay) in HeroSection.jsx.
// A single wide "stage" image whose four sets light in sequence, synced with
// a color-shifting verb pill (Say it -> Speak it -> Make it -> Earn it) and a
// morphing input deck (chat bar -> decibels -> film camera -> finished clip).
// The "Create" button is decorative and routes to /login.
//
// One 12s loop, four 3s beats:
//   Beat 1  Interview set (warm)  · "Say it"   · chat bar
//   Beat 2  Podcast set   (green) · "Speak it" · decibel meter
//   Beat 3  Film set      (gold)  · "Make it"  · cinema camera ("Film your episode")
//   Beat 4  Earn set      (blue)  · "Earn it"  · finished clip ("Ready to publish")
//
// Self-contained: scoped .stage-hero* class names + an internal <style>, so it
// carries no dependency on landing variables and can't collide with anything.
// Respects prefers-reduced-motion (shows beat 1, no animation).

import React from 'react';
import { Link } from 'react-router-dom';

const CHAT_LINE = 'Interview Marcus Aurelius on virtue';

const VERBS = [
  { t: 'Say it',   cls: 'v1' },
  { t: 'Speak it', cls: 'v2' },
  { t: 'Make it',  cls: 'v3' },
  { t: 'Earn it',  cls: 'v4' },
];

const BARS = [0,120,60,200,90,260,150,40,220,100,180,70,240,130,190,50,210,110];

export default function StageHero({
  imageUrl,
  createTo = '/login',
  showLabels = true,
}) {
  return (
    <div className={`stage-hero${showLabels ? '' : ' stage-hero--nolabels'}`}>
      <div className="stage-hero__img" style={{ backgroundImage: `url(${imageUrl})` }} />
      <div className="stage-hero__vign" />

      <div className="stage-hero__beam b1" /><div className="stage-hero__beam b2" />
      <div className="stage-hero__beam b3" /><div className="stage-hero__beam b4" />

      <div className="stage-hero__spot s1" /><div className="stage-hero__spot s2" />
      <div className="stage-hero__spot s3" /><div className="stage-hero__spot s4" />

      <div className="stage-hero__label l1">Interview</div>
      <div className="stage-hero__label l2">Podcast</div>
      <div className="stage-hero__label l3">Film</div>
      <div className="stage-hero__label l4">Earn</div>

      <div className="stage-hero__deck">
        <div className="stage-hero__verbpill">
          {VERBS.map(v => (
            <span key={v.cls} className={`stage-hero__v ${v.cls}`}>{v.t}</span>
          ))}
        </div>

        <div className="stage-hero__bar">
          <div className="stage-hero__canvas">
            <div className="stage-hero__istate i1">
              <span className="stage-hero__ctext">{CHAT_LINE}<span className="stage-hero__cur" /></span>
            </div>
            <div className="stage-hero__istate i2">
              {BARS.map((d, i) => (<i key={i} style={{ animationDelay: `${d}ms` }} />))}
            </div>
            <div className="stage-hero__istate i3">
              <span className="stage-hero__cam">
                <svg width="34" height="30" viewBox="0 0 34 30" fill="none" aria-hidden="true">
                  <circle className="stage-hero__reelspin" cx="11" cy="8" r="5.5" stroke="#fcd9a0" strokeWidth="1.6"/>
                  <circle cx="11" cy="8" r="1.4" fill="#fcd9a0"/>
                  <circle className="stage-hero__reelspin" cx="21" cy="8" r="5.5" stroke="#fcd9a0" strokeWidth="1.6"/>
                  <circle cx="21" cy="8" r="1.4" fill="#fcd9a0"/>
                  <rect x="3" y="15" width="20" height="12" rx="2.5" stroke="#fcd9a0" strokeWidth="1.6"/>
                  <path d="M23 19l7-3v9l-7-3z" stroke="#fcd9a0" strokeWidth="1.6" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="stage-hero__reeltxt">Film your episode</span>
            </div>
            <div className="stage-hero__istate i4">
              <span className="stage-hero__thumb" />
              <span className="stage-hero__done">Ready to publish · earn</span>
            </div>
          </div>

          <Link to={createTo} className="stage-hero__create">Create</Link>
        </div>
      </div>

      <style>{`
        .stage-hero{
          position:relative; width:100%; aspect-ratio:2.36/1; min-height:220px;
          border-radius:20px; overflow:hidden;
          border:1px solid rgba(99,102,241,.22);
          box-shadow:0 0 0 1px rgba(10,15,26,.6),0 0 0 4px rgba(99,102,241,.22),0 24px 60px rgba(0,0,0,.55);
        }
        .stage-hero__img{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(.5) saturate(.95);}
        .stage-hero__vign{position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 90% at 50% 40%,transparent 45%,rgba(5,8,16,.5) 100%);}

        .stage-hero__spot{position:absolute;inset:0;opacity:0;pointer-events:none;mix-blend-mode:screen;animation:shBeat 12s ease-in-out infinite}
        .stage-hero__spot.s1{background:radial-gradient(38% 62% at 15% 60%,rgba(255,236,200,.55),rgba(255,220,160,.16) 45%,transparent 70%);animation-delay:0s}
        .stage-hero__spot.s2{background:radial-gradient(28% 66% at 43% 55%,rgba(190,255,220,.5),rgba(120,230,170,.15) 45%,transparent 70%);animation-delay:3s}
        .stage-hero__spot.s3{background:radial-gradient(32% 66% at 62% 55%,rgba(255,214,150,.6),rgba(255,180,100,.17) 45%,transparent 70%);animation-delay:6s}
        .stage-hero__spot.s4{background:radial-gradient(34% 70% at 87% 55%,rgba(185,200,255,.55),rgba(150,170,255,.18) 45%,transparent 72%);animation-delay:9s}

        .stage-hero__beam{position:absolute;top:-4%;width:11%;height:66%;opacity:0;mix-blend-mode:screen;pointer-events:none;animation:shBeat 12s ease-in-out infinite}
        .stage-hero__beam.b1{left:9.5%;background:linear-gradient(180deg,rgba(255,236,200,.2),transparent 80%);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);animation-delay:0s}
        .stage-hero__beam.b2{left:37.5%;background:linear-gradient(180deg,rgba(190,255,220,.18),transparent 80%);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);animation-delay:3s}
        .stage-hero__beam.b3{left:56.5%;background:linear-gradient(180deg,rgba(255,214,150,.2),transparent 80%);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);animation-delay:6s}
        .stage-hero__beam.b4{left:81.5%;background:linear-gradient(180deg,rgba(185,200,255,.2),transparent 80%);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);animation-delay:9s}

        .stage-hero__label{position:absolute;top:9%;transform:translateX(-50%);z-index:2;font-family:'Space Grotesk',sans-serif;font-weight:700;
          font-size:clamp(.6rem,1.2vw,.8rem);letter-spacing:.4px;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.95);opacity:0;white-space:nowrap;animation:shBeat 12s ease-in-out infinite}
        .stage-hero__label.l1{left:15%;animation-delay:0s}
        .stage-hero__label.l2{left:43%;color:#6ee7b7;animation-delay:3s}
        .stage-hero__label.l3{left:62%;color:#fcd9a0;animation-delay:6s}
        .stage-hero__label.l4{left:87%;color:#c7d2fe;animation-delay:9s}
        .stage-hero--nolabels .stage-hero__label{display:none}

        .stage-hero__deck{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);z-index:3;width:min(74%,560px);display:flex;flex-direction:column;align-items:center}

        .stage-hero__verbpill{position:relative;margin-bottom:.7rem;display:inline-grid;place-items:center;
          padding:.4rem 1.4rem;border-radius:999px;background:rgba(10,15,26,.78);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
          border:1px solid rgba(99,102,241,.22);box-shadow:0 0 0 1px rgba(10,15,26,.7),0 0 0 4px rgba(99,102,241,.4);
          animation:shPillRing 12s ease-in-out infinite}
        .stage-hero__v{grid-area:1/1;white-space:nowrap;font-family:'Space Grotesk',sans-serif;font-weight:600;
          font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;opacity:0;animation:shBeat 12s ease-in-out infinite}
        .stage-hero__v.v1{color:#ffe4b8;animation-delay:0s}
        .stage-hero__v.v2{color:#6ee7b7;animation-delay:3s}
        .stage-hero__v.v3{color:#fcd9a0;animation-delay:6s}
        .stage-hero__v.v4{color:#c7d2fe;animation-delay:9s}
        @keyframes shPillRing{
          0%,22%   {box-shadow:0 0 0 1px rgba(10,15,26,.7),0 0 0 4px rgba(255,214,160,.5); border-color:rgba(255,214,160,.4)}
          25%,47%  {box-shadow:0 0 0 1px rgba(10,15,26,.7),0 0 0 4px rgba(16,185,129,.5);  border-color:rgba(16,185,129,.4)}
          50%,72%  {box-shadow:0 0 0 1px rgba(10,15,26,.7),0 0 0 4px rgba(255,190,110,.5); border-color:rgba(255,190,110,.4)}
          75%,97%  {box-shadow:0 0 0 1px rgba(10,15,26,.7),0 0 0 4px rgba(150,170,255,.5); border-color:rgba(150,170,255,.4)}
          100%     {box-shadow:0 0 0 1px rgba(10,15,26,.7),0 0 0 4px rgba(255,214,160,.5); border-color:rgba(255,214,160,.4)}
        }

        .stage-hero__bar{display:flex;align-items:center;gap:.7rem;width:100%;background:rgba(10,15,26,.85);
          border:1px solid rgba(99,102,241,.4);border-radius:16px;padding:.7rem .7rem .7rem 1rem;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
        .stage-hero__canvas{position:relative;flex:1;height:34px;overflow:hidden}
        .stage-hero__istate{position:absolute;inset:0;display:flex;align-items:center;opacity:0;animation:shBeat 12s ease-in-out infinite}
        .stage-hero__istate.i1{animation-delay:0s}.stage-hero__istate.i2{animation-delay:3s}
        .stage-hero__istate.i3{animation-delay:6s}.stage-hero__istate.i4{animation-delay:9s}

        .stage-hero__ctext{font-size:.9rem;color:#e2e8f0;white-space:nowrap}
        .stage-hero__cur{display:inline-block;width:2px;height:1em;background:#818CF8;margin-left:2px;vertical-align:-2px;animation:shBlink 1s steps(1) infinite}
        @keyframes shBlink{50%{opacity:0}}

        .stage-hero__istate.i2{gap:3px}
        .stage-hero__istate.i2 i{width:4px;border-radius:3px;background:linear-gradient(180deg,#6ee7b7,#10B981);align-self:center;animation:shEq 900ms ease-in-out infinite}
        .stage-hero__istate.i2 i:nth-child(odd){animation-duration:700ms}
        .stage-hero__istate.i2 i:nth-child(3n){animation-duration:1100ms}
        @keyframes shEq{0%,100%{height:20%}50%{height:95%}}

        .stage-hero__istate.i3{gap:.55rem;color:#fcd9a0}
        .stage-hero__cam svg{display:block}
        .stage-hero__reelspin{transform-origin:center;animation:shSpin 3s linear infinite}
        @keyframes shSpin{to{transform:rotate(360deg)}}
        .stage-hero__reeltxt{font-family:'Space Grotesk',sans-serif;font-size:.82rem;font-weight:600}

        .stage-hero__istate.i4{gap:.5rem}
        .stage-hero__thumb{width:44px;height:26px;border-radius:5px;background:linear-gradient(135deg,#1b2a52,#0d1530);
          border:1px solid rgba(99,102,241,.4);display:flex;align-items:center;justify-content:center;position:relative}
        .stage-hero__thumb::after{content:'';position:absolute;margin-left:2px;border-left:8px solid #c7d2fe;border-top:5px solid transparent;border-bottom:5px solid transparent}
        .stage-hero__done{font-family:'Space Grotesk',sans-serif;font-size:.78rem;font-weight:600;color:#c7d2fe}

        .stage-hero__create{flex-shrink:0;font-family:'Space Grotesk',sans-serif;font-size:.85rem;font-weight:600;color:#fff;
          padding:.6rem 1.3rem;border-radius:11px;border:none;cursor:pointer;text-decoration:none;
          background:linear-gradient(135deg,#6366F1,#818CF8);box-shadow:0 2px 14px rgba(99,102,241,.4);transition:transform .18s,box-shadow .18s}
        .stage-hero__create:hover{transform:translateY(-1px);box-shadow:0 4px 22px rgba(99,102,241,.55);color:#fff}

        @keyframes shBeat{0%{opacity:0}3%{opacity:1}23%{opacity:1}27%{opacity:0}100%{opacity:0}}

        @media (max-width:768px){
          .stage-hero__deck{width:min(88%,560px);bottom:16px}
          .stage-hero__reeltxt,.stage-hero__done{font-size:.72rem}
          .stage-hero__ctext{font-size:.8rem}
        }
        @media (prefers-reduced-motion:reduce){
          .stage-hero__spot,.stage-hero__beam,.stage-hero__label,.stage-hero__v,.stage-hero__istate,
          .stage-hero__verbpill,.stage-hero__cur,.stage-hero__reelspin,.stage-hero__istate.i2 i{animation:none}
          .stage-hero__spot.s1,.stage-hero__label.l1,.stage-hero__v.v1,.stage-hero__istate.i1{opacity:1}
        }
      `}</style>
    </div>
  );
}