import React, { useMemo } from 'react';
import styles from './IntelligenceTab.module.css';

/**
 * IntelligenceTab - Displays intelligence data from Phase 4/5
 * 
 * Props:
 * - constitutionalDecisions: Array of constitutional decisions
 * - semanticStats: Semantic search statistics
 * - intelligenceStats: Combined intelligence statistics
 * - isLoading: Boolean indicating loading state
 */
export default function IntelligenceTab({
  constitutionalDecisions = [],
  semanticStats = null,
  intelligenceStats = null,
  isLoading = false
}) {
  // Format constitutional decisions by category
  const decisionsByCategory = useMemo(() => {
    const categories = {};
    constitutionalDecisions.forEach(decision => {
      const category = decision.category || 'general';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(decision);
    });
    return categories;
  }, [constitutionalDecisions]);

  // Planning mode data
  const planningMode = intelligenceStats?.planning_mode || {};
  const stuckDetection = intelligenceStats?.stuck_detection || {};

  if (isLoading) {
    return (
      <div className={styles.intelligenceTab}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingText}>Loading intelligence data...</div>
        </div>
      </div>
    );
  }

  const hasData = constitutionalDecisions.length > 0 || intelligenceStats;

  if (!hasData) {
    return (
      <div className={styles.intelligenceTab}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🧠</div>
          <div className={styles.emptyTitle}>No intelligence data yet</div>
          <div className={styles.emptyDescription}>
            As your team collaborates, intelligence data will appear here.
            This includes foundational decisions and planning insights.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.intelligenceTab}>
      {/* Constitutional Decisions Section */}
      {constitutionalDecisions.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Constitutional Decisions ({constitutionalDecisions.length})
          </h3>
          <div className={styles.sectionDescription}>
            Foundational choices that shape this task
          </div>
          
          {Object.entries(decisionsByCategory).map(([category, decisions]) => (
            <div key={category} className={styles.categoryGroup}>
              <div className={styles.categoryTitle}>
                {category.toUpperCase()}
              </div>
              <div className={styles.decisionsList}>
                {decisions.map((decision, idx) => (
                  <div key={idx} className={styles.decisionCard}>
                    <div className={styles.decisionContent}>
                      {decision.content}
                    </div>
                    {decision.reason && (
                      <div className={styles.decisionReason}>
                        {decision.reason}
                      </div>
                    )}
                    {decision.marked_at && (
                      <div className={styles.decisionMeta}>
                        Marked: {new Date(decision.marked_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Planning & Stuck Detection Section */}
      {(planningMode.triggered > 0 || stuckDetection.triggered > 0) && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Planning & Progress</h3>
          
          {planningMode.triggered > 0 && (
            <div className={styles.statsCard}>
              <div className={styles.statsTitle}>Planning Mode</div>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{planningMode.triggered}</div>
                  <div className={styles.statLabel}>Times triggered</div>
                </div>
                {planningMode.approved > 0 && (
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{planningMode.approved}</div>
                    <div className={styles.statLabel}>Approved plans</div>
                  </div>
                )}
                {planningMode.rejected > 0 && (
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{planningMode.rejected}</div>
                    <div className={styles.statLabel}>Rejected plans</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {stuckDetection.triggered > 0 && (
            <div className={styles.statsCard}>
              <div className={styles.statsTitle}>Stuck Detection</div>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{stuckDetection.triggered}</div>
                  <div className={styles.statLabel}>Instances detected</div>
                </div>
                {stuckDetection.user_frustration > 0 && (
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{stuckDetection.user_frustration}</div>
                    <div className={styles.statLabel}>Frustration signals</div>
                  </div>
                )}
                {stuckDetection.no_progress > 0 && (
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{stuckDetection.no_progress}</div>
                    <div className={styles.statLabel}>No-progress loops</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Intelligence Overview Section */}
      {intelligenceStats && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Intelligence Overview</h3>
          
          <div className={styles.overviewGrid}>
            {constitutionalDecisions.length > 0 && (
              <div className={styles.overviewItem}>
                <div className={styles.overviewIcon}>📜</div>
                <div className={styles.overviewContent}>
                  <div className={styles.overviewValue}>{constitutionalDecisions.length}</div>
                  <div className={styles.overviewLabel}>Constitutional decisions</div>
                </div>
              </div>
            )}

            {planningMode.triggered > 0 && (
              <div className={styles.overviewItem}>
                <div className={styles.overviewIcon}>📋</div>
                <div className={styles.overviewContent}>
                  <div className={styles.overviewValue}>{planningMode.triggered}</div>
                  <div className={styles.overviewLabel}>Planning triggers</div>
                </div>
              </div>
            )}

            {stuckDetection.triggered > 0 && (
              <div className={styles.overviewItem}>
                <div className={styles.overviewIcon}>🔄</div>
                <div className={styles.overviewContent}>
                  <div className={styles.overviewValue}>{stuckDetection.triggered}</div>
                  <div className={styles.overviewLabel}>Stuck instances</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}