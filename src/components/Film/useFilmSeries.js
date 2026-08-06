// src/components/Film/useFilmSeries.js
// Series library state — list / create / add-episode / promote / refresh-plate.
// Mirrors useFilmProjects: a thin layer over filmApi with loading + friendly
// errors, so components stay declarative. No credit logic lives here (series
// actions produce no video); an episode's render is charged by the existing
// workspace flow, untouched.

import { useState, useEffect, useCallback } from 'react';
import {
  filmListSeries, filmCreateSeries, filmCreateEpisode,
  filmPromoteToSeries, filmRefreshCharacterPlate, friendlyError,
} from './filmApi';

export default function useFilmSeries() {
  const [series, setSeries]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await filmListSeries();
      setSeries(Array.isArray(data?.series) ? data.series : []);
    } catch (e) {
      setError(friendlyError(e, "Couldn't load your series."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createSeries = useCallback(async (opts) => {
    const res = await filmCreateSeries(opts);
    await refresh();
    return res;                       // { series_id, ... }
  }, [refresh]);

  // Returns { project_id, session_id, episode_ordinal }. Caller opens the
  // workspace with (project_id, session_id) just like a new film.
  const createEpisode = useCallback(async (seriesId, opts) => {
    const res = await filmCreateEpisode(seriesId, opts);
    await refresh();
    return res;
  }, [refresh]);

  const promote = useCallback(async (projectId, opts) => {
    const res = await filmPromoteToSeries(projectId, opts);
    await refresh();
    return res;                       // { series_id, ... }
  }, [refresh]);

  const refreshCharacterPlate = useCallback(async (seriesId, characterId, body) => {
    const res = await filmRefreshCharacterPlate(seriesId, characterId, body);
    await refresh();
    return res;
  }, [refresh]);

  return { series, loading, error, refresh, createSeries, createEpisode, promote, refreshCharacterPlate };
}

// Also available as a named import, for flexibility.
export { useFilmSeries };