// src/components/VerseStudio/TaskChatWindow.jsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./TaskChatWindow.module.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://api.awakeverse.com";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXT = ["pdf", "docx", "txt", "md"];

function normalizeCodeText(children) {
  const raw = Array.isArray(children) ? children.join("") : String(children ?? "");
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
      skipHtml={true}
      linkTarget="_blank"
      components={{
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
          return (
            <div className={styles.mdTableWrap}>
              <table className={styles.mdTable}>{children}</table>
            </div>
          );
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

          if (inline) return <code className={styles.mdInlineCode}>{children}</code>;

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
        },
      }}
    >
      {text || ""}
    </ReactMarkdown>
  );
}

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

/**
 * File-worthy heuristic for default view (display-only; backend remains source of truth)
 */
function isFileWorthyArtifact(a) {
  const type = String(a?.type || a?.artifact_type || "").toLowerCase();
  const content = String(a?.content || a?.text || a?.body || "");
  const lang = String(a?.language || a?.lang || "").toLowerCase();
  const title = String(a?.title || a?.name || "");

  const looksLikeFilename =
    /(^|\/)([\w.-]+\.(js|jsx|ts|tsx|py|html|css|md|json|yml|yaml|txt|sql|go|java|rs|php|sh|toml))$/i.test(title) ||
    /(^|\n)\s*\/\/\s*file:\s*[\w./-]+\.\w+/i.test(content) ||
    /(^|\n)\s*#\s*file:\s*[\w./-]+\.\w+/i.test(content);

  const lineCount = content ? content.split("\n").length : 0;
  const substantial = content.length >= 500 || lineCount >= 18;

  const fileLikeType = ["code", "file", "document", "doc", "plan", "artifact"].includes(type);
  const langHint = Boolean(lang) && lang !== "text";

  return looksLikeFilename || (substantial && (fileLikeType || langHint));
}

export default function TaskChatWindow({ task, verseStudio, onBack }) {
  const {
    taskId,
    team = [],
    messages = [],
    artifacts = [],
    isSending = false,
    activeRole = null,
    handoffSuggestion,
    showHandoffPrompt,
    sendMessage,
    stopStream,
    confirmHandoff,
    cancelHandoff,
    refreshArtifacts,
  } = verseStudio || {};

  const [inputText, setInputText] = useState("");
  const [isArtifactsCollapsed, setIsArtifactsCollapsed] = useState(false);
  const [showAllArtifacts, setShowAllArtifacts] = useState(false);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  // ✅ NEW: attachments persist in the composer until Send
  const [attachments, setAttachments] = useState([]); // { localId, name, size, status, documentId, error }

  // ✅ NEW: upload state (legacy/global chip; preserved)
  const [uploadState, setUploadState] = useState({
    status: "idle", // idle | uploading | success | error
    filename: "",
    message: "",
  });

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const heroTitle = task?.name || "Verse Workspace Task";
  const heroSubtitle = task?.description || "Describe your goal and let your Verse Workspace team collaborate.";
  const heroImageUrl = task?.heroImageUrl || null;

  const layoutClassName = isArtifactsCollapsed
    ? `${styles.layout} ${styles.layoutArtifactsCollapsed}`
    : styles.layout;

  const hasMessages = useMemo(() => Array.isArray(messages) && messages.length > 0, [messages]);

  const visibleArtifacts = useMemo(() => {
    const list = Array.isArray(artifacts) ? artifacts : [];
    if (showAllArtifacts) return list;
    return list.filter(isFileWorthyArtifact);
  }, [artifacts, showAllArtifacts]);

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const artifactLabel = (a, idx) => {
    const title = a?.title || a?.name;
    if (title) return String(title);

    const type = String(a?.type || a?.artifact_type || "Artifact");
    const lang = a?.language || a?.lang;
    const n = idx + 1;
    return lang ? `${type} · ${lang} · #${n}` : `${type} · #${n}`;
  };

  const artifactDownloadUrl = (a) => {
    const id = a?.id || a?.artifact_id;
    if (!taskId || !id) return null;
    return `${API_BASE}/api/verse-studio/task/${taskId}/artifact/${id}`;
  };

  const handleAutoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 140);
    el.style.height = `${Math.max(next, 48)}px`;
  }, []);

  // ✅ UPDATED: keep attachments until send, then clear
  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();

    // block sending if no text AND no attachments
    if ((!trimmed && attachments.length === 0) || !sendMessage) return;

    // block sending while any uploads are still in progress
    const stillUploading = attachments.some((a) => a.status === "uploading");
    if (stillUploading) return;

    const readyDocs = attachments.filter((a) => a.status === "ready");
    const erroredDocs = attachments.filter((a) => a.status === "error");

    let composed = trimmed;

    if (readyDocs.length) {
      const lines = readyDocs.map((d) => (d.documentId ? `- ${d.name} (id: ${d.documentId})` : `- ${d.name}`));
      composed = `${composed || "Please use the attached documents."}\n\nAttached documents:\n${lines.join("\n")}`;
    }

    if (erroredDocs.length) {
      const lines = erroredDocs.map((d) => `- ${d.name}: ${d.error || "upload failed"}`);
      composed = `${composed || ""}\n\nUpload errors:\n${lines.join("\n")}`.trim();
    }

    sendMessage(composed);
    setInputText("");
    setAttachments([]); // ✅ clear only after user sends

    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) el.style.height = "48px";
    });
  }, [inputText, attachments, sendMessage]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleStopStreaming = () => {
    if (stopStream) stopStream();
  };

  const handleRefreshArtifacts = async () => {
    if (!refreshArtifacts || !taskId) return;
    await refreshArtifacts(taskId);
  };

  // ✅ NEW: uploader (kept + extended) — attachments persist until Send
  const openFilePicker = () => fileInputRef.current?.click();

  const validateFile = (file) => {
    if (!file) return "No file selected.";
    if (file.size > MAX_UPLOAD_BYTES) return "File too large. Max 5MB.";
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return `Unsupported file type. Allowed: ${ALLOWED_EXT.join(", ")}.`;
    return null;
  };

  const uploadDocument = async (file) => {
    if (!taskId) {
      // keep legacy chip for global error messaging
      setUploadState({ status: "error", filename: "", message: "Open a workspace before uploading." });
      return;
    }

    const validationError = validateFile(file);
    const localId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    // Persist chip immediately (even if validation fails)
    setAttachments((prev) => [
      ...prev,
      {
        localId,
        name: file?.name || "document",
        size: file?.size || 0,
        status: validationError ? "error" : "uploading", // uploading | ready | error
        documentId: null,
        error: validationError || null,
      },
    ]);

    if (validationError) {
      return;
    }

    try {
      const csrf = document.cookie.match(/(?:^|;\s*)av_csrf=([^;]+)/)?.[1] || "";
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API_BASE}/api/verse-studio/task/${taskId}/document`, {
        method: "POST",
        credentials: "include",
        headers: csrf ? { "X-CSRF-Token": csrf } : undefined,
        body: form,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      const docId = data.document_id || data.id || data.doc_id || null;

      setAttachments((prev) =>
        prev.map((a) => (a.localId === localId ? { ...a, status: "ready", documentId: docId, error: null } : a))
      );

      // keep existing behavior: refresh artifacts after successful upload
      if (refreshArtifacts) await refreshArtifacts(taskId);
    } catch (e) {
      setAttachments((prev) =>
        prev.map((a) => (a.localId === localId ? { ...a, status: "error", error: e.message || "Upload failed" } : a))
      );
    } finally {
      // allow re-selecting same file later
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadDocument(file);
  };

  const removeAttachment = (localId) => {
    setAttachments((prev) => prev.filter((a) => a.localId !== localId));
  };

  return (
    <div className={styles.taskWindow}>
      <div className={layoutClassName}>
        {/* LEFT */}
        <aside className={styles.navSection}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              <span className={styles.userInitial}>{heroTitle ? heroTitle.charAt(0).toUpperCase() : "V"}</span>
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
              {team.length === 0 && <div className={styles.navEmpty}>Team will appear here once the task starts.</div>}
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
          {/* ✅ NEW: Mobile back bar */}
          <div className={styles.mobileBackBar}>
            <button type="button" className={styles.mobileBackButton} onClick={onBack} aria-label="Back">
              ← Back
            </button>
            <div className={styles.mobileBackTitle}>Workspace</div>
          </div>

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
                  Describe your goal, paste a brief, or upload a document. Your roles will collaborate in this space.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={message.user ? `${styles.message} ${styles.messageUser}` : `${styles.message} ${styles.messageAi}`}
              >
                <div className={styles.messageMeta}>
                  <span className={styles.messageRole}>{message.user ? "You" : message.role_name || "Assistant"}</span>
                  {!message.user && <CopyButton getText={() => String(message.text || "")} label="Copy message" />}
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

          {/* Composer */}
          <div className={styles.composerFade} aria-hidden="true" />
          <div className={styles.composerOverlay} role="region" aria-label="Message composer">
            {/* ✅ Legacy upload chip preserved (now used mainly for global errors like missing taskId) */}
            {uploadState.status !== "idle" && (
              <div
                className={
                  uploadState.status === "uploading"
                    ? `${styles.uploadChip} ${styles.uploadChipUploading}`
                    : uploadState.status === "success"
                    ? `${styles.uploadChip} ${styles.uploadChipSuccess}`
                    : `${styles.uploadChip} ${styles.uploadChipError}`
                }
              >
                <div className={styles.uploadChipTitle}>
                  {uploadState.filename ? `📎 ${uploadState.filename}` : "Upload"}
                </div>
                <div className={styles.uploadChipMsg}>{uploadState.message}</div>
                {uploadState.status === "error" && (
                  <button
                    type="button"
                    className={styles.uploadChipDismiss}
                    onClick={() => setUploadState({ status: "idle", filename: "", message: "" })}
                    aria-label="Dismiss upload error"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            <div className={styles.composerInner}>
              {/* Hidden file input (attachments persist until Send) */}
              <input
                ref={fileInputRef}
                type="file"
                className={styles.hiddenFileInput}
                onChange={onFileSelected}
                accept=".pdf,.docx,.txt,.md"
              />

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

              {/* Attachments chips */}
              {attachments.length > 0 && (
                <div
                  className={styles.attachmentsRow}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    margin: "10px 0 0",
                  }}
                >
                  {attachments.map((a) => (
                    <div
                      key={a.localId}
                      className={styles.attachmentChip}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 10px",
                        borderRadius: "999px",
                        border: "1px solid rgba(207,174,92,.35)",
                        background: "rgba(12,20,38,.72)",
                        color: "#F2E8D5",
                        maxWidth: "100%",
                      }}
                    >
                      <span
                        className={styles.attachmentName}
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "360px",
                        }}
                        title={a.name}
                      >
                        {a.name}
                      </span>

                      <span
                        className={
                          a.status === "uploading"
                            ? styles.attachmentStatusUploading
                            : a.status === "ready"
                            ? styles.attachmentStatusReady
                            : styles.attachmentStatusError
                        }
                        style={{
                          fontSize: "12px",
                          opacity: 0.9,
                        }}
                      >
                        {a.status === "uploading" ? "Uploading…" : a.status === "ready" ? "Ready" : "Error"}
                      </span>

                      <button
                        type="button"
                        className={styles.attachmentRemove}
                        onClick={() => removeAttachment(a.localId)}
                        aria-label={`Remove ${a.name}`}
                        title="Remove"
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "rgba(207,174,92,.85)",
                          cursor: "pointer",
                          fontSize: "16px",
                          lineHeight: 1,
                          padding: "0 2px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.composerActions}>
                {/* + Attach button (no pin icon) */}
                <button
                  type="button"
                  className={styles.composerPlus || styles.composerButton}
                  onClick={openFilePicker}
                  title="Attach document"
                  aria-label="Attach document"
                  disabled={!taskId}
                  style={!styles.composerPlus ? { fontSize: "20px", lineHeight: 1 } : undefined}
                >
                  +
                </button>

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
                  disabled={
                    (!inputText.trim() && attachments.length === 0) ||
                    attachments.some((a) => a.status === "uploading") ||
                    !sendMessage
                  }
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

            {!isArtifactsCollapsed && (
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
              <div className={styles.artifactsRailLabel}>Artifacts</div>
            </div>
          ) : (
            <div className={styles.artifactsContent}>
              {visibleArtifacts.length === 0 ? (
                <div className={styles.artifactsEmpty}>
                  <div className={styles.artifactsEmptyTitle}>No file-worthy artifacts yet.</div>
                  <p className={styles.artifactsEmptyBody}>
                    When the team produces larger “page” outputs (files, plans, docs), they’ll appear here. Toggle
                    <strong> Show all</strong> to view everything.
                  </p>
                </div>
              ) : (
                <div className={styles.artifactsList}>
                  {visibleArtifacts.map((a, idx) => {
                    const id = a?.id || a?.artifact_id || `${idx}`;
                    const label = artifactLabel(a, idx);
                    const content = String(a?.content || a?.text || a?.body || "");
                    const expanded = expandedIds.has(id);
                    const dl = artifactDownloadUrl(a);

                    return (
                      <div key={id} className={styles.artifactCard}>
                        <div className={styles.artifactTop}>
                          <button
                            type="button"
                            className={styles.artifactTitle}
                            onClick={() => toggleExpanded(id)}
                            title={expanded ? "Collapse" : "Expand"}
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
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
