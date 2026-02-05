// src/components/VerseStudio/TaskChatWindow.jsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import styles from "./TaskChatWindow.module.css";
import IntelligenceTab from "./IntelligenceTab"; // NEW

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

// --- helpers ---
function slugify(raw) {
  return String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/[`~!@#$%^&*()+={}\[\]|\\:;"'<>,.?/]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * MarkdownMessage
 * - variant="chat": fast, compact, bubble-safe markdown
 * - variant="doc": richer docs markdown (TOC + math + anchors + callouts)
 *
 * IMPORTANT: This wraps content in mdChatContainer / mdDocContainer so your
 * CSS modules can enforce fonts, sizes, and wrapping reliably.
 */
export function MarkdownMessage({ text, variant = "chat", onToc }) {
  const isDoc = variant === "doc";

  const normalized = useMemo(() => {
    if (!text) return "";
    let s = String(text);

    if (isDoc) {
      s = s
        .replace(/\n(#{1,6}\s)/g, "\n\n$1")
        .replace(/(#{1,6} .+)\n(?!\n)/g, "$1\n\n")
        .replace(/\n\n{3,}/g, "\n\n");
    }

    return s;
  }, [text, isDoc]);

  const toc = useMemo(() => {
    if (!isDoc) return [];
    const lines = normalized.split("\n");
    const counts = new Map();
    const out = [];

    for (const line of lines) {
      const m = line.match(/^(#{1,6})\s+(.+)\s*$/);
      if (!m) continue;
      const level = m[1].length;
      const title = m[2].replace(/\s+#\s*$/, "").trim();
      const base = slugify(title);
      const n = (counts.get(base) || 0) + 1;
      counts.set(base, n);
      const id = n === 1 ? base : `${base}-${n}`;
      out.push({ level, title, id });
    }
    return out;
  }, [normalized, isDoc]);

  const lastTocRef = useRef(null);
  if (isDoc && onToc && toc !== lastTocRef.current) {
    lastTocRef.current = toc;
    onToc(toc);
  }

  const getCalloutType = (children) => {
    const raw = Array.isArray(children) ? children.map(String).join("\n") : String(children ?? "");
    const firstLine = raw.split("\n")[0] || "";
    const m = firstLine.match(/\*\*(Note|Tip|Warning|Danger|Info)\*\*:/i);
    return m ? m[1].toLowerCase() : null;
  };

  const makeHeading = (Tag) => {
    return ({ children }) => {
      const textOnly = Array.isArray(children) ? children.join("") : String(children ?? "");
      const base = slugify(textOnly);
      const found = toc.find((h) => h.id === base || h.id.startsWith(`${base}-`));
      const id = found?.id || base;

      return (
        <Tag id={id} className={styles[`md${Tag.toUpperCase()}`] || styles.mdH2}>
          {isDoc && (
            <a className={styles.headingAnchor} href={`#${id}`} aria-label="Link to section">
              #
            </a>
          )}
          {children}
        </Tag>
      );
    };
  };

  const remarkPlugins = isDoc ? [remarkGfm, remarkMath] : [remarkGfm];
  const rehypePlugins = isDoc ? [rehypeKatex] : [];

  return (
    <div className={isDoc ? styles.mdDocContainer : styles.mdChatContainer}>
      {isDoc && toc.length >= 3 && (
        <div className={styles.mdToc}>
          <div className={styles.mdTocTitle}>Contents</div>
          <nav className={styles.mdTocNav}>
            {toc.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                className={styles.mdTocLink}
                style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
              >
                {h.title}
              </a>
            ))}
          </nav>
        </div>
      )}

      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        skipHtml={true}
        linkTarget="_blank"
        components={{
          h1: isDoc ? makeHeading("h1") : ({ children }) => <div className={styles.mdStrongTitle}>{children}</div>,
          h2: isDoc ? makeHeading("h2") : ({ children }) => <div className={styles.mdStrongSubtitle}>{children}</div>,
          h3: isDoc ? makeHeading("h3") : ({ children }) => <div className={styles.mdStrongSubtitle}>{children}</div>,
          h4: isDoc ? makeHeading("h4") : ({ children }) => <div className={styles.mdStrongSubtitle}>{children}</div>,

          p: ({ children }) => <p className={styles.mdP}>{children}</p>,
          ul: ({ children }) => <ul className={styles.mdUl}>{children}</ul>,
          ol: ({ children }) => <ol className={styles.mdOl}>{children}</ol>,
          li: ({ children }) => <li className={styles.mdLi}>{children}</li>,

          a: ({ href, children }) => (
            <a className={styles.mdLink} href={href} rel="noopener noreferrer" target="_blank">
              {children}
            </a>
          ),

          blockquote: ({ children }) => {
            const t = isDoc ? getCalloutType(children) : null;
            if (t) {
              return <div className={`${styles.mdCallout} ${styles[`mdCallout_${t}`] || ""}`}>{children}</div>;
            }
            return <blockquote className={styles.mdQuote}>{children}</blockquote>;
          },

          table: ({ children }) => (
            <div className={styles.mdTableWrap}>
              <table className={styles.mdTable}>{children}</table>
            </div>
          ),
          th: ({ children }) => <th className={styles.mdTh}>{children}</th>,
          td: ({ children }) => <td className={styles.mdTd}>{children}</td>,

          hr: () => <hr className={styles.mdHr} />,

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
        {normalized}
      </ReactMarkdown>
    </div>
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
  const [activeArtifactTab, setActiveArtifactTab] = useState("artifacts");

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

  const layoutClassName = isArtifactsCollapsed ? `${styles.layout} ${styles.layoutArtifactsCollapsed}` : styles.layout;

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
    const title = a?.filename || a?.title || a?.name;
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
    console.log("🔵 handleSend called at:", Date.now());
    const trimmed = inputText.trim();

    // block sending if no text AND no attachments
    if ((!trimmed && attachments.length === 0) || !sendMessage) return;
    console.log("⚠️ handleSend blocked: no content or no sendMessage");

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
    console.log("📤 handleSend calling sendMessage with:", composed.substring(0, 50));

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
      setUploadState({ status: "error", filename: "", message: "Open a workspace before uploading." });
      return;
    }

    const validationError = validateFile(file);
    const localId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    setAttachments((prev) => [
      ...prev,
      {
        localId,
        name: file?.name || "document",
        size: file?.size || 0,
        status: validationError ? "error" : "uploading",
        documentId: null,
        error: validationError || null,
      },
    ]);

    if (validationError) return;

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

      if (refreshArtifacts) await refreshArtifacts(taskId);
    } catch (e) {
      setAttachments((prev) =>
        prev.map((a) => (a.localId === localId ? { ...a, status: "error", error: e.message || "Upload failed" } : a))
      );
    } finally {
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

            {messages.map((message) => {
              const isStreaming = message.streaming || message.is_streaming || false;
              const messageKey = isStreaming ? `${message.id}-${message.text?.length || 0}` : message.id;

              return (
                <div key={messageKey} className={styles.message}>
                  <div
                    className={
                      message.user
                        ? `${styles.messageCard} ${styles.messageCardUser}`
                        : `${styles.messageCard} ${styles.messageCardAi}`
                    }
                    data-role={message.user ? "user" : "ai"}
                  >
                    <div className={styles.messageCardInner}>
                      <div className={styles.messageMeta}>
                        <span className={styles.messageRole}>
                          {message.user ? "You" : message.role_name || "Assistant"}
                          {isStreaming && <span style={{ opacity: 0.6 }}> ⋯</span>}
                        </span>
                        {!message.user && <CopyButton getText={() => String(message.text || "")} label="Copy message" />}
                      </div>

                      <div className={styles.messageBody}>
                        <MarkdownMessage key={`md-${messageKey}`} text={message.text} variant="chat" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

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

              {/* Attachments chips (kept as-is to avoid breaking your upload UX) */}
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
                          color: "#CBD5F5",
                          cursor: "pointer",
                          padding: "2px 4px",
                          borderRadius: "8px",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.composerActions}>
                <button
                  type="button"
                  className={styles.composerButton}
                  onClick={openFilePicker}
                  aria-label="Attach a document"
                  title="Attach a document"
                  disabled={isSending}
                >
                  +
                </button>

                {!isSending ? (
                  <button
                    type="button"
                    className={styles.composerButton}
                    onClick={handleSend}
                    aria-label="Send message"
                    title="Send"
                    disabled={isSending}
                  >
                    ➤
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${styles.composerButton} ${styles.composerStop}`}
                    onClick={handleStopStreaming}
                    aria-label="Stop generating"
                    title="Stop"
                  >
                    ■
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT */}
        <aside className={styles.artifactsSection}>
          <div className={styles.artifactsHeader}>
            <div className={styles.artifactsHeaderRow}>
              <div className={styles.artifactsTabs}>
                <button
                  type="button"
                  className={
                    activeArtifactTab === "artifacts"
                      ? `${styles.artifactsTab} ${styles.artifactsTabActive}`
                      : styles.artifactsTab
                  }
                  onClick={() => setActiveArtifactTab("artifacts")}
                >
                  Artifacts
                </button>

                <button
                  type="button"
                  className={
                    activeArtifactTab === "intelligence"
                      ? `${styles.artifactsTab} ${styles.artifactsTabActive}`
                      : styles.artifactsTab
                  }
                  onClick={() => setActiveArtifactTab("intelligence")}
                >
                  Intelligence
                </button>
              </div>

              <button
                type="button"
                className={styles.artifactsToggle}
                onClick={() => setIsArtifactsCollapsed((v) => !v)}
                aria-label={isArtifactsCollapsed ? "Expand artifacts panel" : "Collapse artifacts panel"}
                title={isArtifactsCollapsed ? "Expand" : "Collapse"}
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
              {activeArtifactTab === "intelligence" ? (
                <IntelligenceTab task={task} verseStudio={verseStudio} />
              ) : (
                <>
                  <div className={styles.artifactsToolbar}>
                    <div className={styles.artifactsToolbarLeft}>
                      <button type="button" className={styles.refreshButton} onClick={handleRefreshArtifacts}>
                        Refresh
                      </button>

                      <label className={styles.toggleRow}>
                        <input
                          type="checkbox"
                          checked={showAllArtifacts}
                          onChange={(e) => setShowAllArtifacts(e.target.checked)}
                        />
                        <span>Show all</span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.artifactsList}>
                    {visibleArtifacts.length === 0 ? (
                      <div className={styles.artifactsEmpty}>
                        No file-worthy artifacts yet. Ask for a plan, a spec, or a code file.
                      </div>
                    ) : (
                      visibleArtifacts.map((a, idx) => {
                        const id = a?.id || a?.artifact_id || `${idx}`;
                        const label = artifactLabel(a, idx);
                        const expanded = expandedIds.has(id);
                        const downloadUrl = artifactDownloadUrl(a);

                        const content = a?.content || a?.text || a?.body || "";

                        return (
                          <div key={id} className={styles.artifactItem}>
                            <button
                              type="button"
                              className={styles.artifactHeader}
                              onClick={() => toggleExpanded(id)}
                              aria-expanded={expanded}
                            >
                              <div className={styles.artifactTitle}>{label}</div>
                              <div className={styles.artifactChevron}>{expanded ? "–" : "+"}</div>
                            </button>

                            {expanded && (
                              <div className={styles.artifactBody}>
                                <div className={styles.artifactActions}>
                                  <CopyButton getText={() => String(content || "")} label="Copy" />
                                  {downloadUrl && (
                                    <a className={styles.downloadLink} href={downloadUrl} target="_blank" rel="noreferrer">
                                      Download
                                    </a>
                                  )}
                                </div>

                                <div className={styles.artifactPreview}>
                                  <MarkdownMessage text={String(content || "")} variant="doc" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
