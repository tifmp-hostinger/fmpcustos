// FMP Website — Hero (cream ground, serif-italic headline, photo w/ soft-superellipse mask)
const Hero = ({ onCTA }) => (
  <section style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', padding: '40px 40px 80px', overflow: 'hidden' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 56, alignItems: 'center' }}>
      {/* Left: copy */}
      <div style={{ position: 'relative' }}>
        <Pill variant="out-dark" style={{ marginBottom: 26 }}>Graduação FMP</Pill>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500,
          fontSize: 68, lineHeight: 1.0, letterSpacing: '-.01em', margin: 0, color: 'var(--fmp-black)',
        }}>
          Você escolheu<br />o <strong style={{ fontWeight: 700 }}>Direito</strong>.<br />
          <span style={{ color: 'var(--fmp-red)' }}>Nós também.</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 18, lineHeight: 1.6, color: 'var(--fmp-ink-2)', margin: '26px 0 0', maxWidth: 440 }}>
          <strong style={{ fontWeight: 600 }}>Professores em exercício</strong> no{' '}
          <a className="fmp-link" href="#" style={{ color: 'var(--fmp-black)' }}>epicentro jurídico</a> de Porto Alegre.
          Foco exclusivo em Direito, há mais de 40 anos.
        </p>
        <div style={{ display: 'flex', gap: 14, marginTop: 32, alignItems: 'center' }}>
          <Button size="lg" onClick={onCTA}>Vestibular 2026 <Icon name="arrow" size={18} color="#fff" /></Button>
          <Button size="lg" variant="ghost">Conheça o curso</Button>
        </div>
        <div style={{ display: 'flex', gap: 22, marginTop: 44, alignItems: 'center' }}>
          <img src="../../assets/selo-oab.png" alt="OAB Recomenda 4x consecutivas" style={{ height: 78, width: 'auto', display: 'block' }} />
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fmp-ink-3)', lineHeight: 1.5 }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, color: 'var(--fmp-black)' }}>4x consecutivas</strong><br />
            recomendada pela OAB · Nota Máxima MEC
          </div>
        </div>
      </div>
      {/* Right: photo with large soft-superellipse mask */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'relative', zIndex: 1, borderRadius: '44px 44px 12px 44px', overflow: 'hidden',
          aspectRatio: '4/5', boxShadow: 'var(--shadow-lg)',
        }}>
          <img src="../../assets/kv-graduacao-1.jpg" alt="Estudante de Direito FMP" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 12%', display: 'block' }} />
        </div>
      </div>
    </div>
  </section>
);
Object.assign(window, { Hero });
