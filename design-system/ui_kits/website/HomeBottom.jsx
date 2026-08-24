// FMP Home — Testimonials, News + Agenda, Contact, Footer
const { useState } = React;

const TESTIMONIALS = [
  { q: 'Superou minhas expectativas. Professores experientes e um ambiente que estimula o pensamento crítico desde o início.', n: 'Matheus Rodrigues', r: 'Graduado em Direito · Atuação em advocacia', img: 'augusto-tanger-jardim.png' },
  { q: 'Estudar na FMP foi decisivo para minha carreira jurídica. Professores qualificados e foco prático fizeram toda a diferença.', n: 'Marina Menezes', r: 'Especialista em Direito Penal · Área criminal', img: 'bruna-razera.png' },
  { q: 'Fundamental para aprofundar minha visão crítica do Direito. Os debates em sala me prepararam para novos desafios.', n: 'Renato Lima', r: 'Mestre em Direito · Pesquisa e docência', img: 'anisio-pires-gaviao-filho.png' },
  { q: 'O preparatório me deu foco, disciplina e conteúdo de alto nível. Foi essencial para minha aprovação.', n: 'Laura Martins', r: 'Aprovada em concurso público', img: 'renata-pozzi-kretzmann.png' },
];

function TestimonialCard({ c }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: h ? 'var(--fmp-red)' : 'var(--fmp-cream)', border: h ? 'none' : '1px solid var(--fmp-line)', borderRadius: 24, padding: '36px 38px', display: 'flex', flexDirection: 'column', boxShadow: h ? 'var(--shadow-lg)' : 'var(--shadow-sm)', transform: h ? 'translateY(-4px)' : 'none', transition: 'all .28s var(--ease)' }}>
      <Sparkle variant={h ? 'white' : 'red'} size={28} />
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: 1.55, color: h ? '#fff' : 'var(--fmp-black)', margin: '20px 0 26px', flex: 1, transition: 'color .28s var(--ease)' }}>"{c.q}"</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <img src={`${ASSETS}/../profs/${c.img}`} alt="" style={{ width: 56, height: 56, borderRadius: 999, objectFit: 'cover', objectPosition: 'center 18%', border: h ? '2px solid #fff' : 'none' }} />
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16, color: h ? '#fff' : 'var(--fmp-black)', transition: 'color .28s var(--ease)' }}>{c.n}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: h ? 'rgba(255,255,255,.85)' : 'var(--fmp-ink-3)', marginTop: 2, transition: 'color .28s var(--ease)' }}>{c.r}</div>
        </div>
      </div>
    </div>
  );
}

function Testimonials() {
  const [i, setI] = useState(0);
  const t = TESTIMONIALS[i];
  return (
    <section style={{ background: '#fff', padding: '90px 0' }}>
      <Container>
        <SectionTitle size={40}>O que nossos ex-alunos dizem</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 40 }}>
          {[TESTIMONIALS[i], TESTIMONIALS[(i + 1) % TESTIMONIALS.length]].map((c, k) => <TestimonialCard key={k} c={c} />)}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 26 }}>
          {TESTIMONIALS.map((_, k) => (
            <button key={k} onClick={() => setI(k)} style={{ width: k === i ? 30 : 10, height: 10, borderRadius: 999, border: 0, cursor: 'pointer', background: k === i ? 'var(--fmp-red)' : 'var(--fmp-line-2)', transition: 'all .3s' }} />
          ))}
        </div>
      </Container>
    </section>
  );
}

const NEWS = [
  { cat: 'Eventos', t: 'FMP e ACADEPOL fortalecem cooperação com novo convênio', d: '16 de julho de 2026', img: 'kv-graduacao-2.jpg' },
  { cat: 'Institucional', t: 'Dr. Frederico Freitas assumirá a coordenação da graduação em Direito', d: '15 de julho de 2026', img: 'photo-grad.jpg' },
  { cat: 'Eventos', t: 'FMP apresenta formações em Direito Eleitoral durante Aula Magna', d: '8 de julho de 2026', img: 'kv-espec.jpg' },
];
const AGENDA = [
  { m: 'JUL', day: '20', t: 'Roda de Conversa | Instrumentos Urbanísticos na Perspectiva da Adaptação Climática', loc: 'Sala 1012 · 10º andar da FMP' },
  { m: 'AGO', day: '20', t: 'Colóquios de Família e Sucessões: Intimidade e Sexualidade dos Filhos na Adolescência', loc: 'Auditório FMP · 6º andar' },
  { m: 'AGO', day: '26', t: 'X EGRUPE | Encontro Interinstitucional de Grupos de Pesquisa', loc: 'YouTube da FMP' },
];

function NewsCard({ n }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ cursor: 'pointer' }}>
      <div style={{ borderRadius: 18, overflow: 'hidden', height: 180 }}>
        <img src={`${ASSETS}/${n.img}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', transform: h ? 'scale(1.05)' : 'scale(1)', transition: 'transform .5s var(--ease)' }} />
      </div>
      <div style={{ marginTop: 16 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--fmp-red)' }}>{n.cat}</span>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 18, lineHeight: 1.3, color: 'var(--fmp-black)', margin: '10px 0 8px' }}>{n.t}</h3>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fmp-ink-3)' }}>{n.d}</div>
      </div>
    </div>
  );
}

function News() {
  return (
    <section style={{ background: '#fff', padding: '90px 0' }}>
      <Container>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 56 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <SectionTitle size={34}>Últimas Notícias</SectionTitle>
              <a href="#" style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--fmp-red)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Veja todas <Icon name="arrow" size={15} color="var(--fmp-red)" /></a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 22, marginTop: 30 }}>
              {NEWS.map(n => <NewsCard key={n.t} n={n} />)}
            </div>
          </div>
          <div>
            <SectionTitle size={34} closeMark={false}>Agenda</SectionTitle>
            <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column' }}>
              {AGENDA.map((a, k) => (
                <div key={k} style={{ display: 'flex', gap: 18, padding: '20px 0', borderTop: '1px solid var(--fmp-line)' }}>
                  <div style={{ flex: 'none', width: 62, textAlign: 'center', background: 'var(--fmp-black)', borderRadius: 12, padding: '10px 0', color: '#fff' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', color: 'var(--fmp-sand)' }}>{a.m}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 26, lineHeight: 1 }}>{a.day}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, lineHeight: 1.35, color: 'var(--fmp-black)' }}>{a.t}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--fmp-ink-3)' }}><Icon name="pin" size={14} color="var(--fmp-ink-3)" /> {a.loc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  const field = (label, ph, type = 'text') => (
    <div>
      <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--fmp-ink-2)', marginBottom: 7 }}>{label}</label>
      <input type={type} placeholder={ph} style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-sans)', fontSize: 15, padding: '14px 16px', border: '1.5px solid var(--fmp-line-2)', borderRadius: 12, background: '#fff', color: 'var(--fmp-black)', outline: 'none' }}
        onFocus={e => { e.target.style.borderColor = 'var(--fmp-red)'; e.target.style.boxShadow = '0 0 0 3px var(--fmp-red-tint)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--fmp-line-2)'; e.target.style.boxShadow = 'none'; }} />
    </div>
  );
  return (
    <section style={{ background: '#fff', padding: '90px 0' }}>
      <Container style={{ maxWidth: 720 }}>
        <div style={{ textAlign: 'center' }}>
          <SectionTitle size={40} style={{ justifyContent: 'center' }}>Fale com a FMP</SectionTitle>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 17, color: 'var(--fmp-ink-2)', margin: '16px auto 0', maxWidth: 480 }}>Dúvidas sobre cursos, matrículas ou visita à instituição? Deixe seus dados e retornamos o contato.</p>
        </div>
        {sent ? (
          <div style={{ textAlign: 'center', marginTop: 44, background: 'var(--fmp-cream)', borderRadius: 20, padding: '48px', border: '1px solid var(--fmp-line)' }}>
            <div style={{ width: 58, height: 58, borderRadius: 999, background: 'var(--fmp-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}><Icon name="check" size={30} color="#fff" stroke={2.6} /></div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 26, color: 'var(--fmp-black)', margin: 0 }}>Mensagem enviada!</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--fmp-ink-2)', marginTop: 8 }}>Em breve nossa equipe entra em contato.</p>
          </div>
        ) : (
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>{field('Nome completo', 'Seu nome')}{field('E-mail', 'voce@exemplo.com.br', 'email')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>{field('Cidade', 'Sua cidade')}{field('Telefone', '(51) 90000-0000')}</div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--fmp-ink-2)', marginBottom: 7 }}>Mensagem</label>
              <textarea placeholder="Sua mensagem" rows={4} style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-sans)', fontSize: 15, padding: '14px 16px', border: '1.5px solid var(--fmp-line-2)', borderRadius: 12, background: '#fff', color: 'var(--fmp-black)', outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}><Btn size="lg" onClick={() => setSent(true)}>Enviar mensagem</Btn></div>
          </div>
        )}
      </Container>
    </section>
  );
}

function Footer() {
  const cols = [
    ['Links Rápidos', ['Agenda de Eventos', 'Biblioteca', 'Canal de Denúncia', 'CPA', 'Editora', 'Ouvidoria', 'PDI FMP']],
    ['Ensino', ['Graduação', 'Especialização', 'Mestrado', 'Preparatório', 'Aperfeiçoamento']],
  ];
  return (
    <footer style={{ background: '#0D0B0C', color: 'var(--fmp-cream)', paddingTop: 72 }}>
      <Container>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.3fr', gap: 44, paddingBottom: 52 }}>
          <div>
            <Logo height={34} ground="dark" />
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--fmp-on-dark-2)', lineHeight: 1.6, marginTop: 20, maxWidth: 260 }}>A casa de quem faz Direito. Há mais de 40 anos no epicentro jurídico de Porto Alegre.</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
              {[
                ['linkedin', 'M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.5 8h4V24h-4zM8 8h3.8v2.2h.05c.53-1 1.83-2.2 3.77-2.2 4.03 0 4.78 2.65 4.78 6.1V24h-4v-6.9c0-1.65-.03-3.77-2.3-3.77-2.3 0-2.65 1.8-2.65 3.65V24H8z'],
                ['facebook', 'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z'],
                ['instagram', 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.38C1.35 2.68.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.12-1.38.66-.66 1.08-1.33 1.38-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.12A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z'],
                ['tiktok', 'M19.6 6.6a5.7 5.7 0 0 1-3.4-1.13A5.7 5.7 0 0 1 14 1h-3.3v13.6a2.87 2.87 0 1 1-2.05-2.75V8.45a6.17 6.17 0 1 0 5.35 6.11V8.3a9 9 0 0 0 5.6 1.92z'],
                ['youtube', 'M23.5 6.5a3 3 0 0 0-2.12-2.12C19.5 3.87 12 3.87 12 3.87s-7.5 0-9.38.51A3 3 0 0 0 .5 6.5 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.5 3 3 0 0 0 2.12 2.12c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3 3 0 0 0 2.12-2.12A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.5zM9.6 15.6V8.4l6.2 3.6z'],
                ['spotify', 'M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.5 17.32a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 1 1-.33-1.46c4.57-1.04 8.5-.59 11.66 1.34.35.22.46.68.25 1.03zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.23-1.98-8.15-2.56-11.97-1.4a.94.94 0 1 1-.54-1.8c4.36-1.32 9.78-.68 13.49 1.6.44.27.58.85.31 1.29zm.13-3.4C15.73 8.35 8.4 8.13 4.7 9.25a1.12 1.12 0 1 1-.65-2.15c4.25-1.29 12.35-1.04 16.57 1.46a1.13 1.13 0 0 1-1.15 1.94z'],
              ].map(([s, d]) => (
                <a key={s} href="#" aria-label={s} style={{ width: 38, height: 38, borderRadius: 999, border: '1px solid var(--fmp-dark-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fmp-cream)', transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--fmp-red)'; e.currentTarget.style.borderColor = 'var(--fmp-red)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--fmp-dark-line)'; e.currentTarget.style.color = 'var(--fmp-cream)'; }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
                </a>
              ))}
            </div>
          </div>
          {cols.map(([h, items]) => (
            <div key={h}>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--fmp-sand)', marginBottom: 16 }}>{h}</div>
              {items.map(it => (
                <a key={it} href="#" style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fmp-cream)', textDecoration: 'none', padding: '6px 0', opacity: .82 }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--fmp-red)'; e.currentTarget.style.opacity = 1; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--fmp-cream)'; e.currentTarget.style.opacity = .82; }}>{it}</a>
              ))}
            </div>
          ))}
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--fmp-sand)', marginBottom: 16 }}>Fale Conosco</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fmp-cream)' }}>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name="mail" size={16} color="var(--fmp-sand)" /> contato@fmp.com.br</span>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name="phone" size={16} color="var(--fmp-sand)" /> (51) 3027 6565</span>
              <span style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><Icon name="pin" size={16} color="var(--fmp-sand)" style={{ marginTop: 2, flex: 'none' }} /> Rua Cel. Genuíno, 421 · Centro Histórico<br/>Porto Alegre/RS · 90010-350</span>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--fmp-dark-line)', padding: '22px 0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--fmp-on-dark-2)' }}>Copyright © 2026 FMP · Fundação Escola Superior do Ministério Público · CNPJ 90.090.762/0001-19</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--fmp-on-dark-2)' }}><Sparkle size={13} /> Foco exclusivo em Direito</span>
        </div>
      </Container>
    </footer>
  );
}

Object.assign(window, { Testimonials, News, Contact, Footer });
