// src/components/PodcastStudio/SettingRow.jsx
//
// One compact row for the right-hand panel (2026-10-18) — Voice, Outfit, Sound,
// Captions, Comparison, Opening hook. A fixed-height row that NEVER stretches,
// whatever it holds: icon well · title + one-line summary · status · chevron.
//
//   <SettingGroup>                      — the rounded box the rows sit in
//     <SettingRow
//       icon={<IconHook size={19} />}
//       title="Opening hook"
//       sub="“5,000 users now with us” · first 4s"
//       status="on" | "off" | "warn" | null      (pill on the right)
//       statusLabel="On"                          (defaults from status)
//       action="Set up"                           (text instead of a status pill)
//       on                                         (tints the icon + summary)
//       onClick={open the pop-out}
//       trailing={<button …/>}                    (optional sibling control, e.g. ▶ preview;
//                                                  never nested inside the row button)
//     />
//
// The row is a <div>; the main area is a real <button>, and `trailing` sits beside
// it — so there is never a button inside a button.

import React from 'react';
import styles from './SettingRow.module.css';
import { IconChevronRight } from './StudioIcons';

export function SettingGroup({ children, className = '' }) {
  return <div className={`${styles.group} ${className}`}>{children}</div>;
}

const STATUS_LABEL = { on: 'On', off: 'Off', warn: 'Needed' };

export default function SettingRow({
  icon,
  title,
  badge = null,
  sub,
  status = null,
  statusLabel,
  action = null,
  on = false,
  warn = false,
  onClick,
  tip,
  trailing = null,
  chevron = true,
}) {
  const pill = status ? (
    <span className={`${styles.pill} ${styles['pill_' + status] || ''}`}>
      {statusLabel || STATUS_LABEL[status] || status}
    </span>
  ) : null;

  return (
    <div className={`${styles.row} ${on ? styles.on : ''} ${warn ? styles.warn : ''}`}>
      <button type="button" className={styles.main} onClick={onClick} title={tip}>
        <span className={styles.well}>{icon}</span>
        <span className={styles.txt}>
          <b>{title}{badge}</b>
          {sub ? <small>{sub}</small> : null}
        </span>
        {pill}
        {action ? <span className={styles.action}>{action}</span> : null}
        {chevron && !trailing ? <span className={styles.chev}><IconChevronRight size={14} /></span> : null}
      </button>
      {trailing}
    </div>
  );
}
