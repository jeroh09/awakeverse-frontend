// src/components/VerseStudio/VerseStudioTab.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useVerseStudio from '../../hooks/useVerseStudio';
import TaskChatWindow from './TaskChatWindow';
import TaskCreator from './TaskCreator';
import styles from './VerseStudioTab.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

export default function VerseStudioTab() {
  const verseStudio = useVerseStudio();

  // Data
  const [templates, setTemplates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tokensState, setTokensState] = useState(null);
  const [resumingTaskId, setResumingTaskId] = useState(null);

  // UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  // ✅ Restore Upgrade modal
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Task Creator modal
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [creatorTemplate, setCreatorTemplate] = useState(null);
  const [creatorError, setCreatorError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // -----------------------------------------------------------------------
  // INITIAL LOAD: tasks, templates, tokens
  // -----------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [tasksRes, templatesRes, tokensRes] = await Promise.all([
          fetch(`${API_BASE}/api/verse-studio/tasks`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          }),
          fetch(`${API_BASE}/api/verse-studio/templates`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          }),
          fetch(`${API_BASE}/api/verse-studio/tokens`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          })
        ]);

        if (!tasksRes.ok) throw new Error(`Failed to load tasks (${tasksRes.status})`);
        if (!templatesRes.ok) throw new Error(`Failed to load templates (${templatesRes.status})`);
        if (!tokensRes.ok) throw new Error(`Failed to load token state (${tokensRes.status})`);

        const tasksJson = await tasksRes.json();
        const templatesJson = await templatesRes.json();
        const tokensJson = await tokensRes.json();

        if (!isMounted) return;

        setTasks(tasksJson.tasks || []);
        setTemplates(templatesJson.templates || []);
        setTokensState(tokensJson || null);
      } catch (err) {
        if (!isMounted) return;
        console.error('❌ Verse Workspace load error:', err);
        setError(err.message || 'Failed to load Verse Workspace');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, []);

  // -----------------------------------------------------------------------
  // TRIAL: only 3 free tasks
  // -----------------------------------------------------------------------
  const trialInfo = useMemo(() => {
    const used = tokensState?.trial_tasks_used ?? 0;
    const remaining = tokensState?.trial_tasks_remaining ?? Math.max(3 - used, 0);
    const total = 3;
    return { used, remaining, total };
  }, [tokensState]);

  const trialLimitReached = trialInfo.used >= 3 || trialInfo.remaining <= 0;

  // -----------------------------------------------------------------------
  // Open TaskCreator (but gate with Upgrade modal)
  // -----------------------------------------------------------------------
  const openCreator = useCallback(async (template) => {
    // ✅ Premium gating: show upgrade modal (not TaskCreator)
    if (trialLimitReached) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setCreatorError(null);
    setCreatorTemplate(template);
    setIsCreatorOpen(true);

    // Load llm options (safe fallback inside hook)
    try {
      await verseStudio.refreshLLMOptions();
    } catch (e) {
      // hook already falls back; no need to block UI
    }
  }, [trialLimitReached, verseStudio]);

  const closeCreator = useCallback(() => {
    if (isCreating) return;
    setIsCreatorOpen(false);
    setCreatorTemplate(null);
    setCreatorError(null);
  }, [isCreating]);

  // -----------------------------------------------------------------------
  // CREATE (from TaskCreator)
  // -----------------------------------------------------------------------
  const handleCreateFromCreator = useCallback(async (payload) => {
    if (trialLimitReached) {
      // ✅ In case token state changes while modal open
      setIsCreatorOpen(false);
      setCreatorTemplate(null);
      setCreatorError(null);
      setIsUpgradeModalOpen(true);
      return;
    }

    try {
      setIsCreating(true);
      setCreatorError(null);

      const newTaskId = await verseStudio.createTask(payload);

      const newTask = {
        id: newTaskId,
        task_id: newTaskId,
        name: payload.name,
        description: payload.description,
        template_id: payload.template_id,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setTasks((prev) => [newTask, ...prev]);
      setActiveTask(newTask);
      setIsCreatorOpen(false);

      // Refresh token state so counter updates
      try {
        const tokensRes = await fetch(`${API_BASE}/api/verse-studio/tokens`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (tokensRes.ok) {
          const tokensJson = await tokensRes.json();
          setTokensState(tokensJson);
        }
      } catch (innerErr) {
        console.warn('Could not refresh Verse Workspace token state:', innerErr);
      }
    } catch (err) {
      console.error('❌ Failed to create Verse Workspace task:', err);
      setCreatorError(err.message || 'Failed to create task');
    } finally {
      setIsCreating(false);
    }
  }, [trialLimitReached, verseStudio]);

  const handleResumeTask = useCallback(async (task) => {
    const id = task?.id || task?.task_id;
    if (!id) return;

    try {
      setResumingTaskId(id);
      setError(null);

      await verseStudio.loadTask(id);

      // Open fullscreen chat window
      setActiveTask(task);
    } catch (err) {
      console.error('❌ Resume failed:', err);
      setError(err.message || 'Failed to resume task');
    } finally {
      setResumingTaskId(null);
    }
  }, [verseStudio]);

  // -----------------------------------------------------------------------
  // Back from chat
  // -----------------------------------------------------------------------
  const handleBackFromChat = useCallback(() => {
    setActiveTask(null);
    verseStudio.resetTask && verseStudio.resetTask();
  }, [verseStudio]);

  // -----------------------------------------------------------------------
  // Full screen chat
  // -----------------------------------------------------------------------
  if (activeTask) {
    return (
      <TaskChatWindow
        task={activeTask}
        verseStudio={verseStudio}
        onBack={handleBackFromChat}
      />
    );
  }

  // -----------------------------------------------------------------------
  // Main workspace tab
  // -----------------------------------------------------------------------
  return (
    <div className={styles.verseStudioTab}>
      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.eyebrow}>Verse Workspace</div>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Verse Workspace</h1>
            <span className={styles.titlePill}>Trial · 3 free tasks</span>
          </div>
          <p className={styles.subtitle}>
            Orchestrate a small team of specialist LLMs to plan, code, review,
            and document your projects — all in one AwakeVerse workspace.
          </p>
        </div>

        <div className={styles.usagePill}>
          <span className={styles.usageDot} />
          <div className={styles.usageText}>
            <strong>{trialInfo.used}</strong> / <strong>{trialInfo.total}</strong> free tasks used
          </div>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          <div className={styles.errorTitle}>Verse Workspace is feeling a bit moody.</div>
          <p className={styles.errorBody}>{error}</p>
        </div>
      )}

      <main className={styles.mainGrid}>
        {/* Templates */}
        <section className={styles.templatesColumn}>
          <div className={styles.columnHeader}>
            <div>
              <h2 className={styles.columnTitle}>Verse Workspace templates</h2>
              <p className={styles.columnSubtitle}>
                Start with a ready-made team for landing pages, APIs, docs, and more.
              </p>
            </div>
          </div>

          {loading && !templates.length ? (
            <div className={styles.loadingBox}>
              <div className={styles.loadingSpinner} />
              <div className={styles.loadingText}>Loading templates…</div>
            </div>
          ) : templates.length === 0 ? (
            <div className={styles.emptyTemplates}>
              <div className={styles.emptyTitle}>No templates found.</div>
              <p className={styles.emptyBody}>
                Once templates are configured on the backend, they will appear here.
              </p>
            </div>
          ) : (
            <div className={styles.templatesGrid}>
              {templates.map((template) => {
                const templateId = template.template_id || template.id || template.slug;
                const title = template.display_name || template.name || template.title || templateId;
                const description =
                  template.description ||
                  template.subtitle ||
                  'Use this Verse Workspace template to get started quickly.';

                return (
                  <article key={templateId} className={styles.templateCard}>
                    <div className={styles.templateTagRow}>
                      <span className={styles.templateTag}>Verse Workspace</span>
                      {template.category && (
                        <span className={styles.templateTagSecondary}>{template.category}</span>
                      )}
                    </div>

                    <h3 className={styles.templateTitle}>{title}</h3>
                    <p className={styles.templateDesc}>{description}</p>

                    <button
                      type="button"
                      className={
                        trialLimitReached
                          ? `${styles.useTemplateButton} ${styles.useTemplateButtonLocked}`
                          : styles.useTemplateButton
                      }
                      onClick={() => openCreator(template)}
                      disabled={false /* allow click so upgrade modal can open */}
                    >
                      {trialLimitReached ? 'Upgrade to create more tasks' : 'Use this template'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Tasks column - UPDATED */}
        <section className={styles.tasksColumn}>
          <div className={styles.columnHeader}>
            <div>
              <h2 className={styles.columnTitle}>My workspaces</h2>
              <p className={styles.columnSubtitle}>
                Resume an active workspace or start a new one from a template.
              </p>
            </div>
          </div>

          {loading && !tasks.length ? (
            <div className={styles.loadingBox}>
              <div className={styles.loadingSpinner} />
              <div className={styles.loadingText}>Loading your workspaces…</div>
            </div>
          ) : tasks.length === 0 ? (
            <div className={styles.emptyTasks}>
              <div className={styles.emptyTitle}>No workspaces yet.</div>
              <p className={styles.emptyBody}>
                Pick a template on the left to create your first Verse Workspace task.
              </p>
            </div>
          ) : (
            <div className={styles.tasksList}>
              {tasks.map((t) => {
                const taskId = t.task_id || t.id;
                const title = t.name || 'Untitled workspace';
                const desc = t.description || '';

                // Best-effort role preview (backend may return team later; safe fallback)
                const team = t.team || t.llm_team || [];

                return (
                  <button
                    key={taskId}
                    type="button"
                    className={styles.taskCard}
                    onClick={() => handleResumeTask(t)}
                    title="Open workspace"
                  >
                    <div className={styles.taskCardTop}>
                      <div className={styles.taskTitleRow}>
                        <div className={styles.taskTitle}>{title}</div>
                        <span className={styles.taskStatusPill}>
                          {(t.status || 'active').toUpperCase()}
                        </span>
                      </div>

                      {desc ? <div className={styles.taskDescription}>{desc}</div> : null}
                    </div>

                    <div className={styles.taskMetaRow}>
                      {team?.length ? (
                        <div className={styles.roleChips}>
                          {team.slice(0, 3).map((m, idx) => (
                            <span key={`${taskId}_${m.role_id || idx}`} className={styles.roleChip}>
                              {m.role_icon || '🤖'} {m.role_name || m.role_id || 'Role'}
                            </span>
                          ))}
                          {team.length > 3 ? (
                            <span className={styles.roleChipMuted}>+{team.length - 3} more</span>
                          ) : null}
                        </div>
                      ) : (
                        <div className={styles.roleChips}>
                          <span className={styles.roleChipMuted}>Team loads on open</span>
                        </div>
                      )}

                      <span className={styles.taskCta}>Open →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* TaskCreator modal */}
      <TaskCreator
        isOpen={isCreatorOpen}
        template={creatorTemplate}
        llmOptions={verseStudio.llmOptions}
        minModels={2}
        maxModels={3}
        isCreating={isCreating}
        errorMessage={creatorError}
        onCancel={closeCreator}
        onCreate={handleCreateFromCreator}
      />

      {/* ✅ Restore Upgrade modal overlay (from your 460-line version pattern) */}
      {isUpgradeModalOpen && (
        <div className={styles.upgradeOverlay}>
          <div className={styles.upgradeModal}>
            <h3 className={styles.upgradeTitle}>
              Verse Workspace trial limit reached
            </h3>
            <p className={styles.upgradeBody}>
              You've created the maximum of 3 free Verse Workspace tasks on this
              account. Upgrade your AwakeVerse plan to keep creating tasks and
              unlock higher token limits.
            </p>
            <div className={styles.upgradeActions}>
              <button
                type="button"
                className={styles.upgradePrimary}
                onClick={() => setIsUpgradeModalOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.upgradeSecondary}
                onClick={() => {
                  window.open('/pricing', '_blank', 'noopener,noreferrer');
                }}
              >
                View plans
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}