// FMP Website — Courses grid with interactive category filter
const COURSES = [
  { cat: 'Graduação', title: 'Direito', meta: 'Bacharelado · 5 anos · Presencial', tag: 'Inscrições Abertas', dark: false },
  { cat: 'Especialização', title: 'Direito de Família e Sucessões', meta: 'Pós-graduação · Presencial · 2026', tag: 'Nova turma', dark: true },
  { cat: 'Especialização', title: 'Direito Civil e Processo Civil', meta: 'Pós-graduação · Presencial', tag: 'Modalidade Presencial', dark: true },
  { cat: 'Especialização', title: 'Direito Público', meta: 'Pós-graduação · Presencial', tag: null, dark: true },
  { cat: 'Extensão', title: 'IA & Direito', meta: 'Curso livre · Online · 40h', tag: 'Online', dark: false },
  { cat: 'Extensão', title: 'Compliance e LGPD', meta: 'Curso livre · Online · 30h', tag: null, dark: false },
];

const CourseCard = ({ c }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 24, overflow: 'hidden', cursor: 'pointer',
        background: c.dark ? '#0D0B0C' : '#fff',
        border: c.dark ? '1px solid var(--fmp-dark-line)' : '1px solid var(--fmp-line)',
        boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transform: hover ? 'translateY(-4px)' : 'none', transition: 'all .28s var(--ease)',
        display: 'flex', flexDirection: 'column',
      }}>
      <div style={{
        height: 92, position: 'relative', display: 'flex', alignItems: 'center', padding: '0 22px',
        background: c.dark ? 'linear-gradient(120deg,#3a0c14,#0D0B0C 70%)' : 'var(--fmp-red)',
      }}>
        <Eyebrow dark style={{ color: c.dark ? 'var(--fmp-sand)' : 'rgba(255,255,255,.92)' }}>{c.cat}</Eyebrow>
        <Sparkle variant={c.dark ? 'red' : 'white'} size={26} style={{ position: 'absolute', right: 20, top: 18, transition: 'transform .4s var(--ease)', transform: hover ? 'rotate(90deg)' : 'none' }} />
      </div>
      <div style={{ padding: '20px 22px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 23, margin: 0, color: c.dark ? 'var(--fmp-cream)' : 'var(--fmp-black)', lineHeight: 1.1 }}>{c.title}</h3>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, margin: '8px 0 0', color: c.dark ? 'var(--fmp-on-dark-2)' : 'var(--fmp-ink-3)' }}>{c.meta}</p>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
          {c.tag
            ? <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', padding: '5px 12px', borderRadius: 999, background: c.dark ? 'var(--fmp-sand)' : 'var(--fmp-red-tint)', color: c.dark ? '#191818' : 'var(--fmp-red)' }}>{c.tag}</span>
            : <span />}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: c.dark ? 'var(--fmp-cream)' : 'var(--fmp-red)' }}>
            Ver curso <Icon name="arrow" size={15} color={c.dark ? '#EFEEEA' : '#EE2A42'} />
          </span>
        </div>
      </div>
    </div>
  );
};

const Courses = () => {
  const cats = ['Todos', 'Graduação', 'Especialização', 'Extensão'];
  const [active, setActive] = React.useState('Todos');
  const list = active === 'Todos' ? COURSES : COURSES.filter(c => c.cat === active);
  return (
    <section style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 40px 90px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 18 }}>
        <div style={{ flex: '1 1 360px' }}>
          <Eyebrow>Nossos cursos</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 44, margin: '10px 0 0', color: 'var(--fmp-black)', lineHeight: 1 }}>
            A casa de quem faz <strong style={{ fontWeight: 700 }}>Direito</strong>.
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {cats.map(cat => (
            <button key={cat} onClick={() => setActive(cat)} style={{
              fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
              padding: '9px 18px', borderRadius: 999, transition: 'all .2s',
              border: `1.5px solid ${active === cat ? 'var(--fmp-red)' : 'var(--fmp-line-2)'}`,
              background: active === cat ? 'var(--fmp-red)' : 'transparent',
              color: active === cat ? '#fff' : 'var(--fmp-ink-2)',
            }}>{cat}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {list.map((c, i) => <CourseCard key={c.title} c={c} />)}
      </div>
    </section>
  );
};
Object.assign(window, { Courses, CourseCard });
