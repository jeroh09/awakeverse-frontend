// src/components/VerseStudio/TaskChatWindow.jsx
// ✅ UPDATED: Collapsible nav + properly gated chat messages + full-width cards

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import styles from "./TaskChatWindow.module.css";
import IntelligenceTab from "./IntelligenceTab";

const API_BASE = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = ["pdf", "docx", "txt", "md"];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CopyButton({ getText, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      const text = getText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      try {
        const text = getText();
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        console.error('Copy failed');
      }
    }
  };

  return (
    <button
      type="button"
      className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
      onClick={onCopy}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

function Toast({ message, type = 'artifact', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${styles[`toast${type}`]}`}>
      <span className={styles.toastIcon}>
        {type === 'artifact' && '📦'}
        {type === 'success' && '✓'}
        {type === 'error' && '✗'}
      </span>
      <span className={styles.toastMessage}>{message}</span>
      <button className={styles.toastClose} onClick={onClose}>×</button>
    </div>
  );
}

function PanelToggleIcon({ collapsed }) {
  return collapsed ? '→' : '←';
}

// ============================================================================
// MESSAGE CARD COMPONENTS
// ============================================================================

function UserMessageCard({ content }) {
  return (
    <div className={styles.userMessageCard}>
      <div className={styles.userMessageText}>{content}</div>
    </div>
  );
}

function ResponseCard({ 
  llm, 
  content, 
  codeBlocks = [], 
  isStreaming = false 
}) {
  const [expandedBlocks, setExpandedBlocks] = useState(new Set());
  const [copiedIndex, setCopiedIndex] = useState(null);

  const toggleExpanded = (index) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleCopyCode = async (index) => {
    const block = codeBlocks[index];
    if (!block) return;

    try {
      await navigator.clipboard.writeText(block.code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className={styles.responseCard}>
      {/* Header */}
      <div className={styles.responseCardHeader}>
        <span className={styles.llmIcon}>{llm.icon || '🤖'}</span>
        <div className={styles.llmInfo}>
          <div className={styles.llmRole}>{llm.role || 'Assistant'}</div>
          <div className={styles.llmModel}>{llm.model || 'AI Model'}</div>
        </div>
        {isStreaming && (
          <div className={styles.streamingIndicator}>Streaming... ▋</div>
        )}
      </div>

      {/* Content */}
      <div className={styles.responseCardContent}>
        {content && (
          <div className={styles.discussionText}>{content}</div>
        )}

        {/* Code Blocks */}
        {codeBlocks.map((block, idx) => {
          const isExpanded = expandedBlocks.has(idx);
          const isTruncated = block.lineCount > 50;

          return (
            <div key={idx} className={styles.codeBlockWrapper}>
              {block.filename && (
                <div className={styles.codeBlockLabel}>
                  {block.filename}
                </div>
              )}
              
              <div className={
                isTruncated && !isExpanded 
                  ? `${styles.codeBlock} ${styles.codeBlockTruncated}`
                  : `${styles.codeBlock} ${styles.codeBlockExpanded}`
              }>
                <pre><code className={`language-${block.language}`}>
                  {block.code}
                </code></pre>
              </div>

              {isTruncated && (
                <button
                  className={styles.showMoreButton}
                  onClick={() => toggleExpanded(idx)}
                >
                  {isExpanded 
                    ? `Show less` 
                    : `Show ${block.lineCount - 50} more lines`
                  }
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {codeBlocks.length > 0 && (
        <div className={styles.responseCardActions}>
          {codeBlocks.map((block, idx) => (
            <button
              key={idx}
              className={`${styles.copyCodeButton} ${copiedIndex === idx ? styles.copied : ''}`}
              onClick={() => handleCopyCode(idx)}
            >
              {copiedIndex === idx ? '✓ Copied' : '📋 Copy Code'}
              {block.filename && ` (${block.filename})`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TaskChatWindow({
  taskId,
  taskName = "Verse Workspace",
  taskTemplate,
  team = [],
  messages = [],
  artifacts = [],
  verseStudio = {},
  user,
  userTier = "Free",
  isSending = false,
  inputText = "",
  onInputChange,
  onSend,
  onBack,
  sendMessage,
  stopStream
}) {
  // ============================================================================
  // STATE
  // ============================================================================
  
  // Nav collapse state
  const [isNavCollapsed, setIsNavCollapsed] = useState(() => {
    const saved = localStorage.getItem('vibe-coding-nav-collapsed');
    return saved === 'true';
  });

  // Artifacts collapse state (already exists)
  const [isArtifactsCollapsed, setIsArtifactsCollapsed] = useState(false);

  // Artifacts tab state
  const [activeArtifactTab, setActiveArtifactTab] = useState('artifacts');
  const [showAllArtifacts, setShowAllArtifacts] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Attachments
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleNavCollapse = () => {
    setIsNavCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('vibe-coding-nav-collapsed', String(newState));
      return newState;
    });
  };

  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;
    if (!sendMessage) return;
    
    onSend?.();
  };

  const handleStopStreaming = () => {
    stopStream?.();
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleRefreshArtifacts = () => {
    // Trigger artifact refresh logic
    console.log('Refreshing artifacts...');
  };

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addToast = (message, type = 'artifact') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Watch for new artifacts
  useEffect(() => {
    if (artifacts.length > 0) {
      const latest = artifacts[artifacts.length - 1];
      if (latest?.filename) {
        addToast(`New artifact: ${latest.filename}`);
      }
    }
  }, [artifacts.length]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const layoutClassName = [
    styles.layout,
    isNavCollapsed && styles.layoutNavCollapsed,
    isArtifactsCollapsed && isNavCollapsed && styles.layoutBothCollapsed
  ].filter(Boolean).join(' ');

  const navClassName = [
    styles.navSection,
    isNavCollapsed && styles.navSectionCollapsed
  ].filter(Boolean).join(' ');

  const visibleArtifacts = showAllArtifacts 
    ? artifacts 
    : artifacts.filter(a => a.type === 'file' || a.size > 200);

  const artifactLabel = (a, idx) => {
    return a?.filename || a?.title || a?.name || `Artifact ${idx + 1}`;
  };

  const artifactDownloadUrl = (a) => {
    if (!a?.id) return null;
    return `${API_BASE}/api/verse-studio/artifact/${a.id}/download`;
  };

  // Helper to get role metadata
  const getRoleMetadata = (roleId) => {
    const roleMap = {
      'code_generation': { icon: '🎨', name: 'Frontend' },
      'code_review_debug': { icon: '🔧', name: 'Backend' },
      'documentation': { icon: '📝', name: 'Documentation' },
      'testing': { icon: '✅', name: 'Testing' }
    };
    return roleMap[roleId] || { icon: '🤖', name: roleId };
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={styles.taskWindow}>
      {/* Toast Container */}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <div className={layoutClassName}>
        {/* ===== LEFT NAV ===== */}
        <nav className={navClassName}>
          {/* Collapse Toggle */}
          <button
            type="button"
            className={styles.navCollapseToggle}
            onClick={toggleNavCollapse}
            aria-label={isNavCollapsed ? "Expand navigation" : "Collapse navigation"}
            title={isNavCollapsed ? "Expand" : "Collapse"}
          >
            {isNavCollapsed ? '→' : '←'}
          </button>

          {/* EXPANDED CONTENT */}
          <div className={styles.navExpandedContent}>
            {/* User Profile */}
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>
                <span className={styles.userInitial}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className={styles.userMeta}>
                <div className={styles.userName}>{user?.name || 'User'}</div>
                <div className={styles.userTier}>{userTier}</div>
              </div>
            </div>

            {/* Task Info */}
            <div className={styles.navBlock}>
              <div className={styles.navTitle}>Task</div>
              <div className={styles.navTaskName}>{taskName}</div>
              {taskTemplate && (
                <div className={styles.navTaskTemplate}>{taskTemplate}</div>
              )}
            </div>

            {/* Team Members */}
            <div className={styles.navBlock}>
              <div className={styles.navTitle}>Team</div>
              <div className={styles.navTeamList}>
                {team.length > 0 ? (
                  team.map((member, idx) => (
                    <div key={idx} className={styles.navRoleItem}>
                      <div className={styles.navRoleIcon}>{member.icon || '🤖'}</div>
                      <div className={styles.navRoleText}>
                        <div className={styles.navRoleName}>{member.role || 'Role'}</div>
                        <div className={styles.navRoleLlm}>{member.llm || 'AI'}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.navEmpty}>No team members</div>
                )}
              </div>
            </div>

            {/* Back Button */}
            <button
              type="button"
              className={styles.backButton}
              onClick={onBack}
            >
              ← Back to Tasks
            </button>
          </div>

          {/* COLLAPSED CONTENT */}
          <div className={styles.navCollapsedContent}>
            {/* Vertical Task Name */}
            <div className={styles.verticalTaskName}>
              {taskName}
            </div>

            {/* Vertical Back Button */}
            <button
              type="button"
              className={styles.verticalBackButton}
              onClick={onBack}
              aria-label="Back to tasks"
              title="Back to tasks"
            >
              ←
            </button>
          </div>
        </nav>

        {/* ===== CENTER CHAT ===== */}
        <section className={styles.chatSection}>
          {/* Messages Canvas */}
          <div className={styles.canvas}>
            {messages.length === 0 ? (
              <div className={styles.emptyCanvas}>
                <div className={styles.emptyIcon}>💬</div>
                <div className={styles.emptyTitle}>Start the conversation</div>
                <div className={styles.emptyText}>
                  Describe what you want to build, and your team will collaborate to help you.
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  if (msg.role === 'user') {
                    return <UserMessageCard key={idx} content={msg.content} />;
                  }

                  // LLM response - split by artifacts
                  const msgArtifacts = msg.artifacts || [];
                  const roleData = getRoleMetadata(msg.role_id);

                  if (msgArtifacts.length === 0) {
                    // No artifacts - single card
                    return (
                      <ResponseCard
                        key={idx}
                        llm={{
                          icon: roleData.icon,
                          role: roleData.name,
                          model: msg.llm_model || 'AI'
                        }}
                        content={msg.content}
                        codeBlocks={[]}
                        isStreaming={msg.isStreaming}
                      />
                    );
                  }

                  // Has artifacts - one card per file
                  return msgArtifacts.map((artifact, artIdx) => (
                    <ResponseCard
                      key={`${idx}-${artIdx}`}
                      llm={{
                        icon: roleData.icon,
                        role: roleData.name,
                        model: msg.llm_model || 'AI'
                      }}
                      content={artIdx === 0 ? msg.content : ''}
                      codeBlocks={[{
                        filename: artifact.filename,
                        language: artifact.language || 'text',
                        code: artifact.code || artifact.content || '',
                        lineCount: (artifact.code || artifact.content || '').split('\n').length
                      }]}
                      isStreaming={false}
                    />
                  ));
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Composer */}
          <div className={styles.composer}>
            <div className={styles.composerInner}>
              {/* Attachments */}
              {attachments.length > 0 && (
                <div className={styles.attachmentsList}>
                  {attachments.map((att, idx) => (
                    <div key={idx} className={styles.attachmentChip}>
                      {att.name}
                    </div>
                  ))}
                </div>
              )}

              {/* Input Row */}
              <div className={styles.composerRow}>
                <textarea
                  className={styles.composerTextarea}
                  value={inputText}
                  onChange={(e) => onInputChange?.(e.target.value)}
                  placeholder="Type your message..."
                  rows={1}
                  disabled={!taskId}
                />

                <div className={styles.composerActions}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    accept={ALLOWED_EXT.map(e => `.${e}`).join(',')}
                    onChange={() => {/* handle file */}}
                  />

                  <button
                    type="button"
                    className={styles.composerButton}
                    onClick={openFilePicker}
                    title="Attach document"
                    disabled={!taskId}
                  >
                    +
                  </button>

                  {isSending && stopStream && (
                    <button
                      type="button"
                      className={`${styles.composerButton} ${styles.composerStop}`}
                      onClick={handleStopStreaming}
                      title="Stop"
                    >
                      ■
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.composerButton}
                    onClick={handleSend}
                    disabled={
                      (!inputText.trim() && attachments.length === 0) ||
                      !sendMessage
                    }
                    title="Send"
                  >
                    ➤
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== RIGHT ARTIFACTS ===== */}
        <aside className={
          isArtifactsCollapsed
            ? `${styles.artifactsSection} ${styles.artifactsSectionCollapsed}`
            : styles.artifactsSection
        }>
          <div className={styles.artifactsHeader}>
            <div className={styles.artifactsHeaderRow}>
              {!isArtifactsCollapsed && (
                <div className={styles.artifactsTabs}>
                  <button 
                    type="button" 
                    className={`${styles.artifactsTab} ${activeArtifactTab === 'artifacts' ? styles.artifactsTabActive : ''}`}
                    onClick={() => setActiveArtifactTab('artifacts')}
                  >
                    Artifacts
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.artifactsTab} ${activeArtifactTab === 'intelligence' ? styles.artifactsTabActive : ''}`}
                    onClick={() => setActiveArtifactTab('intelligence')}
                  >
                    Intelligence
                  </button>
                </div>
              )}

              <button
                type="button"
                className={styles.artifactsToggle}
                onClick={() => setIsArtifactsCollapsed(v => !v)}
                aria-label={isArtifactsCollapsed ? "Expand" : "Collapse"}
              >
                <PanelToggleIcon collapsed={isArtifactsCollapsed} />
              </button>
            </div>

            {!isArtifactsCollapsed && activeArtifactTab === 'artifacts' && (
              <div className={styles.artifactsControls}>
                <label className={styles.artifactsToggleRow}>
                  <input
                    type="checkbox"
                    checked={showAllArtifacts}
                    onChange={(e) => setShowAllArtifacts(e.target.checked)}
                  />
                  <span>Show all</span>
                </label>
                <button type="button" className={styles.artifactsMiniButton} onClick={handleRefreshArtifacts}>
                  Refresh
                </button>
              </div>
            )}
          </div>

          {isArtifactsCollapsed ? (
            <div className={styles.artifactsRail}>
              <div className={styles.artifactsRailLabel}>📦</div>
            </div>
          ) : (
            <div className={styles.artifactsContent}>
              {activeArtifactTab === 'artifacts' && (
                <>
                  {visibleArtifacts.length === 0 ? (
                    <div className={styles.artifactsEmpty}>
                      <div className={styles.artifactsEmptyTitle}>No artifacts yet</div>
                      <p className={styles.artifactsEmptyBody}>
                        Generated files and artifacts will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className={styles.artifactsList}>
                      {visibleArtifacts.map((a, idx) => {
                        const id = a?.id || `${idx}`;
                        const label = artifactLabel(a, idx);
                        const content = String(a?.content || a?.code || '');
                        const expanded = expandedIds.has(id);
                        const dl = artifactDownloadUrl(a);

                        return (
                          <div key={id} className={styles.artifactCard}>
                            <div className={styles.artifactTop}>
                              <button
                                type="button"
                                className={styles.artifactTitle}
                                onClick={() => toggleExpanded(id)}
                              >
                                {label}
                              </button>
                              <div className={styles.artifactActions}>
                                <CopyButton getText={() => content} label="Copy" />
                                {dl && (
                                  <a className={styles.artifactDownload} href={dl} target="_blank" rel="noreferrer">
                                    Download
                                  </a>
                                )}
                              </div>
                            </div>
                            {expanded && (
                              <pre className={styles.artifactPreview}>
                                <code>{content}</code>
                              </pre>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {activeArtifactTab === 'intelligence' && (
                <IntelligenceTab
                  constitutionalDecisions={verseStudio?.constitutionalDecisions || []}
                  semanticStats={verseStudio?.semanticStats}
                  intelligenceStats={verseStudio?.intelligenceStats}
                  isLoading={verseStudio?.intelligenceStatsLoading}
                />
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}