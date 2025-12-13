// src/components/VerseStudio/TaskCreator.jsx
import React, { useEffect, useMemo, useState } from 'react';
import styles from './TaskCreator.module.css';
import VerseLLMSelector from './VerseLLMSelector';

export default function TaskCreator({
  isOpen,
  template,
  llmOptions = [],
  initialName = '',
  initialDescription = '',
  minModels = 2,
  maxModels = 3,
  isCreating = false,
  errorMessage,
  onCancel,
  onCreate,
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [selectedLlms, setSelectedLlms] = useState([]);
  const [touched, setTouched] = useState(false);

  // ✅ IMPORTANT: keep hooks stable regardless of isOpen
  const roles = useMemo(() => template?.roles || template?.team_roles || [], [template]);

  useEffect(() => {
    if (!isOpen) return;

    const templateId =
      template?.template_id || template?.id || template?.slug || null;

    const baseTitle =
      initialName ||
      template?.display_name ||
      template?.name ||
      template?.title ||
      (templateId ? `Task · ${templateId}` : 'Verse Workspace task');

    const baseDescription =
      initialDescription ||
      template?.description ||
      template?.subtitle ||
      'A new multi-LLM workspace powered by Verse.';

    setName(baseTitle);
    setDescription(baseDescription);

    // Preselect up to minModels models if available
    if (llmOptions?.length) {
      const pre = llmOptions
        .slice(0, maxModels)
        .map((llm) => llm.id || llm.key)
        .filter(Boolean);

      setSelectedLlms(pre.slice(0, Math.max(minModels, 1)));
    } else {
      setSelectedLlms([]);
    }

    setTouched(false);
  }, [isOpen, template, llmOptions, initialName, initialDescription, minModels, maxModels]);

  // ✅ after hooks
  if (!isOpen) return null;

  const templateId =
    template?.template_id || template?.id || template?.slug || null;

  const showNameError = touched && !name.trim();
  const showLlmError = touched && selectedLlms.length > 0 && selectedLlms.length < minModels;

  const canSubmit =
    name.trim().length > 0 &&
    selectedLlms.length >= minModels &&
    selectedLlms.length <= maxModels &&
    !isCreating;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);

    if (!canSubmit) return;

    onCreate?.({
      name: name.trim(),
      description: description.trim(),
      template_id: templateId,
      llm_preferences: selectedLlms,
    });
  };

  const templateTag =
    template?.category ||
    template?.use_case ||
    template?.tagline ||
    'Verse Workspace template';

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerEyebrow}>Verse Workspace</div>
            <h2 className={styles.headerTitle}>Set up your task</h2>
            <p className={styles.headerSubtitle}>
              Name your workspace, give it a focus, and choose 2–3 LLMs to collaborate.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onCancel}
            aria-label="Close task setup"
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {template && (
            <div className={styles.templateSummary}>
              <div className={styles.templateSummaryHeader}>
                <span className={styles.templatePill}>{templateTag}</span>
                <span className={styles.templateRoleCount}>
                  {Array.isArray(roles)
                    ? `${roles.length} roles`
                    : `${Object.keys(roles || {}).length} roles`}
                </span>
              </div>

              <div className={styles.templateSummaryBody}>
                <div className={styles.templateTitle}>
                  {template.display_name || template.name || template.title || 'Verse template'}
                </div>
                {template.description && (
                  <p className={styles.templateDescription}>{template.description}</p>
                )}
              </div>
            </div>
          )}
        </div>
        

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formMainColumn}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Task name</span>
              <input
                type="text"
                className={`${styles.fieldInput} ${showNameError ? styles.fieldInputError : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(true)}
                maxLength={120}
              />
              <div className={styles.fieldMetaRow}>
                {showNameError ? (
                  <span className={styles.fieldErrorText}>
                    A task name helps you find this workspace later.
                  </span>
                ) : (
                  <span className={styles.fieldHint}>Short and specific works best.</span>
                )}
                <span className={styles.fieldCounter}>{name.length}/120</span>
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>What are you working on?</span>
              <textarea
                className={styles.fieldTextarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={600}
              />
              <div className={styles.fieldMetaRow}>
                <span className={styles.fieldHint}>
                  Mention key deliverables (spec, code, docs, tests).
                </span>
                <span className={styles.fieldCounter}>{description.length}/600</span>
              </div>
            </label>
          </div>

          <div className={styles.formSideColumn}>
            <VerseLLMSelector
              llmOptions={llmOptions}
              selectedIds={selectedLlms}
              onChange={(ids) => {
                setSelectedLlms(ids);
                setTouched(true);
              }}
              minSelection={minModels}
              maxSelection={maxModels}
            />
            {showLlmError && (
              <div className={styles.selectorError}>
                Choose at least {minModels} models to create this workspace.
              </div>
            )}
          </div>
        </form>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            {errorMessage && <div className={styles.footerError}>{errorMessage}</div>}
          </div>
          <div className={styles.footerRight}>
            <button type="button" className={styles.secondaryButton} onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              className={`${styles.primaryButton} ${!canSubmit ? styles.primaryButtonDisabled : ''}`}
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {isCreating ? 'Creating workspace…' : 'Create workspace'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
