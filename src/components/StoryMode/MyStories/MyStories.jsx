import React, { useEffect, useState } from 'react';
import { getMyStories, archiveStory } from '../../../api';
import css from './MyStories.module.css';

export default function MyStories({ onContinue }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [stories, setStories] = useState([]);

  const load = async () => {
    setLoading(true); setErr(null);
    const res = await getMyStories({ status: 'active', limit: 40, offset: 0 });
    if (res.status === 'success') setStories(res.stories || []);
    else setErr(res.error || 'Failed to load stories');
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleArchive = async (id) => {
    const res = await archiveStory(id);
    if (res.status === 'success') setStories(prev => prev.filter(s => s.id !== id));
    else alert(res.error || 'Failed to archive');
  };

  if (loading) return <div className={css.info}>Loading your stories…</div>;
  if (err) return <div className={css.error}>⚠ {err}</div>;
  if (!stories.length) return <div className={css.empty}>No stories yet — start one from Templates.</div>;

  return (
    <div className={css.grid}>
      {stories.map(s => (
        <article key={s.id} className={css.card}>
          <div className={css.thumb}>{(s.character_key || 'Story').toUpperCase()}</div>
          <div className={css.pill}>{s.era || '—'}</div>
          <div className={css.body}>
            <div className={css.title}>{s.title}</div>
            <div className={css.meta}>
              <span className={css.badge}>Turns: {s.turns ?? 0}</span>
              <span className={css.badge}>Updated: {new Date(s.lastActive || s.updated_at || Date.now()).toLocaleString()}</span>
            </div>
            <div className={css.row}>
              <button className={css.btnGold} onClick={() => onContinue(s)}>Continue</button>
              <button className={css.btn} onClick={() => handleArchive(s.id)}>Archive</button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
