// src/components/Film/SeasonBoard.jsx
// THE SEASON BOARD (2026-10-12, SEASON_PLAN=1) — the editable outline of a series'
// season, shown as the first tab of My Series. One card per episode: its role in the
// arc, relation to the episode before, threads it opens/closes, the pull into the next
// one, and its status. A card with an episode wears that episode's own thumbnail with
// the title stamped on it (the same look as EpisodeTile); a planned card is a coloured
// poster waiting to be made. Writing is free — nothing here spends credits.
//
// Server: GET/POST/PUT /film/series/:id/plan (filmApi). Every route 404s while the
// switch is off; the board then reports onAvailability(false) and the tab disappears.
// The server cleans every save (sanitize_plan), so the board sends the plan as edited
// and adopts what comes back.

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { filmGetPlan, filmMakePlan, filmSavePlan, friendlyError } from './filmApi';
import { posterOf } from './filmPoster';
import { IconLock, IconPlus, IconChevron, IconPlay } from './filmIcons';

const REL = {
  pilot:       { l: 'Pilot',       tip: 'The first episode — meets the lead and sets up the season' },
  continues:   { l: 'Continues',   tip: 'Picks up straight after the episode before — same moment, same place' },
  later:       { l: 'Later',       tip: 'Same world, time has passed since the episode before' },
  new_setting: { l: 'New setting', tip: 'A different place or period from the episode before' },
};
const ST = {
  planned:  { l: 'Planned',  tip: 'Not started yet' },
  written:  { l: 'Written',  tip: 'Being written in the writers’ room' },
  preview:  { l: 'Preview',  tip: 'A preview is made — open it to finish the full episode' },
  finished: { l: 'Finished', tip: 'Finished — open to watch or edit' },
};
const THREAD_HUES = [239, 160, 38, 330, 195, 275, 12, 95];
const hueOf = (s = '') => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) % 360; };

function CardEditor({ card, onChange }) {
  const set = (k) => (e) => onChange({ ...card, [k]: e.target.value });
  return (
    <div className="fs-sb-edit">
      <label className="fs-sb-lbl" htmlFor={`t-${card.n}`}>Title</label>
      <input id={`t-${card.n}`} className="fs-inp" value={card.title || ''} onChange={set('title')} maxLength={120} />
      <label className="fs-sb-lbl" htmlFor={`l-${card.n}`}>What happens</label>
      <textarea id={`l-${card.n}`} className="fs-inp" rows={3} value={card.logline || ''} onChange={set('logline')} maxLength={600} />
      <label className="fs-sb-lbl" htmlFor={`p-${card.n}`}>The pull into the next episode</label>
      <input id={`p-${card.n}`} className="fs-inp" value={card.pull || ''} onChange={set('pull')} maxLength={300} />
      <label className="fs-sb-lbl" htmlFor={`r-${card.n}`}>Starts</label>
      <select id={`r-${card.n}`} className="fs-inp" value={card.relation || 'later'} onChange={set('relation')}
              title="How this episode starts relative to the one before">
        {(card.n === 1 ? ['pilot'] : ['continues', 'later', 'new_setting']).map((r) => (
          <option key={r} value={r}>{REL[r].l}</option>
        ))}
      </select>
    </div>
  );
}

function SeasonCard({ card, status, episode, threads, editing, busy, isNext, canLeft, canRight,
                      onEdit, onDraft, onSave, onCancel, onLock, onMove, onRemove,
                      onStart, onOpen, onWatch }) {
  const st = status || 'planned';
  const art = episode ? posterOf(episode) : null;
  const hue = hueOf(card.title || card.act || String(card.n));
  const linked = !!(episode || card.project_id);
  const tname = (id) => (threads.find((t) => t.id === id) || {}).name || id;
  const thue = (id) => THREAD_HUES[Math.max(0, threads.findIndex((t) => t.id === id)) % THREAD_HUES.length];
  const skeleton = !(card.logline || '').trim();
  const action =
      st === 'finished' ? { l: 'Open', tip: 'Open this episode in the storyboard', fn: () => onOpen(episode) }
    : st === 'preview'  ? { l: 'Finish', tip: 'Open the preview — finish the full episode from there', fn: () => onOpen(episode), cta: true }
    : st === 'written'  ? { l: 'Continue', tip: 'Carry on writing this episode', fn: () => onOpen(episode) }
    : { l: 'Start', tip: 'Open the writers’ room for this episode with this card as its guide — writing is free', fn: () => onStart(card), cta: isNext };

  return (
    <article className={`fs-sb-card is-${st}${art ? ' has-art' : ''}${isNext ? ' is-next' : ''}${editing ? ' is-editing' : ''}`}
             style={{ '--h': hue, ...(art ? { '--art': `url(${art})` } : {}) }}>
      <div className="fs-sb-top">
        <span className="fs-sb-ep">EP {card.n}</span>
        <span className={`fs-sb-rel is-${card.relation || 'later'}`} title={(REL[card.relation] || REL.later).tip}>
          {(REL[card.relation] || REL.later).l}
        </span>
        <button type="button" className="fs-sb-lock" aria-pressed={!!card.locked} disabled={busy}
                onClick={() => onLock(card)}
                title={card.locked ? 'Locked — Re-plan keeps this card as it is. Click to unlock.'
                                   : 'Lock this card so Re-plan never changes it'}>
          <IconLock s={13} />
        </button>
      </div>

      {editing ? (
        <>
          <CardEditor card={editing} onChange={onDraft} />
          <div className="fs-sb-edrow">
            <button type="button" className="fs-sb-mini" disabled={!canLeft || busy} onClick={() => onMove(card, -1)}
                    title="Move this card one place earlier"><IconChevron s={13} dir="left" /></button>
            <button type="button" className="fs-sb-mini" disabled={!canRight || busy} onClick={() => onMove(card, 1)}
                    title="Move this card one place later"><IconChevron s={13} dir="right" /></button>
            {!linked && (
              <button type="button" className="fs-sb-mini danger" disabled={busy} onClick={() => onRemove(card)}
                      title="Remove this card from the plan">Remove</button>
            )}
            <span className="fs-sb-grow" />
            <button type="button" className="fs-sb-btn ghost" onClick={onCancel} disabled={busy} title="Discard these changes">Cancel</button>
            <button type="button" className="fs-sb-btn cta" onClick={onSave} disabled={busy} title="Save this card">Save</button>
          </div>
        </>
      ) : (
        <>
          {card.act && <span className="fs-sb-act">{card.act}</span>}
          <h4 className="fs-sb-title">{card.title || (skeleton ? `Episode ${card.n}` : 'Untitled')}</h4>
          {skeleton
            ? <p className="fs-sb-log is-hint">{card.hint || 'Your story goes here.'}</p>
            : <p className="fs-sb-log">{card.logline}</p>}
          {card.setting && <span className="fs-sb-where">{card.setting}</span>}
          {((card.opens || []).length > 0 || (card.closes || []).length > 0) && (
            <div className="fs-sb-threads">
              {(card.opens || []).map((id) => (
                <span key={`o${id}`} className="fs-sb-th" style={{ '--th': thue(id) }} title={`Opens: ${tname(id)}`}>
                  <i />opens</span>
              ))}
              {(card.closes || []).map((id) => (
                <span key={`c${id}`} className="fs-sb-th is-close" style={{ '--th': thue(id) }} title={`Resolves: ${tname(id)}`}>
                  <i />resolves</span>
              ))}
            </div>
          )}
          {(card.pull || card.pull_hint) && (
            <p className="fs-sb-pull" title="What should make viewers want the next episode">{card.pull || card.pull_hint}</p>
          )}
          <div className="fs-sb-foot">
            <span className={`fs-sb-st is-${st}`} title={ST[st].tip}>{ST[st].l}</span>
            <button type="button" className="fs-sb-mini" disabled={busy} onClick={() => onEdit(card)}
                    title="Edit this card — title, what happens, the pull, how it starts">Edit</button>
            <span className="fs-sb-grow" />
            {st === 'finished' && episode?.output_url && (
              <button type="button" className="fs-sb-btn play" onClick={() => onWatch(episode)} title="Watch this episode">
                <IconPlay s={11} /></button>
            )}
            <button type="button" className={`fs-sb-btn${action.cta ? ' cta' : ''}`} onClick={action.fn}
                    disabled={busy} title={action.tip}>{action.l}</button>
          </div>
        </>
      )}
    </article>
  );
}

export default function SeasonBoard({ series, onStartEpisode = () => {}, onOpen = () => {}, onWatch = () => {},
                                      onAvailability = () => {} }) {
  const sid = series?.series_id;
  const [plan, setPlan] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);          // label while a call runs
  const [err, setErr] = useState(null);
  const [editN, setEditN] = useState(null);        // card n being edited
  const [draft, setDraft] = useState(null);
  const [premise, setPremise] = useState('');
  const [confirmReplan, setConfirmReplan] = useState(false);

  const adopt = (res) => { setPlan(res?.plan || null); setStatuses(res?.statuses || []); };

  useEffect(() => {
    let off = false;
    setLoading(true); setErr(null); setEditN(null); setConfirmReplan(false);
    filmGetPlan(sid)
      .then((res) => { if (!off) { adopt(res); onAvailability(true); } })
      .catch((e) => {
        if (off) return;
        if (e?.response?.status === 404) onAvailability(false);   // switch off → no tab
        else setErr(friendlyError(e, 'Could not load the season plan.'));
      })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
    // reload when the series changes or an episode is added (its card status changes)
  }, [sid, (series?.episodes || []).length]);

  const run = useCallback(async (label, fn) => {
    setBusy(label); setErr(null);
    try { adopt(await fn()); return true; }
    catch (e) { setErr(friendlyError(e, 'That didn’t work — please try again.')); return false; }
    finally { setBusy(null); }
  }, []);

  const save = (cards) => run('Saving…', () => filmSavePlan(sid, { ...plan, cards }));
  const cards = plan?.cards || [];
  const threads = plan?.threads || [];
  const statusOf = (n) => (statuses.find((s) => s.n === n) || {}).status || 'planned';
  const epByPid = useMemo(() => Object.fromEntries((series?.episodes || []).map((e) => [e.project_id, e])), [series]);
  const epFor = (c) => {
    const pid = c.project_id || (statuses.find((s) => s.n === c.n) || {}).project_id;
    return pid ? epByPid[pid] : null;
  };
  const nextN = (cards.find((c) => statusOf(c.n) === 'planned') || {}).n;
  const skeleton = plan?.based_on === 'skeleton';
  // A thread reads as resolved only once the episode that resolves it is finished —
  // a plan that MEANS to close it later leaves it open on the board.
  const closed = new Set(cards.filter((c) => statusOf(c.n) === 'finished').flatMap((c) => c.closes || []));
  const plannedClose = new Set(cards.flatMap((c) => c.closes || []));

  const onLock = (card) => save(cards.map((c) => (c.n === card.n ? { ...c, locked: !c.locked } : c)));
  const onMove = (card, d) => {
    const i = cards.findIndex((c) => c.n === card.n), j = i + d;
    if (j < 0 || j >= cards.length) return;
    const next = cards.slice(); [next[i], next[j]] = [next[j], next[i]];
    setEditN(null); setDraft(null);
    save(next);
  };
  const onRemove = (card) => { setEditN(null); setDraft(null); save(cards.filter((c) => c.n !== card.n)); };
  const onSaveCard = async () => {
    if (await save(cards.map((c) => (c.n === editN ? { ...c, ...draft } : c)))) { setEditN(null); setDraft(null); }
  };
  const addCard = () => save([...cards, { title: `Episode ${cards.length + 1}`, logline: '', relation: 'later',
                                          opens: [], closes: [], pull: '', locked: false }]);

  if (loading) return <div className="fs-sb-empty"><div className="film-spin" /><p>Loading the season…</p></div>;

  if (!plan) {
    const empty = !(series?.episodes || []).length && !series?.canonical_bible && !series?.has_bible;
    return (
      <div className="fs-sb-empty fs-glass">
        <h3>Plan this season</h3>
        <p>Six cards, one per episode: what happens, how each one ends, and what pulls viewers into the next.
          {empty ? ' Your series has no story yet, so start with one line about it — or plan the structure only and fill it in as you go.'
                 : ' Built from your bible, cast and episodes so far. You can edit, lock or reorder every card.'}</p>
        {empty && (
          <input id="sb-premise" className="fs-inp" value={premise} maxLength={300}
                 onChange={(e) => setPremise(e.target.value)}
                 placeholder="One line about the series, e.g. A London cabbie solves one forgotten crime a week"
                 aria-label="Series premise" />
        )}
        {err && <div className="fs-merr">{err}</div>}
        <div className="fs-sb-acts">
          <button type="button" className="fs-mbtn primary" disabled={!!busy}
                  onClick={() => run('Planning…', () => filmMakePlan(sid, { premise: premise.trim() || undefined }))}
                  title={empty && !premise.trim() ? 'Lay out six episode roles (hook, escalation… finale) to fill in yourself'
                                                  : 'Write a six-episode plan for this series — writing is free'}>
            {busy || (empty && !premise.trim() ? 'Plan the structure' : 'Plan the season')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fs-sb">
      <div className="fs-sb-head">
        <div className="fs-sb-threadrow">
          {threads.length ? <span className="fs-seclabel" style={{ margin: 0 }}>Threads</span> : null}
          {threads.map((t, i) => (
            <span key={t.id} className={`fs-sb-thread${closed.has(t.id) ? ' is-closed' : ''}`}
                  style={{ '--th': THREAD_HUES[i % THREAD_HUES.length] }}
                  title={closed.has(t.id) ? `${t.name} — resolved`
                         : plannedClose.has(t.id) ? `${t.name} — open; the plan resolves it later this season`
                         : `${t.name} — open, not resolved this season`}>
              <i />{t.name}
            </span>
          ))}
        </div>
        <span className="fs-sb-grow" />
        {confirmReplan ? (
          <span className="fs-sb-confirm">
            Re-plan keeps locked cards and cards with episodes; the rest are rewritten.
            <button type="button" className="fs-sb-btn cta" disabled={!!busy}
                    onClick={() => { setConfirmReplan(false); run('Re-planning…', () => filmMakePlan(sid, { refresh: true })); }}
                    title="Rewrite the unlocked cards now">Re-plan</button>
            <button type="button" className="fs-sb-btn ghost" onClick={() => setConfirmReplan(false)} title="Keep the plan as it is">Keep</button>
          </span>
        ) : (
          <button type="button" className="fs-sb-btn ghost" disabled={!!busy} onClick={() => setConfirmReplan(true)}
                  title="Rewrite the season from your latest episodes — locked cards and cards with episodes stay">
            {busy || 'Re-plan season'}
          </button>
        )}
      </div>

      {skeleton && (
        <div className="fs-sb-premise">
          <p>These cards show each episode&rsquo;s job in the season. Add one line about your series and they become a real plan.</p>
          <input id="sb-premise2" className="fs-inp" value={premise} maxLength={300}
                 onChange={(e) => setPremise(e.target.value)} aria-label="Series premise"
                 placeholder="e.g. A London cabbie solves one forgotten crime a week" />
          <button type="button" className="fs-mbtn primary" disabled={!!busy || !premise.trim()}
                  onClick={() => run('Planning…', () => filmMakePlan(sid, { premise: premise.trim() }))}
                  title="Turn these roles into a six-episode story — writing is free">Plan the season</button>
        </div>
      )}

      {err && <div className="fs-merr">{err}</div>}

      <div className="fs-sb-rail">
        {cards.map((c, i) => (
          <SeasonCard key={`${c.n}-${c.title}`} card={c} status={statusOf(c.n)} episode={epFor(c)} threads={threads}
                      editing={editN === c.n ? draft : null} busy={!!busy} isNext={c.n === nextN}
                      canLeft={i > 0} canRight={i < cards.length - 1}
                      onEdit={(card) => { setEditN(card.n); setDraft({ ...card }); }}
                      onDraft={setDraft} onSave={onSaveCard} onCancel={() => { setEditN(null); setDraft(null); }}
                      onLock={onLock} onMove={onMove} onRemove={onRemove}
                      onStart={onStartEpisode} onOpen={onOpen} onWatch={onWatch} />
        ))}
        <button type="button" className="fs-sb-card fs-sb-add" onClick={addCard} disabled={!!busy}
                title="Add a card after the last one — for a season longer than six episodes">
          <IconPlus s={22} /><span>Add a card</span><small>Episode {cards.length + 1}</small>
        </button>
      </div>
    </div>
  );
}