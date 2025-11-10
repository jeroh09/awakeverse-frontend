import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import SubscriptionService from '../../services/SubscriptionService';
import PaymentRouter from '../../services/PaymentRouter';
import { getStoryTemplates, createStory } from '../../api';
import styles from './StoryMode.module.css';

// Minimal card & modal inline for Step 1–2
function TemplateCard({ tpl, onUse }) {
  return (
    <article className={styles.card} onClick={() => onUse(tpl)}>
      <div className={styles.thumb}>{(tpl.category || 'Story').toUpperCase()}</div>
      <div className={styles.pill}>{tpl.preset_era || 'Custom era'}</div>
      <div className={styles.body}>
        <div className={styles.title}>{tpl.title}</div>
        <div className={styles.desc}>{tpl.description}</div>
        <div className={styles.row}>
          <button className={styles.btnPrimary} onClick={(e) => { e.stopPropagation(); onUse(tpl); }}>
            Use template
          </button>
        </div>
      </div>
    </article>
  );
}

function CreatorModal({ open, onClose, template, gated, onSubmit }) {
  const [title, setTitle] = useState('');
  const [characterKey, setCharacterKey] = useState('sherlock');
  const [era, setEra] = useState('');
  const [situation, setSituation] = useState('');
  const [err, setErr] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTitle(template ? `My ${template.title}` : '');
    setCharacterKey(template?.preset_character_key || 'sherlock');
    setEra(template?.preset_era || '');
    setSituation(template?.preset_situation || '');
  }, [template]);

  if (!open) return null;

  const canSubmit = !gated && title.trim() && characterKey && situation.trim();

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setErr(null);
    try {
      const res = await onSubmit({
        title: title.trim(),
        character_key: characterKey,
        starting_situation: situation.trim(),
        template_id: template?.id ?? null,
        custom_era: era?.trim() || undefined
      });
      if (res?.status === 'error') throw new Error(res.error);
      onClose();
      console.info('Story created:', res);
    } catch (e) {
      setErr(e.message || 'Failed to create story');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={() => !submitting && onClose()} />
      <div className={styles.modal} role="dialog" aria-modal="true">
        <header className={styles.hd}>
          <h3>{template ? `${template.title} — Create` : 'Create Story'}</h3>
          <button className={styles.close} onClick={() => !submitting && onClose()}>×</button>
        </header>
        <div className={styles.bd}>
          {gated && <div className={styles.gate}>You’re on the Free plan. Upgrade to start a story.</div>}

          <div className={styles.field}>
            <label className={styles.label}>Title</label>
            <input className={styles.input} value={title} onChange={e=>setTitle(e.target.value)} placeholder="My Victorian Adventure" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Character</label>
            <select className={styles.select} value={characterKey} onChange={e=>setCharacterKey(e.target.value)}>
              <option value="sherlock">Sherlock Holmes</option>
              <option value="watson">Dr. Watson</option>
              <option value="moriarty">Professor Moriarty</option>
              <option value="helen_of_troy">Helen of Troy</option>
              <option value="baba_yaga">Baba Yaga</option>
            </select>
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Era (optional)</label>
              <input className={styles.input} value={era} onChange={e=>setEra(e.target.value)} placeholder="1890s" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Template</label>
              <input className={styles.input} disabled value={template ? `#${template.id}` : '—'} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Starting Situation</label>
            <textarea className={styles.textarea} value={situation} onChange={e=>setSituation(e.target.value)} placeholder="A mysterious letter arrives at Baker Street..." />
          </div>

          {err && <div className={styles.error}>⚠ {err}</div>}
        </div>
        <footer className={styles.ft}>
          <button className={styles.btn} onClick={onClose} disabled={submitting}>Cancel</button>
          <button className={styles.btnGold} onClick={submit} disabled={!canSubmit || submitting}>
            {submitting ? 'Starting…' : 'Start Story'}
          </button>
        </footer>
      </div>
    </>
  );
}

export default function StoryModeTab() {
  const { user } = useUser();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState(null);

  const [creatorOpen, setCreatorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Subscription gate (mirror ScenariosTab)
  const loadSubscriptionData = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const data = await SubscriptionService.getUserSubscriptionStatus(user.id);
      if (data.status === 'success' && data.subscription) {
        setSubscriptionData(data);
        const hasUnlimited =
          data.subscription.tier === 'unlimited' ||
          data.subscription.tier_name === 'unlimited' ||
          data.subscription.unlimited === true;
        setRequiresUpgrade(!hasUnlimited);
      } else {
        const fallback = SubscriptionService.getFallbackSubscriptionData();
        setSubscriptionData(fallback);
        setRequiresUpgrade(true);
      }
    } catch {
      const fallback = SubscriptionService.getFallbackSubscriptionData();
      setSubscriptionData(fallback);
      setRequiresUpgrade(true);
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { loadSubscriptionData(); }, [loadSubscriptionData]);

  // Load templates
  useEffect(() => {
    let mounted = true;
    (async () => {
      setTemplatesLoading(true); setTemplatesError(null);
      const res = await getStoryTemplates();
      if (!mounted) return;
      if (res.status === 'success') setTemplates(res.templates || []);
      else setTemplatesError(res.error || 'Failed to load templates');
      setTemplatesLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const onUseTemplate = (tpl) => { setSelectedTemplate(tpl); setCreatorOpen(true); };
  const onCreateBlank = () => { setSelectedTemplate(null); setCreatorOpen(true); };

  const onSubmitCreate = async (formValues) => {
    const res = await createStory(formValues);
    if (res.status === 'error') throw new Error(res.error);
    // Step 3–4 will open the chat on success
    return res;
  };

  // Payment CTA (same shape used in ScenariosTab)
  const handleUpgradeWithStripe = async () => {
    try {
      await PaymentRouter.redirectToCheckout({
        tier: 'unlimited',
        provider: 'stripe',
        triggerSource: 'story_mode_upgrade_required'
      });
    } catch (e) {
      alert('Unable to redirect to Stripe. Please try again.');
    }
  };

  const handleUpgradeWithPayPal = async () => {
    try {
      await PaymentRouter.redirectToCheckout({
        tier: 'unlimited',
        provider: 'paypal',
        triggerSource: 'story_mode_upgrade_required'
      });
    } catch (e) {
      alert('Unable to redirect to PayPal. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>Loading Story Mode…</p>
      </div>
    );
  }

  const isUnlimited = subscriptionData?.subscription?.tier === 'unlimited' ||
                      subscriptionData?.subscription?.tier_name === 'unlimited' ||
                      subscriptionData?.subscription?.unlimited === true;

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.badge} aria-hidden>★</span>
          <h1>Story Mode</h1>
        </div>
        <div className={styles.subpill}>Plan: <b>{subscriptionData?.subscription?.tier_name || 'Free'}</b></div>
      </header>

      <div className={styles.hint}>
        Pick a template or start from scratch. Era constraints guide actions; they never hard-block.
      </div>

      {/* Controls */}
      <div className={styles.actions}>
        <button className={styles.btn} onClick={onCreateBlank}>Create from blank</button>
      </div>

      {/* Templates grid */}
      {templatesLoading && <div className={styles.info}>Loading templates…</div>}
      {templatesError && <div className={styles.error}>{templatesError}</div>}
      <div className={styles.grid}>
        {(templates || []).map(t => (
          <TemplateCard key={t.id} tpl={t} onUse={onUseTemplate} />
        ))}
      </div>

      {/* Upgrade note */}
      {requiresUpgrade && (
        <div className={styles.note}>
          You can browse templates, but starting a story requires an upgrade.
          <div className={styles.upgradeActions}>
            <button className={styles.btnGold} onClick={handleUpgradeWithStripe}>Upgrade with Stripe</button>
            <button className={styles.btn} onClick={handleUpgradeWithPayPal}>Pay with PayPal</button>
          </div>
        </div>
      )}

      {/* Creator modal */}
      <CreatorModal
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        template={selectedTemplate}
        gated={requiresUpgrade}
        onSubmit={onSubmitCreate}
      />
    </div>
  );
}
