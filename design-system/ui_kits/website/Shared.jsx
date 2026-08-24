// FMP Website UI Kit — shared primitives
// Exposes Sparkle, Logo, Button, Pill, Eyebrow, Seal, Icon to window.

// The FMP sparkle — uses the supplied brand PNG (never redrawn).
// variant: 'red' | 'black' | 'white'
const Sparkle = ({ size = 20, variant = 'red', style = {} }) => {
  const src = variant === 'black' ? '../../assets/symbol-black.png' : '../../assets/symbol-red.png';
  const filter = variant === 'white' ? 'brightness(0) invert(1)' : 'none';
  return <img src={src} alt="" aria-hidden="true" style={{ width: size, height: size, objectFit: 'contain', filter, ...style }} />;
};

const Logo = ({ variant = 'red', height = 34 }) => {
  const src = variant === 'white'
    ? '../../assets/logo-primary.png'
    : variant === 'black'
    ? '../../assets/logo-black.png'
    : '../../assets/logo-red.png';
  return <img src={src} alt="FMP" style={{ height, width: 'auto', display: 'block' }} />;
};

const LogoLockup = ({ variant = 'red', height = 30, divider = true }) => {
  const ink = variant === 'white' ? '#EFEEEA' : '#191818';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Logo variant={variant} height={height} />
      <div style={{
        fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 8.5, lineHeight: 1.18,
        letterSpacing: '.04em', textTransform: 'uppercase', color: ink,
        borderLeft: divider ? `1px solid ${variant === 'white' ? 'rgba(239,238,234,.3)' : 'var(--fmp-line-2)'}` : 'none',
        paddingLeft: divider ? 11 : 0,
      }}>
        Fundação<br />Escola Superior<br />do Ministério<br />Público
      </div>
    </div>
  );
};

const Eyebrow = ({ children, dark = false, style = {} }) => (
  <span style={{
    fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12,
    textTransform: 'uppercase', letterSpacing: '.16em',
    color: dark ? 'var(--fmp-sand)' : 'var(--fmp-red)', ...style,
  }}>{children}</span>
);

const Button = ({ children, variant = 'primary', size = 'md', onClick, dark = false, style = {} }) => {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const pad = size === 'lg' ? '15px 30px' : size === 'sm' ? '9px 18px' : '13px 26px';
  const fs = size === 'lg' ? 16 : size === 'sm' ? 13 : 14.5;
  let s = {
    fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: fs, border: 0,
    cursor: 'pointer', borderRadius: 999, padding: pad, transition: 'all .22s var(--ease)',
    display: 'inline-flex', alignItems: 'center', gap: 9, lineHeight: 1, ...style,
  };
  if (variant === 'primary') {
    s.background = press ? 'var(--fmp-red-700)' : hover ? 'var(--fmp-red-600)' : 'var(--fmp-red)';
    s.color = '#fff';
    s.boxShadow = 'none';
  } else if (variant === 'black') {
    s.background = press ? 'var(--fmp-red)' : hover ? 'var(--fmp-red-600)' : 'var(--fmp-black)';
    s.color = '#fff';
    s.boxShadow = 'none';
  } else if (variant === 'ghost') {
    s.background = hover ? (dark ? 'rgba(239,238,234,.08)' : 'rgba(25,24,24,.06)') : 'transparent';
    s.color = dark ? '#EFEEEA' : 'var(--fmp-black)';
    s.border = `1.5px solid ${dark ? 'rgba(239,238,234,.55)' : 'var(--fmp-black)'}`;
    s.boxShadow = 'none';
  } else {
    s.background = 'transparent'; s.padding = '8px 4px'; s.color = hover ? 'var(--fmp-red)' : (dark ? '#EFEEEA' : 'var(--fmp-black)');
    s.textDecoration = 'underline'; s.textDecorationColor = 'var(--fmp-red)';
    s.textUnderlineOffset = '3px'; s.textDecorationThickness = '1.5px';
  }
  return (
    <button style={s} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}>
      {children}
    </button>
  );
};

const Pill = ({ children, variant = 'out-dark', style = {} }) => {
  const map = {
    'out-dark': { border: '1.5px solid var(--fmp-black)', color: 'var(--fmp-black)' },
    'out-red': { border: '1.5px solid var(--fmp-red)', color: 'var(--fmp-red)' },
    'out-light': { border: '1.5px solid rgba(239,238,234,.55)', color: '#EFEEEA' },
    'solid': { background: 'var(--fmp-red)', color: '#fff' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 999,
      padding: '8px 18px', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap',
      fontFamily: 'var(--font-display)', fontStyle: 'italic', ...map[variant], ...style,
    }}>{children}</span>
  );
};

const Seal = ({ top, big, sub, size = 96, dark = false, ink: inkOverride }) => {
  const ink = inkOverride || (dark ? '#BFBAA4' : '#191818');
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', border: `2px solid ${ink}`,
    }}>
      <div style={{ position: 'absolute', inset: 5, border: `1px dashed ${inkOverride ? inkOverride : (dark ? 'rgba(191,186,164,.45)' : 'rgba(25,24,24,.4)')}`, borderRadius: '50%', opacity: inkOverride ? 0.6 : 1 }} />
      {top && <div style={{ fontSize: size * 0.085, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: ink, opacity: .85, lineHeight: 1.2 }}>{top}</div>}
      {big && <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: size * 0.24, color: ink, lineHeight: 1 }}>{big}</div>}
      {sub && <div style={{ fontSize: size * 0.085, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: ink, opacity: .85, marginTop: 2, lineHeight: 1.2 }}>{sub}</div>}
    </div>
  );
};

// Minimal inline icons (monoline, 1.75px, rounded) — Lucide-style
const Icon = ({ name, size = 20, color = 'currentColor', stroke = 1.75 }) => {
  const paths = {
    arrow: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
    menu: <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>,
    close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></>,
    pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    cap: <><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    chevron: <polyline points="9 18 15 12 9 6" />,
    play: <polygon points="6 4 20 12 6 20 6 4" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

Object.assign(window, { Sparkle, Logo, LogoLockup, Eyebrow, Button, Pill, Seal, Icon });
