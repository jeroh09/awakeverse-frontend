// src/components/Versestudio/VerseLLMSelector.jsx
import React, { useMemo } from 'react';
import styles from './VerseLLMSelector.module.css';

/**
 * VerseLLMSelector
 *
 * A compact selector for choosing 2–3 LLMs to power a Verse Workspace task.
 *
 * Props:
 * - llmOptions: Array of LLM configs:
 *    [
 *      {
 *        id: 'gpt_4o',
 *        label: 'GPT-4o',
 *        provider: 'OpenAI',
 *        tier: 'pro' | 'free' | 'lab' (optional),
 *        capabilities: ['Generalist', 'Reasoning'] (optional),
 *        description: 'Great for…' (optional)
 *      },
 *      ...
 *    ]
 *
 * - selectedIds: Array of currently selected LLM ids
 * - onChange: (newSelectedIds: string[]) => void
 * - minSelection: minimum required (default 2)
 * - maxSelection: maximum allowed (default 3)
 */
export default function VerseLLMSelector({
  llmOptions = [],
  selectedIds = [],
  onChange,
  minSelection = 2,
  maxSelection = 3
}) {
  const selectionCount = selectedIds.length;

  const selectionHint = useMemo(() => {
    // Guidance text for the user
    if (selectionCount === 0) {
      return `Choose ${minSelection}–${maxSelection} models to power this workspace.`;
    }
    if (selectionCount < minSelection) {
      return `Select at least ${minSelection} models (you can pick up to ${maxSelection}).`;
    }
    if (selectionCount >= minSelection && selectionCount < maxSelection) {
      return `You’ve selected ${selectionCount}. You can add ${maxSelection - selectionCount} more.`;
    }
    // At max
    return `You’ve selected ${selectionCount} of ${maxSelection} models.`;
  }, [selectionCount, minSelection, maxSelection]);

  const isAtMax = selectionCount >= maxSelection;

  const handleToggle = (id) => {
    if (!onChange) return;

    const isSelected = selectedIds.includes(id);

    // Deselect – allowed even if we go below min; the parent
    // decides when creation can proceed.
    if (isSelected) {
      onChange(selectedIds.filter((x) => x !== id));
      return;
    }

    // Selecting new one
    if (isAtMax) {
      // Hard stop – do not allow more than maxSelection
      return;
    }

    onChange([...selectedIds, id]);
  };

  if (!llmOptions.length) {
    return (
      <div className={styles.selectorRoot}>
        <div className={styles.selectorHeader}>
          <div className={styles.selectorTitleBlock}>
            <div className={styles.selectorEyebrow}>Model team</div>
            <h3 className={styles.selectorTitle}>Choose your LLMs</h3>
          </div>
        </div>
        <div className={styles.selectorEmpty}>
          <div className={styles.emptyTitle}>No models available</div>
          <p className={styles.emptyBody}>
            Once Verse Workspace models are configured on the backend, they’ll appear here 
            so you can choose a 2–3 model team for each task.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.selectorRoot}>
      {/* Header */}
      <div className={styles.selectorHeader}>
        <div className={styles.selectorTitleBlock}>
          <div className={styles.selectorEyebrow}>Model team</div>
          <h3 className={styles.selectorTitle}>Choose your LLMs</h3>
        </div>
        <div className={styles.selectorMeta}>
          <span className={styles.selectorCount}>
            {selectionCount} / {maxSelection} selected
          </span>
        </div>
      </div>

      {/* Helper text */}
      <p
        className={`${styles.selectorHint} ${
          selectionCount > 0 && selectionCount < minSelection
            ? styles.selectorHintWarn
            : ''
        }`}
      >
        {selectionHint}
      </p>

      {/* Options grid */}
      <div className={styles.optionsGrid}>
        {llmOptions.map((llm) => {
          const id = llm.id || llm.key;
          if (!id) return null;

          const isSelected = selectedIds.includes(id);
          const lockedOut = !isSelected && isAtMax;

          const name = llm.label || llm.name || id;
          const provider = llm.provider || llm.vendor || 'Custom';
          const tier = llm.tier || null;
          const capabilities = llm.capabilities || llm.tags || [];

          return (
            <button
              key={id}
              type="button"
              className={[
                styles.optionCard,
                isSelected ? styles.optionSelected : '',
                lockedOut ? styles.optionDisabled : ''
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleToggle(id)}
              disabled={lockedOut}
            >
              <div className={styles.optionHeaderRow}>
                <span className={styles.optionName}>{name}</span>
                <span className={styles.optionProvider}>{provider}</span>
              </div>

              {llm.description && (
                <p className={styles.optionDescription}>{llm.description}</p>
              )}

              <div className={styles.optionFooterRow}>
                <div className={styles.optionTags}>
                  {capabilities.slice(0, 3).map((tag) => (
                    <span key={tag} className={styles.optionTag}>
                      {tag}
                    </span>
                  ))}
                  {capabilities.length > 3 && (
                    <span className={styles.optionTagMore}>
                      +{capabilities.length - 3} more
                    </span>
                  )}
                  {tier && (
                    <span className={styles.optionTier}>
                      {tier === 'pro' ? 'Pro' : tier === 'free' ? 'Free' : tier}
                    </span>
                  )}
                </div>

                <div className={styles.optionCheckShell}>
                  <span
                    className={[
                      styles.optionCheckDot,
                      isSelected ? styles.optionCheckDotActive : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                  <span className={styles.optionCheckLabel}>
                    {isSelected ? 'Selected' : lockedOut ? 'Max reached' : 'Tap to select'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
