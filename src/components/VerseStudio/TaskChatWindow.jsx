// src/components/VerseStudio/TaskChatWindow.jsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./TaskChatWindow.module.css";

function PanelToggleIcon({ collapsed }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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

function normalizeCodeText(children) {
  // react-markdown often passes code as array of strings/nodes
  const raw = Array.isArray(children) ? children.join("") : String(children ?? "");
  // remove trailing newline that markdown code blocks often include
  return raw.replace(/\n$/, "");
}

function CopyButton({ getText, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      const text = getText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // Fallback: best effort
      try {
        const text = getText();
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 900);
      } catch {
        // ignore
      }
    }
  };

  return (
    <button
      type="button"
      className={styles.copyCrumb}
      onClick={onCopy}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

function MarkdownMessage({ text }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      // Security: do NOT allow raw HTML from the model
      skipHtml={true}
      linkTarget="_blank"
      components={{
        // Better list spacing / indentation is CSS-driven
        p({ children }) {
          return <p className={styles.mdP}>{children}</p>;
        },
        ul({ children }) {
          return <ul className={styles.mdUl}>{children}</ul>;
        },
        ol({ children }) {
          return <ol className={styles.mdOl}>{children}</ol>;
        },
        li({ children }) {
          return <li className={styles.mdLi}>{children}</li>;
        },
        a({ href, children }) {
          return (
            <a className={styles.mdLink} href={href} rel="noopener noreferrer" target="_blank">
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return <blockquote className={styles.mdQuote}>{children}</blockquote>;
        },
        table({ children }) {
          return <div className={styles.mdTableWrap}><table className={styles.mdTable}>{children}</table></div>;
        },
        th({ children }) {
          return <th className={styles.mdTh}>{children}</th>;
        },
        td({ children }) {
          return <td className={styles.mdTd}>{children}</td>;
        },
        hr() {
          return <hr className={styles.mdHr} />;
        },
        code({ inline, className, children }) {
          const codeText = normalizeCodeText(children);
          const match = /language-(\w+)/.exec(className || "");
          const lang = match?.[1] || "";

          if (inline) {
            return <code className={styles.mdInlineCode}>{children}</code>;
          }

          return (
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <div className={styles.codeLang}>{lang || "code"}</div>
                <CopyButton getText={() => codeText} label="Copy" />
              </div>
              <pre className={styles.mdPre}>
                <code className={styles.mdCode}>{codeText}</code>
              </pre>
            </div>
          );
        }
      }}
    >
      {text || ""}
    </ReactMarkdown>
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
    task?.description || "Describe your goal and let your Verse Workspace team collaborate.";
  const heroImageUrl = task?.heroImageUrl || null;

  const layoutClassName = isArtifactsCollapsed
    ? `${styles.layout} ${styles.layoutArtifactsCollapsed}`
    : styles.layout;

  const hasMessages = useMemo(() => Array.isArray(messages) && messages.length > 0, [messages]);

  const handleAutoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 140);
    el.style.height = `${Math.max(next, 48)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || !sendMessage) return;

    sendMessage(trimmed);
    setInputText("");

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

  return (
    <div className={styles.taskWindow}>
      <div className={layoutClassName}>
        {/* LEFT */}
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
                <div className={styles.navEmpty}>Team will appear here once the task starts.</div>
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

        {/* CENTER */}
        <section className={styles.chatSection}>
          <header className={styles.chatHeader}>
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
          </header>

          <div className={styles.messagesScroll}>
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

                  {/* Optional: copy whole message (handy for long outputs) */}
                  {!message.user && (
                    <CopyButton
                      getText={() => String(message.text || "")}
                      label="Copy message"
                    />
                  )}
                </div>

                <div className={styles.messageBody}>
                  <MarkdownMessage text={message.text} />
                </div>
              </div>
            ))}

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
          </div>

          {/* Fade + overlay composer (as you approved) */}
          <div className={styles.composerFade} aria-hidden="true" />
          <div className={styles.composerOverlay} role="region" aria-label="Message composer">
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
          </div>
        </section>

        {/* RIGHT */}
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
