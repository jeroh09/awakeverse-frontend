// src/components/VerseStudio/VerseStudioTab.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import useVerseStudio from "../../hooks/useVerseStudio";
import { useUser } from "../../contexts/UserContext";
import SubscriptionService from "../../services/SubscriptionService";
import PaymentRouter from "../../services/PaymentRouter";

import TaskChatWindow from "./TaskChatWindow";
import TaskCreator from "./TaskCreator";
import VerseWorkspaceTemplateCard from "./VerseWorkspaceTemplateCard";
import styles from "./VerseStudioTab.module.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";

const TEMPLATE_HEADER_IMAGES = {
  coding_team: "/images/verse-workspace/templates/coding_team.jpeg",
  creative_team: "/images/verse-workspace/templates/creative_team.jpeg",
  research_team: "/images/verse-workspace/templates/research_team.jpeg",
  business_team: "/images/verse-workspace/templates/business_team.jpeg",
  writing_team: "/images/verse-workspace/templates/writing_team.jpeg",
  strategy_team: "/images/verse-workspace/templates/strategy_team.jpeg",
  education_team: "/images/verse-workspace/templates/education_team.jpeg",
};

function withHeroImage(task) {
  if (!task) return task;
  const templateId = task.template_id || task.templateId || task.template_key;
  const heroImageUrl = templateId ? TEMPLATE_HEADER_IMAGES[templateId] || null : null;
  return { ...task, heroImageUrl };
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10.7v6.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
    </svg>
  );
}

export default function VerseStudioTab() {
  const { user } = useUser();
  const verseStudio = useVerseStudio();

  const [templates, setTemplates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tokensState, setTokensState] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [resumingTaskId, setResumingTaskId] = useState(null);

  // Creator
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [creatorTemplate, setCreatorTemplate] = useState(null);
  const [creatorError, setCreatorError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Upgrade
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeError, setUpgradeError] = useState(null);

  // ✅ Provider chooser (breadcrumb pill) — Stripe default
  const [selectedProvider, setSelectedProvider] = useState("stripe"); // "stripe" | "paypal"

  // Info
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Subscription: only Unlimited can create beyond trial
  const [subscriptionTier, setSubscriptionTier] = useState(null);
  const isUnlimited = subscriptionTier === "unlimited";

  // Close info modal on Escape
  useEffect(() => {
    if (!isInfoOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsInfoOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isInfoOpen]);

  // -----------------------------------------------------------------------
  // INITIAL LOAD: tasks + templates + tokens
  // -----------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [tasksRes, templatesRes, tokensRes] = await Promise.all([
          fetch(`${API_BASE}/api/verse-studio/tasks`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
          fetch(`${API_BASE}/api/verse-studio/templates`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
          fetch(`${API_BASE}/api/verse-studio/tokens`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
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
        console.error("❌ Verse Workspace load error:", err);
        setError(err.message || "Failed to load Verse Workspace");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // -----------------------------------------------------------------------
  // SUBSCRIPTION LOAD (create gating only)
  // -----------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadSubscription() {
      if (!user?.id) return;
      try {
        const res = await SubscriptionService.getUserSubscriptionStatus(user.id);
        const tier = res?.subscription?.tier || "free";
        if (isMounted) setSubscriptionTier(tier);
      } catch {
        if (isMounted) setSubscriptionTier("free");
      }
    }

    loadSubscription();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // -----------------------------------------------------------------------
  // TRIAL LIMIT
  // -----------------------------------------------------------------------
  const trialInfo = useMemo(() => {
    const used = tokensState?.trial_tasks_used ?? 0;
    const total = 3;
    const remaining = tokensState?.trial_tasks_remaining ?? Math.max(total - used, 0);
    return { used, remaining, total };
  }, [tokensState]);

  const trialLimitReached = trialInfo.used >= 3 || trialInfo.remaining <= 0;

  // ✅ rule: create is allowed if unlimited OR still in trial allowance
  const canCreateNewTask = isUnlimited || !trialLimitReached;

  // -----------------------------------------------------------------------
  // OPEN CREATOR (gated)
  // -----------------------------------------------------------------------
  const openCreator = useCallback(
    async (template) => {
      setUpgradeError(null);

      if (!canCreateNewTask) {
        setIsUpgradeModalOpen(true);
        return;
      }

      setCreatorError(null);
      setCreatorTemplate(template || null);
      setIsCreatorOpen(true);

      try {
        await verseStudio.refreshLLMOptions?.();
      } catch {
        // no-op
      }
    },
    [canCreateNewTask, verseStudio]
  );

  const closeCreator = useCallback(() => {
    if (isCreating) return;
    setIsCreatorOpen(false);
    setCreatorTemplate(null);
    setCreatorError(null);
  }, [isCreating]);

  // -----------------------------------------------------------------------
  // UPGRADE (Stripe/PayPal via breadcrumb pill)
  // -----------------------------------------------------------------------
  const handleUpgrade = useCallback(async () => {
    setUpgradeError(null);

    const result = await PaymentRouter.redirectToCheckout({
      tier: "unlimited",
      provider: selectedProvider, // "stripe" | "paypal"
      triggerSource: "verse_studio_create_task",
    });

    if (result && result.success === false) {
      setUpgradeError(result.error?.userMessage || "Upgrade failed. Please try again.");
    }
  }, [selectedProvider]);

  // -----------------------------------------------------------------------
  // CREATE TASK (gated)
  // -----------------------------------------------------------------------
  const handleCreateFromCreator = useCallback(
    async (payload) => {
      setUpgradeError(null);

      if (!canCreateNewTask) {
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
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setTasks((prev) => [newTask, ...prev]);

        setActiveTask(withHeroImage(newTask));
        setIsCreatorOpen(false);

        // Refresh token state (trial counters)
        try {
          const tokensRes = await fetch(`${API_BASE}/api/verse-studio/tokens`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          if (tokensRes.ok) {
            const tokensJson = await tokensRes.json();
            setTokensState(tokensJson);
          }
        } catch (innerErr) {
          console.warn("Could not refresh Verse Workspace token state:", innerErr);
        }
      } catch (err) {
        console.error("❌ Failed to create Verse Workspace task:", err);
        setCreatorError(err.message || "Failed to create task");
      } finally {
        setIsCreating(false);
      }
    },
    [canCreateNewTask, verseStudio]
  );

  // -----------------------------------------------------------------------
  // RESUME TASK (never gated)
  // -----------------------------------------------------------------------
  const handleResumeTask = useCallback(
    async (task) => {
      const id = task?.id || task?.task_id;
      if (!id) return;

      try {
        setResumingTaskId(id);
        setError(null);

        await verseStudio.loadTask(id);
        setActiveTask(withHeroImage(task));
      } catch (err) {
        console.error("❌ Resume failed:", err);
        setError(err.message || "Failed to resume task");
      } finally {
        setResumingTaskId(null);
      }
    },
    [verseStudio]
  );

  const handleBackFromChat = useCallback(() => {
    setActiveTask(null);
    verseStudio.resetTask?.();
  }, [verseStudio]);

  // -----------------------------------------------------------------------
  // FULLSCREEN CHAT
  // -----------------------------------------------------------------------
  if (activeTask) {
    return <TaskChatWindow task={activeTask} verseStudio={verseStudio} onBack={handleBackFromChat} />;
  }

  // -----------------------------------------------------------------------
  // MAIN TAB UI
  // -----------------------------------------------------------------------
  return (
    <div className={styles.verseStudioTab}>
      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.eyebrow}>Verse Workspace</div>

          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Verse Workspace</h1>
            <span className={styles.titlePill}>Trial · 3 free tasks</span>

            <button
              type="button"
              className={styles.infoButton}
              onClick={() => setIsInfoOpen(true)}
              aria-label="Verse Workspace info"
              title="How to use Verse Workspace"
            >
              <InfoIcon />
              <span className={styles.infoLabel}>Info</span>
            </button>
          </div>

          <p className={styles.subtitle}>
            Orchestrate a small team of specialist LLMs to plan, code, review, and document your projects — all in one
            AwakeVerse workspace.
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
              <p className={styles.emptyBody}>Once templates are configured on the backend, they will appear here.</p>
            </div>
          ) : (
            <div className={styles.templatesGrid}>
              {templates.map((template) => {
                const templateId = template.template_id || template.id || template.slug;
                const imageUrl = templateId ? TEMPLATE_HEADER_IMAGES[templateId] || null : null;

                return (
                  <VerseWorkspaceTemplateCard
                    key={templateId}
                    template={template}
                    imageUrl={imageUrl}
                    locked={!canCreateNewTask}
                    onUse={openCreator}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Tasks */}
        <section className={styles.tasksColumn}>
          <div className={styles.columnHeader}>
            <div>
              <h2 className={styles.columnTitle}>My workspaces</h2>
              <p className={styles.columnSubtitle}>Resume an active workspace or start a new one from a template.</p>
            </div>

            <button
              type="button"
              className={styles.createWorkspaceButton}
              onClick={() => openCreator(null)}
              disabled={loading || isCreating}
              title="Create a new workspace"
            >
              <span className={styles.createWorkspaceIcon}>＋</span>
              <span className={styles.createWorkspaceText}>
                Create workspace
                <span className={styles.createWorkspaceHint}>Start from scratch</span>
              </span>
            </button>
          </div>

          {loading && !tasks.length ? (
            <div className={styles.loadingBox}>
              <div className={styles.loadingSpinner} />
              <div className={styles.loadingText}>Loading your workspaces…</div>
            </div>
          ) : tasks.length === 0 ? (
            <div className={styles.emptyTasks}>
              <div className={styles.emptyTitle}>No workspaces yet.</div>
              <p className={styles.emptyBody}>Pick a template on the left to create your first Verse Workspace task.</p>

              <button
                type="button"
                className={styles.createWorkspaceButton}
                onClick={() => openCreator(null)}
                disabled={loading || isCreating}
              >
                <span className={styles.createWorkspaceIcon}>＋</span>
                <span className={styles.createWorkspaceText}>
                  Create workspace
                  <span className={styles.createWorkspaceHint}>Start from scratch</span>
                </span>
              </button>
            </div>
          ) : (
            <div className={styles.tasksList}>
              {tasks.map((t) => {
                const taskId = t.task_id || t.id;
                const title = t.name || "Untitled workspace";
                const desc = t.description || "";
                const team = t.team || t.llm_team || [];

                return (
                  <button
                    key={taskId}
                    type="button"
                    className={styles.taskCard}
                    aria-busy={resumingTaskId === taskId}
                    onClick={() => handleResumeTask(t)}
                    title="Open workspace"
                  >
                    <div className={styles.taskCardTop}>
                      <div className={styles.taskTitleRow}>
                        <div className={styles.taskTitle}>{title}</div>
                        <span className={styles.taskStatusPill}>{(t.status || "active").toUpperCase()}</span>
                      </div>

                      <div className={styles.taskMetaTime}>
                        Created {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                      </div>

                      {desc ? <div className={styles.taskDescription}>{desc}</div> : null}
                    </div>

                    <div className={styles.taskMetaRow}>
                      {team?.length ? (
                        <div className={styles.roleChips}>
                          {team.slice(0, 3).map((m, idx) => (
                            <span key={`${taskId}_${m.role_id || idx}`} className={styles.roleChip}>
                              {m.role_icon || "🤖"} {m.role_name || m.role_id || "Role"}
                            </span>
                          ))}
                          {team.length > 3 ? <span className={styles.roleChipMuted}>+{team.length - 3} more</span> : null}
                        </div>
                      ) : (
                        <div className={styles.roleChips}>
                          <span className={styles.roleChipMuted}>Team loads on open</span>
                        </div>
                      )}

                      <span className={styles.taskCta}>{resumingTaskId === taskId ? "Opening…" : "Open →"}</span>
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

      {/* Upgrade modal */}
      {isUpgradeModalOpen && (
        <div className={styles.upgradeOverlay}>
          <div className={styles.upgradeModal}>
            <h3 className={styles.upgradeTitle}>Verse Workspace trial limit reached</h3>
            <p className={styles.upgradeBody}>
              You've created the maximum of 3 free Verse Workspace tasks on this account. Upgrade to Unlimited to keep
              creating tasks and unlock higher limits.
            </p>

            {upgradeError && <div className={styles.upgradeError}>{upgradeError}</div>}

            <div className={styles.upgradeActionsTernary}>
              <button type="button" className={styles.upgradePrimary} onClick={handleUpgrade} title="Upgrade">
                Upgrade
              </button>

              {/* ✅ Breadcrumb pill: Stripe | PayPal */}
              <div className={styles.providerPill} role="radiogroup" aria-label="Payment provider">
                <button
                  type="button"
                  className={
                    selectedProvider === "stripe"
                      ? `${styles.providerOption} ${styles.providerOptionActive}`
                      : styles.providerOption
                  }
                  onClick={() => setSelectedProvider("stripe")}
                  role="radio"
                  aria-checked={selectedProvider === "stripe"}
                  title="Pay with Stripe"
                >
                  Stripe
                </button>

                <span className={styles.providerDivider} aria-hidden="true">
                  |
                </span>

                <button
                  type="button"
                  className={
                    selectedProvider === "paypal"
                      ? `${styles.providerOption} ${styles.providerOptionActive}`
                      : styles.providerOption
                  }
                  onClick={() => setSelectedProvider("paypal")}
                  role="radio"
                  aria-checked={selectedProvider === "paypal"}
                  title="Pay with PayPal"
                >
                  PayPal
                </button>
              </div>

              <button
                type="button"
                className={styles.upgradeSecondary}
                onClick={() => {
                  setUpgradeError(null);
                  setIsUpgradeModalOpen(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info modal (unchanged) */}
      {isInfoOpen && (
        <div
          className={styles.infoOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Verse Workspace info"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsInfoOpen(false);
          }}
        >
          <div className={styles.infoModal}>
            <div className={styles.infoHeader}>
              <div>
                <div className={styles.infoTitle}>How to use Verse Workspace</div>
                <div className={styles.infoSubtitle}>
                  A quick guide to templates, roles, artifacts, tokens, and documents.
                </div>
              </div>

              <button
                type="button"
                className={styles.infoClose}
                onClick={() => setIsInfoOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className={styles.infoBody}>
              {/* keep your existing sections as-is */}
              <div className={styles.infoSection}>
                <div className={styles.infoSectionTitle}>1) Start a workspace</div>
                <ul className={styles.infoList}>
                  <li>
                    Choose a <strong>template</strong> (Coding / Research / Business…) to load a role team, or create a
                    workspace from scratch.
                  </li>
                  <li>
                    A workspace is a <strong>task</strong> with a <strong>task_id</strong> and a team of specialist roles.
                  </li>
                </ul>
              </div>

              <div className={styles.infoSection}>
                <div className={styles.infoSectionTitle}>2) Chat like a workspace</div>
                <ul className={styles.infoList}>
                  <li>
                    Write your goal clearly, paste code, or describe what you want built. The team collaborates inside
                    one thread.
                  </li>
                  <li>
                    Responses support <strong>Markdown</strong> (lists, tables, code blocks). Code blocks include a{" "}
                    <strong>Copy</strong> button.
                  </li>
                </ul>
              </div>

              <div className={styles.infoSection}>
                <div className={styles.infoSectionTitle}>3) Artifacts panel</div>
                <ul className={styles.infoList}>
                  <li>
                    The system can collect outputs (like code blocks) as <strong>Artifacts</strong> so you can copy or
                    download them later.
                  </li>
                  <li>
                    <strong>Tokens</strong> measure usage/limits; <strong>Artifacts</strong> are saved content blocks.
                  </li>
                </ul>
              </div>

              <div className={styles.infoSection}>
                <div className={styles.infoSectionTitle}>4) Trial limits</div>
                <ul className={styles.infoList}>
                  <li>
                    Trial accounts can create up to <strong>3 tasks</strong>. After that, you’ll see an upgrade prompt.
                  </li>
                  <li>Existing tasks remain accessible even after you hit the create limit.</li>
                </ul>
              </div>

              <div className={styles.infoCallout}>
                Tip: Ask for a plan → implementation → review. Use the artifacts panel to collect final outputs.
              </div>
            </div>

            <div className={styles.infoFooter}>
              <button type="button" className={styles.infoPrimary} onClick={() => setIsInfoOpen(false)}>
                Got it
              </button>
              <button
                type="button"
                className={styles.infoSecondary}
                onClick={() => window.open("/pricing", "_blank", "noopener,noreferrer")}
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
