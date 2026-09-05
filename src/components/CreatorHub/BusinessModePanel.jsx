// src/components/CreatorHub/BusinessModePanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import useSMBIntelligence from '../../hooks/useSMBIntelligence';
import StickyNotes from './StickyNotes';
import './BusinessModePanel.css';

/* ─── SVG Icons ─────────────────────────────────────────────── */
const ScenarioIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <defs><filter id="bp-gS" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.55"/>
    </filter></defs>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" filter="url(#bp-gS)"/>
    <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" filter="url(#bp-gS)"/>
  </svg>
);

const FormIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="4" width="14" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M9 8h6M9 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BriefIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M12 4v12M7 12l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CloseSmIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <defs><filter id="bp-gZ" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.55"/>
    </filter></defs>
    <path d="M13 2L4 14h8l-1 8 9-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#bp-gZ)"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 2v4M16 2v4M4 10h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/* ─── Helpers ───────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtWeek(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ─── Empty state ───────────────────────────────────────────── */
const EmptyScenarios = ({ onAdd }) => (
  <div className="biz-empty">
    <div className="biz-empty-icon">📡</div>
    <div className="biz-empty-title">No scenarios yet</div>
    <div className="biz-empty-sub">Create your first intelligence scenario to start receiving weekly briefs.</div>
    <button className="biz-btn biz-btn-primary" onClick={onAdd}>
      <PlusIcon /> New Scenario
    </button>
  </div>
);

const EmptySnapshot = ({ scenarioName, onGenerate, generating }) => (
  <div className="biz-empty">
    <div className="biz-empty-icon">📄</div>
    <div className="biz-empty-title">No brief yet for {scenarioName}</div>
    <div className="biz-empty-sub">Generate your first brief — Analyst, Strategist and Critic will synthesise this week's topics for you.</div>
    <button
      className="biz-btn biz-btn-primary"
      onClick={onGenerate}
      disabled={generating}
    >
      {generating
        ? <><div className="biz-spinner" style={{width:13,height:13,borderWidth:2}} /> Generating…</>
        : <><ZapIcon /> Generate first brief</>}
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   BusinessModePanel
   Calls useSMBIntelligence and renders the full Business Mode UI.
   Passes notes props down to StickyNotes.
═══════════════════════════════════════════════════════════════ */
export default function BusinessModePanel() {
  const smb = useSMBIntelligence();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [snapshotNote, setSnapshotNote]     = useState('');
  const [savingNote, setSavingNote]         = useState(false);

  const [formData, setFormData] = useState({
    business_name:    '',
    name:             '',
    sector:           '',
    geography:        'UK',
    keyword_filters:  '',
    competitor_names: '',
  });

  /* Load scenarios on mount */
  useEffect(() => {
    smb.loadScenarios();
  }, []);

  /* Pre-fill snapshot note textarea when pending snapshot changes */
  useEffect(() => {
    setSnapshotNote(smb.pendingSnapshot?.owner_note || '');
  }, [smb.pendingSnapshot?.id]);
  

  /* ── Form handlers ── */
  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    const payload = {
      business_name:    formData.business_name.trim() || null,
      name:             formData.name.trim(),
      sector:           formData.sector.trim(),
      geography:        formData.geography.trim() || 'UK',
      keyword_filters:  formData.keyword_filters.split(',').map(s => s.trim()).filter(Boolean),
      competitor_names: formData.competitor_names.split(',').map(s => s.trim()).filter(Boolean),
    };
    const created = await smb.createScenario(payload);
    if (created) {
      setShowCreateForm(false);
      setFormData({ business_name:'', name:'', sector:'', geography:'UK', keyword_filters:'', competitor_names:'' });
      smb.selectScenario(created);
    }
  }, [formData, smb]);

  const handleCancelCreate = useCallback(() => {
    setShowCreateForm(false);
    setFormData({ business_name:'', name:'', sector:'', geography:'UK', keyword_filters:'', competitor_names:'' });
  }, []);

  /* ── Snapshot note save ── */
  const handleSaveNote = useCallback(async () => {
    if (!smb.pendingSnapshot) return;
    setSavingNote(true);
    await smb.updateSnapshotNote(smb.pendingSnapshot.id, snapshotNote);
    setSavingNote(false);
  }, [smb, snapshotNote]);

  /* ── Generate ── */
  const handleGenerate = useCallback(() => {
    if (smb.activeScenario) smb.generateBrief(smb.activeScenario.id);
  }, [smb]);

  return (
    <div>
      <div className="biz-panel">

        {/* ══ LEFT COLUMN ══════════════════════════════════════ */}
        <div className="biz-left-col">

          {/* Scenario list */}
          <div className="biz-card">
            <div className="biz-card-title">
              <span className="biz-icon-badge"><ScenarioIcon /></span>
              Intelligence Scenarios
            </div>

            {smb.scenariosLoading && (
              <div style={{ fontSize:'0.83rem', color:'#64748B', padding:'0.5rem 0' }}>Loading…</div>
            )}

            {!smb.scenariosLoading && smb.scenarios.length === 0 && !showCreateForm && (
              <EmptyScenarios onAdd={() => setShowCreateForm(true)} />
            )}

            {smb.scenarios.length > 0 && (
              <div className="biz-scenario-list">
                {smb.scenarios.map(s => (
                  <div
                    key={s.id}
                    className={`biz-scenario-item${smb.activeScenario?.id === s.id ? ' active' : ''}`}
                    onClick={() => smb.selectScenario(s)}
                  >
                    <div className="biz-scenario-row">
                      <div>
                        {s.business_name && (
                          <div className="biz-scenario-business">{s.business_name}</div>
                        )}
                        <div className="biz-scenario-name">{s.name}</div>
                      </div>
                      <ScenarioBadge scenario={s} snapshots={smb.snapshots} activeId={smb.activeScenario?.id} generating={smb.generating} />
                    </div>
                    <div className="biz-scenario-meta">{s.sector}{s.geography ? ` · ${s.geography}` : ''}</div>
                  </div>
                ))}
              </div>
            )}

            {smb.scenarios.length > 0 && !showCreateForm && (
              <button className="biz-btn-add" onClick={() => setShowCreateForm(true)}>
                <PlusIcon /> New Scenario
              </button>
            )}
          </div>

          {/* Create form */}
          {showCreateForm && (
            <div className="biz-card">
              <div className="biz-card-title">
                <span className="biz-icon-badge"><FormIcon /></span>
                New Scenario
              </div>

              <div className="biz-create-form">
                <div className="biz-form-field">
                  <div className="biz-form-label">Business name</div>
                  <input
                    className="biz-form-input"
                    placeholder="e.g. Acme Logistics Ltd"
                    value={formData.business_name}
                    onChange={e => handleFormChange('business_name', e.target.value)}
                  />
                  <div className="biz-form-hint">Used to personalise briefs and emails.</div>
                </div>

                <div className="biz-form-field">
                  <div className="biz-form-label">Scenario name</div>
                  <input
                    className="biz-form-input"
                    placeholder="e.g. UK Logistics Weekly"
                    value={formData.name}
                    onChange={e => handleFormChange('name', e.target.value)}
                  />
                </div>

                <div className="biz-form-field">
                  <div className="biz-form-label">Sector</div>
                  <input
                    className="biz-form-input"
                    placeholder="logistics, fintech, retail…"
                    value={formData.sector}
                    onChange={e => handleFormChange('sector', e.target.value)}
                  />
                </div>

                <div className="biz-form-field">
                  <div className="biz-form-label">Geography</div>
                  <input
                    className="biz-form-input"
                    placeholder="UK"
                    value={formData.geography}
                    onChange={e => handleFormChange('geography', e.target.value)}
                  />
                </div>

                <div className="biz-form-field">
                  <div className="biz-form-label">Keywords to track</div>
                  <input
                    className="biz-form-input"
                    placeholder="freight, supply chain, tariffs"
                    value={formData.keyword_filters}
                    onChange={e => handleFormChange('keyword_filters', e.target.value)}
                  />
                  <div className="biz-form-hint">Comma-separated — used to score topic relevance.</div>
                </div>

                <div className="biz-form-field">
                  <div className="biz-form-label">Competitors (optional)</div>
                  <input
                    className="biz-form-input"
                    placeholder="DHL, FedEx"
                    value={formData.competitor_names}
                    onChange={e => handleFormChange('competitor_names', e.target.value)}
                  />
                </div>

                <div className="biz-form-actions">
                  <button
                    className="biz-btn biz-btn-primary biz-btn-sm"
                    onClick={handleCreateSubmit}
                    disabled={smb.creating || !formData.name.trim() || !formData.sector.trim()}
                  >
                    {smb.creating ? 'Creating…' : 'Create'}
                  </button>
                  <button className="biz-btn biz-btn-ghost biz-btn-sm" onClick={handleCancelCreate}>
                    Cancel
                  </button>
                </div>

                {smb.createError && (
                  <div className="biz-error-msg">{smb.createError}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT COLUMN ═════════════════════════════════════ */}
        <div className="biz-right-col">

          {/* No scenario selected */}
          {!smb.activeScenario && (
            <div className="biz-card">
              <div className="biz-empty">
                <div className="biz-empty-icon">👈</div>
                <div className="biz-empty-title">Select a scenario</div>
                <div className="biz-empty-sub">Choose a scenario from the left to see its brief and history.</div>
              </div>
            </div>
          )}

          {/* Active scenario content */}
          {smb.activeScenario && (
            <>
              {/* Pending snapshot review */}
              {smb.snapshotsLoading && (
                <div className="biz-card">
                  <div style={{ fontSize:'0.83rem', color:'#64748B' }}>Loading brief…</div>
                </div>
              )}

              {!smb.snapshotsLoading && !smb.pendingSnapshot && smb.approvedSnapshots.length === 0 && (
                <div className="biz-card">
                  <EmptySnapshot
                    scenarioName={smb.activeScenario.business_name || smb.activeScenario.name}
                    onGenerate={handleGenerate}
                    generating={smb.generating}
                  />
                </div>
              )}

              {smb.pendingSnapshot && (
                <SnapshotReviewCard
                  snapshot={smb.pendingSnapshot}
                  scenario={smb.activeScenario}
                  actionLoading={smb.actionLoading}
                  snapshotNote={snapshotNote}
                  setSnapshotNote={setSnapshotNote}
                  savingNote={savingNote}
                  onSaveNote={handleSaveNote}
                  onApprove={() => smb.approveSnapshot(smb.pendingSnapshot.id)}
                  onDismiss={() => smb.dismissSnapshot(smb.pendingSnapshot.id)}
                  onDownload={(fmt) => smb.downloadSnapshot(smb.pendingSnapshot.id, fmt)}
                />
              )}

              {/* Generate card */}
              <div className="biz-card">
                <div className="biz-card-title">
                  <span className="biz-icon-badge"><ZapIcon /></span>
                  Generate Brief
                </div>

                {smb.generating ? (
                  <div className="biz-generate-row">
                    <button className="biz-btn biz-btn-ghost" disabled>Generating…</button>
                    <div className="biz-spinner" />
                    <span className="biz-generate-meta">Running Analyst → Strategist → Critic…</span>
                  </div>
                ) : (
                  <div className="biz-generate-row">
                    <button className="biz-btn biz-btn-primary" onClick={handleGenerate}>
                      <ZapIcon /> Generate this week's brief
                    </button>
                    {smb.activeScenario.last_run_at && (
                      <span className="biz-generate-meta">
                        Last run: {fmtDate(smb.activeScenario.last_run_at)}
                      </span>
                    )}
                  </div>
                )}

                {smb.generateError && (
                  <div className="biz-error-msg">{smb.generateError}</div>
                )}
              </div>

              {/* History */}
              {smb.approvedSnapshots.length > 0 && (
                <div className="biz-card">
                  <div className="biz-card-title">
                    <span className="biz-icon-badge"><CalendarIcon /></span>
                    Brief History
                  </div>

                  <div className="biz-section-label">Approved snapshots</div>

                  {smb.approvedSnapshots.map(snap => (
                    <div key={snap.id} className="biz-history-item">
                      <div>
                        <div className="biz-history-week">Week of {fmtWeek(snap.week_of)}</div>
                        <div className="biz-history-sub">
                          {snap.has_docx && snap.has_pdf ? 'DOCX + PDF' : snap.has_pdf ? 'PDF' : 'DOCX'}
                        </div>
                      </div>
                      <div className="biz-history-meta">
                        {snap.owner_note && (
                          <span className="biz-note-chip" title={snap.owner_note}>
                            💬 {snap.owner_note}
                          </span>
                        )}
                        <span className="biz-badge biz-badge-approved">Approved</span>
                        <button
                          className="biz-btn biz-btn-ghost biz-btn-sm"
                          onClick={() => smb.downloadSnapshot(snap.id, 'pdf')}
                          title="Download PDF"
                        >
                          <DownloadIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Sticky Notes widget (passes notes props from hook) ── */}
      <StickyNotes
        notes={smb.notes}
        notesLoading={smb.notesLoading}
        createNote={smb.createNote}
        deleteNote={smb.deleteNote}
        loadNotes={smb.loadNotes}
      />
    </div>
  );
}

/* ─── Snapshot review card (sub-component) ──────────────────── */
function SnapshotReviewCard({
  snapshot, scenario,
  actionLoading, snapshotNote, setSnapshotNote,
  savingNote, onSaveNote, onApprove, onDismiss, onDownload,
}) {
  const isActing = actionLoading === snapshot.id;

  return (
    <div className="biz-snapshot-card">
      <div className="biz-snapshot-header">
        <div>
          {scenario.business_name && (
            <div className="biz-snapshot-business">{scenario.business_name}</div>
          )}
          <div className="biz-snapshot-title">{scenario.name} — Weekly Brief</div>
          <div className="biz-snapshot-week">Week of {fmtWeek(snapshot.week_of)} · Ready for review</div>
        </div>
        <span className="biz-badge biz-badge-pending">Review ready</span>
      </div>

      {/* Key shifts */}
      {snapshot.key_shifts?.length > 0 && (
        <div className="biz-shifts-block">
          <div className="biz-shifts-label">What changed this week</div>
          {snapshot.key_shifts.map((s, i) => (
            <div key={i} className="biz-shift-item">
              <span className="biz-shift-dot">›</span>
              {s}
            </div>
          ))}
        </div>
      )}

      {/* Summary bullets */}
      {snapshot.summary_bullets?.length > 0 && (
        <>
          <div className="biz-section-label">Executive Summary</div>
          <ul className="biz-bullets-list">
            {snapshot.summary_bullets.map((b, i) => (
              <li key={i}>
                <span className="biz-bullet-index">{i + 1}</span>
                {b}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Owner note */}
      <div className="biz-section-label">Add a note to this brief</div>
      <div className="biz-note-row">
        <input
          className="biz-note-input"
          placeholder="e.g. Jet fuel angle is relevant — follow up with ops team"
          value={snapshotNote}
          onChange={e => setSnapshotNote(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSaveNote(); }}
        />
        <button
          className="biz-btn biz-btn-ghost biz-btn-sm"
          onClick={onSaveNote}
          disabled={savingNote}
        >
          {savingNote ? '…' : 'Save'}
        </button>
      </div>

      {/* Actions */}
      <div className="biz-snap-actions">
        <button
          className="biz-btn biz-btn-success"
          onClick={onApprove}
          disabled={isActing}
        >
          <CheckIcon />
          Approve &amp; Save
        </button>

        <button
          className="biz-btn biz-btn-ghost"
          onClick={() => onDownload('pdf')}
        >
          <BriefIcon />
          Full Brief
        </button>

        <button
          className="biz-btn biz-btn-ghost biz-btn-sm"
          onClick={() => onDownload('pdf')}
          title="Download PDF"
        >
          <DownloadIcon /> PDF
        </button>

        <button
          className="biz-btn biz-btn-ghost biz-btn-sm"
          onClick={() => onDownload('docx')}
          title="Download DOCX"
        >
          <DownloadIcon /> DOCX
        </button>

        <button
          className="biz-btn biz-btn-danger biz-btn-sm"
          onClick={onDismiss}
          disabled={isActing}
        >
          <CloseSmIcon />
          Dismiss
        </button>
      </div>
    </div>
  );
}

/* ─── Scenario badge (derives from snapshots) ────────────────── */
function ScenarioBadge({ scenario, snapshots, activeId, generating }) {
  if (generating && scenario.id === activeId) {
    return <span className="biz-badge biz-badge-running">Generating…</span>;
  }
  const pending = snapshots.some(s => s.status === 'ready_for_review');
  if (pending && scenario.id === activeId) {
    return <span className="biz-badge biz-badge-pending">Review ready</span>;
  }
  const hasApproved = snapshots.some(s => s.status === 'approved');
  if (hasApproved && scenario.id === activeId) {
    return <span className="biz-badge biz-badge-approved">Up to date</span>;
  }
  return null;
}