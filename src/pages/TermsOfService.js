// src/pages/TermsOfService.js
import React from 'react';

export default function TermsOfService() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="legal-document">
      {/* Custom styles for legal document */}
      <style jsx>{`
        .legal-document {
          --ink: #0c1222;
          --muted: #4b587c;
          --link: #1b73e8;
          --bg: #ffffff;
          --card: #f6f8fc;
          background: var(--bg);
          color: var(--ink);
          font: 16px/1.6 system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial;
          margin: 0;
          padding: 0;
        }

        .document-header,
        .document-main {
          max-width: 900px;
          margin: auto;
          padding: 24px;
        }

        .document-header h1 {
          margin: 0 0 4px 0;
          font-size: 2rem;
          font-weight: bold;
        }

        .document-header .meta {
          color: var(--muted);
          font-size: 0.95rem;
        }

        .site-nav {
          margin-bottom: 20px;
        }

        .site-nav a {
          color: var(--link);
          text-decoration: none;
          margin-right: 14px;
        }

        .site-nav a:hover {
          text-decoration: underline;
        }

        .intro-card {
          background: var(--card);
          padding: 16px;
          border-radius: 10px;
          margin-top: 16px;
        }

        .document-main h2 {
          margin-top: 32px;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .document-main ul {
          padding-left: 20px;
        }

        .document-main a {
          color: var(--link);
        }

        .document-main a:hover {
          text-decoration: underline;
        }

        .callout {
          background: #fff8e6;
          border: 1px solid #f2d9a0;
          border-left: 4px solid #e0a020;
          padding: 14px 16px;
          border-radius: 10px;
          margin: 16px 0;
        }

        .callout strong {
          color: var(--ink);
        }

        .document-footer {
          max-width: 900px;
          margin: auto;
          padding: 24px;
          color: var(--muted);
          font-size: 0.9rem;
          border-top: 1px solid #e8ecf5;
          margin-top: 40px;
        }

        strong {
          font-weight: 600;
        }
      `}</style>

      <header className="document-header" aria-labelledby="tos-title">
        <nav className="site-nav" aria-label="Site">
          <a href="/">Home</a>
          <a href="/privacy">Privacy</a>
          <a href="/sources">Sources &amp; Licences</a>
        </nav>
        <h1 id="tos-title">AwakeVerse — Terms of Service</h1>
        <p className="meta">Effective: 19 August 2025 &nbsp;•&nbsp; Last updated: 30 September 2026</p>
        <div className="intro-card">
          Welcome to AwakeVerse, an AI platform for conversations with historical, cultural, and fictional personas.
          By accessing or using our services — including any paid subscription, credits, or purchases — you agree to these Terms.
        </div>
      </header>

      <main className="document-main">
        <h2 id="overview">1) Overview</h2>
        <p>AwakeVerse is provided by <strong>AwakeVerse Ltd</strong> ("AwakeVerse," "we," "us"). Our services include web and mobile experiences that generate AI content for education and entertainment.</p>

        <h2 id="eligibility">2) Eligibility</h2>
        <ul>
          <li>You must be at least <strong>17</strong> years old to use AwakeVerse.</li>
          <li>You represent that all registration information you submit is accurate and you will keep it up to date.</li>
        </ul>

        <h2 id="accounts">3) Accounts &amp; Security</h2>
        <ul>
          <li>You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.</li>
          <li>We may suspend or terminate accounts that violate these Terms or applicable law.</li>
        </ul>

        <h2 id="content-ownership">4) Content &amp; Ownership</h2>
        <ul>
          <li><strong>Your Inputs:</strong> You retain ownership of prompts, text, and other content you submit ("User Content"). You grant AwakeVerse a worldwide, royalty‑free, sublicensable licence to host, process, display, and use your User Content to operate, maintain, and improve the services (including safety and moderation).</li>
          <li><strong>Generated Outputs &amp; Platform IP:</strong> All AI outputs, system prompts, character definitions, avatars, animations, UI/UX, designs, and software are the exclusive intellectual property of AwakeVerse. You receive a revocable licence to use outputs within the service and to share them non‑commercially, provided you do not misrepresent them as factual advice.</li>
          <li><strong>Feedback:</strong> Ideas or suggestions you provide may be used without obligation to you.</li>
        </ul>

        <h2 id="acceptable-use">5) Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Harass, threaten, or defame others; generate hateful, extremist, or illegal content.</li>
          <li>Seek or disseminate personal data of others without consent.</li>
          <li>Use the service for political persuasion/manipulation or coordinated inauthentic behaviour.</li>
          <li>Upload or share content that infringes third‑party rights.</li>
          <li>Probe, scan, or test the vulnerability of any system or attempt to circumvent security.</li>
          <li>Scrape, index, or reverse engineer the services.</li>
        </ul>

        <h2 id="subscriptions">6) Subscriptions &amp; Billing</h2>
        <ul>
          <li><strong>Plans:</strong> AwakeVerse offers a free tier and optional paid subscription plans (currently Explorer, Professional, and Creator). Current plan features and prices are shown on our <a href="/pricing">Pricing</a> page and, in the mobile app, on the plan screen at the point of purchase.</li>
          <li><strong>Auto‑renewal:</strong> Paid subscriptions are billed in advance on a recurring monthly cycle and <strong>renew automatically</strong> at the then‑current price until cancelled. By subscribing you authorise us, or the app store handling your purchase, to charge your payment method for each renewal.</li>
          <li><strong>Where you are billed:</strong> Subscriptions purchased on our website are processed by our payment processor (Stripe). Subscriptions purchased in the mobile app are processed and billed by the app store — Google Play, and in future the Apple App Store — under that store's terms. Prices in the mobile app may be <strong>higher</strong> than on the web to account for app‑store fees; the price you are charged is always shown before you confirm.</li>
          <li><strong>One billing channel per account:</strong> Your account can hold only one active subscription at a time. To prevent double‑charging, we do not let you start a second subscription through another channel while one is active — manage or change your plan in the channel where you bought it.</li>
          <li><strong>Managing and cancelling:</strong> Web subscriptions are managed on your account billing page. App‑store subscriptions are managed in that store's subscription settings — we cannot cancel or refund a store subscription on your behalf. Cancelling stops the next renewal; you keep access until the end of the current paid period.</li>
          <li><strong>Price changes:</strong> We may change plan prices. Changes apply to future billing cycles, with notice as required by law; for store‑billed subscriptions the store will notify you and, where required, obtain your consent before renewing at a higher price.</li>
          <li><strong>Taxes:</strong> Prices are shown inclusive or exclusive of tax as indicated at checkout. Where a price is tax‑inclusive, applicable VAT or sales tax is included in the amount shown.</li>
          <li><strong>Making a purchase:</strong> To buy a subscription or credits you must be old enough to enter a binding contract where you live (18 in the United Kingdom), or have the permission of the person who owns the payment method or store account. That person is responsible for the charges.</li>
        </ul>

        <h2 id="credits">7) Credits</h2>
        <p>Credits are the in‑service unit used to generate content — films, podcasts, dialogue, images, and similar features. Each generation spends credits at the rate shown before you confirm it. Credits are committed when a generation starts and are consumed once it completes; a <strong>successful generation is final and non‑refundable</strong> (see <a href="#refunds">Refunds &amp; Cancellation</a> below).</p>
        <ul>
          <li><strong>Monthly plan credits:</strong> Each paid cycle grants a monthly allowance (for example, 2,000 credits on Explorer). Monthly credits <strong>do not roll over</strong> — your allowance resets at the start of each cycle, and unused monthly credits are not carried forward.</li>
          <li><strong>Purchased credit packs:</strong> You may buy additional one‑time credit packs, separately from a subscription.</li>
          <li><strong>Spend order:</strong> Where your balance holds more than one kind of credit, we spend the soonest‑to‑expire credits first.</li>
        </ul>

        <div className="callout">
          <strong>Please note — credit expiry and value.</strong> Purchased credits <strong>expire 90 days after the date of purchase</strong>. Monthly plan credits reset at the end of each billing cycle and do not carry over. Credits have <strong>no cash value</strong>, are not money or a stored‑value instrument, cannot be exchanged for cash, and are non‑transferable, except where the law requires otherwise.
        </div>

        <ul>
          <li><strong>Changes:</strong> We may change credit prices, generation costs, and monthly allowances on a forward‑looking basis. Such changes do not affect credits already granted or purchased before the change.</li>
        </ul>

        <h2 id="refunds">8) Refunds &amp; Cancellation</h2>
        <ul>
          <li><strong>Generated content is final:</strong> Credits are spent to produce your output, and a <strong>successful generation</strong> — a rendered video, podcast, image, or similar result — is <strong>not refundable</strong> once produced, whether in credits or cash. This mirrors how the underlying AI model providers we rely on (for example, Google's Veo and ByteDance's Seedance video models) charge us: the computing resources used to create your output are consumed at the moment of generation and cannot be reversed or recovered. If a generation <strong>fails</strong>, the credits held for it are released and you are not charged. Dissatisfaction with the creative result of a working generation — its style, likeness, wording, pacing, or subjective quality — is a normal feature of AI generation, is not a defect, and is not grounds for a refund; you may spend further credits to regenerate. This does not affect your statutory rights where a purchase is faulty or not as described.</li>
          <li><strong>Store purchases:</strong> Subscriptions and credit packs bought through Google Play or the Apple App Store are subject to that store's refund policy and process; refund requests for those purchases are handled by the store.</li>
          <li><strong>Web purchases:</strong> For purchases made on our website, contact <a href="mailto:support@awakeverse.com">support@awakeverse.com</a> and we will handle your request in line with these Terms and your statutory rights.</li>
          <li><strong>Your statutory rights:</strong> Nothing in these Terms removes or limits any non‑waivable consumer rights you have. For digital content and services, when you ask us to begin immediately and acknowledge this at purchase, your statutory right to cancel may end once we have started providing them — you consent to immediate provision when you make a purchase.</li>
          <li><strong>Effect of a refund or reversal:</strong> If a purchase is refunded, reversed, charged back, or otherwise cancelled, we may remove any <strong>unspent</strong> credits granted by that purchase (down to a zero balance — we never reclaim credits you have already used), and access tied to a refunded subscription may end.</li>
        </ul>

        <h2 id="earnings">9) Creator Earnings &amp; Payouts</h2>
        <ul>
          <li>On eligible plans you can publish characters to Market Hub and earn a share of the revenue they generate (currently 60/40 in your favour on Professional and 80/20 on Creator, as shown on the <a href="/pricing">Pricing</a> page).</li>
          <li>Earnings accrue to your account as described in your Creator dashboard and are paid out subject to any minimum threshold, identity or tax verification, and payment‑provider requirements set out there.</li>
          <li>You are responsible for any taxes due on amounts you earn.</li>
          <li>We may withhold, adjust, or reverse earnings we reasonably believe arise from fraud, abuse, infringing content, or a breach of these Terms.</li>
          <li>We may change revenue‑share rates and payout terms on a forward‑looking basis, with notice as required.</li>
        </ul>

        <h2 id="ai-disclaimer">10) AI Disclaimers</h2>
        <ul>
          <li>Responses are AI‑generated and may be fictional, inaccurate, or outdated.</li>
          <li>Content is for <strong>education and entertainment</strong> only; not legal, medical, financial, or professional advice.</li>
          <li>Characters are inspired by historical/cultural figures; they are not endorsed by estates or rights holders.</li>
        </ul>

        <h2 id="datasets">11) Datasets &amp; Attributions</h2>
        <p>We use public‑domain sources (e.g., Project Gutenberg) and Creative Commons materials (e.g., Wikipedia under CC BY‑SA). See our <a href="/sources">Sources &amp; Licences</a> page for attributions and links.</p>

        <h2 id="ip">12) Intellectual Property</h2>
        <ul>
          <li><strong>Trademarks:</strong> AwakeVerse™ name, logos, and taglines are protected. You may not use them without permission.</li>
          <li><strong>Copyright:</strong> All code, designs, assets, and content (other than User Content) are owned by AwakeVerse and protected by law.</li>
        </ul>

        <h2 id="third-parties">13) Third‑Party Services</h2>
        <p>We may integrate third‑party services (e.g., cloud hosting, email, AI inference, payment processing, and app‑store billing). Their terms and privacy policies apply to their components.</p>

        <h2 id="termination">14) Suspension &amp; Termination</h2>
        <p>We may suspend or terminate your access if you breach these Terms or create risk of harm. You may stop using the services at any time. If we terminate your account without cause, any unexpired paid time or unspent purchased credits will be handled in line with your statutory rights; we do not refund amounts where we terminate for your breach.</p>

        <h2 id="disclaimers">15) Disclaimers &amp; Liability Limits</h2>
        <ul>
          <li>Services are provided "as is" and "as available." We disclaim all warranties to the fullest extent permitted by law.</li>
          <li>We are not liable for indirect, incidental, special, or consequential damages. Our aggregate liability for all claims shall not exceed the greater of £50 or the amount you paid to use the services in the 12 months preceding the claim.</li>
          <li>Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law, including liability for death or personal injury caused by negligence or for fraud.</li>
        </ul>

        <h2 id="infringement">16) Notices of Infringement</h2>
        <p>If you believe content on AwakeVerse infringes your rights, email <a href="mailto:legal@awakeverse.com">legal@awakeverse.com</a> with: (a) your contact details, (b) a description of the work, (c) the URL of the allegedly infringing material, and (d) a statement you have a good‑faith belief the use is not authorised.</p>

        <h2 id="governing-law">17) Governing Law &amp; Venue</h2>
        <p>These Terms are governed by the laws of England and Wales. Courts of England and Wales have exclusive jurisdiction. If you are a consumer resident elsewhere, you keep the benefit of any mandatory protections of the law of your country of residence.</p>

        <h2 id="changes">18) Changes to Terms</h2>
        <p>We may update these Terms. Material changes will be notified in‑app or by email. Continued use after changes means you accept the revised Terms.</p>

        <h2 id="contact">19) Contact</h2>
        <p>AwakeVerse Ltd • Support: <a href="mailto:support@awakeverse.com">support@awakeverse.com</a> • Legal: <a href="mailto:legal@awakeverse.com">legal@awakeverse.com</a></p>
      </main>

      <footer className="document-footer">
        <p>© {currentYear} AwakeVerse Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}