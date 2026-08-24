// FMP Home — Header, Hero, Courses
const { useState, useEffect } = React;

const NAV = ['Sobre a FMP', 'Ensino', 'Pesquisa', 'Extensão', 'Portais'];

function Header() {
  const [docked, setDocked] = useState(false);
  useEffect(() => {
    const el = document.querySelector('#scroll-root');
    const on = () => setDocked((el ? el.scrollTop : 0) > 540);
    el && el.addEventListener('scroll', on);
    return () => el && el.removeEventListener('scroll', on);
  }, []);
  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60, padding: docked ? '0' : '20px 24px', transition: 'padding .35s var(--ease)' }}>
      <div style={{
        maxWidth: docked ? '100%' : 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: docked ? '16px 48px' : '12px 16px 12px 26px',
        background: docked ? 'rgba(13,11,12,.92)' : 'rgba(13,11,12,.5)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderRadius: docked ? 0 : 999,
        border: docked ? '1px solid rgba(191,186,164,.14)' : '1px solid rgba(239,238,234,.16)',
        boxShadow: docked ? 'none' : '0 14px 40px rgba(0,0,0,.35)',
        transition: 'all .35s var(--ease)',
      }}>
        <Logo height={30} ground="dark" />
        <nav style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
          {NAV.map(n => (
            <a key={n} href="#" style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500, color: '#EFEEEA', textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--fmp-red)'} onMouseLeave={e => e.currentTarget.style.color = '#EFEEEA'}>{n}</a>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <button style={{ background: 'transparent', border: 0, cursor: 'pointer', display: 'flex', color: '#EFEEEA' }}><Icon name="search" size={20} color="#EFEEEA" /></button>
          <Btn size="sm" icon={null} style={{ paddingRight: 22, paddingLeft: 22 }}>Área do Aluno</Btn>
        </div>
      </div>
    </header>
  );
}

const SLIDES = [
  { kicker: 'Vestibular 2026/2', title: 'Graduação em Direito', copy: 'Matricule-se agora e tenha a oportunidade de ganhar uma Especialização ao final do curso.', cta: 'Inscreva-se', img: 'photo-grad.jpg' },
  { kicker: 'Pós-graduação', title: 'Cursos de Especialização', copy: 'Conheça os cursos da FMP e se aprofunde nas áreas do Direito com quem atua e vive os desafios reais da carreira jurídica.', cta: 'Ver especializações', img: 'photo-espec-wide.jpg' },
  { kicker: 'Aperfeiçoamento', title: 'Direito Eleitoral', copy: 'Curso de aperfeiçoamento e capacitação prática para atuar com mais segurança nas eleições contemporâneas.', cta: 'Saiba mais', img: 'photo-grad.jpg' },
];

function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(v => (v + 1) % SLIDES.length), 6000); return () => clearInterval(t); }, []);
  const s = SLIDES[i];
  return (
    <section style={{ position: 'relative', height: '100vh', minHeight: 620, overflow: 'hidden', background: '#0D0B0C' }}>
      {SLIDES.map((sl, k) => (
        <img key={k} src={`${ASSETS}/${sl.img}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 14%', opacity: k === i ? 1 : 0, transition: 'opacity .8s var(--ease)' }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(95deg, rgba(13,11,12,.9) 0%, rgba(13,11,12,.55) 42%, rgba(13,11,12,.15) 72%)' }} />
      <Container style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 60 }}>
        <div key={i} style={{ maxWidth: 620, animation: 'fadeUp .6s var(--ease)' }}>
          <Eyebrow dark style={{ color: 'var(--fmp-red)' }}>{s.kicker}</Eyebrow>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 68, lineHeight: 1.02, color: '#fff', margin: '18px 0 0' }}>{s.title}</h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 19, lineHeight: 1.55, color: 'rgba(239,238,234,.85)', margin: '22px 0 0', maxWidth: 520 }}>{s.copy}</p>
          <div style={{ marginTop: 34 }}><Btn size="lg">{s.cta}</Btn></div>
        </div>
      </Container>
      {/* dots */}
      <Container style={{ position: 'absolute', left: 0, right: 0, bottom: 34, display: 'flex', gap: 10 }}>
        {SLIDES.map((_, k) => (
          <button key={k} onClick={() => setI(k)} style={{ width: k === i ? 34 : 12, height: 6, borderRadius: 999, border: 0, cursor: 'pointer', background: k === i ? 'var(--fmp-red)' : 'rgba(239,238,234,.4)', transition: 'all .3s' }} />
        ))}
      </Container>
    </section>
  );
}

const COURSES = [
  { t: 'Graduação', d: 'Bacharelado em Direito · 5 anos · Presencial', img: 'photo-grad.jpg', big: true },
  { t: 'Especialização', d: 'Pós-graduação · Presencial e EaD', img: 'kv-espec.jpg' },
  { t: 'Mestrado', d: 'Stricto sensu · Pesquisa jurídica', img: 'kv-graduacao-2.jpg' },
  { t: 'Preparatório', d: 'Concursos e OAB', img: 'photo-grad.jpg' },
  { t: 'Aperfeiçoamento', d: 'Cursos livres e capacitação', img: 'kv-essencial.jpg' },
];

function CourseStrip({ c }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ position: 'relative', height: 96, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', flex: 'none' }}>
      <img src={`${ASSETS}/${c.img}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%', transform: h ? 'scale(1.05)' : 'scale(1)', transition: 'transform .5s var(--ease)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(13,11,12,.85), rgba(13,11,12,.3))' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 22, color: '#fff' }}>{c.t}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'rgba(239,238,234,.7)', marginTop: 3 }}>{c.d}</div>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 600, opacity: h ? 1 : .75, transition: 'opacity .2s' }}>Saiba mais <Icon name="arrow" size={15} color="#fff" /></span>
      </div>
    </div>
  );
}

function Courses() {
  const big = COURSES[0];
  return (
    <section style={{ background: '#fff', padding: '84px 0' }}>
      <Container>
        <Eyebrow>Conheça nossos cursos</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 24, marginTop: 26, alignItems: 'stretch' }}>
          <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', minHeight: 440 }}>
            <img src={`${ASSETS}/${big.img}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 12%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(13,11,12,.9) 8%, rgba(13,11,12,.1) 60%)' }} />
            <Sparkle size={40} style={{ position: 'absolute', top: 26, right: 26 }} />
            <div style={{ position: 'absolute', left: 34, right: 34, bottom: 34 }}>
              <Eyebrow dark style={{ color: 'var(--fmp-sand)' }}>Presencial · Porto Alegre</Eyebrow>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 46, color: '#fff', margin: '10px 0 16px', lineHeight: 1 }}>Graduação em Direito</div>
              <Btn>Solicite informações</Btn>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {COURSES.slice(1).map(c => <CourseStrip key={c.t} c={c} />)}
          </div>
        </div>
      </Container>
    </section>
  );
}

Object.assign(window, { Header, Hero, Courses });
