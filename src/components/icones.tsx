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

export const IconeSino = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z" />
    <path d="M10.3 18.5a2 2 0 0 0 3.4 0" />
  </svg>
);

export const IconeAdmin = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M4 20V9M10 20V4M16 20v-7M4 6.5h6M10 15.5h6M16 10.5h4" />
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

export const IconeFechar = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconeVoltar = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-4" />
  </svg>
);

/** Três pontos na vertical: o menu de tudo o mais que a linha faz. */
export const IconeMenuLinha = ({ className }: Props) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const IconeLixeira = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M4 7h16M10 4h4M9 7v12M15 7v12" />
    <path d="M6 7l1 13.5h10L18 7" />
  </svg>
);

export const IconeCopiar = ({ className }: Props) => (
  <svg {...base} className={className}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h8" />
  </svg>
);

/** Divisão entre setores: uma barra que se reparte. */
export const IconeRateio = ({ className }: Props) => (
  <svg {...base} className={className}>
    <rect x="3" y="9" width="18" height="6" rx="1.6" />
    <path d="M11 9v6" />
  </svg>
);

/** Âncora: a fatia que absorve o restante e faz a soma fechar. */
export const IconeAncora = ({ className }: Props) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="5" r="2.2" />
    <path d="M12 7.2V20" />
    <path d="M5 13a7 7 0 0 0 14 0" />
    <path d="M8 10H5v3M16 10h3v3" />
  </svg>
);

export const IconeHistorico = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M3.5 9a9 9 0 1 1 .8 5" />
    <path d="M3 4.5V9h4.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

/** Encerrar: o custo para de correr, mas o histórico permanece. */
export const IconeEncerrar = ({ className }: Props) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9.5h6v5H9z" />
  </svg>
);

export const IconeRestaurar = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M20.5 9a9 9 0 1 0-.8 5" />
    <path d="M21 4.5V9h-4.5" />
  </svg>
);

/** Filtro: a lista deixa de ser tudo e passa a ser uma pergunta. */
export const IconeFiltro = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M3.5 5h17l-6.5 7.5V19l-4 2v-8.5z" />
  </svg>
);

export const IconeChave = ({ className }: Props) => (
  <svg {...base} className={className}>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="m10.7 12.3 9.3-9.3" />
    <path d="m15.5 7.5 3 3 2.5-2.5-3-3" />
  </svg>
);

export const IconeSair = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/** A casa inteira — usado no atalho que divide um custo entre todos os setores. */
export const IconePredio = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M3 21h18" />
    <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
    <path d="M15 21v-9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v9" />
    <path d="M9 7h2M9 11h2M9 15h2" />
  </svg>
);
