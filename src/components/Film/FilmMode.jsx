// src/components/Film/FilmMode.jsx
// The top-level Film mode (mounted when currentView === VIEW_STATES.FILM).
// Lands on My Films; opening or creating a film mounts the workspace bound to
// that project. "My Films" (inside the workspace topbar) returns here.

import React, { useState, useCallback } from 'react';
import useFilmProjects from './useFilmProjects';
import useFilmSeries from './useFilmSeries';
import MyFilmsView from './MyFilmsView';
import FilmWorkspaceContainer from './FilmWorkspaceContainer';
import './FilmWorkspace.css';

export default function FilmMode() {
  const projects = useFilmProjects();
  const series = useFilmSeries();
  const [open, setOpen] = useState(null);   // { projectId, sessionId } | null

  const openFilm = useCallback((projectId, sessionId = null) =>
    setOpen({ projectId, sessionId }), []);

  const backToFilms = useCallback(() => {
    setOpen(null);
    projects.refresh();     // pick up any status/title changes from the render
    series.refresh();       // and any new series / episodes / harvested cast
  }, [projects, series]);

  const onNew = useCallback(async (opts) => {
    const proj = await projects.create(opts);
    if (proj) openFilm(proj.project_id, proj.session_id);
  }, [projects, openFilm]);

  const onDelete = useCallback((film) => {
    if (window.confirm(`Delete “${film.title || 'Untitled film'}”? This can’t be undone.`)) {
      projects.remove(film.id);
    }
  }, [projects]);

  if (open) {
    return (
      <FilmWorkspaceContainer
        projectId={open.projectId}
        initialSessionId={open.sessionId}
        onBackToFilms={backToFilms}
      />
    );
  }

  return (
    <div className="film-workspace theme-awakeverse film-mode-root">
      <MyFilmsView
        films={projects.films}
        loading={projects.loading}
        busy={projects.busy}
        error={projects.error}
        onOpen={(id) => openFilm(id)}
        onOpenFilm={openFilm}
        onNew={onNew}
        onDelete={onDelete}
        series={series.series}
        seriesActions={series}
      />
    </div>
  );
}