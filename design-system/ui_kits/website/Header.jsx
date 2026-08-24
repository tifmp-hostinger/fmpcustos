// FMP Website — Header (sticky nav) + mobile menu
const Header = ({ onCTA }) => {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const root = document.querySelector('#scroll-root') || window;
    const el = document.querySelector('#scroll-root');
    const handler = () => setScrolled((el ? el.scrollTop : window.scrollY) > 20);
    root.addEventListener('scroll', handler);
    return () => root.removeEventListener('scroll', handler);
  }, []);
  const links = ['Graduação', 'Especializações', 'Pesquisa', 'A FMP', 'Blog'];
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'rgba(239,238,234,0.86)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--fmp-line)' : '1px solid transparent',
      transition: 'all .3s var(--ease)',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <LogoLockup variant="red" height={30} />
        <nav style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          {links.map((l, i) => (
            <a key={l} href="#" style={{
              fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 500,
              color: i === 0 ? 'var(--fmp-red)' : 'var(--fmp-black)', textDecoration: 'none',
              transition: 'color .2s',
            }} onMouseEnter={e => e.target.style.color = 'var(--fmp-red)'}
               onMouseLeave={e => e.target.style.color = i === 0 ? 'var(--fmp-red)' : 'var(--fmp-black)'}>{l}</a>
          ))}
          <Button size="sm" onClick={onCTA}>Inscreva-se <Icon name="arrow" size={16} color="#fff" /></Button>
        </nav>
      </div>
    </header>
  );
};
Object.assign(window, { Header });
