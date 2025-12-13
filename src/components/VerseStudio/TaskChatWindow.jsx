// src/components/VerseStudio/TaskChatWindow.jsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import styles from "./TaskChatWindow.module.css";

function PanelToggleIcon({ collapsed }) {
  // Simple “panel” icon (no arrows). Collapsed = narrow panel.
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" ry="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {collapsed ? (
        <>
          <line x1="17" y1="6" x2="17" y2="18" stroke="currentColor" strokeWidth="1.8" />
          <line x1="6.5" y1="9" x2="13.5" y2="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="6.5" y1="12" x2="13.5" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="6.5" y1="15" x2="13.5" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <line x1="14" y1="6" x2="14" y2="18" stroke="currentColor" strokeWidth="1.8" />
          <line x1="16.5" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="16.5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="16.5" y1="15" x2="19" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export default function TaskChatWindow({ task, verseStudio, onBack }) {
  const {
    team = [],
    messages = [],
    isSending = false,
    activeRole = null,
    handoffSuggestion,
    showHandoffPrompt,
    sendMessage,
    stopStream,
    confirmHandoff,
    cancelHandoff
  } = verseStudio || {};

  const [inputText, setInputText] = useState("");
  const [isArtifactsCollapsed, setIsArtifactsCollapsed] = useState(false);

  const textareaRef = useRef(null);

  const heroTitle = task?.name || "Verse Workspace Task";
  const heroSubtitle =
    task?.description ||
    "Describe your goal and let your Verse Workspace team collaborate.";
  const heroImageUrl = task?.heroImageUrl || null;

  const layoutClassName = isArtifactsCollapsed
    ? `${styles.layout} ${styles.layoutArtifactsCollapsed}`
    : styles.layout;

  const handleAutoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    // Reset then grow
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 140); // cap growth
    el.style.height = `${Math.max(next, 48)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || !sendMessage) return;
    sendMessage(trimmed);
    setInputText("");

    // reset textarea height after send
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) el.style.height = "48px";
    });
  }, [inputText, sendMessage]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleStopStreaming = () => {
    if (stopStream) stopStream();
  };

  const hasMessages = useMemo(() => Array.isArray(messages) && messages.length > 0, [messages]);

  return (
    <div className={styles.taskWindow}>
      <div className={layoutClassName}>
        {/* LEFT: WORKSPACE DETAILS / PARTICIPANTS */}
        <aside className={styles.navSection}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              <span className={styles.userInitial}>
                {heroTitle ? heroTitle.charAt(0).toUpperCase() : "V"}
              </span>
            </div>
            <div className={styles.userMeta}>
              <div className={styles.userName}>Verse Studio</div>
              <div className={styles.userTier}>Task workspace</div>
            </div>
          </div>

          <div className={styles.navBlock}>
            <div className={styles.navTitle}>Task overview</div>
            <div className={styles.navTaskName}>{heroTitle}</div>
            {heroSubtitle && <div className={styles.navTaskTemplate}>{heroSubtitle}</div>}
          </div>

          <div className={styles.navBlock}>
            <div className={styles.navTitle}>Team roles</div>
            <div className={styles.navTeamList}>
              {team.length === 0 && (
                <div className={styles.navEmpty}>
                  Team will appear here once the task starts.
                </div>
              )}

              {team.map((role) => (
                <div
                  key={role.role_id || role.id}
                  className={
                    activeRole === role.role_id
                      ? `${styles.navRoleItem} ${styles.navRoleItemActive}`
                      : styles.navRoleItem
                  }
                >
                  <div className={styles.navRoleIcon}>{role.role_icon || "⚙️"}</div>
                  <div className={styles.navRoleText}>
                    <div className={styles.navRoleName}>{role.role_name || role.name}</div>
                    {role.llm_name && <div className={styles.navRoleLlm}>{role.llm_name}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="button" className={styles.backButton} onClick={onBack}>
            ← Back to Verse Workspace
          </button>
        </aside>

        {/* CENTER: CHAT */}
        <section className={styles.chatSection}>
          {/* THIN HEADER (name + description only) */}
          <div className={styles.chatHeader}>
            {heroImageUrl && (
              <div className={styles.heroImageBackdrop} aria-hidden="true">
                <img src={heroImageUrl} alt="" />
                <div className={styles.heroImageOverlay} />
              </div>
            )}

            <div className={styles.headerContent}>
              <h1 className={styles.headerTitle}>{heroTitle}</h1>
              <p className={styles.headerSubtitle}>{heroSubtitle}</p>
            </div>
          </div>

          {/* MESSAGES (scrollable) */}
          <div className={styles.messagesContainer}>
            {!hasMessages && (
              <div className={styles.emptyState}>
                <div className={styles.emptyTitle}>Your Verse Workspace team is ready.</div>
                <p className={styles.emptyBody}>
                  Describe your goal, paste a brief, or drop in a snippet of code. Your roles will
                  collaborate in this space.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.user
                    ? `${styles.message} ${styles.messageUser}`
                    : `${styles.message} ${styles.messageAi}`
                }
              >
                <div className={styles.messageMeta}>
                  <span className={styles.messageRole}>
                    {message.user ? "You" : message.role_name || "Assistant"}
                  </span>
                </div>
                <div className={styles.messageBody}>{message.text}</div>
              </div>
            ))}
          </div>

          {/* HANDOFF PROMPT (stays above composer) */}
          {showHandoffPrompt && handoffSuggestion && (
            <div className={styles.handoffPrompt}>
              <div className={styles.handoffText}>
                💡{" "}
                {handoffSuggestion.message ||
                  `Switch to ${handoffSuggestion.to_role_name || "another role"} for the next step?`}
              </div>
              <div className={styles.handoffActions}>
                {confirmHandoff && (
                  <button type="button" className={styles.handoffPrimary} onClick={confirmHandoff}>
                    Continue
                  </button>
                )}
                {cancelHandoff && (
                  <button type="button" className={styles.handoffSecondary} onClick={cancelHandoff}>
                    Later
                  </button>
                )}
              </div>
            </div>
          )}

          {/* DEDICATED COMPOSER (bottom bar, not cropped) */}
          <div className={styles.composerBar}>
            <div className={styles.composerInner}>
              <textarea
                ref={textareaRef}
                className={styles.composerInput}
                placeholder="Type your next instruction… (Enter to send, Shift+Enter for new line)"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  handleAutoGrow();
                }}
                onInput={handleAutoGrow}
                onKeyDown={handleKeyDown}
                rows={1}
              />

              <div className={styles.composerActions}>
                {isSending && stopStream && (
                  <button
                    type="button"
                    className={`${styles.composerButton} ${styles.composerStop}`}
                    onClick={handleStopStreaming}
                    title="Stop"
                    aria-label="Stop"
                  >
                    ■
                  </button>
                )}

                <button
                  type="button"
                  className={styles.composerButton}
                  onClick={handleSend}
                  disabled={!inputText.trim() || !sendMessage}
                  title="Send"
                  aria-label="Send"
                >
                  ➤
                </button>
              </div>
            </div>

            <div className={styles.composerHint}>
              Tip: press <span className={styles.hintKey}>Shift</span>+<span className={styles.hintKey}>Enter</span> for a new line.
            </div>
          </div>
        </section>

        {/* RIGHT: ARTIFACTS (COLLAPSIBLE) */}
        <aside
          className={
            isArtifactsCollapsed
              ? `${styles.artifactsSection} ${styles.artifactsSectionCollapsed}`
              : styles.artifactsSection
          }
        >
          <div className={styles.artifactsHeader}>
            <div className={styles.artifactsHeaderRow}>
              {!isArtifactsCollapsed && (
                <div className={styles.artifactsTabs}>
                  <button type="button" className={`${styles.artifactsTab} ${styles.artifactsTabActive}`}>
                    Artifacts
                  </button>
                  <button type="button" className={styles.artifactsTab}>
                    Docs
                  </button>
                  <button type="button" className={styles.artifactsTab}>
                    Resources
                  </button>
                </div>
              )}

              <button
                type="button"
                className={styles.artifactsToggle}
                onClick={() => setIsArtifactsCollapsed((v) => !v)}
                aria-label={isArtifactsCollapsed ? "Expand artifacts panel" : "Collapse artifacts panel"}
                title={isArtifactsCollapsed ? "Expand panel" : "Collapse panel"}
              >
                <PanelToggleIcon collapsed={isArtifactsCollapsed} />
              </button>
            </div>
          </div>

          {isArtifactsCollapsed ? (
            <div className={styles.artifactsRail}>
              <div className={styles.artifactsRailLabel}>Artifacts</div>
            </div>
          ) : (
            <div className={styles.artifactsContent}>
              <div className={styles.artifactsEmpty}>
                <div className={styles.artifactsEmptyTitle}>Your task artifacts will appear here.</div>
                <p className={styles.artifactsEmptyBody}>
                  As your team generates code, summaries, and documents, we’ll collect them in this panel.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
