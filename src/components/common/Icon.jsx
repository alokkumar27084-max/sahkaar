import React from "react";

function Svg({ className = "w-5 h-5", viewBox = "0 0 24 24", children }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const ICONS = {
  location: (className) => (
    <Svg className={className}>
      <path d="M12 21c4-4.5 6-7.5 6-10a6 6 0 1 0-12 0c0 2.5 2 5.5 6 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </Svg>
  ),
  search: (className) => (
    <Svg className={className}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  ),
  warning: (className) => (
    <Svg className={className}>
      <path d="M12 3 2.8 19h18.4L12 3Z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
    </Svg>
  ),
  message: (className) => (
    <Svg className={className}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-5 4v-3.7A2.5 2.5 0 0 1 4 13.5v-7Z" />
    </Svg>
  ),
  shield: (className) => (
    <Svg className={className}>
      <path d="M12 3 5.5 6v5.8c0 4.2 2.6 7.3 6.5 9.2 3.9-1.9 6.5-5 6.5-9.2V6L12 3Z" />
      <path d="m9.2 12.3 1.8 1.8 3.8-3.8" />
    </Svg>
  ),
  zap: (className) => (
    <Svg className={className}>
      <path d="M13.5 2 6 13h4l-1.5 9L18 10h-4l-.5-8Z" />
    </Svg>
  ),
  worker: (className) => (
    <Svg className={className}>
      <path d="M6 10h12v2H6z" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" />
      <circle cx="12" cy="14.5" r="2.5" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </Svg>
  ),
  view: (className) => (
    <Svg className={className}>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.6" />
    </Svg>
  ),
  rating: (className) => (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L3 9.4l6.2-.9L12 2.8Z" />
    </svg>
  ),
  review: (className) => (
    <Svg className={className}>
      <path d="M5 4h14v12H9l-4 4V4Z" />
      <path d="M9 8h6M9 12h4" />
    </Svg>
  ),
  user: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Svg>
  ),
  link: (className) => (
    <Svg className={className}>
      <path d="M10 14 8 16a3 3 0 1 1-4.2-4.2l2-2A3 3 0 0 1 10 9" />
      <path d="M14 10 16 8a3 3 0 1 1 4.2 4.2l-2 2A3 3 0 0 1 14 15" />
      <path d="m9 15 6-6" />
    </Svg>
  ),
  camera: (className) => (
    <Svg className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7l1.2-2h3.6L15 7" />
      <circle cx="12" cy="13.5" r="3.2" />
    </Svg>
  ),
  "id-card": (className) => (
    <Svg className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="11" r="1.8" />
      <path d="M6.5 15a3 3 0 0 1 4 0M13 10h5M13 13h5" />
    </Svg>
  ),
  bulb: (className) => (
    <Svg className={className}>
      <path d="M12 3a6 6 0 0 0-3.8 10.6c.8.7 1.3 1.6 1.3 2.6V17h5v-.8c0-1 .5-2 1.3-2.6A6 6 0 0 0 12 3Z" />
      <path d="M9.5 20h5M10.5 17h3" />
    </Svg>
  ),
  check: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.2 2.2 2.2 4.8-4.8" />
    </Svg>
  ),
  pending: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  ),
  trophy: (className) => (
    <Svg className={className}>
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5a2 2 0 0 0 2 3M16 6h3a2 2 0 0 1-2 3" />
      <path d="M12 11v4M9 19h6" />
    </Svg>
  ),
  team: (className) => (
    <Svg className={className}>
      <circle cx="9" cy="9" r="2.2" />
      <circle cx="15" cy="9" r="2.2" />
      <path d="M4.5 19a4.5 4.5 0 0 1 9 0M10.5 19a4.5 4.5 0 0 1 9 0" />
    </Svg>
  ),
  compass: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m10 14 1.2-4.2L15.5 8l-1.8 4.2L10 14Z" />
    </Svg>
  ),
  construction: (className) => (
    <Svg className={className}>
      <path d="M3 21h18M5 21V10l7-5 7 5v11" />
      <path d="M9 21v-6a3 3 0 0 1 6 0v6" />
      <path d="M12 2v3M8 3.5l1.5 1.5M16 3.5 14.5 5" />
    </Svg>
  ),
  shuttering: (className) => (
    <Svg className={className}>
      <path d="M3 6h18M3 10h18M6 10v11M18 10v11" />
      <path d="M12 10v11M10 6h4M3 6v4M21 6v4" />
    </Svg>
  ),
  electrical: (className) => (
    <Svg className={className}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8Z" />
    </Svg>
  ),
  plumbing: (className) => (
    <Svg className={className}>
      <path d="M9 22V8h4v14M13 8h5a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-5" />
      <path d="M12 4v4M18 14l3 3m-3-3 3-3" />
    </Svg>
  ),
  painting: (className) => (
    <Svg className={className}>
      <rect x="4" y="3" width="12" height="6" rx="1.5" />
      <path d="M16 6h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-6v7" />
      <path d="M6 9v9a2 2 0 0 0 2 2h4" />
    </Svg>
  ),
  carpentry: (className) => (
    <Svg className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </Svg>
  ),
  farming: (className) => (
    <Svg className={className}>
      <path d="M6 18c0-4.5 3.5-8 8-8 1.8 0 3.5.6 4.8 1.6" />
      <path d="M14 10l-4 4-2-2-4 4" />
      <path d="M10 14v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />
    </Svg>
  ),
  transport: (className) => (
    <Svg className={className}>
      <rect x="2" y="8" width="11" height="8" rx="1" />
      <path d="M13 13h4v3" />
      <circle cx="5" cy="18" r="2.5" />
      <circle cx="10" cy="18" r="2.5" />
      <circle cx="18" cy="16" r="3.5" />
      <path d="M18 6h-3v6h5V8a2 2 0 0 0-2-2Z" />
    </Svg>
  ),
  fabrication: (className) => (
    <Svg className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 3v18M3 12h18M3 6h18M3 18h18M6 3v18M18 3v18" />
    </Svg>
  ),
  catering: (className) => (
    <Svg className={className}>
      <path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6Z" />
      <path d="M2 10h20M12 6V3M9 3h6" />
      <path d="M18 6l3-3" />
    </Svg>
  ),
  tent: (className) => (
    <Svg className={className}>
      <path d="M3 21V9l9-6 9 6v12M3 9h18M12 3v18" />
      <path d="M8 9c0 2-2 3-4 3m14-3c0 2 2 3 4 3" />
    </Svg>
  ),
  labour: (className) => (
    <Svg className={className}>
      <circle cx="8" cy="7" r="2.5" />
      <path d="M3 16a3 3 0 0 1 6 0v3" />
      <circle cx="16" cy="7" r="2.5" />
      <path d="M11 16a3 3 0 0 1 6 0v3" />
      <path d="M6 21h12" />
    </Svg>
  ),
  ac: (className) => (
    <Svg className={className}>
      <rect x="3" y="5" width="18" height="10" rx="1.5" />
      <path d="M6 9h12M6 11h12M9 15c-.5 1-1.5 2-3 2M15 15c-.5 1-1.5 2-3 2" />
    </Svg>
  ),
  mason: (className) => (
    <Svg className={className}>
      <path d="M3 21h18M5 18l-2 3M8 18l-2 3M11 18l-2 3M14 18l-2 3M17 18l-2 3M20 18l-2 3" />
      <path d="M2 14h20v4H2z" />
      <path d="M3 10h18v4H3z" />
      <path d="M12 2l-3 5h6l-3-5z" />
    </Svg>
  ),
  helper: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="6" r="3" />
      <path d="M5 10a2 2 0 0 0-2 2v8h14v-8a2 2 0 0 0-2-2h-2M9 18v3M12 18v3M15 18v3" />
    </Svg>
  ),
  tractor: (className) => (
    <Svg className={className}>
      <circle cx="5" cy="16" r="4" />
      <circle cx="19" cy="16" r="3" />
      <rect x="8" y="6" width="6" height="8" />
      <path d="M8 6L6 4h-2v2M14 10h6v6h-3" />
    </Svg>
  ),
  plumber: (className) => (
    <Svg className={className}>
      <path d="M8 3v6a3 3 0 0 1 6 0v10M8 9h6M8 15h8M5 21h14" />
      <circle cx="8" cy="9" r="1.5" />
      <circle cx="14" cy="9" r="1.5" />
    </Svg>
  ),
  electrician: (className) => (
    <Svg className={className}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8Z" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </Svg>
  ),
  ro: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M8 12h8" />
      <path d="M7 5l-2-2M17 5l2-2M7 19l-2 2M17 19l2 2" />
    </Svg>
  ),
  washing: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" />
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 9v6M9 12h6" />
    </Svg>
  ),
  fridge: (className) => (
    <Svg className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 12h18M9 3v18M15 3v18" />
      <circle cx="7" cy="6" r="1" fill="currentColor" />
      <circle cx="17" cy="6" r="1" fill="currentColor" />
      <circle cx="7" cy="16" r="1" fill="currentColor" />
      <circle cx="17" cy="16" r="1" fill="currentColor" />
    </Svg>
  ),
  pest: (className) => (
    <Svg className={className}>
      <path d="M12 3c1 0 2 .5 2.5 1.5M12 3a3 3 0 0 0-2.5 1.5" />
      <circle cx="12" cy="14" r="4" />
      <path d="M8 10l-2-3M16 10l2-3M8 18l-1 3M16 18l1 3" />
    </Svg>
  ),
  drain: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M8 12h8" />
      <path d="M6 3v2M18 3v2M3 6h18" />
      <circle cx="12" cy="20" r="1.5" fill="currentColor" />
    </Svg>
  ),
  cook: (className) => (
    <Svg className={className}>
      <path d="M4 10h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8Z" />
      <path d="M2 10h20M12 6V3M9 3h6M7 10l3-3M13 10l-3-3" />
    </Svg>
  ),
  mechanic: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M8 12h8" />
      <path d="M15 6l3-3M9 6l-3-3M15 18l3 3M9 18l-3 3" />
    </Svg>
  ),
  puncture: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 6v12M6 12h12" />
      <path d="M15 9l2-2M9 15l-2 2" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </Svg>
  ),
  salon: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="8" r="3" />
      <path d="M9 12s0 3 3 3 3-3 3-3M7 21h10M12 11v10M9 21l-1-4M15 21l1-4" />
    </Svg>
  ),
  guard: (className) => (
    <Svg className={className}>
      <path d="M12 2L4 6v6c0 6 8 8 8 8s8-2 8-8V6l-8-4Z" />
      <circle cx="12" cy="8" r="2" fill="currentColor" />
      <circle cx="10" cy="13" r="1.5" fill="currentColor" />
      <circle cx="14" cy="13" r="1.5" fill="currentColor" />
    </Svg>
  ),
  key: (className) => (
    <Svg className={className}>
      <circle cx="9" cy="12" r="3" />
      <path d="M12 12h8M19 9v6" />
      <path d="M8 9l-1-2M8 15l-1 2" />
    </Svg>
  ),
  tank: (className) => (
    <Svg className={className}>
      <path d="M3 6h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />
      <path d="M8 3h8M7 6h10M12 6v12" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </Svg>
  ),
  tailor: (className) => (
    <Svg className={className}>
      <path d="M3 9h18M5 12l2-2M9 12l2-2M13 12l2-2M17 12l2-2M3 16h18" />
      <circle cx="12" cy="4" r="2" />
      <path d="M10 7l-4 2h8l-4-2" />
    </Svg>
  ),
  default: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
    </Svg>
  )
};

export default function Icon({ name, className = "w-5 h-5" }) {
  const renderIcon = ICONS[name] || ICONS.default;
  return renderIcon(className);
}
