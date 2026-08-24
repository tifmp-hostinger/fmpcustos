// FMP Website — Prestige band (dark "Especializações" treatment) + 40-anos stats
const Prestige = ({ onCTA }) => (
  <section style={{ background: '#0D0B0C', position: 'relative', overflow: 'hidden' }}>
    {/* corner red glow + tracing arc */}
    <div style={{ position: 'absolute', top: -160, left: -160, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(238,42,66,.42), transparent 65%)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', right: -200, bottom: -200, width: 560, height: 560, border: '1px solid rgba(238,42,66,.5)', borderRadius: '50%', pointerEvents: 'none' }} />
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '88px 40px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.85fr', gap: 64, alignItems: 'center' }}>
        <div>
          <Eyebrow dark>Especializações FMP</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 56, lineHeight: 1.04, margin: '16px 0 0', color: 'var(--fmp-cream)' }}>
            Prestígio se constrói.<br /><span style={{ color: 'var(--fmp-red)', fontWeight: 700 }}>Com especialistas.</span>
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 17, lineHeight: 1.65, color: 'var(--fmp-on-dark-2)', margin: '24px 0 0', maxWidth: 460 }}>
            Pós-graduações conduzidas por quem vive o Direito na prática — magistrados, promotores e advogados em exercício. Sem perder o essencial.
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 34 }}>
            <Button size="lg" onClick={onCTA}>Ver especializações <Icon name="arrow" size={18} color="#fff" /></Button>
            <Button size="lg" variant="ghost" dark>Modalidade Presencial</Button>
          </div>
        </div>
        {/* stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--fmp-dark-line)', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--fmp-dark-line)' }}>
          {[['+40', 'anos de tradição jurídica'], ['100%', 'corpo docente em exercício'], ['Nota', 'Máxima no MEC'], ['Porto', 'Alegre · epicentro jurídico']].map(([n, l], i) => (
            <div key={i} style={{ background: '#0D0B0C', padding: '30px 26px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 42, color: 'var(--fmp-red)', lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--fmp-on-dark-2)', marginTop: 8, lineHeight: 1.4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
Object.assign(window, { Prestige });
