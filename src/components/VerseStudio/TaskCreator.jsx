// src/components/VerseStudio/TaskCreator.jsx
// Full-page split layout — matches ScenarioCreator pattern
// Left panel: LLM selector (fixed 360px, cards inline)
// Right panel: Step 1 (form) → Step 2 (role assignment), fade transition
// position:fixed, z-index:1200 — works from any call site

import React, { useEffect, useMemo, useState } from 'react';
import RoleAssignmentStep from './RoleAssignmentStep';
import './WorkspaceCreatorPage.css';

// ─── LLM Card (left panel) ────────────────────────────────────
// Rendered inline — avoids VerseLLMSelector module CSS fighting the layout
function LlmCard({ llm, isSelected, isLocked, onToggle }) {
  const id   = llm.id || llm.key;
  const name = llm.label || llm.name || id;
  const provider    = llm.provider || llm.vendor || 'Custom';
  const tier        = llm.tier || null;
  const capabilities = llm.capabilities || llm.tags || [];
  const description  = llm.description || null;

  return (
    <button
      type="button"
      className={[
        'wsc-llm-card',
        isSelected ? 'selected' : '',
        isLocked   ? 'locked'   : '',
      ].filter(Boolean).join(' ')}
      onClick={() => !isLocked && onToggle(id)}
      disabled={isLocked}
      aria-pressed={isSelected}
    >
      <div className="wsc-llm-card-top">
        <span className="wsc-llm-name">{name}</span>
        <span className="wsc-llm-provider">{provider}</span>
        <span className="wsc-llm-check" aria-hidden="true" />
      </div>

      {description && (
        <p className="wsc-llm-desc">{description}</p>
      )}

      {(capabilities.length > 0 || tier) && (
        <div className="wsc-llm-tags">
          {capabilities.slice(0, 3).map(tag => (
            <span key={tag} className="wsc-llm-tag">{tag}</span>
          ))}
          {tier && (
            <span className="wsc-llm-tier">
              {tier === 'pro' ? 'Pro' : tier === 'free' ? 'Free' : tier}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function TaskCreator({
  isOpen,
  template,
  llmOptions      = [],
  initialName     = '',
  initialDescription = '',
  minModels       = 2,
  maxModels       = 3,
  isCreating      = false,
  errorMessage,
  onCancel,
  onCreate,
}) {
  // ── State ──
  const [name,            setName]            = useState(initialName);
  const [description,     setDescription]     = useState(initialDescription);
  const [selectedLlms,    setSelectedLlms]    = useState([]);
  const [roleAssignments, setRoleAssignments] = useState([]);
  const [step,            setStep]            = useState(1);   // 1 | 2
  const [touched,         setTouched]         = useState(false);

  const roles = useMemo(
    () => template?.roles || template?.team_roles || [],
    [template]
  );

  const templateId = template?.template_id || template?.id || template?.slug || null;

  const templateTag =
    template?.category ||
    template?.use_case  ||
    template?.tagline   ||
    'Workspace template';

  const roleCount = Array.isArray(roles)
    ? roles.length
    : Object.keys(roles || {}).length;

  // ── Reset on open ──
  useEffect(() => {
    if (!isOpen) return;

    if (template) {
      setName(initialName || template?.display_name || template?.name || template?.title || 'Verse Workspace task');
      setDescription(initialDescription || template?.description || template?.subtitle || 'A new multi-LLM workspace powered by Verse.');
    } else {
      setName(initialName || 'My Workspace');
      setDescription(initialDescription || 'Describe what you want to build or create.');
    }

    if (llmOptions?.length) {
      const pre = llmOptions
        .slice(0, maxModels)
        .map(llm => llm.id || llm.key)
        .filter(Boolean);
      setSelectedLlms(pre.slice(0, Math.max(minModels, 1)));
    } else {
      setSelectedLlms([]);
    }

    setRoleAssignments([]);
    setStep(1);
    setTouched(false);
  }, [isOpen, template, llmOptions, initialName, initialDescription, minModels, maxModels]);

  // ── Guard ──
  if (!isOpen) return null;

  // ── Derived ──
  const selectionCount  = selectedLlms.length;
  const isAtMax         = selectionCount >= maxModels;
  const showNameError   = touched && !name.trim();
  const showLlmError    = touched && selectionCount > 0 && selectionCount < minModels;

  const canSubmitDirect = name.trim().length > 0
    && selectionCount >= minModels
    && selectionCount <= maxModels
    && !isCreating;

  const canProceedToRoles = name.trim().length > 0
    && selectionCount >= minModels
    && selectionCount <= maxModels;

  // LLM count hint text
  const llmHint = (() => {
    if (selectionCount === 0)             return `Choose ${minModels}–${maxModels} models.`;
    if (selectionCount < minModels)       return `Select at least ${minModels} (${maxModels - selectionCount} more available).`;
    if (selectionCount < maxModels)       return `${selectionCount} selected — you can add ${maxModels - selectionCount} more.`;
    return `${selectionCount} of ${maxModels} selected.`;
  })();

  const llmCountClass = selectionCount > 0 && selectionCount < minModels
    ? 'wsc-llm-count warn'
    : 'wsc-llm-count';

  // Step label text
  const stepLabel = step === 1
    ? 'Step 1: Name & models'
    : 'Step 2: Assign roles';

  // ── Handlers ──
  const handleToggleLlm = (id) => {
    setTouched(true);
    const isSelected = selectedLlms.includes(id);

    let next;
    if (isSelected) {
      next = selectedLlms.filter(x => x !== id);
    } else {
      if (isAtMax) return;
      next = [...selectedLlms, id];
    }

    // If LLM set changed, clear role assignments (they'd be stale)
    if (next.length !== selectedLlms.length || !next.every(id => selectedLlms.includes(id))) {
      setRoleAssignments([]);
    }
    setSelectedLlms(next);
  };

  const handleGoToStep2 = () => {
    setTouched(true);
    if (canProceedToRoles) setStep(2);
  };

  const handleBackToStep1 = () => {
    setStep(1);
  };

  // "Use template" — skip role assignment, submit with default roles
  const handleSubmitTemplateDirect = () => {
    setTouched(true);
    if (!canSubmitDirect) return;
    onCreate?.({
      name:            name.trim(),
      description:     description.trim(),
      template_id:     templateId,
      llm_preferences: selectedLlms,
    });
  };

  // Submit with custom role assignments
  const handleSubmitWithRoles = () => {
    setTouched(true);
    if (!canProceedToRoles || roleAssignments.length === 0) return;
    onCreate?.({
      name:         name.trim(),
      description:  description.trim(),
      ...(templateId ? { template_id: templateId } : {}),
      custom_roles: roleAssignments.map(a => ({
        role_name: a.role_name,
        llm_id:    a.llm_id,
      })),
    });
  };

  // ── Render ──
  return (
    <div className="wsc-root" role="dialog" aria-modal="true" aria-label="Create workspace">

      {/* ── Top bar ── */}
      <div className="wsc-topbar">
        <button
          type="button"
          className="wsc-back"
          onClick={step === 2 ? handleBackToStep1 : onCancel}
          aria-label={step === 2 ? 'Back to step 1' : 'Cancel'}
        >
          ← {step === 2 ? 'Back' : 'Cancel'}
        </button>

        <div className="wsc-topbar-center">
          {/* Step label + dots on same line */}
          <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <span className="wsc-step-label">{stepLabel}</span>
            <div className="wsc-step-dots" aria-hidden="true">
              <span className={`wsc-dot${step === 1 ? ' active' : ''}`} />
              <span className={`wsc-dot${step === 2 ? ' active' : ''}`} />
            </div>
          </div>

          {/* Template subtitle — muted, truncated, never wraps */}
          {template && (
            <span className="wsc-template-sub">
              {template.display_name || template.name || template.title}
              {roleCount > 0 && ` · ${roleCount} roles`}
            </span>
          )}
        </div>

        {/* Right spacer keeps center visually balanced */}
        <div className="wsc-topbar-right" aria-hidden="true" />
      </div>

      {/* ── Body ── */}
      <div className={`wsc-body${step === 2 ? ' step2' : ''}`}>

        {/* ── Left panel: LLM selector ── */}
        <div className="wsc-left">
          <div className="wsc-left-header">
            <div className="wsc-left-title">Model team</div>
            <p className="wsc-left-hint">
              Choose {minModels}–{maxModels} LLMs to power this workspace.
            </p>
            <span className={llmCountClass}>
              {selectionCount} / {maxModels} selected
            </span>
          </div>

          <div className="wsc-llm-scroll">
            {llmOptions.length === 0 ? (
              <div className="wsc-llm-empty">
                No models configured yet.<br />
                Models will appear here once set up on the backend.
              </div>
            ) : (
              llmOptions.map(llm => {
                const id = llm.id || llm.key;
                if (!id) return null;
                const isSelected = selectedLlms.includes(id);
                const isLocked   = !isSelected && isAtMax;
                return (
                  <LlmCard
                    key={id}
                    llm={llm}
                    isSelected={isSelected}
                    isLocked={isLocked}
                    onToggle={handleToggleLlm}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="wsc-right">

          {/* Step area — both steps absolute-positioned within, footer below */}
          <div className="wsc-step-area">

          {/* Step 1 — name + description */}
          <div className={`wsc-step wsc-step-form${step === 1 ? ' visible' : ''}`}>

            {/* Template strip (compact) */}
            {template && (
              <div className="wsc-template-strip">
                <span className="wsc-template-pill">{templateTag}</span>
                <span className="wsc-template-name">
                  {template.display_name || template.name || template.title || 'Verse template'}
                </span>
                {roleCount > 0 && (
                  <span className="wsc-template-roles">{roleCount} roles</span>
                )}
              </div>
            )}

            {/* Error banner */}
            {showLlmError && (
              <div className="wsc-error-banner">
                Choose at least {minModels} models from the panel on the left.
              </div>
            )}

            {/* Task name */}
            <div className="wsc-section">
              <label className="wsc-label" htmlFor="wsc-name">
                Task name<span className="wsc-req">*</span>
              </label>
              <input
                id="wsc-name"
                type="text"
                className={`wsc-input${showNameError ? ' error' : ''}`}
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={() => setTouched(true)}
                maxLength={120}
                placeholder="e.g. Q3 product spec"
                autoFocus
              />
              <div className="wsc-field-meta">
                {showNameError
                  ? <span className="wsc-field-error">A task name is required.</span>
                  : <span className="wsc-field-hint">Short and specific works best.</span>
                }
                <span className="wsc-char-count">{name.length}/120</span>
              </div>
            </div>

            {/* Description */}
            <div className="wsc-section">
              <label className="wsc-label" htmlFor="wsc-desc">
                What are you working on?
              </label>
              <textarea
                id="wsc-desc"
                className="wsc-textarea"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                maxLength={600}
                placeholder="Describe the goal, key deliverables, or context for the team…"
              />
              <div className="wsc-field-meta">
                <span className="wsc-field-hint">
                  Mention key deliverables (spec, code, docs, tests).
                </span>
                <span className="wsc-char-count">{description.length}/600</span>
              </div>
            </div>
          </div>

          {/* Step 2 — role assignment */}
          {/* Conditionally rendered — RoleAssignmentStep initializes from selectedLlms  */}
          {/* which must already be set. Mounting only on step===2 guarantees this.       */}
          {/* roleAssignments in parent preserves edits if user navigates back/forward.  */}
          <div className={`wsc-step wsc-step-roles${step === 2 ? ' visible' : ''}`}>
            {step === 2 && (
              <div className="wsc-role-wrap">
                <RoleAssignmentStep
                  template={template}
                  selectedLlms={selectedLlms}
                  llmOptions={llmOptions}
                  initialAssignments={roleAssignments}
                  onAssignmentsChange={setRoleAssignments}
                  onBack={handleBackToStep1}
                  onSubmit={handleSubmitWithRoles}
                />
              </div>
            )}
          </div>

          </div>{/* /wsc-step-area */}

          {/* ── Right-panel footer ── */}
          <div className="wsc-footer">
            <div className="wsc-footer-left">
              {errorMessage && (
                <span className="wsc-footer-error">{errorMessage}</span>
              )}
            </div>

            <div className="wsc-footer-right">
              {step === 1 ? (
                <>
                  <button
                    type="button"
                    className="wsc-btn-cancel"
                    onClick={onCancel}
                  >
                    Cancel
                  </button>

                  {/* "Use template" — only when template present, skips role step */}
                  {template && (
                    <>
                      <button
                        type="button"
                        className="wsc-btn-use-template"
                        onClick={handleSubmitTemplateDirect}
                        disabled={!canSubmitDirect}
                        title="Create workspace with template default roles"
                      >
                        {isCreating ? 'Creating…' : 'Use template'}
                      </button>
                      <span className="wsc-btn-divider">or</span>
                    </>
                  )}

                  <button
                    type="button"
                    className="wsc-btn-primary"
                    onClick={handleGoToStep2}
                    disabled={!canProceedToRoles}
                  >
                    Next: Assign roles →
                  </button>
                </>
              ) : (
                /* Step 2: RoleAssignmentStep owns its own Back + Submit buttons.
                   Topbar ← Back also calls handleBackToStep1.
                   wsc-footer only carries error messages in step 2. */
                null
              )}
            </div>
          </div>

        </div>{/* /wsc-right */}
      </div>{/* /wsc-body */}
    </div>
  );
}