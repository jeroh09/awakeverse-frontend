import React, { useEffect, useMemo, useState } from 'react';
import styles from './TaskCreator.module.css';
import VerseLLMSelector from './VerseLLMSelector';
import RoleAssignmentStep from './RoleAssignmentStep';

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
  const [roleAssignments, setRoleAssignments] = useState([]);
  const [showRoleAssignment, setShowRoleAssignment] = useState(false);
  const [touched, setTouched] = useState(false);

  const roles = useMemo(() => template?.roles || template?.team_roles || [], [template]);

  useEffect(() => {
    if (!isOpen) return;

    const templateId = template?.template_id || template?.id || template?.slug || null;

    if (template) {
      const baseTitle = initialName || template?.display_name || template?.name || template?.title || 'Verse Workspace task';
      const baseDescription = initialDescription || template?.description || template?.subtitle || 'A new multi-LLM workspace powered by Verse.';
      setName(baseTitle);
      setDescription(baseDescription);
    } else {
      setName(initialName || 'My Workspace');
      setDescription(initialDescription || 'Describe what you want to build or create.');
    }

    if (llmOptions?.length) {
      const pre = llmOptions
        .slice(0, maxModels)
        .map((llm) => llm.id || llm.key)
        .filter(Boolean);

      setSelectedLlms(pre.slice(0, Math.max(minModels, 1)));
    } else {
      setSelectedLlms([]);
    }

    setRoleAssignments([]);
    setShowRoleAssignment(false);
    setTouched(false);
  }, [isOpen, template, llmOptions, initialName, initialDescription, minModels, maxModels]);

  if (!isOpen) return null;

  const templateId = template?.template_id || template?.id || template?.slug || null;

  const showNameError = touched && !name.trim();
  const showLlmError = touched && selectedLlms.length > 0 && selectedLlms.length < minModels;

  const canSubmitDirect =
    name.trim().length > 0 &&
    selectedLlms.length >= minModels &&
    selectedLlms.length <= maxModels &&
    !isCreating;

  const canProceedToRoles = 
    name.trim().length > 0 &&
    selectedLlms.length >= minModels &&
    selectedLlms.length <= maxModels;

  const handleLlmsSelected = (ids) => {
    setSelectedLlms(ids);
    setTouched(true);
    
    if (ids.length !== selectedLlms.length || !ids.every(id => selectedLlms.includes(id))) {
      setRoleAssignments([]);
    }
  };

  const handleProceedToRoleAssignment = () => {
    if (canProceedToRoles) {
      setShowRoleAssignment(true);
    }
  };

  const handleBackFromRoleAssignment = () => {
    setShowRoleAssignment(false);
  };

  const handleSubmitTemplateDirect = (e) => {
    e.preventDefault();
    setTouched(true);

    if (!canSubmitDirect) return;

    onCreate?.({
      name: name.trim(),
      description: description.trim(),
      template_id: templateId,
      llm_preferences: selectedLlms,
    });
  };

  const handleSubmitWithRoles = () => {
    setTouched(true);

    if (!canProceedToRoles || roleAssignments.length === 0) return;

    const payload = {
      name: name.trim(),
      description: description.trim(),
    };

    if (template) {
      payload.template_id = templateId;
      payload.custom_roles = roleAssignments.map(assignment => ({
        role_name: assignment.role_name,
        llm_id: assignment.llm_id
      }));
    } else {
      payload.custom_roles = roleAssignments.map(assignment => ({
        role_name: assignment.role_name,
        llm_id: assignment.llm_id
      }));
    }

    onCreate?.(payload);
  };

  const templateTag =
    template?.category ||
    template?.use_case ||
    template?.tagline ||
    'Verse Workspace template';

  if (showRoleAssignment) {
    return (
      <div className={styles.overlay} role="dialog" aria-modal="true">
        <div className={styles.modal}>
          <RoleAssignmentStep
            template={template}
            selectedLlms={selectedLlms}
            llmOptions={llmOptions}
            initialAssignments={roleAssignments}
            onAssignmentsChange={setRoleAssignments}
            onBack={handleBackFromRoleAssignment}
            onSubmit={handleSubmitWithRoles}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerEyebrow}>Verse Workspace</div>
            <h2 className={styles.headerTitle}>
              {template ? `Set up ${template.display_name || template.name}` : 'Create workspace'}
            </h2>
            <p className={styles.headerSubtitle}>
              {template 
                ? 'Customize this template or use it as-is.'
                : 'Name your workspace, give it a focus, and choose 2–3 LLMs to collaborate.'}
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

        {/* ✅ SCROLLABLE BODY CONTAINER */}
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
          
          {/* ✅ FORM INSIDE SCROLLABLE BODY */}
          <form className={styles.form} onSubmit={template ? handleSubmitTemplateDirect : (e) => {
            e.preventDefault();
            handleProceedToRoleAssignment();
          }}>
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
                onChange={handleLlmsSelected}
                minSelection={minModels}
                maxSelection={maxModels}
              />
              {showLlmError && (
                <div className={styles.selectorError}>
                  Choose at least {minModels} models to create this workspace.
                </div>
              )}
            </div>

            <button type="submit" style={{ display: 'none' }} />
          </form>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            {errorMessage && <div className={styles.footerError}>{errorMessage}</div>}
          </div>
          <div className={styles.footerRight}>
            <button type="button" className={styles.secondaryButton} onClick={onCancel}>
              Cancel
            </button>
            
            <div className={styles.footerButtonGroup}>
              {template ? (
                <>
                  <button
                    type="button"
                    className={`${styles.primaryButton} ${!canSubmitDirect ? styles.primaryButtonDisabled : ''}`}
                    onClick={handleSubmitTemplateDirect}
                    disabled={!canSubmitDirect}
                    title="Create with template default roles"
                  >
                    {isCreating ? 'Creating workspace…' : 'Use template'}
                  </button>
                  
                  <div className={styles.buttonDivider}>or</div>
                  
                  <button
                    type="button"
                    className={styles.roleAssignmentButton}
                    onClick={handleProceedToRoleAssignment}
                    disabled={!canProceedToRoles}
                    title="Customize roles for this template"
                  >
                    Customize roles →
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={`${styles.primaryButton} ${!canProceedToRoles ? styles.primaryButtonDisabled : ''}`}
                  onClick={handleProceedToRoleAssignment}
                  disabled={!canProceedToRoles}
                >
                  {isCreating ? 'Creating workspace…' : 'Next: Assign roles →'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}