// src/components/VerseStudio/VerseStudioTab.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import useVerseStudio from '../../hooks/useVerseStudio';
import TaskChatWindow from './TaskChatWindow';
import styles from './VerseStudioTab.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.awakeverse.com';

/**
 * VerseStudioTab
 *
 * Main Verse Studio landing:
 * - Left: Templates column (quick start from template)
 * - Right: My Tasks column (list of existing tasks, trial status)
 * - Full-page TaskChatWindow when a task is active
 *
 * NOTE (honest): Resuming *existing* tasks via the new chat shell will need
 * a future enhancement in useVerseStudio (a loadTask-style action).
 * For now, "Open task" is visually present but disabled.
 */
export default function VerseStudioTab() {
  const verseStudio = useVerseStudio();

  // Data state
  const [templates, setTemplates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tokensState, setTokensState] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [creatingTemplateId, setCreatingTemplateId] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // INITIAL LOAD: templates, tasks, token/trial state
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
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

        if (!tasksRes.ok) {
          throw new Error(`Failed to load tasks (${tasksRes.status})`);
        }
        if (!templatesRes.ok) {
          throw new Error(`Failed to load templates (${templatesRes.status})`);
        }
        if (!tokensRes.ok) {
          throw new Error(`Failed to load token state (${tokensRes.status})`);
        }

        const tasksJson = await tasksRes.json();
        const templatesJson = await templatesRes.json();
        const tokensJson = await tokensRes.json();

        if (!isMounted) return;

        setTasks(tasksJson.tasks || []);
        setTemplates(templatesJson.templates || []);
        setTokensState(tokensJson || null);
      } catch (e) {
        if (!isMounted) return;
        console.error('❌ VerseStudioTab load error:', e);
        setError(e.message || 'Failed to load Verse Studio');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // DERIVED TRIAL STATE
  // ---------------------------------------------------------------------------
  const trialInfo = useMemo(() => {
    if (!tokensState) {
      return {
        used: 0,
        remaining: 3,
        total: 3,
        tier: 'free'
      };
    }

    const used = tokensState.trial_tasks_used ?? 0;
    const remaining = tokensState.trial_tasks_remaining ?? Math.max(3 - used, 0);
    const total = used + remaining || 3;

    return {
      used,
      remaining,
      total,
      tier: tokensState.tier || 'free'
    };
  }, [tokensState]);

  const trialProgress = useMemo(() => {
    if (!trialInfo.total) return 0;
    const value = trialInfo.used / trialInfo.total;
    return Math.max(0, Math.min(1, value));
  }, [trialInfo]);

  const trialLimitReached = trialInfo.used >= 3 || trialInfo.remaining <= 0;

  // ---------------------------------------------------------------------------
  // TEMPLATE → CREATE TASK
  // ---------------------------------------------------------------------------
  const handleTemplateClick = useCallback(
    async (template) => {
      if (!verseStudio || !verseStudio.createTask) {
        console.warn('useVerseStudio not ready yet');
        return;
      }

      if (trialLimitReached) {
        setIsUpgradeModalOpen(true);
        return;
      }

      try {
        setCreatingTemplateId(template.id || template.template_id || template.slug || template.name);
        const baseName =
          template.display_name ||
          template.name ||
          template.title ||
          'Verse Studio Task';

        const description =
          template.description ||
          template.subtitle ||
          'A new Verse Studio task based on this template.';

        const templateId = template.template_id || template.id || template.slug;

        if (!templateId) {
          throw new Error('Template is missing template_id / id');
        }

        const newTaskId = await verseStudio.createTask({
          name: baseName,
          description,
          template_id: templateId
          // LLM assignments will be added later via a TaskCreator flow
        });

        if (!newTaskId) {
          throw new Error('Task created but no task_id returned');
        }

        // Create a minimal local task object for the new session
        const newTask = {
          id: newTaskId,
          task_id: newTaskId,
          name: baseName,
          description,
          template_id: templateId,
          templateName: baseName,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        setTasks((prev) => [newTask, ...prev]);
        setActiveTask(newTask);

        // Refresh token state so the trial counter stays accurate
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
        } catch (innerError) {
          console.warn('Could not refresh Verse Studio token state:', innerError);
        }
      } catch (e) {
        console.error('❌ Failed to create Verse Studio task:', e);
        setError(e.message || 'Failed to create task');
      } finally {
        setCreatingTemplateId(null);
      }
    },
    [verseStudio, trialLimitReached]
  );

  // ---------------------------------------------------------------------------
  // BACK FROM CHAT WINDOW
  // ---------------------------------------------------------------------------
  const handleBackFromChat = useCallback(() => {
    setActiveTask(null);
    if (verseStudio && verseStudio.resetTask) {
      verseStudio.resetTask();
    }
  }, [verseStudio]);

  // ---------------------------------------------------------------------------
  // RENDER: Full-screen chat if a task is active
  // ---------------------------------------------------------------------------
  if (activeTask) {
    return (
      <TaskChatWindow
        task={activeTask}
        verseStudio={verseStudio}
        onBack={handleBackFromChat}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Verse Studio main tab
  // ---------------------------------------------------------------------------
  return (
    <div className={styles.verseStudioTab}>
      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.eyebrow}>Verse Workspace</div>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Verse Workspace</h1>
            <span className={styles.titlePill}>
              Trial · 3 free tasks
            </span>
          </div>
          <p className={styles.subtitle}>
            Orchestrate a small team of specialist LLMs to plan, code, review,
            and document your projects — all in one AwakeVerse canvas.
          </p>
        </div>

        <div className={styles.usagePill}>
          <span className={styles.usageDot} />
          <div className={styles.usageText}>
            <strong>{trialInfo.used}</strong> / <strong>{trialInfo.total}</strong>{' '}
            free tasks used
          </div>
          <div className={styles.usageBar}>
            <div
              className={styles.usageFill}
              style={{ transform: `scaleX(${trialProgress})` }}
            />
          </div>
          {trialLimitReached && (
            <span className={styles.usageStatus}>
              Limit reached
            </span>
          )}
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          <div className={styles.errorTitle}>Verse Workspace is feeling a bit moody.</div>
          <p className={styles.errorBody}>{error}</p>
        </div>
      )}

      <main className={styles.mainGrid}>
        {/* ========== TEMPLATES COLUMN ========== */}
        <section className={styles.templatesColumn}>
          <div className={styles.columnHeader}>
            <div>
              <h2 className={styles.columnTitle}>Verse Studio templates</h2>
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
                Once templates are configured on the backend, they will appear here
                as quick starting points for new Verse Studio tasks.
              </p>
            </div>
          ) : (
            <div className={styles.templatesGrid}>
              {templates.map((template) => {
                const templateId =
                  template.template_id || template.id || template.slug;
                const isCreating = creatingTemplateId === templateId;

                const title =
                  template.display_name ||
                  template.name ||
                  template.title ||
                  templateId;

                const description =
                  template.description ||
                  template.subtitle ||
                  'Use this Verse Studio template to get started quickly.';

                const roles = template.roles || template.team_roles || [];

                return (
                  <article
                    key={templateId}
                    className={styles.templateCard}
                  >
                    <div className={styles.templateTagRow}>
                      <span className={styles.templateTag}>
                        Verse Workspace
                      </span>
                      {template.category && (
                        <span className={styles.templateTagSecondary}>
                          {template.category}
                        </span>
                      )}
                    </div>
                    <h3 className={styles.templateTitle}>{title}</h3>
                    <p className={styles.templateDesc}>{description}</p>

                    {roles.length > 0 && (
                      <div className={styles.templateRoles}>
                        {roles.slice(0, 3).map((role) => (
                          <span
                            key={role.role_id || role.id || role.name}
                            className={styles.rolePill}
                          >
                            {role.icon || '⚙️'}{' '}
                            {role.name || role.role_name || 'Role'}
                          </span>
                        ))}
                        {roles.length > 3 && (
                          <span className={styles.roleMore}>
                            +{roles.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      className={
                        trialLimitReached
                          ? `${styles.useTemplateButton} ${styles.useTemplateButtonLocked}`
                          : styles.useTemplateButton
                      }
                      onClick={() => handleTemplateClick(template)}
                      disabled={trialLimitReached || isCreating}
                    >
                      {trialLimitReached
                        ? 'Upgrade to create more tasks'
                        : isCreating
                        ? 'Creating…'
                        : 'Use this template'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ========== MY TASKS COLUMN ========== */}
        <section className={styles.tasksColumn}>
          <div className={styles.columnHeader}>
            <div>
              <h2 className={styles.columnTitle}>My Verse Studio tasks</h2>
              <p className={styles.columnSubtitle}>
                Pick up where your LLM team left off.
              </p>
            </div>
          </div>

          {loading && !tasks.length ? (
            <div className={styles.loadingBox}>
              <div className={styles.loadingSpinner} />
              <div className={styles.loadingText}>Loading tasks…</div>
            </div>
          ) : tasks.length === 0 ? (
            <div className={styles.emptyTasks}>
              <div className={styles.emptyTitle}>No Verse Studio tasks yet.</div>
              <p className={styles.emptyBody}>
                Choose a template on the left to create your first multi-LLM task.
              </p>
            </div>
          ) : (
            <div className={styles.tasksList}>
              {tasks.map((task) => {
                const id = task.id || task.task_id;
                const name = task.name || 'Untitled task';
                const templateName =
                  task.templateName ||
                  task.template_name ||
                  task.template_id ||
                  'Template';
                const updated =
                  task.updated_at || task.created_at || null;

                return (
                  <article
                    key={id}
                    className={styles.taskCard}
                  >
                    <div className={styles.taskMeta}>
                      <div className={styles.taskName}>{name}</div>
                      <div className={styles.taskSub}>
                        {templateName} ·{' '}
                        {updated
                          ? `Updated ${new Date(updated).toLocaleString()}`
                          : 'New task'}
                      </div>
                    </div>

                    <div className={styles.taskActions}>
                      {/* Honest: resume wiring will come when we extend useVerseStudio */}
                      <button
                        type="button"
                        className={`${styles.taskButton} ${styles.taskButtonDisabled}`}
                        disabled
                        title="Resume chat will be wired once Verse Studio loadTask is added."
                      >
                        Resume (soon)
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {trialLimitReached && (
            <div className={styles.trialBanner}>
              <div className={styles.trialDot} />
              <div className={styles.trialText}>
                You’ve used your 3 free Verse Studio tasks. Upgrade to unlock
                unlimited tasks and extended token limits.
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Simple upgrade modal shell – you can hook your real premium flow here */}
      {isUpgradeModalOpen && (
        <div className={styles.upgradeOverlay}>
          <div className={styles.upgradeModal}>
            <h3 className={styles.upgradeTitle}>Verse Studio trial limit reached</h3>
            <p className={styles.upgradeBody}>
              You’ve created the maximum of 3 free Verse Studio tasks on this
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
                  // TODO: Hook into your real subscription route
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
