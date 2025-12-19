import React, { useState, useEffect } from 'react';
import styles from './RoleAssignmentStep.module.css';

export default function RoleAssignmentStep({
  template = null,
  selectedLlms = [],
  llmOptions = [],
  initialAssignments = [],
  onAssignmentsChange,
  onBack,
  onSubmit
}) {
  const llmMap = React.useMemo(() => {
    const map = {};
    llmOptions.forEach(llm => {
      map[llm.id || llm.key] = llm;
    });
    return map;
  }, [llmOptions]);

  const [assignments, setAssignments] = useState(() => {
    if (initialAssignments.length > 0) {
      return initialAssignments;
    }
    
    // Initialize based on template or custom
    if (template) {
      // For templates: try to get template role names
      const templateRoles = template?.roles || template?.team_roles || [];
      const roleNames = Array.isArray(templateRoles) 
        ? templateRoles.map(r => r.name || r.role_name)
        : Object.values(templateRoles).map(r => r.name || r.role_name);
      
      return selectedLlms.map((llmId, index) => ({
        llm_id: llmId,
        role_name: roleNames[index] || `Role ${index + 1}`,
        is_custom: false
      }));
    } else {
      // Custom from scratch: generic role names
      return selectedLlms.map((llmId, index) => ({
        llm_id: llmId,
        role_name: `Role ${index + 1}`,
        is_custom: false
      }));
    }
  });

  const [touched, setTouched] = useState(false);

  useEffect(() => {
    onAssignmentsChange?.(assignments);
  }, [assignments, onAssignmentsChange]);

  const handleRoleNameChange = (llmId, newRoleName) => {
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.llm_id === llmId 
          ? { ...assignment, role_name: newRoleName, is_custom: true }
          : assignment
      )
    );
    setTouched(true);
  };

  const getLlmDetails = (llmId) => {
    return llmMap[llmId] || { label: llmId, provider: 'Unknown' };
  };

  const allRolesAssigned = assignments.every(a => a.role_name?.trim().length > 0);
  const canProceed = allRolesAssigned && touched;

  return (
    <div className={styles.roleAssignmentStep}>
      <div className={styles.header}>
        <button 
          type="button" 
          className={styles.backButton}
          onClick={onBack}
          aria-label="Back"
        >
          ← Back
        </button>
        <h3 className={styles.title}>
          {template ? `Customize roles` : 'Assign roles to your team'}
        </h3>
        <p className={styles.subtitle}>
          {template 
            ? `Give each LLM a role in your "${template.display_name || template.name}" workspace.`
            : 'Give each LLM a role in your workspace. Roles help the team collaborate effectively.'}
        </p>
      </div>

      <div className={styles.assignmentsGrid}>
        {assignments.map((assignment, index) => {
          const llm = getLlmDetails(assignment.llm_id);
          const isCustom = assignment.is_custom;
          
          return (
            <div key={assignment.llm_id} className={styles.assignmentCard}>
              <div className={styles.llmInfo}>
                <div className={styles.llmNameRow}>
                  <span className={styles.llmName}>{llm.label}</span>
                  <span className={styles.llmProvider}>{llm.provider}</span>
                </div>
                {llm.description && (
                  <p className={styles.llmDescription}>{llm.description}</p>
                )}
              </div>

              <div className={styles.roleInputSection}>
                <label className={styles.roleLabel}>
                  Role name
                  {isCustom && (
                    <span className={styles.customBadge}>Custom</span>
                  )}
                </label>
                <input
                  type="text"
                  className={styles.roleInput}
                  value={assignment.role_name}
                  onChange={(e) => handleRoleNameChange(assignment.llm_id, e.target.value)}
                  placeholder="e.g., Writer, Coder, Reviewer"
                  maxLength={40}
                />
                <div className={styles.roleHint}>
                  {!isCustom 
                    ? template 
                      ? "Template default role. Edit to customize."
                      : "Default role name. Edit to customize."
                    : "Custom role assigned"}
                </div>
              </div>

              <div className={styles.assignmentMeta}>
                <span className={styles.positionBadge}>
                  Position {index + 1}
                </span>
                {template && !isCustom && (
                  <span className={styles.templateBadge}>Template</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerHint}>
          {!allRolesAssigned ? (
            <span className={styles.errorHint}>Please assign a role name to each LLM.</span>
          ) : !touched ? (
            <span className={styles.defaultHint}>
              {template 
                ? 'Using template default roles. Edit if needed.'
                : 'Using default role names. Edit if needed.'}
            </span>
          ) : (
            <span className={styles.successHint}>
              {template 
                ? 'Roles customized. Ready to create workspace.'
                : 'Roles assigned. Ready to create workspace.'}
            </span>
          )}
        </div>

        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onSubmit}
            disabled={!canProceed}
          >
            {template ? 'Create customized workspace' : 'Create workspace with roles'}
          </button>
        </div>
      </div>
    </div>
  );
}