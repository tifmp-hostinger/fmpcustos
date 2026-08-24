// FMP Home — Differentials, OAB seal, Authority, Prestige
const DIFFS = [
  { t: 'Reputação acadêmica', d: 'Nota máxima na avaliação (5) institucional do MEC.', red: true },
  { t: 'Especialização Absoluta', d: 'Foco exclusivo no Direito, garantindo profundidade, coerência e liderança intelectual.', red: false },
  { t: 'Autoridade Institucional', d: 'Formadora de 91% dos promotores do MP-RS, com legitimidade sistêmica sem paralelos.', red: false },
  { t: 'Docentes Protagonistas', d: 'Professores que atuam nas estruturas reais do sistema jurídico brasileiro.', red: true },
  { t: 'Quadrilátero Jurídico', d: 'Inserção física no centro institucional do Direito, potencializando vivência e conexão.', red: false },
  { t: 'Tecnologia Aplicada', d: 'Infraestrutura digital que amplia o ensino sem perder a experiência presencial.', red: false },
  { t: 'Tradição Evolutiva', d: 'Mais de 40 anos de história aliando permanência institucional e inovação contínua.', red: true },
];

function DiffCard({ c }) {
  const [h, setH] = React.useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ flex: 'none', width: 340, minHeight: 260, borderRadius: 24, padding: '30px 30px 34px', boxSizing: 'border-box',
        background: h ? 'var(--fmp-red)' : 'var(--fmp-cream)', border: h ? 'none' : '1px solid var(--fmp-line)',
        boxShadow: h ? 'var(--shadow-lg)' : 'var(--shadow-sm)', transform: h ? 'translateY(-4px)' : 'none', transition: 'all .28s var(--ease)',
        display: 'flex', flexDirection: 'column' }}>
      <Sparkle variant={h ? 'white' : 'red'} size={30} />
      <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 27, lineHeight: 1.08, color: h ? '#fff' : 'var(--fmp-black)', margin: '20px 0 0', transition: 'color .28s var(--ease)' }}>{c.t}</h3>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.55, color: h ? 'rgba(255,255,255,.9)' : 'var(--fmp-ink-2)', margin: '14px 0 0', transition: 'color .28s var(--ease)' }}>{c.d}</p>
    </div>
  );
}

function Differentials() {
  const scroller = React.useRef(null);
  const scroll = d => scroller.current && scroller.current.scrollBy({ left: d * 364, behavior: 'smooth' });
  return (
    <section style={{ background: '#fff', padding: '40px 0 90px' }}>
      <Container>
        <SectionTitle size={44}>A diferença começa na escolha</SectionTitle>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 18, lineHeight: 1.6, color: 'var(--fmp-ink-2)', margin: '20px 0 0', maxWidth: 760 }}>
          O <strong style={{ fontWeight: 600, color: 'var(--fmp-black)' }}>Quadrilátero Jurídico</strong> de Porto Alegre concentra TJRS, Ministério Público, OAB/RS e Defensoria Pública ao redor da FMP. Você estuda no epicentro das decisões que moldam o Direito no Rio Grande do Sul.
        </p>
        <div ref={scroller} style={{ display: 'flex', gap: 24, marginTop: 34, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
          {DIFFS.map(c => <DiffCard key={c.t} c={c} />)}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
          <button onClick={() => scroll(-1)} style={navBtn}><Icon name="chevronL" size={20} color="var(--fmp-black)" /></button>
          <button onClick={() => scroll(1)} style={{ ...navBtn, background: 'var(--fmp-red)', borderColor: 'var(--fmp-red)' }}><Icon name="chevronR" size={20} color="#fff" /></button>
        </div>
      </Container>
    </section>
  );
}
const navBtn = { width: 52, height: 52, borderRadius: 999, border: '1.5px solid var(--fmp-line-2)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

function Oab() {
  return (
    <section style={{ background: '#0D0B0C', position: 'relative', overflow: 'hidden', padding: '90px 0' }}>
      <svg viewBox="0 0 1440 500" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true"><path d="M-40 520 A 620 620 0 0 1 560 -40" fill="none" stroke="rgba(238,42,66,.35)" strokeWidth="1.5"/></svg>
      <Container style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 64, alignItems: 'center' }}>
        <div style={{ position: 'relative', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 300, color: 'var(--fmp-red)', lineHeight: .8 }}>4</span>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 190, color: 'var(--fmp-red)', lineHeight: .8, alignSelf: 'flex-end', marginLeft: -10 }}>x</span>
          <img src={`${ASSETS}/selo-oab.png`} alt="OAB Recomenda" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(10%, -60%)', height: 130 }} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 46, lineHeight: 1.02, color: 'var(--fmp-red)', margin: 0 }}>Selo OAB Recomenda</h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 17, lineHeight: 1.65, color: 'var(--fmp-cream)', margin: '20px 0 0', maxWidth: 540 }}>
            A FMP é a única Faculdade Privada do Estado a contar com o selo OAB Recomenda por quatro vezes consecutivas — a maior distinção de qualidade de ensino para cursos de graduação em Direito no país.
          </p>
          <a href="#" style={{ display: 'inline-block', marginTop: 26, fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--fmp-cream)', textDecoration: 'underline', textUnderlineOffset: 4, textDecorationThickness: '1.5px' }}>Veja nossos reconhecimentos</a>
        </div>
      </Container>
    </section>
  );
}

function Authority() {
  return (
    <section style={{ background: '#fff', padding: '90px 0' }}>
      <Container>
        <Eyebrow>Autoridade em ensino jurídico</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 26 }}>
          <div style={{ background: 'var(--fmp-red)', borderRadius: 24, padding: '48px 44px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <Sparkle variant="white" size={40} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 40, lineHeight: 1.05, margin: '20px 0 0' }}>O Direito transforma.<br/>E você também.</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16.5, lineHeight: 1.6, color: 'rgba(255,255,255,.9)', margin: '18px 0 30px', maxWidth: 440 }}>Na FMP, acreditamos no poder de quem escolhe ir além da teoria. Aqui, formamos protagonistas: pessoas que vivem o Direito com ética, senso crítico e impacto.</p>
            <Btn variant="dark">Conheça nossa graduação</Btn>
          </div>
          <div style={{ background: 'var(--fmp-cream)', border: '1px solid var(--fmp-line)', borderRadius: 24, padding: '48px 44px', position: 'relative' }}>
            <Eyebrow>Especialização EaD</Eyebrow>
            <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 36, lineHeight: 1.06, color: 'var(--fmp-black)', margin: '16px 0 0' }}>Construa sua autoridade no Direito</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: 1.6, color: 'var(--fmp-ink-2)', margin: '16px 0 30px' }}>Mais do que um certificado: aprofunde-se, amplie repertório e torne-se referência na sua área — com a liberdade do EaD e a credibilidade de uma instituição recomendada pela OAB.</p>
            <Btn variant="ghost">Ver cursos disponíveis</Btn>
          </div>
        </div>
      </Container>
    </section>
  );
}

const STAMPS = ['selo-oab.png', 'selo-mec.png', 'selo-enade.png', 'selo-iae.png', 'selo-responsavel.png'];
function Prestige() {
  return (
    <section style={{ background: '#fff', padding: '84px 0' }}>
      <Container style={{ textAlign: 'center' }}>
        <SectionTitle size={40} style={{ justifyContent: 'center' }}>Um prestígio raro</SectionTitle>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 18, color: 'var(--fmp-ink-2)', margin: '16px auto 0', maxWidth: 560 }}>Excelência validada por quem regula e por quem escolhe.</p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, marginTop: 44, flexWrap: 'wrap' }}>
          {STAMPS.map(s => <img key={s} src={`${ASSETS}/${s}`} alt="" style={{ height: 120 }} />)}
        </div>
      </Container>
    </section>
  );
}

Object.assign(window, { Differentials, Oab, Authority, Prestige });
