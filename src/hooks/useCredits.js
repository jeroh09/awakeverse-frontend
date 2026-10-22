// src/useCredits.js — app-level credits hook (product-neutral).
// One source of truth for the balance chip (on ANY surface) and the account panel.
// Reads the universal /api/credits endpoints via creditsApi. This supersedes the
// film-scoped components/Film/useCredits.js — point Film's imports here (or delete
// the Film copy) so there's a single hook app-wide.
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCredits, fetchPrice, fetchCreditHistory } from '../creditsApi';

export default function useCredits() {
  const [balance, setBalance] = useState(null);   // null = not loaded yet
  const [held, setHeld] = useState(0);
  const [tier, setTier] = useState('free');
  const [buckets, setBuckets] = useState([]);              // [{bucket,points,expires_in_days}]
  const [expiringSoon, setExpiringSoon] = useState(null);  // {bucket,points,expires_in_days}|null
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchCredits();
      if (!mounted.current) return;
      setBalance(d.balance); setHeld(d.held || 0);
      setTier(d.tier || 'free');
      setBuckets(d.buckets || []);
      setExpiringSoon(d.expiring_soon || null);
    } catch { /* silent — chip shows last known / dashes */ }
    finally { if (mounted.current) setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Pre-render cost lookup for a confirm UI.
  const priceFor = useCallback(async (contentType, tier, nBeats) => {
    try { return await fetchPrice(contentType, tier, nBeats); }
    catch { return null; }
  }, []);

  const history = useCallback((limit = 50) =>
    fetchCreditHistory(limit).then(d => d.history || []).catch(() => []), []);

  return { balance, held, tier, buckets, expiringSoon, loading, refresh, priceFor, history };
}