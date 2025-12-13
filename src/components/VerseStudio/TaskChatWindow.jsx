// src/components/VerseStudio/TaskChatWindow.jsx
import React, { useState, useMemo, useCallback } from 'react';
import styles from './TaskChatWindow.module.css';

/**
 * TaskChatWindow
 *
 * Full-page 3-column Verse Studio chat layout:
 * - Left: Workspace details / participants (scaffolding for later)
 * - Middle: Task chat (messages + input + handoff prompt)
 * - Right: Artifacts & documents (collapsible)
 *
 * Mobile: chat-only (side panels not rendered via CSS)
 */
export default function TaskChatWindow({
  task,
  verseStudio,
  onBack
}) {
  const {
    team = [],
    messages = [],
    isSending = false,
    activeRole = null,
    usageData,
    handoffSuggestion,
    showHandoffPrompt,
    sendMessage,
    stopStream,
    confirmHandoff,
    switchToRole,
    cancelHandoff
  } = verseStudio || {};

  const [inputText, setInputText] = useState('');
  const [isArtifactsCollapsed, setIsArtifactsCollapsed] = useState(false);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || !sendMessage) return;

    sendMessage(trimmed);
    setInputText('');
  }, [inputText, sendMessage]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleStopStreaming = () => {
    if (stopStream) stopStream();
  };

  const usageSummary = useMemo(() => {
    if (!usageData) return null;

    const { messagesUsed, messagesLimit, tokensUsed, tokensLimit } = usageData;

    return {
      messages: messagesLimit
        ? `${messagesUsed} / ${messagesLimit} messages`
        : `${messagesUsed} messages`,
      tokens: tokensLimit
        ? `${tokensUsed} / ${tokensLimit} tokens`
        : `${tokensUsed} tokens`
    };
  }, [usageData]);

  const heroTitle = task?.name || 'Verse Workspace Task';
  const heroSubtitle =
    task?.description ||
    'Describe your goal and let your Verse Workspace team collaborate.';
  const heroTemplateLabel = task?.templateName || 'Verse Studio Template';
  const heroImageUrl = task?.heroImageUrl || null;

  const layoutClassName = isArtifactsCollapsed
    ? `${styles.layout} ${styles.layoutArtifactsCollapsed}`
    : styles.layout;

  return (
    <div className={styles.taskWindow}>
      <div className={layoutClassName}>
        {/* ========== LEFT: WORKSPACE DETAILS / PARTICIPANTS ========== */}
        <aside className={styles.navSection}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              <span className={styles.userInitial}>
                {heroTitle ? heroTitle.charAt(0).toUpperCase() : 'V'}
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
            <div className={styles.navTaskTemplate}>Template: {heroTemplateLabel}</div>

            {usageSummary && (
              <div className={styles.navUsage}>
                <div className={styles.navUsageRow}>
                  <span>Messages</span>
                  <span>{usageSummary.messages}</span>
                </div>
                <div className={styles.navUsageRow}>
                  <span>Tokens</span>
                  <span>{usageSummary.tokens}</span>
                </div>
              </div>
            )}
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
                  <div className={styles.navRoleIcon}>{role.role_icon || '⚙️'}</div>
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

        {/* ========== CENTER: CHAT ========== */}
        <section className={styles.chatSection}>
          {team.length > 0 && (
            <div className={styles.floatingAvatars}>
              {team.map((role) => (
                <div
                  key={role.role_id || role.id}
                  className={
                    activeRole === role.role_id
                      ? `${styles.floatingAvatar} ${styles.floatingAvatarActive}`
                      : styles.floatingAvatar
                  }
                >
                  <div className={styles.floatingAvatarInner}>
                    <span className={styles.floatingAvatarEmoji}>{role.role_icon || '✨'}</span>
                  </div>
                  {activeRole === role.role_id && <div className={styles.speakingDot} />}
                </div>
              ))}
            </div>
          )}

          <div className={styles.chatHeader}>
            {heroImageUrl && (
              <div className={styles.heroImageBackdrop}>
                <img src={heroImageUrl} alt={heroTitle} />
                <div className={styles.heroImageOverlay} />
              </div>
            )}

            <div className={styles.headerContent}>
              <div className={styles.headerBadgeRow}>
                <span className={styles.headerBadge}>Verse Workspace · Task</span>
                {heroTemplateLabel && (
                  <span className={styles.headerBadgeSecondary}>{heroTemplateLabel}</span>
                )}
              </div>

              <div className={styles.headerTitles}>
                <h1 className={styles.headerTitle}>{heroTitle}</h1>
                <p className={styles.headerSubtitle}>{heroSubtitle}</p>
              </div>

              {usageSummary && (
                <div className={styles.headerUsage}>
                  <span>{usageSummary.messages}</span>
                  <span className={styles.headerUsageDivider}>·</span>
                  <span>{usageSummary.tokens}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.messagesContainer}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyTitle}>Your Verse Workspace team is ready.</div>
                <p className={styles.emptyBody}>
                  Describe your goal, paste a brief, or drop in a snippet of code. Your selected roles
                  will collaborate in this space.
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
                    {message.user ? 'You' : message.role_name || 'Assistant'}
                  </span>
                </div>
                <div className={styles.messageBody}>{message.text}</div>
              </div>
            ))}
          </div>

          {showHandoffPrompt && handoffSuggestion && (
            <div className={styles.handoffPrompt}>
              <div className={styles.handoffText}>
                💡{' '}
                {handoffSuggestion.message ||
                  `Switch to ${handoffSuggestion.to_role_name || 'another role'} for the next step?`}
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

          <div className={styles.inputContainer}>
            <div className={styles.inputWrapper}>
              <textarea
                className={styles.input}
                placeholder="Type your next instruction… You can mention roles later with @Code Reviewer, @Docs, etc."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <div className={styles.inputControls}>
                {isSending && stopStream && (
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.iconButtonStop}`}
                    onClick={handleStopStreaming}
                  >
                    ■
                  </button>
                )}
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={handleSend}
                  disabled={!inputText.trim() || !sendMessage}
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========== RIGHT: ARTIFACTS (COLLAPSIBLE) ========== */}
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
                aria-label={isArtifactsCollapsed ? 'Expand artifacts panel' : 'Collapse artifacts panel'}
                title={isArtifactsCollapsed ? 'Expand panel' : 'Collapse panel'}
              >
                {isArtifactsCollapsed ? '⟨' : '⟩'}
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
                  As your Verse Workspace team generates code, summaries, and documents, we’ll collect
                  them in this panel so you can revisit and reuse them.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
