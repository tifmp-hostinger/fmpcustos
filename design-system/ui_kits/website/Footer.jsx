// FMP Website — Footer
const Footer = () => {
  const cols = [
    ['Ensino', ['Graduação em Direito', 'Especializações', 'Cursos de Extensão', 'Pesquisa & Mestrado']],
    ['A FMP', ['Sobre a Fundação', 'Corpo docente', 'Infraestrutura', 'Trabalhe conosco']],
    ['Recursos', ['Blog jurídico', 'Ebooks', 'Biblioteca', 'Portal do aluno']],
  ];
  return (
    <footer style={{ background: '#191818', color: 'var(--fmp-cream)' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 40px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40 }}>
          <div>
            <LogoLockup variant="white" height={30} divider={false} />
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--fmp-on-dark-2)', lineHeight: 1.6, marginTop: 20, maxWidth: 260 }}>
              A casa de quem faz Direito. Há mais de 40 anos no epicentro jurídico de Porto Alegre.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 22 }}>
              <img src="../../assets/selo-oab.png" alt="OAB Recomenda" style={{ height: 72, width: 'auto', display: 'block' }} />
              <img src="../../assets/selo-mec.png" alt="Nota Máxima no MEC" style={{ height: 72, width: 'auto', display: 'block' }} />
            </div>
          </div>
          {cols.map(([h, items]) => (
            <div key={h}>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--fmp-sand)', marginBottom: 16 }}>{h}</div>
              {items.map(it => (
                <a key={it} href="#" style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fmp-cream)', textDecoration: 'none', padding: '6px 0', opacity: .82 }}
                  onMouseEnter={e => { e.target.style.color = 'var(--fmp-red)'; e.target.style.opacity = 1; }}
                  onMouseLeave={e => { e.target.style.color = 'var(--fmp-cream)'; e.target.style.opacity = .82; }}>{it}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--fmp-dark-line)', marginTop: 48, paddingTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--fmp-on-dark-2)' }}>© 2026 Fundação Escola Superior do Ministério Público · Porto Alegre, RS</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--fmp-on-dark-2)' }}>
            <Sparkle variant="red" size={14} /> Foco exclusivo em Direito
          </span>
        </div>
      </div>
    </footer>
  );
};
Object.assign(window, { Footer });
