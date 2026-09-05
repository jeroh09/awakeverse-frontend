// CreditsUI.jsx — the user-facing credits surface.
//   CreditsChip     — always-visible balance, with a soon-expiring nudge.
//   CostConfirm     — pre-render "this costs X, you have Y" confirmation.
//   InsufficientCard — the graceful 402 state (top up / upgrade).
// Styling matches the film design tokens (--film-*). See CreditsUI.css.
import React from 'react';

const fmt = (n) => (n == null ? '—' : n.toLocaleString());

// ── Balance chip (header) ────────────────────────────────────────────────────
export function CreditsChip({ balance, expiringSoon, onClick }) {
  const nudge = expiringSoon && expiringSoon.expires_in_days <= 7
    ? `${fmt(expiringSoon.points)} expire in ${expiringSoon.expires_in_days}d`
    : null;
  return (
    <button className="film-credits-chip" onClick={onClick} title="Your credits">
      <span className="film-credits-dot" />
      <span className="film-credits-bal">{fmt(balance)}</span>
      <span className="film-credits-unit">credits</span>
      {nudge && <span className="film-credits-nudge">{nudge}</span>}
    </button>
  );
}

// ── Pre-render cost confirm ──────────────────────────────────────────────────
// Shows the price, the balance, and either a Confirm or (if short) a top-up state.
export function CostConfirm({ price, balance, label = 'Make the film',
                             onConfirm, onCancel, busy }) {
  if (price == null) return null;
  const affordable = balance != null && balance >= price;
  const shortBy = affordable ? 0 : (price - (balance || 0));
  return (
    <div className="film-cost-confirm">
      <div className="film-cost-row">
        <span className="film-cost-k">This will use</span>
        <span className="film-cost-v">{fmt(price)} credits</span>
      </div>
      <div className="film-cost-row film-cost-row--sub">
        <span className="film-cost-k">You have</span>
        <span className={`film-cost-v ${affordable ? '' : 'is-short'}`}>{fmt(balance)}</span>
      </div>

      {affordable ? (
        <div className="film-cost-actions">
          <button className="film-btn film-btn--primary" disabled={busy} onClick={onConfirm}>
            {busy ? <span className="film-ctrl-spin" /> : null}
            {busy ? 'Starting…' : label}
          </button>
          <button className="film-btn film-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        </div>
      ) : (
        <InsufficientCard needed={price} available={balance} shortBy={shortBy} onCancel={onCancel} />
      )}
    </div>
  );
}

// ── Insufficient / 402 state ─────────────────────────────────────────────────
export function InsufficientCard({ needed, available, shortBy, title, message,
                                  onTopUp, onUpgrade, onCancel }) {
  return (
    <div className="film-insufficient">
      <div className="film-insufficient-head">{title || 'Not enough credits'}</div>
      <p className="film-insufficient-msg">
        {message || (
          <>This needs <b>{fmt(needed)}</b> credits and you have <b>{fmt(available)}</b>.
          You’re <b>{fmt(shortBy)}</b> short.</>
        )}
      </p>
      <div className="film-insufficient-actions">
        <button className="film-btn film-btn--primary" onClick={onTopUp || (() => {})}>
          Top up credits
        </button>
        <button className="film-btn film-btn--soft" onClick={onUpgrade || (() => {})}>
          Upgrade plan
        </button>
        {onCancel && (
          <button className="film-btn film-btn--ghost" onClick={onCancel}>Maybe later</button>
        )}
      </div>
    </div>
  );
}