// FMP Home (reference recreation of fmp.edu.br) — shared primitives.
// Self-contained; tokens from colors_and_type.css. Exports to window.
const A = '../../assets';

const Sparkle = ({ size = 20, variant = 'red', style = {} }) => {
  const src = variant === 'black' ? A + '/symbol-black.png' : A + '/symbol-red.png';
  const filter = variant === 'white' ? 'brightness(0) invert(1)' : 'none';
  return <img src={src} alt="" aria-hidden="true" style={{ width: size, height: size, objectFit: 'contain', filter, ...style }} />;
};

// Logo: dark grounds/photos → primary (white wordmark + red symbol); light → red
const Logo = ({ height = 34, ground = 'dark', style = {} }) => {
  const src = ground === 'light' ? A + '/logo-red.png' : A + '/logo-primary.png';
  return <img src={src} alt="FMP — Fundação Escola Superior do Ministério Público" style={{ height, width: 'auto', display: 'block', ...style }} />;
};

const Icon = ({ name, size = 20, color = 'currentColor', stroke = 1.75, style = {} }) => {
  const p = {
    arrow: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    chevronR: <polyline points="9 18 15 12 9 6"/>,
    chevronL: <polyline points="15 18 9 12 15 6"/>,
    search: <><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    menu: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>,
    pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
    play: <polygon points="6 4 20 12 6 20 6 4"/>,
    arrowUpRight: <><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">{p[name]}</svg>;
};

const Btn = ({ children, variant = 'primary', size = 'md', onClick, style = {}, icon = 'arrow' }) => {
  const [h, setH] = React.useState(false);
  const pad = size === 'lg' ? '16px 32px' : size === 'sm' ? '10px 20px' : '13px 26px';
  const fs = size === 'lg' ? 16 : size === 'sm' ? 13.5 : 15;
  let s = { fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: fs, border: 0, cursor: 'pointer', borderRadius: 999, padding: pad, transition: 'all .2s var(--ease)', display: 'inline-flex', alignItems: 'center', gap: 9, lineHeight: 1, ...style };
  if (variant === 'primary') { s.background = h ? 'var(--fmp-red-600)' : 'var(--fmp-red)'; s.color = '#fff'; s.transform = h ? 'translateY(-1px)' : 'none'; }
  else if (variant === 'dark') { s.background = h ? '#000' : 'var(--fmp-black)'; s.color = '#fff'; }
  else if (variant === 'ghost-light') { s.background = h ? 'rgba(239,238,234,.1)' : 'transparent'; s.color = '#EFEEEA'; s.border = '1.5px solid rgba(239,238,234,.5)'; }
  else { s.background = h ? 'rgba(25,24,24,.05)' : 'transparent'; s.color = 'var(--fmp-black)'; s.border = '1.5px solid var(--fmp-black)'; }
  return <button style={s} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>{children}{icon && <Icon name={icon} size={fs + 2} color={s.color} />}</button>;
};

const Eyebrow = ({ children, dark = false, style = {} }) => (
  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.16em', color: dark ? 'var(--fmp-sand)' : 'var(--fmp-red)', ...style }}>{children}</span>
);

// Section heading in the FMP red serif-italic voice, with a sparkle closing the title
const SectionTitle = ({ children, closeMark = true, color = 'var(--fmp-red)', size = 42, style = {} }) => (
  <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: size, lineHeight: 1.05, color, margin: 0, display: 'inline-flex', alignItems: 'flex-start', gap: 12, ...style }}>
    <span>{children}</span>{closeMark && <Sparkle size={size * 0.42} style={{ marginTop: size * 0.08 }} />}
  </h2>
);

const Container = ({ children, style = {} }) => (
  <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 48px', ...style }}>{children}</div>
);

Object.assign(window, { Sparkle, Logo, Icon, Btn, Eyebrow, SectionTitle, Container, ASSETS: A });
