// src/components/Film/useFilmProjects.js
// My Films: the user's movies (list/create/open/delete) via the film_projects API.
// Kept separate from useFilmAuthoring/useFilmJob — this is the library layer that
// the Film mode lands on; the workspace hooks drive a single open movie.

import { useState, useCallback, useEffect } from 'react';
import {
  filmListProjects, filmCreateProject, filmDeleteProject, friendlyError,
} from './filmApi';

export default function useFilmProjects() {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);      // create/delete in flight
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setError(null); setLoading(true);
    try {
      const data = await filmListProjects();
      setFilms(data.films || []);
    } catch (e) {
      setError(friendlyError(e, 'Could not load your films.'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async ({ title, video_style, duration_seconds, aspect_ratio } = {}) => {
    setError(null); setBusy(true);
    try {
      const proj = await filmCreateProject({ title, video_style, duration_seconds, aspect_ratio });
      return proj;                     // { project_id, session_id, title, aspect_ratio, ... }
    } catch (e) {
      setError(friendlyError(e, 'Could not start a new film.'));
      return null;
    } finally { setBusy(false); }
  }, []);

  const remove = useCallback(async (projectId) => {
    setError(null); setBusy(true);
    // optimistic
    const prev = films;
    setFilms(f => f.filter(x => x.id !== projectId));
    try {
      await filmDeleteProject(projectId);
    } catch (e) {
      setFilms(prev);                  // roll back on failure
      setError(friendlyError(e, 'Could not delete that film.'));
    } finally { setBusy(false); }
  }, [films]);

  return { films, loading, busy, error, refresh, create, remove };
}