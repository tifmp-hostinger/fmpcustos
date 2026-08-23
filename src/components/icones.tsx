/**
 * Ícones da interface — traço 1.6, herdam a cor do texto.
 * Inline para não adicionar dependência; aria-hidden porque sempre acompanham rótulo.
 */

type Props = { className?: string };

const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const IconePainel = ({ className }: Props) => (
  <svg {...base} className={className}>
    <rect x="3" y="3" width="7.5" height="9" rx="1.5" />
    <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5" />
    <rect x="13.5" y="12" width="7.5" height="9" rx="1.5" />
    <rect x="3" y="15.5" width="7.5" height="5.5" rx="1.5" />
  </svg>
);

export const IconeCustos = ({ className }: Props) => (
  <svg {...base} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
    <path d="M7 15h4" />
  </svg>
);

export const IconeUsuarios = ({ className }: Props) => (
  <svg {...base} className={className}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M15.5 14.7c2.8.2 5 2 5 4.8" />
  </svg>
);

export const IconeMais = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconeCalendario = ({ className }: Props) => (
  <svg {...base} className={className}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

export const IconeAlerta = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M12 4 2.8 20h18.4L12 4Z" />
    <path d="M12 10v4.5" />
    <path d="M12 17.5v.5" />
  </svg>
);

export const IconeCheck = ({ className }: Props) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.4 2.4 4.6-5.3" />
  </svg>
);

export const IconeBusca = ({ className }: Props) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const IconeSeta = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconeOlhoAberto = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconeEditar = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    <path d="m14.5 7.5 3 3" />
  </svg>
);
