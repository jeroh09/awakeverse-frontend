// src/components/VerseStudio/VerseWorkspaceTemplateCard.jsx
import React from "react";
import styles from "./VerseWorkspaceTemplateCard.module.css";

export default function VerseWorkspaceTemplateCard({
  template,
  imageUrl,
  locked = false,
  onUse,
}) {
  const templateId = template?.template_id || template?.id || template?.slug;
  const title =
    template?.display_name || template?.name || template?.title || templateId || "Template";
  const description =
    template?.description ||
    template?.subtitle ||
    "Use this Verse Workspace template to get started quickly.";

  return (
    <article
      className={styles.card}
      style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      data-has-image={imageUrl ? "true" : "false"}
    >
      {/* Background overlay stack */}
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.tagRow}>
          <span className={styles.tag}>Verse Workspace</span>
          {template?.category ? (
            <span className={styles.tagSecondary}>{template.category}</span>
          ) : null}
        </div>

        <h3 className={styles.title}>{title}</h3>
        <p className={styles.desc}>{description}</p>

        <div className={styles.footer}>
          <button
            type="button"
            className={locked ? `${styles.cta} ${styles.ctaLocked}` : styles.cta}
            onClick={() => onUse?.(template)}
            disabled={false /* allow click so upgrade modal can open upstream */}
          >
            {locked ? "Upgrade to create more tasks" : "Use this template"}
          </button>
        </div>
      </div>
    </article>
  );
}
