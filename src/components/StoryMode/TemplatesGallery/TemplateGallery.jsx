import React from 'react';
import cardCss from './TemplateCard.module.css';
import gridCss from './TemplatesGallery.module.css';

export default function TemplatesGallery({ templates, loading, error, onUseTemplate, onCreateBlank, gated }) {
  return (
    <section className={gridCss.section}>
      <div className={gridCss.gridHeader}>
        <h2>Start Your Story</h2>
        <div className={gridCss.actions}>
          <button className={gridCss.blankBtn} onClick={onCreateBlank}>Create from blank</button>
        </div>
      </div>

      {loading && <div className={gridCss.info}>Loading templates…</div>}
      {error && <div className={gridCss.error}>⚠ {error}</div>}
      {!loading && !error && !templates?.length && (
        <div className={gridCss.info}>No templates yet.</div>
      )}

      <div className={gridCss.grid}>
        {(templates || []).map(t => (
          <article key={t.id} className={cardCss.card} role="button" tabIndex={0}
                   onClick={() => onUseTemplate(t)} onKeyDown={e=> (e.key==='Enter') && onUseTemplate(t)}>
            <div className={cardCss.thumb} aria-hidden>{(t.category || 'Story').toUpperCase()}</div>
            <div className={cardCss.pill}>{t.preset_era || 'Custom era'}</div>
            <div className={cardCss.body}>
              <div className={cardCss.title}>{t.title}</div>
              <div className={cardCss.desc}>{t.description}</div>
              <div className={cardCss.meta}>
                {t.difficulty && <span className={cardCss.badge}>{t.difficulty}</span>}
                {typeof t.usage_count === 'number' && <span className={cardCss.badge}>{t.usage_count} used</span>}
              </div>
              <div className={cardCss.row}>
                <button className={cardCss.btn} onClick={(e)=>{e.stopPropagation(); onUseTemplate(t);}}>
                  {gated ? 'Preview' : 'Use template'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {gated && (
        <div className={gridCss.note}>
          You’re on the Free plan. You can preview templates, but starting a story requires an upgrade.
        </div>
      )}
    </section>
  );
}
